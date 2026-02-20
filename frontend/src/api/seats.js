import client from './client'

export const seatsApi = {
  /**
   * Get all seats
   */
  async getAll(params = {}) {
    const response = await client.get('/seats', { params })
    return response.data
  },

  /**
   * Get seat by ID
   */
  async getById(id) {
    const response = await client.get(`/seats/${id}`)
    return response.data
  },


  async reserve(seatId, userId, idempotencyKey) {
    const response = await client.post(
      '/seats/reserve',
      { seatId, userId },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    )
    return response.data
  },


  async getStats() {
    const response = await client.get('/seats/stats')
    return response.data
  },
}