import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

// Admin middleware
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Только для администраторов' })
  }
  next()
}

// ==================== СТАТИСТИКА ====================

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalTests,
      totalResults,
      recentUsers,
      recentTests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.test.count(),
      prisma.testResult.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      prisma.test.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true } },
          _count: { select: { results: true } }
        }
      })
    ])

    // Статистика за последние 30 дней
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    })

    const testsCompletedThisMonth = await prisma.testResult.count({
      where: { completedAt: { gte: thirtyDaysAgo } }
    })

    res.json({
      overview: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalTests,
        totalResults,
        newUsersThisMonth,
        testsCompletedThisMonth
      },
      recentUsers,
      recentTests: recentTests.map(t => ({
        id: t.id,
        title: t.title,
        author: t.author.name,
        resultsCount: t._count.results,
        createdAt: t.createdAt
      }))
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

// Список пользователей
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query

    const where = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isEmailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          _count: {
            select: {
              tests: true,
              results: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    res.json({
      users: users.map(u => ({
        ...u,
        testsCount: u._count.tests,
        resultsCount: u._count.results
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Изменить роль пользователя
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' })
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    res.json({ user, message: 'Роль изменена' })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Заблокировать/разблокировать пользователя (мягкое удаление)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Нельзя удалить себя
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить свой аккаунт' })
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Пользователь удалён' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Сбросить пароль пользователя
router.post('/users/:id/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Пароль сброшен' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ==================== УПРАВЛЕНИЕ ТЕСТАМИ ====================

// Список всех тестов
router.get('/tests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query

    const where = {}
    if (search) {
      where.title = { contains: search }
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, email: true } },
          _count: {
            select: { questions: true, results: true }
          }
        }
      }),
      prisma.test.count({ where })
    ])

    res.json({
      tests: tests.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        visibility: t.visibility,
        author: t.author,
        questionsCount: t._count.questions,
        resultsCount: t._count.results,
        createdAt: t.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get tests error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Удалить тест
router.delete('/tests/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.test.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Тест удалён' })
  } catch (error) {
    console.error('Delete test error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ==================== СИСТЕМНЫЕ УВЕДОМЛЕНИЯ ====================

// Отправить уведомление всем
router.post('/notifications/broadcast', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, message, link, targetRole } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: 'Заголовок и сообщение обязательны' })
    }

    const where = {}
    if (targetRole && targetRole !== 'all') {
      where.role = targetRole
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true }
    })

    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        type: 'system',
        title,
        message,
        link: link || null
      }))
    })

    res.json({ message: `Уведомление отправлено ${users.length} пользователям` })
  } catch (error) {
    console.error('Broadcast notification error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router




