<!--
  ==========================================
  НАВИГАЦИОННАЯ ПАНЕЛЬ (NavBar.vue)
  ==========================================
  
  Верхняя панель навигации с:
  - Логотипом TestMaster
  - Переключателем темы (светлая/тёмная)
  - Аватаром пользователя
  - Меню-гамбургером
  - Боковой панелью (sidebar) справа
-->

<template>
  <!-- ==========================================
       ВЕРХНЯЯ ПАНЕЛЬ НАВИГАЦИИ
       ========================================== -->
  <nav class="navbar">
    <div class="navbar-content">
      
      <!-- Логотип (ведёт на главную) -->
      <router-link to="/" class="logo">
        <span class="logo-text">TestMaster</span>
      </router-link>

      <!-- Правая часть навбара -->
      <div class="nav-right">
        
        <!-- Кнопка переключения темы -->
        <button 
          class="theme-toggle" 
          @click="toggleTheme" 
          :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
        >
          <span v-if="isDark" class="theme-icon">☀</span>
          <span v-else class="theme-icon">🌙</span>
        </button>

        <!-- Аватар пользователя (если авторизован) -->
        <template v-if="authStore.isAuthenticated">
          <router-link to="/profile" class="user-avatar-btn">
            <img 
              v-if="authStore.currentUser?.avatar" 
              :src="authStore.currentUser.avatar" 
              alt="Аватар" 
              class="avatar-img" 
            />
            <span v-else class="avatar-placeholder"></span>
          </router-link>
        </template>
        
        <!-- Кнопка входа (если не авторизован) -->
        <template v-else>
          <router-link to="/login" class="btn btn-outline btn-sm">
            Войти
          </router-link>
        </template>

        <!-- Кнопка-гамбургер для открытия меню -->
        <button class="menu-toggle" @click="sidebarOpen = true">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        
      </div>
    </div>
  </nav>

  <!-- ==========================================
       ЗАТЕМНЕНИЕ ПРИ ОТКРЫТОМ МЕНЮ
       ========================================== -->
  <Transition name="fade">
    <div 
      v-if="sidebarOpen" 
      class="sidebar-overlay" 
      @click="sidebarOpen = false"
    ></div>
  </Transition>

  <!-- ==========================================
       БОКОВАЯ ПАНЕЛЬ (СПРАВА)
       ========================================== -->
  <Transition name="slide-right">
    <aside v-if="sidebarOpen" class="sidebar">
      
      <!-- Заголовок сайдбара -->
      <div class="sidebar-header">
        <span class="sidebar-title">Меню</span>
        <button class="close-btn" @click="sidebarOpen = false">×</button>
      </div>

      <!-- Информация о пользователе (если авторизован) -->
      <router-link
        v-if="authStore.isAuthenticated"
        to="/profile"
        class="sidebar-user"
        @click="sidebarOpen = false"
      >
        <div class="user-info">
          <!-- Аватар -->
          <span class="user-avatar-large">
            <img 
              v-if="authStore.currentUser?.avatar" 
              :src="authStore.currentUser.avatar" 
              alt="Аватар" 
              class="avatar-img-large" 
            />
            <span v-else class="avatar-placeholder-large"></span>
          </span>
          
          <!-- Имя, email и роль -->
          <div class="user-details">
            <span class="user-name-large">{{ authStore.currentUser?.name }}</span>
            <span class="user-email">{{ authStore.currentUser?.email }}</span>
            <span class="user-role-badge" :class="authStore.currentUser?.role">
              {{ getRoleName }}
            </span>
          </div>
        </div>
      </router-link>

      <!-- Навигационные ссылки -->
      <nav class="sidebar-nav">
        
        <!-- ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ -->
        <template v-if="authStore.isAuthenticated">
          
          <!-- Общие ссылки -->
          <router-link to="/profile" class="sidebar-link" @click="sidebarOpen = false">
            Мой профиль
          </router-link>
          <router-link to="/tests" class="sidebar-link" @click="sidebarOpen = false">
            Каталог тестов
          </router-link>
          <router-link to="/dashboard" class="sidebar-link" @click="sidebarOpen = false">
            Панель управления
          </router-link>

          <!-- Только для учителей -->
          <template v-if="authStore.isTeacher">
            <router-link to="/tests/create" class="sidebar-link highlight" @click="sidebarOpen = false">
              Создать тест
            </router-link>
          </template>

          <!-- Только для студентов -->
          <template v-if="authStore.isStudent">
            <router-link to="/results" class="sidebar-link" @click="sidebarOpen = false">
              Мои результаты
            </router-link>
          </template>

          <!-- Только для админов -->
          <template v-if="authStore.isAdmin">
            <router-link to="/admin" class="sidebar-link admin" @click="sidebarOpen = false">
              Админ-панель
            </router-link>
          </template>

          <!-- Кнопка выхода -->
          <button class="sidebar-link logout" @click="handleLogout">
            Выйти из аккаунта
          </button>
          
        </template>

        <!-- ДЛЯ НЕАВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ -->
        <template v-else>
          <router-link to="/tests" class="sidebar-link" @click="sidebarOpen = false">
            Каталог тестов
          </router-link>
          <router-link to="/login" class="sidebar-link" @click="sidebarOpen = false">
            Войти
          </router-link>
          <router-link to="/register" class="sidebar-link" @click="sidebarOpen = false">
            Регистрация
          </router-link>
        </template>
        
      </nav>

      <!-- Футер сайдбара -->
      <div class="sidebar-footer">
        <p>TestMaster v2.0</p>
      </div>
      
    </aside>
  </Transition>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА НАВИГАЦИОННОЙ ПАНЕЛИ
 * ==========================================
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ==========================================
// ХРАНИЛИЩА И РОУТЕР
// ==========================================

const router = useRouter()
const authStore = useAuthStore()

// ==========================================
// СОСТОЯНИЕ КОМПОНЕНТА
// ==========================================

/** Открыта ли боковая панель */
const sidebarOpen = ref(false)

/** Включена ли тёмная тема */
const isDark = ref(true)

// ==========================================
// ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ==========================================

/** Название роли пользователя на русском */
const getRoleName = computed(() => {
  if (authStore.isAdmin) return 'Админ'
  if (authStore.isTeacher) return 'Учитель'
  return 'Студент'
})

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Переключить тему (светлая/тёмная)
 */
function toggleTheme(): void {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    // Тёмная тема (по умолчанию)
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme', 'dark')
  } else {
    // Светлая тема
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

/**
 * Выйти из аккаунта
 */
function handleLogout(): void {
  authStore.logout()
  sidebarOpen.value = false
  router.push('/')
}

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  // Восстановить тему из localStorage
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  }
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ НАВИГАЦИОННОЙ ПАНЕЛИ
   ========================================== */

/* Верхняя панель */
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-background);
  border: none;
  box-shadow: none;
}

/* Контейнер контента */
.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
}

/* ==========================================
   ЛОГОТИП
   ========================================== */

.logo {
  text-decoration: none;
}

.logo-text {
  font-size: 1.35rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ==========================================
   ПРАВАЯ ЧАСТЬ НАВБАРА
   ========================================== */

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ==========================================
   КНОПКА ПЕРЕКЛЮЧЕНИЯ ТЕМЫ
   ========================================== */

.theme-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover {
  border-color: var(--color-primary);
  background: var(--accent-glow);
}

.theme-icon {
  font-size: 1rem;
}

/* ==========================================
   АВАТАР ПОЛЬЗОВАТЕЛЯ
   ========================================== */

.user-avatar-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  overflow: hidden;
}

.user-avatar-btn:has(.avatar-img) {
  border: none;
}

.user-avatar-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: none;
}

/* ==========================================
   КНОПКА-ГАМБУРГЕР
   ========================================== */

.menu-toggle {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: var(--color-text);
  border-radius: 1px;
}

/* ==========================================
   ЗАТЕМНЕНИЕ (OVERLAY)
   ========================================== */

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
}

/* ==========================================
   БОКОВАЯ ПАНЕЛЬ (SIDEBAR)
   ========================================== */

.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 90vw;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  z-index: 101;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
}

/* Заголовок сайдбара */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

/* Кнопка закрытия */
.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.close-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
  background: var(--accent-glow);
}

/* ==========================================
   ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ В САЙДБАРЕ
   ========================================== */

.sidebar-user {
  display: block;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08));
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}

.sidebar-user:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar-large {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar-large:has(.avatar-img-large) {
  border: none;
}

.avatar-img-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder-large {
  display: none;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name-large {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text);
}

.user-email {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* Бейдж роли пользователя */
.user-role-badge {
  display: inline-block;
  margin-top: 0.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
}

.user-role-badge.teacher {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.user-role-badge.student {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.user-role-badge.admin {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* ==========================================
   НАВИГАЦИЯ В САЙДБАРЕ
   ========================================== */

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

/* Ссылка в меню */
.sidebar-link {
  display: block;
  width: 100%;
  padding: 0.875rem 1rem;
  margin-bottom: 0.35rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.sidebar-link:hover {
  background: var(--color-background);
}

.sidebar-link.router-link-exact-active {
  background: var(--accent-glow);
  color: var(--color-primary);
}

/* Выделенная ссылка (создать тест) */
.sidebar-link.highlight {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.12));
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.sidebar-link.highlight:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
}

/* Ссылка админ-панели */
.sidebar-link.admin {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.sidebar-link.admin:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2));
}

/* Кнопка выхода */
.sidebar-link.logout {
  color: #f87171;
}

.sidebar-link.logout:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* ==========================================
   ФУТЕР САЙДБАРА
   ========================================== */

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.sidebar-footer p {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* ==========================================
   АНИМАЦИИ ПЕРЕХОДОВ
   ========================================== */

/* Плавное появление/исчезание overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Выезд сайдбара справа */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* ==========================================
   АДАПТИВНОСТЬ (МОБИЛЬНЫЕ УСТРОЙСТВА)
   ========================================== */

@media (max-width: 480px) {
  .logo-text {
    font-size: 1.15rem;
  }

  .sidebar {
    width: 100%;
    max-width: 100%;
  }
}
</style>
