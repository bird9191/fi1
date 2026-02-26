

<template>
  <div class="dashboard-page">

    <aside class="sidebar">

      <div class="sidebar-header">
        <h2>{{ authStore.currentUser?.name }}</h2>
        <span class="role-badge" :class="authStore.currentUser?.role">
          {{ getRoleName }}
        </span>
      </div>

      <nav class="sidebar-nav">
        <button 
          v-for="tab in availableTabs" 
          :key="tab.id"
          :class="['nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="sidebar-actions">
        <router-link 
          v-if="authStore.isTeacher" 
          to="/tests/create" 
          class="action-btn primary"
        >
           Создать тест
        </router-link>
        <router-link to="/tests" class="action-btn">
           Каталог тестов
        </router-link>
        <router-link to="/profile" class="action-btn">
           Мой профиль
        </router-link>
      </div>
      
    </aside>

    <main class="main-content">

      <div v-if="activeTab === 'my-tests'" class="content-section">

        <div class="section-header">
          <h1>Мои тесты</h1>
          <router-link to="/tests/create" class="btn btn-primary">
             Создать
          </router-link>
        </div>

        <div v-if="testsStore.isLoading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="testsStore.myTests.length === 0" class="empty-state">
          <h3>У вас пока нет тестов</h3>
          <p>Создайте свой первый тест</p>
          <router-link to="/tests/create" class="btn btn-primary">
            Создать тест
          </router-link>
        </div>

        <div v-else class="tests-grid">
          <div v-for="test in testsStore.myTests" :key="test.id" class="test-card">

            <div class="test-card-header">
              <span class="type-badge" :class="test.type || 'test'">
                {{ test.type === 'exam' ? ' Экзамен' : ' Тест' }}
              </span>
              <span class="visibility-badge" :class="test.visibility">
                {{ test.visibility === 'public' ? ' Публичный' : ' Приватный' }}
              </span>
            </div>

            <h3>{{ test.title }}</h3>
            <p class="test-description">{{ test.description }}</p>

            <div class="test-meta">
              <span>{{ test.questions.length }} вопросов</span>
              <span v-if="test.timeLimit"> {{ test.timeLimit }} мин</span>
            </div>

            <div class="test-actions">
              <router-link :to="`/tests/${test.id}`" class="btn btn-outline btn-sm">
                Открыть
              </router-link>
              <router-link :to="`/tests/${test.id}/edit`" class="btn btn-outline btn-sm">
                Редактировать
              </router-link>
            </div>
            
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'available'" class="content-section">
        
        <div class="section-header">
          <h1>Доступные тесты</h1>
          <router-link to="/tests" class="btn btn-outline">
            Все тесты
          </router-link>
        </div>

        <div v-if="testsStore.isLoading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="testsStore.publicTests.length === 0" class="empty-state">
          <h3>Пока нет доступных тестов</h3>
          <p>Когда учителя создадут тесты, они появятся здесь</p>
        </div>

        <div v-else class="tests-grid">
          <div v-for="test in testsStore.publicTests" :key="test.id" class="test-card">
            
            <div class="test-card-header">
              <span class="type-badge" :class="test.type || 'test'">
                {{ test.type === 'exam' ? ' Экзамен' : ' Тест' }}
              </span>
            </div>
            
            <h3>{{ test.title }}</h3>
            <p class="test-description">{{ test.description }}</p>
            
            <div class="test-meta">
              <span> {{ test.authorName }}</span>
              <span>{{ test.questions.length }} вопросов</span>
            </div>
            
            <div class="test-actions">
              <router-link :to="`/tests/${test.id}/take`" class="btn btn-primary btn-sm">
                 Пройти
              </router-link>
            </div>
            
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'results'" class="content-section">
        
        <div class="section-header">
          <h1>Мои результаты</h1>
          <router-link to="/results" class="btn btn-outline">
            Подробнее
          </router-link>
        </div>

        <div v-if="testsStore.userResults.length === 0" class="empty-state">
          <h3>Пока нет результатов</h3>
          <p>Пройдите тест, чтобы увидеть результаты</p>
          <router-link to="/tests" class="btn btn-primary">
            Найти тест
          </router-link>
        </div>

        <div v-else class="results-list">
          <router-link 
            v-for="result in testsStore.userResults" 
            :key="result.id"
            :to="`/results/${result.id}`"
            class="result-item"
          >
            <div class="result-info">
              <h4>{{ result.testTitle }}</h4>
              <div class="result-meta">
                <span class="result-mode">
                  {{ result.mode === 'training' ? ' Тренировка' : ' Экзамен' }}
                </span>
                <span class="result-date">{{ formatDate(result.completedAt) }}</span>
              </div>
            </div>
            <div class="result-score" :class="getScoreClass(result.percentage)">
              {{ result.percentage }}%
            </div>
          </router-link>
        </div>
      </div>

      <div v-if="activeTab === 'stats'" class="content-section">
        
        <div class="section-header">
          <h1> Статистика</h1>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ testsStore.myTests.length }}</span>
            <span class="stat-label">Всего тестов</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ publicTestsCount }}</span>
            <span class="stat-label">Публичных</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ examCount }}</span>
            <span class="stat-label">Экзаменов</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalQuestions }}</span>
            <span class="stat-label">Вопросов</span>
          </div>
        </div>
      </div>
      
    </main>
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTestsStore } from '@/stores/tests'

const authStore = useAuthStore()
const testsStore = useTestsStore()

const activeTab = ref('')

const getRoleName = computed(() => {
  if (authStore.isAdmin) return 'Админ'
  if (authStore.isTeacher) return 'Учитель'
  return 'Студент'
})

const availableTabs = computed(() => {
  if (authStore.isTeacher) {
    return [
      { id: 'my-tests', label: ' Мои тесты' },
      { id: 'stats', label: ' Статистика' }
    ]
  }
  return [
    { id: 'available', label: ' Доступные тесты' },
    { id: 'results', label: ' Мои результаты' }
  ]
})

const publicTestsCount = computed(() => 
  testsStore.myTests.filter(t => t.visibility === 'public').length
)

const examCount = computed(() => 
  testsStore.myTests.filter(t => t.type === 'exam').length
)

const totalQuestions = computed(() => 
  testsStore.myTests.reduce((sum, t) => sum + t.questions.length, 0)
)

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getScoreClass(percentage: number): string {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
}

onMounted(async () => {
  
  activeTab.value = authStore.isTeacher ? 'my-tests' : 'available'

  await testsStore.loadTests()
  
  if (authStore.isTeacher) {
    await testsStore.loadMyTests()
  }
  
  if (authStore.isStudent) {
    await testsStore.loadUserResults()
  }
})
</script>

<style scoped>

.dashboard-page {
  display: flex;
  min-height: calc(100vh - 60px);
}

.sidebar {
  width: 280px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.sidebar-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.role-badge {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-badge.teacher {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.role-badge.student {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.nav-item {
  display: block;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--color-background);
}

.nav-item.active {
  background: var(--accent-glow);
  color: var(--color-primary);
  font-weight: 500;
}

.sidebar-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.2s;
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-btn:hover {
  border-color: var(--color-primary);
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-btn.primary:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.content-section {
  max-width: 1000px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h1 {
  font-size: 1.75rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem;
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
  border-radius: 16px;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.test-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.test-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.test-card-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
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

.visibility-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
}

.visibility-badge.public {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.visibility-badge.private {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.test-card h3 {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}

.test-description {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.test-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.test-actions {
  display: flex;
  gap: 0.5rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: var(--color-primary);
  transform: translateX(4px);
}

.result-info h4 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: var(--color-text);
}

.result-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.result-mode {
  padding: 0.15rem 0.5rem;
  background: var(--color-background);
  border-radius: 4px;
}

.result-score {
  font-size: 1.25rem;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .dashboard-page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 1rem;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    margin-bottom: 1rem;
    gap: 0.5rem;
  }

  .nav-item {
    white-space: nowrap;
    padding: 0.6rem 1rem;
  }

  .sidebar-actions {
    flex-direction: row;
    margin-top: 0;
  }

  .action-btn {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .main-content {
    padding: 1rem;
  }

  .tests-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .sidebar-actions {
    flex-direction: column;
  }
}
</style>
