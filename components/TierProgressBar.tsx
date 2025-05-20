"use client";

import React from 'react';
import { TierInfo } from '@/hooks/useUserTierData';

interface TierProgressBarProps {
  currentTier: TierInfo;
  nextTier: TierInfo | null;
  currentJXP: number;
  progressPercentage: number;
  jxpToNextTier: number;
}

export default function TierProgressBar({
  currentTier,
  nextTier,
  currentJXP,
  progressPercentage,
  jxpToNextTier
}: TierProgressBarProps) {
  
  // Handler untuk kasus tier tertinggi
  if (!nextTier) {
    return (
      <div className="w-full mt-2">
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-[#999da1]">Level Diamond Tercapai</span>
          <span className="text-white font-medium">{currentJXP.toLocaleString()} JXP</span>
        </div>
        <div className="w-full bg-[#343b43] rounded-full h-3 relative overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: '100%',
              background: `linear-gradient(90deg, ${currentTier.color}, #ffffff80)`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
            Tier Tertinggi
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between mb-1 text-sm">
        <span className="text-[#999da1]">
          {jxpToNextTier.toLocaleString()} JXP ke {nextTier.name}
        </span>
        <span className="text-white font-medium">{currentJXP.toLocaleString()} JXP</span>
      </div>
      
      <div className="w-full bg-[#343b43] rounded-full h-4 relative overflow-hidden">
        {/* Progress bar */}
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${progressPercentage}%`,
            background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`
          }}
        />
        
        {/* Marker untuk tingkatan tier */}
        <div className="absolute inset-x-0 inset-y-0 flex">
          {/* Current tier marker */}
          <div className="h-full" style={{ width: '0%' }}>
            <div 
              className="absolute bottom-0 right-0 translate-x-1/2 w-1 h-full bg-gray-300"
            />
          </div>
          
          {/* Next tier marker */}
          <div className="h-full w-full">
            <div 
              className="absolute bottom-0 right-0 translate-x-1/2 w-1 h-full bg-gray-300"
            />
          </div>
        </div>
        
        {/* Persentase di dalam progress bar jika persentase cukup besar */}
        {progressPercentage > 15 && (
          <div className="absolute inset-0 flex items-center px-2 text-xs text-white">
            {progressPercentage.toFixed(0)}%
          </div>
        )}
      </div>
      
      {/* Tier labels */}
      <div className="flex justify-between mt-1 text-xs text-[#999da1]">
        <div className="flex flex-col items-start">
          <span>{currentTier.name}</span>
          <span>{currentTier.minJXP.toLocaleString()} JXP</span>
        </div>
        <div className="flex flex-col items-end">
          <span>{nextTier.name}</span>
          <span>{nextTier.minJXP.toLocaleString()} JXP</span>
        </div>
      </div>
    </div>
  );
} 