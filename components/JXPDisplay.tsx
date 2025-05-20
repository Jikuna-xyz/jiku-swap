import React, { useState, useEffect } from 'react';
import { useJikunaXP } from '@/hooks/useJikunaXP';
import { useUserTierData } from '@/hooks/useUserTierData';
import { Trophy, Award, Star, ChevronRight, ChevronDown, Gift, RefreshCcw, Clock, AlertTriangle, Loader2, CloudOff } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { JXPRewardCard } from './JXPRewardCard';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { formatEther } from 'viem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

// JXP tier names and requirements
const TIER_NAMES = ['Beginner', 'Explorer', 'Veteran', 'Expert', 'Master'];
const TIER_REQUIREMENTS = [BigInt(0), BigInt(100), BigInt(500), BigInt(2000), BigInt(10000)];

// Fungsi untuk mendapatkan warna tier
const getTierColor = (tierLevel: number): string => {
  switch (tierLevel) {
    case 1: return 'bg-amber-700';
    case 2: return 'bg-gray-400';
    case 3: return 'bg-yellow-500';
    case 4: return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

// Interface untuk transaksi swap
interface SwapTransaction {
  txHash: string;
  user: string;
  jxpAmount: number;
  timestamp: string;
}

export function JXPDisplay() {
  const { address, isConnected } = useAccount();
  const jxpInfo = useJikunaXP();
  const { systemStatus, isLoading: tierDataLoading, backendError, usingCachedData } = useUserTierData();
  const [refreshing, setRefreshing] = useState(false);
  
  // Format JXP points
  const totalJXP = jxpInfo.isLoading 
    ? "Loading..." 
    : formatNumber(Number(jxpInfo.totalPoints));
  
  const lifetimeJXP = jxpInfo.isLoading 
    ? "Loading..." 
    : formatNumber(Number(jxpInfo.lifetimePoints));
  
  // Calculate tier name
  const tierName = jxpInfo.isLoading 
    ? "Loading..." 
    : TIER_NAMES[jxpInfo.tier];
  
  // Calculate progress to next tier
  const currentTierPoints = TIER_REQUIREMENTS[jxpInfo.tier] || BigInt(0);
  const nextTierPoints = jxpInfo.tier < 4 
    ? TIER_REQUIREMENTS[jxpInfo.tier + 1] 
    : currentTierPoints + BigInt(10000);
    
  const tierProgress = jxpInfo.isLoading 
    ? 0 
    : Number((jxpInfo.lifetimePoints - currentTierPoints) * BigInt(100) / (nextTierPoints - currentTierPoints));
  
  // Function to refresh JXP data manually
  const refreshJXP = () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    // Force reload of the page to refresh all data
    window.location.reload();
  };

  // Get backend status information
  const hasSystemData = systemStatus && systemStatus.success;
  const isFallbackData = hasSystemData && ('isFallbackData' in systemStatus) && systemStatus.isFallbackData;
  const lastUpdate = hasSystemData ? systemStatus.systemStatus.lastUpdateTimeFormatted : null;
  const nextUpdate = hasSystemData ? systemStatus.systemStatus.nextScheduledUpdateFormatted : null;
  const totalProcessedSwaps = hasSystemData ? systemStatus.stats.totalProcessedSwaps : 0;
  const pendingJXP = hasSystemData ? systemStatus.stats.totalPendingJXP : 0;
  const recentSwaps: SwapTransaction[] = hasSystemData ? systemStatus.stats.recentSwaps : [];

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Jikuna Extra Points (JXP)</CardTitle>
          <CardDescription>
            Connect your wallet to view JXP points and tier.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Jikuna Extra Points (JXP)</CardTitle>
          <div className="flex items-center gap-2">
            {tierDataLoading && (
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
            )}
            
            {hasSystemData && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {isFallbackData ? (
                        <CloudOff className="h-3 w-3 mr-1 text-orange-400" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      
                      <span>
                        {isFallbackData 
                          ? "Offline mode" 
                          : `Last update: ${lastUpdate}`
                        }
                      </span>
                      
                      {usingCachedData && !isFallbackData && (
                        <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">cached</Badge>
                      )}
                      
                      {isFallbackData && (
                        <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4 bg-orange-400/10 text-orange-400 border-orange-400/20">offline</Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFallbackData ? (
                      <p className="text-orange-400">
                        Using fallback data. Backend not available.
                      </p>
                    ) : (
                      <>
                        <p>Next update: {nextUpdate}</p>
                        {usingCachedData && (
                          <p className="text-xs text-yellow-500 mt-1">Using cached data</p>
                        )}
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <button 
              onClick={refreshJXP} 
              disabled={refreshing}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
        <CardDescription className="text-sm">
          Earn points when you swap, wrap, or unwrap tokens on Jikuna.
        </CardDescription>
      </CardHeader>
      
      {backendError && !isFallbackData && (
        <div className="px-4 pb-2">
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <AlertDescription className="text-xs">
              {backendError}
              {usingCachedData && (
                <span className="block mt-1 text-xs text-amber-400">Displaying cached data. <button onClick={refreshJXP} className="underline">Refresh</button></span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {isFallbackData && (
        <div className="px-4 pb-2">
          <Alert variant="default" className="py-2 bg-orange-400/10 text-orange-400 border-orange-400/20">
            <CloudOff className="h-4 w-4 mr-1" />
            <AlertDescription className="text-xs">
              JXP backend is not available. Using fallback data.
              <button onClick={refreshJXP} className="underline ml-1">Try again</button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <CardContent>
        {jxpInfo.isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-full md:w-40" />
            <Skeleton className="h-6 w-full md:w-48" />
            <div className="flex gap-2 mt-1 w-full">
              <Skeleton className="h-6 w-1/3 md:w-20" />
              <Skeleton className="h-6 w-1/3 md:w-24" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-muted-foreground text-sm">Total JXP:</span>
              <span className="font-medium text-base md:text-lg">{totalJXP}</span>
            </div>
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-muted-foreground text-sm">Lifetime JXP:</span>
              <span className="font-medium text-sm">{lifetimeJXP}</span>
            </div>
            <div className="flex justify-between items-center mt-1 flex-wrap">
              <span className="text-muted-foreground text-sm">Tier:</span>
              <Badge className={`${getTierColor(jxpInfo.tier)} hover:${getTierColor(jxpInfo.tier)} text-xs md:text-sm`}>
                {tierName}
              </Badge>
            </div>
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-muted-foreground text-sm">Rank:</span>
              <span className="font-medium text-sm">#{formatNumber(Number(jxpInfo.rank))}</span>
            </div>
            
            {hasSystemData && (
              <>
                <div className="my-2 border-t border-border pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium mb-1">System Status</h4>
                    {isFallbackData && (
                      <Badge variant="outline" className="text-[10px] h-4 text-orange-400">outdated data</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Swaps:</p>
                      <p className="text-sm font-medium">{formatNumber(totalProcessedSwaps)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending JXP:</p>
                      <p className="text-sm font-medium">{formatNumber(pendingJXP)}</p>
                    </div>
                  </div>
                </div>
                
                {recentSwaps && recentSwaps.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Recent Transactions</h4>
                    <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                      {recentSwaps.map((swap: SwapTransaction, index: number) => (
                        <div key={index} className="flex justify-between p-1 bg-muted/30 rounded">
                          <span className="truncate w-24">{swap.user.substring(0, 6)}...{swap.user.substring(38)}</span>
                          <span className="font-medium">+{swap.jxpAmount} JXP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
      
      {hasSystemData && (
        <CardFooter className="pt-0 pb-2">
          <p className="text-xs text-muted-foreground">
            Data provided by Jikuna JXP Backend
            {usingCachedData && !isFallbackData && (
              <span className="text-yellow-400 ml-1">(cached)</span>
            )}
            {isFallbackData && (
              <span className="text-orange-400 ml-1">(offline mode)</span>
            )}
          </p>
        </CardFooter>
      )}
    </Card>
  );
} 