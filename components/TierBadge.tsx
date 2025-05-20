"use client";

import React from 'react';
import { TierInfo } from '@/hooks/useUserTierData';

interface TierBadgeProps {
  tier: TierInfo;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function TierBadge({ tier, size = 'md', showName = true }: TierBadgeProps) {
  // Size classes untuk responsive design
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };

  // Efek khusus untuk tier Diamond
  const isDiamond = tier.id === 4;
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative overflow-hidden`}
        style={{ 
          background: isDiamond 
            ? `linear-gradient(45deg, ${tier.color}, #ffffff, ${tier.color}, #ffffff)` 
            : tier.color,
          backgroundSize: isDiamond ? '300% 300%' : 'auto',
          animation: isDiamond ? 'diamondShimmer 3s ease infinite' : 'none',
          boxShadow: `0 0 10px ${tier.color}40`
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          {tier.icon}
        </span>
        
        {/* Overlay efek untuk tier tertentu */}
        {isDiamond && (
          <div className="absolute inset-0 bg-white opacity-20 mix-blend-overlay"></div>
        )}
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <span className="font-bold text-white">
            {tier.name}
          </span>
          <span className="text-xs text-[#999da1]">
            Tier {tier.id}
          </span>
        </div>
      )}
      
      {/* Styling untuk animasi Diamond badge */}
      <style jsx global>{`
        @keyframes diamondShimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
} 