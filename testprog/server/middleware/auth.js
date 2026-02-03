/**
 * ==========================================
 * MIDDLEWARE АВТОРИЗАЦИИ (auth.js)
 * ==========================================
 * 
 * Middleware функции для проверки авторизации
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

// ==========================================
// ОБЯЗАТЕЛЬНАЯ АВТОРИЗАЦИЯ
// ==========================================

/**
 * Проверяет JWT токен в заголовке Authorization
 * Блокирует запрос если токен отсутствует или недействителен
 */
export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Требуется авторизация' 
    })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ 
      error: 'Недействительный или истёкший токен' 
    })
  }
}

// ==========================================
// ОПЦИОНАЛЬНАЯ АВТОРИЗАЦИЯ
// ==========================================

/**
 * Пытается извлечь пользователя из токена
 * Не блокирует запрос при отсутствии токена
 */
export function authOptional(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      req.user = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      // Игнорируем ошибку - продолжаем без авторизации
    }
  }
  
  next()
}

// ==========================================
// ПРОВЕРКА РОЛЕЙ
// ==========================================

/**
 * Проверяет, что пользователь имеет роль учителя
 */
export function teacherOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Требуется авторизация' 
    })
  }

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Доступ только для учителей' 
    })
  }

  next()
}

/**
 * Проверяет, что пользователь является админом
 */
export function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Требуется авторизация' 
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Доступ только для администраторов' 
    })
  }

  next()
}

/**
 * Создаёт middleware для проверки одной из ролей
 */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Требуется авторизация' 
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Недостаточно прав для этого действия' 
      })
    }

    next()
  }
}

// ==========================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ==========================================

export default {
  authRequired,
  authOptional,
  teacherOnly,
  adminOnly,
  requireRoles
}




