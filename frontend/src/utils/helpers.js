import { SEAT_STATUS } from './constants'

/**
 * Calculate remaining seconds until expiration
 */
export function getRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = Math.floor((expiry - now) / 1000)
  return Math.max(0, diff)
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get seat color class based on status
 */
export function getSeatColorClass(status) {
  switch (status) {
    case SEAT_STATUS.AVAILABLE:
      return 'bg-available hover:bg-green-600'
    case SEAT_STATUS.RESERVED:
      return 'bg-reserved'
    case SEAT_STATUS.CONFIRMED:
      return 'bg-confirmed'
    default:
      return 'bg-gray-400'
  }
}

/**
 * Check if seat is clickable
 */
export function isSeatClickable(status) {
  return status === SEAT_STATUS.AVAILABLE
}

/**
 * Generate unique idempotency key
 */
export function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format error message
 */
export function formatErrorMessage(error) {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}