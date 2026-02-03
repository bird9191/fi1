<!--
  ==========================================
  СТРАНИЦА ВХОДА (LoginView.vue)
  ==========================================
  
  Форма авторизации пользователя:
  - Поля email и пароль
  - Ссылка на восстановление пароля
  - Ссылка на регистрацию
-->

<template>
  <div class="auth-page">
    <div class="auth-card">
      
      <!-- ==========================================
           ЗАГОЛОВОК
           ========================================== -->
      <div class="auth-header">
        <h1>Вход в аккаунт</h1>
        <p>Введите свои данные для входа</p>
      </div>

      <!-- ==========================================
           ФОРМА ВХОДА
           ========================================== -->
      <form @submit.prevent="handleLogin" class="auth-form">
        
        <!-- Поле Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
        </div>

        <!-- Поле Пароль -->
        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
          
          <!-- Ссылка на восстановление пароля -->
          <router-link to="/forgot-password" class="forgot-link">
            Забыли пароль?
          </router-link>
        </div>

        <!-- Сообщение об ошибке -->
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <!-- Кнопка входа -->
        <button 
          type="submit" 
          class="btn btn-primary btn-block" 
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading">Вход...</span>
          <span v-else>Войти</span>
        </button>
        
      </form>

      <!-- ==========================================
           ФУТЕР (ссылка на регистрацию)
           ========================================== -->
      <div class="auth-footer">
        <p>Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА СТРАНИЦЫ ВХОДА
 * ==========================================
 */

import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ==========================================
// ХРАНИЛИЩА И РОУТЕР
// ==========================================

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ==========================================
// СОСТОЯНИЕ ФОРМЫ
// ==========================================

/** Данные формы входа */
const form = reactive({
  email: '',
  password: ''
})

// ==========================================
// ОБРАБОТЧИКИ
// ==========================================

/**
 * Обработка отправки формы входа
 */
async function handleLogin(): Promise<void> {
  const success = await authStore.login({
    email: form.email,
    password: form.password
  })

  if (success) {
    // Если был redirect query param - переходим туда
    // Иначе на dashboard
    const redirect = route.query.redirect as string || '/dashboard'
    router.push(redirect)
  }
}
</script>

<style scoped>
/* ==========================================
   СТИЛИ СТРАНИЦЫ АВТОРИЗАЦИИ
   ========================================== */

/* Страница (центрирование карточки) */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse at top, var(--accent-glow) 0%, transparent 50%);
}

/* Карточка формы */
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
}

/* ==========================================
   ЗАГОЛОВОК
   ========================================== */

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.auth-header p {
  color: var(--color-text-muted);
}

/* ==========================================
   ФОРМА
   ========================================== */

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Группа поля */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-group input {
  padding: 0.875rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.form-group input::placeholder {
  color: var(--color-text-muted);
}

/* Ссылка "Забыли пароль?" */
.forgot-link {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: right;
}

.forgot-link:hover {
  color: var(--color-primary);
}

/* ==========================================
   СООБЩЕНИЯ
   ========================================== */

/* Ошибка */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* ==========================================
   КНОПКА
   ========================================== */

.btn-block {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
}

/* ==========================================
   ФУТЕР
   ========================================== */

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.auth-footer p {
  color: var(--color-text-muted);
}

.auth-footer a {
  color: var(--color-primary);
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
