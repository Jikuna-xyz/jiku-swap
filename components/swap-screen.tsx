"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { RefreshCcw, Settings, ArrowDown, ChevronDown, X, Search } from "lucide-react"
import Header from "./header"
import { useAccount, useBalance } from 'wagmi';
import { useJikunaSwap } from '@/hooks/useJikunaSwap';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Address, formatUnits, formatEther } from 'viem';
import { readContract } from '@wagmi/core';
import { getConfig } from '@/lib/wagmi';
import { useWMON } from '@/hooks/useWMON';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import SwapSuccessPopup from './SwapSuccessPopup';

interface Token {
  symbol: string
  name: string
  address: string
  icon: string
  color: string
  popular?: boolean
  decimals?: number
}

// Cache for token balances
interface BalanceCache {
  [address: string]: {
    value: string;
    timestamp: number;
  }
}

// Global cache to avoid too many API calls
const tokenBalanceCache: BalanceCache = {};
const BALANCE_CACHE_DURATION = 30000; // 30 seconds

// Add function for debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Format rate considering token decimals
const formatRate = (fromToken: Token, toToken: Token, fromAmount: string, toAmount: string): string => {
  try {
    if (!fromAmount || !toAmount || parseFloat(fromAmount) === 0) return "0.000000";
    
    const rate = parseFloat(toAmount) / parseFloat(fromAmount);
    
    // Format rate based on token type
    if (toToken.symbol === "USDC" || toToken.symbol === "USDT") {
      return rate.toFixed(6); // 6 decimals
    } else if (toToken.symbol === "WBTC") {
      return rate.toFixed(8); // 8 decimals
    } else {
      return rate.toFixed(6); // Default 6 digits
    }
  } catch (e) {
    console.error("Error formatting rate:", e);
    return "0.000000";
  }
};

// Format minimum amount received
const formatMinReceived = (amount: string, slippage: number, token: Token): string => {
  try {
    if (!amount || parseFloat(amount) === 0) return "0.000000";
    
    const minAmount = parseFloat(amount) * (1 - slippage / 100);
    
    // Format berdasarkan jenis token
    if (token.symbol === "USDC" || token.symbol === "USDT") {
      return minAmount.toFixed(6); // 6 decimals
    } else if (token.symbol === "WBTC") {
      return minAmount.toFixed(8); // 8 decimals
    } else {
      return minAmount.toFixed(6); // Default 6 digits
    }
  } catch (e) {
    console.error("Error formatting min received:", e);
    return "0.000000";
  }
};

export default function SwapScreen() {
  const { address, isConnected } = useAccount();
  
  // Native token balance (MON)
  const { data: nativeBalance } = useBalance({
    address,
  });
  
  // Custom token balances
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  // Status loading untuk token balances
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Debounce timer ref
  const updateToAmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Toast untuk notifikasi
  const { toast } = useToast();
  
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [showFromTokens, setShowFromTokens] = useState(false)
  const [showToTokens, setShowToTokens] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [slippage, setSlippage] = useState(0.5)
  const [manualSlippage, setManualSlippage] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [tokenSearch, setTokenSearch] = useState("")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const settingsRef = useRef<HTMLDivElement>(null)
  const fromTokensRef = useRef<HTMLDivElement>(null)
  const toTokensRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchMoveY = useRef<number>(0)
  const [isClosingGesture, setIsClosingGesture] = useState(false)
  
  const { getAmountOut, swapExactTokensForTokens, swapExactNativeForTokens, swapExactTokensForNative, isPending } = useJikunaSwap();

  const [fromToken, setFromToken] = useState<Token>({
    symbol: "MON",
    name: "Monad",
    address: "native",
    icon: "M",
    color: "#7e6dd1",
    popular: true
  })

  const [toToken, setToToken] = useState<Token>({
    symbol: "USDC",
    name: "USD Coin",
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    icon: "$",
    color: "#64c0f4",
    popular: true
  })

  const [windowWidth, setWindowWidth] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  
  const { 
    handleWrap, 
    handleUnwrap, 
    isLoading: isWrapLoading,
    txHash: wrapTxHash,
    isSuccess: isWrapSuccess
  } = useWMON();

  // Tambahkan state untuk SwapSuccessPopup
  const [showSwapSuccess, setShowSwapSuccess] = useState(false);
  const [swapTxHash, setSwapTxHash] = useState("");
  const [swapJxpEarned, setSwapJxpEarned] = useState(0);

  // PENTING: Definisi tokens harus berada sebelum fungsi yang menggunakan tokens
  const tokens: Token[] = [
    { symbol: "MON", name: "Monad", address: "native", icon: "M", color: "#7e6dd1", popular: true, decimals: 18 },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
      icon: "$",
      color: "#64c0f4",
      popular: true,
      decimals: 6
    },
    {
      symbol: "USDT",
      name: "Tether",
      address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
      icon: "$",
      color: "#26a17b",
      popular: true,
      decimals: 6
    },
    {
      symbol: "WMON",
      name: "Wrapped Monad",
      address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
      icon: "W",
      color: "#7e6dd1",
      popular: true,
      decimals: 18
    },
    {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
      icon: "E",
      color: "#627eea",
      popular: true,
      decimals: 18
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
      symbol: "COHG",
      name: "Coinhunters",
      address: "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
      icon: "C",
      color: "#e84142",
      decimals: 18
    },
    {
      symbol: "YAKI",
      name: "Yakitori",
      address: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
      icon: "Y",
      color: "#f3ba2f",
      decimals: 18
    },
    {
      symbol: "shMON",
      name: "Sharded Monad",
      address: "0x3a98250F98Dd388C211206983453837C8365BDc1",
      icon: "S",
      color: "#8247e5",
      decimals: 18
    },
    {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
      icon: "B",
      color: "#f7931a",
      decimals: 8
    },
    {
      symbol: "gMON",
      name: "Governance Monad",
      address: "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3",
      icon: "G",
      color: "#2775ca",
      decimals: 18
    },
  ];

  // Check if this is a MON/WMON pair
  const isMonWmonPair = useMemo(() => {
    return (
      (fromToken.symbol === "MON" && toToken.symbol === "WMON") ||
      (fromToken.symbol === "WMON" && toToken.symbol === "MON")
    );
  }, [fromToken.symbol, toToken.symbol]);

  // Determine if this is wrap or unwrap direction
  const isWrapDirection = useMemo(() => {
    return fromToken.symbol === "MON" && toToken.symbol === "WMON";
  }, [fromToken.symbol, toToken.symbol]);

  // Function to handle wrap/unwrap
  const handleWrapUnwrap = async () => {
    if (isWrapDirection) {
      await handleWrap(fromAmount);
    } else {
      await handleUnwrap(fromAmount);
    }
  };

  // Menangani SSR
  useEffect(() => {
    setIsMounted(true)
    setWindowWidth(window.innerWidth)
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close settings/tokens when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
      if (fromTokensRef.current && !fromTokensRef.current.contains(event.target as Node)) {
        setShowFromTokens(false)
      }
      if (toTokensRef.current && !toTokensRef.current.contains(event.target as Node)) {
        setShowToTokens(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Menampilkan info rate dan slippage
  const renderRateInfo = () => {
    if (isMonWmonPair) {
      return (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
          <div className="flex items-center">
            <div className="text-blue-300 text-sm">
              {isWrapDirection
                ? "Wrap MON to WMON always at a 1:1 rate. WMON is the ERC-20 token version of MON."
                : "Unwrap WMON back to MON always at a 1:1 rate."}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-[#999da1] text-xs sm:text-sm">Rate</div>
          <div className="text-white text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
            {fromAmount && toAmount && parseFloat(fromAmount) > 0 ? (
              `1 ${fromToken.symbol} = ${(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} ${toToken.symbol}`
            ) : fromToken && toToken ? (
              `1 ${fromToken.symbol} = ... ${toToken.symbol}`
            ) : (
              `1 ${fromToken.symbol} = 0 ${toToken.symbol}`
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-[#999da1] text-xs sm:text-sm">Slippage Tolerance</div>
          <div className="text-white text-xs sm:text-sm">{slippage}%</div>
        </div>
        {fromAmount && toAmount && parseFloat(fromAmount) > 0 && (
        <div className="flex justify-between items-center">
            <div className="text-[#999da1] text-xs sm:text-sm">Minimum Received</div>
            <div className="text-white text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
              {(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}
            </div>
        </div>
        )}
      </div>
    );
  };

  // Function to get token balances with minimized RPC calls
  const fetchTokenBalances = useCallback(async (forceRefresh = false) => {
    if (!isConnected || !address) return;
    
    try {
      // Only set loading when there's no data or forced refresh
      if (Object.keys(tokenBalances).length === 0 || forceRefresh) {
        setIsLoadingBalances(true);
      }
      
      // Set timeout to prevent loading for too long
      const fetchTimeout = setTimeout(() => {
        setIsLoadingBalances(false);
      }, 5000); // Reduce timeout to 5 seconds for more responsive UI
      
      // For non-native (ERC20) tokens
      const newBalances: {[key: string]: string} = {};
      
      // IMPORTANT: Only fetch tokens currently in use (high priority)
      const tokensToFetch: Token[] = [];
      
      // If forceRefresh = true, always refresh active tokens in the swap
      if (forceRefresh) {
        if (fromToken.address !== "native") {
          tokensToFetch.push(fromToken);
        }
        if (toToken.address !== "native" && toToken.address !== fromToken.address) {
          tokensToFetch.push(toToken);
        }
      } 
      // If not forced refresh, only fetch tokens not in cache
      else {
        // Only fetch tokens active in UI to reduce RPC calls
        if (fromToken.address !== "native" && !tokenBalances[fromToken.address]) {
          tokensToFetch.push(fromToken);
        }
        
        if (toToken.address !== "native" && !tokenBalances[toToken.address] && 
            toToken.address !== fromToken.address) {
          tokensToFetch.push(toToken);
        }
      }
      
      // If no tokens to fetch, we're done
      if (tokensToFetch.length === 0) {
        clearTimeout(fetchTimeout);
        setIsLoadingBalances(false);
        setLastUpdated(new Date());
        return;
      }
      
      // Membuat fungsi balanceOf contract call dengan timeout
      const getTokenBalance = async (token: Token): Promise<string | null> => {
        try {
          const tokenContract = {
            abi: [{
              inputs: [{ name: 'account', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            }] as const,
            address: token.address as Address,
          };
          
          // Sederhanakan panggilan readContract untuk menghindari masalah dengan getConfig()
          const config = getConfig();
          if (!config) {
            throw new Error('Config not available');
          }
          
          // Gunakan race dengan timeout 3 detik
          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('Balance fetch timeout')), 3000);
          });
          
          const balancePromise = readContract(config, {
            ...tokenContract,
            functionName: 'balanceOf',
            args: [address],
          });
          
          const balance = await Promise.race([balancePromise, timeoutPromise]) as bigint;
          
          // Tentukan decimals berdasarkan token
          let decimals = token.decimals || 18;
          
          // Jika tidak ada decimals di token object, gunakan ketentuan berikut
          if (!token.decimals) {
            if (token.symbol === "USDC" || token.symbol === "USDT") {
              decimals = 6;
            } else if (token.symbol === "WBTC") {
              decimals = 8;
            }
          }
          
          return formatUnits(balance, decimals);
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          return null;
        }
      };
      
      // Fetch satu per satu untuk menghindari rate limit
      for (const token of tokensToFetch) {
        const balance = await getTokenBalance(token);
        if (balance !== null) {
          newBalances[token.address] = balance;
        }
      }
      
      // Update balances jika ada
      if (Object.keys(newBalances).length > 0) {
        setTokenBalances(prev => ({ ...prev, ...newBalances }));
      }
      
      // Clear timeout
      clearTimeout(fetchTimeout);
      setIsLoadingBalances(false);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setIsLoadingBalances(false);
    }
  }, [address, isConnected, fromToken, toToken, tokenBalances]);
  
  // Ubah efek untuk hanya me-refresh balance ketika token berubah
  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
    }
  }, [fetchTokenBalances, isConnected, address, fromToken.address, toToken.address]);

  // Tambahkan ref untuk debounce timer
  const updateAmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get output amount when input changes
  useEffect(() => {
    // Clean up existing timeout
    if (updateAmountTimeoutRef.current) {
      clearTimeout(updateAmountTimeoutRef.current);
    }
    
    // Skip if no amount or tokens
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount("");
      return;
    }

    // Jika ini operasi wrap/unwrap MON/WMON, langsung set output sama dengan input
    if (isMonWmonPair) {
      setToAmount(fromAmount);
      return;
    }

    // Debounce untuk menghindari terlalu banyak API call
    updateAmountTimeoutRef.current = setTimeout(async () => {
      try {
        // Tentukan decimals untuk fromToken
        let fromDecimals = 18; // Default
        if (fromToken.address !== "native") {
          // Cek apakah fromToken adalah USDC atau USDT (6 desimal)
          if (fromToken.address.toLowerCase() === "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea".toLowerCase() || 
              fromToken.address.toLowerCase() === "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D".toLowerCase()) {
            fromDecimals = 6;
          } 
          // Cek apakah fromToken adalah WBTC (8 desimal)
          else if (fromToken.address.toLowerCase() === "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d".toLowerCase()) {
            fromDecimals = 8;
          }
        }

        if (fromToken.address === "native") {
          // Native token to token
          // Gunakan WMON sebagai pengganti native token untuk routing
          const result = await getAmountOut(
            "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" as Address, // WMON
            toToken.address as Address,
            fromAmount,
            18 // WMON selalu 18 desimal
          );
          setToAmount(result);
        } else if (toToken.address === "native") {
          // Token to native
          // Gunakan WMON sebagai pengganti native token untuk routing
          const result = await getAmountOut(
            fromToken.address as Address,
            "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" as Address, // WMON
            fromAmount,
            fromDecimals
          );
          setToAmount(result);
        } else {
          // Token to token
          const result = await getAmountOut(
            fromToken.address as Address,
            toToken.address as Address,
            fromAmount,
            fromDecimals
          );
          setToAmount(result);
        }
      } catch (error) {
        console.error("Error getting output amount:", error);
        setToAmount("");
      }
    }, 500); // Debounce 500ms
    
    // Cleanup 
    return () => {
      if (updateAmountTimeoutRef.current) {
        clearTimeout(updateAmountTimeoutRef.current);
      }
    };
  }, [fromToken, toToken, fromAmount, getAmountOut, isMonWmonPair]);

  // Filter tokens based on search
  useEffect(() => {
    let filtered = tokens;
    if (tokenSearch) {
      filtered = tokens.filter(
        token => 
          token.name.toLowerCase().includes(tokenSearch.toLowerCase()) || 
          token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
          token.address.toLowerCase().includes(tokenSearch.toLowerCase())
      );
    }
    setFilteredTokens(filtered);
  }, [tokenSearch]);

  const handleManualSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualSlippage(value)
    
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 20) {
      setSlippage(numValue)
    }
  }

  const applyManualSlippage = () => {
    const numValue = parseFloat(manualSlippage)
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 20) {
      setSlippage(numValue)
    } else {
      setManualSlippage(slippage.toString())
    }
  }

  const handleSwitch = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }

  const handleSwap = async () => {
    if (!isConnected) {
      return;
    }

    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      // tampilkan pesan error
      return;
    }

    try {
      setIsSwapping(true);
      
      // Hitung minAmountOut dengan mempertimbangkan slippage
      // Pastikan toAmount valid untuk menghindari error
      if (!toAmount || parseFloat(toAmount) <= 0) {
        setIsSwapping(false);
        return;
      }
      
      // Tentukan decimals output untuk perhitungan minAmountOut
      let outputDecimals = 18; // Default
      if (toToken.symbol === "USDC" || toToken.symbol === "USDT") {
        outputDecimals = 6;
      } else if (toToken.symbol === "WBTC") {
        outputDecimals = 8;
      }
      
      const minAmountOut = (parseFloat(toAmount) * (1 - slippage / 100)).toString();
      
      // Alamat WMON dan Zero Address
      const WMON_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" as Address;
      const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
      
      let txHash;

      // Konversi alamat 'native' ke ZERO_ADDRESS untuk validasi
      const fromAddress = fromToken.address === 'native' ? ZERO_ADDRESS : fromToken.address as Address;
      const toAddress = toToken.address === 'native' ? ZERO_ADDRESS : toToken.address as Address;

      // Validasi alamat untuk mencegah error
      if (fromAddress === toAddress) {
        toast({
          title: "Same token error",
          description: "Cannot swap to the same token",
          variant: "destructive",
        });
        setIsSwapping(false);
        return;
      }

      // Kasus khusus untuk WMON <-> MON (wrap/unwrap)
      if (fromAddress === ZERO_ADDRESS && toAddress === WMON_ADDRESS) {
        // Kasus wrap MON -> WMON
        try {
          txHash = await handleWrap(fromAmount);
        } catch (error) {
          console.error("Wrap error:", error);
          throw error;
        }
      } else if (fromAddress === WMON_ADDRESS && toAddress === ZERO_ADDRESS) {
        // Kasus unwrap WMON -> MON
        try {
          txHash = await handleUnwrap(fromAmount);
        } catch (error) {
          console.error("Unwrap error:", error);
          throw error;
        }
      } else if (fromAddress === ZERO_ADDRESS) {
        // MON -> Token (selain WMON)
        const path: Address[] = [WMON_ADDRESS, toAddress];
        txHash = await swapExactNativeForTokens({
          tokenOut: toAddress,
          path,
          amountIn: fromAmount,
          minAmountOut,
          slippage,
        });
      } else if (toAddress === ZERO_ADDRESS) {
        // Token -> MON
        const path: Address[] = [fromAddress, WMON_ADDRESS];
        txHash = await swapExactTokensForNative({
          tokenIn: fromAddress,
          path,
          amountIn: fromAmount,
          minAmountOut,
          slippage,
        });
      } else {
        // Token -> Token
        // Buat path dengan WMON sebagai perantara jika diperlukan
        let path: Address[];
        
        // Gunakan path langsung untuk pasangan dengan likuiditas langsung
        path = [fromAddress, toAddress];
        
        txHash = await swapExactTokensForTokens({
          tokenIn: fromAddress,
          tokenOut: toAddress,
          path,
          amountIn: fromAmount,
          minAmountOut,
          slippage,
        });
      }
      
      if (txHash) {
        console.log("Swap successful with hash:", txHash);
        
        // Menghitung JXP yang didapatkan (1 JXP per 10 MON)
        let jxpEarned = 0;
        const amountInMon = parseFloat(fromAmount);
        
        // Untuk native token (MON) atau WMON, berikan 1 JXP per 10 MON
        if (fromToken.address === 'native' || 
            fromToken.address.toLowerCase() === "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701".toLowerCase()) {
          jxpEarned = Math.floor(amountInMon / 10);
        } else {
          // Untuk token lain, konversi ke nilai MON sesuai rate (disederhanakan)
          // Di implementasi nyata, Anda harus menggunakan oracle harga yang akurat
          jxpEarned = Math.floor(amountInMon / 20); // Asumsi rata-rata token bernilai 2x MON
        }
        
        // Minimal 1 JXP jika melakukan swap
        if (jxpEarned < 1 && amountInMon > 0) jxpEarned = 1;
        
        // Reset form after successful swap
        const fromAmountCopy = fromAmount;
        const toAmountCopy = toAmount;
        const fromTokenCopy = { ...fromToken };
        const toTokenCopy = { ...toToken };
        
        setFromAmount("");
        setToAmount("");
        
        // Refresh balances immediately after swap
        fetchTokenBalances(true);
        
        // Simpan informasi untuk popup
        setSwapTxHash(txHash);
        setSwapJxpEarned(jxpEarned);
        setShowSwapSuccess(true);
        
        // Tambahkan notifikasi sukses
        toast({
          title: "Swap successful",
          description: `Swap ${fromAmountCopy} ${fromTokenCopy.symbol} to ${toAmountCopy} ${toTokenCopy.symbol} successful`
        });
      }
    } catch (error) {
      console.error("Swap error:", error);
      
      // Tampilkan pesan error
      toast({
        title: "Swap failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  }

  // Fungsi untuk menutup popup
  const handleCloseSwapSuccess = () => {
    setShowSwapSuccess(false);
    setTimeout(() => {
      setSwapTxHash("");
      setSwapJxpEarned(0);
    }, 300);
  };

  // Fungsi untuk menguji popup (hanya untuk pengembangan)
  const testSwapPopup = () => {
    const mockTxHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setSwapTxHash(mockTxHash);
    setSwapJxpEarned(10);
    setShowSwapSuccess(true);
  };

  const setPercentage = (percent: number) => {
    if (!isConnected) return;
    
    // Gunakan saldo sebenarnya untuk menghitung persentase
    let balance = "0";
    let decimals = 18; // Default decimals
    
    if (fromToken.address === "native" && nativeBalance) {
      if (isMonWmonPair && isWrapDirection) {
        // Jika ini wrap MON->WMON, sisakan sedikit MON untuk gas
        const maxAmount = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)) - 0.01;
        balance = maxAmount > 0 ? maxAmount.toString() : "0";
      } else {
        balance = formatUnits(nativeBalance.value, nativeBalance.decimals);
      }
      decimals = 18; // MON native selalu 18 desimal
    } else if (tokenBalances[fromToken.address]) {
      balance = tokenBalances[fromToken.address];
      
      // Tentukan decimals berdasarkan token
      if (fromToken.decimals) {
        decimals = fromToken.decimals;
      } else if (fromToken.symbol === "USDC" || fromToken.symbol === "USDT") {
        decimals = 6;
      } else if (fromToken.symbol === "WBTC") {
        decimals = 8;
      }
    } else {
      return; // Tidak dapat mengatur persentase jika tidak ada saldo
    }
    
    try {
      // Hitung amount berdasarkan persentase
      const rawAmount = parseFloat(balance) * (percent / 100);
      
      // Format angka sesuai dengan decimal token
      // - Untuk token dengan decimals kecil (6), tampilkan hingga 6 angka di belakang koma
      // - Untuk token dengan decimals besar (18), tampilkan hingga 8 angka di belakang koma
      let formattedAmount;
      if (decimals <= 6) {
        // Untuk USDC/USDT, tampilkan maks 6 decimal
        formattedAmount = rawAmount.toFixed(6);
      } else if (decimals === 8) {
        // Untuk WBTC, tampilkan maks 8 decimal
        formattedAmount = rawAmount.toFixed(8);
      } else {
        // Untuk token dengan 18 decimals atau lainnya
        formattedAmount = rawAmount.toFixed(8);
      }
      
      // Hilangkan trailing zeros
      formattedAmount = formattedAmount.replace(/\.?0+$/, '');
      
      // Update from amount
      setFromAmount(formattedAmount);
      
      console.log(`Setting ${percent}% of balance: ${balance} ${fromToken.symbol} = ${formattedAmount}`);
    } catch (error) {
      console.error("Error setting percentage:", error);
    }
  }

  const handleAddCustomToken = async () => {
    if (!customTokenAddress || !customTokenAddress.startsWith('0x') || customTokenAddress.length !== 42) {
      return;
    }

    try {
      // In a real implementation, we would fetch token info from the blockchain
      // For now, we'll just add the token with some default values
      const newToken: Token = {
        address: customTokenAddress as Address,
        name: "Custom Token",
        symbol: "CUSTOM",
        decimals: 18,
        icon: "C",
        color: "#607D8B",
      };
      
      // Add the token to the list
      tokens.push(newToken);
      setFilteredTokens(tokens);
      setCustomTokenAddress("");
      
      // Select the new token
      if (showFromTokens) {
        selectFromToken(newToken);
      } else if (showToTokens) {
        selectToToken(newToken);
      }
    } catch (error) {
      console.error("Error adding token:", error);
    }
  }

  const selectFromToken = (token: Token) => {
    if (token.address === toToken.address) {
      setToToken(fromToken);
    }
    setFromToken(token)
    setShowFromTokens(false)
    setTokenSearch("")
  }

  const selectToToken = (token: Token) => {
    if (token.address === fromToken.address) {
      setFromToken(toToken);
    }
    setToToken(token)
    setShowToTokens(false)
    setTokenSearch("")
  }

  // Function to render token selector with better mobile handling
  const renderTokenSelector = (isFrom: boolean) => {
    const currentRef = isFrom ? fromTokensRef : toTokensRef;
    const showTokenList = isFrom ? showFromTokens : showToTokens;
    const selectToken = isFrom ? selectFromToken : selectToToken;
    
    if (!isMounted) return null;
    
    return (
      <>
        {/* Mobile overlay background */}
        {windowWidth < 640 && showTokenList && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-[100]"
            onClick={() => isFrom ? setShowFromTokens(false) : setShowToTokens(false)}
          />
        )}
        
        {showTokenList && (
          <div 
            ref={currentRef}
            className={`${windowWidth < 640 ? 'fixed inset-x-0 bottom-0 top-20 rounded-t-xl z-[110]' : 'absolute right-0 mt-1 w-80 rounded-lg z-[110]'} bg-[#1b1f24] shadow-lg border border-[#343b43] overflow-hidden flex flex-col transition-transform ${isClosingGesture ? 'translate-y-10' : ''}`}
            style={{ minWidth: windowWidth < 640 ? 'auto' : 'calc(100% + 100px)' }}
          >
            {/* Visual indicator for swipe down on mobile */}
            {windowWidth < 640 && (
              <div className="absolute w-full flex justify-center top-2 z-10">
                <div className="w-12 h-1 rounded-full bg-[#343b43] opacity-60"></div>
              </div>
            )}
            
            {/* Header that's more clear on mobile */}
            {windowWidth < 640 && (
              <div 
                className="bg-[#242a31] px-4 py-3 flex justify-between items-center border-b border-[#343b43]"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(isFrom)}
              >
                <div className={`w-16 h-1 bg-[#343b43] mx-auto absolute left-1/2 -translate-x-1/2 -top-3 rounded-full ${isClosingGesture ? 'opacity-100' : 'opacity-50'}`} />
                <h3 className="text-white font-bold text-lg">Select Token {isFrom ? 'From' : 'To'}</h3>
                <button 
                  onClick={() => isFrom ? setShowFromTokens(false) : setShowToTokens(false)}
                  className="bg-[#343b43] rounded-full p-1.5 hover:bg-[#424a55]"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            )}
            
            <div className="p-4 border-b border-[#343b43]">
              {(!windowWidth || windowWidth >= 640) && (
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">Select Token</h4>
                  <button 
                    onClick={() => isFrom ? setShowFromTokens(false) : setShowToTokens(false)}
                    className="text-[#999da1] hover:text-white p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#707070]" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or paste address"
                  value={tokenSearch}
                  onChange={(e) => setTokenSearch(e.target.value)}
                  className="w-full bg-[#343b43] text-white rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
                  autoFocus={windowWidth < 640}
                />
              </div>
            </div>
            
            {/* Popular tokens */}
            <div className="p-4 border-b border-[#343b43]">
              <h5 className="text-[#999da1] text-xs mb-2">Popular Tokens</h5>
              <div className="flex flex-wrap gap-2">
                {tokens
                  .filter(token => token.popular)
                  .map(token => (
                    <button
                      key={token.address}
                      onClick={() => selectToken(token)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        (isFrom ? fromToken : toToken).address === token.address
                          ? 'bg-blue-600'
                          : 'bg-[#343b43] hover:bg-[#394350]'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: token.color }}
                      >
                        <span className="text-white text-xs">{token.icon}</span>
                      </div>
                      <span className="text-white text-sm">{token.symbol}</span>
                    </button>
                  ))}
              </div>
            </div>
            
            {/* All tokens */}
            <div className="overflow-y-auto flex-1">
              {filteredTokens.length === 0 ? (
                <div className="py-6 text-center text-zinc-400">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map(token => (
                  <button
                    key={token.address}
                    onClick={() => selectToken(token)}
                    className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-[#242a31] text-left border-b border-[#343b43] ${
                      (isFrom ? fromToken : toToken).address === token.address
                        ? 'bg-[#213447]'
                        : ''
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: token.color }}
                    >
                      <span className="text-white font-medium">{token.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{token.symbol}</div>
                      <div className="text-[#999da1] text-xs">{token.name}</div>
                    </div>
                    <div className="ml-auto text-xs text-[#999da1] max-w-24 truncate hidden sm:block">
                      {token.address === 'native' ? 'Native' : token.address.substring(0, 6) + '...' + token.address.substring(38)}
                    </div>
                  </button>
                ))
              )}
            </div>
            
            {/* Custom token input */}
            <div className="p-4 border-t border-[#343b43]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste token address"
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  className="w-full bg-[#343b43] text-white rounded-lg px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={handleAddCustomToken}
                  disabled={!customTokenAddress || !customTokenAddress.startsWith('0x') || customTokenAddress.length !== 42}
                  className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded ${
                    !customTokenAddress || !customTokenAddress.startsWith('0x') || customTokenAddress.length !== 42
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Touch Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchMoveY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchMoveY.current = e.touches[0].clientY;
    const diff = touchMoveY.current - touchStartY.current;
    
    // If downward movement is far enough, set closing animation state
    if (diff > 50) {
      setIsClosingGesture(true);
    } else {
      setIsClosingGesture(false);
    }
  };

  const handleTouchEnd = (isFrom: boolean) => {
    const diff = touchMoveY.current - touchStartY.current;
    
    // If downward movement is far enough, close selector
    if (diff > 100) {
      if (isFrom) {
        setShowFromTokens(false);
      } else {
        setShowToTokens(false);
      }
    }
    
    setIsClosingGesture(false);
  };

  return (
    <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      <div className="p-4 sm:p-6">
        {/* Card utama swap */}
        <div className="bg-[#282c34] rounded-lg p-3 sm:p-4 max-w-mobile mx-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-white">JIKU SWAP</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const now = new Date();
                  setLastUpdated(now);
                  fetchTokenBalances(true);
                }}
                className="p-1 hover:bg-[#343b43] rounded-md"
                disabled={isLoadingBalances}
              >
                <RefreshCcw className={`h-4 w-4 ${isLoadingBalances ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-[#343b43] rounded-md"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="text-[#707070] text-xs text-right mb-2">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          
          {/* Settings */}
          {showSettings && (
            <div
              ref={settingsRef}
              className="bg-[#343b43] rounded-md p-3 mb-3"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm">Slippage Tolerance</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-[#282c34] rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => setSlippage(0.1)}
                  className={`px-2 py-1 rounded text-sm ${
                    slippage === 0.1 ? "bg-blue-600" : "bg-[#282c34]"
                  }`}
                >
                  0.1%
                </button>
                <button
                  onClick={() => setSlippage(0.5)}
                  className={`px-2 py-1 rounded text-sm ${
                    slippage === 0.5 ? "bg-blue-600" : "bg-[#282c34]"
                  }`}
                >
                  0.5%
                </button>
                <button
                  onClick={() => setSlippage(1)}
                  className={`px-2 py-1 rounded text-sm ${
                    slippage === 1 ? "bg-blue-600" : "bg-[#282c34]"
                  }`}
                >
                  1.0%
                </button>
                <div className="relative">
                  <input
                    type="text"
                    value={manualSlippage}
                    onChange={handleManualSlippageChange}
                    onBlur={applyManualSlippage}
                    className="w-full px-2 py-1 rounded text-sm bg-[#282c34] text-center"
                    placeholder="Custom"
                  />
                  <span className="absolute right-3 top-1 text-sm">%</span>
                </div>
              </div>
            </div>
          )}
          
          {/* From Token */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#707070]">From</span>
              {isConnected && fromToken && fromToken.address !== 'native' && tokenBalances[fromToken.address] && (
                <span className="text-xs text-[#707070]">
                  Balance: {parseFloat(tokenBalances[fromToken.address]).toFixed(4)}
                </span>
              )}
              {isConnected && fromToken && fromToken.address === 'native' && nativeBalance && (
                <span className="text-xs text-[#707070]">
                  Balance: {parseFloat(formatEther(nativeBalance.value)).toFixed(4)}
                </span>
              )}
            </div>
            <div className="flex bg-[#343b43] rounded-lg p-2 items-center">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal point
                  if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
                    setFromAmount(value);
                    
                    // Debounce update to amount out
                    if (updateToAmountTimeoutRef.current) {
                      clearTimeout(updateToAmountTimeoutRef.current);
                    }
                    
                    updateToAmountTimeoutRef.current = setTimeout(async () => {
                      if (value && parseFloat(value) > 0) {
                        try {
                          // Gunakan WMON_ADDRESS sebagai konstanta
                          const WMON_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" as Address;
                          const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
                          
                          // Ganti 'native' dengan ZERO_ADDRESS
                          const fromAddr = fromToken.address === 'native' ? ZERO_ADDRESS : fromToken.address as Address;
                          const toAddr = toToken.address === 'native' ? ZERO_ADDRESS : toToken.address as Address;
                          
                          const decimalsIn = fromToken.decimals || 18;
                          
                          // Untuk kasus khusus MON->WMON atau WMON->MON, langsung set toAmount = fromAmount
                          if ((fromAddr === ZERO_ADDRESS && toAddr === WMON_ADDRESS) ||
                              (fromAddr === WMON_ADDRESS && toAddr === ZERO_ADDRESS)) {
                            setToAmount(value);
                          } else {
                            const amount = await getAmountOut(fromAddr, toAddr, value, decimalsIn);
                            setToAmount(amount);
                          }
                        } catch (error) {
                          console.error("Error getting amount out:", error);
                        }
                      } else {
                        setToAmount('');
                      }
                    }, 500);
                  }
                }}
                className="bg-transparent border-none outline-none flex-1 text-lg placeholder-[#707070]"
                placeholder="0.0"
              />
              <div className="relative">
                <button
                  onClick={() => setShowFromTokens(!showFromTokens)}
                  className="flex items-center gap-2 bg-[#282c34] px-2 py-1 rounded-lg"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: fromToken.color }}
                  >
                    {fromToken.icon}
                  </div>
                  <span>{fromToken.symbol}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {/* From Token Selector - Responsif */}
                {showFromTokens && renderTokenSelector(true)}
              </div>
            </div>
            {/* Percentage buttons - responsive */}
            <div className="grid grid-cols-4 gap-2 my-2">
              <button
                onClick={() => setPercentage(25)}
                className="py-1 text-xs rounded bg-[#343b43] hover:bg-[#4a535e]"
              >
                25%
              </button>
              <button
                onClick={() => setPercentage(50)}
                className="py-1 text-xs rounded bg-[#343b43] hover:bg-[#4a535e]"
              >
                50%
              </button>
              <button
                onClick={() => setPercentage(75)}
                className="py-1 text-xs rounded bg-[#343b43] hover:bg-[#4a535e]"
              >
                75%
              </button>
              <button
                onClick={() => setPercentage(100)}
                className="py-1 text-xs rounded bg-[#343b43] hover:bg-[#4a535e]"
              >
                100%
              </button>
            </div>
          </div>
          
          {/* Switch button */}
          <div className="flex justify-center -my-2">
            <button
              onClick={handleSwitch}
              className="bg-[#343b43] p-2 rounded-full hover:bg-[#4a535e] z-10"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          
          {/* To Token */}
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#707070]">To</span>
              {isConnected && toToken && toToken.address !== 'native' && tokenBalances[toToken.address] && (
                <span className="text-xs text-[#707070]">
                  Balance: {parseFloat(tokenBalances[toToken.address]).toFixed(4)}
                </span>
              )}
              {isConnected && toToken && toToken.address === 'native' && nativeBalance && (
                <span className="text-xs text-[#707070]">
                  Balance: {parseFloat(formatEther(nativeBalance.value)).toFixed(4)}
                </span>
              )}
            </div>
            <div className="flex bg-[#343b43] rounded-lg p-2 items-center">
              <input
                type="text"
                value={toAmount}
                readOnly
                className="bg-transparent border-none outline-none flex-1 text-lg placeholder-[#707070]"
                placeholder="0.0"
              />
              <div className="relative">
                <button
                  onClick={() => setShowToTokens(!showToTokens)}
                  className="flex items-center gap-2 bg-[#282c34] px-2 py-1 rounded-lg"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: toToken.color }}
                  >
                    {toToken.icon}
                  </div>
                  <span>{toToken.symbol}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {/* To Token Selector - Responsif */}
                {showToTokens && renderTokenSelector(false)}
              </div>
            </div>
          </div>
          
          {/* Rate and slippage info */}
          {fromAmount && parseFloat(fromAmount) > 0 && toAmount && parseFloat(toAmount) > 0 && (
            <div className="mt-3 mb-4 p-2 bg-[#343b43] rounded-md text-xs space-y-1 text-[#c0c0c0]">
              {renderRateInfo()}
            </div>
          )}
          
          {/* Swap button */}
          <div className="mt-4">
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full p-3 text-white font-bold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            ) : (
              <button
                onClick={handleSwap}
                disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !toAmount || parseFloat(toAmount) <= 0 || isPending || isSwapping}
                className={`w-full p-3 text-white font-bold rounded-lg ${
                  !fromAmount || parseFloat(fromAmount) <= 0 || !toAmount || parseFloat(toAmount) <= 0 || isPending || isSwapping
                    ? "bg-[#4a535e] cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800"
                }`}
              >
                {isPending || isSwapping ? "Processing..." : "Swap"}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Render SwapSuccessPopup only if showSwapSuccess=true, not using prop isOpen */}
      {showSwapSuccess && (
        <SwapSuccessPopup 
          onClose={handleCloseSwapSuccess}
          txHash={swapTxHash}
          fromToken={fromToken?.symbol || ""}
          toToken={toToken?.symbol || ""}
          fromAmount={fromAmount || "0"}
          toAmount={toAmount || "0"}
          explorerUrl="https://testnet.monadexplorer.com"
          jxpEarned={swapJxpEarned}
        />
      )}
    </div>
  )
}
