import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { seatsApi } from '../api/seats'
import { reservationsApi } from '../api/reservations'
import { generateIdempotencyKey, getRemainingSeconds } from '../utils/helpers'
import { useSeatsStore } from './seats'

export const useReservationStore = defineStore('reservation', () => {

  const currentReservation = ref(null)
  const selectedSeat = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const userId = ref(`user-${Date.now()}`)


  const hasActiveReservation = computed(() => !!currentReservation.value)

  const remainingSeconds = computed(() => {
    if (!currentReservation.value?.expiresAt) return 0
    return getRemainingSeconds(currentReservation.value.expiresAt)
  })

  const isExpired = computed(() => remainingSeconds.value <= 0)


  function selectSeat(seat) {
    selectedSeat.value = seat
  }

  function clearSelection() {
    selectedSeat.value = null
  }

  async function reserveSeat(seatId) {
    loading.value = true
    error.value = null

    try {
      const idempotencyKey = generateIdempotencyKey()
      const response = await seatsApi.reserve(seatId, userId.value, idempotencyKey)

      
      const reservationData = response.data
      
      currentReservation.value = {
        reservationId: reservationData.reservationId,
        seatId: reservationData.seatId,
        seatNumber: reservationData.seatNumber, 
        userId: reservationData.userId,
        status: reservationData.status,
        expiresAt: reservationData.expiresAt,
        remainingSeconds: reservationData.remainingSeconds,
      }

      selectedSeat.value = null

      // Update seat in seats store
      const seatsStore = useSeatsStore()
      await seatsStore.fetchSeats()

      return response
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function confirmReservation() {
    if (!currentReservation.value) {
      throw new Error('No active reservation')
    }

    loading.value = true
    error.value = null

    try {
      const idempotencyKey = generateIdempotencyKey()
      const response = await reservationsApi.confirm(
        currentReservation.value.reservationId,
        userId.value,
        idempotencyKey
      )

      currentReservation.value = null

      // Update seat in seats store
      const seatsStore = useSeatsStore()
      await seatsStore.fetchSeats()

      return response
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelReservation() {
    if (!currentReservation.value) {
      throw new Error('No active reservation')
    }

    loading.value = true
    error.value = null

    try {
      const response = await reservationsApi.cancel(
        currentReservation.value.reservationId,
        userId.value
      )

      currentReservation.value = null

      // Update seat in seats store
      const seatsStore = useSeatsStore()
      await seatsStore.fetchSeats()

      return response
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function expireReservation() {
    currentReservation.value = null
    error.value = null
  }

  function reset() {
    currentReservation.value = null
    selectedSeat.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    currentReservation,
    selectedSeat,
    loading,
    error,
    userId,

    
    hasActiveReservation,
    remainingSeconds,
    isExpired,

   
    selectSeat,
    clearSelection,
    reserveSeat,
    confirmReservation,
    cancelReservation,
    expireReservation,
    reset,
  }
})