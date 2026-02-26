import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  function getStoredValue(): T {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error(`Error reading localStorage[${key}]:`, error)
    }
    return defaultValue
  }

  const value = ref<T>(getStoredValue()) as { value: T }

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
        console.error(`Error writing localStorage[${key}]:`, error)
      }
    },
    { deep: true }
  )

  function remove() {
    localStorage.removeItem(key)
    value.value = defaultValue
  }

  return {
    value,
    remove
  }
}

export function useTheme() {
  const { value: isDark } = useLocalStorage('theme-dark', false)

  function toggle() {
    isDark.value = !isDark.value
    applyTheme()
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  applyTheme()

  return {
    isDark,
    toggle,
    applyTheme
  }
}
