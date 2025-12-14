<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Проверка токена -->
      <div v-if="isValidating" class="loading-state">
        <div class="spinner"></div>
        <p>Проверка ссылки...</p>
      </div>

      <!-- Недействительный токен -->
      <div v-else-if="tokenError" class="error-state">
        <div class="error-icon">!</div>
        <h2>Ссылка недействительна</h2>
        <p>{{ tokenError }}</p>
        <router-link to="/forgot-password" class="btn btn-primary">
          Запросить новую ссылку
        </router-link>
      </div>

      <!-- Успешный сброс -->
      <div v-else-if="resetSuccess" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Пароль изменён!</h2>
        <p>Теперь вы можете войти с новым паролем</p>
        <router-link to="/login" class="btn btn-primary">
          Войти в аккаунт
        </router-link>
      </div>

      <!-- Форма сброса -->
      <template v-else>
        <div class="auth-header">
          <h1>Новый пароль</h1>
          <p>Придумайте новый надёжный пароль</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="password">Новый пароль</label>
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

          <div class="form-group">
            <label for="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="Повторите пароль"
              required
              autocomplete="new-password"
            />
          </div>

          <!-- Индикатор силы пароля -->
          <div class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.width }"></div>
            </div>
            <span class="strength-label" :class="passwordStrength.class">{{ passwordStrength.label }}</span>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading || !isFormValid">
            <span v-if="isLoading">Сохранение...</span>
            <span v-else>Сохранить пароль</span>
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()

const form = reactive({
  password: '',
  confirmPassword: ''
})

const isValidating = ref(true)
const tokenError = ref('')
const resetSuccess = ref(false)
const isLoading = ref(false)
const error = ref('')

const token = computed(() => route.query.token as string || '')

const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return { width: '0%', class: '', label: '' }
  
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  if (score <= 1) return { width: '20%', class: 'weak', label: 'Слабый' }
  if (score <= 2) return { width: '40%', class: 'fair', label: 'Средний' }
  if (score <= 3) return { width: '60%', class: 'good', label: 'Хороший' }
  if (score <= 4) return { width: '80%', class: 'strong', label: 'Сильный' }
  return { width: '100%', class: 'excellent', label: 'Отличный' }
})

const isFormValid = computed(() => {
  return form.password.length >= 6 && form.password === form.confirmPassword
})

async function validateToken() {
  if (!token.value) {
    tokenError.value = 'Отсутствует токен сброса пароля'
    isValidating.value = false
    return
  }

  // В реальном приложении здесь можно проверить токен на сервере
  // Пока просто проверяем наличие токена
  isValidating.value = false
}

async function handleSubmit() {
  error.value = ''

  if (form.password !== form.confirmPassword) {
    error.value = 'Пароли не совпадают'
    return
  }

  if (form.password.length < 6) {
    error.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  isLoading.value = true

  try {
    await api.resetPassword(token.value, form.password)
    resetSuccess.value = true
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message || 'Ошибка при сбросе пароля'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  validateToken()
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

.error-state, .success-state {
  text-align: center;
}

.error-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
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

.error-state h2, .success-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.error-state p, .success-state p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
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

/* Password strength */
.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s, background 0.3s;
}

.strength-fill.weak { background: #ef4444; }
.strength-fill.fair { background: #f97316; }
.strength-fill.good { background: #eab308; }
.strength-fill.strong { background: #22c55e; }
.strength-fill.excellent { background: #10b981; }

.strength-label {
  font-size: 0.8rem;
  min-width: 70px;
}

.strength-label.weak { color: #ef4444; }
.strength-label.fair { color: #f97316; }
.strength-label.good { color: #eab308; }
.strength-label.strong { color: #22c55e; }
.strength-label.excellent { color: #10b981; }

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
</style>


