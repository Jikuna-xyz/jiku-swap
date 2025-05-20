import { fetchNewSwapEvents } from './event-listener'
import { processSwapEventsForJXP } from './jxp-calculator'
import { batchUpdateJXPOnChain } from './contract-interaction'
import { updateLastProcessingTime } from '@/lib/database/system-stats'

/**
 * Melakukan proses lengkap pencarian, pemrosesan, dan update JXP
 * Fungsi ini dapat dipanggil dari cron job atau webhook
 */
export async function runFullSyncProcess(): Promise<{
  success: boolean;
  eventsFetched: number;
  eventsProcessed: number;
  onChainUpdated: boolean;
  transactionHash?: string;
  error?: string;
}> {
  try {
    console.log('Starting full sync process...')
    
    // 1. Fetch new swap events
    const { swapEvents, newSwapsCount } = await fetchNewSwapEvents()
    console.log(`Fetched ${newSwapsCount} new swap events`)
    
    if (newSwapsCount === 0) {
      console.log('No new events to process, skipping processing steps')
      // Update last processing time even if no events were found
      await updateLastProcessingTime(0, 0)
      return {
        success: true,
        eventsFetched: 0,
        eventsProcessed: 0,
        onChainUpdated: false
      }
    }
    
    // 2. Process events for JXP
    const { processedCount } = await processSwapEventsForJXP()
    console.log(`Processed ${processedCount} swap events for JXP`)
    
    // 3. Update JXP on-chain
    const onChainResult = await batchUpdateJXPOnChain()
    console.log(`On-chain update status: ${onChainResult.success ? 'Success' : 'Failed'}`)
    
    // 4. Update last processing time
    await updateLastProcessingTime(onChainResult.totalJXP || 0, processedCount)
    
    return {
      success: true,
      eventsFetched: newSwapsCount,
      eventsProcessed: processedCount,
      onChainUpdated: onChainResult.success,
      transactionHash: onChainResult.transactionHash
    }
  } catch (error) {
    console.error('Error in full sync process:', error)
    return {
      success: false,
      eventsFetched: 0,
      eventsProcessed: 0,
      onChainUpdated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 