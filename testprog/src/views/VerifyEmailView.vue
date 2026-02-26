

<template>
  <div class="auth-page">
    <div class="auth-card">

      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Подтверждение email...</p>
      </div>

      <div v-else-if="isSuccess" class="success-message">
        <div class="success-icon"></div>
        <h2>Email подтверждён!</h2>
        <p>Теперь вы можете использовать все функции платформы</p>
        <router-link to="/dashboard" class="btn btn-primary">
           Перейти в личный кабинет
        </router-link>
      </div>

      <div v-else class="error-state">
        <div class="error-icon"></div>
        <h2>Ошибка подтверждения</h2>
        <p>{{ errorMessage }}</p>
        
        <div class="actions">
          <button @click="resendVerification" class="btn btn-outline" :disabled="isResending">
            {{ isResending ? ' Отправка...' : ' Отправить повторно' }}
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
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(true)

const isSuccess = ref(false)

const isResending = ref(false)

const errorMessage = ref('')

async function verifyEmail(): Promise<void> {
  const token = route.query.token as string
  
  if (!token) {
    errorMessage.value = 'Отсутствует токен подтверждения'
    isLoading.value = false
    return
  }
  
  try {
    await api.verifyEmail(token)
    isSuccess.value = true

    if (authStore.isAuthenticated) {
      await authStore.refreshUser()
    }
  } catch (error: any) {
    console.error('Ошибка подтверждения:', error)
    
    if (error.response?.status === 400) {
      errorMessage.value = 'Ссылка недействительна или уже была использована'
    } else if (error.response?.status === 404) {
      errorMessage.value = 'Ссылка для подтверждения не найдена'
    } else {
      errorMessage.value = 'Произошла ошибка. Попробуйте позже.'
    }
  } finally {
    isLoading.value = false
  }
}

async function resendVerification(): Promise<void> {
  if (!authStore.isAuthenticated) {
    alert('Войдите в аккаунт для повторной отправки')
    return
  }
  
  isResending.value = true
  
  try {
    await api.resendVerificationEmail()
    alert(' Письмо отправлено! Проверьте почту.')
  } catch (error) {
    console.error('Ошибка отправки:', error)
    alert(' Ошибка при отправке письма')
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
  text-align: center;
}

.loading-state {
  padding: 2rem 0;
}

.spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--color-text-muted);
}

.success-message,
.error-state {
  padding: 1rem 0;
}

.success-icon,
.error-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
}

.success-message h2 {
  color: #4ade80;
}

.error-state h2 {
  color: #fbbf24;
}

.success-message h2,
.error-state h2 {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
}

.success-message p,
.error-state p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.actions .btn {
  width: 100%;
}
</style>

