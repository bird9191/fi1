<template>
  <div class="take-test-page">
    <!-- Tab switch warning modal -->
    <div v-if="showTabWarning" class="modal-overlay">
      <div class="modal warning-modal">
        <div class="warning-icon">!</div>
        <h2>Предупреждение!</h2>
        <p>Вы переключились на другую вкладку или свернули браузер.</p>
        <p class="warning-text">При повторном переключении тест будет автоматически отменён!</p>
        <p class="switch-count">Переключений: {{ tabSwitchCount }} / 2</p>
        <button class="btn btn-primary" @click="continueAfterWarning">Продолжить тест</button>
      </div>
    </div>

    <!-- Test cancelled screen -->
    <div v-if="testCancelled" class="cancelled-screen">
      <div class="cancelled-card">
        <div class="cancelled-icon">X</div>
        <h1>Тест отменён</h1>
        <p>Вы переключились на другую вкладку во время экзамена.</p>
        <p class="cancelled-reason">Это нарушение правил прохождения теста.</p>
        <div class="cancelled-actions">
          <button class="btn btn-primary" @click="goBackToTests">К списку тестов</button>
        </div>
      </div>
    </div>

    <div v-else-if="testsStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка теста...</p>
    </div>

    <div v-else-if="!test" class="not-found">
      <h2>Тест не найден</h2>
      <router-link to="/tests" class="btn btn-primary">К списку тестов</router-link>
    </div>

    <!-- Выбор режима -->
    <div v-else-if="!session && !result" class="mode-selection">
      <div class="mode-card">
        <div class="test-type-badge" :class="test.type || 'test'">
          {{ test.type === 'exam' ? 'Экзамен' : 'Тест' }}
        </div>
        <h1>{{ test.title }}</h1>
        <p class="test-desc">{{ test.description }}</p>

        <div class="test-stats">
          <div class="stat">
            <span class="stat-value">{{ test.questions.length }}</span>
            <span class="stat-label">вопросов</span>
          </div>
          <div class="stat" v-if="test.timeLimit">
            <span class="stat-value">{{ test.timeLimit }}</span>
            <span class="stat-label">минут</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ totalPoints }}</span>
            <span class="stat-label">баллов</span>
          </div>
          <div class="stat" v-if="test.type === 'exam' && test.passingScore">
            <span class="stat-value">{{ test.passingScore }}%</span>
            <span class="stat-label">проходной</span>
          </div>
        </div>

        <!-- Для ТЕСТА - простой старт -->
        <div v-if="test.type !== 'exam'" class="simple-start">
          <p class="start-note">Тест без ограничений. Можно переключать вкладки.</p>
          <button class="btn btn-primary btn-lg" @click="startTest('training')">
            Начать тест
          </button>
        </div>

        <!-- Для ЭКЗАМЕНА - выбор режима -->
        <template v-else>
          <h2>Выберите режим</h2>

          <div class="modes">
            <button 
              v-if="test.allowTrainingMode" 
              class="mode-btn training" 
              @click="startTest('training')"
            >
              <span class="mode-icon">T</span>
              <div class="mode-info">
                <span class="mode-title">Тренировка</span>
                <span class="mode-desc">Без таймера, с подсказками</span>
                <span class="mode-note">Результат не учитывается</span>
              </div>
            </button>

            <button class="mode-btn exam" @click="startTest('exam')">
              <span class="mode-icon">E</span>
              <div class="mode-info">
                <span class="mode-title">Экзамен</span>
                <span class="mode-desc">
                  {{ test.timeLimit ? `${test.timeLimit} минут` : 'Без ограничения времени' }}
                </span>
                <span v-if="test.strictMode" class="mode-warning">Переключение вкладки = отмена</span>
              </div>
            </button>
          </div>

          <!-- Информация об экзамене -->
          <div class="exam-info">
            <ul>
              <li v-if="test.shuffleQuestions">Вопросы перемешаны</li>
              <li v-if="test.shuffleOptions">Варианты ответов перемешаны</li>
              <li v-if="test.maxAttempts">Максимум попыток: {{ test.maxAttempts }}</li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <!-- Результат с аналитикой -->
    <div v-else-if="result" class="result-screen">
      <div class="result-card">
        <h1>Тест завершён!</h1>
        <p class="test-title">{{ test?.title }}</p>
        <span class="mode-badge">{{ result.mode === 'training' ? 'Тренировка' : 'Экзамен' }}</span>

        <div class="score-display" :class="getResultClass">
          <span class="score-value">{{ result.percentage }}%</span>
          <span class="score-detail">{{ result.score }} из {{ result.maxScore }} баллов</span>
        </div>

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-value">{{ formatTotalTime(result.totalTime) }}</span>
            <span class="result-stat-label">Общее время</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">{{ correctAnswers }}/{{ result.questionStats?.length }}</span>
            <span class="result-stat-label">Правильных</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-value">{{ avgTimePerQuestion }}с</span>
            <span class="result-stat-label">Среднее время</span>
          </div>
        </div>

        <!-- Детальная аналитика -->
        <div class="analytics" v-if="result.questionStats">
          <h3>Результаты по вопросам</h3>
          <div class="question-results">
            <div
              v-for="(stat, index) in result.questionStats"
              :key="stat.questionId"
              class="question-result"
              :class="{ correct: stat.isCorrect, incorrect: !stat.isCorrect }"
            >
              <div class="qr-header">
                <span class="qr-number">{{ index + 1 }}</span>
                <span class="qr-status">{{ stat.isCorrect ? 'Верно' : 'Неверно' }}</span>
                <span class="qr-time">{{ stat.timeSpent }}с</span>
              </div>
              <p class="qr-text">{{ stat.questionText }}</p>
              <div v-if="stat.category" class="qr-category">{{ stat.category }}</div>
            </div>
          </div>

          <!-- Рекомендации -->
          <div class="recommendations" v-if="weakCategories.length > 0">
            <h3>Рекомендации</h3>
            <p>Повторите следующие темы:</p>
            <ul>
              <li v-for="cat in weakCategories" :key="cat">{{ cat }}</li>
            </ul>
          </div>
        </div>

        <div class="result-actions">
          <router-link to="/tests" class="btn btn-outline">К списку тестов</router-link>
          <button class="btn btn-primary" @click="retryTest">Пройти снова</button>
        </div>
      </div>
    </div>

    <!-- Прохождение теста -->
    <template v-else-if="session">
      <div class="test-header">
        <div class="test-info">
          <h1>{{ test?.title }}</h1>
          <div class="header-badges">
            <span class="mode-badge small">{{ session.mode === 'training' ? 'Тренировка' : 'Экзамен' }}</span>
          </div>
          <div class="progress-info">
            <span>Вопрос {{ currentQuestionIndex + 1 }} из {{ test?.questions.length }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div v-if="session.mode === 'exam' && test?.timeLimit && timeRemaining !== null" class="timer" :class="{ warning: timeRemaining < 60 }">
            <span class="timer-value">{{ formatTime(timeRemaining) }}</span>
          </div>
        </div>
      </div>

      <div class="question-container">
        <div class="question-card">
          <div class="question-meta">
            <span class="question-type">{{ getQuestionTypeLabel(currentQuestion?.type) }}</span>
            <div class="question-actions">
              <button
                class="mark-btn"
                :class="{ marked: isCurrentMarked }"
                @click="toggleMark"
                title="Отметить и вернуться позже"
              >
                {{ isCurrentMarked ? 'Отмечен' : 'Отметить' }}
              </button>
              <span class="question-points">{{ currentQuestion?.points }} баллов</span>
            </div>
          </div>

          <h2 class="question-text">{{ currentQuestion?.text }}</h2>

          <!-- Подсказка в режиме тренировки -->
          <div v-if="session.mode === 'training' && currentQuestion?.hint && showHint" class="hint-box">
            <strong>Подсказка:</strong> {{ currentQuestion.hint }}
          </div>
          <button
            v-if="session.mode === 'training' && currentQuestion?.hint && !showHint"
            class="hint-btn"
            @click="showHint = true"
          >
            Показать подсказку
          </button>

          <!-- Варианты ответов -->
          <div v-if="currentQuestion?.type === 'single'" class="options single">
            <label
              v-for="option in currentQuestion.options"
              :key="option.id"
              class="option-label"
              :class="{
                selected: currentAnswer.selectedOptionIds.includes(option.id),
                correct: showResult && option.isCorrect,
                incorrect: showResult && currentAnswer.selectedOptionIds.includes(option.id) && !option.isCorrect
              }"
            >
              <input
                type="radio"
                :name="currentQuestion.id"
                :value="option.id"
                @change="selectSingleOption(option.id)"
                :checked="currentAnswer.selectedOptionIds.includes(option.id)"
                :disabled="showResult"
              />
              <span class="option-text">{{ option.text }}</span>
            </label>
          </div>

          <div v-else-if="currentQuestion?.type === 'multiple'" class="options multiple">
            <label
              v-for="option in currentQuestion.options"
              :key="option.id"
              class="option-label"
              :class="{
                selected: currentAnswer.selectedOptionIds.includes(option.id),
                correct: showResult && option.isCorrect,
                incorrect: showResult && currentAnswer.selectedOptionIds.includes(option.id) && !option.isCorrect
              }"
            >
              <input
                type="checkbox"
                :value="option.id"
                @change="toggleMultipleOption(option.id)"
                :checked="currentAnswer.selectedOptionIds.includes(option.id)"
                :disabled="showResult"
              />
              <span class="option-text">{{ option.text }}</span>
            </label>
          </div>

          <div v-else class="text-answer">
            <textarea
              v-model="currentAnswer.textAnswer"
              placeholder="Введите ваш ответ..."
              rows="4"
              :disabled="showResult"
            ></textarea>
          </div>

          <!-- Проверка ответа в режиме тренировки -->
          <div v-if="session.mode === 'training' && showResult" class="answer-feedback">
            <div :class="lastCheckResult?.isCorrect ? 'feedback-correct' : 'feedback-incorrect'">
              {{ lastCheckResult?.isCorrect ? 'Правильно!' : 'Неправильно' }}
            </div>
            <div v-if="currentQuestion?.explanation" class="explanation">
              <strong>Объяснение:</strong> {{ currentQuestion.explanation }}
            </div>
          </div>

          <button
            v-if="session.mode === 'training' && !showResult && currentAnswer.selectedOptionIds.length > 0"
            class="btn btn-outline check-btn"
            @click="checkCurrentAnswer"
          >
            Проверить ответ
          </button>
        </div>

        <div class="navigation">
          <button
            type="button"
            class="btn btn-outline"
            @click="prevQuestion"
            :disabled="currentQuestionIndex === 0"
          >
            Назад
          </button>

          <div class="question-dots">
            <span
              v-for="(q, i) in test?.questions"
              :key="q.id"
              class="dot"
              :class="{
                active: i === currentQuestionIndex,
                answered: isQuestionAnswered(i),
                marked: session.markedQuestions.includes(q.id)
              }"
              @click="goToQuestion(i)"
              :title="session.markedQuestions.includes(q.id) ? 'Отмечен' : ''"
            ></span>
          </div>

          <button
            v-if="currentQuestionIndex < (test?.questions.length || 1) - 1"
            type="button"
            class="btn btn-primary"
            @click="nextQuestion"
          >
            Далее
          </button>
          <button
            v-else
            type="button"
            class="btn btn-primary finish"
            @click="finishTest"
          >
            Завершить тест
          </button>
        </div>

        <!-- Отмеченные вопросы -->
        <div v-if="session.markedQuestions.length > 0" class="marked-questions">
          <span class="marked-label">Отмеченные:</span>
          <button
            v-for="qId in session.markedQuestions"
            :key="qId"
            class="marked-item"
            @click="goToQuestionById(qId)"
          >
            {{ getQuestionNumber(qId) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { Test, TestResult, UserAnswer, QuestionType, TestMode } from '@/types'

const route = useRoute()
const router = useRouter()
const testsStore = useTestsStore()

// Anti-cheat: track tab switches
const tabSwitchCount = ref(0)
const showTabWarning = ref(false)
const testCancelled = ref(false)

const test = ref<Test | null>(null)
const session = computed(() => testsStore.currentSession)
const result = ref<TestResult | null>(null)
const currentQuestionIndex = ref(0)
const timeRemaining = ref<number | null>(null)
const timerInterval = ref<number | null>(null)
const showHint = ref(false)
const showResult = ref(false)
const lastCheckResult = ref<{ isCorrect: boolean; correctAnswers: string[] } | null>(null)

const answers = ref(new Map<string, UserAnswer>())

const currentQuestion = computed(() => test.value?.questions[currentQuestionIndex.value])

const currentAnswer = computed((): UserAnswer => {
  if (!currentQuestion.value) return { questionId: '', selectedOptionIds: [] as string[], textAnswer: '' }
  const existing = answers.value.get(currentQuestion.value.id)
  if (existing) return existing
  return { questionId: currentQuestion.value.id, selectedOptionIds: [] as string[], textAnswer: '' }
})

const totalPoints = computed(() =>
  test.value?.questions.reduce((sum, q) => sum + q.points, 0) || 0
)

const progressPercent = computed(() =>
  ((currentQuestionIndex.value + 1) / (test.value?.questions.length || 1)) * 100
)

const isCurrentMarked = computed(() =>
  session.value?.markedQuestions.includes(currentQuestion.value?.id || '') || false
)

const correctAnswers = computed(() =>
  result.value?.questionStats?.filter(s => s.isCorrect).length || 0
)

const avgTimePerQuestion = computed(() => {
  if (!result.value?.questionStats?.length) return 0
  const total = result.value.questionStats.reduce((sum, s) => sum + s.timeSpent, 0)
  return Math.round(total / result.value.questionStats.length)
})

const weakCategories = computed(() => {
  if (!result.value?.questionStats) return []
  const categoryStats: Record<string, { correct: number; total: number }> = {}

  for (const stat of result.value.questionStats) {
    const cat = stat.category || 'Без категории'
    if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 }
    categoryStats[cat].total++
    if (stat.isCorrect) categoryStats[cat].correct++
  }

  return Object.entries(categoryStats)
    .filter(([_, stats]) => stats.correct / stats.total < 0.5)
    .map(([cat]) => cat)
})

const getResultClass = computed(() => {
  if (!result.value) return ''
  const p = result.value.percentage
  if (p >= 80) return 'excellent'
  if (p >= 60) return 'good'
  if (p >= 40) return 'average'
  return 'poor'
})

function getQuestionTypeLabel(type?: QuestionType): string {
  if (!type) return ''
  const labels = {
    single: 'Выберите один ответ',
    multiple: 'Выберите несколько ответов',
    text: 'Введите ответ'
  }
  return labels[type]
}

function startTest(mode: TestMode) {
  if (!test.value) return
  testsStore.startTestSession(test.value.id, mode)
  startTimer()
}

function selectSingleOption(optionId: string) {
  if (!currentQuestion.value || showResult.value) return
  const answer: UserAnswer = {
    questionId: currentQuestion.value.id,
    selectedOptionIds: [optionId]
  }
  answers.value.set(currentQuestion.value.id, answer)
}

function toggleMultipleOption(optionId: string) {
  if (!currentQuestion.value || showResult.value) return
  const existing = answers.value.get(currentQuestion.value.id) || {
    questionId: currentQuestion.value.id,
    selectedOptionIds: []
  }
  const index = existing.selectedOptionIds.indexOf(optionId)
  if (index >= 0) {
    existing.selectedOptionIds.splice(index, 1)
  } else {
    existing.selectedOptionIds.push(optionId)
  }
  answers.value.set(currentQuestion.value.id, existing)
}

function toggleMark() {
  if (!currentQuestion.value) return
  testsStore.toggleMarkQuestion(currentQuestion.value.id)
}

function checkCurrentAnswer() {
  if (!currentQuestion.value) return
  lastCheckResult.value = testsStore.checkAnswer(currentQuestion.value.id)
  showResult.value = true
}

function isQuestionAnswered(index: number): boolean {
  const question = test.value?.questions[index]
  if (!question) return false
  const answer = answers.value.get(question.id)
  if (!answer) return false
  if (question.type === 'text') return !!answer.textAnswer?.trim()
  return answer.selectedOptionIds.length > 0
}

function getQuestionNumber(questionId: string): number {
  const index = test.value?.questions.findIndex(q => q.id === questionId) ?? -1
  return index + 1
}

function goToQuestionById(questionId: string) {
  const index = test.value?.questions.findIndex(q => q.id === questionId) ?? -1
  if (index >= 0) goToQuestion(index)
}

function nextQuestion() {
  saveCurrentAnswer()
  resetQuestionState()
  if (test.value && currentQuestionIndex.value < test.value.questions.length - 1) {
    currentQuestionIndex.value++
  }
}

function prevQuestion() {
  saveCurrentAnswer()
  resetQuestionState()
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function goToQuestion(index: number) {
  saveCurrentAnswer()
  resetQuestionState()
  currentQuestionIndex.value = index
}

function resetQuestionState() {
  showHint.value = false
  showResult.value = false
  lastCheckResult.value = null
}

function saveCurrentAnswer() {
  if (!currentQuestion.value) return
  const answer = currentAnswer.value
  if (answer.selectedOptionIds.length > 0 || answer.textAnswer) {
    testsStore.saveAnswer(currentQuestion.value.id, answer.selectedOptionIds, answer.textAnswer)
  }
}

async function finishTest() {
  saveCurrentAnswer()
  for (const [questionId, answer] of answers.value) {
    testsStore.saveAnswer(questionId, answer.selectedOptionIds, answer.textAnswer)
  }
  result.value = await testsStore.finishTest()
  if (timerInterval.value) clearInterval(timerInterval.value)
}

function retryTest() {
  result.value = null
  answers.value.clear()
  currentQuestionIndex.value = 0
  resetQuestionState()
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTotalTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}м ${secs}с`
  return `${secs}с`
}

function startTimer() {
  if (test.value?.timeLimit && session.value?.mode === 'exam') {
    timeRemaining.value = test.value.timeLimit * 60
    timerInterval.value = window.setInterval(() => {
      if (timeRemaining.value !== null) {
        timeRemaining.value--
        if (timeRemaining.value <= 0) finishTest()
      }
    }, 1000)
  }
}

// Anti-cheat: Handle tab visibility change
function handleVisibilityChange() {
  // Only check in exam mode with strict mode enabled
  if (!session.value || session.value.mode !== 'exam' || testCancelled.value || result.value) {
    return
  }
  
  // Only apply strict mode for exams with strictMode enabled
  if (!test.value?.strictMode) {
    return
  }

  if (document.hidden) {
    tabSwitchCount.value++
    
    // First warning
    if (tabSwitchCount.value === 1) {
      showTabWarning.value = true
    }
    // Second switch - cancel the test
    else if (tabSwitchCount.value >= 2) {
      cancelTestDueToTabSwitch()
    }
  }
}

// Cancel test due to cheating
function cancelTestDueToTabSwitch() {
  testCancelled.value = true
  showTabWarning.value = false
  
  // Clear timer
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  
  // Clear session
  testsStore.currentSession = null
}

// Continue test after warning
function continueAfterWarning() {
  showTabWarning.value = false
}

// Go back to tests list
function goBackToTests() {
  router.push('/tests')
}

watch(currentQuestionIndex, () => {
  if (currentQuestion.value && session.value) {
    testsStore.recordQuestionTime(currentQuestion.value.id)
  }
})

onMounted(async () => {
  const id = route.params.id as string
  test.value = await testsStore.loadTest(id)
  
  // Add visibility change listener for anti-cheat
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  
  // Remove visibility change listener
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.take-test-page {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Warning Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-surface);
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 450px;
  width: 90%;
  text-align: center;
}

.warning-modal {
  border: 2px solid #f59e0b;
}

.warning-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
}

.warning-modal h2 {
  color: #f59e0b;
  margin-bottom: 1rem;
}

.warning-modal p {
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.warning-text {
  color: #ef4444 !important;
  font-weight: 600;
  margin: 1rem 0 !important;
}

.switch-count {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  margin-bottom: 1.5rem !important;
}

/* Cancelled Screen */
.cancelled-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.cancelled-card {
  background: var(--color-surface);
  border: 2px solid #ef4444;
  border-radius: 24px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
}

.cancelled-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
}

.cancelled-card h1 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.cancelled-card p {
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.cancelled-reason {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 2rem !important;
}

.cancelled-actions {
  margin-top: 1.5rem;
}

.loading, .not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mode Selection */
.mode-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.mode-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.test-type-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.test-type-badge.test {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.test-type-badge.exam {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.mode-card h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.test-desc {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

/* Simple test start */
.simple-start {
  margin-top: 1.5rem;
}

.start-note {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.btn-lg {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

/* Exam info */
.exam-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 12px;
}

.exam-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.exam-info li {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  padding: 0.3rem 0.75rem;
  background: var(--color-surface);
  border-radius: 6px;
}

.mode-note {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.test-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 16px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.mode-card h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.modes {
  display: flex;
  gap: 1rem;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.mode-btn:hover {
  border-color: var(--color-primary);
}

.mode-btn.training:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: #4ade80;
}

.mode-btn.exam:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #f87171;
}

.mode-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
}

.mode-btn.training .mode-icon {
  background: linear-gradient(135deg, #22c55e, #10b981);
}

.mode-btn.exam .mode-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.mode-title {
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.mode-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.mode-warning {
  display: block;
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

/* Result Screen */
.result-screen {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.result-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2rem;
  width: 100%;
  max-width: 700px;
}

.result-card h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.test-title {
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 0.5rem;
}

.mode-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--color-background);
  margin-bottom: 1.5rem;
}

.mode-badge.small {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

.score-display {
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.score-display.excellent { background: rgba(34, 197, 94, 0.15); }
.score-display.good { background: rgba(59, 130, 246, 0.15); }
.score-display.average { background: rgba(251, 191, 36, 0.15); }
.score-display.poor { background: rgba(239, 68, 68, 0.15); }

.score-value {
  display: block;
  font-size: 3rem;
  font-weight: 800;
}

.score-display.excellent .score-value { color: #4ade80; }
.score-display.good .score-value { color: #60a5fa; }
.score-display.average .score-value { color: #fbbf24; }
.score-display.poor .score-value { color: #f87171; }

.score-detail {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.result-stat {
  text-align: center;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 12px;
}

.result-stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.result-stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.analytics h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.question-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.question-result {
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid;
}

.question-result.correct {
  background: rgba(34, 197, 94, 0.1);
  border-color: #4ade80;
}

.question-result.incorrect {
  background: rgba(239, 68, 68, 0.1);
  border-color: #f87171;
}

.qr-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.qr-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.qr-status {
  font-size: 0.85rem;
  font-weight: 500;
}

.question-result.correct .qr-status { color: #4ade80; }
.question-result.incorrect .qr-status { color: #f87171; }

.qr-time {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.qr-text {
  font-size: 0.9rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.qr-category {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.recommendations {
  padding: 1rem;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.recommendations h3 {
  color: #fbbf24;
  margin-bottom: 0.5rem;
}

.recommendations ul {
  margin: 0.5rem 0 0 1.5rem;
  color: var(--color-text-muted);
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Test Header */
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.test-info h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.header-badges {
  margin-bottom: 0.75rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-info span {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.timer {
  padding: 0.75rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.timer.warning {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.timer.warning .timer-value {
  color: #f87171;
}

.timer-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 1.1rem;
}

/* Question Card */
.question-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2rem;
}

.question-card {
  margin-bottom: 2rem;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-type {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.question-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mark-btn {
  padding: 0.35rem 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.mark-btn:hover {
  border-color: #fbbf24;
  color: #fbbf24;
}

.mark-btn.marked {
  background: rgba(251, 191, 36, 0.15);
  border-color: #fbbf24;
  color: #fbbf24;
}

.question-points {
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 500;
}

.question-text {
  font-size: 1.25rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.hint-box {
  padding: 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #60a5fa;
}

.hint-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.hint-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-label:hover:not(.correct):not(.incorrect) {
  border-color: var(--color-primary);
}

.option-label.selected {
  border-color: var(--color-primary);
  background: var(--accent-glow);
}

.option-label.correct {
  border-color: #4ade80;
  background: rgba(34, 197, 94, 0.15);
}

.option-label.incorrect {
  border-color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}

.option-label input {
  display: none;
}

.text-answer textarea {
  width: 100%;
  padding: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text);
  resize: vertical;
}

.text-answer textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.answer-feedback {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 12px;
}

.feedback-correct {
  color: #4ade80;
  font-weight: 600;
  font-size: 1.1rem;
}

.feedback-incorrect {
  color: #f87171;
  font-weight: 600;
  font-size: 1.1rem;
}

.explanation {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.check-btn {
  margin-top: 1rem;
}

/* Navigation */
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.question-dots {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.dot:hover {
  background: var(--color-text-muted);
}

.dot.active {
  background: var(--color-primary);
  transform: scale(1.2);
}

.dot.answered {
  background: var(--color-primary);
  opacity: 0.6;
}

.dot.marked {
  box-shadow: 0 0 0 2px #fbbf24;
}

.btn.finish {
  background: linear-gradient(135deg, #22c55e, #10b981);
}

.btn.finish:hover {
  background: linear-gradient(135deg, #16a34a, #059669);
}

.marked-questions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.marked-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.marked-item {
  padding: 0.25rem 0.5rem;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
  border-radius: 6px;
  color: #fbbf24;
  font-size: 0.8rem;
  cursor: pointer;
}

.marked-item:hover {
  background: rgba(251, 191, 36, 0.25);
}

@media (max-width: 768px) {
  .take-test-page {
    padding: 1rem;
  }

  .mode-card {
    padding: 1.5rem;
  }

  .mode-card h1 {
    font-size: 1.5rem;
  }

  .test-stats {
    gap: 1rem;
  }

  .question-card {
    padding: 1.25rem;
  }

  .option-label {
    padding: 0.875rem;
  }

  .result-card {
    padding: 1.5rem;
  }
}

@media (max-width: 600px) {
  .modes {
    flex-direction: column;
  }

  .mode-btn {
    padding: 1rem;
  }

  .test-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .progress-bar {
    width: 100%;
  }

  .question-dots {
    display: none;
  }

  .question-nav {
    flex-direction: column;
    gap: 0.5rem;
  }

  .question-nav .btn {
    width: 100%;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }

  .result-actions {
    flex-direction: column;
  }

  .result-actions .btn {
    width: 100%;
  }

  .score-value {
    font-size: 2.5rem;
  }

  .question-analysis h2 {
    font-size: 1.1rem;
  }
}
</style>
