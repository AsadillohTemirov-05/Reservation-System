import { ref, onMounted, onUnmounted } from 'vue'
import { POLLING_INTERVAL } from '../utils/constants'

export function usePolling(callback, interval = POLLING_INTERVAL) {
  const isPolling = ref(false)
  let timerId = null

  function startPolling() {
    if (isPolling.value) return

    isPolling.value = true
    timerId = setInterval(() => {
      callback()
    }, interval)
  }

  function stopPolling() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    isPolling.value = false
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    isPolling,
    startPolling,
    stopPolling,
  }
}
