"use client";

import React from 'react';
import { useUserTierData } from '@/hooks/useUserTierData';
import TierBadge from './TierBadge';
import TierProgressBar from './TierProgressBar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Sparkles, TrendingUp, ShieldCheck, LockKeyhole, Star } from 'lucide-react';

export default function UserTierCard() {
  const { address, isConnected } = useAccount();
  const { tier, jxp, isLoading, error, nextTier, progressToNextTier, jxpToNextTier } = useUserTierData();

  // If wallet is not connected
  if (!isConnected) {
    return (
      <div className="bg-[#282c34] rounded-lg p-4 mb-4">
        <div className="text-center py-6">
          <h3 className="text-lg font-bold text-white mb-4">Connect Wallet to View Tier Status</h3>
          <p className="text-[#999da1] mb-6">Get exclusive rewards and benefits with Jikuna Xtra Points (JXP)</p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#282c34] rounded-lg p-4 mb-4">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#343b43] h-12 w-32 rounded"></div>
            <div className="bg-[#343b43] h-10 w-24 rounded"></div>
          </div>
          <div className="bg-[#343b43] h-4 w-full rounded-full mb-4"></div>
          <div className="bg-[#343b43] h-20 w-full rounded mb-2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#282c34] rounded-lg p-4 mb-4">
        <div className="text-center py-4">
          <h3 className="text-lg font-bold text-red-500 mb-2">Error Loading Tier Data</h3>
          <p className="text-[#999da1]">Please try again later</p>
        </div>
      </div>
    );
  }

  // User has no JXP and is still at Tier 1
  const isNewUser = jxp === 0 && tier?.id === 1;

  // Render main component
  return (
    <div className="bg-[#282c34] rounded-lg p-4 mb-4">
      {/* Header with badge and total JXP */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {tier && <TierBadge tier={tier} />}
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 text-yellow-400 mr-1" />
            <span className="text-white font-bold text-lg">{jxp.toLocaleString()}</span>
          </div>
          <span className="text-[#999da1] text-xs">Total JXP</span>
        </div>
      </div>

      {/* Progress bar */}
      {tier && (
        <TierProgressBar
          currentTier={tier}
          nextTier={nextTier}
          currentJXP={jxp}
          progressPercentage={progressToNextTier}
          jxpToNextTier={jxpToNextTier}
        />
      )}

      {/* Tier Benefits */}
      <div className="mt-4">
        <h4 className="text-white font-bold mb-2 flex items-center">
          <Star className="h-4 w-4 text-yellow-400 mr-1" />
          Current Tier Benefits
        </h4>
        <div className="bg-[#343b43] rounded-md p-3">
          <ul className="space-y-2">
            {tier?.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-[#c0c0c0] text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next Tier Benefits */}
      {nextTier && (
        <div className="mt-4">
          <h4 className="text-white font-bold mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 text-blue-400 mr-1" />
            Next Tier Benefits
          </h4>
          <div className="bg-[#343b43] rounded-md p-3">
            <div className="flex items-center mb-2">
              <TierBadge tier={nextTier} size="sm" />
              <span className="ml-2 text-[#999da1] text-xs">
                Need {jxpToNextTier.toLocaleString()} more JXP
              </span>
            </div>
            <ul className="space-y-2">
              {nextTier?.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <LockKeyhole className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-[#999da1] text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Infographic for new users */}
      {isNewUser && (
        <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-md p-3">
          <h4 className="text-blue-400 font-bold mb-2">How to Earn JXP</h4>
          <ul className="text-sm text-[#c0c0c0] space-y-2">
            <li className="flex items-start">
              <div className="bg-blue-600 rounded-full p-1 mr-2 mt-0.5">
                <span className="text-xs">1</span>
              </div>
              <span>Swap tokens on Jikuna Swap (1 JXP per 0.1 tokens swapped)</span>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-600 rounded-full p-1 mr-2 mt-0.5">
                <span className="text-xs">2</span>
              </div>
              <span>Add liquidity to token pairs (10 JXP per transaction)</span>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-600 rounded-full p-1 mr-2 mt-0.5">
                <span className="text-xs">3</span>
              </div>
              <span>Participate in Jikuna events and promotions (JXP varies)</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 