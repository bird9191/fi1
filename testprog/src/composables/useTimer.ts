import { ref, computed, onUnmounted } from 'vue'

export function useTimer(initialSeconds: number = 0, autoStart: boolean = false) {
  const seconds = ref(initialSeconds)
  const isRunning = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  const isExpired = computed(() => seconds.value <= 0)

  const formatted = computed(() => {
    const mins = Math.floor(seconds.value / 60)
    const secs = seconds.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  const formattedFull = computed(() => {
    const hours = Math.floor(seconds.value / 3600)
    const mins = Math.floor((seconds.value % 3600) / 60)
    const secs = seconds.value % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  const minutes = computed(() => Math.floor(seconds.value / 60))
  const isWarning = computed(() => seconds.value < 120 && seconds.value > 0)
  const isCritical = computed(() => seconds.value < 30 && seconds.value > 0)

  function start() {
    if (isRunning.value || seconds.value <= 0) return

    isRunning.value = true
    intervalId = setInterval(() => {
      seconds.value--

      if (seconds.value <= 0) {
        stop()
      }
    }, 1000)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isRunning.value = false
  }

  function reset(newSeconds?: number) {
    stop()
    seconds.value = newSeconds ?? initialSeconds
  }

  function addTime(additionalSeconds: number) {
    seconds.value += additionalSeconds
  }

  function setTime(newSeconds: number) {
    seconds.value = newSeconds
  }

  if (autoStart && initialSeconds > 0) {
    start()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    seconds,
    isRunning,
    isExpired,
    isWarning,
    isCritical,
    formatted,
    formattedFull,
    minutes,
    start,
    stop,
    reset,
    addTime,
    setTime
  }
}
