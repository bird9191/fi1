import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Test, TestResult, UserAnswer, TestSession, TestMode, QuestionStat, TestType } from '@/types'
import { useAuthStore } from './auth'
import { api } from '@/services/api'

export const useTestsStore = defineStore('tests', () => {
  const tests = ref<Test[]>([])
  const teacherTests = ref<Test[]>([]) // Отдельный массив для тестов учителя
  const currentTest = ref<Test | null>(null)
  const currentSession = ref<TestSession | null>(null)
  const userResults = ref<TestResult[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  // Публичные тесты
  const publicTests = computed(() =>
    tests.value.filter(t => t.visibility === 'public')
  )

  // Тесты учителя (из отдельного массива)
  const myTests = computed(() => teacherTests.value)

  // Загрузить публичные тесты
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

  // Загрузить тесты учителя
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

  // Загрузить один тест
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

  // Создать тест
  async function createTest(testData: Omit<Test, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt'>): Promise<Test | null> {
    if (!authStore.currentUser || authStore.currentUser.role !== 'teacher') {
      error.value = 'Только учителя могут создавать тесты'
      return null
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await api.createTest(testData)
      if (response.data) {
        // Добавляем в оба массива если публичный
        teacherTests.value.push(response.data.test)
        if (response.data.test.visibility === 'public') {
          tests.value.push(response.data.test)
        }
        return response.data.test
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

  // Обновить тест
  async function updateTest(id: string, testData: Partial<Test>): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.updateTest(id, testData)
      if (response.data) {
        const updatedTest = response.data.test
        
        // Обновляем в массиве тестов учителя
        const teacherIndex = teacherTests.value.findIndex(t => t.id === id)
        if (teacherIndex >= 0) {
          teacherTests.value[teacherIndex] = updatedTest
        }
        
        // Обновляем в общем массиве
        const testsIndex = tests.value.findIndex(t => t.id === id)
        if (testsIndex >= 0) {
          tests.value[testsIndex] = updatedTest
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

  // Удалить тест
  async function deleteTest(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.deleteTest(id)
      if (!response.error) {
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

  // Начать сессию теста
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

  // Отметить вопрос
  function toggleMarkQuestion(questionId: string) {
    if (!currentSession.value) return

    const index = currentSession.value.markedQuestions.indexOf(questionId)
    if (index >= 0) {
      currentSession.value.markedQuestions.splice(index, 1)
    } else {
      currentSession.value.markedQuestions.push(questionId)
    }
  }

  // Записать время на вопрос
  function recordQuestionTime(questionId: string) {
    if (!currentSession.value) return

    const timeSpent = Date.now() - currentSession.value.questionStartTime
    const existing = currentSession.value.timePerQuestion.get(questionId) || 0
    currentSession.value.timePerQuestion.set(questionId, existing + timeSpent)
    currentSession.value.questionStartTime = Date.now()
  }

  // Сохранить ответ
  function saveAnswer(questionId: string, selectedOptionIds: string[], textAnswer?: string) {
    if (!currentSession.value) return

    recordQuestionTime(questionId)

    const timeSpent = currentSession.value.timePerQuestion.get(questionId) || 0
    const existingIndex = currentSession.value.answers.findIndex(a => a.questionId === questionId)
    const answer: UserAnswer = { questionId, selectedOptionIds, textAnswer, timeSpent }

    if (existingIndex >= 0) {
      currentSession.value.answers[existingIndex] = answer
    } else {
      currentSession.value.answers.push(answer)
    }
  }

  // Проверить ответ (для тренировки)
  function checkAnswer(questionId: string): { isCorrect: boolean; correctAnswers: string[] } | null {
    if (!currentTest.value) return null

    const question = currentTest.value.questions.find(q => q.id === questionId)
    if (!question) return null

    const correctAnswers = question.options.filter(o => o.isCorrect).map(o => o.id)
    const userAnswer = currentSession.value?.answers.find(a => a.questionId === questionId)

    if (!userAnswer) return { isCorrect: false, correctAnswers }

    const isCorrect =
      correctAnswers.length === userAnswer.selectedOptionIds.length &&
      correctAnswers.every(id => userAnswer.selectedOptionIds.includes(id))

    return { isCorrect, correctAnswers }
  }

  // Получить подсказку
  function getHint(questionId: string): string | null {
    if (!currentTest.value || currentSession.value?.mode !== 'training') return null
    const question = currentTest.value.questions.find(q => q.id === questionId)
    return question?.hint || null
  }

  // Завершить тест
  async function finishTest(): Promise<TestResult | null> {
    if (!currentSession.value || !currentTest.value || !authStore.currentUser) {
      return null
    }

    const test = currentTest.value
    const session = currentSession.value
    let score = 0
    let maxScore = 0
    const questionStats: QuestionStat[] = []

    for (const question of test.questions) {
      maxScore += question.points
      const userAnswer = session.answers.find(a => a.questionId === question.id)
      const timeSpent = session.timePerQuestion.get(question.id) || 0

      let isCorrect = false
      const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id)

      if (userAnswer) {
        if (question.type === 'text') {
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

    const totalTime = Math.round((Date.now() - session.startedAt.getTime()) / 1000)

    // Отправка на сервер
    const response = await api.submitTest(test.id, {
      answers: session.answers,
      mode: session.mode,
      totalTime,
      questionStats
    })

    currentSession.value = null
    currentTest.value = null

    if (response.data) {
      // Добавляем результат в список
      userResults.value.unshift(response.data.result)
      return response.data.result
    }

    // Fallback результат
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
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

  // Загрузить результаты пользователя
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

  // Загрузить результаты теста (для учителя)
  async function loadTestResults(testId: string): Promise<TestResult[]> {
    const response = await api.getTestResults(testId)
    return response.data?.results || []
  }

  // Получить результат по ID
  function getResultById(id: string): TestResult | null {
    return userResults.value.find(r => r.id === id) || null
  }

  // Очистить данные при выходе
  function clearAll() {
    tests.value = []
    teacherTests.value = []
    currentTest.value = null
    currentSession.value = null
    userResults.value = []
  }

  return {
    tests,
    teacherTests,
    currentTest,
    currentSession,
    userResults,
    isLoading,
    error,
    publicTests,
    myTests,
    loadTests,
    loadMyTests,
    loadTest,
    createTest,
    updateTest,
    deleteTest,
    startTestSession,
    toggleMarkQuestion,
    recordQuestionTime,
    saveAnswer,
    checkAnswer,
    getHint,
    finishTest,
    loadUserResults,
    loadTestResults,
    getResultById,
    clearAll
  }
})
