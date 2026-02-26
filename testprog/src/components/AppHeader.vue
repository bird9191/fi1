<template>
  <nav class="topbar">
    <div class="container">
      <router-link to="/" class="brand">
        <span class="brand-text">TestMaster</span>
      </router-link>

      <div class="actions">
        <button 
          class="theme-btn" 
          @click="toggleTheme" 
          :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
        >
          <span v-if="isDark" class="icon">Sun</span>
          <span v-else class="icon">Moon</span>
        </button>

        <template v-if="authStore.isAuthenticated">
          <router-link to="/profile" class="avatar-link">
            <img 
              v-if="authStore.currentUser?.avatar" 
              :src="authStore.currentUser.avatar" 
              alt="Аватар" 
              class="avatar" 
            />
            <span v-else class="avatar-empty"></span>
          </router-link>
        </template>
        
        <template v-else>
          <router-link to="/login" class="btn btn-outline btn-sm">
            Войти
          </router-link>
        </template>

        <button class="burger" @click="menuOpen = true">
          <span class="line"></span>
          <span class="line"></span>
          <span class="line"></span>
        </button>
      </div>
    </div>
  </nav>

  <Transition name="fade">
    <div 
      v-if="menuOpen" 
      class="overlay" 
      @click="menuOpen = false"
    ></div>
  </Transition>

  <Transition name="slide-right">
    <aside v-if="menuOpen" class="menu">
      <div class="menu-header">
        <span class="menu-title">Меню</span>
        <button class="close" @click="menuOpen = false">×</button>
      </div>

      <router-link
        v-if="authStore.isAuthenticated"
        to="/profile"
        class="user-card"
        @click="menuOpen = false"
      >
        <div class="user-info">
          <span class="user-avatar">
            <img 
              v-if="authStore.currentUser?.avatar" 
              :src="authStore.currentUser.avatar" 
              alt="Аватар" 
              class="user-photo" 
            />
            <span v-else class="photo-placeholder"></span>
          </span>
          
          <div class="user-data">
            <span class="user-name">{{ authStore.currentUser?.name }}</span>
            <span class="user-email">{{ authStore.currentUser?.email }}</span>
            <span class="role-tag" :class="authStore.currentUser?.role">
              {{ getRoleName }}
            </span>
          </div>
        </div>
      </router-link>

      <nav class="nav">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/profile" class="nav-item" @click="menuOpen = false">
            Мой профиль
          </router-link>
          <router-link to="/tests" class="nav-item" @click="menuOpen = false">
            Каталог тестов
          </router-link>
          <router-link to="/dashboard" class="nav-item" @click="menuOpen = false">
            Панель управления
          </router-link>

          <template v-if="authStore.isTeacher">
            <router-link to="/tests/create" class="nav-item primary" @click="menuOpen = false">
              Создать тест
            </router-link>
          </template>

          <template v-if="authStore.isStudent">
            <router-link to="/results" class="nav-item" @click="menuOpen = false">
              Мои результаты
            </router-link>
          </template>

          <template v-if="authStore.isAdmin">
            <router-link to="/admin" class="nav-item danger" @click="menuOpen = false">
              Админ-панель
            </router-link>
          </template>

          <button class="nav-item logout-btn" @click="handleLogout">
            Выйти из аккаунта
          </button>
        </template>

        <template v-else>
          <router-link to="/tests" class="nav-item" @click="menuOpen = false">
            Каталог тестов
          </router-link>
          <router-link to="/login" class="nav-item" @click="menuOpen = false">
            Войти
          </router-link>
          <router-link to="/register" class="nav-item" @click="menuOpen = false">
            Регистрация
          </router-link>
        </template>
      </nav>

      <div class="menu-footer">
        <p>TestMaster v2.0</p>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const menuOpen = ref(false)
const isDark = ref(true)

const getRoleName = computed(() => {
  if (authStore.isAdmin) return 'Админ'
  if (authStore.isTeacher) return 'Учитель'
  return 'Студент'
})

function toggleTheme(): void {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

function handleLogout(): void {
  authStore.logout()
  menuOpen.value = false
  router.push('/')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  }
})
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-background);
  border: none;
  box-shadow: none;
}

.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
}

.brand {
  text-decoration: none;
}

.brand-text {
  font-size: 1.35rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-btn {
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

.theme-btn:hover {
  border-color: var(--color-primary);
  background: var(--accent-glow);
}

.icon {
  font-size: 1rem;
}

.avatar-link {
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

.avatar-link:has(.avatar) {
  border: none;
}

.avatar-link:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-empty {
  display: none;
}

.burger {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.line {
  width: 20px;
  height: 2px;
  background: var(--color-text);
  border-radius: 1px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
}

.menu {
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

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.menu-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.close {
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

.close:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
  background: var(--accent-glow);
}

.user-card {
  display: block;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08));
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}

.user-card:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
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

.user-avatar:has(.user-photo) {
  border: none;
}

.user-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.photo-placeholder {
  display: none;
}

.user-data {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text);
}

.user-email {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.role-tag {
  display: inline-block;
  margin-top: 0.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
}

.role-tag.teacher {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.role-tag.student {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.role-tag.admin {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.nav-item {
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

.nav-item:hover {
  background: var(--color-background);
}

.nav-item.router-link-exact-active {
  background: var(--accent-glow);
  color: var(--color-primary);
}

.nav-item.primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.12));
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.nav-item.primary:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
}

.nav-item.danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.nav-item.danger:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2));
}

.logout-btn {
  color: #f87171;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.menu-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.menu-footer p {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .brand-text {
    font-size: 1.15rem;
  }

  .menu {
    width: 100%;
    max-width: 100%;
  }
}
</style>
