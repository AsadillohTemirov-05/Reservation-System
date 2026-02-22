import { onMounted, onUnmounted } from 'vue'
import { useSeatsStore } from '../stores/seats'
import { storeToRefs } from 'pinia'

export function useSeats() {
  const seatsStore = useSeatsStore()

  const {
    seats,
    loading,
    error,
    stats,
    availableSeats,
    reservedSeats,
    confirmedSeats,
    seatsByRow,
  } = storeToRefs(seatsStore)

  const { fetchSeats, fetchStats, getSeatById, updateSeat } = seatsStore

  // Fetch on mount
  onMounted(async () => {
    try {
      await fetchSeats()
      await fetchStats()
    } catch (err) {
      console.error('Failed to fetch seats:', err)
    }
  })

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

    // Methods
    fetchSeats,
    fetchStats,
    getSeatById,
    updateSeat,
  }
}