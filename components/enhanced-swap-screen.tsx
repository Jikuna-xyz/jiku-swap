"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { RefreshCcw, Settings, ArrowDown, ChevronDown, X, Search, Info, Loader2, ExternalLink } from "lucide-react"
import Header from "./header"
import { useAccount, useBalance } from 'wagmi'
import { useJikunaSwap } from '@/hooks/useJikunaSwap'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Address, formatUnits, formatEther } from 'viem'
import { readContract } from '@wagmi/core'
import { getConfig } from '@/lib/wagmi'
import { useWMON } from '@/hooks/useWMON'
import { formatNumber } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import SwapSuccessPopup from './SwapSuccessPopup'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog"

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

// Add global cache outside component
const tokenBalanceCache: BalanceCache = {};
const BALANCE_CACHE_DURATION = 30000; // 30 seconds

// Debounce function
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
    
    // Format based on token type
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

export default function EnhancedSwapScreen() {
  const { address, isConnected } = useAccount();
  
  // Native token balance (MON)
  const { data: nativeBalance } = useBalance({
    address,
  });
  
  // Custom token balances
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  // Loading status for token balances
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Debounce timer ref
  const updateToAmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Toast for notifications
  const { toast } = useToast();
  
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [slippage, setSlippage] = useState(0.5)
  const [manualSlippage, setManualSlippage] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [tokenSearch, setTokenSearch] = useState("")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  
  const { getAmountOut, swapExactTokensForTokens, swapExactNativeForTokens, swapExactTokensForNative, isPending } = useJikunaSwap();

  const [fromToken, setFromToken] = useState<Token>({
    symbol: "MON",
    name: "Monad",
    address: "native",
    icon: "M",
    color: "#7e6dd1",
    popular: true,
    decimals: 18
  })

  const [toToken, setToToken] = useState<Token>({
    symbol: "USDC",
    name: "USD Coin",
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    icon: "$",
    color: "#64c0f4",
    popular: true,
    decimals: 6
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

  // SwapSuccessPopup state
  const [showSwapSuccess, setShowSwapSuccess] = useState(false);
  const [swapTxHash, setSwapTxHash] = useState("");
  const [swapJxpEarned, setSwapJxpEarned] = useState(0);

  // Token definitions
  const tokens = useMemo<Token[]>(() => [
    { symbol: "MON", name: "Monad", address: "native", icon: "M", color: "#7e6dd1", popular: true, decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", icon: "$", color: "#64c0f4", popular: true, decimals: 6 },
    { symbol: "USDT", name: "Tether", address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", icon: "$", color: "#26a17b", popular: true, decimals: 6 },
    { symbol: "WMON", name: "Wrapped Monad", address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701", icon: "W", color: "#7e6dd1", popular: true, decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ethereum", address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37", icon: "E", color: "#627eea", popular: true, decimals: 18 },
    { symbol: "aprMON", name: "April Monad", address: "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A", icon: "A", color: "#ff9900", decimals: 18 },
    { symbol: "DAK", name: "Daku Finance", address: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714", icon: "D", color: "#f0b90b", decimals: 18 },
    { symbol: "COHG", name: "Coinhunters", address: "0xE0590015A873bF326bd645c3E1266d4db41C4E6B", icon: "C", color: "#e84142", decimals: 18 },
    { symbol: "YAKI", name: "Yakitori", address: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50", icon: "Y", color: "#f3ba2f", decimals: 18 },
    { symbol: "shMON", name: "Sharded Monad", address: "0x3a98250F98Dd388C211206983453837C8365BDc1", icon: "S", color: "#8247e5", decimals: 18 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d", icon: "B", color: "#f7931a", decimals: 8 },
  ], []);

  // Handle wrap/unwrap
  const handleWrapUnwrap = async () => {
    if (fromToken.symbol === "MON" && toToken.symbol === "WMON") {
      await handleWrap(fromAmount);
    } else if (fromToken.symbol === "WMON" && toToken.symbol === "MON") {
      await handleUnwrap(fromAmount);
    }
  };

  // Set up resize listener
  useEffect(() => {
    setIsMounted(true)
    setWindowWidth(window.innerWidth)
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Rate info with proper formatting
  const renderRateInfo = () => {
    if (!fromAmount || !toAmount || parseFloat(fromAmount) === 0 || parseFloat(toAmount) === 0) {
      return null;
    }
    
    const rate = formatRate(fromToken, toToken, fromAmount, toAmount);
    const minReceived = formatMinReceived(toAmount, slippage, toToken);
    const priceImpact = "< 0.01%"; // Simplified for demo purposes
    
    return (
      <div className="mt-4 p-3 bg-black/10 rounded-lg text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Rate</span>
          <span className="text-white font-medium">
            1 {fromToken.symbol} = {rate} {toToken.symbol}
          </span>
        </div>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">Minimum received</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Info size={14} className="text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-64 text-xs">
                    The minimum amount you will receive after slippage tolerance is applied. If the price changes unfavorably by more than your slippage tolerance, your transaction will revert.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-white font-medium">
            {minReceived} {toToken.symbol}
          </span>
        </div>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">Price impact</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Info size={14} className="text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-64 text-xs">
                    The difference between the market price and estimated price due to trade size.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-green-500 font-medium">{priceImpact}</span>
        </div>
        
        <div className="flex justify-between">
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">Slippage tolerance</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Info size={14} className="text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-64 text-xs">
                    Your transaction will revert if the price changes unfavorably by more than this percentage.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-white font-medium">{slippage}%</span>
        </div>
      </div>
    );
  };

  // Get token balance
  const getTokenBalance = async (token: Token): Promise<string | null> => {
    if (!isConnected || !address) {
      // Jika belum terkoneksi, return default '0'
      return '0';
    }

    // Validasi dasar untuk alamat token
    if (!token || !token.address || typeof token.address !== 'string') {
      console.warn("getTokenBalance: Invalid token or token address provided.", token);
      return '0';
    }
    
    // Buat cache key
    const cacheKey = `${address?.toLowerCase() || ''}-${token.address.toLowerCase()}`;
    const cachedBalance = tokenBalanceCache[cacheKey];
    
    if (cachedBalance && (Date.now() - cachedBalance.timestamp < BALANCE_CACHE_DURATION)) {
      return cachedBalance.value;
    }
    
    try {
      // Native token (MON)
      if (token.address === 'native') {
        if (nativeBalance) {
          const formattedBalance = formatEther(nativeBalance.value);
          tokenBalanceCache[cacheKey] = {
            value: formattedBalance,
            timestamp: Date.now()
          };
          return formattedBalance;
        }
        console.warn("getTokenBalance: Native balance data not available.");
        return '0'; // Return '0' instead of null
      }
      
      // ERC20 tokens
      const config = getConfig();
      if (!config) {
        console.error("getTokenBalance: Wagmi config is undefined.");
        return '0'; // Return '0' instead of null
      }

      // Pastikan alamat pengguna (dari useAccount) dan alamat token adalah string yang valid
      if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
        console.error("getTokenBalance: Invalid user address format.");
        return '0'; // Return '0' instead of null
      }
      if (typeof token.address !== 'string' || !token.address.startsWith('0x')) {
        console.error("getTokenBalance: Invalid token contract address format.");
        return '0'; // Return '0' instead of null
      }
      
      const tokenAbi = [{
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }] as const;
      
      // Tambahkan timeout untuk readContract
      const readContractWithTimeout = async () => {
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Token balance request timeout'));
          }, 5000); // 5 detik timeout
        });
        
        const readPromise = readContract(config, {
          address: token.address as Address,
          abi: tokenAbi,
          functionName: 'balanceOf',
          args: [address],
        });
        
        return Promise.race([readPromise, timeoutPromise]);
      };
      
      // Gunakan fungsi dengan timeout
      const result = await readContractWithTimeout();
      if (!result) {
        // Timeout atau null result
        return '0';
      }
      
      const balance = result as bigint;
      const decimals = token.decimals || 18;
      const formattedBalance = formatUnits(balance, decimals);
      
      tokenBalanceCache[cacheKey] = {
        value: formattedBalance,
        timestamp: Date.now()
      };
      
      return formattedBalance;
    } catch (error) {
      console.error(`Error fetching ${token.symbol} balance:`, error);
      // Tidak perlu menampilkan toast untuk setiap error, cukup log ke console
      return '0'; // Return '0' instead of null
    }
  };

  // Get from token balance with fallback for rendering
  const getFromTokenBalance = useCallback(() => {
    // Buat fungsi return string untuk UI
    if (!isConnected) return "0.00";
    
    // Return placeholder jika loading atau belum tersedia
    if (!tokenBalances[fromToken.address]) {
      return "0.00";
    }
    
    const balance = tokenBalances[fromToken.address];
    return parseFloat(balance).toFixed(6);
  }, [isConnected, tokenBalances, fromToken]);
  
  // Fungsi untuk memuat saldo token
  const loadTokenBalance = useCallback(async (token: Token) => {
    try {
      const balance = await getTokenBalance(token);
      if (balance) {
        setTokenBalances(prev => ({
          ...prev,
          [token.address]: balance
        }));
      }
      return balance;
    } catch (error) {
      console.error(`Error loading ${token.symbol} balance:`, error);
      return '0';
    }
  }, []);

  // Load from token balance on mount and when token changes
  useEffect(() => {
    if (isConnected && fromToken) {
      loadTokenBalance(fromToken);
    }
  }, [isConnected, fromToken, loadTokenBalance]);

  // Fungsi untuk mendapatkan saldo token yang telah di-cache
  const getFormattedTokenBalance = (token: Token) => {
    const balance = tokenBalances[token.address];
    return balance ? parseFloat(balance).toFixed(4) : "0.0000";
  };

  // Switch tokens
  const handleSwitch = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // Handle swap
  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to swap tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to swap",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSwapping(true);
      
      // Special case for wrapping/unwrapping MON
      if ((fromToken.symbol === "MON" && toToken.symbol === "WMON") || 
          (fromToken.symbol === "WMON" && toToken.symbol === "MON")) {
        await handleWrapUnwrap();
        setIsSwapping(false);
        return;
      }
      
      // Calculate minimum amount out based on slippage
      if (!toAmount) {
        throw new Error("Output amount not calculated");
      }
      
      const minAmountOutValue = parseFloat(toAmount) * (1 - slippage / 100);
      const minAmountOutStr = minAmountOutValue.toString();
      
      let txHash;
      
      // Deadline 20 minutes from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
      
      // Ensure address is properly formatted as `0x${string}`
      const getHexAddress = (addr: string): `0x${string}` => {
        if (addr === "native") return "0x0000000000000000000000000000000000000000" as `0x${string}`;
        return addr as `0x${string}`;
      };
      
      // MON -> Token
      if (fromToken.address === "native") {
        txHash = await swapExactNativeForTokens({
          tokenOut: getHexAddress(toToken.address),
          amountIn: fromAmount,
          minAmountOut: minAmountOutStr,
          deadline,
          slippage
        });
      } 
      // Token -> MON
      else if (toToken.address === "native") {
        txHash = await swapExactTokensForNative({
          tokenIn: getHexAddress(fromToken.address),
          amountIn: fromAmount,
          minAmountOut: minAmountOutStr,
          deadline,
          slippage
        });
      } 
      // Token -> Token
      else {
        txHash = await swapExactTokensForTokens({
          tokenIn: getHexAddress(fromToken.address),
          tokenOut: getHexAddress(toToken.address),
          amountIn: fromAmount,
          minAmountOut: minAmountOutStr,
          deadline,
          slippage
        });
      }
      
      if (txHash) {
        // Show success popup
        setSwapTxHash(txHash ? (typeof txHash === 'string' ? txHash : String(txHash)) : '');
        setSwapJxpEarned(Math.floor(Math.random() * 20) + 1); // Mock JXP earned
        setShowSwapSuccess(true);
        
        // Reset form after success
        setFromAmount("");
        setToAmount("");
        
        toast({
          title: "Swap successful",
          description: `Successfully swapped ${fromAmount} ${fromToken.symbol} to approximately ${toAmount} ${toToken.symbol}`,
        });
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast({
        title: "Swap failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Close swap success popup
  const handleCloseSwapSuccess = () => {
    setShowSwapSuccess(false);
  };

  // Set percentage of balance
  const setPercentage = (percent: number) => {
    if (!isConnected) return;
    
    getTokenBalance(fromToken).then(balance => {
      if (balance) {
        const amount = (parseFloat(balance) * percent).toString();
        setFromAmount(amount);
        
        // Update to amount based on from amount
        if (updateToAmountTimeoutRef.current) {
          clearTimeout(updateToAmountTimeoutRef.current);
        }
        
        updateToAmountTimeoutRef.current = setTimeout(() => {
          updateToAmount(amount);
        }, 500);
      }
    });
  };

  // Update to amount based on from amount
  const updateToAmount = async (amount: string) => {
    if (!amount || parseFloat(amount) === 0) {
      setToAmount("");
      return;
    }
    
    // Special case for wrapping/unwrapping
    if (fromToken.symbol === "MON" && toToken.symbol === "WMON") {
      setToAmount(amount);
      return;
    } else if (fromToken.symbol === "WMON" && toToken.symbol === "MON") {
      setToAmount(amount);
      return;
    }
    
    try {
      // Format addresses as 0x-prefixed hexadecimal strings
      const getHexAddress = (addr: string): `0x${string}` => {
        if (addr === "native") {
          return "0x0000000000000000000000000000000000000000" as `0x${string}`;
        }
        // Ensure it has 0x prefix and cast to the required type
        return addr.startsWith('0x') ? addr as `0x${string}` : `0x${addr}` as `0x${string}`;
      };
      
      // Get output amount from contract
      const outputAmount = await getAmountOut(
        getHexAddress(fromToken.address), // tokenIn
        getHexAddress(toToken.address),   // tokenOut
        amount,                           // amountIn
        fromToken.decimals ?? 18          // decimalsIn
      );
      
      setToAmount(outputAmount);
    } catch (error) {
      console.error("Error getting output amount:", error);
      // Don't update to amount if there's an error
    }
  };

  // Handle from amount change
  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromAmount(value);
    
    // Debounce to avoid too many contract calls
    if (updateToAmountTimeoutRef.current) {
      clearTimeout(updateToAmountTimeoutRef.current);
    }
    
    updateToAmountTimeoutRef.current = setTimeout(() => {
      updateToAmount(value);
    }, 500);
  };

  // Select from token
  const selectFromToken = (token: Token) => {
    setFromToken(token);
    setShowTokenSelector(null);
    setFromAmount("");
    setToAmount("");
  };

  // Select to token
  const selectToToken = (token: Token) => {
    setToToken(token);
    setShowTokenSelector(null);
    setFromAmount("");
    setToAmount("");
  };

  // Filter tokens on search
  useEffect(() => {
    const filtered = tokens.filter(token => 
      token.name.toLowerCase().includes(tokenSearch.toLowerCase()) || 
      token.symbol.toLowerCase().includes(tokenSearch.toLowerCase())
    );
    setFilteredTokens(filtered);
  }, [tokenSearch, tokens]);

  // Memoize rate info to prevent unnecessary re-renders
  const rateInfo = useMemo(() => renderRateInfo(), [fromAmount, toAmount, fromToken, toToken, slippage]);

  // Memuat saldo token saat token selector dibuka
  useEffect(() => {
    if (showTokenSelector && isConnected) {
      setIsLoadingBalances(true);
      
      // Hanya muat saldo untuk token yang ditampilkan (filtered)
      Promise.all(filteredTokens.map(token => loadTokenBalance(token)))
        .finally(() => {
          setIsLoadingBalances(false);
        });
    }
  }, [showTokenSelector, filteredTokens, loadTokenBalance, isConnected]);

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-gradient-to-b from-[#0f172a] to-[#1e293b]" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      
      <div className="px-4 sm:px-6 py-4 flex-grow flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-black/20 backdrop-blur-lg border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-white">Swap</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
            <CardDescription className="text-gray-400">
              Trade tokens instantly with low fees
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Settings Panel */}
            {showSettings && (
              <div className="mb-4 p-3 bg-black/20 rounded-lg">
                <h3 className="font-medium text-white mb-2">Slippage Tolerance</h3>
                <div className="flex gap-2 mb-3">
                  <Button 
                    variant={slippage === 0.1 ? "secondary" : "outline"} 
                    size="sm" 
                    onClick={() => setSlippage(0.1)}
                    className="flex-1"
                  >
                    0.1%
                  </Button>
                  <Button 
                    variant={slippage === 0.5 ? "secondary" : "outline"} 
                    size="sm" 
                    onClick={() => setSlippage(0.5)}
                    className="flex-1"
                  >
                    0.5%
                  </Button>
                  <Button 
                    variant={slippage === 1.0 ? "secondary" : "outline"} 
                    size="sm" 
                    onClick={() => setSlippage(1.0)}
                    className="flex-1"
                  >
                    1.0%
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Custom"
                    value={manualSlippage}
                    onChange={(e) => setManualSlippage(e.target.value)}
                    className="w-full"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const value = parseFloat(manualSlippage);
                      if (!isNaN(value) && value > 0) {
                        setSlippage(value);
                      }
                    }}
                  >
                    Set
                  </Button>
                </div>
              </div>
            )}
            
            {/* From Token */}
            <div className="mb-2 p-4 bg-black/20 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-400">From</div>
                {isConnected && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1 py-0 text-gray-400 hover:text-white"
                      onClick={async () => {
                        if (fromToken) {
                          await loadTokenBalance(fromToken);
                          if (toToken) await loadTokenBalance(toToken);
                          setLastUpdated(new Date());
                        }
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                    <div className="text-sm text-gray-400">
                      {tokenBalances[fromToken.address] 
                        ? parseFloat(tokenBalances[fromToken.address]).toFixed(6)
                        : "0.000000"
                      }
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-1 h-auto bg-black/30 hover:bg-black/40"
                  onClick={() => setShowTokenSelector('from')}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: fromToken.color }}
                  >
                    {fromToken.icon}
                  </div>
                  <span className="text-white">{fromToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  className="flex-grow bg-transparent text-right text-lg font-medium text-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              
              {isConnected && (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setPercentage(0.25)} className="flex-1">
                    25%
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPercentage(0.5)} className="flex-1">
                    50%
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPercentage(0.75)} className="flex-1">
                    75%
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPercentage(1)} className="flex-1">
                    100%
                  </Button>
                </div>
              )}
            </div>
            
            {/* Switch Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-10 h-10 p-0 border border-gray-700 bg-[#1e293b]"
                onClick={handleSwitch}
              >
                <ArrowDown className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
            
            {/* To Token */}
            <div className="p-4 bg-black/20 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-400">To</div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-1 h-auto bg-black/30 hover:bg-black/40"
                  onClick={() => setShowTokenSelector('to')}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: toToken.color }}
                  >
                    {toToken.icon}
                  </div>
                  <span className="text-white">{toToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="flex-grow bg-transparent text-right text-lg font-medium text-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            
            {/* Rate Info */}
            {rateInfo}
            
            {/* Swap Button */}
            <div className="mt-4">
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    return (
                      <Button 
                        className="w-full py-6 text-base font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={openConnectModal}
                      >
                        Connect Wallet
                      </Button>
                    )
                  }}
                </ConnectButton.Custom>
              ) : (
                <Button
                  className="w-full py-6 text-base font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                  onClick={handleSwap}
                  disabled={
                    isSwapping || 
                    !fromAmount || 
                    parseFloat(fromAmount) === 0 || 
                    !toAmount || 
                    parseFloat(toAmount) === 0
                  }
                >
                  {isSwapping ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Swapping...
                    </>
                  ) : (
                    "Swap"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-0 text-sm text-gray-500">
            <p>Powered by Jikuna Protocol</p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Token Selector Dialog */}
      <Dialog open={showTokenSelector !== null} onOpenChange={() => setShowTokenSelector(null)}>
        <DialogContent className="sm:max-w-md bg-[#1e293b] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Select Token</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a token from the list or search by name or address
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or address..."
                className="pl-10 bg-black/20 border-gray-700"
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto pr-1">
              {filteredTokens.map((token) => (
                <div 
                  key={token.address}
                  className="flex items-center justify-between p-3 hover:bg-black/20 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    if (showTokenSelector === 'from') {
                      selectFromToken(token);
                    } else {
                      selectToToken(token);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: token.color }}
                    >
                      {token.icon}
                    </div>
                    <div>
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  
                  {isConnected && (
                    <div className="text-right">
                      <div className="text-sm font-mono text-gray-300">
                        {isLoadingBalances ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : (
                          getFormattedTokenBalance(token)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Swap Success Popup */}
      {showSwapSuccess && (
        <SwapSuccessPopup
          txHash={swapTxHash}
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={fromAmount}
          toAmount={toAmount}
          jxpEarned={swapJxpEarned}
          onClose={handleCloseSwapSuccess}
        />
      )}
    </div>
  );
} 