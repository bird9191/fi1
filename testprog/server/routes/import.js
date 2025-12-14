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

// Импорт вопросов из JSON
router.post('/questions/json', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Только учителя могут импортировать вопросы' })
    }

    const { testId, questions, createNewTest, testTitle, testDescription } = req.body

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Массив вопросов обязателен' })
    }

    // Валидация формата вопросов
    const validatedQuestions = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      if (!q.text) {
        return res.status(400).json({ error: `Вопрос ${i + 1}: текст обязателен` })
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ error: `Вопрос ${i + 1}: минимум 2 варианта ответа` })
      }

      const hasCorrect = q.options.some(o => o.isCorrect)
      if (!hasCorrect) {
        return res.status(400).json({ error: `Вопрос ${i + 1}: должен быть хотя бы один правильный ответ` })
      }

      validatedQuestions.push({
        text: q.text,
        type: q.type || 'single',
        points: q.points || 10,
        difficulty: q.difficulty || 'medium',
        category: q.category || null,
        hint: q.hint || null,
        explanation: q.explanation || null,
        options: q.options.map((o, idx) => ({
          text: o.text,
          isCorrect: !!o.isCorrect,
          order: idx
        }))
      })
    }

    let test

    if (createNewTest) {
      // Создать новый тест с импортированными вопросами
      if (!testTitle) {
        return res.status(400).json({ error: 'Название теста обязательно' })
      }

      test = await prisma.test.create({
        data: {
          title: testTitle,
          description: testDescription || '',
          authorId: req.user.id,
          questions: {
            create: validatedQuestions.map((q, idx) => ({
              ...q,
              order: idx,
              options: {
                create: q.options
              }
            }))
          }
        },
        include: {
          questions: { include: { options: true } }
        }
      })
    } else if (testId) {
      // Добавить вопросы к существующему тесту
      test = await prisma.test.findFirst({
        where: { id: testId, authorId: req.user.id }
      })

      if (!test) {
        return res.status(404).json({ error: 'Тест не найден или у вас нет доступа' })
      }

      // Получить текущее количество вопросов
      const existingCount = await prisma.question.count({
        where: { testId }
      })

      // Добавить новые вопросы
      await prisma.$transaction(
        validatedQuestions.map((q, idx) =>
          prisma.question.create({
            data: {
              testId,
              text: q.text,
              type: q.type,
              points: q.points,
              difficulty: q.difficulty,
              category: q.category,
              hint: q.hint,
              explanation: q.explanation,
              order: existingCount + idx,
              options: {
                create: q.options
              }
            }
          })
        )
      )

      test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
          questions: { include: { options: true } }
        }
      })
    } else {
      return res.status(400).json({ error: 'Укажите testId или createNewTest: true' })
    }

    // Сохранить историю импорта
    await prisma.importHistory.create({
      data: {
        filename: 'json-import',
        questionsCount: validatedQuestions.length,
        status: 'success',
        testId: test.id
      }
    })

    res.json({
      message: `Успешно импортировано ${validatedQuestions.length} вопросов`,
      test,
      importedCount: validatedQuestions.length
    })
  } catch (error) {
    console.error('Import JSON error:', error)
    res.status(500).json({ error: 'Ошибка импорта' })
  }
})

// Импорт из текстового формата
// Формат:
// Q: Текст вопроса?
// A: Вариант 1
// A: Вариант 2 *
// A: Вариант 3
// (* - правильный ответ)
router.post('/questions/text', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Только учителя могут импортировать вопросы' })
    }

    const { testId, text, createNewTest, testTitle, testDescription } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Текст обязателен' })
    }

    // Парсинг текста
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    const questions = []
    let currentQuestion = null

    for (const line of lines) {
      if (line.startsWith('Q:') || line.startsWith('В:') || line.startsWith('Вопрос:')) {
        if (currentQuestion && currentQuestion.options.length >= 2) {
          questions.push(currentQuestion)
        }
        currentQuestion = {
          text: line.replace(/^(Q:|В:|Вопрос:)\s*/, ''),
          type: 'single',
          points: 10,
          difficulty: 'medium',
          options: []
        }
      } else if ((line.startsWith('A:') || line.startsWith('О:') || line.startsWith('Ответ:')) && currentQuestion) {
        let optionText = line.replace(/^(A:|О:|Ответ:)\s*/, '')
        const isCorrect = optionText.includes('*') || optionText.includes('(правильный)')
        optionText = optionText.replace(/\*|\(правильный\)/g, '').trim()
        
        currentQuestion.options.push({
          text: optionText,
          isCorrect,
          order: currentQuestion.options.length
        })
      }
    }

    // Добавить последний вопрос
    if (currentQuestion && currentQuestion.options.length >= 2) {
      questions.push(currentQuestion)
    }

    if (questions.length === 0) {
      return res.status(400).json({ 
        error: 'Не удалось распознать вопросы. Используйте формат:\nQ: Вопрос?\nA: Вариант 1\nA: Вариант 2 *'
      })
    }

    // Проверить что у каждого вопроса есть правильный ответ
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].options.some(o => o.isCorrect)) {
        return res.status(400).json({ 
          error: `Вопрос "${questions[i].text.substring(0, 30)}..." не имеет правильного ответа. Отметьте его символом *`
        })
      }
    }

    // Создать или обновить тест (аналогично JSON импорту)
    let test

    if (createNewTest) {
      if (!testTitle) {
        return res.status(400).json({ error: 'Название теста обязательно' })
      }

      test = await prisma.test.create({
        data: {
          title: testTitle,
          description: testDescription || '',
          authorId: req.user.id,
          questions: {
            create: questions.map((q, idx) => ({
              text: q.text,
              type: q.type,
              points: q.points,
              difficulty: q.difficulty,
              order: idx,
              options: {
                create: q.options
              }
            }))
          }
        },
        include: {
          questions: { include: { options: true } }
        }
      })
    } else if (testId) {
      test = await prisma.test.findFirst({
        where: { id: testId, authorId: req.user.id }
      })

      if (!test) {
        return res.status(404).json({ error: 'Тест не найден' })
      }

      const existingCount = await prisma.question.count({
        where: { testId }
      })

      await prisma.$transaction(
        questions.map((q, idx) =>
          prisma.question.create({
            data: {
              testId,
              text: q.text,
              type: q.type,
              points: q.points,
              difficulty: q.difficulty,
              order: existingCount + idx,
              options: {
                create: q.options
              }
            }
          })
        )
      )

      test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
          questions: { include: { options: true } }
        }
      })
    } else {
      return res.status(400).json({ error: 'Укажите testId или createNewTest: true' })
    }

    await prisma.importHistory.create({
      data: {
        filename: 'text-import',
        questionsCount: questions.length,
        status: 'success',
        testId: test.id
      }
    })

    res.json({
      message: `Успешно импортировано ${questions.length} вопросов`,
      test,
      importedCount: questions.length
    })
  } catch (error) {
    console.error('Import text error:', error)
    res.status(500).json({ error: 'Ошибка импорта' })
  }
})

// Шаблон для импорта
router.get('/template', (req, res) => {
  const jsonTemplate = {
    questions: [
      {
        text: "Какой язык используется для стилизации веб-страниц?",
        type: "single",
        points: 10,
        difficulty: "easy",
        category: "Web",
        hint: "Каскадные таблицы стилей",
        explanation: "CSS (Cascading Style Sheets) используется для стилизации HTML",
        options: [
          { text: "HTML", isCorrect: false },
          { text: "CSS", isCorrect: true },
          { text: "JavaScript", isCorrect: false },
          { text: "Python", isCorrect: false }
        ]
      },
      {
        text: "Выберите все языки программирования:",
        type: "multiple",
        points: 15,
        difficulty: "medium",
        options: [
          { text: "Python", isCorrect: true },
          { text: "HTML", isCorrect: false },
          { text: "JavaScript", isCorrect: true },
          { text: "CSS", isCorrect: false }
        ]
      }
    ]
  }

  const textTemplate = `Q: Какой язык используется для стилизации веб-страниц?
A: HTML
A: CSS *
A: JavaScript
A: Python

Q: Какой год считается годом основания интернета?
A: 1969 *
A: 1989
A: 1991
A: 2000

Примечания:
- Q: или В: - начало вопроса
- A: или О: - вариант ответа
- * - отмечает правильный ответ
- Пустая строка разделяет вопросы`

  res.json({
    jsonTemplate,
    textTemplate,
    instructions: {
      json: "Отправьте POST /api/import/questions/json с телом { questions: [...], createNewTest: true, testTitle: 'Название' }",
      text: "Отправьте POST /api/import/questions/text с телом { text: '...', createNewTest: true, testTitle: 'Название' }"
    }
  })
})

// История импортов
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await prisma.importHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json({ history })
  } catch (error) {
    console.error('Get import history error:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

export default router




