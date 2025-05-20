import { NextApiRequest, NextApiResponse } from 'next'
import { runFullSyncProcess } from '@/lib/blockchain/scheduled-tasks'
import { verifyCronSecret } from '@/lib/utils/auth'

// Endpoint untuk cronjob yang menjalankan sinkronisasi lengkap
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Verifikasi token cron untuk keamanan
    const authorized = verifyCronSecret(req);
    if (!authorized) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Missing or invalid cron secret.' 
      });
    }
    
    // Jalankan proses sinkronisasi lengkap
    const result = await runFullSyncProcess();
    
    return res.status(200).json({
      success: true,
      message: 'Sync process completed',
      result
    });
  } catch (error) {
    console.error('Error running sync process:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error running sync process', 
      error: String(error) 
    });
  }
} 