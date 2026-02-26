

<template>
  <div class="results-page">

    <header class="page-header">
      <h1> Мои результаты</h1>
      <p>История всех пройденных тестов и экзаменов</p>
    </header>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка результатов...</p>
    </div>

    <div v-else-if="results.length === 0" class="empty-state">
      <h3> Нет результатов</h3>
      <p>Вы ещё не прошли ни одного теста</p>
      <router-link to="/tests" class="btn btn-primary">
         Пройти тест
      </router-link>
    </div>

    <div v-else class="results-list">

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ results.length }}</div>
          <div class="stat-label">Всего тестов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageScore }}%</div>
          <div class="stat-label">Средний балл</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ passedCount }}</div>
          <div class="stat-label">Пройдено</div>
        </div>
      </div>

      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th>Тест</th>
              <th>Тип</th>
              <th>Дата</th>
              <th>Результат</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result.id">
              
              <td class="test-name">
                {{ result.testTitle }}
              </td>

              <td>
                <span class="type-badge" :class="result.testType || 'test'">
                  {{ result.testType === 'exam' ? 'Экзамен' : 'Тест' }}
                </span>
              </td>

              <td class="date">
                {{ formatDate(result.completedAt) }}
              </td>

              <td>
                <span class="score" :class="getScoreClass(result.score)">
                  {{ result.score }}%
                </span>
              </td>

              <td>
                <span class="status" :class="{ passed: result.passed }">
                  {{ result.passed ? ' Сдано' : ' Не сдано' }}
                </span>
              </td>

              <td class="actions">
                <router-link 
                  :to="`/results/${result.id}`" 
                  class="btn btn-sm btn-outline"
                >
                  Подробнее
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </div>
    
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

interface TestResult {
  id: string
  testId: string
  testTitle: string
  testType: 'test' | 'exam'
  score: number
  passed: boolean
  completedAt: string
}

const isLoading = ref(true)

const results = ref<TestResult[]>([])

const averageScore = computed(() => {
  if (results.value.length === 0) return 0
  const sum = results.value.reduce((acc, r) => acc + r.score, 0)
  return Math.round(sum / results.value.length)
})

const passedCount = computed(() => 
  results.value.filter(r => r.passed).length
)

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'average'
  return 'poor'
}

async function loadResults(): Promise<void> {
  isLoading.value = true
  
  try {
    const response = await api.getMyResults()
    results.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки результатов:', error)
    results.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadResults()
})
</script>

<style scoped>

.results-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.8rem;
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.results-table-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  overflow: hidden;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 1rem;
  text-align: left;
}

.results-table th {
  background: var(--color-background);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.results-table td {
  border-bottom: 1px solid var(--color-border);
}

.results-table tr:last-child td {
  border-bottom: none;
}

.results-table tr:hover td {
  background: var(--color-background);
}

.test-name {
  font-weight: 500;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.type-badge.test {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.type-badge.exam {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.date {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.score {
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.score.excellent {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.score.good {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.score.average {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.score.poor {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.status {
  font-size: 0.85rem;
  color: #f87171;
}

.status.passed {
  color: #4ade80;
}

.actions {
  text-align: right;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .results-table-wrapper {
    overflow-x: auto;
  }

  .results-table {
    min-width: 600px;
  }
}
</style>
