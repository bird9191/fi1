<template>
  <div class="result-details-page">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка результата...</p>
    </div>

    <div v-else-if="!result" class="not-found">
      <h2>Результат не найден</h2>
      <router-link to="/results" class="btn btn-primary">К результатам</router-link>
    </div>

    <template v-else>
      <header class="page-header">
        <router-link to="/results" class="back-link">Назад к результатам</router-link>
        <h1>{{ result.testTitle }}</h1>
        <span class="mode-badge">{{ result.mode === 'training' ? 'Тренировка' : 'Экзамен' }}</span>
      </header>

      <!-- Основной результат -->
      <div class="result-summary">
        <div class="score-display" :class="getScoreClass(result.percentage)">
          <span class="score-value">{{ result.percentage }}%</span>
          <span class="score-detail">{{ result.score }} из {{ result.maxScore }} баллов</span>
        </div>

        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">{{ formatTime(result.totalTime) }}</span>
            <span class="stat-label">Время</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ correctCount }}/{{ result.questionStats?.length || 0 }}</span>
            <span class="stat-label">Правильных</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ avgTime }}с</span>
            <span class="stat-label">Среднее время</span>
          </div>
        </div>

        <p class="result-date">Пройден: {{ formatDate(result.completedAt) }}</p>
      </div>

      <!-- Детали по вопросам -->
      <div v-if="result.questionStats && result.questionStats.length > 0" class="questions-analysis">
        <h2>Результаты по вопросам</h2>

        <div class="question-list">
          <div
            v-for="(stat, index) in result.questionStats"
            :key="stat.questionId"
            class="question-item"
            :class="{ correct: stat.isCorrect, incorrect: !stat.isCorrect }"
          >
            <div class="question-header">
              <span class="question-number">{{ index + 1 }}</span>
              <span class="question-status">{{ stat.isCorrect ? 'Верно' : 'Неверно' }}</span>
              <span class="question-time">{{ stat.timeSpent }}с</span>
            </div>
            <p class="question-text">{{ stat.questionText }}</p>
            <div v-if="stat.category" class="question-category">{{ stat.category }}</div>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="result-actions">
        <router-link to="/results" class="btn btn-outline">К результатам</router-link>
        <router-link :to="`/tests/${result.testId}/take`" class="btn btn-primary">Пройти снова</router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { TestResult } from '@/types'

const route = useRoute()
const testsStore = useTestsStore()

const result = ref<TestResult | null>(null)
const isLoading = ref(true)

const correctCount = computed(() =>
  result.value?.questionStats?.filter(s => s.isCorrect).length || 0
)

const avgTime = computed(() => {
  if (!result.value?.questionStats?.length) return 0
  const total = result.value.questionStats.reduce((sum, s) => sum + s.timeSpent, 0)
  return Math.round(total / result.value.questionStats.length)
})

function getScoreClass(percentage: number): string {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}м ${secs}с`
  return `${secs}с`
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  const id = route.params.id as string

  // Загрузить результаты если ещё не загружены
  if (testsStore.userResults.length === 0) {
    await testsStore.loadUserResults()
  }

  result.value = testsStore.getResultById(id)
  isLoading.value = false
})
</script>

<style scoped>
.result-details-page {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
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

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.mode-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.result-summary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.score-display {
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.score-display.excellent { background: rgba(34, 197, 94, 0.15); }
.score-display.good { background: rgba(59, 130, 246, 0.15); }
.score-display.average { background: rgba(251, 191, 36, 0.15); }
.score-display.poor { background: rgba(239, 68, 68, 0.15); }

.score-value {
  display: block;
  font-size: 3.5rem;
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
  margin-bottom: 1rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 12px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.result-date {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.questions-analysis {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.questions-analysis h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item {
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid;
}

.question-item.correct {
  background: rgba(34, 197, 94, 0.1);
  border-color: #4ade80;
}

.question-item.incorrect {
  background: rgba(239, 68, 68, 0.1);
  border-color: #f87171;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.question-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.question-status {
  font-size: 0.85rem;
  font-weight: 500;
}

.question-item.correct .question-status { color: #4ade80; }
.question-item.incorrect .question-status { color: #f87171; }

.question-time {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.question-text {
  font-size: 0.95rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.question-category {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 600px) {
  .result-stats {
    grid-template-columns: 1fr;
  }

  .result-actions {
    flex-direction: column;
  }
}
</style>
