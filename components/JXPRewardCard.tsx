import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Check } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { JIKUNA_XP_V2_ADDRESS, JIKUNA_XP_V2_ABI } from '@/config/contracts'
import { useToast } from './ui/use-toast'

export type JXPRewardType = {
  id: string
  name: string
  description: string
  imageUrl: string
  requiredJXP: bigint
  requiredTier: number
  expiryDate: bigint
  isActive: boolean
  claimedCount: bigint
  isClaimed: boolean
}

interface JXPRewardCardProps {
  reward: JXPRewardType
  userJXP: bigint
  userTier: number
}

export function JXPRewardCard({ reward, userJXP, userTier }: JXPRewardCardProps) {
  const { address } = useAccount()
  const [isClaiming, setIsClaiming] = useState(false)
  const { toast } = useToast()

  // Check if user can claim reward
  const canClaim = !reward.isClaimed && 
                  reward.isActive && 
                  userJXP >= reward.requiredJXP && 
                  userTier >= reward.requiredTier

  // Function to write contract claimReward
  const { data: hash, writeContract, isPending } = useWriteContract()

  // Wait for transaction result
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Handler for claiming reward
  const handleClaimReward = async () => {
    if (!address || !canClaim) return

    try {
      setIsClaiming(true)

      // Call contract to claim reward
      writeContract({
        address: JIKUNA_XP_V2_ADDRESS,
        abi: JIKUNA_XP_V2_ABI,
        functionName: 'claimReward',
        args: [BigInt(reward.id)]
      })

      // No need to wait for transaction completion, we use isSuccess from the hook
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast({
        title: 'Failed to claim reward',
        description: 'An error occurred while claiming reward',
        variant: 'destructive'
      })
    }
  }

  // Effect after successful transaction
  if (isSuccess) {
    toast({
      title: 'Reward successfully claimed!',
      description: `You have successfully claimed ${reward.name}`,
      variant: 'default'
    })
    setIsClaiming(false)
  }

  // Function to get tier color
  const getTierColor = (tierLevel: number): string => {
    switch (tierLevel) {
      case 1: return 'bg-amber-700'
      case 2: return 'bg-gray-400'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  // Function to get tier name
  const getTierName = (tierLevel: number): string => {
    switch (tierLevel) {
      case 1: return 'Bronze'
      case 2: return 'Silver'
      case 3: return 'Gold'
      case 4: return 'Platinum'
      default: return 'No Tier'
    }
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2 px-3 md:px-6">
        <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
          <Gift className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{reward.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 px-3 md:px-6">
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Required JXP:</span>
            <span>{formatNumber(reward.requiredJXP)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Required Tier:</span>
            <Badge className={`${getTierColor(reward.requiredTier)} text-xs px-2 py-0`}>
              {getTierName(reward.requiredTier)}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Claimed:</span>
            <span>{formatNumber(reward.claimedCount)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-3 md:px-6">
        {reward.isClaimed ? (
          <Button variant="outline" className="w-full text-xs md:text-sm h-8 md:h-10" disabled>
            <Check className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Already Claimed
          </Button>
        ) : (
          <Button 
            variant={canClaim ? "default" : "outline"} 
            className="w-full text-xs md:text-sm h-8 md:h-10" 
            disabled={!canClaim || isClaiming || isPending || isConfirming}
            onClick={handleClaimReward}
          >
            {isClaiming || isPending || isConfirming ? (
              <>
                <span className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Claiming...
              </>
            ) : canClaim ? (
              'Claim Reward'
            ) : (
              'Not Eligible'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 