/**
 * ==========================================
 * КОНФИГУРАЦИЯ СЕРВЕРА (config/index.js)
 * ==========================================
 * 
 * Централизованная конфигурация приложения
 */

import dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config()

// ==========================================
// СЕРВЕР
// ==========================================

export const serverConfig = {
  /** Порт сервера */
  port: parseInt(process.env.PORT) || 3001,
  
  /** Окружение */
  env: process.env.NODE_ENV || 'development',
  
  /** Режим разработки */
  isDev: process.env.NODE_ENV !== 'production'
}

// ==========================================
// JWT АУТЕНТИФИКАЦИЯ
// ==========================================

export const jwtConfig = {
  /** Секретный ключ */
  secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  
  /** Время жизни токена */
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  /** Время жизни refresh токена */
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
}

// ==========================================
// CORS
// ==========================================

export const corsConfig = {
  /** Разрешённые источники */
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  /** Разрешить credentials */
  credentials: true
}

// ==========================================
// RATE LIMITING
// ==========================================

export const rateLimitConfig = {
  /** Общий лимит */
  general: {
    windowMs: 15 * 60 * 1000,  // 15 минут
    max: 200                    // 200 запросов
  },
  
  /** Лимит для авторизации */
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 минут
    max: 15                     // 15 попыток
  }
}

// ==========================================
// EMAIL
// ==========================================

export const emailConfig = {
  /** SMTP хост */
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  
  /** SMTP порт */
  port: parseInt(process.env.SMTP_PORT) || 587,
  
  /** Пользователь */
  user: process.env.SMTP_USER || '',
  
  /** Пароль */
  pass: process.env.SMTP_PASS || '',
  
  /** От кого отправляются письма */
  from: process.env.EMAIL_FROM || 'TestMaster <noreply@testmaster.com>'
}

// ==========================================
// БАЗА ДАННЫХ
// ==========================================

export const dbConfig = {
  /** URL подключения */
  url: process.env.DATABASE_URL || 'file:./dev.db'
}

// ==========================================
// ЗАГРУЗКА ФАЙЛОВ
// ==========================================

export const uploadConfig = {
  /** Максимальный размер файла (50MB) */
  maxSize: 50 * 1024 * 1024,
  
  /** Разрешённые типы файлов */
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  /** Директория для загрузок */
  uploadDir: process.env.UPLOAD_DIR || './uploads'
}

// ==========================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ==========================================

export default {
  server: serverConfig,
  jwt: jwtConfig,
  cors: corsConfig,
  rateLimit: rateLimitConfig,
  email: emailConfig,
  db: dbConfig,
  upload: uploadConfig
}




