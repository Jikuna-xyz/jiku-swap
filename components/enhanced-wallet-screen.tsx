"use client"

import React, { useState, useEffect, useCallback } from "react"
import Header from "./header"
import { useAccount, useBalance } from 'wagmi'
import { formatEther, formatUnits, Address, Hash } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { monadTestnet } from '@/lib/wagmi'
import { TOKEN_ADDRESSES } from '@/config/contracts'
import { readContract } from '@wagmi/core'
import { getConfig } from '@/lib/wagmi'
import { createPublicClient, http } from 'viem'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink, BarChart3, Wallet, Loader2, RefreshCcw, ArrowDown, ArrowUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatNumber } from "@/lib/utils"
import Link from "next/link"
import { JIKUNA_SWAP_ADDRESS, JIKUNA_SWAP_ETH_ADDRESS } from '@/config/contracts'
import { useToast } from "@/hooks/use-toast"

// Konstanta untuk throttling RPC requests
const DELAY_BETWEEN_REQUESTS = 1000; // 1 detik antar request
const MAX_BLOCKS_PER_REQUEST = 25; // Ambil maksimal 25 blok per request
const DEFAULT_HISTORY_BLOCKS = 50; // Standar hanya melihat 50 blok terakhir

// Cache transaksi untuk mencegah duplikasi request
interface TransactionCache {
  transactions: Transaction[];
  timestamp: number;
  fromBlock: bigint;
  toBlock: bigint;
}
// Global cache untuk mengurangi RPC calls
let globalTransactionCache: TransactionCache | null = null;
const TRANSACTION_CACHE_DURATION = 60 * 1000; // 1 menit cache

// Helper untuk menunda eksekusi
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Token definition
interface Token {
  symbol: string;
  name: string;
  address: string;
  icon: string;
  color: string;
  decimals: number;
  popular?: boolean;
}

// Transaction type
interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'wrap' | 'unwrap';
  token: string;
  amount: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

// Type untuk logs dari event
interface TransferEventLog {
  args: {
    from: `0x${string}` | string;
    to: `0x${string}` | string;
    value: bigint;
  };
  address: `0x${string}` | string;
  transactionHash: `0x${string}` | string;
  blockHash: `0x${string}` | string;
  [key: string]: any;
}

interface SwapEventLog {
  args: {
    sender: `0x${string}` | string;
    to: `0x${string}` | string;
    amount0In: bigint;
    amount1In: bigint;
    amount0Out: bigint;
    amount1Out: bigint;
  };
  address: `0x${string}` | string;
  transactionHash: `0x${string}` | string;
  blockHash: `0x${string}` | string;
  [key: string]: any;
}

// Helper untuk memastikan string menjadi format hash yang benar (0x prefixed)
const toHashString = (value: string): Hash => {
  if (!value) return '0x0000000000000000000000000000000000000000000000000000000000000000' as Hash;
  return value.startsWith('0x') ? value as Hash : `0x${value}` as Hash;
};

export default function EnhancedWalletScreen() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address,
  });
  
  const { toast } = useToast();
  
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  
  // Buat public client untuk Monad (default)
  const defaultPublicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });
  
  // Buat public client Alchemy untuk activity
  const alchemyPublicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://monad-testnet.g.alchemy.com/v2/51JwVMZMSyUjwugm7wSBYhpXV7N8bEeG'),
  });
  
  // Token list
  const tokens: Token[] = [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
      icon: "$",
      color: "#64c0f4",
      decimals: 6,
      popular: true
    },
    {
      symbol: "USDT",
      name: "Tether",
      address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
      icon: "$",
      color: "#26a17b",
      decimals: 6,
      popular: true
    },
    {
      symbol: "WMON",
      name: "Wrapped Monad",
      address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
      icon: "W",
      color: "#7e6dd1",
      decimals: 18,
      popular: true
    },
    {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
      icon: "E",
      color: "#627eea",
      decimals: 18,
      popular: true
    },
    {
      symbol: "aprMON",
      name: "April Monad",
      address: "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
      icon: "A",
      color: "#ff9900",
      decimals: 18
    },
    { 
      symbol: "DAK", 
      name: "Daku Finance", 
      address: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714", 
      icon: "D", 
      color: "#f0b90b",
      decimals: 18
    },
    {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
      icon: "B",
      color: "#f7931a",
      decimals: 8
    }
  ];
  
  // Transaction list - akan diisi dengan data real
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Default dummy data tetap dipertahankan, tapi akan diganti
    {
      hash: "0x5cae7b9ce562e32f0e9c097ffbff9fc71e764ced4a91e08ecec05366c8e2b4c9",
      type: "swap",
      token: "MON → USDC",
      amount: "10.5",
      timestamp: new Date(Date.now() - 3600000 * 2),
      status: "completed"
    },
    {
      hash: "0x3b5e0b9be9e3485989d0ecb420eabd7f95d921d15e192bded12fc8a674e87f2d",
      type: "receive",
      token: "MON",
      amount: "25",
      timestamp: new Date(Date.now() - 3600000 * 5),
      status: "completed"
    },
    {
      hash: "0x1d8bf6cd2a9848d6937060cbd3873d3de7bf52c506f9c476fe4bf15142c94ffc",
      type: "send",
      token: "USDT",
      amount: "100",
      timestamp: new Date(Date.now() - 3600000 * 24),
      status: "completed"
    },
    {
      hash: "0x7a9b481f63a2539f6d77dd92099f5a480ca945c3e8fbe459a41c9ec88805b0d9",
      type: "wrap",
      token: "MON → WMON",
      amount: "5",
      timestamp: new Date(Date.now() - 3600000 * 48),
      status: "completed"
    }
  ]);

  // Function untuk mengambil transaksi dari blockchain
  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      setIsLoadingTxs(true);
      
      // Cek cache transaksi dulu
      const now = Date.now();
      if (globalTransactionCache && 
          now - globalTransactionCache.timestamp < TRANSACTION_CACHE_DURATION) {
        console.log("Using cached transactions");
        setTransactions(globalTransactionCache.transactions);
        setIsLoadingTxs(false);
        return;
      }
      
      try {
        // Ambil block terbaru
        const latestBlock = await alchemyPublicClient.getBlockNumber();
        // Batasi range history yang lebih kecil untuk mengurangi load
        const fromBlock = latestBlock - BigInt(DEFAULT_HISTORY_BLOCKS);
        
        console.log(`Fetching transactions from block ${fromBlock} to ${latestBlock} using Alchemy RPC`);
        
        // Array untuk menampung transaksi baru
        const realTransactions: Transaction[] = [];
        
        // Fungsi dengan timeout untuk mencegah hanging
        const fetchWithTimeout = async <T,>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T | null> => {
          let timeoutId: NodeJS.Timeout;
          
          const timeoutPromise = new Promise<null>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error('Operation timed out'));
            }, timeoutMs);
          });
          
          try {
            const result = await Promise.race([promise, timeoutPromise]) as T;
            clearTimeout(timeoutId!);
            return result;
          } catch (err) {
            console.error('Timeout or error occurred:', err);
            return null;
          }
        };
        
        // Fungsi untuk menambahkan transaksi ke array jika memenuhi kriteria
        const addTransactionIfNotExists = (tx: Transaction) => {
          // Cek apakah transaksi dengan hash sama sudah ada
          const exists = realTransactions.some(t => t.hash === tx.hash);
          if (!exists) {
            realTransactions.push(tx);
          }
        };
        
        // Fungsi untuk melakukan paging pada getLogs request untuk mencegah error rate limit
        const fetchLogsWithPaging = async <T,>(
          eventConfig: any, 
          fromBlockParam: bigint, 
          toBlockParam: bigint
        ): Promise<T[]> => {
          const allLogs: T[] = [];
          let currentFromBlock = fromBlockParam;
          
          while (currentFromBlock <= toBlockParam) {
            // Hindari meminta lebih dari MAX_BLOCKS_PER_REQUEST per request
            let currentToBlock = currentFromBlock + BigInt(MAX_BLOCKS_PER_REQUEST - 1);
            if (currentToBlock > toBlockParam) {
              currentToBlock = toBlockParam;
            }
            
            try {
              console.log(`Fetching logs from block ${currentFromBlock} to ${currentToBlock}`);
              // Tunggu waktu antara requests untuk menghindari rate limiting
              await sleep(DELAY_BETWEEN_REQUESTS);
              
              const logs = await fetchWithTimeout(
                alchemyPublicClient.getLogs({
                  ...eventConfig,
                  fromBlock: currentFromBlock,
                  toBlock: currentToBlock
                })
              );
              
              if (logs) {
                // Type casting untuk menangani format viem
                // Kita perlu menggunakan any untuk log karena tipe Viem tidak lengkap
                const typedLogs = (logs as any[]).map(log => {
                  // Untuk penanganan tipe data dengan benar dalam format viem
                  const typed = {
                    ...log,
                    args: log.args || {},
                    address: log.address,
                    transactionHash: log.transactionHash,
                    blockHash: log.blockHash
                  } as T;
                  return typed;
                });
                
                allLogs.push(...typedLogs);
              }
            } catch (err) {
              console.error(`Error fetching logs for block range ${currentFromBlock}-${currentToBlock}:`, err);
            }
            
            // Pindah ke range blok berikutnya
            currentFromBlock = currentToBlock + BigInt(1);
          }
          
          return allLogs;
        };
        
        // 1. Ambil transfer masuk (receive) - gunakan Alchemy dengan paging
        try {
          console.log('Fetching incoming transfers...');
          const transferInEventConfig = {
            event: {
              anonymous: false,
              inputs: [
                { indexed: true, name: 'from', type: 'address' },
                { indexed: true, name: 'to', type: 'address' },
                { indexed: false, name: 'value', type: 'uint256' },
              ],
              name: 'Transfer',
              type: 'event',
            },
            args: {
              to: address as Address
            }
          };
          
          const transferInLogs = await fetchLogsWithPaging<TransferEventLog>(
            transferInEventConfig,
            fromBlock,
            latestBlock
          );
          
          // Jika berhasil mendapatkan log
          if (transferInLogs && transferInLogs.length > 0) {
            console.log(`Found ${transferInLogs.length} incoming transfers`);
            
            // Ambil maksimal 5 log terbaru untuk diproses (mengurangi request)
            const recentLogs = transferInLogs.slice(0, 5);
            
            // Proses hasil
            for (const log of recentLogs) {
              if (log.transactionHash && log.args.from && log.args.value) {
                // Cek jika ini dari diri sendiri
                if (log.args.from.toLowerCase() === address.toLowerCase()) continue;
                
                try {
                  // Tunggu antara requests untuk menghindari rate limiting
                  await sleep(DELAY_BETWEEN_REQUESTS);
                  
                  // Get token info and tx
                  const txHash = toHashString(log.transactionHash);
                  const tx = await alchemyPublicClient.getTransaction({ hash: txHash });
                  let tokenSymbol = "Unknown";
                  
                  // Coba deteksi token
                  if (log.address === TOKEN_ADDRESSES.USDC) tokenSymbol = "USDC";
                  else if (log.address === TOKEN_ADDRESSES.USDT) tokenSymbol = "USDT";
                  else if (log.address === TOKEN_ADDRESSES.WMON) tokenSymbol = "WMON";
                  else if (log.address === TOKEN_ADDRESSES.WETH) tokenSymbol = "WETH";
                  else if (log.address === TOKEN_ADDRESSES.WBTC) tokenSymbol = "WBTC";
                  
                  // Get amount
                  const token = tokens.find(t => t.address.toLowerCase() === log.address.toLowerCase());
                  const decimals = token?.decimals || 18;
                  const amount = formatUnits(log.args.value, decimals);
                  
                  // Tunggu antara requests untuk menghindari rate limiting
                  await sleep(DELAY_BETWEEN_REQUESTS);
                  
                  // Dapatkan block untuk timestamp
                  const block = await alchemyPublicClient.getBlock({ blockHash: tx.blockHash });
                  const timestamp = new Date(Number(block.timestamp) * 1000);
                  
                  // Add to transactions
                  addTransactionIfNotExists({
                    hash: log.transactionHash,
                    type: 'receive',
                    token: tokenSymbol,
                    amount: amount,
                    timestamp: timestamp,
                    status: 'completed'
                  });
                } catch (innerError) {
                  console.error("Error processing incoming transfer:", innerError);
                  continue; // Lanjutkan ke item berikutnya jika ada error
                }
              }
            }
          }
        } catch(error) {
          console.error("Error fetching transfer in events:", error);
        }
        
        // 2. Ambil transfer keluar (send) - gunakan paging yang sama
        try {
          console.log('Fetching outgoing transfers...');
          const transferOutEventConfig = {
            event: {
              anonymous: false,
              inputs: [
                { indexed: true, name: 'from', type: 'address' },
                { indexed: true, name: 'to', type: 'address' },
                { indexed: false, name: 'value', type: 'uint256' },
              ],
              name: 'Transfer',
              type: 'event',
            },
            args: {
              from: address as Address
            }
          };
          
          const transferOutLogs = await fetchLogsWithPaging<TransferEventLog>(
            transferOutEventConfig,
            fromBlock,
            latestBlock
          );
          
          // Jika berhasil mendapatkan log
          if (transferOutLogs && transferOutLogs.length > 0) {
            console.log(`Found ${transferOutLogs.length} outgoing transfers`);
            
            // Ambil maksimal 5 log terbaru untuk diproses (mengurangi request)
            const recentLogs = transferOutLogs.slice(0, 5);
            
            // Proses hasil
            for (const log of recentLogs) {
              if (log.transactionHash && log.args.to && log.args.value) {
                // Cek jika ini ke diri sendiri
                if (log.args.to.toLowerCase() === address.toLowerCase()) continue;
                
                try {
                  // Tunggu antara requests untuk menghindari rate limiting
                  await sleep(DELAY_BETWEEN_REQUESTS);
                  
                  // Get token info and tx
                  const txHash = toHashString(log.transactionHash);
                  const tx = await alchemyPublicClient.getTransaction({ hash: txHash });
                  let tokenSymbol = "Unknown";
                  
                  // Coba deteksi token
                  if (log.address === TOKEN_ADDRESSES.USDC) tokenSymbol = "USDC";
                  else if (log.address === TOKEN_ADDRESSES.USDT) tokenSymbol = "USDT";
                  else if (log.address === TOKEN_ADDRESSES.WMON) tokenSymbol = "WMON";
                  else if (log.address === TOKEN_ADDRESSES.WETH) tokenSymbol = "WETH";
                  else if (log.address === TOKEN_ADDRESSES.WBTC) tokenSymbol = "WBTC";
                  
                  // Get amount
                  const token = tokens.find(t => t.address.toLowerCase() === log.address.toLowerCase());
                  const decimals = token?.decimals || 18;
                  const amount = formatUnits(log.args.value, decimals);
                  
                  // Tunggu antara requests untuk menghindari rate limiting
                  await sleep(DELAY_BETWEEN_REQUESTS);
                  
                  // Dapatkan block untuk timestamp
                  const block = await alchemyPublicClient.getBlock({ blockHash: tx.blockHash });
                  const timestamp = new Date(Number(block.timestamp) * 1000);
                  
                  // Cek jika ini adalah transfer ke alamat Jikuna router (bagian dari swap)
                  const isJikunaContract = 
                    log.args.to.toLowerCase() === JIKUNA_SWAP_ADDRESS.toLowerCase() || 
                    log.args.to.toLowerCase() === JIKUNA_SWAP_ETH_ADDRESS.toLowerCase();
                    
                  // Add to transactions - jika ini bukan ke router, ini adalah transfer biasa
                  if (!isJikunaContract) {
                    addTransactionIfNotExists({
                      hash: log.transactionHash,
                      type: 'send',
                      token: tokenSymbol,
                      amount: amount,
                      timestamp: timestamp,
                      status: 'completed'
                    });
                  }
                } catch (innerError) {
                  console.error("Error processing outgoing transfer:", innerError);
                  continue; // Lanjutkan ke item berikutnya jika ada error
                }
              }
            }
          }
        } catch(error) {
          console.error("Error fetching transfer out events:", error);
        }
        
        // 3. Ambil Swap events - kurangi jumlah request
        try {
          console.log('Fetching swap events...');
          
          // Fokus hanya pada blok terbaru untuk mengurangi jumlah permintaan
          const swapFromBlock = latestBlock - BigInt(20); // Hanya 20 blok terakhir
          
          const swapEventConfig = {
            address: [JIKUNA_SWAP_ADDRESS, JIKUNA_SWAP_ETH_ADDRESS],
            event: {
              anonymous: false,
              inputs: [
                { indexed: true, name: 'sender', type: 'address' },
                { indexed: false, name: 'amount0In', type: 'uint256' },
                { indexed: false, name: 'amount1In', type: 'uint256' },
                { indexed: false, name: 'amount0Out', type: 'uint256' },
                { indexed: false, name: 'amount1Out', type: 'uint256' },
                { indexed: true, name: 'to', type: 'address' },
              ],
              name: 'Swap',
              type: 'event',
            }
          };
          
          const swapLogs = await fetchLogsWithPaging<SwapEventLog>(
            swapEventConfig,
            swapFromBlock,
            latestBlock
          );
          
          if (swapLogs && swapLogs.length > 0) {
            console.log(`Found ${swapLogs.length} swap events`);
            
            // Filter swap milik pengguna
            const userSwaps = swapLogs.filter(log => 
              (log.args.sender && log.args.sender.toLowerCase() === address.toLowerCase()) ||
              (log.args.to && log.args.to.toLowerCase() === address.toLowerCase())
            );
            
            console.log(`Found ${userSwaps.length} user swap events`);
            
            // Ambil maksimal 3 swap terbaru saja untuk mengurangi request
            const recentSwaps = userSwaps.slice(0, 3);
            
            // Proses hasil
            for (const swap of recentSwaps) {
              if (swap.transactionHash) {
                try {
                  // Tunggu antara requests untuk menghindari rate limiting
                  await sleep(DELAY_BETWEEN_REQUESTS);
                  
                  // Get transaction
                  const txHash = toHashString(swap.transactionHash);
                  const tx = await alchemyPublicClient.getTransaction({ hash: txHash });
                  
                  await sleep(DELAY_BETWEEN_REQUESTS);
                  // Dapatkan receipt untuk cek token (minimal permintaan)
                  // Kita skip bagian receipt karena bisa menghasilkan banyak request
                  // dan cukup gunakan data dasar
                  
                  // Dapatkan block untuk timestamp
                  const block = await alchemyPublicClient.getBlock({ blockHash: tx.blockHash });
                  const timestamp = new Date(Number(block.timestamp) * 1000);
                  
                  // Kita sederhanakan info token untuk mengurangi request yang berlebihan
                  addTransactionIfNotExists({
                    hash: swap.transactionHash,
                    type: 'swap',
                    token: `Token Swap`,
                    amount: "0", // Disederhanakan
                    timestamp: timestamp,
                    status: 'completed'
                  });
                } catch (innerError) {
                  console.error("Error processing swap:", innerError);
                  continue; // Lanjutkan ke item berikutnya jika ada error
                }
              }
            }
          }
        } catch(error) {
          console.error("Error fetching swap events:", error);
        }
        
        // Urutkan berdasarkan waktu (terbaru dulu)
        realTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Update state dengan transaksi yang ditemukan
        if (realTransactions.length > 0) {
          // Update cache global
          globalTransactionCache = {
            transactions: realTransactions,
            timestamp: Date.now(),
            fromBlock: fromBlock,
            toBlock: latestBlock
          };
          setTransactions(realTransactions);
        } else {
          console.log("No transactions found, keeping dummy data for UI");
        }
        
      } catch (alchemyError) {
        console.error("Error using Alchemy RPC:", alchemyError);
        // Jika Alchemy gagal, load data dummy minimal
        const currentTime = new Date();
        
        // Cek apakah errornya masalah rate limit (429)
        if (alchemyError && typeof alchemyError === 'object' && 'toString' in alchemyError && 
            alchemyError.toString().includes("429")) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many requests to RPC. Try again in a few seconds.",
            variant: "destructive"
          });
        } else {
          setTransactions([
            {
              hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
              type: "receive",
              token: "MON",
              amount: "1.0",
              timestamp: new Date(currentTime.getTime() - 3600000),
              status: "completed"
            }
          ]);
          toast({
            title: "Failed to load transaction data",
            description: "There was a problem fetching transaction data. Please try again later.",
            variant: "destructive"
          });
        }
      }
      
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Failed to refresh transaction data",
        description: "Please try again later or check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTxs(false);
    }
  }, [address, isConnected, alchemyPublicClient, tokens, toast]);
  
  // Fetch transaksi hanya saat halaman dimuat pertama kali dan tidak auto-refresh
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      if (isConnected && address && mounted) {
        await fetchTransactions();
      }
    };
    
    loadInitialData();
    
    return () => {
      mounted = false;
    };
  }, [isConnected, address]);
  
  // Function untuk refresh data (balances dan transactions)
  const handleRefresh = async () => {
    if (!isConnected || !address) return;
    
    setIsRefreshing(true);
    try {
      // Refresh balances
      await fetchTokenBalances();
      await refetchBalance();
      
      // Refresh transactions
      try {
        await fetchTransactions();
      } catch (error) {
        console.error("Error refreshing transactions:", error);
        toast({
          title: "Failed to refresh transaction data",
          description: "Please try again later or check your internet connection.",
          variant: "destructive",
        });
      }
      
      // Set timestamp
      setLastUpdated(new Date());
      toast({
        title: "Data refreshed successfully",
        description: "Balance and transaction data has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Failed to refresh data",
        description: "An error occurred while refreshing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      setIsLoadingBalances(true);
      setIsRefreshing(true);
      
      // For non-native (ERC20) tokens
      const newBalances: {[key: string]: string} = {};
      const config = getConfig();
      
      // Jika config tidak tersedia, jangan lanjutkan
      if (!config) {
        console.error("Wagmi config tidak tersedia");
        setIsLoadingBalances(false);
        setIsRefreshing(false);
        return;
      }
      
      // ABI for balanceOf
      const tokenAbi = [{
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }] as const;
      
      // Fungsi dengan timeout untuk mencegah hanging
      const fetchBalanceWithTimeout = async (token: Token): Promise<bigint | null> => {
        try {
          // Buat promise dengan timeout
          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Token balance request timeout'));
            }, 5000); // 5 detik timeout
          });
          
          // Promise untuk membaca kontrak
          const readPromise = readContract(config, {
            address: token.address as Address,
            abi: tokenAbi,
            functionName: 'balanceOf',
            args: [address],
          });
          
          // Race kedua promise
          const result = await Promise.race([readPromise, timeoutPromise]);
          return result as bigint;
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          return null;
        }
      };
      
      // Fetch all token balances
      for (const token of tokens) {
        try {
          const balance = await fetchBalanceWithTimeout(token);
          
          // Only add if balance > 0 and not null
          if (balance && balance > BigInt(0)) {
            const formattedBalance = formatUnits(balance, token.decimals);
            newBalances[token.address] = formattedBalance;
          }
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
        }
      }
      
      // Update balances
      setTokenBalances(newBalances);
      setLastUpdated(new Date());
      
      // Refresh native token balance
      await refetchBalance();
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
    } finally {
      setIsLoadingBalances(false);
      setIsRefreshing(false);
    }
  }, [address, isConnected, refetchBalance]);
  
  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
    }
  }, [fetchTokenBalances, isConnected, address]);

  // Calculate total portfolio value (this would ideally use price feeds in a real app)
  const calculateTotalValue = () => {
    if (!isConnected) return "$0.00";
    
    let total = 0;
    
    // Add native token value (mock prices)
    if (balance) {
      const monValue = parseFloat(formatEther(balance.value)) * 10; // Assuming 1 MON = $10
      total += monValue;
    }
    
    // Add ERC20 token values (mock prices)
    Object.entries(tokenBalances).forEach(([address, balance]) => {
      const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
      if (!token) return;
      
      let tokenPrice = 1; // Default price
      
      // Mock prices
      if (token.symbol === "USDC" || token.symbol === "USDT") {
        tokenPrice = 1; // Stablecoins
      } else if (token.symbol === "WMON") {
        tokenPrice = 10; // Same as MON
      } else if (token.symbol === "WETH") {
        tokenPrice = 3000;
      } else if (token.symbol === "WBTC") {
        tokenPrice = 50000;
      } else {
        tokenPrice = 2; // Default for other tokens
      }
      
      total += parseFloat(balance) * tokenPrice;
    });
    
    return `$${total.toFixed(2)}`;
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': 
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case 'receive': 
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'swap': 
        return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      case 'wrap': 
      case 'unwrap': 
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default: 
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format transaction date
  const formatTransactionDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Format untuk URL explorer
  const getTxExplorerUrl = (txHash: string) => {
    return `https://testnet.monadexplorer.com/tx/${txHash}`;
  };

  // Truncate/format address
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-gradient-to-b from-[#0f172a] to-[#1e293b]" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      
      <div className="pt-4 px-4 sm:px-6 pb-6 flex-grow">
        <div className="max-w-lg mx-auto">
          {/* Wallet Header */}
          <div className="mb-6">
            <Card className="bg-black/20 backdrop-blur-lg border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Wallet</h2>
                    {isConnected && address && (
                      <div className="flex items-center mt-1 text-sm text-gray-400">
                        <p>{truncateAddress(address)}</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                          <a href={`https://testnet.monadexplorer.com//address/${address}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3 w-3 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Total Balance</p>
                  {isBalanceLoading || isLoadingBalances ? (
                    <Skeleton className="h-8 w-40 mt-1 bg-gray-800" />
                  ) : (
                    <h3 className="text-2xl font-bold mt-1">{calculateTotalValue()}</h3>
                  )}
                </div>
                
                {!isConnected && (
                  <div className="mt-4">
                    <ConnectButton.Custom>
                      {({ account, chain, openConnectModal }) => {
                        return (
                          <Button 
                            className="w-full py-5 text-base font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            onClick={openConnectModal}
                          >
                            Connect Wallet
                          </Button>
                        )
                      }}
                    </ConnectButton.Custom>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Content Tabs */}
          {isConnected && (
            <Tabs defaultValue="assets" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-gray-800">
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              {/* Assets Tab */}
              <TabsContent value="assets" className="mt-4">
                <Card className="bg-black/20 backdrop-blur-lg border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">My Assets</CardTitle>
                    <CardDescription>
                      Your tokens and balances on {chain?.name || 'Monad Testnet'}
                    </CardDescription>
                  </CardHeader>
                  
                  <Separator className="bg-gray-800" />
                  
                  <ScrollArea className="h-[350px] rounded-md">
                    <CardContent className="p-0">
                      <div className="space-y-0.5">
                        {/* Native Token (MON) */}
                        {balance && (
                          <div className="flex items-center justify-between py-3 px-4 hover:bg-black/20">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 bg-[#7e6dd1]">
                                <AvatarFallback className="text-white font-bold">M</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{balance.symbol}</p>
                                <p className="text-sm text-gray-400">Monad</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{parseFloat(formatEther(balance.value)).toFixed(4)}</p>
                              {/* This would use real price data in a production app */}
                              <p className="text-sm text-gray-400">${(parseFloat(formatEther(balance.value)) * 10).toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* ERC20 Tokens */}
                        {Object.entries(tokenBalances).length > 0 ? (
                          Object.entries(tokenBalances).map(([address, balance]) => {
                            const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
                            if (!token) return null;
                            
                            // Mock dollar value based on token
                            let dollarValue = parseFloat(balance);
                            if (token.symbol === "WETH") dollarValue *= 3000;
                            else if (token.symbol === "WBTC") dollarValue *= 50000;
                            else if (token.symbol === "WMON") dollarValue *= 10;
                            
                            return (
                              <div key={address} className="flex items-center justify-between py-3 px-4 hover:bg-black/20">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10" style={{ backgroundColor: token.color }}>
                                    <AvatarFallback className="text-white font-bold">{token.icon}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{token.symbol}</p>
                                    <p className="text-sm text-gray-400">{token.name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{parseFloat(balance).toFixed(4)}</p>
                                  <p className="text-sm text-gray-400">${dollarValue.toFixed(2)}</p>
                                </div>
                              </div>
                            );
                          })
                        ) : isLoadingBalances ? (
                          <div className="py-8 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <p className="text-gray-400">No tokens found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </ScrollArea>
                  
                  <CardFooter className="flex gap-2 pt-2">
                    <Button className="w-full gap-2" asChild>
                      <Link href="/swap">
                        <RefreshCcw className="h-4 w-4" />
                        Swap Tokens
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-4">
                <Card className="bg-black/20 backdrop-blur-lg border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Activity</CardTitle>
                    <CardDescription>
                      Your recent transactions
                    </CardDescription>
                  </CardHeader>
                  
                  <Separator className="bg-gray-800" />
                  
                  <ScrollArea className="h-[350px] rounded-md">
                    <CardContent className="p-0">
                      {transactions.length > 0 ? (
                        <div className="space-y-0.5">
                          {isLoadingTxs ? (
                            <div className="py-8 flex justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                          ) : (
                            transactions.map((tx, index) => (
                              <div key={index} className="flex items-center justify-between py-3 px-4 hover:bg-black/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
                                    {getTransactionIcon(tx.type)}
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <p className="font-medium capitalize">{tx.type}</p>
                                      <Badge 
                                        variant="outline" 
                                        className={`ml-2 text-[10px] ${
                                          tx.status === 'completed' ? 'text-green-400 border-green-400/20' : 
                                          tx.status === 'pending' ? 'text-yellow-400 border-yellow-400/20' : 
                                          'text-red-400 border-red-400/20'
                                        }`}
                                      >
                                        {tx.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">{formatTransactionDate(tx.timestamp)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{parseFloat(tx.amount).toFixed(4)} {tx.token}</p>
                                  <div className="text-xs text-gray-500 flex gap-2 items-center">
                                    <span>{truncateAddress(tx.hash)}</span>
                                    <a 
                                      href={getTxExplorerUrl(tx.hash)}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-purple-400 hover:text-purple-300"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-gray-400">No transaction history</p>
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                  
                  <CardFooter className="pt-2">
                    <Button variant="outline" className="w-full" onClick={handleRefresh} disabled={isRefreshing}>
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4 mr-2" />
                      )}
                      Refresh Transactions
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
} 