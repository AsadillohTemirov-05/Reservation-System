export const SEAT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  CONFIRMED: 'CONFIRMED',
}

export const RESERVATION_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
}

export const API_BASE_URL = '/api'

export const POLLING_INTERVAL = 3000 

export const RESERVATION_EXPIRY_MINUTES = 2

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const SEATS_PER_ROW = 10

export const SEAT_COLORS = {
  AVAILABLE: {
    bg: 'bg-available',
    hover: 'hover:bg-green-600',
    text: 'Available',
  },
  RESERVED: {
    bg: 'bg-reserved',
    hover: '',
    text: 'Reserved',
  },
  CONFIRMED: {
    bg: 'bg-confirmed',
    hover: '',
    text: 'Confirmed',
  },
}