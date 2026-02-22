<template>
  <button
    :disabled="!isClickable || isDisabledByActiveReservation"
    :class="seatClasses"
    class="seat-item relative w-12 h-12 rounded-lg flex items-center justify-center text-xs font-semibold shadow-md transition-all duration-200"
    @click="handleClick"
  >
    <span>{{ seat.seatNumber }}</span>
    
    <div
      v-if="seat.status === 'RESERVED' && seat.remainingSeconds"
      class="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-lg"
    >
      <div class="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
        <span class="text-[8px] text-white font-bold">
          {{ Math.floor(seat.remainingSeconds / 60) }}
        </span>
      </div>
    </div>
    
    <!-- Disabled overlay -->
    <div
      v-if="isDisabledByActiveReservation"
      class="absolute inset-0 bg-gray-900 bg-opacity-20 rounded-lg flex items-center justify-center"
    >
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { getSeatColorClass, isSeatClickable } from '../utils/helpers'

const props = defineProps({
  seat: {
    type: Object,
    required: true,
  },
  hasActiveReservation: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

const isClickable = computed(() => isSeatClickable(props.seat.status))

const isDisabledByActiveReservation = computed(() => {
  return props.hasActiveReservation && isClickable.value
})

const seatClasses = computed(() => {
  const baseClasses = getSeatColorClass(props.seat.status)
  
  if (isDisabledByActiveReservation.value) {
    return `${baseClasses} opacity-50 cursor-not-allowed`
  }
  
  if (isClickable.value) {
    return `${baseClasses} cursor-pointer`
  }
  
  return `${baseClasses} cursor-not-allowed opacity-60`
})

function handleClick() {
  if (isClickable.value && !isDisabledByActiveReservation.value) {
    emit('select', props.seat)
  }
}
</script>