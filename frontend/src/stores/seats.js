import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { seatsApi } from '../api/seats'
import { SEAT_STATUS } from '../utils/constants'

export const useSeatsStore = defineStore('seats', () => {
  // State
  const seats = ref([])
  const loading = ref(false)
  const error = ref(null)
  const stats = ref({
    available: 0,
    reserved: 0,
    confirmed: 0,
    total: 0,
  })

  // Computed
  const availableSeats = computed(() =>
    seats.value.filter((seat) => seat.status === SEAT_STATUS.AVAILABLE)
  )

  const reservedSeats = computed(() =>
    seats.value.filter((seat) => seat.status === SEAT_STATUS.RESERVED)
  )

  const confirmedSeats = computed(() =>
    seats.value.filter((seat) => seat.status === SEAT_STATUS.CONFIRMED)
  )

  const seatsByRow = computed(() => {
    const grouped = {}
    seats.value.forEach((seat) => {
      if (!grouped[seat.row]) {
        grouped[seat.row] = []
      }
      grouped[seat.row].push(seat)
    })
    // Sort seats by number within each row
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => {
        const numA = parseInt(a.seatNumber.replace(/\D/g, ''))
        const numB = parseInt(b.seatNumber.replace(/\D/g, ''))
        return numA - numB
      })
    })
    return grouped
  })

  // Actions
  async function fetchSeats() {
    loading.value = true
    error.value = null
    try {
      const response = await seatsApi.getAll()
      seats.value = response.data
      return response
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await seatsApi.getStats()
      stats.value = response.data
      return response
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      throw err
    }
  }

  function getSeatById(id) {
    return seats.value.find((seat) => seat.id === id)
  }

  function updateSeat(updatedSeat) {
    const index = seats.value.findIndex((seat) => seat.id === updatedSeat.id)
    if (index !== -1) {
      seats.value[index] = updatedSeat
    }
  }

  function reset() {
    seats.value = []
    loading.value = false
    error.value = null
    stats.value = {
      available: 0,
      reserved: 0,
      confirmed: 0,
      total: 0,
    }
  }

  return {
    // State
    seats,
    loading,
    error,
    stats,

    // Computed
    availableSeats,
    reservedSeats,
    confirmedSeats,
    seatsByRow,

    // Actions
    fetchSeats,
    fetchStats,
    getSeatById,
    updateSeat,
    reset,
  }
})