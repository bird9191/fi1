import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db/prisma.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

// Auth middleware
function authMiddleware(req, res, next) {
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

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
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
        createdAt: true,
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body

    const updates = {}
    if (name) updates.name = name
    if (email) updates.email = email
    if (phone !== undefined) updates.phone = phone
    if (avatar !== undefined) updates.avatar = avatar

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      }
    })

    res.json({ user: updatedUser })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Ошибка обновления профиля' })
  }
})

// Update avatar
router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body

    if (avatar && !avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Неверный формат изображения' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      }
    })

    res.json({ user: updatedUser })
  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({ error: 'Ошибка обновления аватара' })
  }
})

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } })
    res.json({ message: 'Аккаунт удалён' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: 'Ошибка удаления аккаунта' })
  }
})

// Get user stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: req.user.id },
    })

    const totalTests = results.length
    const avgScore = totalTests > 0 
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalTests)
      : 0
    const perfectScores = results.filter(r => r.percentage === 100).length
    const totalTime = results.reduce((acc, r) => acc + r.totalTime, 0)

    res.json({
      stats: {
        totalTests,
        avgScore,
        perfectScores,
        totalTime,
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router
