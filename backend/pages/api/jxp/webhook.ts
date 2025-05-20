import { NextApiRequest, NextApiResponse } from 'next'
import { processSwapEventsForJXP } from '@/lib/blockchain/jxp-calculator'
import { batchUpdateJXPOnChain } from '@/lib/blockchain/contract-interaction'
import { verifyCronSecret } from '@/lib/utils/auth'

/**
 * API endpoint to process JXP calculations and update blockchain
 * Called by Vercel cron job every 6 hours
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Verifikasi token cron untuk keamanan
  const authorized = verifyCronSecret(req);
  if (!authorized) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Missing or invalid cron secret.' 
    });
  }

  try {
    // Step 1: Process all unprocessed swap events and calculate JXP
    const { processedCount, totalJXPAwarded, userUpdates } = await processSwapEventsForJXP()
    
    // If no events were processed, return early
    if (processedCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new swap events to process',
        processedCount: 0,
        usersUpdated: 0,
        blockchainUpdateSkipped: true
      })
    }
    
    // Step 2: Update JXP on blockchain
    const blockchainUpdate = await batchUpdateJXPOnChain()
    
    // Return result
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${processedCount} swap events and updated JXP for ${blockchainUpdate.userCount} users`,
      processedCount,
      totalJXPAwarded,
      usersUpdated: blockchainUpdate.userCount,
      blockchainTxHash: blockchainUpdate.transactionHash,
      blockchainUpdateSuccess: blockchainUpdate.success
    })
  } catch (error) {
    console.error('Error in JXP webhook API:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 