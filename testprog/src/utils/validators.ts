/**
 * ==========================================
 * ВАЛИДАТОРЫ (validators.ts)
 * ==========================================
 * 
 * Функции для валидации данных
 */

// ==========================================
// EMAIL
// ==========================================

/**
 * Проверяет корректность email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ==========================================
// ПАРОЛЬ
// ==========================================

/**
 * Проверяет минимальную длину пароля
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
  return password.length >= minLength
}

/**
 * Проверяет надёжность пароля
 */
export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  if (score <= 2) return { score, label: 'Слабый', color: '#ef4444' }
  if (score <= 4) return { score, label: 'Средний', color: '#fbbf24' }
  return { score, label: 'Сильный', color: '#22c55e' }
}

// ==========================================
// ТЕЛЕФОН
// ==========================================

/**
 * Проверяет корректность телефона
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Форматирует телефон
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`
  }
  
  if (cleaned.length === 10) {
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`
  }
  
  return phone
}

// ==========================================
// ОБЩИЕ
// ==========================================

/**
 * Проверяет, что строка не пустая
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Проверяет минимальную длину
 */
export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min
}

/**
 * Проверяет максимальную длину
 */
export function hasMaxLength(value: string, max: number): boolean {
  return value.length <= max
}

/**
 * Проверяет, что значение в диапазоне
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Проверяет, что это число
 */
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value)
}

/**
 * Проверяет URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}




