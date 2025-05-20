import { getSwapEventsCollection } from './mongodb'
import { SwapEvent } from '@/types/swap-event'

export async function saveSwapEvent(swapEvent: SwapEvent): Promise<void> {
  const collection = await getSwapEventsCollection()
  await collection.insertOne(swapEvent)
}

export async function saveSwapEvents(swapEvents: SwapEvent[]): Promise<void> {
  if (swapEvents.length === 0) return
  const collection = await getSwapEventsCollection()
  await collection.insertMany(swapEvents)
}

export async function getUnprocessedSwapEvents(): Promise<SwapEvent[]> {
  const collection = await getSwapEventsCollection()
  return collection.find({ processed: false }).toArray()
}

export async function markSwapEventsAsProcessed(swapEventIds: string[]): Promise<void> {
  if (swapEventIds.length === 0) return
  const collection = await getSwapEventsCollection()
  const now = new Date()
  
  await collection.updateMany(
    { _id: { $in: swapEventIds } },
    { $set: { processed: true, processedAt: now } }
  )
}

export async function getSwapEventByTxHash(txHash: string): Promise<SwapEvent | null> {
  const collection = await getSwapEventsCollection()
  return collection.findOne({ txHash })
}

export async function getTotalProcessedSwaps(): Promise<number> {
  const collection = await getSwapEventsCollection()
  return collection.countDocuments({ processed: true })
}

export async function getRecentSwapEvents(limit: number = 10): Promise<SwapEvent[]> {
  const collection = await getSwapEventsCollection()
  return collection
    .find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
} 