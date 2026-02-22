<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          🎫 Seat Reservation System
        </h1>
        <p class="text-gray-600">
          Select an available seat to reserve
        </p>
      </div>

      <!-- Active Reservation Banner -->
      <!-- ✅ FIXED: Use optional chaining -->
      <div
        v-if="hasActiveReservation && currentReservation?.seatNumber"
        class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6 shadow-lg"
      >
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {{ currentReservation.seatNumber }}
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg">
                You have an active reservation
              </h3>
              <p class="text-sm text-gray-600">
                Complete your reservation before it expires
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <CountdownTimer
              v-if="remainingSeconds && remainingSeconds > 0"
              :seconds="remainingSeconds"
              @expired="handleExpiration"
            />
            <div class="flex gap-2">
              <button
                @click="handleConfirmClick"
                :disabled="loading"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Confirm
              </button>
              <button
                @click="handleCancelClick"
                :disabled="loading"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Seat Grid -->
      <SeatGrid
        :seats-by-row="seatsByRow"
        :stats="stats"
        :loading="seatsLoading"
        :error="seatsError"
        :has-active-reservation="hasActiveReservation && !!currentReservation"
        @select="handleSeatSelect"
        @refresh="handleRefresh"
      />

      <!-- Auto-refresh indicator -->
      <div class="text-center mt-4 text-sm text-gray-500">
        <div class="flex items-center justify-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refreshing every 3 seconds</span>
        </div>
      </div>
    </div>

    <!-- Reserve Confirmation Modal -->
    <ReservationModal
      :show="showReserveModal"
      title="Reserve Seat"
      confirm-text="Reserve"
      :loading="loading"
      @close="closeReserveModal"
      @confirm="handleReserveConfirm"
    >
      <div v-if="selectedSeat" class="space-y-4">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <span class="text-3xl font-bold text-green-600">
              {{ selectedSeat.seatNumber }}
            </span>
          </div>
          <h4 class="text-lg font-semibold text-gray-900 mb-2">
            Reserve this seat?
          </h4>
          <div class="text-sm text-gray-600 space-y-1">
            <p>Section: <span class="font-medium">{{ selectedSeat.section }}</span></p>
            <p>Price: <span class="font-medium">{{ formatPrice(selectedSeat.price) }} UZS</span></p>
          </div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex gap-2">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-blue-900">
              You have <strong>2 minutes</strong> to confirm your reservation before it expires.
            </p>
          </div>
        </div>
      </div>
    </ReservationModal>

    <!-- Success Modal -->
    <ReservationModal
      :show="showSuccessModal"
      title="Success!"
      :show-confirm="false"
      cancel-text="Close"
      @close="closeSuccessModal"
    >
      <div class="text-center py-4">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 class="text-xl font-bold text-gray-900 mb-2">
          {{ successMessage }}
        </h4>
        <p class="text-gray-600">
          Thank you for your reservation!
        </p>
      </div>
    </ReservationModal>

    <!-- Error Modal -->
    <ReservationModal
      :show="showErrorModal"
      title="Error"
      :show-confirm="false"
      cancel-text="Close"
      @close="closeErrorModal"
    >
      <div class="text-center py-4">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h4 class="text-xl font-bold text-gray-900 mb-2">
          {{ errorMessage }}
        </h4>
      </div>
    </ReservationModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SeatGrid from '../components/SeatGrid.vue'
import ReservationModal from '../components/ReservationModal.vue'
import CountdownTimer from '../components/CountdownTimer.vue'
import { useSeats } from '../composables/useSeats'
import { useReservation } from '../composables/useReservation'
import { usePolling } from '../composables/usePolling'

const {
  seatsByRow,
  stats,
  loading: seatsLoading,
  error: seatsError,
  fetchSeats,
  fetchStats,
} = useSeats()

const {
  currentReservation,
  selectedSeat,
  loading,
  hasActiveReservation: rawHasActiveReservation,
  remainingSeconds,
  selectSeat,
  clearSelection,
  reserveSeat,
  confirmReservation,
  cancelReservation,
} = useReservation()

// ✅ Safe computed for hasActiveReservation
const hasActiveReservation = computed(() => {
  return rawHasActiveReservation.value && !!currentReservation.value
})

// Auto-refresh polling
usePolling(async () => {
  try {
    await fetchSeats()
    await fetchStats()
  } catch (err) {
    console.error('Polling error:', err)
  }
})

// Modal states
const showReserveModal = ref(false)
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Handlers
function handleSeatSelect(seat) {
  // ✅ Check if has active reservation
  if (hasActiveReservation.value) {
    errorMessage.value = 'You already have an active reservation. Please confirm or cancel it first.'
    showErrorModal.value = true
    return
  }
  
  selectSeat(seat)
  showReserveModal.value = true
}

function closeReserveModal() {
  showReserveModal.value = false
  clearSelection()
}

// async function handleReserveConfirm() {
//   if (!selectedSeat.value) return

//   try {
//     await reserveSeat(selectedSeat.value.id)
//     closeReserveModal()
    
    
//     const seatNum = selectedSeat.value.seatNumber || 'your seat'
//     successMessage.value = `Seat ${seatNum} reserved successfully!`
//     showSuccessModal.value = true
//   } catch (err) {
//     closeReserveModal()
    
//     // Show detailed error
//     if (err.response?.data?.message) {
//       errorMessage.value = err.response.data.message
//     } else if (err.message) {
//       errorMessage.value = err.message
//     } else {
//       errorMessage.value = 'Failed to reserve seat. Please try again.'
//     }
    
//     console.error('Reserve error:', err.response?.data || err)
//     showErrorModal.value = true
//   }
// }

async function handleReserveConfirm() {
  if (!selectedSeat.value) return

  const seat = selectedSeat.value      // ✅ SNAPSHOT
  const seatNum = seat.seatNumber      // ✅ OLDINDAN OLISH

  try {
    await reserveSeat(seat.id)

    closeReserveModal()   // endi xohlagancha clear qilsa ham muammo yo‘q

    successMessage.value = `Seat ${seatNum} reserved successfully!`
    showSuccessModal.value = true

  } catch (err) {
    closeReserveModal()

    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message
    } else if (err.message) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Failed to reserve seat. Please try again.'
    }

    console.error('Reserve error:', err.response?.data || err)
    showErrorModal.value = true
  }
}


async function handleConfirmClick() {
  if (!currentReservation.value) {
    errorMessage.value = 'No active reservation found'
    showErrorModal.value = true
    return
  }

  try {
    await confirmReservation()
    successMessage.value = 'Reservation confirmed successfully!'
    showSuccessModal.value = true
    await fetchSeats()
    await fetchStats()
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to confirm reservation'
    showErrorModal.value = true
  }
}

async function handleCancelClick() {
  if (!currentReservation.value) {
    errorMessage.value = 'No active reservation found'
    showErrorModal.value = true
    return
  }

  if (!confirm('Are you sure you want to cancel this reservation?')) {
    return
  }

  try {
    await cancelReservation()
    await fetchSeats()
    await fetchStats()
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to cancel reservation'
    showErrorModal.value = true
  }
}

async function handleExpiration() {
  console.log('Reservation expired')
  try {
    await fetchSeats()
    await fetchStats()
  } catch (err) {
    console.error('Failed to refresh after expiration:', err)
  }
}

async function handleRefresh() {
  try {
    await fetchSeats()
    await fetchStats()
  } catch (err) {
    errorMessage.value = 'Failed to refresh seats'
    showErrorModal.value = true
  }
}

function closeSuccessModal() {
  showSuccessModal.value = false
  successMessage.value = ''
}

function closeErrorModal() {
  showErrorModal.value = false
  errorMessage.value = ''
}

function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price)
}
</script>