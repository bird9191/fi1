<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Восстановление пароля</h1>
        <p>Введите email для получения ссылки сброса</p>
      </div>

      <!-- Успешная отправка -->
      <div v-if="emailSent" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Письмо отправлено!</h2>
        <p>
          Мы отправили инструкции по восстановлению пароля на
          <strong>{{ form.email }}</strong>
        </p>
        <p class="hint">Проверьте папку "Спам", если письмо не пришло</p>
        <div class="success-actions">
          <button @click="resendEmail" class="btn btn-outline" :disabled="isLoading || countdown > 0">
            {{ countdown > 0 ? `Отправить снова (${countdown}с)` : 'Отправить снова' }}
          </button>
          <router-link to="/login" class="btn btn-primary">Вернуться к входу</router-link>
        </div>
      </div>

      <!-- Форма -->
      <form v-else @submit.prevent="handleSubmit" class="auth-form">
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

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          <span v-if="isLoading">Отправка...</span>
          <span v-else>Отправить ссылку</span>
        </button>
      </form>

      <div v-if="!emailSent" class="auth-footer">
        <p>Вспомнили пароль? <router-link to="/login">Войти</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { api } from '@/services/api'

const form = reactive({
  email: ''
})

const isLoading = ref(false)
const error = ref('')
const emailSent = ref(false)
const countdown = ref(0)

let countdownInterval: number | null = null

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    await api.forgotPassword(form.email)
    emailSent.value = true
    startCountdown()
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message || 'Ошибка при отправке письма'
  } finally {
    isLoading.value = false
  }
}

async function resendEmail() {
  if (countdown.value > 0) return
  
  isLoading.value = true
  error.value = ''

  try {
    await api.forgotPassword(form.email)
    startCountdown()
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message || 'Ошибка при отправке письма'
  } finally {
    isLoading.value = false
  }
}

function startCountdown() {
  countdown.value = 60
  if (countdownInterval) clearInterval(countdownInterval)
  
  countdownInterval = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
    }
  }, 1000)
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse at top, var(--accent-glow) 0%, transparent 50%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
}

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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

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

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.btn-block {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
}

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

/* Success state */
.success-state {
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.success-state h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.success-state p {
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.success-state strong {
  color: var(--color-text);
}

.success-state .hint {
  font-size: 0.85rem;
  margin-top: 1rem;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}
</style>


