/**
 * ==========================================
 * ХУК ЛОКАЛЬНОГО ХРАНИЛИЩА (useLocalStorage.ts)
 * ==========================================
 * 
 * Composable для работы с localStorage
 */

import { ref, watch } from 'vue'

/**
 * Хук для работы с localStorage
 * 
 * @param key - Ключ в localStorage
 * @param defaultValue - Значение по умолчанию
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================

  /** Получаем сохранённое значение */
  function getStoredValue(): T {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error(`Ошибка чтения localStorage[${key}]:`, error)
    }
    return defaultValue
  }

  /** Реактивное значение */
  const value = ref<T>(getStoredValue()) as { value: T }

  // ==========================================
  // СИНХРОНИЗАЦИЯ
  // ==========================================

  /** Сохраняем при изменении */
  watch(
    value,
    (newValue) => {
      try {
        if (newValue === null || newValue === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(newValue))
        }
      } catch (error) {
        console.error(`Ошибка записи localStorage[${key}]:`, error)
      }
    },
    { deep: true }
  )

  // ==========================================
  // МЕТОДЫ
  // ==========================================

  /**
   * Удаляет значение
   */
  function remove() {
    localStorage.removeItem(key)
    value.value = defaultValue
  }

  return {
    value,
    remove
  }
}

/**
 * Хук для работы с темой
 */
export function useTheme() {
  const { value: isDark } = useLocalStorage('theme-dark', false)

  /**
   * Переключает тему
   */
  function toggle() {
    isDark.value = !isDark.value
    applyTheme()
  }

  /**
   * Применяет тему к документу
   */
  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Применяем при инициализации
  applyTheme()

  return {
    isDark,
    toggle,
    applyTheme
  }
}




