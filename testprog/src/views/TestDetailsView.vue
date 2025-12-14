<template>
  <div class="test-details-page">
    <div v-if="testsStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка теста...</p>
    </div>

    <div v-else-if="!test" class="not-found">
      <h2>Тест не найден</h2>
      <p>Возможно, он был удалён или у вас нет доступа</p>
      <router-link to="/tests" class="btn btn-primary">
        К списку тестов
      </router-link>
    </div>

    <template v-else>
      <div class="test-header">
        <div class="header-top">
          <router-link to="/tests" class="back-link">Назад к тестам</router-link>
          <div class="badges">
            <span class="type-badge" :class="test.type || 'test'">
              {{ test.type === 'exam' ? 'Экзамен' : 'Тест' }}
            </span>
            <span class="visibility-badge" :class="test.visibility">
              {{ test.visibility === 'public' ? 'Публичный' : 'Приватный' }}
            </span>
          </div>
        </div>

        <h1>{{ test.title }}</h1>
        <p class="description">{{ test.description }}</p>

        <div class="test-info">
          <div class="info-item">
            <div>
              <span class="info-label">Автор</span>
              <span class="info-value">{{ test.authorName }}</span>
            </div>
          </div>
          <div class="info-item">
            <div>
              <span class="info-label">Вопросов</span>
              <span class="info-value">{{ test.questions.length }}</span>
            </div>
          </div>
          <div class="info-item" v-if="test.type === 'exam'">
            <div>
              <span class="info-label">Время</span>
              <span class="info-value">{{ test.timeLimit ? `${test.timeLimit} мин` : 'Без лимита' }}</span>
            </div>
          </div>
          <div class="info-item">
            <div>
              <span class="info-label">Макс. баллов</span>
              <span class="info-value">{{ totalPoints }}</span>
            </div>
          </div>
          <div class="info-item" v-if="test.type === 'exam' && test.passingScore">
            <div>
              <span class="info-label">Проходной</span>
              <span class="info-value">{{ test.passingScore }}%</span>
            </div>
          </div>
        </div>

        <!-- Особенности экзамена -->
        <div v-if="test.type === 'exam'" class="exam-features">
          <span v-if="test.strictMode" class="feature warning">Защита от списывания</span>
          <span v-if="test.shuffleQuestions" class="feature">Вопросы перемешаны</span>
          <span v-if="test.allowTrainingMode" class="feature">Есть режим тренировки</span>
          <span v-if="test.maxAttempts" class="feature">{{ test.maxAttempts }} попыток</span>
        </div>

        <div class="actions">
          <router-link 
            v-if="authStore.isAuthenticated" 
            :to="`/tests/${test.id}/take`" 
            class="btn btn-primary btn-lg"
          >
            {{ test.type === 'exam' ? 'Начать экзамен' : 'Пройти тест' }}
          </router-link>
          <router-link 
            v-else 
            to="/login" 
            class="btn btn-primary btn-lg"
          >
            Войти для прохождения
          </router-link>

          <router-link 
            v-if="isAuthor" 
            :to="`/tests/${test.id}/edit`" 
            class="btn btn-outline btn-lg"
          >
            Редактировать
          </router-link>
        </div>
      </div>

      <div class="questions-preview">
        <h2>Содержание теста</h2>
        <div class="questions-list">
          <div v-for="(question, index) in test.questions" :key="question.id" class="question-preview">
            <div class="question-number">{{ index + 1 }}</div>
            <div class="question-content">
              <span class="question-type">
                {{ getQuestionTypeLabel(question.type) }}
              </span>
              <p class="question-text">{{ question.text }}</p>
              <span class="question-points">{{ question.points }} баллов</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTestsStore } from '@/stores/tests'
import type { Test, QuestionType } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const testsStore = useTestsStore()

const test = ref<Test | null>(null)

const totalPoints = computed(() => 
  test.value?.questions.reduce((sum, q) => sum + q.points, 0) || 0
)

const isAuthor = computed(() => 
  test.value?.authorId === authStore.currentUser?.id
)

function getQuestionTypeLabel(type: QuestionType): string {
  const labels = {
    single: 'Один ответ',
    multiple: 'Несколько ответов',
    text: 'Текстовый ответ'
  }
  return labels[type]
}

onMounted(async () => {
  const id = route.params.id as string
  test.value = await testsStore.loadTest(id)
})
</script>

<style scoped>
.test-details-page {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.loading, .not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  text-align: center;
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

.not-found h2 {
  margin-bottom: 0.5rem;
}

.not-found p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.test-header {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
}

.badges {
  display: flex;
  gap: 0.5rem;
}

.type-badge {
  font-size: 0.85rem;
  padding: 0.35rem 0.9rem;
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

.visibility-badge {
  font-size: 0.85rem;
  padding: 0.35rem 0.9rem;
  border-radius: 12px;
}

.visibility-badge.public {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.visibility-badge.private {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.exam-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.exam-features .feature {
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  background: var(--color-background);
  border-radius: 8px;
  color: var(--color-text-muted);
}

.exam-features .feature.warning {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.test-header h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.description {
  color: var(--color-text-muted);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.test-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.info-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.questions-preview {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 2rem;
}

.questions-preview h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-preview {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-background);
  border-radius: 12px;
}

.question-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
}

.question-type {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.question-text {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.question-points {
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 500;
}

@media (max-width: 600px) {
  .test-info {
    grid-template-columns: 1fr 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .actions .btn {
    width: 100%;
    text-align: center;
  }
}
</style>

