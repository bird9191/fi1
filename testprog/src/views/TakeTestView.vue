

<template>
  <div class="take-test-page">

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка теста...</p>
    </div>

    <div v-else-if="!test" class="not-found">
      <h2> Тест не найден</h2>
      <router-link to="/tests" class="btn btn-primary">
        ← Вернуться к тестам
      </router-link>
    </div>

    <div v-else-if="!isStarted" class="start-screen">
      <div class="start-card">

        <span class="type-badge" :class="test.type || 'test'">
          {{ test.type === 'exam' ? ' Экзамен' : ' Тест' }}
        </span>

        <h1>{{ test.title }}</h1>
        <p class="description">{{ test.description }}</p>

        <div class="test-info-grid">
          <div class="info-item">
            <span class="info-icon"></span>
            <span>{{ test.questions.length }} вопросов</span>
          </div>
          <div v-if="test.timeLimit" class="info-item">
            <span class="info-icon"></span>
            <span>{{ test.timeLimit }} минут</span>
          </div>
          <div class="info-item">
            <span class="info-icon"></span>
            <span>Проходной балл: {{ test.passingScore || 60 }}%</span>
          </div>
        </div>

        <div v-if="test.strictMode" class="strict-warning">
          <h4> Внимание! Строгий режим</h4>
          <p>
            Если вы переключитесь на другую вкладку или окно,
            экзамен будет автоматически отменён.
          </p>
        </div>

        <div v-if="test.type === 'test' && test.allowTrainingMode" class="mode-select">
          <h4>Выберите режим:</h4>
          <div class="mode-options">
            <label class="mode-option">
              <input type="radio" v-model="selectedMode" value="training" />
              <div class="mode-card">
                <span class="mode-icon"></span>
                <span class="mode-name">Тренировка</span>
                <span class="mode-desc">С подсказками</span>
              </div>
            </label>
            <label class="mode-option">
              <input type="radio" v-model="selectedMode" value="exam" />
              <div class="mode-card">
                <span class="mode-icon"></span>
                <span class="mode-name">Экзамен</span>
                <span class="mode-desc">Без подсказок</span>
              </div>
            </label>
          </div>
        </div>

        <button @click="startTest" class="btn btn-primary btn-large">
           Начать {{ test.type === 'exam' ? 'экзамен' : 'тест' }}
        </button>
        
      </div>
    </div>

    <div v-else class="test-process">

      <div class="test-header">
        <div class="progress-info">
          <span class="current-question">
            Вопрос {{ currentQuestionIndex + 1 }} из {{ shuffledQuestions.length }}
          </span>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <div v-if="test.timeLimit" class="timer" :class="{ warning: timerWarning }">
           {{ formatTime(remainingTime) }}
        </div>
      </div>

      <div class="question-card">
        <h2 class="question-text">
          {{ currentQuestion.text }}
        </h2>

        <div 
          v-if="showHint && currentQuestion.hint" 
          class="hint-box"
        >
           {{ currentQuestion.hint }}
        </div>

        <div 
          v-if="currentQuestion.type === 'single' || currentQuestion.type === 'multiple'" 
          class="options-list"
        >
          <label
            v-for="(option, idx) in currentQuestionOptions"
            :key="idx"
            class="option-item"
            :class="{ selected: isOptionSelected(idx) }"
          >
            <input
              :type="currentQuestion.type === 'single' ? 'radio' : 'checkbox'"
              :value="idx"
              v-model="currentAnswer"
              :name="`question-${currentQuestionIndex}`"
            />
            <span class="option-marker"></span>
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>

        <div v-else-if="currentQuestion.type === 'text'" class="text-answer">
          <textarea
            v-model="currentAnswer"
            placeholder="Введите ваш ответ..."
            rows="4"
          ></textarea>
        </div>
      </div>

      <div class="question-navigation">
        <button
          @click="prevQuestion"
          :disabled="currentQuestionIndex === 0"
          class="btn btn-outline"
        >
          ← Назад
        </button>

        <div class="navigation-dots">
          <button
            v-for="(_, idx) in shuffledQuestions"
            :key="idx"
            class="dot"
            :class="{
              current: idx === currentQuestionIndex,
              answered: answers[idx] !== undefined
            }"
            @click="goToQuestion(idx)"
          >
            {{ idx + 1 }}
          </button>
        </div>

        <button
          v-if="currentQuestionIndex < shuffledQuestions.length - 1"
          @click="nextQuestion"
          class="btn btn-primary"
        >
          Далее →
        </button>
        
        <button
          v-else
          @click="finishTest"
          class="btn btn-success"
        >
           Завершить
        </button>
      </div>
      
    </div>
    
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { Test, Question, AnswerOption } from '@/types'

const route = useRoute()
const router = useRouter()

const testsStore = useTestsStore()

const isLoading = ref(true)

const test = ref<Test | null>(null)

const isStarted = ref(false)

const selectedMode = ref<'training' | 'exam'>('exam')

const currentQuestionIndex = ref(0)

const answers = ref<Record<number, number | number[] | string>>({})

const currentAnswer = ref<number | number[] | string>('')

const shuffledQuestions = ref<Question[]>([])

const currentQuestionOptions = ref<AnswerOption[]>([])

const remainingTime = ref(0)

let timerInterval: ReturnType<typeof setInterval> | null = null

const currentQuestion = computed(() => 
  shuffledQuestions.value[currentQuestionIndex.value]
)

const progressPercent = computed(() => 
  ((currentQuestionIndex.value + 1) / shuffledQuestions.value.length) * 100
)

const timerWarning = computed(() => 
  remainingTime.value < 120
)

const showHint = computed(() => 
  selectedMode.value === 'training' && test.value?.showHints
)

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function isOptionSelected(idx: number): boolean {
  if (Array.isArray(currentAnswer.value)) {
    return currentAnswer.value.includes(idx)
  }
  return currentAnswer.value === idx
}

function startTest(): void {
  if (!test.value) return

  isStarted.value = true

  shuffledQuestions.value = test.value.shuffleQuestions
    ? shuffle(test.value.questions)
    : [...test.value.questions]

  updateCurrentOptions()

  if (test.value.timeLimit) {
    remainingTime.value = test.value.timeLimit * 60
    startTimer()
  }

  if (test.value.strictMode) {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
}

function startTimer(): void {
  timerInterval = setInterval(() => {
    remainingTime.value--
    
    if (remainingTime.value <= 0) {
      
      finishTest()
    }
  }, 1000)
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function updateCurrentOptions(): void {
  const question = currentQuestion.value
  if (!question || !question.options) {
    currentQuestionOptions.value = []
    return
  }

  currentQuestionOptions.value = test.value?.shuffleOptions
    ? shuffle(question.options)
    : [...question.options]
}

function handleVisibilityChange(): void {
  if (document.hidden && test.value?.strictMode && isStarted.value) {
    
    alert(' Экзамен отменён!\n\nВы переключились на другую вкладку в строгом режиме.')
    cancelTest()
  }
}

function cancelTest(): void {
  stopTimer()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  router.push('/tests')
}

function saveCurrentAnswer(): void {
  if (currentAnswer.value !== '' && currentAnswer.value !== undefined) {
    answers.value[currentQuestionIndex.value] = currentAnswer.value
  }
}

function loadSavedAnswer(): void {
  const saved = answers.value[currentQuestionIndex.value]
  
  if (saved !== undefined) {
    currentAnswer.value = saved
  } else {
    
    if (currentQuestion.value?.type === 'multiple') {
      currentAnswer.value = []
    } else {
      currentAnswer.value = ''
    }
  }
}

function prevQuestion(): void {
  if (currentQuestionIndex.value > 0) {
    saveCurrentAnswer()
    currentQuestionIndex.value--
    loadSavedAnswer()
    updateCurrentOptions()
  }
}

function nextQuestion(): void {
  if (currentQuestionIndex.value < shuffledQuestions.value.length - 1) {
    saveCurrentAnswer()
    currentQuestionIndex.value++
    loadSavedAnswer()
    updateCurrentOptions()
  }
}

function goToQuestion(idx: number): void {
  if (idx >= 0 && idx < shuffledQuestions.value.length) {
    saveCurrentAnswer()
    currentQuestionIndex.value = idx
    loadSavedAnswer()
    updateCurrentOptions()
  }
}

async function finishTest(): Promise<void> {
  saveCurrentAnswer()
  stopTimer()
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  let correctCount = 0
  
  shuffledQuestions.value.forEach((question, idx) => {
    const userAnswer = answers.value[idx]
    
    if (question.type === 'single') {
      
      const correctIdx = question.options?.findIndex(opt => opt.isCorrect)
      if (userAnswer === correctIdx) {
        correctCount++
      }
    } else if (question.type === 'multiple') {
      
      const correctIndexes = question.options
        ?.map((opt, i) => opt.isCorrect ? i : -1)
        .filter(i => i !== -1) || []
      
      const userIndexes = Array.isArray(userAnswer) ? userAnswer : []
      
      if (
        correctIndexes.length === userIndexes.length &&
        correctIndexes.every(i => userIndexes.includes(i))
      ) {
        correctCount++
      }
    } else if (question.type === 'text') {
      
      const correct = question.correctAnswer?.toLowerCase().trim()
      const user = String(userAnswer).toLowerCase().trim()
      if (correct === user) {
        correctCount++
      }
    }
  })

  const score = Math.round((correctCount / shuffledQuestions.value.length) * 100)

  try {
    if (test.value) {
      await testsStore.submitTestResult(test.value.id, {
        score,
        answers: answers.value,
        timeSpent: test.value.timeLimit 
          ? (test.value.timeLimit * 60 - remainingTime.value) 
          : 0
      })
    }
  } catch (error) {
    console.error('Ошибка сохранения результата:', error)
  }

  router.push('/results')
}

async function loadTest(): Promise<void> {
  isLoading.value = true
  
  try {
    const testId = route.params.id as string
    test.value = await testsStore.getTestById(testId)
  } catch (error) {
    console.error('Ошибка загрузки теста:', error)
    test.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTest()
})

onUnmounted(() => {
  
  stopTimer()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(currentQuestionIndex, () => {
  updateCurrentOptions()
})
</script>

<style scoped>

.take-test-page {
  min-height: calc(100vh - 60px);
  padding: 2rem;
}

.loading,
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 50vh;
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

.start-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
}

.start-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.type-badge {
  display: inline-block;
  font-size: 0.9rem;
  padding: 0.4rem 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.type-badge.test {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.type-badge.exam {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.start-card h1 {
  font-size: 1.6rem;
  margin-bottom: 0.75rem;
}

.start-card .description {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.test-info-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--color-background);
  border-radius: 10px;
  font-size: 0.9rem;
}

.info-icon {
  font-size: 1.1rem;
}

.strict-warning {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.strict-warning h4 {
  color: #f87171;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.strict-warning p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.mode-select {
  margin-bottom: 1.5rem;
}

.mode-select h4 {
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.mode-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.mode-option {
  cursor: pointer;
}

.mode-option input {
  display: none;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.2s;
}

.mode-option input:checked + .mode-card {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.mode-icon {
  font-size: 1.5rem;
}

.mode-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.mode-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.05rem;
}

.test-process {
  max-width: 800px;
  margin: 0 auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-info {
  flex: 1;
}

.current-question {
  display: block;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.timer {
  font-size: 1.2rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 0.75rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.timer.warning {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.question-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.question-text {
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.hint-box {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: #fbbf24;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
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

.option-item:hover {
  border-color: var(--color-primary);
}

.option-item.selected {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.option-item input {
  display: none;
}

.option-marker {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.option-item.selected .option-marker {
  border-color: var(--color-primary);
  background: var(--color-primary);
  box-shadow: inset 0 0 0 4px var(--color-surface);
}

.option-text {
  font-size: 1rem;
  line-height: 1.5;
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
  font-family: inherit;
}

.text-answer textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.question-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.navigation-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  flex: 1;
}

.dot {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dot:hover {
  border-color: var(--color-primary);
}

.dot.current {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.dot.answered {
  background: rgba(34, 197, 94, 0.2);
  border-color: #4ade80;
}

.dot.current.answered {
  background: var(--color-primary);
}

.btn-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

@media (max-width: 600px) {
  .test-header {
    flex-direction: column;
    align-items: stretch;
  }

  .timer {
    text-align: center;
  }

  .question-text {
    font-size: 1.1rem;
  }

  .navigation-dots {
    order: 3;
    width: 100%;
    margin-top: 1rem;
  }

  .question-navigation {
    flex-wrap: wrap;
  }
}
</style>
