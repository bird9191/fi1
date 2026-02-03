/**
 * ==========================================
 * МАРШРУТЫ ТЕСТОВ (tests.js)
 * ==========================================
 * 
 * CRUD операции с тестами:
 * - Получение списка тестов
 * - Создание, редактирование, удаление
 * - Отправка и просмотр результатов
 * - Комментарии учителя к результатам
 */

import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../db/prisma.js'
import { createNotification } from './notifications.js'

const router = express.Router()

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

// ==========================================
// MIDDLEWARE
// ==========================================

/**
 * Проверка авторизации (обязательная)
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Требуется авторизация' 
    })
  }

  try {
    const token = authHeader.split(' ')[1]
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (error) {
    return res.status(401).json({ 
      error: 'Недействительный токен' 
    })
  }
}

/**
 * Опциональная авторизация
 * Не блокирует запрос, но добавляет req.user если токен валиден
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
    } catch (error) {
      // Игнорируем ошибку - продолжаем без авторизации
    }
  }
  next()
}

// ==========================================
// ФОРМАТИРОВАНИЕ ДАННЫХ
// ==========================================

/**
 * Форматирует тест для ответа клиенту
 * @param {Object} test - Объект теста из базы данных
 * @returns {Object} Отформатированный тест
 */
function formatTest(test) {
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    authorId: test.authorId,
    authorName: test.author?.name || 'Неизвестный автор',
    visibility: test.visibility,
    shareLink: test.shareLink,
    timeLimit: test.timeLimit,
    allowTrainingMode: test.allowTrainingMode,
    
    // Категории
    categories: test.categories?.map(c => ({
      id: c.category.id,
      name: c.category.name,
      color: c.category.color
    })) || [],
    
    // Вопросы
    questions: test.questions?.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      points: q.points,
      difficulty: q.difficulty,
      category: q.category,
      hint: q.hint,
      explanation: q.explanation,
      options: q.options?.map(o => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })) || []
    })) || [],
    
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
  }
}

// ==========================================
// ПОЛУЧЕНИЕ ТЕСТОВ
// ==========================================

/**
 * GET /api/tests
 * Получение публичных тестов с фильтрацией и пагинацией
 * 
 * Query params:
 * - search: поиск по названию/описанию
 * - category: фильтр по категории
 * - difficulty: фильтр по сложности
 * - sortBy: поле сортировки (default: createdAt)
 * - order: направление сортировки (default: desc)
 * - page: номер страницы (default: 1)
 * - limit: количество на странице (default: 20)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      difficulty, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 20 
    } = req.query

    // Базовый фильтр - только публичные
    const where = { visibility: 'public' }

    // Поиск по названию и описанию
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Фильтр по категории
    if (category) {
      where.categories = {
        some: { categoryId: category }
      }
    }

    // Фильтр по сложности вопросов
    if (difficulty) {
      where.questions = {
        some: { difficulty }
      }
    }

    // Сортировка
    const orderBy = {}
    orderBy[sortBy] = order

    // Запрос с пагинацией
    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: {
          author: { select: { name: true } },
          categories: {
            include: { category: true }
          },
          questions: {
            include: { options: true },
            orderBy: { order: 'asc' }
          },
          _count: { select: { results: true } }
        },
        orderBy,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.test.count({ where })
    ])

    res.json({ 
      tests: tests.map(t => ({
        ...formatTest(t),
        resultsCount: t._count.results
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('❌ Get tests error:', error)
    res.status(500).json({ error: 'Ошибка загрузки тестов' })
  }
})

/**
 * GET /api/tests/my
 * Тесты текущего учителя
 * Требует авторизации + роль teacher
 */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    // Проверяем роль
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        error: 'Только учителя могут просматривать свои тесты' 
      })
    }

    const tests = await prisma.test.findMany({
      where: { authorId: req.user.id },
      include: {
        author: { select: { name: true } },
        categories: {
          include: { category: true }
        },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { results: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ 
      tests: tests.map(t => ({
        ...formatTest(t),
        resultsCount: t._count.results
      }))
    })

  } catch (error) {
    console.error('❌ Get my tests error:', error)
    res.status(500).json({ error: 'Ошибка загрузки тестов' })
  }
})

/**
 * GET /api/tests/results/my
 * Результаты текущего пользователя
 * Требует авторизации
 */
router.get('/results/my', authMiddleware, async (req, res) => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: req.user.id },
      include: {
        test: { select: { title: true } },
        user: { select: { name: true } },
        comments: {
          include: {
            author: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    res.json({
      results: results.map(r => ({
        id: r.id,
        testId: r.testId,
        testTitle: r.test.title,
        userId: r.userId,
        userName: r.user.name,
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        mode: r.mode,
        totalTime: r.totalTime,
        completedAt: r.completedAt,
        answers: JSON.parse(r.answersJson),
        questionStats: JSON.parse(r.statsJson),
        comments: r.comments
      }))
    })

  } catch (error) {
    console.error('❌ Get my results error:', error)
    res.status(500).json({ error: 'Ошибка загрузки результатов' })
  }
})

// ==========================================
// ПРИВАТНЫЕ ССЫЛКИ
// ==========================================

/**
 * GET /api/tests/share/:shareLink
 * Доступ к тесту по приватной ссылке
 */
router.get('/share/:shareLink', optionalAuth, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { shareLink: req.params.shareLink },
      include: {
        author: { select: { name: true } },
        categories: {
          include: { category: true }
        },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден или ссылка недействительна' 
      })
    }

    res.json({ test: formatTest(test) })

  } catch (error) {
    console.error('❌ Get shared test error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

/**
 * GET /api/tests/:id
 * Получение одного теста по ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { name: true } },
        categories: {
          include: { category: true }
        },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден' 
      })
    }

    // Проверка доступа к приватному тесту
    if (test.visibility === 'private') {
      if (!req.user || req.user.id !== test.authorId) {
        return res.status(403).json({ 
          error: 'Нет доступа к этому тесту' 
        })
      }
    }

    res.json({ test: formatTest(test) })

  } catch (error) {
    console.error('❌ Get test error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ==========================================
// СОЗДАНИЕ И РЕДАКТИРОВАНИЕ
// ==========================================

/**
 * POST /api/tests
 * Создание нового теста
 * Требует авторизации + роль teacher
 * 
 * Body: { title, description, questions, visibility, timeLimit, allowTrainingMode, categoryIds }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Проверяем роль
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        error: 'Только учителя могут создавать тесты' 
      })
    }

    const { 
      title, 
      description, 
      questions, 
      visibility, 
      timeLimit, 
      allowTrainingMode, 
      categoryIds 
    } = req.body

    // Валидация
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ 
        error: 'Название и вопросы обязательны' 
      })
    }

    // Генерация ссылки для приватных тестов
    let shareLink = null
    if (visibility === 'link' || visibility === 'private') {
      shareLink = crypto.randomBytes(16).toString('hex')
    }

    // Создаём тест с вопросами
    const test = await prisma.test.create({
      data: {
        title,
        description: description || '',
        visibility: visibility || 'public',
        shareLink,
        timeLimit: timeLimit || null,
        allowTrainingMode: allowTrainingMode !== false,
        authorId: req.user.id,
        
        // Вопросы с вариантами ответов
        questions: {
          create: questions.map((q, idx) => ({
            text: q.text,
            type: q.type || 'single',
            points: q.points || 10,
            difficulty: q.difficulty || 'medium',
            category: q.category || null,
            hint: q.hint || null,
            explanation: q.explanation || null,
            order: idx,
            options: {
              create: (q.options || []).map((o, oIdx) => ({
                text: o.text,
                isCorrect: o.isCorrect || false,
                order: oIdx,
              }))
            }
          }))
        },
        
        // Категории
        categories: categoryIds ? {
          create: categoryIds.map(id => ({
            categoryId: id
          }))
        } : undefined
      },
      include: {
        author: { select: { name: true } },
        categories: {
          include: { category: true }
        },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    res.status(201).json({ 
      test: formatTest(test),
      message: 'Тест успешно создан!'
    })

  } catch (error) {
    console.error('❌ Create test error:', error)
    res.status(500).json({ error: 'Ошибка создания теста' })
  }
})

/**
 * PUT /api/tests/:id
 * Обновление существующего теста
 * Требует авторизации + авторство
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({ 
      where: { id: req.params.id } 
    })
    
    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден' 
      })
    }

    // Проверяем авторство
    if (test.authorId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Вы не можете редактировать чужой тест' 
      })
    }

    const { 
      title, 
      description, 
      questions, 
      visibility, 
      timeLimit, 
      allowTrainingMode, 
      categoryIds 
    } = req.body

    // Обновление shareLink при смене видимости
    let shareLink = test.shareLink
    if (visibility === 'link' && !shareLink) {
      shareLink = crypto.randomBytes(16).toString('hex')
    } else if (visibility === 'public') {
      shareLink = null
    }

    // Удаляем старые вопросы и категории
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { testId: test.id } }),
      prisma.testCategory.deleteMany({ where: { testId: test.id } })
    ])

    // Обновляем тест
    const updatedTest = await prisma.test.update({
      where: { id: test.id },
      data: {
        title: title || test.title,
        description: description !== undefined ? description : test.description,
        visibility: visibility || test.visibility,
        shareLink,
        timeLimit: timeLimit !== undefined ? timeLimit : test.timeLimit,
        allowTrainingMode: allowTrainingMode !== undefined 
          ? allowTrainingMode 
          : test.allowTrainingMode,
        
        // Новые вопросы
        questions: questions ? {
          create: questions.map((q, idx) => ({
            text: q.text,
            type: q.type || 'single',
            points: q.points || 10,
            difficulty: q.difficulty || 'medium',
            category: q.category || null,
            hint: q.hint || null,
            explanation: q.explanation || null,
            order: idx,
            options: {
              create: (q.options || []).map((o, oIdx) => ({
                text: o.text,
                isCorrect: o.isCorrect || false,
                order: oIdx,
              }))
            }
          }))
        } : undefined,
        
        // Новые категории
        categories: categoryIds ? {
          create: categoryIds.map(id => ({
            categoryId: id
          }))
        } : undefined
      },
      include: {
        author: { select: { name: true } },
        categories: {
          include: { category: true }
        },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    res.json({ 
      test: formatTest(updatedTest),
      message: 'Тест успешно обновлён!'
    })

  } catch (error) {
    console.error('❌ Update test error:', error)
    res.status(500).json({ error: 'Ошибка обновления теста' })
  }
})

/**
 * POST /api/tests/:id/regenerate-link
 * Генерация новой приватной ссылки
 * Требует авторизации + авторство
 */
router.post('/:id/regenerate-link', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findFirst({
      where: { 
        id: req.params.id, 
        authorId: req.user.id 
      }
    })

    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден' 
      })
    }

    const shareLink = crypto.randomBytes(16).toString('hex')

    await prisma.test.update({
      where: { id: test.id },
      data: { shareLink }
    })

    res.json({ 
      shareLink, 
      message: 'Ссылка обновлена' 
    })

  } catch (error) {
    console.error('❌ Regenerate link error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

/**
 * DELETE /api/tests/:id
 * Удаление теста
 * Требует авторизации + авторство (или роль admin)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({ 
      where: { id: req.params.id } 
    })
    
    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден' 
      })
    }

    // Проверяем права (автор или админ)
    if (test.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Нет прав на удаление этого теста' 
      })
    }

    await prisma.test.delete({ 
      where: { id: test.id } 
    })

    res.json({ message: 'Тест удалён' })

  } catch (error) {
    console.error('❌ Delete test error:', error)
    res.status(500).json({ error: 'Ошибка удаления теста' })
  }
})

// ==========================================
// РЕЗУЛЬТАТЫ
// ==========================================

/**
 * POST /api/tests/:id/submit
 * Отправка результатов теста
 * Требует авторизации
 * 
 * Body: { answers, mode, totalTime, questionStats }
 */
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { include: { options: true } },
        author: { select: { id: true, name: true } }
      }
    })

    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден' 
      })
    }

    const { answers, mode, totalTime, questionStats } = req.body

    // Подсчёт баллов
    let score = 0
    let maxScore = 0

    for (const question of test.questions) {
      maxScore += question.points
      const userAnswer = answers.find(a => a.questionId === question.id)

      if (userAnswer) {
        if (question.type === 'text') {
          // Текстовый ответ - полные баллы (можно добавить проверку)
          score += question.points
        } else {
          // Проверка выбранных вариантов
          const correctIds = question.options
            .filter(o => o.isCorrect)
            .map(o => o.id)
          
          const isCorrect = 
            correctIds.length === userAnswer.selectedOptionIds.length &&
            correctIds.every(id => userAnswer.selectedOptionIds.includes(id))
          
          if (isCorrect) {
            score += question.points
          }
        }
      }
    }

    // Сохраняем результат
    const result = await prisma.testResult.create({
      data: {
        userId: req.user.id,
        testId: test.id,
        score,
        maxScore,
        percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
        mode: mode || 'exam',
        totalTime: totalTime || 0,
        answersJson: JSON.stringify(answers || []),
        statsJson: JSON.stringify(questionStats || []),
      },
      include: {
        test: { select: { title: true } },
        user: { select: { name: true } }
      }
    })

    // Уведомляем учителя о новом результате
    if (test.author.id !== req.user.id) {
      await createNotification({
        userId: test.author.id,
        senderId: req.user.id,
        type: 'result',
        title: 'Новый результат',
        message: `${result.user.name} прошёл тест "${test.title}" с результатом ${result.percentage}%`,
        link: `/tests/${test.id}/results`
      })
    }

    res.status(201).json({
      result: {
        id: result.id,
        testId: result.testId,
        testTitle: result.test.title,
        userId: result.userId,
        userName: result.user.name,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        mode: result.mode,
        totalTime: result.totalTime,
        completedAt: result.completedAt,
        answers: JSON.parse(result.answersJson),
        questionStats: JSON.parse(result.statsJson),
      },
      message: 'Результат сохранён!'
    })

  } catch (error) {
    console.error('❌ Submit test error:', error)
    res.status(500).json({ error: 'Ошибка сохранения результата' })
  }
})

/**
 * GET /api/tests/:id/results
 * Результаты теста (для учителя)
 * Требует авторизации + авторство (или admin)
 */
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({ 
      where: { id: req.params.id } 
    })
    
    if (!test) {
      return res.status(404).json({ 
        error: 'Тест не найден' 
      })
    }

    // Проверяем права
    if (test.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Нет доступа к результатам' 
      })
    }

    const results = await prisma.testResult.findMany({
      where: { testId: req.params.id },
      include: {
        test: { select: { title: true } },
        user: { select: { name: true, email: true } },
        comments: {
          include: {
            author: { select: { name: true } }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    res.json({
      results: results.map(r => ({
        id: r.id,
        testId: r.testId,
        testTitle: r.test.title,
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        mode: r.mode,
        totalTime: r.totalTime,
        completedAt: r.completedAt,
        answers: JSON.parse(r.answersJson),
        questionStats: JSON.parse(r.statsJson),
        comments: r.comments
      }))
    })

  } catch (error) {
    console.error('❌ Get test results error:', error)
    res.status(500).json({ error: 'Ошибка загрузки результатов' })
  }
})

// ==========================================
// КОММЕНТАРИИ К РЕЗУЛЬТАТАМ
// ==========================================

/**
 * POST /api/tests/results/:resultId/comments
 * Добавление комментария учителя к результату
 * Требует авторизации + авторство теста (или admin)
 * 
 * Body: { text }
 */
router.post('/results/:resultId/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ 
        error: 'Текст комментария обязателен' 
      })
    }

    const result = await prisma.testResult.findUnique({
      where: { id: req.params.resultId },
      include: {
        test: { select: { authorId: true, title: true } },
        user: { select: { id: true, name: true } }
      }
    })

    if (!result) {
      return res.status(404).json({ 
        error: 'Результат не найден' 
      })
    }

    // Проверяем права (автор теста или админ)
    if (result.test.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Нет прав на комментирование' 
      })
    }

    const comment = await prisma.resultComment.create({
      data: {
        resultId: result.id,
        authorId: req.user.id,
        text
      },
      include: {
        author: { select: { name: true } }
      }
    })

    // Уведомляем студента
    if (result.user.id !== req.user.id) {
      await createNotification({
        userId: result.user.id,
        senderId: req.user.id,
        type: 'comment',
        title: 'Новый комментарий',
        message: `Учитель оставил комментарий к вашему результату теста "${result.test.title}"`,
        link: `/results/${result.id}`
      })
    }

    res.status(201).json({ 
      comment,
      message: 'Комментарий добавлен'
    })

  } catch (error) {
    console.error('❌ Add comment error:', error)
    res.status(500).json({ error: 'Ошибка добавления комментария' })
  }
})

/**
 * DELETE /api/tests/comments/:commentId
 * Удаление комментария
 * Требует авторизации + авторство комментария (или admin)
 */
router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const comment = await prisma.resultComment.findUnique({
      where: { id: req.params.commentId }
    })

    if (!comment) {
      return res.status(404).json({ 
        error: 'Комментарий не найден' 
      })
    }

    // Проверяем права
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Нет прав на удаление' 
      })
    }

    await prisma.resultComment.delete({
      where: { id: req.params.commentId }
    })

    res.json({ message: 'Комментарий удалён' })

  } catch (error) {
    console.error('❌ Delete comment error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router
