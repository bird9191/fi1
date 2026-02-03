<!--
  ==========================================
  СБРОС ПАРОЛЯ (ResetPasswordView.vue)
  ==========================================
  
  Страница установки нового пароля:
  - Проверка токена из URL
  - Ввод нового пароля
-->

<template>
  <div class="auth-page">
    <div class="auth-card">
      
      <!-- ==========================================
           ЗАГОЛОВОК
           ========================================== -->
      <div class="auth-header">
        <h1>🔑 Новый пароль</h1>
        <p>Придумайте надёжный пароль</p>
      </div>

      <!-- ==========================================
           УСПЕШНЫЙ СБРОС
           ========================================== -->
      <div v-if="isSuccess" class="success-message">
        <div class="success-icon">✅</div>
        <h2>Пароль изменён!</h2>
        <p>Теперь вы можете войти с новым паролем</p>
        <router-link to="/login" class="btn btn-primary">
          🔐 Войти в аккаунт
        </router-link>
      </div>

      <!-- ==========================================
           НЕДЕЙСТВИТЕЛЬНЫЙ ТОКЕН
           ========================================== -->
      <div v-else-if="isInvalidToken" class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Ссылка недействительна</h2>
        <p>Возможно, она уже была использована или истекла</p>
        <router-link to="/forgot-password" class="btn btn-primary">
          🔄 Запросить новую ссылку
        </router-link>
      </div>

      <!-- ==========================================
           ФОРМА
           ========================================== -->
      <form v-else @submit.prevent="handleSubmit" class="auth-form">
        
        <!-- Новый пароль -->
        <div class="form-group">
          <label for="password">Новый пароль</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Минимум 6 символов"
            minlength="6"
            required
            autofocus
          />
        </div>

        <!-- Подтверждение пароля -->
        <div class="form-group">
          <label for="confirmPassword">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Повторите пароль"
            required
          />
        </div>

        <!-- Ошибка -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Кнопка -->
        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          {{ isLoading ? '⏳ Сохранение...' : '✓ Сохранить пароль' }}
        </button>
        
      </form>
      
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА СБРОСА ПАРОЛЯ
 * ==========================================
 */

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

// ==========================================
// МАРШРУТИЗАЦИЯ
// ==========================================

const route = useRoute()

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Новый пароль */
const password = ref('')

/** Подтверждение пароля */
const confirmPassword = ref('')

/** Флаг загрузки */
const isLoading = ref(false)

/** Флаг успешного сброса */
const isSuccess = ref(false)

/** Флаг недействительного токена */
const isInvalidToken = ref(false)

/** Сообщение об ошибке */
const errorMessage = ref('')

/** Токен из URL */
const token = ref('')

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Проверяет токен при загрузке
 */
async function verifyToken(): Promise<void> {
  token.value = route.query.token as string
  
  if (!token.value) {
    isInvalidToken.value = true
    return
  }
  
  try {
    await api.verifyResetToken(token.value)
  } catch (error) {
    console.error('Недействительный токен:', error)
    isInvalidToken.value = true
  }
}

/**
 * Сбрасывает пароль
 */
async function handleSubmit(): Promise<void> {
  errorMessage.value = ''
  
  // Проверяем совпадение паролей
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }
  
  if (password.value.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return
  }
  
  isLoading.value = true
  
  try {
    await api.resetPassword(token.value, password.value)
    isSuccess.value = true
  } catch (error: any) {
    console.error('Ошибка сброса:', error)
    
    if (error.response?.status === 400) {
      isInvalidToken.value = true
    } else {
      errorMessage.value = 'Ошибка при сбросе пароля. Попробуйте позже.'
    }
  } finally {
    isLoading.value = false
  }
}

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  verifyToken()
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ СБРОСА ПАРОЛЯ
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
   УСПЕХ / ОШИБКА
   ========================================== */

.success-message,
.error-state {
  text-align: center;
}

.success-icon,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-message h2 {
  color: #4ade80;
}

.error-state h2 {
  color: #fbbf24;
}

.success-message h2,
.error-state h2 {
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
}

.success-message p,
.error-state p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.6;
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
</style>
