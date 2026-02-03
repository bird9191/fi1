<!--
  ==========================================
  ПАНЕЛЬ АДМИНИСТРАТОРА (AdminView.vue)
  ==========================================
  
  Административная панель с функциями:
  - Статистика системы
  - Управление пользователями
  - Модерация тестов
  - Рассылка уведомлений
-->

<template>
  <div class="admin-page">
    
    <!-- ==========================================
         БОКОВАЯ ПАНЕЛЬ
         ========================================== -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>🛠️ Админ-панель</h2>
      </div>

      <!-- Навигация -->
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="nav-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- ==========================================
         ОСНОВНОЙ КОНТЕНТ
         ========================================== -->
    <main class="content">
      
      <!-- ==========================================
           СТАТИСТИКА
           ========================================== -->
      <section v-if="activeTab === 'stats'" class="section">
        <h1>📊 Статистика системы</h1>
        
        <!-- Карточки статистики -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">Пользователей</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">{{ stats.totalTests }}</div>
            <div class="stat-label">Тестов</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ stats.totalAttempts }}</div>
            <div class="stat-label">Прохождений</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-value">{{ stats.averageScore }}%</div>
            <div class="stat-label">Средний балл</div>
          </div>
        </div>

        <!-- Распределение по ролям -->
        <div class="chart-card">
          <h3>Пользователи по ролям</h3>
          <div class="roles-chart">
            <div class="role-bar">
              <div class="role-label">Студенты</div>
              <div class="role-progress">
                <div 
                  class="role-fill student" 
                  :style="{ width: getPercent(stats.students, stats.totalUsers) + '%' }"
                ></div>
              </div>
              <div class="role-count">{{ stats.students }}</div>
            </div>
            <div class="role-bar">
              <div class="role-label">Учителя</div>
              <div class="role-progress">
                <div 
                  class="role-fill teacher" 
                  :style="{ width: getPercent(stats.teachers, stats.totalUsers) + '%' }"
                ></div>
              </div>
              <div class="role-count">{{ stats.teachers }}</div>
            </div>
            <div class="role-bar">
              <div class="role-label">Админы</div>
              <div class="role-progress">
                <div 
                  class="role-fill admin" 
                  :style="{ width: getPercent(stats.admins, stats.totalUsers) + '%' }"
                ></div>
              </div>
              <div class="role-count">{{ stats.admins }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==========================================
           ПОЛЬЗОВАТЕЛИ
           ========================================== -->
      <section v-else-if="activeTab === 'users'" class="section">
        <h1>👥 Управление пользователями</h1>
        
        <!-- Поиск -->
        <div class="search-bar">
          <input
            v-model="userSearch"
            type="search"
            placeholder="🔍 Поиск по имени или email..."
            @input="searchUsers"
          />
        </div>

        <!-- Таблица пользователей -->
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td class="user-cell">
                  <span class="user-avatar">{{ user.name.charAt(0) }}</span>
                  <span>{{ user.name }}</span>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <select 
                    :value="user.role" 
                    @change="changeUserRole(user.id, ($event.target as HTMLSelectElement).value)"
                    class="role-select"
                  >
                    <option value="student">Студент</option>
                    <option value="teacher">Учитель</option>
                    <option value="admin">Админ</option>
                  </select>
                </td>
                <td class="date">{{ formatDate(user.createdAt) }}</td>
                <td>
                  <button 
                    @click="confirmDeleteUser(user)" 
                    class="btn btn-sm btn-danger"
                    :disabled="user.role === 'admin'"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ==========================================
           РАССЫЛКА
           ========================================== -->
      <section v-else-if="activeTab === 'broadcast'" class="section">
        <h1>📢 Рассылка уведомлений</h1>
        
        <div class="form-card">
          <form @submit.prevent="sendBroadcast">
            <!-- Заголовок -->
            <div class="form-group">
              <label for="broadcastTitle">Заголовок</label>
              <input
                id="broadcastTitle"
                v-model="broadcastForm.title"
                type="text"
                placeholder="Тема уведомления"
                required
              />
            </div>

            <!-- Сообщение -->
            <div class="form-group">
              <label for="broadcastMessage">Сообщение</label>
              <textarea
                id="broadcastMessage"
                v-model="broadcastForm.message"
                rows="5"
                placeholder="Текст уведомления..."
                required
              ></textarea>
            </div>

            <!-- Получатели -->
            <div class="form-group">
              <label>Получатели</label>
              <div class="checkbox-group">
                <label>
                  <input type="checkbox" v-model="broadcastForm.toStudents" />
                  <span>👨‍🎓 Студенты</span>
                </label>
                <label>
                  <input type="checkbox" v-model="broadcastForm.toTeachers" />
                  <span>👨‍🏫 Учителя</span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="isSending">
              {{ isSending ? '⏳ Отправка...' : '📤 Отправить' }}
            </button>
          </form>
        </div>
      </section>
      
    </main>
    
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА АДМИН-ПАНЕЛИ
 * ==========================================
 */

import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'

// ==========================================
// ИНТЕРФЕЙСЫ
// ==========================================

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface SystemStats {
  totalUsers: number
  totalTests: number
  totalAttempts: number
  averageScore: number
  students: number
  teachers: number
  admins: number
}

// ==========================================
// ВКЛАДКИ
// ==========================================

const tabs = [
  { id: 'stats', icon: '📊', label: 'Статистика' },
  { id: 'users', icon: '👥', label: 'Пользователи' },
  { id: 'broadcast', icon: '📢', label: 'Рассылка' }
]

const activeTab = ref('stats')

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Статистика системы */
const stats = reactive<SystemStats>({
  totalUsers: 0,
  totalTests: 0,
  totalAttempts: 0,
  averageScore: 0,
  students: 0,
  teachers: 0,
  admins: 0
})

/** Список пользователей */
const users = ref<User[]>([])

/** Поиск пользователей */
const userSearch = ref('')

/** Форма рассылки */
const broadcastForm = reactive({
  title: '',
  message: '',
  toStudents: true,
  toTeachers: true
})

/** Флаг отправки */
const isSending = ref(false)

// ==========================================
// ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ==========================================

/** Отфильтрованные пользователи */
const filteredUsers = computed(() => {
  const query = userSearch.value.toLowerCase().trim()
  if (!query) return users.value
  
  return users.value.filter(user =>
    user.name.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  )
})

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Вычисляет процент
 */
function getPercent(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Форматирует дату
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

/**
 * Загружает статистику
 */
async function loadStats(): Promise<void> {
  try {
    const response = await api.getAdminStats()
    Object.assign(stats, response.data)
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
  }
}

/**
 * Загружает пользователей
 */
async function loadUsers(): Promise<void> {
  try {
    const response = await api.getAllUsers()
    users.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error)
  }
}

/**
 * Поиск пользователей
 */
function searchUsers(): void {
  // Фильтрация происходит через computed
}

/**
 * Изменяет роль пользователя
 */
async function changeUserRole(userId: string, newRole: string): Promise<void> {
  try {
    await api.updateUserRole(userId, newRole)
    
    // Обновляем локально
    const user = users.value.find(u => u.id === userId)
    if (user) user.role = newRole
    
    // Обновляем статистику
    loadStats()
  } catch (error) {
    console.error('Ошибка изменения роли:', error)
    alert('❌ Ошибка при изменении роли')
  }
}

/**
 * Подтверждение удаления пользователя
 */
async function confirmDeleteUser(user: User): Promise<void> {
  const confirmed = confirm(
    `⚠️ Удалить пользователя "${user.name}"?\n\n` +
    'Это действие нельзя отменить.'
  )
  
  if (confirmed) {
    try {
      await api.deleteUser(user.id)
      users.value = users.value.filter(u => u.id !== user.id)
      loadStats()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('❌ Ошибка при удалении пользователя')
    }
  }
}

/**
 * Отправляет рассылку
 */
async function sendBroadcast(): Promise<void> {
  if (!broadcastForm.title || !broadcastForm.message) return
  
  isSending.value = true
  
  try {
    await api.sendBroadcast({
      title: broadcastForm.title,
      message: broadcastForm.message,
      toStudents: broadcastForm.toStudents,
      toTeachers: broadcastForm.toTeachers
    })
    
    // Очищаем форму
    broadcastForm.title = ''
    broadcastForm.message = ''
    
    alert('✅ Уведомление отправлено!')
  } catch (error) {
    console.error('Ошибка рассылки:', error)
    alert('❌ Ошибка при отправке')
  } finally {
    isSending.value = false
  }
}

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  loadStats()
  loadUsers()
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ АДМИН-ПАНЕЛИ
   ========================================== */

.admin-page {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ==========================================
   БОКОВАЯ ПАНЕЛЬ
   ========================================== */

.sidebar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 5rem;
}

.sidebar-header h2 {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.nav-item:hover {
  background: var(--color-background);
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary);
}

.nav-icon {
  font-size: 1.1rem;
}

/* ==========================================
   ОСНОВНОЙ КОНТЕНТ
   ========================================== */

.section h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

/* ==========================================
   СТАТИСТИКА
   ========================================== */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
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

/* График ролей */
.chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
}

.chart-card h3 {
  font-size: 1rem;
  margin-bottom: 1.25rem;
}

.roles-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.role-bar {
  display: grid;
  grid-template-columns: 100px 1fr 40px;
  align-items: center;
  gap: 1rem;
}

.role-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.role-progress {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.role-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.role-fill.student { background: #4ade80; }
.role-fill.teacher { background: #60a5fa; }
.role-fill.admin { background: #f87171; }

.role-count {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
}

/* ==========================================
   ПОЛЬЗОВАТЕЛИ
   ========================================== */

.search-bar {
  margin-bottom: 1.5rem;
}

.search-bar input {
  width: 100%;
  max-width: 400px;
  padding: 0.875rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text);
}

.search-bar input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Таблица */
.table-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
}

.data-table th {
  background: var(--color-background);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.data-table td {
  border-bottom: 1px solid var(--color-border);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.role-select {
  padding: 0.4rem 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;
}

.date {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: none;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-danger:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ==========================================
   РАССЫЛКА
   ========================================== */

.form-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--color-text);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  resize: vertical;
}

.checkbox-group {
  display: flex;
  gap: 1.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}

.checkbox-group input {
  width: 18px;
  height: 18px;
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */

@media (max-width: 900px) {
  .admin-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .data-table {
    min-width: 600px;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
