"use client";

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { 
  JIKUNA_SWAP_ABI, 
  JIKUNA_SWAP_ADDRESS, 
  JIKUNA_SWAP_ETH_ABI, 
  JIKUNA_SWAP_ETH_ADDRESS,
  TOKEN_ADDRESSES
} from '@/config/contracts';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Address, parseUnits, formatUnits } from 'viem';
import { readContract, waitForTransaction, writeContract } from '@wagmi/core';
import { getConfig } from '@/lib/wagmi';
import { useJikunaXPUpdate } from './useJikunaXPUpdate';

// ERC20 standard ABI untuk interaksi token
const erc20Abi = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  }
] as const;

type SwapParams = {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  minAmountOut: string;
  path?: Address[];
  deadline?: bigint;
  useNative?: boolean;
  slippage?: number; // dalam persentase, misalnya 0.5 untuk 0.5%
};

// Tipe untuk cache getAmountOut
type AmountOutCache = {
  [key: string]: {
    amount: string;
    timestamp: number;
  };
};

export function useJikunaSwap() {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const config = getConfig();
  const { updateJXP } = useJikunaXPUpdate();
  
  // Log error jika config tidak tersedia
  useEffect(() => {
    if (!config) {
      console.error('Wagmi config tidak tersedia di useJikunaSwap');
    }
  }, [config]);
  
  // Cache untuk hasil getAmountOut, berlaku 30 detik
  const amountOutCacheRef = useRef<AmountOutCache>({});
  const CACHE_EXPIRY = 30000; // 30 detik untuk mengurangi panggilan RPC

  // Fungsi helper untuk melakukan approval dan swap dalam satu langkah
  const approveAndSwap = useCallback(async (
    token: Address,
    amount: bigint,
    routerAddress: Address,
    swapFunction: () => Promise<Address>
  ): Promise<Address> => {
    if (!address) throw new Error('Wallet tidak terhubung');
    if (!config) throw new Error('Wagmi config tidak tersedia');

    try {
      console.log(`🔄 Memeriksa approval untuk token: ${token}`);

      // Cek allowance terlebih dahulu
      const allowance = await readContract(config, {
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, routerAddress],
      }) as bigint;

      // Jika sudah cukup, langsung swap
      if (allowance >= amount) {
        console.log('✅ Allowance sudah cukup, langsung swap');
        return await swapFunction();
      }

      // Jika allowance tidak cukup, lakukan approve dengan max uint256
      console.log('⚠️ Allowance tidak cukup, melakukan approve terlebih dahulu');
      const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
      
      // Panggil approve
      const approveHash = await writeContractAsync({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [routerAddress, MAX_UINT256],
        gas: BigInt(200000),
      });

      console.log('⏳ Menunggu approve selesai:', approveHash);
      const approveReceipt = await waitForTransaction(config, { hash: approveHash });
      
      if (approveReceipt.status !== 'success') {
        throw new Error('Token approval gagal');
      }
      
      console.log('✅ Approve berhasil, melakukan swap');
      return await swapFunction();
    } catch (error) {
      console.error('❌ Error dalam approve atau swap:', error);
      throw error;
    }
  }, [address, config, writeContractAsync]);

  // Fungsi untuk menghitung JXP berdasarkan jumlah swap
  const calculateJXP = useCallback((amountIn: string): bigint => {
    if (!amountIn || parseFloat(amountIn) === 0) return BigInt(0);
    
    try {
      // Konversi ke bigint untuk konsistensi dengan sistem lain
      const amountBigInt = parseUnits(amountIn, 18);
      
      // 1 point per 0.1 token swapped (min 1 point)
      let pointsToAdd = amountBigInt / BigInt(10);
      if (pointsToAdd < BigInt(1)) pointsToAdd = BigInt(1);
      
      return pointsToAdd;
    } catch (error) {
      console.error('Error calculating JXP:', error);
      return BigInt(1); // Default minimum point
    }
  }, []);

  // Mendapatkan estimasi output token dengan caching yang lebih efisien
  const getAmountOut = useCallback(
    async (tokenIn: Address, tokenOut: Address, amountIn: string, decimalsIn: number = 18) => {
      if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) === 0) {
        return '0';
      }
      
      if (!config) {
        console.error('Wagmi config is undefined in getAmountOut');
        return getAmountOutFallback(tokenIn, tokenOut, amountIn);
      }
      
      try {
        // Validasi untuk mencegah error UniswapV2Library
        if (tokenIn === tokenOut) {
          console.error('Error: TokenIn dan TokenOut tidak boleh sama');
          return '0';
        }

        // Jika tokenIn adalah alamat zero, gunakan WMON sebagai pengganti untuk perhitungan
        let actualTokenIn = tokenIn;
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
        if (tokenIn === ZERO_ADDRESS) {
          actualTokenIn = TOKEN_ADDRESSES.WMON;
        }

        // Jika tokenOut adalah alamat zero, gunakan WMON sebagai pengganti untuk perhitungan
        let actualTokenOut = tokenOut;
        if (tokenOut === ZERO_ADDRESS) {
          actualTokenOut = TOKEN_ADDRESSES.WMON;
        }

        // Buat cache key dari parameter asli (bukan actual) agar tetap konsisten
        const cacheKey = `${tokenIn}-${tokenOut}-${amountIn}-${decimalsIn}`;
        const now = Date.now();
        
        // Cek apakah hasil ada di cache dan masih valid
        if (
          amountOutCacheRef.current[cacheKey] && 
          now - amountOutCacheRef.current[cacheKey].timestamp < CACHE_EXPIRY
        ) {
          return amountOutCacheRef.current[cacheKey].amount;
        }
        
        // Konversi input sesuai dengan decimals token
        const amountInWei = parseUnits(amountIn, decimalsIn);
        
        // Fallback rate untuk pasangan yang sering digunakan
        if (actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() &&
            (actualTokenIn.toLowerCase() === TOKEN_ADDRESSES.WMON.toLowerCase())) {
          
          // Memastikan UI tetap responsif dengan rate fallback jika RPC lambat
          const fallbackRate = "1.5";
          
          // Simpan di cache
          amountOutCacheRef.current[cacheKey] = {
            amount: fallbackRate,
            timestamp: now - CACHE_EXPIRY + 5000 // Hanya berlaku 5 detik untuk fallback
          };
        }
        
        // Fallback khusus untuk USDT/aprMON
        if ((actualTokenIn.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase() && 
             actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.aprMON.toLowerCase()) ||
            (actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase() && 
             actualTokenIn.toLowerCase() === TOKEN_ADDRESSES.aprMON.toLowerCase())) {
          
          // Tetapkan rate berdasarkan arah swap
          let fallbackRate;
          if (actualTokenIn.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()) {
            // USDT -> aprMON (1 USDT = 0.36 aprMON karena aprMON adalah LST dari MON)
            fallbackRate = (parseFloat(amountIn) * 0.36).toString();
          } else {
            // aprMON -> USDT (1 aprMON = 2.77 USDT)
            fallbackRate = (parseFloat(amountIn) * 2.77).toString();
          }
          
          // Simpan di cache
          amountOutCacheRef.current[cacheKey] = {
            amount: fallbackRate,
            timestamp: now - CACHE_EXPIRY + 5000 // Hanya berlaku 5 detik untuk fallback
          };
        }
        
        // Single attempt tanpa retry untuk mengurangi panggilan RPC
        try {
          // Selalu gunakan fallback untuk USDT/aprMON (prioritaskan konsistensi)
          if ((actualTokenIn.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase() && 
               actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.aprMON.toLowerCase()) ||
              (actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase() && 
               actualTokenIn.toLowerCase() === TOKEN_ADDRESSES.aprMON.toLowerCase())) {
            // Gunakan nilai yang sudah di-cache dari fallback di atas
            if (amountOutCacheRef.current[cacheKey]) {
              return amountOutCacheRef.current[cacheKey].amount;
            }
          }
          
          // Buat fungsi dengan timeout untuk readContract
          const readContractWithTimeout = async () => {
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(() => {
                reject(new Error('RPC request timeout'));
              }, 5000); // 5 detik timeout
            });
            
            const readPromise = readContract(config, {
              address: JIKUNA_SWAP_ADDRESS,
              abi: JIKUNA_SWAP_ABI,
              functionName: 'getAmountsOut',
              args: [amountInWei, [actualTokenIn, actualTokenOut]],
            });
            
            return Promise.race([readPromise, timeoutPromise]);
          };
          
          // Gunakan getAmountsOut dengan path [tokenIn, tokenOut] (sesuai Uniswap V2)
          // Pastikan kita menggunakan actualToken yang sudah divalidasi
          const result = await readContractWithTimeout();
          
          // Jika result adalah null karena timeout
          if (!result) {
            // Gunakan cache jika ada
            if (amountOutCacheRef.current[cacheKey]) {
              return amountOutCacheRef.current[cacheKey].amount;
            }
            // Gunakan fallback jika tidak ada cache
            return getAmountOutFallback(actualTokenIn, actualTokenOut, amountIn);
          }

          // getAmountsOut mengembalikan array, kita ambil elemen terakhir (output amount)
          const amounts = result as bigint[];
          if (amounts.length < 2) {
            // Jika hasil tidak valid, gunakan nilai dari cache jika ada
            if (amountOutCacheRef.current[cacheKey]) {
              return amountOutCacheRef.current[cacheKey].amount;
            }
            return '0';
          }
          
          // Tentukan decimals untuk token output
          let decimalsOut = 18; // Default
          
          // Periksa decimals berdasarkan alamat token (lebih andal)
          if (
            actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() || 
            actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()
          ) {
            decimalsOut = 6;
          } else if (actualTokenOut.toLowerCase() === TOKEN_ADDRESSES.WBTC.toLowerCase()) {
            decimalsOut = 8;
          }
          
          const outputAmount = formatUnits(amounts[1], decimalsOut);
          
          // Simpan di cache
          amountOutCacheRef.current[cacheKey] = {
            amount: outputAmount,
            timestamp: now
          };
          
          return outputAmount;
        } catch (error) {
          // Cek apakah error adalah timeout
          const isTimeout = error instanceof Error && error.message === 'RPC request timeout';
          if (isTimeout) {
            console.warn('RPC request timeout, using fallback or cache');
          } else {
            console.error('Error fetching amount out:', error);
          }
          
          // Gunakan cache jika ada
          if (amountOutCacheRef.current[cacheKey]) {
            return amountOutCacheRef.current[cacheKey].amount;
          }
          
          // Gunakan fallback untuk pasangan populer
          return getAmountOutFallback(actualTokenIn, actualTokenOut, amountIn);
        }
      } catch (error) {
        console.error('Error in getAmountOut:', error);
        return getAmountOutFallback(tokenIn, tokenOut, amountIn);
      }
    },
    [config]
  );

  // Fungsi fallback untuk mendapatkan nilai perkiraan
  const getAmountOutFallback = (tokenIn: Address, tokenOut: Address, amountIn: string): string => {
    // Fallback khusus untuk MON->USDC
    if (tokenOut.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() &&
        (tokenIn.toLowerCase() === TOKEN_ADDRESSES.WMON.toLowerCase())) {
      return (parseFloat(amountIn) * 1.5).toString();
    }
    
    // Fallback untuk USDT/aprMON
    if (tokenIn.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase() && 
        tokenOut.toLowerCase() === TOKEN_ADDRESSES.aprMON.toLowerCase()) {
      return (parseFloat(amountIn) * 0.36).toString();
    }
    
    if (tokenIn.toLowerCase() === TOKEN_ADDRESSES.aprMON.toLowerCase() && 
        tokenOut.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()) {
      return (parseFloat(amountIn) * 2.77).toString();
    }
    
    // Default fallback (1:1)
    return amountIn;
  };

  // Melakukan swap native (MON) ke token
  const swapExactNativeForTokens = useCallback(
    async ({ tokenOut, amountIn, minAmountOut, path, deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20), slippage = 0.5 }: Omit<SwapParams, 'tokenIn'>) => {
      if (!address || !tokenOut || !amountIn) return null;
      if (!config) throw new Error('Wagmi config tidak tersedia');
      
      // Validasi tokenOut
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
      if (tokenOut === ZERO_ADDRESS) {
        throw new Error('TokenOut tidak boleh alamat zero (native token)');
      }
      
      try {
        console.log("🔄 Mulai swap native to token");
        setIsPending(true);
        
        // Native token (MON) selalu 18 desimal
        const amountInWei = parseUnits(amountIn, 18);
        
        // Tentukan decimals untuk tokenOut
        let decimalsOut = 18; // Default
        if (
          tokenOut.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() || 
          tokenOut.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()
        ) {
          decimalsOut = 6;
        } else if (tokenOut.toLowerCase() === TOKEN_ADDRESSES.WBTC.toLowerCase()) {
          decimalsOut = 8;
        }
        
        const minOutWei = parseUnits(minAmountOut, decimalsOut);
        
        // Kasus khusus untuk MON -> WMON (wrap langsung)
        if (tokenOut.toLowerCase() === TOKEN_ADDRESSES.WMON.toLowerCase()) {
          console.log("🔄 Kasus khusus wrap MON -> WMON terdeteksi");
          // Implementasi wrap dapat ditambahkan di sini jika diperlukan
        }
        
        // Default path untuk swap native ke token
        // Path harus menggunakan WMON sebagai token pertama
        const tokenPath = path || [TOKEN_ADDRESSES.WMON, tokenOut] as Address[];
        
        // Validasi path
        if (tokenPath[0].toLowerCase() !== TOKEN_ADDRESSES.WMON.toLowerCase()) {
          console.log("⚠️ Penyesuaian path: token pertama bukan WMON, ditambahkan WMON");
          tokenPath.unshift(TOKEN_ADDRESSES.WMON);
        }
        
        // Native to token tidak perlu approval karena native token
        const swapFunction = async () => {
          console.log("📩 Mengirim transaksi swap native to token");
          const hash = await writeContractAsync({
            address: JIKUNA_SWAP_ETH_ADDRESS,
            abi: JIKUNA_SWAP_ETH_ABI,
            functionName: 'swapExactETHForTokens',
            args: [
              minOutWei,
              tokenPath,
              deadline
            ],
            value: amountInWei,
            gas: BigInt(300000), 
          });
          
          console.log("⏳ Menunggu transaksi selesai:", hash);
          const receipt = await waitForTransaction(config, { hash });
          console.log("✅ Transaksi selesai:", receipt.status);
          
          // JXP akan diperbarui secara otomatis oleh kontrak, tidak perlu lagi memanggil updateJXP
          if (receipt.status === 'success') {
            console.log("🎮 JXP akan diperbarui oleh router swap secara otomatis");
          }
          
          return hash;
        };
        
        // Langsung swap, native tidak perlu approval
        return await swapFunction();
      } catch (error) {
        console.error('❌ Error swapping native for tokens:', error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [address, writeContractAsync, config]
  );

  // Melakukan swap token ke native (MON)
  const swapExactTokensForNative = useCallback(
    async ({ tokenIn, amountIn, minAmountOut, path, deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20), slippage = 0.5 }: Omit<SwapParams, 'tokenOut'>) => {
      if (!address || !tokenIn || !amountIn) return null;
      if (!config) throw new Error('Wagmi config tidak tersedia');
      
      // Validasi tokenIn
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
      if (tokenIn === ZERO_ADDRESS) {
        throw new Error('TokenIn tidak boleh alamat zero (native token)');
      }
      
      try {
        console.log("🔄 Mulai swap token to native");
        setIsPending(true);
        
        // Tentukan decimals untuk tokenIn
        let decimalsIn = 18; // Default
        if (
          tokenIn.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() || 
          tokenIn.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()
        ) {
          decimalsIn = 6;
        } else if (tokenIn.toLowerCase() === TOKEN_ADDRESSES.WBTC.toLowerCase()) {
          decimalsIn = 8;
        }
        
        const amountInWei = parseUnits(amountIn, decimalsIn);
        
        // Native token (MON) selalu 18 desimal
        const minOutWei = parseUnits(minAmountOut, 18);
        
        // Kasus khusus untuk WMON -> MON (unwrap langsung)
        if (tokenIn.toLowerCase() === TOKEN_ADDRESSES.WMON.toLowerCase()) {
          console.log("🔄 Kasus khusus unwrap WMON -> MON terdeteksi");
          // Implementasi unwrap dapat ditambahkan di sini jika diperlukan
        }
        
        // Default path untuk swap token ke native
        // Path harus menggunakan WMON sebagai token terakhir
        const tokenPath = path || [tokenIn, TOKEN_ADDRESSES.WMON] as Address[];
        
        // Validasi path
        if (tokenPath[tokenPath.length - 1].toLowerCase() !== TOKEN_ADDRESSES.WMON.toLowerCase()) {
          console.log("⚠️ Penyesuaian path: token terakhir bukan WMON, ditambahkan WMON");
          tokenPath.push(TOKEN_ADDRESSES.WMON);
        }
        
        // Definisikan fungsi swap
        const swapFunction = async () => {
          console.log("📩 Mengirim transaksi swap token to native");
          const hash = await writeContractAsync({
            address: JIKUNA_SWAP_ETH_ADDRESS,
            abi: JIKUNA_SWAP_ETH_ABI,
            functionName: 'swapExactTokensForETH',
            args: [
              amountInWei,
              minOutWei,
              tokenPath,
              deadline
            ],
            gas: BigInt(300000),
          });
          
          console.log("⏳ Menunggu transaksi selesai:", hash);
          const receipt = await waitForTransaction(config, { hash });
          console.log("✅ Transaksi selesai:", receipt.status);
          
          // JXP akan diperbarui secara otomatis oleh kontrak, tidak perlu lagi memanggil updateJXP
          if (receipt.status === 'success') {
            console.log("🎮 JXP akan diperbarui oleh router swap secara otomatis");
          }
          
          return hash;
        };
        
        // Pakai helper approve dan swap jika diperlukan
        return await approveAndSwap(tokenIn, amountInWei, JIKUNA_SWAP_ETH_ADDRESS, swapFunction);
      } catch (error) {
        console.error('❌ Error swapping tokens for native:', error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [address, writeContractAsync, config, approveAndSwap]
  );

  // Melakukan swap token ke token
  const swapExactTokensForTokens = useCallback(
    async ({ tokenIn, tokenOut, path, amountIn, minAmountOut, deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20), slippage = 0.5 }: SwapParams) => {
      if (!address || !tokenIn || !tokenOut || !amountIn) return null;
      if (!config) throw new Error('Wagmi config tidak tersedia');
      
      // Validasi alamat token untuk mencegah error UniswapV2Library
      if (tokenIn === tokenOut) {
        throw new Error('UniswapV2Library: IDENTICAL_ADDRESSES');
      }
      
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
      if (tokenIn === ZERO_ADDRESS || tokenOut === ZERO_ADDRESS) {
        throw new Error('UniswapV2Library: ZERO_ADDRESS');
      }
      
      try {
        console.log("🔄 Mulai swap token to token");
        setIsPending(true);
        
        // Tentukan decimals untuk tokenIn
        let decimalsIn = 18; // Default
        if (
          tokenIn.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() || 
          tokenIn.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()
        ) {
          decimalsIn = 6;
        } else if (tokenIn.toLowerCase() === TOKEN_ADDRESSES.WBTC.toLowerCase()) {
          decimalsIn = 8;
        }
        
        // Tentukan decimals untuk tokenOut
        let decimalsOut = 18; // Default
        if (
          tokenOut.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase() || 
          tokenOut.toLowerCase() === TOKEN_ADDRESSES.USDT.toLowerCase()
        ) {
          decimalsOut = 6;
        } else if (tokenOut.toLowerCase() === TOKEN_ADDRESSES.WBTC.toLowerCase()) {
          decimalsOut = 8;
        }
        
        const amountInWei = parseUnits(amountIn, decimalsIn);
        const minOutWei = parseUnits(minAmountOut, decimalsOut);
        
        // Jika path tidak disediakan, gunakan default [tokenIn, tokenOut]
        // Jika tidak ada likuiditas langsung, dapat menggunakan WMON sebagai perantara
        let tokenPath: Address[];
        
        if (path && path.length >= 2) {
          // Gunakan path yang diberikan
          tokenPath = path;
          
          // Validasi path: token pertama harus tokenIn dan token terakhir harus tokenOut
          if (tokenPath[0].toLowerCase() !== tokenIn.toLowerCase()) {
            console.log("⚠️ Peringatan: Token pertama di path tidak sesuai dengan tokenIn");
          }
          
          if (tokenPath[tokenPath.length - 1].toLowerCase() !== tokenOut.toLowerCase()) {
            console.log("⚠️ Peringatan: Token terakhir di path tidak sesuai dengan tokenOut");
          }
        } else {
          // Pasangan token langsung
          tokenPath = [tokenIn, tokenOut];
          
          // Cek jika pasangan memerlukan WMON sebagai perantara (tahap pengembangan lebih lanjut)
          // Tambahan ini bisa dikembangkan dengan memeriksa ketersediaan likuiditas
        }
        
        // Definisikan fungsi swap
        const swapFunction = async () => {
          console.log("📩 Mengirim transaksi swap token to token");
          const hash = await writeContractAsync({
            address: JIKUNA_SWAP_ADDRESS,
            abi: JIKUNA_SWAP_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [
              amountInWei,
              minOutWei,
              tokenPath,
              deadline
            ],
            gas: BigInt(300000),
          });
          
          console.log("⏳ Menunggu transaksi selesai:", hash);
          const receipt = await waitForTransaction(config, { hash });
          console.log("✅ Transaksi selesai:", receipt.status);
          
          // JXP akan diperbarui secara otomatis oleh kontrak, tidak perlu lagi memanggil updateJXP
          if (receipt.status === 'success') {
            console.log("🎮 JXP akan diperbarui oleh router swap secara otomatis");
          }
          
          return hash;
        };
        
        // Pakai helper approve dan swap jika diperlukan
        return await approveAndSwap(tokenIn, amountInWei, JIKUNA_SWAP_ADDRESS, swapFunction);
      } catch (error) {
        console.error('❌ Error swapping tokens:', error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [address, writeContractAsync, config, approveAndSwap]
  );

  return {
    getAmountOut,
    swapExactTokensForTokens,
    swapExactNativeForTokens,
    swapExactTokensForNative,
    isPending,
    calculateJXP
  };
} 