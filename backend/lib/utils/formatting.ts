import { format, addHours } from 'date-fns'

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString()
}

/**
 * Format date to human-readable format
 */
export function formatDateHuman(date: Date): string {
  return format(date, 'PPpp') // Format: Apr 29, 2023, 1:15 PM
}

/**
 * Calculate and format next update time
 */
export function getNextUpdateTime(lastUpdateTime: Date, intervalHours: number): {
  nextUpdate: Date;
  formattedTime: string;
} {
  const nextUpdate = addHours(lastUpdateTime, intervalHours)
  return {
    nextUpdate,
    formattedTime: formatDateHuman(nextUpdate)
  }
}

/**
 * Format address to shortened format
 */
export function formatAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

/**
 * Format number to have commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
} 