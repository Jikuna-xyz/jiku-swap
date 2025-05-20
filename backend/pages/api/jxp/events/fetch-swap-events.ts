import { NextApiRequest, NextApiResponse } from 'next'
import { fetchNewSwapEvents } from '@/lib/blockchain/event-listener'
import { verifyCronSecret } from '@/lib/utils/auth'

/**
 * API endpoint to fetch new swap events from blockchain
 * Called by Vercel cron job every hour
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
    // Fetch new swap events
    const { swapEvents, newSwapsCount } = await fetchNewSwapEvents()

    // Return success
    return res.status(200).json({
      success: true,
      newSwapsCount,
      message: `Successfully fetched ${newSwapsCount} new swap events`
    })
  } catch (error) {
    console.error('Error in fetch-swap-events API:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 