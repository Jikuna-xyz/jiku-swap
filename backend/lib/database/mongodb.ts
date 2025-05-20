import { MongoClient, Db, Collection } from 'mongodb'
import { SwapEvent } from '@/types/swap-event'
import { JXPUpdate, SystemStats } from '@/types/jxp-update'

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let db: Db

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    console.log('[MongoDB] Creating new client in development mode')
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  // Make sure clientPromise is not undefined
  clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>
} else {
  // In production mode, it's best to not use a global variable.
  console.log('[MongoDB] Creating new client in production mode')
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getDb(): Promise<Db> {
  if (!db) {
    console.log('[MongoDB] Connecting to database "jikuna-jxp"...')
    const connectedClient = await clientPromise
    db = connectedClient.db('jikuna-jxp')
    console.log('[MongoDB] Successfully connected to database "jikuna-jxp"')
  }
  return db
}

export async function getSwapEventsCollection(): Promise<Collection<SwapEvent>> {
  const db = await getDb()
  return db.collection<SwapEvent>('swapEvents')
}

export async function getJXPUpdatesCollection(): Promise<Collection<JXPUpdate>> {
  const db = await getDb()
  return db.collection<JXPUpdate>('jxpUpdates')
}

export async function getSystemStatsCollection(): Promise<Collection<SystemStats>> {
  const db = await getDb()
  return db.collection<SystemStats>('systemStats')
}

// Test connection function for debugging
export async function testConnection(): Promise<boolean> {
  try {
    console.log('[MongoDB] Testing connection...')
    const connectedClient = await clientPromise
    await connectedClient.db().admin().ping()
    console.log('[MongoDB] Connection test successful')
    return true
  } catch (error) {
    console.error('[MongoDB] Connection test failed:', error)
    return false
  }
}

export { clientPromise } 