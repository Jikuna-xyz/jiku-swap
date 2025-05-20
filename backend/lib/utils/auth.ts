import { NextApiRequest } from 'next'

/**
 * Verify admin API key for protected endpoints
 */
export function verifyAdminApiKey(req: NextApiRequest, customKey?: string): boolean {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = customKey || process.env.ADMIN_API_KEY || 'admin123'; // Use default for development
  
  return apiKey === validApiKey;
}

/**
 * Verify cron secret for scheduled jobs
 */
export function verifyCronSecret(req: NextApiRequest, customSecret?: string): boolean {
  const cronSecret = req.headers['x-cron-secret'];
  const validCronSecret = customSecret || process.env.CRON_SECRET || 'admin123'; // Use default for development
  
  return cronSecret === validCronSecret;
} 