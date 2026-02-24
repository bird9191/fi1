/**
 * ==========================================
 * КОНСТАНТЫ ПРИЛОЖЕНИЯ (constants/index.ts)
 * ==========================================
 */

// ==========================================
// РОЛИ ПОЛЬЗОВАТЕЛЕЙ
// ==========================================

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
} as const

export const ROLE_NAMES: Record<string, string> = {
  student: 'Студент',
  teacher: 'Учитель',
  admin: 'Администратор'
}

// ==========================================
// ТИПЫ ТЕСТОВ
// ==========================================

export const TEST_TYPES = {
  TEST: 'test',
  EXAM: 'exam'
} as const

export const TEST_TYPE_NAMES: Record<string, string> = {
  test: 'Тест',
  exam: 'Экзамен'
}

// ==========================================
// ТИПЫ ВОПРОСОВ
// ==========================================

export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  TEXT: 'text'
} as const

export const QUESTION_TYPE_NAMES: Record<string, string> = {
  single: 'Один ответ',
  multiple: 'Несколько ответов',
  text: 'Текстовый ответ'
}

// ==========================================
// СЛОЖНОСТЬ
// ==========================================

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
} as const

export const DIFFICULTY_NAMES: Record<string, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный'
}

// ==========================================
// ВИДИМОСТЬ ТЕСТОВ
// ==========================================

export const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  LINK: 'link'
} as const

export const VISIBILITY_NAMES: Record<string, string> = {
  public: 'Публичный',
  private: 'Приватный',
  link: 'По ссылке'
}

// ==========================================
// НАСТРОЙКИ ПО УМОЛЧАНИЮ
// ==========================================

export const DEFAULT_SETTINGS = {
  PASSING_SCORE: 60,
  MAX_ATTEMPTS: 0,
  TIME_LIMIT: 0,
  QUESTIONS_PER_PAGE: 1
}

// ==========================================
// ПАГИНАЦИЯ
// ==========================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
}

// ==========================================
// API
// ==========================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ==========================================
// ЛОКАЛЬНОЕ ХРАНИЛИЩЕ
// ==========================================

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme-dark'
}

// ==========================================
// ЦВЕТА СТАТУСОВ
// ==========================================

export const STATUS_COLORS = {
  success: '#22c55e',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#3b82f6'
}

// ==========================================
// МАРШРУТЫ
// ==========================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TESTS: '/tests',
  PROFILE: '/profile',
  ADMIN: '/admin',
  RESULTS: '/results'
}





