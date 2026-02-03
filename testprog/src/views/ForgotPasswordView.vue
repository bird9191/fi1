<!--
  ==========================================
  ВОССТАНОВЛЕНИЕ ПАРОЛЯ (ForgotPasswordView.vue)
  ==========================================
  
  Страница запроса сброса пароля:
  - Ввод email
  - Отправка ссылки для сброса
-->

<template>
  <div class="auth-page">
    <div class="auth-card">
      
      <!-- ==========================================
           ЗАГОЛОВОК
           ========================================== -->
      <div class="auth-header">
        <h1>🔐 Восстановление пароля</h1>
        <p>Введите email для получения ссылки сброса</p>
      </div>

      <!-- ==========================================
           УСПЕШНАЯ ОТПРАВКА
           ========================================== -->
      <div v-if="isSuccess" class="success-message">
        <div class="success-icon">✉️</div>
        <h2>Письмо отправлено!</h2>
        <p>
          Мы отправили ссылку для сброса пароля на адрес 
          <strong>{{ email }}</strong>
        </p>
        <p class="hint">
          Проверьте папку "Спам", если письмо не пришло
        </p>
        <router-link to="/login" class="btn btn-primary">
          ← Вернуться ко входу
        </router-link>
      </div>

      <!-- ==========================================
           ФОРМА
           ========================================== -->
      <form v-else @submit.prevent="handleSubmit" class="auth-form">
        
        <!-- Поле Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="example@mail.com"
            required
            autofocus
          />
        </div>

        <!-- Ошибка -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Кнопка отправки -->
        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          {{ isLoading ? '⏳ Отправка...' : '📤 Отправить ссылку' }}
        </button>

        <!-- Ссылка назад -->
        <div class="auth-footer">
          <router-link to="/login">← Вернуться ко входу</router-link>
        </div>
        
      </form>
      
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА ВОССТАНОВЛЕНИЯ ПАРОЛЯ
 * ==========================================
 */

import { ref } from 'vue'
import api from '@/services/api'

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Email пользователя */
const email = ref('')

/** Флаг загрузки */
const isLoading = ref(false)

/** Флаг успешной отправки */
const isSuccess = ref(false)

/** Сообщение об ошибке */
const errorMessage = ref('')

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Отправляет запрос на сброс пароля
 */
async function handleSubmit(): Promise<void> {
  if (!email.value || isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    await api.requestPasswordReset(email.value)
    isSuccess.value = true
  } catch (error: any) {
    console.error('Ошибка отправки:', error)
    
    // Показываем ошибку
    if (error.response?.status === 404) {
      errorMessage.value = 'Пользователь с таким email не найден'
    } else {
      errorMessage.value = 'Ошибка при отправке. Попробуйте позже.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* ==========================================
   СТИЛИ ВОССТАНОВЛЕНИЯ ПАРОЛЯ
   ========================================== */

.auth-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}

/* ==========================================
   ЗАГОЛОВОК
   ========================================== */

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

/* ==========================================
   УСПЕШНАЯ ОТПРАВКА
   ========================================== */

.success-message {
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-message h2 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #4ade80;
}

.success-message p {
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.success-message .hint {
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

/* ==========================================
   ФОРМА
   ========================================== */

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text);
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Ошибка */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Кнопка */
.btn-block {
  width: 100%;
}

/* Футер */
.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.auth-footer a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.95rem;
}

.auth-footer a:hover {
  color: var(--color-primary);
}
</style>
