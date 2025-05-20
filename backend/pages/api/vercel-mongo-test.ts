import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

/**
 * Special test endpoint to diagnose MongoDB connection issues in Vercel environment
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // First check if we have a MongoDB URI at all
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      success: false,
      error: 'MongoDB URI is not defined in environment variables',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION
      }
    })
  }

  console.log(`MongoDB URI exists (length: ${process.env.MONGODB_URI.length}), testing connection...`)
  const connectionStart = Date.now()
  
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    console.log('Attempting to connect to MongoDB...')
    await client.connect()
    console.log('Successfully connected to MongoDB!')
    
    // Test basic commands
    console.log('Testing admin command (ping)...')
    await client.db('admin').command({ ping: 1 })
    console.log('Ping successful!')
    
    // Get database list
    console.log('Fetching database list...')
    const dbList = await client.db().admin().listDatabases()
    console.log(`Found ${dbList.databases.length} databases`)
    
    // Close connection
    await client.close()
    console.log('Connection closed successfully')
    
    // Return success result with timing info
    const connectionTime = Date.now() - connectionStart
    return res.status(200).json({
      success: true,
      message: 'MongoDB connection test successful',
      connectionTimeMs: connectionTime,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION
      },
      databases: dbList.databases.map(db => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk,
        empty: db.empty
      }))
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    
    // Get detailed error information
    const errorDetails = error instanceof Error 
      ? { 
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : { message: 'Unknown error type' }
    
    // Return error with details
    const connectionTime = Date.now() - connectionStart
    return res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      connectionTimeMs: connectionTime,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION
      },
      errorDetails
    })
  }
} 