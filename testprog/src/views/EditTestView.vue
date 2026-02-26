

<template>
  <div class="edit-test-page">

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка теста...</p>
    </div>

    <div v-else-if="!test" class="not-found">
      <h2> Тест не найден</h2>
      <router-link to="/dashboard" class="btn btn-primary">
        ← Вернуться назад
      </router-link>
    </div>

    <template v-else>

      <header class="page-header">
        <router-link to="/dashboard" class="back-link">
          ← Назад
        </router-link>
        <h1> Редактировать {{ form.type === 'exam' ? 'экзамен' : 'тест' }}</h1>
      </header>

      <form @submit.prevent="handleSubmit" class="edit-form">

        <section class="form-section">
          <h2> Основная информация</h2>

          <div class="type-display">
            <span class="type-badge" :class="form.type">
              {{ form.type === 'exam' ? ' Экзамен' : ' Тест' }}
            </span>
          </div>

          <div class="form-group">
            <label for="title">Название *</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="Введите название..."
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Описание</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Опишите тест..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.isPublic" />
              <span> Публичный</span>
            </label>
          </div>
        </section>

        <section v-if="form.type === 'exam'" class="form-section">
          <h2> Настройки экзамена</h2>
          
          <div class="settings-grid">
            <div class="form-group">
              <label for="timeLimit"> Время (мин)</label>
              <input
                id="timeLimit"
                v-model.number="form.timeLimit"
                type="number"
                min="1"
                max="180"
              />
            </div>

            <div class="form-group">
              <label for="passingScore"> Проходной балл (%)</label>
              <input
                id="passingScore"
                v-model.number="form.passingScore"
                type="number"
                min="1"
                max="100"
              />
            </div>

            <div class="form-group">
              <label for="maxAttempts"> Макс. попыток</label>
              <input
                id="maxAttempts"
                v-model.number="form.maxAttempts"
                type="number"
                min="0"
              />
            </div>
          </div>

          <div class="settings-checkboxes">
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.strictMode" />
              <span> Строгий режим</span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.shuffleQuestions" />
              <span> Перемешивать вопросы</span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.shuffleOptions" />
              <span> Перемешивать ответы</span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.showHints" />
              <span> Показывать подсказки</span>
            </label>
          </div>
        </section>

        <section v-else class="form-section">
          <h2> Настройки теста</h2>
          
          <div class="settings-checkboxes">
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.allowTrainingMode" />
              <span> Режим тренировки</span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.showHints" />
              <span> Подсказки</span>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.showExplanations" />
              <span> Объяснения</span>
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="section-header">
            <h2> Вопросы ({{ form.questions.length }})</h2>
            <button type="button" @click="addQuestion" class="btn btn-outline btn-sm">
               Добавить
            </button>
          </div>

          <div v-if="form.questions.length === 0" class="no-questions">
            <p> Нет вопросов</p>
          </div>

          <div v-else class="questions-list">
            <div 
              v-for="(question, qIndex) in form.questions" 
              :key="qIndex" 
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">Вопрос {{ qIndex + 1 }}</span>
                <button 
                  type="button" 
                  @click="removeQuestion(qIndex)" 
                  class="btn-icon danger"
                >
                  
                </button>
              </div>

              <div class="form-group">
                <label>Текст *</label>
                <textarea
                  v-model="question.text"
                  rows="2"
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label>Тип</label>
                <select v-model="question.type">
                  <option value="single">Один ответ</option>
                  <option value="multiple">Несколько ответов</option>
                  <option value="text">Текстовый ответ</option>
                </select>
              </div>

              <div 
                v-if="question.type === 'single' || question.type === 'multiple'" 
                class="options-editor"
              >
                <label>Варианты</label>
                
                <div 
                  v-for="(option, oIndex) in question.options" 
                  :key="oIndex" 
                  class="option-row"
                >
                  <input
                    :type="question.type === 'single' ? 'radio' : 'checkbox'"
                    :checked="option.isCorrect"
                    @change="toggleCorrect(qIndex, oIndex)"
                    :name="`q${qIndex}-correct`"
                  />
                  <input
                    v-model="option.text"
                    type="text"
                    class="option-input"
                  />
                  <button 
                    type="button" 
                    @click="removeOption(qIndex, oIndex)"
                    class="btn-icon small"
                    :disabled="question.options.length <= 2"
                  >
                    
                  </button>
                </div>

                <button type="button" @click="addOption(qIndex)" class="btn btn-text">
                   Добавить вариант
                </button>
              </div>

              <div v-else class="form-group">
                <label>Правильный ответ</label>
                <input v-model="question.correctAnswer" type="text" />
              </div>

              <div class="form-group">
                <label> Подсказка</label>
                <input v-model="question.hint" type="text" />
              </div>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <router-link to="/dashboard" class="btn btn-outline">
            Отмена
          </router-link>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="!canSubmit || isSubmitting"
          >
            {{ isSubmitting ? ' Сохранение...' : ' Сохранить' }}
          </button>
        </div>
        
      </form>
    </template>
    
  </div>
</template>

<script setup lang="ts">

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { Test, TestType } from '@/types'

const route = useRoute()
const router = useRouter()
const testsStore = useTestsStore()

interface FormOption {
  text: string
  isCorrect: boolean
}

interface FormQuestion {
  text: string
  type: 'single' | 'multiple' | 'text'
  options: FormOption[]
  correctAnswer: string
  hint: string
}

const isLoading = ref(true)

const isSubmitting = ref(false)

const test = ref<Test | null>(null)

const form = reactive({
  type: 'test' as TestType,
  title: '',
  description: '',
  isPublic: true,
  timeLimit: null as number | null,
  passingScore: 60,
  maxAttempts: 0,
  strictMode: false,
  shuffleQuestions: false,
  shuffleOptions: false,
  allowTrainingMode: true,
  showHints: false,
  showExplanations: false,
  questions: [] as FormQuestion[]
})

const canSubmit = computed(() => {
  if (!form.title.trim()) return false
  if (form.questions.length === 0) return false
  
  for (const q of form.questions) {
    if (!q.text.trim()) return false
    
    if (q.type === 'single' || q.type === 'multiple') {
      const hasCorrect = q.options.some(opt => opt.isCorrect)
      if (!hasCorrect) return false
      
      const allFilled = q.options.every(opt => opt.text.trim())
      if (!allFilled) return false
    } else if (q.type === 'text') {
      if (!q.correctAnswer.trim()) return false
    }
  }
  
  return true
})

function addQuestion(): void {
  form.questions.push({
    text: '',
    type: 'single',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: '',
    hint: ''
  })
}

function removeQuestion(index: number): void {
  form.questions.splice(index, 1)
}

function addOption(questionIndex: number): void {
  form.questions[questionIndex].options.push({
    text: '',
    isCorrect: false
  })
}

function removeOption(questionIndex: number, optionIndex: number): void {
  form.questions[questionIndex].options.splice(optionIndex, 1)
}

function toggleCorrect(questionIndex: number, optionIndex: number): void {
  const question = form.questions[questionIndex]
  
  if (question.type === 'single') {
    question.options.forEach((opt, idx) => {
      opt.isCorrect = idx === optionIndex
    })
  } else {
    question.options[optionIndex].isCorrect = !question.options[optionIndex].isCorrect
  }
}

async function loadTest(): Promise<void> {
  isLoading.value = true
  
  try {
    const testId = route.params.id as string
    test.value = await testsStore.getTestById(testId)
    
    if (test.value) {
      
      form.type = test.value.type || 'test'
      form.title = test.value.title
      form.description = test.value.description || ''
      form.isPublic = test.value.isPublic
      form.timeLimit = test.value.timeLimit ?? null
      form.passingScore = test.value.passingScore || 60
      form.maxAttempts = test.value.maxAttempts || 0
      form.strictMode = test.value.strictMode || false
      form.shuffleQuestions = test.value.shuffleQuestions || false
      form.shuffleOptions = test.value.shuffleOptions || false
      form.allowTrainingMode = test.value.allowTrainingMode ?? true
      form.showHints = test.value.showHints || false
      form.showExplanations = test.value.showExplanations || false

      form.questions = test.value.questions.map(q => ({
        text: q.text,
        type: q.type as 'single' | 'multiple' | 'text',
        options: q.options?.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        })) || [],
        correctAnswer: q.correctAnswer || '',
        hint: q.hint || ''
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки теста:', error)
    test.value = null
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value || isSubmitting.value || !test.value) return
  
  isSubmitting.value = true
  
  try {
    const testData = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      isPublic: form.isPublic,
      timeLimit: form.timeLimit ?? null,
      passingScore: form.passingScore,
      maxAttempts: form.maxAttempts,
      strictMode: form.strictMode,
      shuffleQuestions: form.shuffleQuestions,
      shuffleOptions: form.shuffleOptions,
      allowTrainingMode: form.allowTrainingMode,
      showHints: form.showHints,
      showExplanations: form.showExplanations,
      questions: form.questions.map(q => ({
        text: q.text.trim(),
        type: q.type,
        options: q.type !== 'text' 
          ? q.options.map(opt => ({
              text: opt.text.trim(),
              isCorrect: opt.isCorrect
            }))
          : [],
        correctAnswer: q.type === 'text' ? q.correctAnswer.trim() : '',
        hint: q.hint.trim() || null
      }))
    }
    
    await testsStore.updateTest(test.value.id, testData)
    router.push('/dashboard')
    
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('Ошибка при сохранении теста')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadTest()
})
</script>

<style scoped>

.edit-test-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.loading,
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 50vh;
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
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header h1 {
  font-size: 1.8rem;
}

.form-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-section h2 {
  font-size: 1.1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section-header h2 {
  margin: 0;
  padding: 0;
  border: none;
}

.type-display {
  margin-bottom: 1.25rem;
}

.type-badge {
  display: inline-block;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--color-text);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-group input {
  width: 18px;
  height: 18px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.settings-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border-radius: 10px;
  cursor: pointer;
}

.checkbox-item input {
  width: 18px;
  height: 18px;
}

.no-questions {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-item {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
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

.options-editor {
  margin-bottom: 1rem;
}

.options-editor > label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.option-row input[type="radio"],
.option-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.option-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
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

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--color-border);
}

.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-icon.small {
  width: 28px;
  height: 28px;
  font-size: 0.9rem;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-text {
  background: transparent;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
}

@media (max-width: 600px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
