<!--
  ==========================================
  ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ (ProfileView.vue)
  ==========================================
  
  Страница настроек профиля:
  - Личные данные (имя, email, телефон)
  - Смена пароля
  - Двухфакторная аутентификация
  - Удаление аккаунта
-->

<template>
  <div class="profile-page">
    
    <!-- ==========================================
         БОКОВАЯ ПАНЕЛЬ
         ========================================== -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="avatar">
          {{ userInitials }}
        </div>
        <h2>{{ authStore.currentUser?.name }}</h2>
        <span class="role-badge" :class="authStore.currentUser?.role">
          {{ roleName }}
        </span>
      </div>

      <!-- Навигация по секциям -->
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
           ЛИЧНЫЕ ДАННЫЕ
           ========================================== -->
      <section v-if="activeTab === 'personal'" class="section">
        <h1>👤 Личные данные</h1>
        
        <form @submit.prevent="savePersonalData" class="form-card">
          <!-- Имя -->
          <div class="form-group">
            <label for="name">Имя</label>
            <input
              id="name"
              v-model="personalForm.name"
              type="text"
              required
            />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="personalForm.email"
              type="email"
              required
            />
            <span v-if="authStore.currentUser?.emailVerified" class="verified">
              ✓ Подтверждён
            </span>
          </div>

          <!-- Телефон -->
          <div class="form-group">
            <label for="phone">Телефон</label>
            <input
              id="phone"
              v-model="personalForm.phone"
              type="tel"
              placeholder="+7 (xxx) xxx-xx-xx"
            />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? '⏳ Сохранение...' : '💾 Сохранить' }}
          </button>
        </form>
      </section>

      <!-- ==========================================
           БЕЗОПАСНОСТЬ
           ========================================== -->
      <section v-else-if="activeTab === 'security'" class="section">
        <h1>🔒 Безопасность</h1>
        
        <!-- Смена пароля -->
        <div class="form-card">
          <h3>Смена пароля</h3>
          
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label for="currentPassword">Текущий пароль</label>
              <input
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                type="password"
                required
              />
            </div>

            <div class="form-group">
              <label for="newPassword">Новый пароль</label>
              <input
                id="newPassword"
                v-model="passwordForm.newPassword"
                type="password"
                minlength="6"
                required
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                type="password"
                required
              />
            </div>

            <button type="submit" class="btn btn-primary" :disabled="isChangingPassword">
              {{ isChangingPassword ? '⏳ Изменение...' : '🔑 Изменить пароль' }}
            </button>
          </form>
        </div>

        <!-- 2FA -->
        <div class="form-card">
          <h3>Двухфакторная аутентификация</h3>
          <p class="description">
            Дополнительный уровень защиты вашего аккаунта
          </p>
          
          <div class="twofa-status" :class="{ enabled: is2FAEnabled }">
            <span class="status-icon">{{ is2FAEnabled ? '✅' : '❌' }}</span>
            <span>{{ is2FAEnabled ? 'Включена' : 'Выключена' }}</span>
          </div>

          <button
            @click="toggle2FA"
            class="btn"
            :class="is2FAEnabled ? 'btn-outline' : 'btn-primary'"
          >
            {{ is2FAEnabled ? '🔓 Отключить' : '🔐 Включить' }}
          </button>
        </div>
      </section>

      <!-- ==========================================
           УДАЛЕНИЕ АККАУНТА
           ========================================== -->
      <section v-else-if="activeTab === 'danger'" class="section">
        <h1>⚠️ Опасная зона</h1>
        
        <div class="form-card danger-zone">
          <h3>🗑️ Удаление аккаунта</h3>
          <p class="description">
            Это действие нельзя отменить. Все ваши данные будут удалены навсегда.
          </p>
          
          <button @click="confirmDeleteAccount" class="btn btn-danger">
            Удалить аккаунт
          </button>
        </div>
      </section>
      
    </main>
    
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * ==========================================
 */

import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

// ==========================================
// ХРАНИЛИЩА И РОУТЕР
// ==========================================

const router = useRouter()
const authStore = useAuthStore()

// ==========================================
// ВКЛАДКИ
// ==========================================

const tabs = [
  { id: 'personal', icon: '👤', label: 'Личные данные' },
  { id: 'security', icon: '🔒', label: 'Безопасность' },
  { id: 'danger', icon: '⚠️', label: 'Опасная зона' }
]

const activeTab = ref('personal')

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Загрузка данных */
const isSaving = ref(false)
const isChangingPassword = ref(false)

/** Включена ли 2FA */
const is2FAEnabled = ref(false)

// ==========================================
// ФОРМЫ
// ==========================================

/** Форма личных данных */
const personalForm = reactive({
  name: '',
  email: '',
  phone: ''
})

/** Форма смены пароля */
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// ==========================================
// ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ==========================================

/** Инициалы пользователя */
const userInitials = computed(() => {
  const name = authStore.currentUser?.name || ''
  return name.charAt(0).toUpperCase()
})

/** Название роли */
const roleName = computed(() => {
  const roles: Record<string, string> = {
    student: 'Студент',
    teacher: 'Учитель',
    admin: 'Администратор'
  }
  return roles[authStore.currentUser?.role || 'student']
})

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Сохраняет личные данные
 */
async function savePersonalData(): Promise<void> {
  if (isSaving.value) return
  
  isSaving.value = true
  
  try {
    await authStore.updateProfile({
      name: personalForm.name,
      email: personalForm.email,
      phone: personalForm.phone
    })
    alert('✅ Данные сохранены!')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('❌ Ошибка при сохранении данных')
  } finally {
    isSaving.value = false
  }
}

/**
 * Меняет пароль
 */
async function changePassword(): Promise<void> {
  // Проверяем совпадение паролей
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('❌ Пароли не совпадают')
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    alert('❌ Пароль должен быть не менее 6 символов')
    return
  }
  
  isChangingPassword.value = true
  
  try {
    await api.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )
    
    // Очищаем форму
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    alert('✅ Пароль успешно изменён!')
  } catch (error) {
    console.error('Ошибка смены пароля:', error)
    alert('❌ Неверный текущий пароль')
  } finally {
    isChangingPassword.value = false
  }
}

/**
 * Переключает 2FA
 */
async function toggle2FA(): Promise<void> {
  try {
    if (is2FAEnabled.value) {
      await api.disable2FA()
      is2FAEnabled.value = false
      alert('✅ 2FA отключена')
    } else {
      await api.enable2FA()
      is2FAEnabled.value = true
      alert('✅ 2FA включена')
    }
  } catch (error) {
    console.error('Ошибка 2FA:', error)
    alert('❌ Ошибка при настройке 2FA')
  }
}

/**
 * Подтверждение удаления аккаунта
 */
async function confirmDeleteAccount(): Promise<void> {
  const confirmed = confirm(
    '⚠️ Вы уверены, что хотите удалить аккаунт?\n\n' +
    'Это действие нельзя отменить!'
  )
  
  if (confirmed) {
    try {
      await authStore.deleteAccount()
      router.push('/')
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('❌ Ошибка при удалении аккаунта')
    }
  }
}

/**
 * Загружает данные профиля
 */
function loadProfileData(): void {
  if (authStore.currentUser) {
    personalForm.name = authStore.currentUser.name
    personalForm.email = authStore.currentUser.email
    personalForm.phone = authStore.currentUser.phone || ''
    is2FAEnabled.value = authStore.currentUser.twoFactorEnabled || false
  }
}

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ ПРОФИЛЯ
   ========================================== */

.profile-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1100px;
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

.sidebar-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 20px;
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.sidebar-header h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.role-badge {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
}

.role-badge.student {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.role-badge.teacher {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* Навигация */
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

.content {
  min-height: 400px;
}

.section h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

/* ==========================================
   КАРТОЧКА ФОРМЫ
   ========================================== */

.form-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.form-card .description {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}

/* Поля формы */
.form-group {
  margin-bottom: 1rem;
  position: relative;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--color-text);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.verified {
  position: absolute;
  right: 0.75rem;
  top: 2.5rem;
  font-size: 0.8rem;
  color: #4ade80;
}

/* ==========================================
   2FA
   ========================================== */

.twofa-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 10px;
  margin-bottom: 1rem;
}

.twofa-status.enabled {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
}

.status-icon {
  font-size: 1.2rem;
}

/* ==========================================
   ОПАСНАЯ ЗОНА
   ========================================== */

.danger-zone {
  border-color: rgba(239, 68, 68, 0.3);
}

.danger-zone h3 {
  color: #f87171;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */

@media (max-width: 768px) {
  .profile-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
</style>
