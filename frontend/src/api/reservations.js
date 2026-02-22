import client from './client'

export const reservationsApi = {
  /**
   * Get all reservations
   */
  async getAll(params = {}) {
    const response = await client.get('/reservations', { params })
    return response.data
  },

  /**
   * Get reservation by ID
   */
  async getById(id) {
    const response = await client.get(`/reservations/${id}`)
    return response.data
  },

  /**
   * Confirm reservation
   */
  async confirm(reservationId, userId, idempotencyKey) {
    const response = await client.post(
      '/reservations/confirm',
      { reservationId, userId },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    )
    return response.data
  },


  
  async cancel(reservationId, userId) {
    const response = await client.delete('/reservations/cancel', {
      data: { reservationId, userId },
    })
    return response.data
  },
}
