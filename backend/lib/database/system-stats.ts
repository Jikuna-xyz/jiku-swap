import { getSystemStatsCollection } from './mongodb'
import { SystemStats } from '@/types/jxp-update'
import { addHours } from 'date-fns'

const GLOBAL_STATS_ID = 'global'
const UPDATE_INTERVAL_HOURS = Number(process.env.UPDATE_INTERVAL_HOURS || 6)

export async function getSystemStats(): Promise<SystemStats | null> {
  const collection = await getSystemStatsCollection()
  return collection.findOne({ _id: GLOBAL_STATS_ID })
}

export async function initializeSystemStats(): Promise<SystemStats> {
  const collection = await getSystemStatsCollection()
  const now = new Date()
  const nextUpdate = addHours(now, UPDATE_INTERVAL_HOURS)
  
  const stats: SystemStats = {
    _id: GLOBAL_STATS_ID,
    lastUpdateTime: now,
    nextScheduledUpdate: nextUpdate,
    totalProcessedSwaps: 0,
    totalJXPAwarded: 0
  }
  
  await collection.updateOne(
    { _id: GLOBAL_STATS_ID },
    { $set: stats },
    { upsert: true }
  )
  
  return stats
}

export async function updateLastProcessingTime(jxpAwarded: number, processedSwaps: number): Promise<void> {
  const collection = await getSystemStatsCollection()
  const now = new Date()
  const nextUpdate = addHours(now, UPDATE_INTERVAL_HOURS)
  
  await collection.updateOne(
    { _id: GLOBAL_STATS_ID },
    { 
      $set: {
        lastUpdateTime: now,
        nextScheduledUpdate: nextUpdate
      },
      $inc: {
        totalJXPAwarded: jxpAwarded,
        totalProcessedSwaps: processedSwaps
      }
    },
    { upsert: true }
  )
}

export async function getOrCreateSystemStats(): Promise<SystemStats> {
  const stats = await getSystemStats()
  if (stats) return stats
  return initializeSystemStats()
} 