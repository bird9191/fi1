import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/auth.js'
import testsRoutes from './routes/tests.js'
import usersRoutes from './routes/users.js'
import notificationsRoutes from './routes/notifications.js'
import categoriesRoutes from './routes/categories.js'
import exportRoutes from './routes/export.js'
import importRoutes from './routes/import.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Слишком много запросов, попробуйте позже' }
})
app.use(limiter)

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 attempts per 15 min
  message: { error: 'Слишком много попыток, попробуйте через 15 минут' }
})

// Body parser (increased limit for file uploads)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// API Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/tests', testsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/import', importRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'auth',
      'email-verification',
      '2fa',
      'password-reset',
      'tests',
      'categories',
      'search',
      'share-links',
      'notifications',
      'comments',
      'export-pdf',
      'export-excel',
      'import-questions',
      'admin-panel'
    ]
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  console.error(err.stack)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 TestMaster Backend v2.0.0`)
  console.log(`📍 Server: http://localhost:${PORT}`)
  console.log(`💚 Health: http://localhost:${PORT}/api/health`)
  console.log(`\n📋 Available endpoints:`)
  console.log(`   /api/auth      - Authentication, 2FA, email verification`)
  console.log(`   /api/tests     - Tests CRUD, search, share links`)
  console.log(`   /api/users     - User profile, avatar`)
  console.log(`   /api/notifications - Notifications`)
  console.log(`   /api/categories    - Test categories`)
  console.log(`   /api/export    - PDF/Excel export`)
  console.log(`   /api/import    - Import questions`)
  console.log(`   /api/admin     - Admin panel\n`)
})
