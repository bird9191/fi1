/**
 * ==========================================
 * МАРШРУТЫ АУТЕНТИФИКАЦИИ (auth.js)
 * ==========================================
 * 
 * Обработка:
 * - Регистрации и входа
 * - Подтверждения email
 * - Сброса пароля
 * - Двухфакторной аутентификации (2FA)
 * - Смены пароля
 */

import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import prisma from '../db/prisma.js'
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  send2FACode 
} from '../services/email.js'

const router = express.Router()

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================

/** Секретный ключ для JWT */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

/** Время жизни токена */
const JWT_EXPIRES_IN = '7d'

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

/**
 * Генерирует JWT токен для пользователя
 * @param {Object} user - Объект пользователя
 * @returns {string} JWT токен
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * Генерирует случайный токен для верификации
 * @returns {string} Случайный hex токен
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex')
}

// ==========================================
// MIDDLEWARE АВТОРИЗАЦИИ
// ==========================================

/**
 * Проверяет JWT токен в заголовке Authorization
 * Добавляет req.user с данными пользователя
 */
export function authMiddleware(req, res, next) {
  // Проверяем наличие заголовка
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Требуется авторизация' 
    })
  }

  try {
    // Верифицируем токен
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
// РЕГИСТРАЦИЯ
// ==========================================

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 * 
 * Body: { email, password, name, role }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    // Валидация входных данных
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        error: 'Заполните все обязательные поля' 
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов' 
      })
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ 
        error: 'Некорректная роль пользователя' 
      })
    }

    // Проверяем, не занят ли email
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    })
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Пользователь с таким email уже существует' 
      })
    }

    // Хешируем пароль (12 раундов)
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Создаём пользователя
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isEmailVerified: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      }
    })

    // Создаём токен для подтверждения email
    const verificationToken = generateRandomToken()
    await prisma.emailVerification.create({
      data: {
        userId: newUser.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
      }
    })

    // Отправляем письмо подтверждения
    await sendVerificationEmail(email, name, verificationToken)

    // Генерируем JWT
    const token = generateToken(newUser)

    res.status(201).json({
      user: newUser,
      token,
      message: 'Регистрация успешна! Проверьте email для подтверждения.'
    })

  } catch (error) {
    console.error('❌ Register error:', error)
    res.status(500).json({ 
      error: 'Ошибка при регистрации. Попробуйте позже.' 
    })
  }
})

// ==========================================
// ПОДТВЕРЖДЕНИЕ EMAIL
// ==========================================

/**
 * POST /api/auth/verify-email
 * Подтверждение email по токену
 * 
 * Body: { token }
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ 
        error: 'Токен подтверждения обязателен' 
      })
    }

    // Ищем токен в базе
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verification) {
      return res.status(400).json({ 
        error: 'Недействительная ссылка подтверждения' 
      })
    }

    if (verification.used) {
      return res.status(400).json({ 
        error: 'Эта ссылка уже была использована' 
      })
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ 
        error: 'Срок действия ссылки истёк. Запросите новую.' 
      })
    }

    // Подтверждаем email и помечаем токен использованным
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true }
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { used: true }
      })
    ])

    res.json({ 
      message: 'Email успешно подтверждён!' 
    })

  } catch (error) {
    console.error('❌ Verify email error:', error)
    res.status(500).json({ 
      error: 'Ошибка при подтверждении email' 
    })
  }
})

/**
 * POST /api/auth/resend-verification
 * Повторная отправка письма подтверждения
 * Требует авторизации
 */
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    })

    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        error: 'Email уже подтверждён' 
      })
    }

    // Удаляем старые токены
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id }
    })

    // Создаём новый
    const verificationToken = generateRandomToken()
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })

    await sendVerificationEmail(user.email, user.name, verificationToken)

    res.json({ 
      message: 'Письмо отправлено повторно!' 
    })

  } catch (error) {
    console.error('❌ Resend verification error:', error)
    res.status(500).json({ 
      error: 'Ошибка при отправке письма' 
    })
  }
})

// ==========================================
// ВХОД В СИСТЕМУ
// ==========================================

/**
 * POST /api/auth/login
 * Вход в систему
 * 
 * Body: { email, password, twoFactorCode? }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email и пароль обязательны' 
      })
    }

    // Ищем пользователя
    const user = await prisma.user.findUnique({ 
      where: { email } 
    })
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Неверный email или пароль' 
      })
    }

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Неверный email или пароль' 
      })
    }

    // Проверка 2FA (если включена)
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Запрашиваем код 2FA
        return res.status(200).json({
          requires2FA: true,
          message: 'Введите код из приложения аутентификации'
        })
      }

      // Проверяем код
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2  // Допуск ±30 секунд
      })

      if (!verified) {
        return res.status(401).json({ 
          error: 'Неверный код 2FA' 
        })
      }
    }

    // Генерируем токен
    const token = generateToken(user)
    
    // Убираем чувствительные данные
    const { 
      password: _, 
      twoFactorSecret: __, 
      ...userWithoutSensitive 
    } = user

    res.json({
      user: userWithoutSensitive,
      token
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ 
      error: 'Ошибка при входе' 
    })
  }
})

// ==========================================
// СБРОС ПАРОЛЯ
// ==========================================

/**
 * POST /api/auth/forgot-password
 * Запрос на сброс пароля
 * 
 * Body: { email }
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        error: 'Email обязателен' 
      })
    }

    const user = await prisma.user.findUnique({ 
      where: { email } 
    })

    // Всегда возвращаем успех (защита от перебора email)
    if (!user) {
      return res.json({ 
        message: 'Если такой email существует, вы получите письмо с инструкциями' 
      })
    }

    // Удаляем старые токены сброса
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    })

    // Создаём новый токен
    const resetToken = generateRandomToken()
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 час
      }
    })

    await sendPasswordResetEmail(user.email, user.name, resetToken)

    res.json({ 
      message: 'Если такой email существует, вы получите письмо с инструкциями' 
    })

  } catch (error) {
    console.error('❌ Forgot password error:', error)
    res.status(500).json({ 
      error: 'Ошибка при запросе сброса пароля' 
    })
  }
})

/**
 * POST /api/auth/reset-password
 * Сброс пароля по токену
 * 
 * Body: { token, newPassword }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Токен и новый пароль обязательны' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов' 
      })
    }

    // Ищем токен
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetRequest) {
      return res.status(400).json({ 
        error: 'Недействительная ссылка сброса' 
      })
    }

    if (resetRequest.used) {
      return res.status(400).json({ 
        error: 'Эта ссылка уже была использована' 
      })
    }

    if (resetRequest.expiresAt < new Date()) {
      return res.status(400).json({ 
        error: 'Срок действия ссылки истёк. Запросите новую.' 
      })
    }

    // Хешируем новый пароль
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Обновляем пароль и помечаем токен использованным
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true }
      })
    ])

    res.json({ 
      message: 'Пароль успешно изменён!' 
    })

  } catch (error) {
    console.error('❌ Reset password error:', error)
    res.status(500).json({ 
      error: 'Ошибка при сбросе пароля' 
    })
  }
})

// ==========================================
// ДВУХФАКТОРНАЯ АУТЕНТИФИКАЦИЯ (2FA)
// ==========================================

/**
 * POST /api/auth/2fa/setup
 * Настройка 2FA - генерация секрета
 * Требует авторизации
 */
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    })

    if (user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: '2FA уже включена' 
      })
    }

    // Генерируем секрет
    const secret = speakeasy.generateSecret({
      name: `TestMaster (${user.email})`,
      length: 20
    })

    // Сохраняем секрет
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 }
    })

    // Генерируем QR-код
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Отсканируйте QR-код в Google Authenticator или Authy'
    })

  } catch (error) {
    console.error('❌ 2FA setup error:', error)
    res.status(500).json({ 
      error: 'Ошибка при настройке 2FA' 
    })
  }
})

/**
 * POST /api/auth/2fa/verify
 * Подтверждение и активация 2FA
 * Требует авторизации
 * 
 * Body: { code }
 */
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ 
        error: 'Введите код из приложения' 
      })
    }

    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    })

    if (!user.twoFactorSecret) {
      return res.status(400).json({ 
        error: 'Сначала настройте 2FA' 
      })
    }

    // Проверяем код
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ 
        error: 'Неверный код' 
      })
    }

    // Активируем 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    })

    res.json({ 
      message: '2FA успешно включена!' 
    })

  } catch (error) {
    console.error('❌ 2FA verify error:', error)
    res.status(500).json({ 
      error: 'Ошибка при проверке кода' 
    })
  }
})

/**
 * POST /api/auth/2fa/disable
 * Отключение 2FA
 * Требует авторизации
 * 
 * Body: { password, code }
 */
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password, code } = req.body

    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    })

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: '2FA не включена' 
      })
    }

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Неверный пароль' 
      })
    }

    // Проверяем код 2FA
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ 
        error: 'Неверный код 2FA' 
      })
    }

    // Отключаем 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    })

    res.json({ 
      message: '2FA отключена' 
    })

  } catch (error) {
    console.error('❌ 2FA disable error:', error)
    res.status(500).json({ 
      error: 'Ошибка при отключении 2FA' 
    })
  }
})

// ==========================================
// ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
// ==========================================

/**
 * GET /api/auth/me
 * Получение данных текущего пользователя
 * Требует авторизации
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      }
    })

    if (!user) {
      return res.status(401).json({ 
        error: 'Пользователь не найден' 
      })
    }

    res.json({ user })

  } catch (error) {
    console.error('❌ Get me error:', error)
    res.status(500).json({ 
      error: 'Ошибка сервера' 
    })
  }
})

// ==========================================
// СМЕНА ПАРОЛЯ
// ==========================================

/**
 * POST /api/auth/change-password
 * Смена пароля авторизованным пользователем
 * Требует авторизации
 * 
 * Body: { currentPassword, newPassword }
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Заполните все поля' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Новый пароль должен содержать минимум 6 символов' 
      })
    }

    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    })
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      })
    }

    // Проверяем текущий пароль
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Неверный текущий пароль' 
      })
    }

    // Хешируем новый пароль
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    res.json({ 
      message: 'Пароль успешно изменён!' 
    })

  } catch (error) {
    console.error('❌ Change password error:', error)
    res.status(500).json({ 
      error: 'Ошибка сервера' 
    })
  }
})

export default router
