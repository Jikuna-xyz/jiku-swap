import { NextApiRequest, NextApiResponse } from 'next'
import { verifyAdminApiKey } from '@/lib/utils/auth'

/**
 * Helper API endpoint to test cron-related endpoints manually
 * This allows testing the fetch-swap-events and webhook endpoints
 * without waiting for the actual cron schedules
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
  const customKey = 'deseti213'; // This is the custom key value from user query
  const authorized = verifyAdminApiKey(req, customKey);
  if (!authorized) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Missing or invalid API key. Add x-api-key header with correct value.' 
    });
  }

  // Get the endpoint to test from the request body
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Missing endpoint parameter. Valid options: "fetch-swap-events" or "webhook"'
    });
  }

  try {
    // Prepare the request to the target endpoint
    let targetEndpoint = '';
    
    if (endpoint === 'fetch-swap-events') {
      targetEndpoint = '/api/jxp/events/fetch-swap-events';
    } else if (endpoint === 'webhook') {
      targetEndpoint = '/api/jxp/webhook';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid endpoint. Valid options: "fetch-swap-events" or "webhook"'
      });
    }
    
    // Make the request to the target endpoint with the cron secret
    const targetUrl = `${process.env.VERCEL_URL || req.headers.host}${targetEndpoint}`;
    console.log(`Testing endpoint: ${targetUrl}`);
    
    const response = await fetch(`${req.headers.origin || 'https://' + req.headers.host}${targetEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': customKey
      }
    });
    
    // Return the response from the target endpoint
    const responseData = await response.json();
    
    return res.status(response.status).json({
      success: response.status >= 200 && response.status < 300,
      testedEndpoint: targetEndpoint,
      responseStatus: response.status,
      responseData
    });
  } catch (error) {
    console.error(`Error testing ${endpoint} endpoint:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 