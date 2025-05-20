"use client"

import React from 'react';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import UserTierCard from '@/components/UserTierCard';
import { useRouter } from 'next/navigation';

export default function JXPTiersPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col h-screen pb-16" style={{ color: "white" }}>
      <Header title="JIKU.SWAP" />
      <div className="p-4 sm:p-6">
        <div className="max-w-mobile mx-auto">
          {/* Back button */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-[#343b43] px-3 py-2 text-sm"
              onClick={() => router.back()}
            >
              &larr; Back
            </Button>
          </div>
          
          {/* Page title */}
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Jikuna Xtra Points (JXP)</h1>
            <p className="text-[#999da1] text-sm mt-1">Level up and earn exclusive benefits</p>
          </div>
          
          {/* Claim JXP Button */}
          <div className="mb-6 flex justify-center">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 flex items-center gap-2 rounded-lg py-3 px-6 text-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span>Claim JXP</span>
            </Button>
          </div>
          
          {/* Link ke informasi JXP */}
          <div className="mb-5">
            <a 
              href="https://docs.jikuna.xyz/jxp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Learn about JXP</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                <path d="M15 3h6v6"></path>
                <path d="M10 14L21 3"></path>
              </svg>
            </a>
          </div>
          
          {/* User Tier Card */}
          <UserTierCard />
          
          {/* Tier Info */}
          <div className="mt-6 bg-[#282c34] rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-3">How to Earn JXP</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-purple-600 rounded-full p-1 mr-2 mt-0.5 flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-[#c0c0c0] text-sm">Swap tokens in Jikuna Swap (1 JXP per 0.1 token swapped)</span>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-600 rounded-full p-1 mr-2 mt-0.5 flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-[#c0c0c0] text-sm">Participate in Jikuna events and promotions (JXP varies)</span>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-600 rounded-full p-1 mr-2 mt-0.5 flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-[#c0c0c0] text-sm">Trade frequently to boost your JXP earnings (min. volume 10 MON)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 