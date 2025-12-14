import express from 'express'
import jwt from 'jsonwebtoken'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
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

// Экспорт результата в PDF
router.get('/result/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await prisma.testResult.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { test: { authorId: req.user.id } }
        ]
      },
      include: {
        test: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        user: { select: { name: true, email: true } }
      }
    })

    if (!result) {
      return res.status(404).json({ error: 'Результат не найден' })
    }

    const answers = JSON.parse(result.answersJson || '[]')
    const stats = JSON.parse(result.statsJson || '[]')

    // Создаём PDF
    const doc = new PDFDocument({ margin: 50 })
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="result-${result.id}.pdf"`)
    
    doc.pipe(res)

    // Заголовок
    doc.fontSize(24).text('Результат теста', { align: 'center' })
    doc.moveDown()

    // Информация о тесте
    doc.fontSize(14).text(`Тест: ${result.test.title}`)
    doc.text(`Студент: ${result.user.name} (${result.user.email})`)
    doc.text(`Дата: ${new Date(result.completedAt).toLocaleString('ru-RU')}`)
    doc.text(`Режим: ${result.mode === 'exam' ? 'Экзамен' : 'Тренировка'}`)
    doc.moveDown()

    // Результат
    const scoreColor = result.percentage >= 70 ? '#22c55e' : result.percentage >= 50 ? '#f59e0b' : '#ef4444'
    doc.fontSize(20).fillColor(scoreColor).text(`Результат: ${result.percentage}%`, { align: 'center' })
    doc.fillColor('#000000')
    doc.fontSize(12).text(`${result.score} из ${result.maxScore} баллов`, { align: 'center' })
    doc.text(`Время: ${Math.floor(result.totalTime / 60)} мин ${result.totalTime % 60} сек`, { align: 'center' })
    doc.moveDown(2)

    // Детали по вопросам
    doc.fontSize(16).text('Детали ответов:')
    doc.moveDown()

    result.test.questions.forEach((question, idx) => {
      const answer = answers.find(a => a.questionId === question.id)
      const stat = stats.find(s => s.questionId === question.id)
      const isCorrect = stat?.isCorrect

      doc.fontSize(12).fillColor(isCorrect ? '#22c55e' : '#ef4444')
      doc.text(`${idx + 1}. ${question.text}`)
      doc.fillColor('#000000')
      
      if (question.type !== 'text') {
        const correctOptions = question.options.filter(o => o.isCorrect).map(o => o.text)
        const selectedOptions = question.options
          .filter(o => answer?.selectedOptionIds?.includes(o.id))
          .map(o => o.text)

        doc.fontSize(10)
        doc.text(`   Правильный ответ: ${correctOptions.join(', ')}`)
        doc.text(`   Ваш ответ: ${selectedOptions.join(', ') || 'Нет ответа'}`)
      }
      
      doc.moveDown(0.5)
    })

    doc.end()
  } catch (error) {
    console.error('Export PDF error:', error)
    res.status(500).json({ error: 'Ошибка экспорта' })
  }
})

// Экспорт результатов теста в Excel (для учителя)
router.get('/test/:id/excel', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findFirst({
      where: {
        id: req.params.id,
        authorId: req.user.id
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        },
        results: {
          include: {
            user: { select: { name: true, email: true } }
          },
          orderBy: { completedAt: 'desc' }
        }
      }
    })

    if (!test) {
      return res.status(404).json({ error: 'Тест не найден или у вас нет доступа' })
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'TestMaster'
    workbook.created = new Date()

    // Лист со сводкой
    const summarySheet = workbook.addWorksheet('Сводка')
    summarySheet.columns = [
      { header: 'Студент', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Баллы', key: 'score', width: 12 },
      { header: 'Максимум', key: 'maxScore', width: 12 },
      { header: 'Процент', key: 'percentage', width: 12 },
      { header: 'Режим', key: 'mode', width: 15 },
      { header: 'Время (сек)', key: 'time', width: 15 },
      { header: 'Дата', key: 'date', width: 20 }
    ]

    // Стилизация заголовка
    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    }
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    test.results.forEach(result => {
      const row = summarySheet.addRow({
        name: result.user.name,
        email: result.user.email,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        mode: result.mode === 'exam' ? 'Экзамен' : 'Тренировка',
        time: result.totalTime,
        date: new Date(result.completedAt).toLocaleString('ru-RU')
      })

      // Цвет по проценту
      const percentCell = row.getCell('percentage')
      if (result.percentage >= 70) {
        percentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } }
      } else if (result.percentage >= 50) {
        percentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }
      } else {
        percentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }
      }
    })

    // Лист с детальными ответами
    const detailSheet = workbook.addWorksheet('Детали')
    const detailColumns = [
      { header: 'Студент', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      ...test.questions.map((q, idx) => ({
        header: `В${idx + 1}`,
        key: `q${idx}`,
        width: 8
      })),
      { header: 'Итого', key: 'total', width: 10 }
    ]
    detailSheet.columns = detailColumns

    detailSheet.getRow(1).font = { bold: true }

    test.results.forEach(result => {
      const answers = JSON.parse(result.answersJson || '[]')
      const stats = JSON.parse(result.statsJson || '[]')
      
      const rowData = {
        name: result.user.name,
        email: result.user.email,
        total: `${result.score}/${result.maxScore}`
      }

      test.questions.forEach((question, idx) => {
        const stat = stats.find(s => s.questionId === question.id)
        rowData[`q${idx}`] = stat?.isCorrect ? '✓' : '✗'
      })

      detailSheet.addRow(rowData)
    })

    // Статистика по вопросам
    const statsSheet = workbook.addWorksheet('Статистика вопросов')
    statsSheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Вопрос', key: 'text', width: 50 },
      { header: 'Сложность', key: 'difficulty', width: 15 },
      { header: 'Правильных', key: 'correct', width: 15 },
      { header: 'Всего', key: 'total', width: 10 },
      { header: '% успеха', key: 'rate', width: 12 }
    ]

    statsSheet.getRow(1).font = { bold: true }

    test.questions.forEach((question, idx) => {
      let correctCount = 0
      let totalCount = 0

      test.results.forEach(result => {
        const stats = JSON.parse(result.statsJson || '[]')
        const stat = stats.find(s => s.questionId === question.id)
        if (stat) {
          totalCount++
          if (stat.isCorrect) correctCount++
        }
      })

      statsSheet.addRow({
        num: idx + 1,
        text: question.text.substring(0, 100),
        difficulty: question.difficulty === 'easy' ? 'Лёгкий' : question.difficulty === 'hard' ? 'Сложный' : 'Средний',
        correct: correctCount,
        total: totalCount,
        rate: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      })
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="results-${test.id}.xlsx"`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error('Export Excel error:', error)
    res.status(500).json({ error: 'Ошибка экспорта' })
  }
})

// Экспорт всех результатов пользователя
router.get('/my-results/excel', authMiddleware, async (req, res) => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: req.user.id },
      include: {
        test: { select: { title: true } }
      },
      orderBy: { completedAt: 'desc' }
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Мои результаты')

    sheet.columns = [
      { header: 'Тест', key: 'test', width: 40 },
      { header: 'Баллы', key: 'score', width: 12 },
      { header: 'Максимум', key: 'maxScore', width: 12 },
      { header: 'Процент', key: 'percentage', width: 12 },
      { header: 'Режим', key: 'mode', width: 15 },
      { header: 'Время', key: 'time', width: 15 },
      { header: 'Дата', key: 'date', width: 20 }
    ]

    sheet.getRow(1).font = { bold: true }

    results.forEach(r => {
      sheet.addRow({
        test: r.test.title,
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        mode: r.mode === 'exam' ? 'Экзамен' : 'Тренировка',
        time: `${Math.floor(r.totalTime / 60)}:${(r.totalTime % 60).toString().padStart(2, '0')}`,
        date: new Date(r.completedAt).toLocaleString('ru-RU')
      })
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="my-results.xlsx"')

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error('Export my results error:', error)
    res.status(500).json({ error: 'Ошибка экспорта' })
  }
})

export default router




