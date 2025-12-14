<template>
  <div class="admin-page">
    <header class="page-header">
      <h1>Админ-панель</h1>
      <p>Управление системой</p>
    </header>

    <!-- Статистика -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalUsers }}</span>
          <span class="stat-label">Пользователей</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalTests }}</span>
          <span class="stat-label">Тестов</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalResults }}</span>
          <span class="stat-label">Прохождений</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.activeToday }}</span>
          <span class="stat-label">Активных сегодня</span>
        </div>
      </div>
    </section>

    <!-- Табы -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Пользователи -->
    <section v-if="activeTab === 'users'" class="content-section">
      <div class="section-header">
        <h2>Пользователи</h2>
        <div class="search-box">
          <input
            v-model="userSearch"
            type="search"
            placeholder="Поиск по email или имени..."
          />
        </div>
      </div>

      <div v-if="isLoadingUsers" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Регистрация</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                  <span>{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <select
                  :value="user.role"
                  @change="updateUserRole(user.id, ($event.target as HTMLSelectElement).value)"
                  class="role-select"
                >
                  <option value="student">Студент</option>
                  <option value="teacher">Учитель</option>
                  <option value="admin">Админ</option>
                </select>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <button
                  class="btn btn-sm btn-danger"
                  @click="deleteUser(user.id)"
                  :disabled="user.role === 'admin'"
                >
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Уведомления -->
    <section v-if="activeTab === 'notifications'" class="content-section">
      <div class="section-header">
        <h2>Рассылка уведомлений</h2>
      </div>

      <form @submit.prevent="sendBroadcast" class="broadcast-form">
        <div class="form-group">
          <label>Заголовок</label>
          <input
            v-model="broadcast.title"
            type="text"
            placeholder="Заголовок уведомления"
            required
          />
        </div>
        <div class="form-group">
          <label>Сообщение</label>
          <textarea
            v-model="broadcast.message"
            rows="4"
            placeholder="Текст уведомления для всех пользователей..."
            required
          ></textarea>
        </div>
        <div class="form-group">
          <label>Тип</label>
          <select v-model="broadcast.type">
            <option value="info">Информация</option>
            <option value="warning">Предупреждение</option>
            <option value="success">Успех</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="isSendingBroadcast">
          {{ isSendingBroadcast ? 'Отправка...' : 'Отправить всем' }}
        </button>
      </form>
    </section>

    <!-- Система -->
    <section v-if="activeTab === 'system'" class="content-section">
      <div class="section-header">
        <h2>Информация о системе</h2>
      </div>

      <div class="system-info">
        <div class="info-row">
          <span class="info-label">Версия API</span>
          <span class="info-value">{{ systemInfo.version }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">База данных</span>
          <span class="info-value">SQLite (Prisma ORM)</span>
        </div>
        <div class="info-row">
          <span class="info-label">Всего тестов</span>
          <span class="info-value">{{ stats.totalTests }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Всего вопросов</span>
          <span class="info-value">{{ stats.totalQuestions || 0 }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/services/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface Stats {
  totalUsers: number
  totalTests: number
  totalResults: number
  activeToday: number
  totalQuestions?: number
}

const tabs = [
  { id: 'users', label: 'Пользователи' },
  { id: 'notifications', label: 'Уведомления' },
  { id: 'system', label: 'Система' }
]

const activeTab = ref('users')
const userSearch = ref('')
const users = ref<User[]>([])
const isLoadingUsers = ref(true)
const isSendingBroadcast = ref(false)

const stats = reactive<Stats>({
  totalUsers: 0,
  totalTests: 0,
  totalResults: 0,
  activeToday: 0
})

const systemInfo = reactive({
  version: '2.0.0'
})

const broadcast = reactive({
  title: '',
  message: '',
  type: 'info'
})

const filteredUsers = computed(() => {
  const query = userSearch.value.toLowerCase()
  if (!query) return users.value
  return users.value.filter(u =>
    u.name.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query)
  )
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

async function loadStats() {
  try {
    const data = await api.getAdminStats()
    Object.assign(stats, data)
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

async function loadUsers() {
  isLoadingUsers.value = true
  try {
    const data = await api.getAdminUsers()
    users.value = data
  } catch (e) {
    console.error('Failed to load users:', e)
  } finally {
    isLoadingUsers.value = false
  }
}

async function updateUserRole(userId: string, newRole: string) {
  try {
    await api.updateUserRole(userId, newRole)
    const user = users.value.find(u => u.id === userId)
    if (user) user.role = newRole
  } catch (e) {
    console.error('Failed to update role:', e)
    alert('Ошибка при изменении роли')
  }
}

async function deleteUser(userId: string) {
  if (!confirm('Вы уверены? Это действие нельзя отменить.')) return

  try {
    await api.deleteUserAdmin(userId)
    users.value = users.value.filter(u => u.id !== userId)
    stats.totalUsers--
  } catch (e) {
    console.error('Failed to delete user:', e)
    alert('Ошибка при удалении пользователя')
  }
}

async function sendBroadcast() {
  if (!broadcast.title || !broadcast.message) return

  isSendingBroadcast.value = true
  try {
    await api.broadcastNotification(broadcast.title, broadcast.message, broadcast.type)
    alert('Уведомление отправлено всем пользователям!')
    broadcast.title = ''
    broadcast.message = ''
  } catch (e) {
    console.error('Failed to send broadcast:', e)
    alert('Ошибка при отправке уведомления')
  } finally {
    isSendingBroadcast.value = false
  }
}

onMounted(() => {
  loadStats()
  loadUsers()
})
</script>

<style scoped>
.admin-page {
  padding: 2rem;
  max-width: 1200px;
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

/* Stats */
.stats-section {
  margin-bottom: 2rem;
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
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.tab {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.tab.active {
  color: var(--color-primary);
  background: var(--accent-glow);
}

/* Content */
.content-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
}

.search-box input {
  padding: 0.625rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--color-text);
  min-width: 250px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Loading */
.loading {
  display: flex;
  justify-content: center;
  padding: 3rem;
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

/* Users table */
.users-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
}

.role-select {
  padding: 0.5rem 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Broadcast form */
.broadcast-form {
  max-width: 600px;
}

.broadcast-form .form-group {
  margin-bottom: 1.25rem;
}

.broadcast-form label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.broadcast-form input,
.broadcast-form textarea,
.broadcast-form select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--color-text);
}

.broadcast-form input:focus,
.broadcast-form textarea:focus,
.broadcast-form select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* System info */
.system-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 10px;
}

.info-label {
  color: var(--color-text-muted);
}

.info-value {
  font-weight: 600;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .search-box input {
    min-width: 100%;
  }

  .tabs {
    flex-wrap: wrap;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
  }
}
</style>


