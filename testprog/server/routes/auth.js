import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import prisma from '../db/prisma.js'
import { sendVerificationEmail, sendPasswordResetEmail, send2FACode } from '../services/email.js'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Generate random token
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Auth middleware
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' })
  }
}

// ==================== РЕГИСТРАЦИЯ ====================

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

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

    // Создать токен верификации email
    const verificationToken = generateRandomToken()
    await prisma.emailVerification.create({
      data: {
        userId: newUser.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
      }
    })

    // Отправить письмо
    await sendVerificationEmail(email, name, verificationToken)

    const token = generateToken(newUser)

    res.status(201).json({
      user: newUser,
      token,
      message: 'Регистрация успешна. Проверьте email для подтверждения.'
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Ошибка при регистрации' })
  }
})

// ==================== ПОДТВЕРЖДЕНИЕ EMAIL ====================

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Токен обязателен' })
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verification) {
      return res.status(400).json({ error: 'Недействительный токен' })
    }

    if (verification.used) {
      return res.status(400).json({ error: 'Токен уже использован' })
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Токен истёк' })
    }

    // Обновить пользователя и токен
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

    res.json({ message: 'Email успешно подтверждён' })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ error: 'Ошибка при подтверждении email' })
  }
})

// Переотправка письма подтверждения
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email уже подтверждён' })
    }

    // Удалить старые токены
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id }
    })

    // Создать новый токен
    const verificationToken = generateRandomToken()
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })

    await sendVerificationEmail(user.email, user.name, verificationToken)

    res.json({ message: 'Письмо отправлено повторно' })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ error: 'Ошибка при отправке письма' })
  }
})

// ==================== ВХОД ====================

router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    // Проверка 2FA
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requires2FA: true,
          message: 'Требуется код двухфакторной аутентификации'
        })
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      })

      if (!verified) {
        return res.status(401).json({ error: 'Неверный код 2FA' })
      }
    }

    const token = generateToken(user)
    const { password: _, twoFactorSecret: __, ...userWithoutSensitive } = user

    res.json({
      user: userWithoutSensitive,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Ошибка при входе' })
  }
})

// ==================== СБРОС ПАРОЛЯ ====================

// Запрос на сброс пароля
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Всегда возвращаем успех (защита от перебора email)
    if (!user) {
      return res.json({ message: 'Если email существует, вы получите письмо с инструкциями' })
    }

    // Удалить старые токены
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    })

    // Создать новый токен
    const resetToken = generateRandomToken()
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 час
      }
    })

    await sendPasswordResetEmail(user.email, user.name, resetToken)

    res.json({ message: 'Если email существует, вы получите письмо с инструкциями' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Ошибка при запросе сброса пароля' })
  }
})

// Сброс пароля с токеном
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
    }

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetRequest) {
      return res.status(400).json({ error: 'Недействительный токен' })
    }

    if (resetRequest.used) {
      return res.status(400).json({ error: 'Токен уже использован' })
    }

    if (resetRequest.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Токен истёк' })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

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

    res.json({ message: 'Пароль успешно изменён' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Ошибка при сбросе пароля' })
  }
})

// ==================== 2FA ====================

// Включение 2FA - генерация секрета
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA уже включена' })
    }

    const secret = speakeasy.generateSecret({
      name: `TestMaster (${user.email})`,
      length: 20
    })

    // Сохраняем секрет временно
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 }
    })

    // Генерируем QR код
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Отсканируйте QR-код в приложении аутентификации'
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    res.status(500).json({ error: 'Ошибка при настройке 2FA' })
  }
})

// Подтверждение и включение 2FA
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Код обязателен' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: 'Сначала настройте 2FA' })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ error: 'Неверный код' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    })

    res.json({ message: '2FA успешно включена' })
  } catch (error) {
    console.error('2FA verify error:', error)
    res.status(500).json({ error: 'Ошибка при проверке кода' })
  }
})

// Отключение 2FA
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password, code } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA не включена' })
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный пароль' })
    }

    // Проверка кода 2FA
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ error: 'Неверный код 2FA' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    })

    res.json({ message: '2FA отключена' })
  } catch (error) {
    console.error('2FA disable error:', error)
    res.status(500).json({ error: 'Ошибка при отключении 2FA' })
  }
})

// ==================== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ====================

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
      return res.status(401).json({ error: 'Пользователь не найден' })
    }

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ==================== СМЕНА ПАРОЛЯ ====================

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный текущий пароль' })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Пароль успешно изменён' })
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router
