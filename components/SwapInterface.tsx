"use client";

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { useJikunaSwap } from '@/hooks/useJikunaSwap';
import { MOCK_TOKENS, TokenInfo, TOKEN_ADDRESSES } from '@/config/contracts';
import { WalletConnector } from './WalletConnector';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, Search, X, Plus, ExternalLink, Info } from 'lucide-react';
import { useJikunaXPUpdate } from '@/hooks/useJikunaXPUpdate';
import { parseUnits } from 'viem';
import SwapSuccessPopup from './SwapSuccessPopup';

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// Token populer yang akan ditampilkan di bagian atas
const POPULAR_TOKENS = MOCK_TOKENS.slice(0, 5);

export function SwapInterface() {
  // State untuk komponen yang sudah di-mount
  const [mounted, setMounted] = useState(false);

  // Setel state mounted setelah render pertama
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use Wagmi hooks only after mounting to prevent hydration errors
  const { address, isConnected } = mounted ? useAccount() : { address: undefined, isConnected: false };
  const { toast } = useToast();
  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('0');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [tokenIn, setTokenIn] = useState<TokenInfo | null>(null);
  const [tokenOut, setTokenOut] = useState<TokenInfo | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [showFromTokenSelect, setShowFromTokenSelect] = useState<boolean>(false);
  const [showToTokenSelect, setShowToTokenSelect] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>(MOCK_TOKENS);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [selectedTokenInfo, setSelectedTokenInfo] = useState<TokenInfo | null>(null);
  const [showTokenInfo, setShowTokenInfo] = useState<boolean>(false);
  
  // State untuk popup sukses swap
  const [showSwapSuccess, setShowSwapSuccess] = useState<boolean>(false);
  const [swapTxHash, setSwapTxHash] = useState<string>('');
  const [jxpEarned, setJxpEarned] = useState<number>(0);
  
  const fromTokenRef = useRef<HTMLDivElement>(null);
  const toTokenRef = useRef<HTMLDivElement>(null);
  const tokenInfoRef = useRef<HTMLDivElement>(null);

  const {
    getAmountOut,
    swapExactTokensForTokens,
    swapExactNativeForTokens,
    swapExactTokensForNative,
    isPending,
  } = mounted ? useJikunaSwap() : {
    getAmountOut: async () => '0',
    swapExactTokensForTokens: async () => null,
    swapExactNativeForTokens: async () => null,
    swapExactTokensForNative: async () => null,
    isPending: false
  };

  const { updateJXP } = mounted ? useJikunaXPUpdate() : { updateJXP: async () => null };

  useEffect(() => {
    if (MOCK_TOKENS.length >= 2) {
      setTokenIn(MOCK_TOKENS[0]);  // Default MON
      setTokenOut(MOCK_TOKENS[1]);  // Default USDC
    }
  }, []);

  // Clean up saat komponen di-unmount
  useEffect(() => {
    return () => {
      // Memastikan popup ditutup saat navigasi halaman
      setShowSwapSuccess(false);
    }
  }, []);

  useEffect(() => {
    const updateOutputAmount = async () => {
      if (!mounted || !tokenIn || !tokenOut || !inputAmount || parseFloat(inputAmount) === 0) {
        setOutputAmount('0');
        return;
      }

      try {
        const amount = await getAmountOut(
          tokenIn.address,
          tokenOut.address,
          inputAmount,
          tokenIn.decimals
        );
        setOutputAmount(amount);
      } catch (error) {
        console.error('Error getting output amount:', error);
        setOutputAmount('0');
      }
    };

    updateOutputAmount();
  }, [tokenIn, tokenOut, inputAmount, getAmountOut, mounted]);

  // Filter token berdasarkan pencarian
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTokens(MOCK_TOKENS);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = MOCK_TOKENS.filter(
      token => 
        token.symbol.toLowerCase().includes(query) || 
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    );
    setFilteredTokens(filtered);
  }, [searchQuery]);

  // Close token selectors when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fromTokenRef.current && !fromTokenRef.current.contains(event.target as Node)) {
        setShowFromTokenSelect(false);
      }
      if (toTokenRef.current && !toTokenRef.current.contains(event.target as Node)) {
        setShowToTokenSelect(false);
      }
      if (tokenInfoRef.current && !tokenInfoRef.current.contains(event.target as Node)) {
        setShowTokenInfo(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to calculate JXP earned from swap
  const calculateJXPEarned = (amount: string, decimals: number): number => {
    // Convert to a common unit (e.g., MON equivalent)
    const tokenAmount = parseFloat(amount);
    
    // Calculate JXP: 1 JXP per 0.1 token with minimum 10 MON volume
    if (tokenAmount >= 10) {
      return Math.floor(tokenAmount * 10); // 1 JXP per 0.1 token
    }
    return 0;
  };

  // Move the state update for success popup to a separate function
  const showSwapSuccessPopup = (hash: string, earnedJxp: number) => {
    console.log("🎉 Menampilkan popup sukses swap:", hash, earnedJxp);
    // Update state langsung tanpa setTimeout yang mungkin menyebabkan masalah
    setSwapTxHash(hash);
    setJxpEarned(earnedJxp);
    setShowSwapSuccess(true);
    console.log("Popup sudah diset untuk ditampilkan:", { showSwapSuccess: true, hash, earnedJxp });
  };

  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to make a swap.',
        variant: 'destructive',
      });
      return;
    }

    if (!tokenIn || !tokenOut || !inputAmount || parseFloat(inputAmount) === 0) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a valid input amount.',
        variant: 'destructive',
      });
      return;
    }

    if (parseFloat(outputAmount) === 0) {
      toast({
        title: 'Invalid output',
        description: 'Calculated output is 0. Please check your input.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validasi alamat token untuk mencegah error ZERO_ADDRESS dan IDENTICAL_ADDRESSES
    if (tokenIn.address === tokenOut.address) {
      toast({
        title: 'Same tokens',
        description: 'Cannot swap to the same token',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSwapping(true);

      // Hitung minAmountOut dengan slippage
      const minAmountOut = (
        parseFloat(outputAmount) * (1 - slippage / 100)
      ).toString();

      let hash;

      // Kasus khusus untuk native <-> WMON (wrap/unwrap)
      if (tokenIn.address === NATIVE_ADDRESS && tokenOut.address === TOKEN_ADDRESSES.WMON) {
        // Implementasi wrap MON -> WMON dapat ditambahkan di sini
        toast({
          title: 'Menggunakan SWAP untuk wrap',
          description: 'Gunakan fungsi wrap khusus untuk operasi ini'
        });
      } else if (tokenIn.address === TOKEN_ADDRESSES.WMON && tokenOut.address === NATIVE_ADDRESS) {
        // Implementasi unwrap WMON -> MON dapat ditambahkan di sini
        toast({
          title: 'Menggunakan SWAP untuk unwrap',
          description: 'Gunakan fungsi unwrap khusus untuk operasi ini'
        });
      } else if (tokenIn.address === NATIVE_ADDRESS) {
        // Swap MON -> Token
        // Validasi alamat tokenOut
        if (tokenOut.address === NATIVE_ADDRESS) {
          throw new Error('Tidak dapat swap native ke native token');
        }
        // Menentukan path yang valid dengan WMON sebagai perantara
        const path = [TOKEN_ADDRESSES.WMON, tokenOut.address];
        
        hash = await swapExactNativeForTokens({
          tokenOut: tokenOut.address,
          amountIn: inputAmount,
          minAmountOut,
          path,
          slippage,
        });
      } else if (tokenOut.address === NATIVE_ADDRESS) {
        // Swap Token -> MON
        // Validasi alamat tokenIn
        if (tokenIn.address === NATIVE_ADDRESS) {
          throw new Error('Tidak dapat swap native ke native token');
        }
        // Menentukan path yang valid dengan WMON sebagai perantara
        const path = [tokenIn.address, TOKEN_ADDRESSES.WMON];
        
        hash = await swapExactTokensForNative({
          tokenIn: tokenIn.address,
          amountIn: inputAmount,
          minAmountOut,
          path,
          slippage,
        });
      } else {
        // Swap Token -> Token
        // Validasi alamat untuk mencegah error
        if (tokenIn.address === NATIVE_ADDRESS || tokenOut.address === NATIVE_ADDRESS) {
          throw new Error('Alamat token tidak valid');
        }
        
        // Menggunakan path langsung untuk token-to-token swap
        const path = [tokenIn.address, tokenOut.address];
        
        hash = await swapExactTokensForTokens({
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amountIn: inputAmount,
          minAmountOut,
          path,
          slippage,
        });
      }

      if (hash) {
        console.log("✅ Swap berhasil dengan hash:", hash);
        
        // Hitung JXP yang diperoleh
        const earned = calculateJXPEarned(inputAmount, tokenIn.decimals);
        console.log("🎮 JXP yang diperoleh:", earned);
        
        // Update JXP user
        try {
          // Konversi inputAmount menjadi bigint dengan mempertimbangkan decimal
          const amountBigInt = parseUnits(inputAmount, tokenIn.decimals);
          // Update JXP secara asynchronous, tapi tidak perlu menunggu
          updateJXP(amountBigInt).catch(err => console.error('JXP update error:', err));
        } catch (error) {
          console.error('Error updating JXP:', error);
        }

        // Reset form sebelum menampilkan popup
        const inputAmountCopy = inputAmount;
        const outputAmountCopy = outputAmount;
        
        setInputAmount('');
        setOutputAmount('0');
        
        // Tampilkan popup sukses swap dengan nilai yang disimpan sebelumnya
        showSwapSuccessPopup(hash, earned);
      }
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: 'Swap Failed',
        description: error instanceof Error ? error.message : 'An error occurred during the swap.',
        variant: 'destructive',
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSwitchTokens = () => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setInputAmount('');
    setOutputAmount('0');
  };

  const openTokenSelector = (isFrom: boolean) => {
    if (isFrom) {
      setShowFromTokenSelect(true);
      setShowToTokenSelect(false);
    } else {
      setShowToTokenSelect(true);
      setShowFromTokenSelect(false);
    }
    setShowTokenInfo(false);
    setSearchQuery('');
    setFilteredTokens(MOCK_TOKENS);
  };

  const selectToken = (token: TokenInfo, isFrom: boolean) => {
    if (isFrom) {
      if (tokenOut && token.address === tokenOut.address) {
        // Jika token sama dengan tokenOut, tukar mereka
        setTokenOut(tokenIn);
      }
      setTokenIn(token);
      setShowFromTokenSelect(false);
    } else {
      if (tokenIn && token.address === tokenIn.address) {
        // Jika token sama dengan tokenIn, tukar mereka
        setTokenIn(tokenOut);
      }
      setTokenOut(token);
      setShowToTokenSelect(false);
    }
    setInputAmount('');
    setOutputAmount('0');
  };

  const handleAddCustomToken = async () => {
    if (!customTokenAddress || !customTokenAddress.startsWith('0x') || customTokenAddress.length !== 42) {
      toast({
        title: 'Invalid Token Address',
        description: 'Please enter a valid token contract address',
        variant: 'destructive',
      });
      return;
    }

    // Pada implementasi nyata, kita akan mengambil informasi token dari blockchain
    // Untuk sekarang, hanya menampilkan pesan sukses
    toast({
      title: 'Token Successfully Added',
      description: `Token with address ${customTokenAddress} has been added`,
    });
    setCustomTokenAddress('');
  };

  const openTokenInfo = (token: TokenInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTokenInfo(token);
    setShowTokenInfo(true);
  };

  const handleCloseSwapSuccess = () => {
    console.log("Closing swap success popup");
    // Reset semua state yang berkaitan dengan popup
    setShowSwapSuccess(false);
    // Tambahkan delay kecil sebelum reset data lainnya
    setTimeout(() => {
      setSwapTxHash('');
      setJxpEarned(0);
    }, 300);
  };

  const testSwapPopup = () => {
    const mockHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    console.log("Testing swap popup dengan hash:", mockHash);
    showSwapSuccessPopup(mockHash, 100);
  };

  const TokenSelector = ({ isFrom }: { isFrom: boolean }) => {
    const currentToken = isFrom ? tokenIn : tokenOut;
    
    return (
      <div className="relative" ref={isFrom ? fromTokenRef : toTokenRef}>
        <button
          onClick={() => openTokenSelector(isFrom)}
          className="flex items-center gap-2 p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-medium"
        >
          {currentToken && (
            <>
              {currentToken.logoURI ? (
                <img 
                  src={currentToken.logoURI} 
                  alt={currentToken.symbol} 
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                  {currentToken.symbol.charAt(0)}
                </div>
              )}
              <span>{currentToken.symbol}</span>
            </>
          )}
          <ChevronDown size={18} />
        </button>

        {((isFrom && showFromTokenSelect) || (!isFrom && showToTokenSelect)) && (
          <div className="absolute mt-2 p-4 bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 z-50 w-72 right-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-medium">Select Token</h3>
              <button 
                onClick={() => isFrom ? setShowFromTokenSelect(false) : setShowToTokenSelect(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Search bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Search name or paste address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-700 pl-10 pr-4 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Popular tokens */}
            <div className="mb-4">
              <h5 className="text-zinc-400 text-xs mb-2">Popular Tokens</h5>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TOKENS.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => selectToken(token, isFrom)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      currentToken?.address === token.address
                        ? 'bg-blue-600'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    {token.logoURI ? (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol} 
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs">{token.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Token list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredTokens.length === 0 ? (
                <div className="py-3 text-center text-zinc-400 text-sm">
                  No tokens found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => selectToken(token, isFrom)}
                      className={`flex items-center gap-3 w-full px-3 py-2 hover:bg-zinc-700 rounded-lg text-left ${
                        currentToken?.address === token.address ? 'bg-zinc-700' : ''
                      }`}
                    >
                      {token.logoURI ? (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-white font-medium">{token.symbol}</div>
                        <div className="text-zinc-400 text-xs">{token.name}</div>
                      </div>
                      <button
                        onClick={(e) => openTokenInfo(token, e)}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-600 rounded-full"
                      >
                        <Info size={16} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Import token */}
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={14} className="text-zinc-400" />
                <h5 className="text-zinc-400 text-xs">Import Custom Token</h5>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x..."
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  className="flex-1 bg-zinc-700 px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCustomToken}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
                >
                  Import
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                <ExternalLink size={12} />
                <a 
                  href="https://blockscout.monad.xyz/token/search" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-blue-400"
                >
                  View tokens in explorer
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-10 p-6 bg-zinc-900 rounded-2xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Swap Jikuna</h2>
        <div className="mb-4">
          <WalletConnector />
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Token */}
        <div className="p-4 bg-zinc-800 rounded-xl">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-zinc-400">From</label>
            <span className="text-sm text-zinc-400">
              {isConnected ? 'Balance: 0.00' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-semibold text-white focus:outline-none"
              />
            </div>
            <TokenSelector isFrom={true} />
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwitchTokens}
            className="bg-zinc-800 p-2 rounded-full hover:bg-zinc-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400"
            >
              <path d="M17 10H3" />
              <path d="m7 6-4 4 4 4" />
              <path d="M7 14h14" />
              <path d="m17 18 4-4-4-4" />
            </svg>
          </button>
        </div>

        {/* Output Token */}
        <div className="p-4 bg-zinc-800 rounded-xl">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-zinc-400">Ke</label>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={outputAmount}
                readOnly
                className="w-full bg-transparent text-2xl font-semibold text-white focus:outline-none"
              />
            </div>
            <TokenSelector isFrom={false} />
          </div>
        </div>

        {/* Slippage */}
        <div className="p-4 bg-zinc-800 rounded-xl">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-zinc-400">Slippage</label>
            <span className="text-sm text-zinc-400">{slippage}%</span>
          </div>
          
          <div className="flex gap-2 mb-3">
            {[0.5, 1, 2.5, 5, 10].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-2 py-1 text-xs rounded-lg ${
                  slippage === value ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>0.5%</span>
            <span>20%</span>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!isConnected || isSwapping || !inputAmount || parseFloat(inputAmount) === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isConnected
            ? 'Connect Wallet'
            : isSwapping
            ? 'Swapping...'
            : 'Swap'}
        </button>

        {/* Button for testing popup - only in development */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            onClick={testSwapPopup}
            className="w-full mt-2 py-2 px-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500"
          >
            Test Popup (Dev Only)
          </button>
        )}

        {/* Swap Info */}
        {inputAmount && parseFloat(inputAmount) > 0 && outputAmount && parseFloat(outputAmount) > 0 && (
          <div className="p-4 bg-zinc-800 rounded-xl text-sm text-zinc-400">
            <div className="flex justify-between mb-1">
              <span>Rate</span>
              <span>
                1 {tokenIn?.symbol} = {(parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(6)} {tokenOut?.symbol}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Min. Received</span>
              <span>
                {(parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)} {tokenOut?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fee</span>
              <span>0.3%</span>
            </div>
          </div>
        )}
      </div>

      {/* Display swap success popup */}
      {showSwapSuccess && (
        <SwapSuccessPopup
          onClose={handleCloseSwapSuccess}
          txHash={swapTxHash}
          fromToken={tokenIn?.symbol || ''}
          toToken={tokenOut?.symbol || ''}
          fromAmount={inputAmount || '0'}
          toAmount={outputAmount || '0'}
          explorerUrl="https://testnet.monadexplorer.com"
          jxpEarned={jxpEarned}
        />
      )}

      {/* Token Info Modal */}
      {showTokenInfo && selectedTokenInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={tokenInfoRef}
            className="bg-zinc-800 rounded-xl p-5 max-w-md w-full mx-4 shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Informasi Token</h3>
              <button 
                onClick={() => setShowTokenInfo(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              {selectedTokenInfo.logoURI ? (
                <img 
                  src={selectedTokenInfo.logoURI} 
                  alt={selectedTokenInfo.symbol} 
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold text-white">
                  {selectedTokenInfo.symbol.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-white">{selectedTokenInfo.symbol}</h4>
                <p className="text-zinc-400">{selectedTokenInfo.name}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                <span className="text-zinc-400">Alamat Kontrak</span>
                <span className="text-white font-mono text-sm truncate max-w-[200px]">
                  {selectedTokenInfo.address}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                <span className="text-zinc-400">Decimals</span>
                <span className="text-white">{selectedTokenInfo.decimals}</span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <a
                href={`https://testnet.monadexplorer.com/token/${selectedTokenInfo.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={16} />
                <span>View token in explorer</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 