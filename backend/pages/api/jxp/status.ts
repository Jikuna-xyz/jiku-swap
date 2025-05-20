import { NextApiRequest, NextApiResponse } from 'next'
import { getOrCreateSystemStats } from '@/lib/database/system-stats'
import { getTotalPendingJXP } from '@/lib/database/jxp-updates'
import { getTotalProcessedSwaps, getRecentSwapEvents } from '@/lib/database/swap-events'
import { formatDateHuman, formatNumber } from '@/lib/utils/formatting'

/**
 * API endpoint to get system status
 * Public endpoint (no authentication required)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Test MongoDB connection
    try {
      // Check MongoDB connection
      console.log('[JXP Status] Attempting to get system stats...')
      // Get system stats
      const systemStats = await getOrCreateSystemStats()
      console.log('[JXP Status] Successfully retrieved system stats')
      
      // Try to get JXP data
      console.log('[JXP Status] Attempting to get total pending JXP...')
      // Get total pending JXP
      const totalPendingJXP = await getTotalPendingJXP()
      console.log('[JXP Status] Successfully retrieved pending JXP data')
      
      // Get total processed swaps (from database stat)
      const totalProcessedSwaps = systemStats.totalProcessedSwaps
      
      // Try to get swap events
      console.log('[JXP Status] Attempting to get recent swap events...')
      // Get recent swap events
      const recentSwaps = await getRecentSwapEvents(5)
      console.log(`[JXP Status] Successfully retrieved ${recentSwaps.length} recent swap events`)
      
      // Format dates for readability
      const formattedLastUpdate = formatDateHuman(systemStats.lastUpdateTime)
      const formattedNextUpdate = formatDateHuman(systemStats.nextScheduledUpdate)
      
      // Return status information
      return res.status(200).json({
        success: true,
        systemStatus: {
          lastUpdateTime: systemStats.lastUpdateTime,
          lastUpdateTimeFormatted: formattedLastUpdate,
          nextScheduledUpdate: systemStats.nextScheduledUpdate,
          nextScheduledUpdateFormatted: formattedNextUpdate,
          totalProcessedSwaps: formatNumber(totalProcessedSwaps),
          totalJXPAwarded: formatNumber(systemStats.totalJXPAwarded),
          pendingJXP: formatNumber(totalPendingJXP),
          isRunning: true
        },
        recentSwaps: recentSwaps.map(swap => ({
          txHash: swap.txHash,
          user: swap.user,
          timestamp: formatDateHuman(swap.timestamp),
          volumeMON: swap.volumeMON,
          calculatedJXP: swap.calculatedJXP,
          processed: swap.processed
        }))
      })
    } catch (dbError) {
      console.error('[JXP Status] Database connection error:', dbError)
      return res.status(500).json({
        success: false,
        error: 'Database connection error',
        details: dbError instanceof Error ? dbError.message : 'Unknown MongoDB error'
      })
    }
  } catch (error) {
    console.error('[JXP Status] General API error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    })
  }
} 