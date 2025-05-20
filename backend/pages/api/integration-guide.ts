import { NextApiRequest, NextApiResponse } from 'next'

/**
 * API endpoint that provides integration guide for frontend developers
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const baseUrl = process.env.VERCEL_URL || req.headers.host || 'https://your-backend-url.vercel.app';
  const apiUrl = `https://${baseUrl.replace(/^https?:\/\//, '')}`;

  const integrationGuide = {
    success: true,
    title: "Jikuna JXP Backend Integration Guide",
    version: "1.0.0",
    baseUrl: apiUrl,
    description: "This guide provides information on how to integrate this JXP backend with your frontend application.",
    
    // Public endpoints
    publicEndpoints: [
      {
        endpoint: "/api/jxp/status",
        method: "GET",
        description: "Get current JXP system status",
        authRequired: false,
        example: `${apiUrl}/api/jxp/status`,
        responseExample: {
          success: true,
          systemStatus: {
            lastUpdateTime: "2023-05-15T12:00:00Z",
            lastUpdateTimeFormatted: "May 15, 2023, 12:00 PM",
            nextScheduledUpdate: "2023-05-15T18:00:00Z",
            nextScheduledUpdateFormatted: "May 15, 2023, 6:00 PM",
            totalProcessedSwaps: "1,234",
            totalJXPAwarded: "5,678",
            pendingJXP: "910",
            isRunning: true
          },
          recentSwaps: [
            {
              txHash: "0x123...",
              user: "0xabc...",
              timestamp: "May 15, 2023, 11:30 AM",
              volumeMON: 100.5,
              calculatedJXP: 20.1,
              processed: true
            }
          ]
        }
      }
    ],
    
    // Protected endpoints
    protectedEndpoints: [
      {
        endpoint: "/api/jxp/events/fetch-swap-events",
        method: "POST",
        description: "Fetch new swap events from blockchain",
        authRequired: true,
        authType: "x-cron-secret header",
        production: "Called automatically by Vercel Cron",
        testing: {
          endpoint: "/api/test-cron-endpoints",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "deseti213"
          },
          body: {
            endpoint: "fetch-swap-events"
          }
        }
      },
      {
        endpoint: "/api/jxp/webhook",
        method: "POST",
        description: "Process JXP calculations and update blockchain",
        authRequired: true,
        authType: "x-cron-secret header",
        production: "Called automatically by Vercel Cron",
        testing: {
          endpoint: "/api/test-cron-endpoints",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "deseti213"
          },
          body: {
            endpoint: "webhook"
          }
        }
      }
    ],
    
    // Frontend integration steps
    frontendIntegration: {
      step1: "Create API service for JXP backend in your frontend codebase",
      step2: "Implement status checking to display JXP related information",
      step3: "Show recent transactions and JXP calculations to users",
      step4: "No need to call protected endpoints directly - they run on schedule",
      example: `
// Example React API service

import axios from 'axios';

const API_BASE_URL = '${apiUrl}';

export const JXPService = {
  // Get JXP system status
  getStatus: async () => {
    try {
      const response = await axios.get(\`\${API_BASE_URL}/api/jxp/status\`);
      return response.data;
    } catch (error) {
      console.error('Error fetching JXP status:', error);
      throw error;
    }
  },
  
  // Get user's JXP balance (example implementation)
  getUserJXPBalance: async (userAddress) => {
    try {
      // This would be a call to your blockchain contract or a backend endpoint
      // that gets the JXP balance for a specific user
      const response = await axios.get(\`\${API_BASE_URL}/api/jxp/user/\${userAddress}\`);
      return response.data;
    } catch (error) {
      console.error(\`Error fetching JXP balance for user \${userAddress}:\`, error);
      throw error;
    }
  }
};
      `
    },
    
    // Production considerations
    productionConsiderations: [
      "Ensure MONGODB_URI environment variable is set in Vercel",
      "Set ADMIN_API_KEY and CRON_SECRET for additional security",
      "Configure Vercel Cron jobs to run on schedule (already in vercel.json)",
      "Monitor Vercel logs for any errors",
      "Update frontend to use the production backend URL"
    ]
  };

  return res.status(200).json(integrationGuide);
} 