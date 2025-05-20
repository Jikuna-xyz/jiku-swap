import { SwapEvent } from '@/types/swap-event'
import { updateUserJXP } from '@/lib/database/jxp-updates'
import { getUnprocessedSwapEvents, markSwapEventsAsProcessed } from '@/lib/database/swap-events'
import { updateLastProcessingTime } from '@/lib/database/system-stats'

/**
 * Processes unprocessed swap events, calculates JXP, and updates user records
 */
export async function processSwapEventsForJXP(): Promise<{
  processedCount: number;
  totalJXPAwarded: number;
  userUpdates: Record<string, number>;
}> {
  // Get all unprocessed swap events
  const unprocessedEvents = await getUnprocessedSwapEvents()
  
  if (unprocessedEvents.length === 0) {
    return {
      processedCount: 0,
      totalJXPAwarded: 0,
      userUpdates: {}
    }
  }
  
  // Group JXP by user
  const userJXPUpdates: Record<string, number> = {}
  let totalJXPAwarded = 0
  
  for (const event of unprocessedEvents) {
    if (event.calculatedJXP > 0) {
      const userAddress = event.user.toLowerCase()
      
      if (!userJXPUpdates[userAddress]) {
        userJXPUpdates[userAddress] = 0
      }
      
      userJXPUpdates[userAddress] += event.calculatedJXP
      totalJXPAwarded += event.calculatedJXP
    }
  }
  
  // Update JXP for each user in database
  const userAddresses = Object.keys(userJXPUpdates)
  for (const userAddress of userAddresses) {
    await updateUserJXP(userAddress, userJXPUpdates[userAddress])
  }
  
  // Mark all events as processed
  const eventIds = unprocessedEvents.map(event => event._id as string)
  await markSwapEventsAsProcessed(eventIds)
  
  // Update system stats
  await updateLastProcessingTime(totalJXPAwarded, unprocessedEvents.length)
  
  return {
    processedCount: unprocessedEvents.length,
    totalJXPAwarded,
    userUpdates: userJXPUpdates
  }
} 