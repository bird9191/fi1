<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Проверка -->
      <div v-if="isVerifying" class="loading-state">
        <div class="spinner"></div>
        <p>Подтверждение email...</p>
      </div>

      <!-- Успех -->
      <div v-else-if="success" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Email подтверждён!</h2>
        <p>Ваш аккаунт активирован. Теперь вы можете пользоваться всеми функциями.</p>
        <router-link to="/dashboard" class="btn btn-primary">
          Перейти в кабинет
        </router-link>
      </div>

      <!-- Ошибка -->
      <div v-else class="error-state">
        <div class="error-icon">!</div>
        <h2>Ошибка подтверждения</h2>
        <p>{{ error || 'Ссылка недействительна или истекла' }}</p>
        <div class="error-actions">
          <button @click="resendVerification" class="btn btn-outline" :disabled="isResending">
            {{ isResending ? 'Отправка...' : 'Отправить повторно' }}
          </button>
          <router-link to="/login" class="btn btn-primary">
            Войти
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()

const isVerifying = ref(true)
const success = ref(false)
const error = ref('')
const isResending = ref(false)

async function verifyEmail() {
  const token = route.query.token as string
  
  if (!token) {
    error.value = 'Отсутствует токен подтверждения'
    isVerifying.value = false
    return
  }

  try {
    await api.verifyEmail(token)
    success.value = true
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message || 'Ошибка подтверждения email'
  } finally {
    isVerifying.value = false
  }
}

async function resendVerification() {
  isResending.value = true
  
  try {
    await api.resendVerification()
    alert('Письмо отправлено! Проверьте почту.')
  } catch (e: unknown) {
    const err = e as { message?: string }
    alert(err.message || 'Ошибка отправки')
  } finally {
    isResending.value = false
  }
}

onMounted(() => {
  verifyEmail()
})
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

.loading-state {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--color-text-muted);
}

.success-state, .error-state {
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.success-state h2, .error-state h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.success-state p, .error-state p {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>


