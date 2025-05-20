"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import Header from "./header"
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function LeaderboardScreen() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#fbcc68] p-1 rounded">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15L8.5 11H15.5L12 15Z" fill="black" />
              <path d="M17 5H7L2 12L7 19H17L22 12L17 5Z" stroke="black" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="text-white font-bold">LEADERBOARD</h2>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#707070]" size={16} />
          <input
            type="text"
            placeholder="Search by wallet address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242a31] text-white rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
          />
        </div>

        <div className="bg-[#242a31] rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 bg-[#1b1f24] py-2 px-4">
            <div className="text-[#999da1] text-sm font-medium">USER</div>
            <div className="text-[#999da1] text-sm font-medium text-center">JXP</div>
            <div className="text-[#999da1] text-sm font-medium text-right">RANK</div>
          </div>

          {!isConnected ? (
            <div className="py-8 px-4 flex flex-col items-center gap-4">
              <p className="text-center text-[#999da1]">Connect wallet to view the leaderboard</p>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button 
                    onClick={openConnectModal}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          ) : (
            <div className="py-8 text-center text-[#999da1] px-4">
              <p className="mb-2">DEX Jikuna is preparing to launch JXP rewards.</p>
              <p>Be the first to make swaps and earn JXP points!</p>
              <div className="mt-6 flex justify-center">
                <div className="bg-[#1b1f24] rounded-lg py-3 px-5 inline-block">
                  <p className="text-white font-medium mb-1">Your address</p>
                  <p className="text-[#999da1] break-all">{address}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
