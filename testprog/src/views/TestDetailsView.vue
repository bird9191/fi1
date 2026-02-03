<!--
  ==========================================
  СТРАНИЦА ПОДРОБНОСТЕЙ ТЕСТА (TestDetailsView.vue)
  ==========================================
  
  Детальная информация о тесте/экзамене:
  - Название, описание, автор
  - Настройки (время, кол-во попыток и т.д.)
  - Кнопка начала прохождения
  - Для автора - кнопки редактирования/удаления
-->

<template>
  <div class="test-details-page">
    
    <!-- ==========================================
         СОСТОЯНИЕ ЗАГРУЗКИ
         ========================================== -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка информации о тесте...</p>
    </div>

    <!-- ==========================================
         ТЕСТ НЕ НАЙДЕН
         ========================================== -->
    <div v-else-if="!test" class="not-found">
      <h2>😕 Тест не найден</h2>
      <p>Возможно, он был удалён или у вас нет доступа</p>
      <router-link to="/tests" class="btn btn-primary">
        ← Вернуться к тестам
      </router-link>
    </div>

    <!-- ==========================================
         СОДЕРЖИМОЕ СТРАНИЦЫ
         ========================================== -->
    <template v-else>
      
      <!-- Кнопка назад -->
      <router-link to="/tests" class="back-link">
        ← Назад к каталогу
      </router-link>

      <!-- Основной контент -->
      <div class="test-content">
        
        <!-- ==========================================
             ЛЕВАЯ ЧАСТЬ: Информация о тесте
             ========================================== -->
        <div class="test-info">
          
          <!-- Бейджи -->
          <div class="badges">
            <span class="type-badge" :class="test.type || 'test'">
              {{ test.type === 'exam' ? '📋 Экзамен' : '✏️ Тест' }}
            </span>
            <span v-if="test.timeLimit" class="setting-badge">
              ⏱ {{ test.timeLimit }} мин
            </span>
            <span v-if="test.strictMode" class="setting-badge strict">
              🔒 Строгий режим
            </span>
          </div>

          <!-- Заголовок -->
          <h1>{{ test.title }}</h1>

          <!-- Описание -->
          <p class="description">{{ test.description }}</p>

          <!-- Автор -->
          <div class="author-info">
            <span class="author-avatar">{{ test.authorName.charAt(0) }}</span>
            <div>
              <div class="author-name">{{ test.authorName }}</div>
              <div class="created-date">
                Создан {{ formatDate(test.createdAt) }}
              </div>
            </div>
          </div>

          <!-- Настройки теста (для экзаменов) -->
          <div v-if="test.type === 'exam'" class="test-settings">
            <h3>⚙️ Настройки экзамена</h3>
            
            <div class="settings-list">
              <div class="setting-item">
                <span class="setting-label">Проходной балл:</span>
                <span class="setting-value">{{ test.passingScore || 60 }}%</span>
              </div>
              
              <div class="setting-item">
                <span class="setting-label">Максимум попыток:</span>
                <span class="setting-value">
                  {{ test.maxAttempts === 0 ? 'Без ограничений' : test.maxAttempts }}
                </span>
              </div>
              
              <div class="setting-item">
                <span class="setting-label">Перемешивание вопросов:</span>
                <span class="setting-value">{{ test.shuffleQuestions ? '✅ Да' : '❌ Нет' }}</span>
              </div>
              
              <div class="setting-item">
                <span class="setting-label">Перемешивание ответов:</span>
                <span class="setting-value">{{ test.shuffleOptions ? '✅ Да' : '❌ Нет' }}</span>
              </div>
              
              <div class="setting-item">
                <span class="setting-label">Подсказки:</span>
                <span class="setting-value">{{ test.showHints ? '✅ Да' : '❌ Нет' }}</span>
              </div>
            </div>
          </div>

          <!-- Действия автора -->
          <div v-if="isAuthor" class="author-actions">
            <router-link :to="`/tests/${test.id}/edit`" class="btn btn-outline">
              ✏️ Редактировать
            </router-link>
            <button @click="confirmDelete" class="btn btn-danger">
              🗑️ Удалить
            </button>
          </div>
        </div>

        <!-- ==========================================
             ПРАВАЯ ЧАСТЬ: Карточка прохождения
             ========================================== -->
        <div class="take-test-card">
          <h3>🎯 Готовы начать?</h3>
          
          <!-- Статистика -->
          <div class="quick-stats">
            <div class="stat">
              <div class="stat-value">{{ test.questions.length }}</div>
              <div class="stat-label">вопросов</div>
            </div>
            <div v-if="test.timeLimit" class="stat">
              <div class="stat-value">{{ test.timeLimit }}</div>
              <div class="stat-label">минут</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ test.passingScore || 60 }}%</div>
              <div class="stat-label">проходной</div>
            </div>
          </div>

          <!-- Предупреждения для экзаменов -->
          <div v-if="test.type === 'exam'" class="exam-warnings">
            <div class="warning-item" v-if="test.strictMode">
              ⚠️ Строгий режим: экзамен отменится при выходе с вкладки
            </div>
            <div class="warning-item" v-if="test.timeLimit">
              ⏳ На прохождение отводится {{ test.timeLimit }} минут
            </div>
            <div class="warning-item" v-if="test.maxAttempts && test.maxAttempts > 0">
              🔄 Максимум попыток: {{ test.maxAttempts }}
            </div>
          </div>

          <!-- Кнопка начала -->
          <router-link
            v-if="authStore.isAuthenticated"
            :to="`/tests/${test.id}/take`"
            class="btn btn-primary btn-large"
          >
            ▶️ {{ test.type === 'exam' ? 'Начать экзамен' : 'Начать тест' }}
          </router-link>
          
          <!-- Для неавторизованных -->
          <div v-else class="auth-required">
            <p>Для прохождения теста необходимо войти</p>
            <router-link to="/login" class="btn btn-primary">
              🔐 Войти
            </router-link>
          </div>
        </div>
        
      </div>
    </template>
    
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА СТРАНИЦЫ ПОДРОБНОСТЕЙ ТЕСТА
 * ==========================================
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTestsStore } from '@/stores/tests'
import type { Test } from '@/types'

// ==========================================
// МАРШРУТИЗАЦИЯ
// ==========================================

const route = useRoute()
const router = useRouter()

// ==========================================
// ХРАНИЛИЩА
// ==========================================

const authStore = useAuthStore()
const testsStore = useTestsStore()

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Флаг загрузки */
const isLoading = ref(true)

/** Данные теста */
const test = ref<Test | null>(null)

// ==========================================
// ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ==========================================

/** Является ли текущий пользователь автором теста */
const isAuthor = computed(() => {
  if (!test.value || !authStore.currentUser) return false
  return test.value.authorId === authStore.currentUser.id
})

// ==========================================
// МЕТОДЫ
// ==========================================

/**
 * Форматирует дату в читабельный формат
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Подтверждение и удаление теста
 */
async function confirmDelete(): Promise<void> {
  const confirmed = confirm(
    '⚠️ Вы уверены, что хотите удалить этот тест?\n' +
    'Это действие нельзя отменить.'
  )
  
  if (confirmed && test.value) {
    try {
      await testsStore.deleteTest(test.value.id)
      router.push('/dashboard')
    } catch (error) {
      alert('Ошибка при удалении теста')
    }
  }
}

/**
 * Загружает данные теста
 */
async function loadTest(): Promise<void> {
  isLoading.value = true
  
  try {
    const testId = route.params.id as string
    test.value = await testsStore.getTestById(testId)
  } catch (error) {
    console.error('Ошибка загрузки теста:', error)
    test.value = null
  } finally {
    isLoading.value = false
  }
}

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  loadTest()
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ СТРАНИЦЫ ПОДРОБНОСТЕЙ ТЕСТА
   ========================================== */

.test-details-page {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ==========================================
   СОСТОЯНИЯ
   ========================================== */

/* Загрузка */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 6rem;
  color: var(--color-text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Не найден */
.not-found {
  text-align: center;
  padding: 6rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
}

.not-found h2 {
  margin-bottom: 0.5rem;
}

.not-found p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

/* ==========================================
   НАВИГАЦИЯ
   ========================================== */

.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
}

/* ==========================================
   ОСНОВНОЙ КОНТЕНТ
   ========================================== */

.test-content {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2rem;
}

/* ==========================================
   ЛЕВАЯ ЧАСТЬ: ИНФОРМАЦИЯ
   ========================================== */

.test-info {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
}

/* Бейджи */
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.type-badge {
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  border-radius: 12px;
  font-weight: 500;
}

.type-badge.test {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.type-badge.exam {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.setting-badge {
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text-muted);
}

.setting-badge.strict {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* Заголовок */
.test-info h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--color-text);
}

/* Описание */
.description {
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

/* ==========================================
   АВТОР
   ========================================== */

.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.author-avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.author-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.created-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* ==========================================
   НАСТРОЙКИ ТЕСТА
   ========================================== */

.test-settings {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.test-settings h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.settings-list {
  display: grid;
  gap: 0.75rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border-radius: 10px;
  font-size: 0.95rem;
}

.setting-label {
  color: var(--color-text-muted);
}

.setting-value {
  font-weight: 500;
}

/* ==========================================
   ДЕЙСТВИЯ АВТОРА
   ========================================== */

.author-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* ==========================================
   ПРАВАЯ ЧАСТЬ: КАРТОЧКА ПРОХОЖДЕНИЯ
   ========================================== */

.take-test-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 5rem;
}

.take-test-card h3 {
  font-size: 1.2rem;
  margin-bottom: 1.25rem;
  text-align: center;
}

/* Статистика */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.stat {
  text-align: center;
  padding: 1rem 0.5rem;
  background: var(--color-background);
  border-radius: 12px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* Предупреждения */
.exam-warnings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.warning-item {
  font-size: 0.85rem;
  padding: 0.75rem 1rem;
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border-radius: 10px;
  line-height: 1.4;
}

/* Кнопка */
.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.05rem;
}

/* Для неавторизованных */
.auth-required {
  text-align: center;
}

.auth-required p {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.auth-required .btn {
  width: 100%;
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */

@media (max-width: 768px) {
  .test-content {
    grid-template-columns: 1fr;
  }

  .take-test-card {
    position: static;
  }

  .test-info h1 {
    font-size: 1.5rem;
  }

  .quick-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
