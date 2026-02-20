export const ERROR_MESSAGES = {
  SEAT: {
    NOT_FOUND: 'Seat not found',
    ALREADY_RESERVED: 'Seat is already reserved',
    ALREADY_CONFIRMED: 'Seat is already confirmed',
    NOT_AVAILABLE: 'Seat is not available for reservation',
    INVALID_STATUS: 'Invalid seat status',
  },

   RESERVATION: {
    NOT_FOUND: 'Reservation not found',
    EXPIRED: 'Reservation has expired',
    ALREADY_CONFIRMED: 'Reservation is already confirmed',
    ALREADY_CANCELLED: 'Reservation is already cancelled',
    USER_MISMATCH: 'Reservation does not belong to this user',
    INVALID_STATUS: 'Invalid reservation status',
  },

  IDEMPOTENCY: {
    KEY_REQUIRED: 'Idempotency-Key header is required',
    KEY_TOO_LONG: 'Idempotency-Key must not exceed 255 characters',
    INVALID_KEY: 'Idempotency-Key must be a non-empty string',
  },

  DATABASE: {
    CONNECTION_FAILED: 'Database connection failed',
    TRANSACTION_FAILED: 'Database transaction failed',
    DUPLICATE_KEY: 'Duplicate key error - resource already exists',
    NOT_CONNECTED: 'Database is not connected',
  },

  REDIS: {
    CONNECTION_FAILED: 'Redis connection failed',
    LOCK_FAILED: 'Failed to acquire distributed lock',
    NOT_CONNECTED: 'Redis is not connected',
  },

  CONCURRENCY: {
    SEAT_LOCKED: 'Seat is currently being processed, please try again',
    TOO_MANY_REQUESTS: 'Too many concurrent requests, please try again',
    OPTIMISTIC_LOCK_FAILED: 'Data was modified by another request, please retry',
  },

  VALIDATION: {
    INVALID_SEAT_ID: 'Invalid seat ID format',
    INVALID_USER_ID: 'Invalid user ID',
    INVALID_RESERVATION_ID: 'Invalid reservation ID format',
    REQUIRED_FIELD: (field: string) => `${field} is required`,
  },

  GENERAL: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
  },
};