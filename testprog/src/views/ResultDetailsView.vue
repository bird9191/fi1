<!--
  ==========================================
  ДЕТАЛИ РЕЗУЛЬТАТА (ResultDetailsView.vue)
  ==========================================
  
  Подробная информация о пройденном тесте:
  - Общая статистика
  - Разбор каждого вопроса
  - Правильные и неправильные ответы
-->

<template>
  <div class="result-details-page">
    
    <!-- ==========================================
         СОСТОЯНИЕ ЗАГРУЗКИ
         ========================================== -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка результатов...</p>
    </div>

    <!-- ==========================================
         РЕЗУЛЬТАТ НЕ НАЙДЕН
         ========================================== -->
    <div v-else-if="!result" class="not-found">
      <h2>😕 Результат не найден</h2>
      <router-link to="/results" class="btn btn-primary">
        ← Вернуться к результатам
      </router-link>
    </div>

    <!-- ==========================================
         ОСНОВНОЙ КОНТЕНТ
         ========================================== -->
    <template v-else>
      
      <!-- Кнопка назад -->
      <router-link to="/results" class="back-link">
        ← Назад к результатам
      </router-link>

      <!-- ==========================================
           КАРТОЧКА РЕЗУЛЬТАТА
           ========================================== -->
      <div class="result-card">
        <div class="result-header">
          <div>
            <span class="type-badge" :class="result.testType || 'test'">
              {{ result.testType === 'exam' ? '📋 Экзамен' : '✏️ Тест' }}
            </span>
            <h1>{{ result.testTitle }}</h1>
            <p class="date">Пройден {{ formatDate(result.completedAt) }}</p>
          </div>
          
          <!-- Круговой прогресс -->
          <div class="score-circle" :class="getScoreClass(result.score)">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path
                class="circle-bg"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="circle"
                :stroke-dasharray="`${result.score}, 100`"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="score-text">
              <span class="score-value">{{ result.score }}%</span>
              <span class="score-label">{{ result.passed ? 'Сдано' : 'Не сдано' }}</span>
            </div>
          </div>
        </div>

        <!-- Статистика -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-icon">✓</span>
            <div>
              <div class="stat-value">{{ correctCount }}</div>
              <div class="stat-label">Правильных</div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">✗</span>
            <div>
              <div class="stat-value">{{ wrongCount }}</div>
              <div class="stat-label">Неправильных</div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⏱</span>
            <div>
              <div class="stat-value">{{ formatTime(result.timeSpent) }}</div>
              <div class="stat-label">Время</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==========================================
           РАЗБОР ВОПРОСОВ
           ========================================== -->
      <section class="questions-review">
        <h2>📝 Разбор вопросов</h2>
        
        <div 
          v-for="(question, index) in result.questions" 
          :key="index"
          class="question-card"
          :class="{ correct: question.isCorrect, wrong: !question.isCorrect }"
        >
          <div class="question-header">
            <span class="question-number">Вопрос {{ index + 1 }}</span>
            <span class="question-status">
              {{ question.isCorrect ? '✓ Верно' : '✗ Неверно' }}
            </span>
          </div>

          <p class="question-text">{{ question.text }}</p>

          <!-- Ответы -->
          <div class="answers">
            <!-- Ваш ответ -->
            <div class="answer your-answer" :class="{ correct: question.isCorrect }">
              <span class="answer-label">Ваш ответ:</span>
              <span class="answer-text">{{ question.userAnswer || '—' }}</span>
            </div>
            
            <!-- Правильный ответ (если неверно) -->
            <div v-if="!question.isCorrect" class="answer correct-answer">
              <span class="answer-label">Правильный ответ:</span>
              <span class="answer-text">{{ question.correctAnswer }}</span>
            </div>
          </div>

          <!-- Объяснение -->
          <div v-if="question.explanation" class="explanation">
            <span class="explanation-icon">💡</span>
            <span>{{ question.explanation }}</span>
          </div>
        </div>
      </section>

      <!-- Действия -->
      <div class="actions">
        <router-link :to="`/tests/${result.testId}`" class="btn btn-primary">
          🔄 Пройти снова
        </router-link>
      </div>
      
    </template>
    
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА ДЕТАЛЕЙ РЕЗУЛЬТАТА
 * ==========================================
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

// ==========================================
// ИНТЕРФЕЙСЫ
// ==========================================

interface QuestionResult {
  text: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation?: string
}

interface ResultDetails {
  id: string
  testId: string
  testTitle: string
  testType: 'test' | 'exam'
  score: number
  passed: boolean
  timeSpent: number
  completedAt: string
  questions: QuestionResult[]
}

// ==========================================
// МАРШРУТИЗАЦИЯ
// ==========================================

const route = useRoute()

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Флаг загрузки */
const isLoading = ref(true)

/** Данные результата */
const result = ref<ResultDetails | null>(null)

// ==========================================
// ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ==========================================

/** Количество правильных ответов */
const correctCount = computed(() =>
  result.value?.questions.filter(q => q.isCorrect).length || 0
)

/** Количество неправильных ответов */
const wrongCount = computed(() =>
  result.value?.questions.filter(q => !q.isCorrect).length || 0
)

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Форматирует дату
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Форматирует время
 */
function formatTime(seconds: number): string {
  if (!seconds) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Возвращает класс для результата
 */
function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'average'
  return 'poor'
}

/**
 * Загружает данные результата
 */
async function loadResult(): Promise<void> {
  isLoading.value = true
  
  try {
    const resultId = route.params.id as string
    const response = await api.getResultById(resultId)
    result.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки результата:', error)
    result.value = null
  } finally {
    isLoading.value = false
  }
}

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  loadResult()
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ ДЕТАЛЕЙ РЕЗУЛЬТАТА
   ========================================== */

.result-details-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

/* ==========================================
   СОСТОЯНИЯ
   ========================================== */

.loading,
.not-found {
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

/* ==========================================
   НАВИГАЦИЯ
   ========================================== */

.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 1.5rem;
}

.back-link:hover {
  color: var(--color-primary);
}

/* ==========================================
   КАРТОЧКА РЕЗУЛЬТАТА
   ========================================== */

.result-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.type-badge {
  display: inline-block;
  font-size: 0.85rem;
  padding: 0.35rem 0.9rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.type-badge.test {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.type-badge.exam {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.result-header h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.date {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Круговой прогресс */
.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.circular-chart {
  display: block;
  max-width: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 2;
}

.circle {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
}

.score-circle.excellent .circle { stroke: #4ade80; }
.score-circle.good .circle { stroke: #60a5fa; }
.score-circle.average .circle { stroke: #fbbf24; }
.score-circle.poor .circle { stroke: #f87171; }

@keyframes progress {
  0% { stroke-dasharray: 0 100; }
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.score-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 12px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* ==========================================
   РАЗБОР ВОПРОСОВ
   ========================================== */

.questions-review {
  margin-bottom: 2rem;
}

.questions-review h2 {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
}

.question-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid transparent;
}

.question-card.correct {
  border-left-color: #4ade80;
}

.question-card.wrong {
  border-left-color: #f87171;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: var(--color-text-muted);
}

.question-status {
  font-size: 0.9rem;
}

.question-card.correct .question-status {
  color: #4ade80;
}

.question-card.wrong .question-status {
  color: #f87171;
}

.question-text {
  font-size: 1.05rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* Ответы */
.answers {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.95rem;
}

.your-answer {
  background: rgba(239, 68, 68, 0.1);
}

.your-answer.correct {
  background: rgba(34, 197, 94, 0.1);
}

.correct-answer {
  background: rgba(34, 197, 94, 0.1);
}

.answer-label {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.answer-text {
  font-weight: 500;
}

/* Объяснение */
.explanation {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 10px;
  font-size: 0.9rem;
  color: #fbbf24;
}

/* ==========================================
   ДЕЙСТВИЯ
   ========================================== */

.actions {
  text-align: center;
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */

@media (max-width: 600px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
