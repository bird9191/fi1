/**
 * ============================================
 * ХРАНИЛИЩЕ ТЕСТОВ (Tests Store)
 * ============================================
 * 
 * Управляет тестами и результатами:
 * - Загрузка и CRUD тестов
 * - Прохождение тестов
 * - Сохранение результатов
 * - Статистика
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Test, 
  TestResult, 
  UserAnswer, 
  TestSession, 
  TestMode, 
  QuestionStat 
} from '@/types'
import { useAuthStore } from './auth'
import { api } from '@/services/api'

export const useTestsStore = defineStore('tests', () => {
  // ==========================================
  // СОСТОЯНИЕ
  // ==========================================

  /** Все публичные тесты */
  const tests = ref<Test[]>([])
  
  /** Тесты текущего учителя */
  const teacherTests = ref<Test[]>([])
  
  /** Текущий открытый тест */
  const currentTest = ref<Test | null>(null)
  
  /** Текущая сессия прохождения */
  const currentSession = ref<TestSession | null>(null)
  
  /** Результаты пользователя */
  const userResults = ref<TestResult[]>([])
  
  /** Флаг загрузки */
  const isLoading = ref(false)
  
  /** Текст ошибки */
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  // ==========================================
  // ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ==========================================

  /** Только публичные тесты */
  const publicTests = computed(() =>
    tests.value.filter(t => t.visibility === 'public')
  )

  /** Тесты учителя */
  const myTests = computed(() => teacherTests.value)

  // ==========================================
  // ЗАГРУЗКА ТЕСТОВ
  // ==========================================

  /**
   * Загрузить публичные тесты
   */
  async function loadTests(params?: { search?: string; category?: string }) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.getTests(params)
      if (response.data) {
        tests.value = response.data.tests
      }
    } catch (e) {
      error.value = 'Ошибка загрузки тестов'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузить тесты учителя
   */
  async function loadMyTests() {
    if (!authStore.isTeacher) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.getMyTests()
      if (response.data) {
        teacherTests.value = response.data.tests
      }
    } catch (e) {
      error.value = 'Ошибка загрузки тестов'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузить один тест по ID
   */
  async function loadTest(id: string): Promise<Test | null> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.getTest(id)
      if (response.data) {
        currentTest.value = response.data.test
        return response.data.test
      }
      return null
    } catch (e) {
      error.value = 'Ошибка загрузки теста'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // СОЗДАНИЕ И РЕДАКТИРОВАНИЕ
  // ==========================================

  /**
   * Создать новый тест
   */
  async function createTest(
    testData: Omit<Test, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt'>
  ): Promise<Test | null> {
    if (!authStore.currentUser || authStore.currentUser.role !== 'teacher') {
      error.value = 'Только учителя могут создавать тесты'
      return null
    }

    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.createTest(testData)
      
      if (response.data) {
        const newTest = response.data.test
        
        // Добавляем в списки
        teacherTests.value.push(newTest)
        if (newTest.visibility === 'public') {
          tests.value.push(newTest)
        }
        
        return newTest
      }
      
      error.value = 'Ошибка при создании теста'
      return null
    } catch {
      error.value = 'Ошибка при создании теста'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обновить тест
   */
  async function updateTest(id: string, testData: Partial<Test>): Promise<boolean> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.updateTest(id, testData)
      
      if (response.data) {
        const updatedTest = response.data.test
        
        // Обновляем в массивах
        const teacherIdx = teacherTests.value.findIndex(t => t.id === id)
        if (teacherIdx >= 0) {
          teacherTests.value[teacherIdx] = updatedTest
        }
        
        const testsIdx = tests.value.findIndex(t => t.id === id)
        if (testsIdx >= 0) {
          tests.value[testsIdx] = updatedTest
        }
        
        return true
      }
      
      error.value = response.error || 'Ошибка обновления теста'
      return false
    } catch {
      error.value = 'Ошибка обновления теста'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Удалить тест
   */
  async function deleteTest(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.deleteTest(id)
      
      if (!response.error) {
        // Удаляем из массивов
        teacherTests.value = teacherTests.value.filter(t => t.id !== id)
        tests.value = tests.value.filter(t => t.id !== id)
        return true
      }
      
      error.value = response.error
      return false
    } catch {
      error.value = 'Ошибка удаления теста'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // ПРОХОЖДЕНИЕ ТЕСТА
  // ==========================================

  /**
   * Начать сессию теста
   */
  function startTestSession(testId: string, mode: TestMode = 'exam') {
    const test = tests.value.find(t => t.id === testId) || 
                 teacherTests.value.find(t => t.id === testId) || 
                 currentTest.value
    
    if (!test) return

    currentTest.value = test
    
    currentSession.value = {
      testId,
      testType: test.type || 'test',
      startedAt: new Date(),
      answers: [],
      currentQuestionIndex: 0,
      mode,
      markedQuestions: [],
      questionStartTime: Date.now(),
      timePerQuestion: new Map()
    }
  }

  /**
   * Отметить/снять отметку с вопроса
   */
  function toggleMarkQuestion(questionId: string) {
    if (!currentSession.value) return

    const idx = currentSession.value.markedQuestions.indexOf(questionId)
    
    if (idx >= 0) {
      currentSession.value.markedQuestions.splice(idx, 1)
    } else {
      currentSession.value.markedQuestions.push(questionId)
    }
  }

  /**
   * Записать время на вопрос
   */
  function recordQuestionTime(questionId: string) {
    if (!currentSession.value) return

    const timeSpent = Date.now() - currentSession.value.questionStartTime
    const existing = currentSession.value.timePerQuestion.get(questionId) || 0
    
    currentSession.value.timePerQuestion.set(questionId, existing + timeSpent)
    currentSession.value.questionStartTime = Date.now()
  }

  /**
   * Сохранить ответ на вопрос
   */
  function saveAnswer(
    questionId: string, 
    selectedOptionIds: string[], 
    textAnswer?: string
  ) {
    if (!currentSession.value) return

    recordQuestionTime(questionId)

    const timeSpent = currentSession.value.timePerQuestion.get(questionId) || 0
    const existingIdx = currentSession.value.answers.findIndex(
      a => a.questionId === questionId
    )
    
    const answer: UserAnswer = { 
      questionId, 
      selectedOptionIds, 
      textAnswer, 
      timeSpent 
    }

    if (existingIdx >= 0) {
      currentSession.value.answers[existingIdx] = answer
    } else {
      currentSession.value.answers.push(answer)
    }
  }

  /**
   * Проверить ответ (для режима тренировки)
   */
  function checkAnswer(questionId: string): { 
    isCorrect: boolean
    correctAnswers: string[] 
  } | null {
    if (!currentTest.value) return null

    const question = currentTest.value.questions.find(q => q.id === questionId)
    if (!question) return null

    const correctAnswers = question.options
      .filter(o => o.isCorrect)
      .map(o => o.id)
    
    const userAnswer = currentSession.value?.answers.find(
      a => a.questionId === questionId
    )

    if (!userAnswer) {
      return { isCorrect: false, correctAnswers }
    }

    const isCorrect =
      correctAnswers.length === userAnswer.selectedOptionIds.length &&
      correctAnswers.every(id => userAnswer.selectedOptionIds.includes(id))

    return { isCorrect, correctAnswers }
  }

  /**
   * Получить подсказку (только в тренировке)
   */
  function getHint(questionId: string): string | null {
    if (!currentTest.value || currentSession.value?.mode !== 'training') {
      return null
    }
    
    const question = currentTest.value.questions.find(q => q.id === questionId)
    return question?.hint || null
  }

  /**
   * Завершить тест и получить результат
   */
  async function finishTest(): Promise<TestResult | null> {
    if (!currentSession.value || !currentTest.value || !authStore.currentUser) {
      return null
    }

    const test = currentTest.value
    const session = currentSession.value
    
    let score = 0
    let maxScore = 0
    const questionStats: QuestionStat[] = []

    // Подсчёт баллов
    for (const question of test.questions) {
      maxScore += question.points
      
      const userAnswer = session.answers.find(a => a.questionId === question.id)
      const timeSpent = session.timePerQuestion.get(question.id) || 0

      let isCorrect = false
      const correctIds = question.options
        .filter(o => o.isCorrect)
        .map(o => o.id)

      if (userAnswer) {
        if (question.type === 'text') {
          // Текстовые ответы считаем правильными (ручная проверка)
          isCorrect = true
          score += question.points
        } else {
          isCorrect =
            correctIds.length === userAnswer.selectedOptionIds.length &&
            correctIds.every(id => userAnswer.selectedOptionIds.includes(id))

          if (isCorrect) {
            score += question.points
          }
        }
      }

      questionStats.push({
        questionId: question.id,
        questionText: question.text,
        isCorrect,
        timeSpent: Math.round(timeSpent / 1000),
        userAnswer: userAnswer?.selectedOptionIds || [],
        correctAnswer: correctIds,
        category: question.category
      })
    }

    const totalTime = Math.round(
      (Date.now() - session.startedAt.getTime()) / 1000
    )

    // Отправляем на сервер
    const response = await api.submitTest(test.id, {
      answers: session.answers,
      mode: session.mode,
      totalTime,
      questionStats
    })

    // Очищаем сессию
    currentSession.value = null
    currentTest.value = null

    if (response.data) {
      userResults.value.unshift(response.data.result)
      return response.data.result
    }

    // Fallback результат (если сервер недоступен)
    const percentage = maxScore > 0 
      ? Math.round((score / maxScore) * 100) 
      : 0
    
    const fallbackResult: TestResult = {
      id: crypto.randomUUID(),
      testId: test.id,
      testTitle: test.title,
      testType: test.type || 'test',
      userId: authStore.currentUser.id,
      userName: authStore.currentUser.name,
      answers: session.answers,
      score,
      maxScore,
      percentage,
      completedAt: new Date(),
      mode: session.mode,
      totalTime,
      passed: test.passingScore ? percentage >= test.passingScore : true,
      questionStats
    }
    
    userResults.value.unshift(fallbackResult)
    return fallbackResult
  }

  // ==========================================
  // РЕЗУЛЬТАТЫ
  // ==========================================

  /**
   * Загрузить результаты пользователя
   */
  async function loadUserResults() {
    if (!authStore.currentUser) return

    isLoading.value = true
    
    try {
      const response = await api.getMyResults()
      if (response.data) {
        userResults.value = response.data.results
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузить результаты теста (для учителя)
   */
  async function loadTestResults(testId: string): Promise<TestResult[]> {
    const response = await api.getTestResults(testId)
    return response.data?.results || []
  }

  /**
   * Получить результат по ID
   */
  function getResultById(id: string): TestResult | null {
    return userResults.value.find(r => r.id === id) || null
  }

  // ==========================================
  // УТИЛИТЫ
  // ==========================================

  /**
   * Очистить все данные (при выходе)
   */
  function clearAll() {
    tests.value = []
    teacherTests.value = []
    currentTest.value = null
    currentSession.value = null
    userResults.value = []
  }

  // ==========================================
  // ЭКСПОРТ
  // ==========================================

  return {
    // Состояние
    tests,
    teacherTests,
    currentTest,
    currentSession,
    userResults,
    isLoading,
    error,
    
    // Вычисляемые
    publicTests,
    myTests,
    
    // Загрузка
    loadTests,
    loadMyTests,
    loadTest,
    
    // CRUD
    createTest,
    updateTest,
    deleteTest,
    
    // Прохождение
    startTestSession,
    toggleMarkQuestion,
    recordQuestionTime,
    saveAnswer,
    checkAnswer,
    getHint,
    finishTest,
    
    // Результаты
    loadUserResults,
    loadTestResults,
    getResultById,
    
    // Утилиты
    clearAll
  }
})
