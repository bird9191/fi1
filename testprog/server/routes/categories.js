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

// Admin middleware
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ запрещён' })
  }
  next()
}

// Получить все категории
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tests: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        color: c.color,
        icon: c.icon,
        testsCount: c._count.tests,
        createdAt: c.createdAt
      }))
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Создать категорию (только админ/учитель)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' })
    }

    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) {
      return res.status(400).json({ error: 'Категория с таким названием уже существует' })
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        color: color || '#3b82f6',
        icon: icon || null
      }
    })

    res.status(201).json({ category })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Обновить категорию
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body

    const category = await prisma.category.findUnique({
      where: { id: req.params.id }
    })

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' })
    }

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        color: color || category.color,
        icon: icon !== undefined ? icon : category.icon
      }
    })

    res.json({ category: updated })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Удалить категорию
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id }
    })

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' })
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Категория удалена' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router




