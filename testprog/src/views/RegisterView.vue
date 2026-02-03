<!--
  ==========================================
  СТРАНИЦА РЕГИСТРАЦИИ (RegisterView.vue)
  ==========================================
  
  Форма создания нового аккаунта:
  - Имя, email, пароль
  - Выбор роли (студент/учитель)
  - Ссылка на страницу входа
-->

<template>
  <div class="auth-page">
    <div class="auth-card">
      
      <!-- ==========================================
           ЗАГОЛОВОК
           ========================================== -->
      <div class="auth-header">
        <h1>Регистрация</h1>
        <p>Создайте аккаунт для начала работы</p>
      </div>

      <!-- ==========================================
           ФОРМА РЕГИСТРАЦИИ
           ========================================== -->
      <form @submit.prevent="handleRegister" class="auth-form">
        
        <!-- Поле Имя -->
        <div class="form-group">
          <label for="name">Имя</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Ваше имя"
            required
            autocomplete="name"
          />
        </div>

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
            placeholder="Минимум 6 символов"
            required
            minlength="6"
            autocomplete="new-password"
          />
        </div>

        <!-- Выбор роли -->
        <div class="form-group">
          <label>Вы регистрируетесь как:</label>
          
          <div class="role-selector">
            <!-- Студент -->
            <label class="role-option" :class="{ active: form.role === 'student' }">
              <input type="radio" v-model="form.role" value="student" />
              <div class="role-content">
                <span class="role-icon">🎓</span>
                <span class="role-title">Студент</span>
                <span class="role-desc">Проходить тесты</span>
              </div>
            </label>
            
            <!-- Учитель -->
            <label class="role-option" :class="{ active: form.role === 'teacher' }">
              <input type="radio" v-model="form.role" value="teacher" />
              <div class="role-content">
                <span class="role-icon">👨‍🏫</span>
                <span class="role-title">Учитель</span>
                <span class="role-desc">Создавать тесты</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Сообщение об ошибке -->
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <!-- Кнопка регистрации -->
        <button 
          type="submit" 
          class="btn btn-primary btn-block" 
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading">Регистрация...</span>
          <span v-else>Зарегистрироваться</span>
        </button>
        
      </form>

      <!-- ==========================================
           ФУТЕР (ссылка на вход)
           ========================================== -->
      <div class="auth-footer">
        <p>Уже есть аккаунт? <router-link to="/login">Войти</router-link></p>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА СТРАНИЦЫ РЕГИСТРАЦИИ
 * ==========================================
 */

import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

// ==========================================
// ХРАНИЛИЩА И РОУТЕР
// ==========================================

const router = useRouter()
const authStore = useAuthStore()

// ==========================================
// СОСТОЯНИЕ ФОРМЫ
// ==========================================

/** Данные формы регистрации */
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'student' as UserRole  // По умолчанию - студент
})

// ==========================================
// ОБРАБОТЧИКИ
// ==========================================

/**
 * Обработка отправки формы регистрации
 */
async function handleRegister(): Promise<void> {
  const success = await authStore.register({
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role
  })

  if (success) {
    // После успешной регистрации - на dashboard
    router.push('/dashboard')
  }
}
</script>

<style scoped>
/* ==========================================
   СТИЛИ СТРАНИЦЫ АВТОРИЗАЦИИ
   ========================================== */

/* Страница */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse at top, var(--accent-glow) 0%, transparent 50%);
}

/* Карточка */
.auth-card {
  width: 100%;
  max-width: 480px;
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

/* Поля ввода */
.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
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

/* ==========================================
   ВЫБОР РОЛИ
   ========================================== */

.role-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.role-option {
  cursor: pointer;
}

/* Скрываем радио-кнопку */
.role-option input {
  display: none;
}

/* Контент карточки роли */
.role-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  transition: all 0.2s;
}

.role-option:hover .role-content {
  border-color: var(--color-primary);
}

.role-option.active .role-content {
  border-color: var(--color-primary);
  background: var(--accent-glow);
}

/* Иконка роли */
.role-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

/* Название роли */
.role-title {
  font-weight: 600;
  color: var(--color-text);
}

/* Описание роли */
.role-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* ==========================================
   СООБЩЕНИЯ
   ========================================== */

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
