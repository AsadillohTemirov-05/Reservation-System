<template>
  <div class="w-full max-w-4xl mx-auto">
    <!-- Legend -->
    <div class="flex justify-center gap-6 mb-6">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-available rounded"></div>
        <span class="text-sm text-gray-700">Available</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-reserved rounded"></div>
        <span class="text-sm text-gray-700">Reserved</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-confirmed rounded"></div>
        <span class="text-sm text-gray-700">Confirmed</span>
      </div>
    </div>

    <!-- Seat Grid -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <div v-if="loading" class="py-12">
        <LoadingSpinner />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button
          @click="$emit('refresh')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="row in rows"
          :key="row"
          class="flex items-center gap-2"
        >
          <!-- Row label -->
          <div class="w-8 text-center font-bold text-gray-700">
            {{ row }}
          </div>

          <!-- Seats in row -->
          <div class="flex gap-2 flex-1 justify-center">
            <SeatItem
              v-for="seat in seatsByRow[row]"
              :key="seat.id"
              :seat="seat"
              :has-active-reservation="hasActiveReservation"
              @select="handleSeatSelect"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-6 grid grid-cols-3 gap-4">
      <div class="bg-white rounded-lg shadow p-4 text-center">
        <div class="text-2xl font-bold text-available">{{ stats.available }}</div>
        <div class="text-sm text-gray-600">Available</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 text-center">
        <div class="text-2xl font-bold text-reserved">{{ stats.reserved }}</div>
        <div class="text-sm text-gray-600">Reserved</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 text-center">
        <div class="text-2xl font-bold text-confirmed">{{ stats.confirmed }}</div>
        <div class="text-sm text-gray-600">Confirmed</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SeatItem from './SeatItem.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { ROWS } from '../utils/constants'

const props = defineProps({
  seatsByRow: {
    type: Object,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  hasActiveReservation: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select', 'refresh'])

const rows = ROWS

function handleSeatSelect(seat) {
  emit('select', seat)
}
</script>