import { NextApiRequest, NextApiResponse } from 'next'
import { batchUpdateJXPOnChain } from '@/lib/blockchain/contract-interaction'
import { verifyAdminApiKey } from '@/lib/utils/auth'

/**
 * API endpoint to manually trigger a JXP update to blockchain
 * Protected by admin API key
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Verify admin API key
  const authorized = verifyAdminApiKey(req);
  if (!authorized) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Missing or invalid API key.' 
    });
  }

  try {
    // Trigger blockchain update
    const result = await batchUpdateJXPOnChain()
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update JXP on blockchain'
      })
    }
    
    // If no users to update
    if (result.userCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending JXP updates to process',
        userCount: 0
      })
    }
    
    // Success
    return res.status(200).json({
      success: true,
      message: `Successfully updated JXP for ${result.userCount} users with total ${result.totalJXP} JXP`,
      transactionHash: result.transactionHash,
      userCount: result.userCount,
      totalJXP: result.totalJXP
    })
  } catch (error) {
    console.error('Error in manual update API:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 