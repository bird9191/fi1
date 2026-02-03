/**
 * ==========================================
 * MIDDLEWARE ВАЛИДАЦИИ (validation.js)
 * ==========================================
 * 
 * Middleware для валидации входных данных
 */

// ==========================================
// ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
// ==========================================

/**
 * Создаёт middleware для валидации обязательных полей
 * @param {string[]} requiredFields - Массив обязательных полей
 */
export function validateRequired(requiredFields) {
  return (req, res, next) => {
    const missingFields = []
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field)
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`
      })
    }
    
    next()
  }
}

// ==========================================
// ВАЛИДАЦИЯ EMAIL
// ==========================================

/**
 * Проверяет корректность email в теле запроса
 */
export function validateEmail(req, res, next) {
  const { email } = req.body
  
  if (!email) {
    return next()
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Некорректный формат email'
    })
  }
  
  next()
}

// ==========================================
// ВАЛИДАЦИЯ ПАРОЛЯ
// ==========================================

/**
 * Проверяет минимальную длину пароля
 * @param {number} minLength - Минимальная длина (по умолчанию 6)
 */
export function validatePassword(minLength = 6) {
  return (req, res, next) => {
    const { password, newPassword } = req.body
    const pwd = password || newPassword
    
    if (!pwd) {
      return next()
    }
    
    if (pwd.length < minLength) {
      return res.status(400).json({
        error: `Пароль должен содержать минимум ${minLength} символов`
      })
    }
    
    next()
  }
}

// ==========================================
// ВАЛИДАЦИЯ ID
// ==========================================

/**
 * Проверяет формат ID в параметрах маршрута
 * @param {string} paramName - Имя параметра (по умолчанию 'id')
 */
export function validateId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName]
    
    if (!id) {
      return res.status(400).json({
        error: `Параметр ${paramName} обязателен`
      })
    }
    
    // UUID формат или CUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const cuidRegex = /^c[a-z0-9]{24}$/
    
    if (!uuidRegex.test(id) && !cuidRegex.test(id) && id.length < 20) {
      return res.status(400).json({
        error: 'Некорректный формат ID'
      })
    }
    
    next()
  }
}

// ==========================================
// ВАЛИДАЦИЯ ПАГИНАЦИИ
// ==========================================

/**
 * Валидирует и нормализует параметры пагинации
 */
export function validatePagination(req, res, next) {
  let { page, limit } = req.query
  
  // Преобразование и валидация page
  page = parseInt(page) || 1
  if (page < 1) page = 1
  
  // Преобразование и валидация limit
  limit = parseInt(limit) || 20
  if (limit < 1) limit = 1
  if (limit > 100) limit = 100
  
  // Записываем нормализованные значения
  req.query.page = page
  req.query.limit = limit
  
  next()
}

// ==========================================
// САНИТИЗАЦИЯ
// ==========================================

/**
 * Очищает строковые поля от пробелов
 * @param {string[]} fields - Поля для очистки
 */
export function sanitizeStrings(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim()
      }
    }
    next()
  }
}

// ==========================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ==========================================

export default {
  validateRequired,
  validateEmail,
  validatePassword,
  validateId,
  validatePagination,
  sanitizeStrings
}




