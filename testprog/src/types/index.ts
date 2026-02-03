/**
 * ============================================
 * ТИПЫ ДАННЫХ ДЛЯ TESTMASTER
 * ============================================
 * 
 * Этот файл содержит все TypeScript типы и интерфейсы,
 * используемые в приложении.
 */

// ============================================
// ПОЛЬЗОВАТЕЛИ
// ============================================

/** Роли пользователей в системе */
export type UserRole = 'student' | 'teacher' | 'admin'

/** Данные пользователя */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  avatar?: string              // Аватар в формате base64
  phone?: string               // Телефон
  achievements?: string[]      // Список достижений
  totalTestsCompleted?: number // Всего пройдено тестов
  averageScore?: number        // Средний балл
}

/** Данные для регистрации */
export interface RegisterData {
  email: string
  password: string
  name: string
  role: UserRole
}

/** Данные для входа */
export interface LoginData {
  email: string
  password: string
}

// ============================================
// ВОПРОСЫ
// ============================================

/** Типы вопросов */
export type QuestionType = 'single' | 'multiple' | 'text'

/** Уровни сложности */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/** Вариант ответа */
export interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

/** Вопрос теста */
export interface Question {
  id: string
  text: string                  // Текст вопроса
  type: QuestionType            // Тип: один/несколько/текст
  options: AnswerOption[]       // Варианты ответов
  points: number                // Баллы за правильный ответ
  difficulty?: DifficultyLevel  // Сложность
  category?: string             // Категория/тема
  hint?: string                 // Подсказка (для тренировки)
  explanation?: string          // Объяснение ответа
}

// ============================================
// ТЕСТЫ И ЭКЗАМЕНЫ
// ============================================

/** Видимость теста */
export type TestVisibility = 'public' | 'private'

/** Тип: тест или экзамен */
export type TestType = 'test' | 'exam'

/** Режим прохождения */
export type TestMode = 'training' | 'exam'

/**
 * Тест или Экзамен
 * 
 * ТЕСТ - простой формат:
 * - Быстрое создание
 * - Без таймера
 * - Можно переключать вкладки
 * - Простые результаты
 * 
 * ЭКЗАМЕН - полный формат:
 * - Настраиваемый таймер
 * - Защита от переключения вкладок
 * - Режим тренировки (опционально)
 * - Отметка вопросов
 * - Подробная аналитика
 * - Подсказки и объяснения
 */
export interface Test {
  id: string
  type: TestType
  title: string
  description: string
  authorId: string
  authorName: string
  questions: Question[]
  visibility: TestVisibility
  createdAt: Date
  updatedAt: Date
  
  // Настройки экзамена (только для type: 'exam')
  timeLimit?: number | null        // Лимит времени (минуты)
  allowTrainingMode?: boolean      // Разрешить режим тренировки
  strictMode?: boolean             // Защита от переключения вкладок
  shuffleQuestions?: boolean       // Перемешать вопросы
  shuffleOptions?: boolean         // Перемешать варианты ответов
  showHints?: boolean              // Показывать подсказки
  showExplanations?: boolean       // Показывать объяснения
  passingScore?: number            // Проходной балл (%)
  maxAttempts?: number             // Макс. попыток (null = бесконечно)
}

// ============================================
// ОТВЕТЫ И РЕЗУЛЬТАТЫ
// ============================================

/** Ответ пользователя на вопрос */
export interface UserAnswer {
  questionId: string
  selectedOptionIds: string[]
  textAnswer?: string
  timeSpent?: number        // Время на вопрос (мс)
  isCorrect?: boolean
}

/** Статистика по одному вопросу */
export interface QuestionStat {
  questionId: string
  questionText: string
  isCorrect: boolean
  timeSpent: number         // Время в секундах
  userAnswer: string[]
  correctAnswer: string[]
  category?: string
}

/** Результат прохождения теста */
export interface TestResult {
  id: string
  testId: string
  testTitle: string
  testType: TestType
  userId: string
  userName: string
  answers: UserAnswer[]
  score: number             // Набранные баллы
  maxScore: number          // Максимум баллов
  percentage: number        // Процент правильных
  completedAt: Date
  mode: TestMode
  totalTime: number         // Общее время (секунды)
  passed?: boolean          // Сдал/не сдал
  questionStats?: QuestionStat[]
}

// ============================================
// СЕССИЯ ТЕСТА
// ============================================

/** Состояние прохождения теста */
export interface TestSession {
  testId: string
  testType: TestType
  startedAt: Date
  answers: UserAnswer[]
  currentQuestionIndex: number
  mode: TestMode
  markedQuestions: string[]           // Отмеченные вопросы
  questionStartTime: number           // Время начала текущего вопроса
  timePerQuestion: Map<string, number> // Время на каждый вопрос
}

// ============================================
// ДОСТИЖЕНИЯ
// ============================================

/** Достижение пользователя */
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: Date
}

/** Список всех достижений */
export const ACHIEVEMENTS: Achievement[] = [
  { 
    id: 'first_test', 
    title: 'Первый шаг', 
    description: 'Пройдите свой первый тест', 
    icon: '1' 
  },
  { 
    id: 'perfect_score', 
    title: 'Отличник', 
    description: 'Получите 100% на любом тесте', 
    icon: 'S' 
  },
  { 
    id: 'speed_demon', 
    title: 'Скоростной', 
    description: 'Завершите тест менее чем за 2 минуты', 
    icon: 'F' 
  },
  { 
    id: 'ten_tests', 
    title: 'Опытный', 
    description: 'Пройдите 10 тестов', 
    icon: '10' 
  },
  { 
    id: 'streak_5', 
    title: 'Серия', 
    description: '5 правильных ответов подряд', 
    icon: '5' 
  },
  { 
    id: 'night_owl', 
    title: 'Сова', 
    description: 'Пройдите тест после полуночи', 
    icon: 'N' 
  },
]
