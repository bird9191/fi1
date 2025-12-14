// Роли пользователей
export type UserRole = 'student' | 'teacher' | 'admin'

// Пользователь
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  avatar?: string
  phone?: string
  achievements?: string[]
  totalTestsCompleted?: number
  averageScore?: number
}

// Данные для регистрации
export interface RegisterData {
  email: string
  password: string
  name: string
  role: UserRole
}

// Данные для входа
export interface LoginData {
  email: string
  password: string
}

// Тип вопроса
export type QuestionType = 'single' | 'multiple' | 'text'

// Уровень сложности вопроса
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// Вариант ответа
export interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

// Вопрос
export interface Question {
  id: string
  text: string
  type: QuestionType
  options: AnswerOption[]
  points: number
  difficulty?: DifficultyLevel
  category?: string
  hint?: string
  explanation?: string
}

// Видимость теста
export type TestVisibility = 'public' | 'private'

// Тип: тест или экзамен
export type TestType = 'test' | 'exam'

// Режим прохождения
export type TestMode = 'training' | 'exam'

/**
 * ТЕСТ - простой формат
 * - Быстрое создание
 * - Без таймера
 * - Можно переключать вкладки
 * - Простые результаты
 * 
 * ЭКЗАМЕН - полный формат
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
  
  // Только для экзаменов
  timeLimit?: number | null        // Лимит времени в минутах
  allowTrainingMode?: boolean      // Разрешить режим тренировки
  strictMode?: boolean             // Защита от переключения вкладок
  shuffleQuestions?: boolean       // Перемешать вопросы
  shuffleOptions?: boolean         // Перемешать варианты ответов
  showHints?: boolean              // Показывать подсказки
  showExplanations?: boolean       // Показывать объяснения после ответа
  passingScore?: number            // Проходной балл в процентах
  maxAttempts?: number             // Максимум попыток (null = бесконечно)
}

// Ответ пользователя на вопрос
export interface UserAnswer {
  questionId: string
  selectedOptionIds: string[]
  textAnswer?: string
  timeSpent?: number
  isCorrect?: boolean
}

// Статистика по вопросу
export interface QuestionStat {
  questionId: string
  questionText: string
  isCorrect: boolean
  timeSpent: number
  userAnswer: string[]
  correctAnswer: string[]
  category?: string
}

// Результат прохождения теста
export interface TestResult {
  id: string
  testId: string
  testTitle: string
  testType: TestType
  userId: string
  userName: string
  answers: UserAnswer[]
  score: number
  maxScore: number
  percentage: number
  completedAt: Date
  mode: TestMode
  totalTime: number
  passed?: boolean
  questionStats?: QuestionStat[]
}

// Состояние прохождения теста
export interface TestSession {
  testId: string
  testType: TestType
  startedAt: Date
  answers: UserAnswer[]
  currentQuestionIndex: number
  mode: TestMode
  markedQuestions: string[]
  questionStartTime: number
  timePerQuestion: Map<string, number>
}

// Достижение
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: Date
}

// Список достижений
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_test', title: 'Первый шаг', description: 'Пройдите свой первый тест', icon: '1' },
  { id: 'perfect_score', title: 'Отличник', description: 'Получите 100% на любом тесте', icon: 'S' },
  { id: 'speed_demon', title: 'Скоростной', description: 'Завершите тест менее чем за 2 минуты', icon: 'F' },
  { id: 'ten_tests', title: 'Опытный', description: 'Пройдите 10 тестов', icon: '10' },
  { id: 'streak_5', title: 'Серия', description: '5 правильных ответов подряд', icon: '5' },
  { id: 'night_owl', title: 'Сова', description: 'Пройдите тест после полуночи', icon: 'N' },
]
