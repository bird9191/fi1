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
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' })
  }
}

// Получить все уведомления пользователя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { unreadOnly } = req.query

    const where = { userId: req.user.id }
    if (unreadOnly === 'true') {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        sender: {
          select: { name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    })

    res.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Отметить уведомление как прочитанное
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' })
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    })

    res.json({ message: 'Уведомление прочитано' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Отметить все уведомления как прочитанные
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    })

    res.json({ message: 'Все уведомления прочитаны' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Удалить уведомление
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' })
    }

    await prisma.notification.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Уведомление удалено' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Удалить все уведомления
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id }
    })

    res.json({ message: 'Все уведомления удалены' })
  } catch (error) {
    console.error('Delete all notifications error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Утилита для создания уведомлений (используется внутри сервера)
export async function createNotification({
  userId,
  senderId = null,
  type,
  title,
  message,
  link = null
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        senderId,
        type,
        title,
        message,
        link
      }
    })
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}

export default router




