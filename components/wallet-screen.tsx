"use client"

import React, { useState, useEffect, useCallback } from "react"
import Header from "./header"
import { useAccount, useBalance } from 'wagmi';
import { formatEther, formatUnits, Address } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { monadTestnet } from '@/lib/wagmi';
import { TOKEN_ADDRESSES } from '@/config/contracts';
import { readContract } from '@wagmi/core';
import { getConfig } from '@/lib/wagmi';
import { Card, CardContent } from '@/components/ui/card';

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

export default function WalletScreen() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
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
  
  // Fungsi untuk mengambil saldo token
  const fetchTokenBalances = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      setIsLoadingBalances(true);
      
      // Untuk token-token non-native (ERC20)
      const newBalances: {[key: string]: string} = {};
      const config = getConfig();
      
      // ABI untuk balanceOf
      const tokenAbi = [{
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }] as const;
      
      // Fetch saldo semua token
      for (const token of tokens) {
        try {
          const balance = await readContract(config, {
            address: token.address as Address,
            abi: tokenAbi,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;
          
          // Hanya tambahkan jika balancenya > 0
          if (balance > BigInt(0)) {
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
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, isConnected]);
  
  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
    }
  }, [fetchTokenBalances, isConnected, address]);

  return (
    <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      <div className="p-4 sm:p-6">
        <div className="max-w-mobile mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 6.34 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <div className="text-[#999da1] text-xs sm:text-sm">Total Balance</div>
              {isConnected && balance ? (
                <div className="text-white text-xl sm:text-2xl font-bold">
                  {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                </div>
              ) : (
                <div className="text-white text-xl sm:text-2xl font-bold">$0.00</div>
              )}
            </div>
          </div>
          
          {/* My Portfolio heading */}
          <div className="mb-3 mt-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">My Portfolio</h2>
          </div>
          
          {/* Token Portfolio */}
          {isLoadingBalances ? (
            <div className="flex justify-center p-5">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : isConnected ? (
            <div className="space-y-2">
              {/* Native Token (MON) */}
              {balance && (
                <Card className="w-full overflow-hidden">
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#7e6dd1] flex items-center justify-center">
                        <span className="text-white text-sm font-bold">M</span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">{balance.symbol}</div>
                        <div className="text-[#999da1] text-xs">Monad</div>
                      </div>
                    </div>
                    <div className="text-white text-sm font-mono">{parseFloat(formatEther(balance.value)).toFixed(4)}</div>
                  </CardContent>
                </Card>
              )}
              
              {/* ERC20 Tokens */}
              {Object.entries(tokenBalances).length > 0 ? (
                Object.entries(tokenBalances).map(([address, balance]) => {
                  const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
                  if (!token) return null;
                  
                  return (
                    <Card key={address} className="w-full overflow-hidden">
                      <CardContent className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: token.color }}>
                            <span className="text-white text-sm font-bold">{token.icon}</span>
                          </div>
                          <div>
                            <div className="text-white text-sm font-semibold">{token.symbol}</div>
                            <div className="text-[#999da1] text-xs">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-white text-sm font-mono">{parseFloat(balance).toFixed(4)}</div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center p-4 bg-[#282c34] rounded-lg">
                  <p className="text-[#999da1] text-sm">No tokens found in this wallet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 bg-[#282c34] rounded-lg">
              <p className="text-[#999da1] text-sm mb-3">Connect your wallet to view your portfolio</p>
              <ConnectButton />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
