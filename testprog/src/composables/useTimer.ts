/**
 * ==========================================
 * ХУК ТАЙМЕРА (useTimer.ts)
 * ==========================================
 * 
 * Composable для работы с таймером
 */

import { ref, computed, onUnmounted } from 'vue'

/**
 * Хук для работы с таймером
 * 
 * @param initialSeconds - Начальное время в секундах
 * @param autoStart - Запустить автоматически
 */
export function useTimer(initialSeconds: number = 0, autoStart: boolean = false) {
  // ==========================================
  // СОСТОЯНИЕ
  // ==========================================

  /** Оставшееся время в секундах */
  const seconds = ref(initialSeconds)

  /** Таймер запущен */
  const isRunning = ref(false)

  /** ID интервала */
  let intervalId: ReturnType<typeof setInterval> | null = null

  // ==========================================
  // ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ==========================================

  /** Время вышло */
  const isExpired = computed(() => seconds.value <= 0)

  /** Форматированное время ММ:СС */
  const formatted = computed(() => {
    const mins = Math.floor(seconds.value / 60)
    const secs = seconds.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  /** Форматированное время ЧЧ:ММ:СС */
  const formattedFull = computed(() => {
    const hours = Math.floor(seconds.value / 3600)
    const mins = Math.floor((seconds.value % 3600) / 60)
    const secs = seconds.value % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  /** Минуты */
  const minutes = computed(() => Math.floor(seconds.value / 60))

  /** Предупреждение (меньше 2 минут) */
  const isWarning = computed(() => seconds.value < 120 && seconds.value > 0)

  /** Критично (меньше 30 секунд) */
  const isCritical = computed(() => seconds.value < 30 && seconds.value > 0)

  // ==========================================
  // МЕТОДЫ
  // ==========================================

  /**
   * Запускает таймер (обратный отсчёт)
   */
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

  /**
   * Останавливает таймер
   */
  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isRunning.value = false
  }

  /**
   * Сбрасывает таймер
   */
  function reset(newSeconds?: number) {
    stop()
    seconds.value = newSeconds ?? initialSeconds
  }

  /**
   * Добавляет время
   */
  function addTime(additionalSeconds: number) {
    seconds.value += additionalSeconds
  }

  /**
   * Устанавливает время
   */
  function setTime(newSeconds: number) {
    seconds.value = newSeconds
  }

  // ==========================================
  // АВТОЗАПУСК И ОЧИСТКА
  // ==========================================

  if (autoStart && initialSeconds > 0) {
    start()
  }

  // Очистка при размонтировании
  onUnmounted(() => {
    stop()
  })

  return {
    // Состояние
    seconds,
    isRunning,
    isExpired,
    isWarning,
    isCritical,

    // Форматирование
    formatted,
    formattedFull,
    minutes,

    // Методы
    start,
    stop,
    reset,
    addTime,
    setTime
  }
}


