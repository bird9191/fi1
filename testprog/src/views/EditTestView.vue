<template>
  <div class="edit-test-page">
    <div v-if="testsStore.isLoading && !test" class="loading">
      <div class="spinner"></div>
      <p>Загрузка теста...</p>
    </div>

    <div v-else-if="!test" class="not-found">
      <h2>Тест не найден</h2>
      <router-link to="/dashboard" class="btn btn-primary">К панели</router-link>
    </div>

    <template v-else>
      <header class="page-header">
        <router-link :to="`/tests/${test.id}`" class="back-link">Назад к тесту</router-link>
        <h1>Редактирование теста</h1>
      </header>

      <form @submit.prevent="handleSubmit" class="test-form">
        <!-- Основная информация -->
        <section class="form-section">
          <h2>Основная информация</h2>

          <div class="form-group">
            <label for="title">Название теста *</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Описание</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="visibility">Видимость</label>
              <select id="visibility" v-model="form.visibility">
                <option value="public">Публичный</option>
                <option value="private">Приватный</option>
              </select>
            </div>

            <div class="form-group">
              <label for="timeLimit">Лимит времени (минуты)</label>
              <input
                id="timeLimit"
                v-model.number="form.timeLimit"
                type="number"
                min="0"
              />
            </div>
          </div>
        </section>

        <!-- Вопросы -->
        <section class="form-section">
          <div class="section-header">
            <h2>Вопросы</h2>
            <span class="question-count">{{ form.questions.length }} вопросов</span>
          </div>

          <div class="questions-list">
            <div
              v-for="(question, qIndex) in form.questions"
              :key="question.id"
              class="question-card"
            >
              <div class="question-header">
                <span class="question-number">Вопрос {{ qIndex + 1 }}</span>
                <button
                  type="button"
                  class="btn-icon delete"
                  @click="removeQuestion(qIndex)"
                  :disabled="form.questions.length === 1"
                >
                  ×
                </button>
              </div>

              <div class="form-group">
                <label>Текст вопроса *</label>
                <textarea
                  v-model="question.text"
                  rows="2"
                  required
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Тип вопроса</label>
                  <select v-model="question.type" @change="onQuestionTypeChange(qIndex)">
                    <option value="single">Один ответ</option>
                    <option value="multiple">Несколько ответов</option>
                    <option value="text">Текстовый ответ</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Баллы</label>
                  <input
                    v-model.number="question.points"
                    type="number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div v-if="question.type !== 'text'" class="options-section">
                <label>Варианты ответов</label>

                <div
                  v-for="(option, oIndex) in question.options"
                  :key="option.id"
                  class="option-row"
                >
                  <input
                    :type="question.type === 'single' ? 'radio' : 'checkbox'"
                    :name="`correct-${qIndex}`"
                    v-model="option.isCorrect"
                    :value="true"
                    @change="question.type === 'single' && setCorrectOption(qIndex, oIndex)"
                    class="option-check"
                  />
                  <input
                    v-model="option.text"
                    type="text"
                    class="option-input"
                    required
                  />
                  <button
                    type="button"
                    class="btn-icon small"
                    @click="removeOption(qIndex, oIndex)"
                    :disabled="question.options.length <= 2"
                  >
                    ×
                  </button>
                </div>

                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addOption(qIndex)"
                >
                  + Добавить вариант
                </button>
              </div>
            </div>
          </div>

          <button type="button" class="btn btn-outline add-question-btn" @click="addQuestion">
            + Добавить вопрос
          </button>
        </section>

        <!-- Опасная зона -->
        <section class="form-section danger-zone">
          <h2>Опасная зона</h2>
          <p>Удаление теста нельзя отменить. Все результаты прохождений будут потеряны.</p>
          <button type="button" class="btn btn-danger" @click="handleDelete">
            Удалить тест
          </button>
        </section>

        <!-- Действия -->
        <div class="form-actions">
          <router-link :to="`/tests/${test.id}`" class="btn btn-outline">
            Отмена
          </router-link>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { Test, Question, AnswerOption, TestVisibility } from '@/types'

const route = useRoute()
const router = useRouter()
const testsStore = useTestsStore()

const test = ref<Test | null>(null)
const isSubmitting = ref(false)

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function createOption(text = ''): AnswerOption {
  return { id: generateId(), text, isCorrect: false }
}

function createQuestion(): Question {
  return {
    id: generateId(),
    text: '',
    type: 'single',
    points: 10,
    options: [createOption(), createOption()]
  }
}

const form = reactive({
  title: '',
  description: '',
  visibility: 'public' as TestVisibility,
  timeLimit: null as number | null,
  questions: [] as Question[]
})

function addQuestion() {
  form.questions.push(createQuestion())
}

function removeQuestion(index: number) {
  if (form.questions.length > 1) {
    form.questions.splice(index, 1)
  }
}

function onQuestionTypeChange(qIndex: number) {
  const question = form.questions[qIndex]
  if (!question) return
  if (question.type === 'text') {
    question.options = []
  } else if (question.options.length < 2) {
    question.options = [createOption(), createOption()]
  }
  if (question.type === 'single') {
    question.options.forEach(o => o.isCorrect = false)
  }
}

function addOption(qIndex: number) {
  form.questions[qIndex]?.options.push(createOption())
}

function removeOption(qIndex: number, oIndex: number) {
  const question = form.questions[qIndex]
  if (question && question.options.length > 2) {
    question.options.splice(oIndex, 1)
  }
}

function setCorrectOption(qIndex: number, oIndex: number) {
  const question = form.questions[qIndex]
  if (question) {
    question.options.forEach((opt, i) => {
      opt.isCorrect = i === oIndex
    })
  }
}

async function handleSubmit() {
  if (!test.value) return

  for (const question of form.questions) {
    if (question.type !== 'text') {
      const hasCorrect = question.options.some(o => o.isCorrect)
      if (!hasCorrect) {
        alert('Каждый вопрос должен иметь хотя бы один правильный ответ!')
        return
      }
    }
  }

  isSubmitting.value = true

  try {
    const success = await testsStore.updateTest(test.value.id, {
      title: form.title,
      description: form.description,
      visibility: form.visibility,
      timeLimit: form.timeLimit || null,
      questions: form.questions
    })

    if (success) {
      router.push(`/tests/${test.value.id}`)
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  if (!test.value) return

  if (confirm('Вы уверены, что хотите удалить этот тест? Это действие нельзя отменить.')) {
    const success = await testsStore.deleteTest(test.value.id)
    if (success) {
      router.push('/dashboard')
    }
  }
}

onMounted(async () => {
  const id = route.params.id as string
  test.value = await testsStore.loadTest(id)

  if (test.value) {
    form.title = test.value.title
    form.description = test.value.description
    form.visibility = test.value.visibility
    form.timeLimit = test.value.timeLimit ?? null
    form.questions = JSON.parse(JSON.stringify(test.value.questions))
  }
})
</script>

<style scoped>
.edit-test-page {
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

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header h1 {
  font-size: 2rem;
}

.test-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
}

.form-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin-bottom: 0;
}

.question-count {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background);
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--color-text);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.question-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: var(--color-primary);
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover:not(:disabled) {
  opacity: 1;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-icon.small {
  font-size: 1rem;
}

.options-section {
  margin-top: 1rem;
}

.options-section > label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.option-check {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.option-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--color-text);
}

.option-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.add-question-btn {
  width: 100%;
}

.danger-zone {
  border-color: rgba(239, 68, 68, 0.3);
}

.danger-zone h2 {
  color: #f87171;
}

.danger-zone p {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
    text-align: center;
  }
}
</style>

