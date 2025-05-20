"use client"

import React, { useState, useEffect } from "react";
import Header from "./header"
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

export default function HomeScreen() {
  // State untuk mengetahui apakah komponen sudah di-mount
  const [mounted, setMounted] = useState(false);
  
  // SELALU panggil hooks di awal, sebelum kondisi apapun
  const { address, isConnected } = useAccount();
  
  // Gunakan query.enabled untuk mengontrol kapan query berjalan
  // bukan conditional hooks
  const { data: balance } = useBalance({
    address,
    query: {
      enabled: mounted && !!address
    }
  });
  
  // Set mounted state setelah komponen di-mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Jika belum di-mount, render versi placeholder sederhana
  if (!mounted) {
    return (
      <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
        <Header title="JIKU.SWAP" />
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <div className="text-[#999da1] text-sm">Total Balance</div>
              <div className="text-white text-2xl font-bold">Loading...</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#242a31] rounded-lg overflow-hidden">
              <img src="/images/jikuna-nft-1.png" alt="JIKU NFT" className="w-full h-auto object-cover" />
            </div>

            <div className="bg-[#242a31] rounded-lg overflow-hidden">
              <img src="/images/jikuna-nft-2.png" alt="NFT #2 JIKUNA" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <div className="text-[#999da1] text-sm">Total Balance</div>
            {isConnected && balance ? (
              <div className="text-white text-2xl font-bold">
                {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
              </div>
            ) : (
              <div className="text-white text-2xl font-bold">$0.00</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#242a31] rounded-lg overflow-hidden">
            <img src="/images/jikuna-nft-1.png" alt="JIKU NFT" className="w-full h-auto object-cover" />
          </div>

          <div className="bg-[#242a31] rounded-lg overflow-hidden">
            <img src="/images/jikuna-nft-2.png" alt="NFT #2 JIKUNA" className="w-full h-auto object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
} 