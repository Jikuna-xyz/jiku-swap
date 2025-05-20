import { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '@/lib/database/mongodb'

/**
 * Simple test endpoint to check if API and MongoDB connection works
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test info basic
    const serverInfo = {
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      hasMongoUri: !!process.env.MONGODB_URI
    }

    // Test MongoDB connection
    let dbConnected = false
    let dbError = null
    
    try {
      console.log('Testing MongoDB connection...')
      const db = await getDb()
      const dbStats = await db.stats()
      dbConnected = true
      console.log('MongoDB connection successful')
      
      return res.status(200).json({
        success: true,
        message: 'API dan MongoDB connection berhasil',
        serverInfo,
        dbConnected,
        dbName: db.databaseName,
        collections: dbStats.collections
      })
    } catch (error) {
      console.error('MongoDB connection failed:', error)
      dbError = error instanceof Error ? error.message : 'Unknown MongoDB error'
      
      return res.status(500).json({
        success: false,
        message: 'API berfungsi tapi MongoDB connection gagal',
        serverInfo,
        dbConnected,
        dbError
      })
    }
  } catch (error) {
    console.error('API test error:', error)
    return res.status(500).json({
      success: false,
      message: 'API test gagal',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 