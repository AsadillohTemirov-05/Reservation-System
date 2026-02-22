import { watch } from 'vue'
import { useReservationStore } from '../stores/reservation'
import { useSeatsStore } from '../stores/seats'
import { storeToRefs } from 'pinia'

export function useReservation() {
  const reservationStore = useReservationStore()
  const seatsStore = useSeatsStore()

  const {
    currentReservation,
    selectedSeat,
    loading,
    error,
    userId,
    hasActiveReservation,
    remainingSeconds,
    isExpired,
  } = storeToRefs(reservationStore)

  const {
    selectSeat,
    clearSelection,
    reserveSeat,
    confirmReservation,
    cancelReservation,
    expireReservation,
  } = reservationStore

  // Watch for expiration
  watch(isExpired, async (expired) => {
    if (expired && currentReservation.value) {
      console.log('Reservation expired')
      expireReservation()
      await seatsStore.fetchSeats()
    }
  })

  return {
    // State
    currentReservation,
    selectedSeat,
    loading,
    error,
    userId,

    // Computed
    hasActiveReservation,
    remainingSeconds,
    isExpired,

    // Methods
    selectSeat,
    clearSelection,
    reserveSeat,
    confirmReservation,
    cancelReservation,
  }
}