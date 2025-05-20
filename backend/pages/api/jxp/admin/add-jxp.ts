import { NextApiRequest, NextApiResponse } from 'next'
import { manuallyAddJXP } from '@/lib/blockchain/contract-interaction'
import { verifyAdminApiKey } from '@/lib/utils/auth'

/**
 * API endpoint to manually add JXP to a specific address
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

  // Validate required parameters
  const { address, amount } = req.body

  if (!address || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: address and amount'
    })
  }

  // Validate Ethereum address format
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Ethereum address format'
    })
  }

  // Validate amount is a positive number
  const jxpAmount = Number(amount)
  if (isNaN(jxpAmount) || jxpAmount <= 0 || !Number.isInteger(jxpAmount)) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be a positive integer'
    })
  }

  try {
    // Add JXP to the address
    const result = await manuallyAddJXP(address, jxpAmount)
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to add JXP'
      })
    }
    
    // Success
    return res.status(200).json({
      success: true,
      message: `Successfully added ${jxpAmount} JXP to ${address}`,
      transactionHash: result.transactionHash,
      address,
      amount: jxpAmount
    })
  } catch (error) {
    console.error('Error in add-jxp API:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 