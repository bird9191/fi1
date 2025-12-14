<template>
  <div class="profile-layout">
    <!-- Левая панель -->
    <aside class="profile-sidebar">
      <div class="sidebar-user">
        <div class="user-avatar-wrapper" @click="openAvatarUpload">
          <img v-if="authStore.currentUser?.avatar" :src="authStore.currentUser.avatar" alt="Avatar" class="user-avatar-img" />
          <div v-else class="user-avatar-empty"></div>
          <div class="avatar-overlay">
            <span>Изменить</span>
          </div>
        </div>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="handleAvatarUpload"
        />
        <div class="user-info">
          <span class="user-name">{{ authStore.currentUser?.name }}</span>
          <span class="user-email">{{ authStore.currentUser?.email }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          <span class="nav-icon">O</span>
          <span>Обзор</span>
        </button>

        <button
          v-if="authStore.isTeacher"
          class="nav-item"
          :class="{ active: activeTab === 'tests' }"
          @click="activeTab = 'tests'"
        >
          <span class="nav-icon">T</span>
          <span>Мои тесты</span>
        </button>

        <button
          v-if="authStore.isStudent"
          class="nav-item"
          :class="{ active: activeTab === 'results' }"
          @click="activeTab = 'results'"
        >
          <span class="nav-icon">R</span>
          <span>Результаты</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activeTab === 'stats' }"
          @click="activeTab = 'stats'"
        >
          <span class="nav-icon">S</span>
          <span>Статистика</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <span class="nav-icon">N</span>
          <span>Настройки</span>
        </button>

        <div class="nav-divider"></div>

        <router-link to="/tests" class="nav-item">
          <span class="nav-icon">C</span>
          <span>Каталог тестов</span>
        </router-link>

        <router-link v-if="authStore.isTeacher" to="/tests/create" class="nav-item highlight">
          <span class="nav-icon">+</span>
          <span>Создать тест</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          Выйти из аккаунта
        </button>
      </div>
    </aside>

    <!-- Основной контент -->
    <main class="profile-content">
      <!-- Обзор -->
      <div v-if="activeTab === 'overview'" class="tab-content">
        <!-- Быстрые действия -->
        <div class="quick-actions">
          <h2>Быстрые действия</h2>
          <div class="actions-grid">
            <router-link v-if="authStore.isTeacher" to="/tests/create" class="action-card">
              <span class="action-icon">+</span>
              <span class="action-title">Создать тест</span>
            </router-link>
            <router-link to="/tests" class="action-card">
              <span class="action-icon">C</span>
              <span class="action-title">Каталог тестов</span>
            </router-link>
            <button v-if="authStore.isStudent" class="action-card" @click="activeTab = 'results'">
              <span class="action-icon">R</span>
              <span class="action-title">Мои результаты</span>
            </button>
          </div>
        </div>

        <!-- Последняя активность -->
        <div class="recent-activity" v-if="recentItems.length > 0">
          <h2>Недавняя активность</h2>
          <div class="activity-list">
            <div v-for="item in recentItems" :key="item.id" class="activity-item">
              <span class="activity-title">{{ item.title }}</span>
              <span class="activity-date">{{ formatDate(item.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Мои тесты (для учителя) -->
      <div v-if="activeTab === 'tests' && authStore.isTeacher" class="tab-content">
        <div class="tab-header">
          <h1>Мои тесты</h1>
          <router-link to="/tests/create" class="btn btn-primary">
            Создать тест
          </router-link>
        </div>

        <div v-if="myTests.length === 0" class="empty-state">
          <h3>У вас пока нет тестов</h3>
          <p>Создайте свой первый тест</p>
          <router-link to="/tests/create" class="btn btn-primary">
            Создать тест
          </router-link>
        </div>

        <div v-else class="tests-list">
          <div v-for="test in myTests" :key="test.id" class="test-item">
            <div class="test-info">
              <h3>{{ test.title }}</h3>
              <p>{{ test.description }}</p>
              <div class="test-meta">
                <span>{{ test.questions.length }} вопросов</span>
                <span v-if="test.timeLimit">{{ test.timeLimit }} мин</span>
                <span class="badge" :class="test.visibility">
                  {{ test.visibility === 'public' ? 'Публичный' : 'Приватный' }}
                </span>
              </div>
            </div>
            <div class="test-actions">
              <router-link :to="`/tests/${test.id}`" class="btn btn-outline btn-sm">Просмотр</router-link>
              <router-link :to="`/tests/${test.id}/edit`" class="btn btn-primary btn-sm">Редактировать</router-link>
              <button class="btn btn-danger btn-sm" @click="deleteTest(test.id)">Удалить</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Результаты (для студента) -->
      <div v-if="activeTab === 'results' && authStore.isStudent" class="tab-content">
        <h1>Мои результаты</h1>

        <div v-if="userResults.length === 0" class="empty-state">
          <h3>Вы ещё не проходили тесты</h3>
          <p>Начните с каталога тестов</p>
          <router-link to="/tests" class="btn btn-primary">
            Каталог тестов
          </router-link>
        </div>

        <div v-else class="results-list">
          <div v-for="result in sortedResults" :key="result.id" class="result-item">
            <div class="result-info">
              <h3>{{ result.testTitle }}</h3>
              <div class="result-meta">
                <span class="mode">{{ result.mode === 'training' ? 'Тренировка' : 'Экзамен' }}</span>
                <span class="date">{{ formatDate(result.completedAt) }}</span>
              </div>
            </div>
            <div class="result-score" :class="getScoreClass(result.percentage)">
              <span class="score-value">{{ result.percentage }}%</span>
              <span class="score-detail">{{ result.score }}/{{ result.maxScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div v-if="activeTab === 'stats'" class="tab-content">
        <h1>Статистика</h1>

        <div class="stats-grid large">
          <div class="stat-card">
            <span class="stat-value">{{ authStore.isTeacher ? myTests.length : userResults.length }}</span>
            <span class="stat-label">{{ authStore.isTeacher ? 'Создано тестов' : 'Тестов пройдено' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ authStore.isTeacher ? totalCompletions : averageScore }}{{ authStore.isStudent ? '%' : '' }}</span>
            <span class="stat-label">{{ authStore.isTeacher ? 'Всего прохождений' : 'Средний балл' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ authStore.isTeacher ? publicTestsCount : perfectScores }}</span>
            <span class="stat-label">{{ authStore.isTeacher ? 'Публичных тестов' : 'Отличных результатов' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ formatTotalTime(totalTimeSpent) }}</span>
            <span class="stat-label">Общее время</span>
          </div>
        </div>

        <!-- Прогресс по категориям (для студента) -->
        <div v-if="authStore.isStudent && categoryStats.length > 0" class="category-stats">
          <h2>Прогресс по категориям</h2>
          <div class="progress-list">
            <div v-for="cat in categoryStats" :key="cat.name" class="progress-item">
              <div class="progress-header">
                <span>{{ cat.name }}</span>
                <span>{{ cat.percentage }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: cat.percentage + '%' }"
                  :class="getProgressClass(cat.percentage)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Настройки -->
      <div v-if="activeTab === 'settings'" class="tab-content">
        <h1>Настройки профиля</h1>

        <div class="settings-section">
          <h2>Личные данные</h2>

          <div class="settings-form">
            <div class="form-group">
              <label>Имя</label>
              <input
                type="text"
                v-model="settingsForm.name"
                placeholder="Ваше имя"
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input
                type="email"
                v-model="settingsForm.email"
                placeholder="your@email.com"
              />
            </div>

            <div class="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                v-model="settingsForm.phone"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <button class="btn btn-primary" @click="savePersonalData">
              Сохранить данные
            </button>
          </div>
        </div>

        <div class="settings-section">
          <h2>Смена пароля</h2>

          <div class="settings-form">
            <div class="form-group">
              <label>Текущий пароль</label>
              <input
                type="password"
                v-model="passwordForm.currentPassword"
                placeholder="Введите текущий пароль"
              />
            </div>

            <div class="form-group">
              <label>Новый пароль</label>
              <input
                type="password"
                v-model="passwordForm.newPassword"
                placeholder="Введите новый пароль"
              />
            </div>

            <div class="form-group">
              <label>Подтвердите пароль</label>
              <input
                type="password"
                v-model="passwordForm.confirmPassword"
                placeholder="Повторите новый пароль"
              />
            </div>

            <button class="btn btn-primary" @click="changePassword">
              Изменить пароль
            </button>
          </div>
        </div>

        <div class="delete-account-section">
          <button class="btn btn-danger" @click="deleteAccount">
            Удалить аккаунт
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTestsStore } from '@/stores/tests'
import type { TestResult } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const testsStore = useTestsStore()

const activeTab = ref('overview')
const userResults = ref<TestResult[]>([])
const allResults = ref<TestResult[]>([])
const avatarInput = ref<HTMLInputElement | null>(null)

// Settings forms
const settingsForm = reactive({
  name: '',
  email: '',
  phone: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Initialize settings form with current user data
function initSettingsForm() {
  if (authStore.currentUser) {
    settingsForm.name = authStore.currentUser.name || ''
    settingsForm.email = authStore.currentUser.email || ''
    settingsForm.phone = ''
  }
}

async function savePersonalData() {
  if (!settingsForm.name.trim()) {
    alert('Введите имя')
    return
  }
  if (!settingsForm.email.trim()) {
    alert('Введите email')
    return
  }
  
  const success = await authStore.updateProfile({
    name: settingsForm.name,
    email: settingsForm.email,
    phone: settingsForm.phone || undefined
  })
  
  if (success) {
    alert('Данные сохранены!')
  } else {
    alert('Ошибка при сохранении данных')
  }
}

async function changePassword() {
  if (!passwordForm.currentPassword) {
    alert('Введите текущий пароль')
    return
  }
  if (!passwordForm.newPassword) {
    alert('Введите новый пароль')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    alert('Пароль должен быть не менее 6 символов')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('Пароли не совпадают')
    return
  }
  
  const result = await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
  
  if (result.success) {
    alert('Пароль изменён!')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    alert(result.error || 'Ошибка при смене пароля')
  }
}

async function deleteAccount() {
  if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
    if (confirm('Все ваши данные будут удалены. Продолжить?')) {
      const success = await authStore.deleteAccount()
      if (success) {
        router.push('/')
        alert('Аккаунт удалён')
      } else {
        alert('Ошибка при удалении аккаунта')
      }
    }
  }
}

function openAvatarUpload() {
  avatarInput.value?.click()
}

function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    alert('Файл слишком большой. Максимум 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    authStore.updateAvatar(base64)
  }
  reader.readAsDataURL(file)
}

const myTests = computed(() => testsStore.myTests)

const publicTestsCount = computed(() =>
  myTests.value.filter(t => t.visibility === 'public').length
)

const totalCompletions = computed(() => {
  let count = 0
  for (const test of myTests.value) {
    count += allResults.value.filter(r => r.testId === test.id).length
  }
  return count
})

const sortedResults = computed(() =>
  [...userResults.value].sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )
)

const averageScore = computed(() => {
  if (userResults.value.length === 0) return 0
  const total = userResults.value.reduce((sum, r) => sum + r.percentage, 0)
  return Math.round(total / userResults.value.length)
})

const perfectScores = computed(() =>
  userResults.value.filter(r => r.percentage === 100).length
)

const totalTimeSpent = computed(() =>
  userResults.value.reduce((sum, r) => sum + (r.totalTime || 0), 0)
)

const categoryStats = computed(() => {
  const stats: Record<string, { correct: number; total: number }> = {}

  for (const result of userResults.value) {
    if (result.questionStats) {
      for (const qs of result.questionStats) {
        const cat = qs.category || 'Общие'
        if (!stats[cat]) stats[cat] = { correct: 0, total: 0 }
        stats[cat].total++
        if (qs.isCorrect) stats[cat].correct++
      }
    }
  }

  return Object.entries(stats)
    .map(([name, data]) => ({
      name,
      percentage: Math.round((data.correct / data.total) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage)
})

const recentItems = computed(() => {
  if (authStore.isTeacher) {
    return myTests.value.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      date: t.updatedAt
    }))
  }
  return sortedResults.value.slice(0, 3).map(r => ({
    id: r.id,
    title: r.testTitle,
    date: r.completedAt
  }))
})

function getProgressClass(percentage: number): string {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
}

function getScoreClass(percentage: number): string {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'average'
  return 'poor'
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}м`
  const hours = Math.floor(mins / 60)
  return `${hours}ч`
}

async function deleteTest(testId: string) {
  if (confirm('Вы уверены, что хотите удалить этот тест?')) {
    await testsStore.deleteTest(testId)
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function loadAllResults() {
  const results: TestResult[] = []
  for (const test of myTests.value) {
    const testResults = await testsStore.loadTestResults(test.id)
    results.push(...testResults)
  }
  allResults.value = results
}

onMounted(async () => {
  await testsStore.loadTests()
  await testsStore.loadUserResults()
  userResults.value = testsStore.userResults

  if (authStore.isTeacher) {
    await loadAllResults()
  }

  initSettingsForm()
})
</script>

<style scoped>
.profile-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.profile-sidebar {
  width: 280px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-user {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hidden-input {
  display: none;
}

.user-avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-empty {
  width: 100%;
  height: 100%;
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: 50%;
  box-sizing: border-box;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-overlay span {
  font-size: 0.75rem;
  color: white;
  font-weight: 500;
}

.user-avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.user-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.nav-item.active {
  background: var(--accent-glow);
  color: var(--color-primary);
  font-weight: 500;
}

.nav-item.highlight {
  color: var(--color-primary);
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.7;
}

.nav-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.75rem 0;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}

.logout-btn {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* Main Content */
.profile-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.tab-content h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tab-header h1 {
  margin-bottom: 0;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stats-grid.large {
  grid-template-columns: repeat(4, 1fr);
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.stat-card.primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
  border-color: rgba(139, 92, 246, 0.3);
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

/* Quick Actions */
.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: var(--color-text);
}

.action-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.action-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  border-radius: 12px;
  font-weight: 700;
  color: var(--color-primary);
}

.action-title {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Recent Activity */
.recent-activity h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.activity-title {
  font-size: 0.9rem;
}

.activity-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Tests List */
.tests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.test-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.test-info p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.test-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.badge.public {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.badge.private {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.test-actions {
  display: flex;
  gap: 0.5rem;
}

/* Results List */
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
}

.result-info h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.result-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.mode {
  padding: 0.15rem 0.5rem;
  background: var(--color-background);
  border-radius: 4px;
}

.date {
  color: var(--color-text-muted);
}

.result-score {
  text-align: center;
  padding: 0.5rem 1rem;
  border-radius: 10px;
}

.result-score.excellent { background: rgba(34, 197, 94, 0.15); }
.result-score.good { background: rgba(59, 130, 246, 0.15); }
.result-score.average { background: rgba(251, 191, 36, 0.15); }
.result-score.poor { background: rgba(239, 68, 68, 0.15); }

.result-score .score-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.result-score.excellent .score-value { color: #4ade80; }
.result-score.good .score-value { color: #60a5fa; }
.result-score.average .score-value { color: #fbbf24; }
.result-score.poor .score-value { color: #f87171; }

.result-score .score-detail {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Category Stats */
.category-stats {
  margin-top: 2rem;
}

.category-stats h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

.progress-fill.excellent { background: linear-gradient(90deg, #22c55e, #4ade80); }
.progress-fill.good { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.progress-fill.average { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.progress-fill.poor { background: linear-gradient(90deg, #ef4444, #f87171); }

/* Empty State */
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

@media (max-width: 900px) {
  .profile-layout {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0.5rem;
  }

  .nav-item {
    flex: 1;
    min-width: 80px;
    justify-content: center;
    padding: 0.5rem;
  }

  .nav-item span:not(.nav-icon) {
    display: none;
  }

  .nav-divider {
    display: none;
  }

  .sidebar-footer {
    display: none;
  }

  .stats-grid, .stats-grid.large {
    grid-template-columns: repeat(2, 1fr);
  }

  .test-item {
    flex-direction: column;
    gap: 1rem;
  }

  .test-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

/* Settings */
.settings-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.settings-section h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-form label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.settings-form input {
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.settings-form input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.settings-form .btn {
  align-self: flex-start;
  margin-top: 0.5rem;
}

.delete-account-section {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  margin-top: 1rem;
}

.btn-danger {
  background: transparent;
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* Mobile */
@media (max-width: 768px) {
  .profile-page {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar-avatar {
    padding: 1.5rem;
  }

  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .nav-item {
    white-space: nowrap;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin: 0;
  }

  .profile-content {
    padding: 1rem;
  }

  .tests-grid {
    grid-template-columns: 1fr;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .settings-form .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .sidebar-avatar h2 {
    font-size: 1.25rem;
  }

  .progress-grid {
    grid-template-columns: 1fr;
  }
}
</style>
