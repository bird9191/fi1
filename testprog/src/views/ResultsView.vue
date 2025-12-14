<template>
  <div class="results-page">
    <header class="page-header">
      <h1>Мои результаты</h1>
      <p>История прохождения тестов</p>
    </header>

    <div v-if="testsStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка результатов...</p>
    </div>

    <div v-else-if="testsStore.userResults.length === 0" class="empty-state">
      <h3>Пока нет результатов</h3>
      <p>Пройдите свой первый тест, чтобы увидеть результаты здесь</p>
      <router-link to="/tests" class="btn btn-primary">
        Найти тест
      </router-link>
    </div>

    <div v-else class="results-content">
      <!-- Статистика -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ testsStore.userResults.length }}</span>
          <span class="stat-label">Тестов пройдено</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ averageScore }}%</span>
          <span class="stat-label">Средний балл</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ bestScore }}%</span>
          <span class="stat-label">Лучший результат</span>
        </div>
      </div>

      <!-- Список результатов -->
      <div class="results-list">
        <h2>История</h2>

        <router-link
          v-for="result in sortedResults"
          :key="result.id"
          :to="`/results/${result.id}`"
          class="result-card"
        >
          <div class="result-main">
            <div class="result-info">
              <h3>{{ result.testTitle }}</h3>
              <span class="result-date">{{ formatDate(result.completedAt) }}</span>
            </div>

            <div class="result-score" :class="getScoreClass(result.percentage)">
              {{ result.percentage }}%
            </div>
          </div>

          <div class="result-details">
            <span>{{ result.score }} из {{ result.maxScore }} баллов</span>
            <span class="result-mode">{{ result.mode === 'training' ? 'Тренировка' : 'Экзамен' }}</span>
          </div>

          <div class="result-bar">
            <div
              class="result-bar-fill"
              :class="getScoreClass(result.percentage)"
              :style="{ width: result.percentage + '%' }"
            ></div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTestsStore } from '@/stores/tests'

const testsStore = useTestsStore()

const sortedResults = computed(() =>
  [...testsStore.userResults].sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )
)

const averageScore = computed(() => {
  if (testsStore.userResults.length === 0) return 0
  const sum = testsStore.userResults.reduce((acc, r) => acc + r.percentage, 0)
  return Math.round(sum / testsStore.userResults.length)
})

const bestScore = computed(() => {
  if (testsStore.userResults.length === 0) return 0
  return Math.max(...testsStore.userResults.map(r => r.percentage))
})

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getScoreClass(percentage: number): string {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
}

onMounted(() => {
  testsStore.loadUserResults()
})
</script>

<style scoped>
.results-page {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: var(--color-text-muted);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--color-text-muted);
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.results-list h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.result-card {
  display: block;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--color-primary);
}

.result-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.result-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.result-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.result-score {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 10px;
}

.result-score.excellent {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.result-score.good {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.result-score.average {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.result-score.poor {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.result-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.result-mode {
  padding: 0.2rem 0.5rem;
  background: var(--color-background);
  border-radius: 6px;
  font-size: 0.8rem;
}

.result-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  transition: width 0.5s ease-out;
}

.result-bar-fill.excellent { background: #4ade80; }
.result-bar-fill.good { background: #60a5fa; }
.result-bar-fill.average { background: #fbbf24; }
.result-bar-fill.poor { background: #f87171; }

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

