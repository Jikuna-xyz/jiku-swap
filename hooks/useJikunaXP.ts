import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { JIKUNA_XP_V2_ADDRESS, JIKUNA_XP_V2_ABI } from '@/config/contracts'

export type JXPInfo = {
  totalPoints: bigint
  lifetimePoints: bigint
  tier: number
  rank: bigint
  isLoading: boolean
}

export function useJikunaXP(): JXPInfo {
  const { address } = useAccount()
  const [jxpInfo, setJxpInfo] = useState<JXPInfo>({
    totalPoints: BigInt(0),
    lifetimePoints: BigInt(0),
    tier: 0,
    rank: BigInt(0),
    isLoading: true
  })

  // Get Total JXP
  const { data: totalJXP, isLoading: isTotalLoading } = useReadContract({
    address: JIKUNA_XP_V2_ADDRESS,
    abi: JIKUNA_XP_V2_ABI,
    functionName: 'getTotalJXP',
    args: [address!],
    query: {
      enabled: !!address
    }
  })

  // Get Lifetime JXP
  const { data: lifetimeJXP, isLoading: isLifetimeLoading } = useReadContract({
    address: JIKUNA_XP_V2_ADDRESS,
    abi: JIKUNA_XP_V2_ABI,
    functionName: 'getLifetimeJXP',
    args: [address!],
    query: {
      enabled: !!address
    }
  })

  // Get User Tier
  const { data: userTier, isLoading: isTierLoading } = useReadContract({
    address: JIKUNA_XP_V2_ADDRESS,
    abi: JIKUNA_XP_V2_ABI,
    functionName: 'getUserTier',
    args: [address!],
    query: {
      enabled: !!address
    }
  })

  // Get User Rank
  const { data: userRank, isLoading: isRankLoading } = useReadContract({
    address: JIKUNA_XP_V2_ADDRESS,
    abi: JIKUNA_XP_V2_ABI,
    functionName: 'getUserRank',
    args: [address!],
    query: {
      enabled: !!address
    }
  })

  useEffect(() => {
    if (!address) {
      setJxpInfo({
        totalPoints: BigInt(0),
        lifetimePoints: BigInt(0),
        tier: 0,
        rank: BigInt(0),
        isLoading: false
      })
      return
    }

    if (
      !isTotalLoading &&
      !isLifetimeLoading &&
      !isTierLoading &&
      !isRankLoading &&
      totalJXP !== undefined &&
      lifetimeJXP !== undefined &&
      userTier !== undefined &&
      userRank !== undefined
    ) {
      setJxpInfo({
        totalPoints: totalJXP,
        lifetimePoints: lifetimeJXP,
        tier: Number(userTier),
        rank: userRank,
        isLoading: false
      })
    }
  }, [address, totalJXP, lifetimeJXP, userTier, userRank, isTotalLoading, isLifetimeLoading, isTierLoading, isRankLoading])

  return jxpInfo
} 