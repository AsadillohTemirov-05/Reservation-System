<template>
  <div class="flex items-center gap-2">
    <svg
      class="w-5 h-5 text-yellow-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span class="text-sm font-medium" :class="timeClass">
      {{ formattedTime }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { formatTime } from '../utils/helpers'

const props = defineProps({
  seconds: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['expired'])

const currentSeconds = ref(props.seconds)
let timerId = null

const formattedTime = computed(() => formatTime(currentSeconds.value))

const timeClass = computed(() => {
  if (currentSeconds.value <= 30) {
    return 'text-red-600 animate-pulse-slow'
  }
  if (currentSeconds.value <= 60) {
    return 'text-yellow-600'
  }
  return 'text-gray-700'
})

function startCountdown() {
  timerId = setInterval(() => {
    currentSeconds.value--
    if (currentSeconds.value <= 0) {
      stopCountdown()
      emit('expired')
    }
  }, 1000)
}

function stopCountdown() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  stopCountdown()
})
</script>