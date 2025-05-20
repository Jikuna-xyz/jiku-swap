import { getJXPUpdatesCollection } from './mongodb'
import { JXPUpdate } from '@/types/jxp-update'

export async function getJXPUpdateByUser(userAddress: string): Promise<JXPUpdate | null> {
  const collection = await getJXPUpdatesCollection()
  return collection.findOne({ user: userAddress.toLowerCase() })
}

export async function getAllPendingJXPUpdates(): Promise<JXPUpdate[]> {
  const collection = await getJXPUpdatesCollection()
  return collection.find({ pendingJXP: { $gt: 0 } }).toArray()
}

export async function updateUserJXP(userAddress: string, jxpAmount: number): Promise<void> {
  const collection = await getJXPUpdatesCollection()
  const user = userAddress.toLowerCase()
  const now = new Date()

  await collection.updateOne(
    { user },
    { 
      $inc: { pendingJXP: jxpAmount },
      $set: { lastUpdated: now }
    },
    { upsert: true }
  )
}

export async function clearPendingJXP(userAddresses: string[]): Promise<void> {
  if (userAddresses.length === 0) return
  
  const collection = await getJXPUpdatesCollection()
  const now = new Date()
  
  const operations = userAddresses.map(address => ({
    updateOne: {
      filter: { user: address.toLowerCase() },
      update: { $set: { pendingJXP: 0, lastUpdated: now } }
    }
  }))
  
  await collection.bulkWrite(operations)
}

export async function getTotalPendingJXP(): Promise<number> {
  const collection = await getJXPUpdatesCollection()
  const result = await collection.aggregate([
    { $group: { _id: null, total: { $sum: '$pendingJXP' } } }
  ]).toArray()
  
  return result.length > 0 ? result[0].total : 0
}

export async function getTopJXPUsers(limit: number = 10): Promise<JXPUpdate[]> {
  const collection = await getJXPUpdatesCollection()
  return collection
    .find()
    .sort({ pendingJXP: -1 })
    .limit(limit)
    .toArray()
} 