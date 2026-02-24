/**
 * ==========================================
 * СЕРВЕРНЫЕ УТИЛИТЫ (utils/index.js)
 * ==========================================
 */

import crypto from 'crypto'

// ==========================================
// ГЕНЕРАЦИЯ ТОКЕНОВ
// ==========================================

/**
 * Генерирует случайный токен
 * @param {number} length - Длина токена в байтах (по умолчанию 32)
 * @returns {string} Hex-строка токена
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Генерирует короткий код (для 2FA, подтверждений)
 * @param {number} length - Длина кода (по умолчанию 6)
 * @returns {string} Числовой код
 */
export function generateCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

// ==========================================
// ХЕШИРОВАНИЕ
// ==========================================

/**
 * Создаёт SHA256 хеш строки
 * @param {string} data - Данные для хеширования
 * @returns {string} Хеш
 */
export function hashString(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// ==========================================
// ФОРМАТИРОВАНИЕ
// ==========================================

/**
 * Форматирует ответ API
 * @param {any} data - Данные ответа
 * @param {string} message - Сообщение
 * @returns {object} Форматированный ответ
 */
export function formatResponse(data, message = '') {
  return {
    success: true,
    data,
    message
  }
}

/**
 * Форматирует ошибку API
 * @param {string} error - Сообщение об ошибке
 * @param {number} code - Код ошибки
 * @returns {object} Форматированная ошибка
 */
export function formatError(error, code = 400) {
  return {
    success: false,
    error,
    code
  }
}

// ==========================================
// ПАГИНАЦИЯ
// ==========================================

/**
 * Создаёт объект пагинации для ответа
 * @param {number} page - Текущая страница
 * @param {number} limit - Элементов на странице
 * @param {number} total - Всего элементов
 * @returns {object} Объект пагинации
 */
export function createPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  }
}

// ==========================================
// ВАЛИДАЦИЯ
// ==========================================

/**
 * Проверяет корректность email
 * @param {string} email - Email для проверки
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Проверяет минимальную длину пароля
 * @param {string} password - Пароль
 * @param {number} minLength - Минимальная длина
 * @returns {boolean}
 */
export function isValidPassword(password, minLength = 6) {
  return password && password.length >= minLength
}

// ==========================================
// ДАТА И ВРЕМЯ
// ==========================================

/**
 * Добавляет время к текущей дате
 * @param {number} hours - Часы
 * @param {number} minutes - Минуты
 * @param {number} seconds - Секунды
 * @returns {Date} Новая дата
 */
export function addTime(hours = 0, minutes = 0, seconds = 0) {
  const date = new Date()
  date.setTime(date.getTime() + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000))
  return date
}

/**
 * Проверяет, истёк ли срок
 * @param {Date|string} date - Дата для проверки
 * @returns {boolean}
 */
export function isExpired(date) {
  return new Date(date) < new Date()
}

// ==========================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ==========================================

export default {
  generateToken,
  generateCode,
  hashString,
  formatResponse,
  formatError,
  createPagination,
  isValidEmail,
  isValidPassword,
  addTime,
  isExpired
}





