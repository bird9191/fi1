

<template>
  <div class="create-test-page">

    <header class="page-header">
      <router-link to="/dashboard" class="back-link">
        ← Назад
      </router-link>
      <h1> Создать {{ form.type === 'exam' ? 'экзамен' : 'тест' }}</h1>
    </header>

    <form @submit.prevent="handleSubmit" class="create-form">

      <section class="form-section">
        <h2>1⃣ Выберите тип</h2>
        
        <div class="type-selector">
          
          <label class="type-option">
            <input type="radio" v-model="form.type" value="test" />
            <div class="type-card">
              <span class="type-icon"></span>
              <span class="type-name">Тест</span>
              <span class="type-desc">
                Для обучения и тренировки. Может включать подсказки.
              </span>
            </div>
          </label>

          <label class="type-option">
            <input type="radio" v-model="form.type" value="exam" />
            <div class="type-card">
              <span class="type-icon"></span>
              <span class="type-name">Экзамен</span>
              <span class="type-desc">
                Строгая проверка знаний с ограничениями.
              </span>
            </div>
          </label>
        </div>
      </section>

      <section class="form-section">
        <h2>2⃣ Основная информация</h2>

        <div class="form-group">
          <label for="title">Название *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="Введите название теста..."
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="Опишите, о чём этот тест..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="form.isPublic" />
            <span> Публичный (виден всем пользователям)</span>
          </label>
        </div>
      </section>

      <section v-if="form.type === 'exam'" class="form-section">
        <h2>3⃣ Настройки экзамена</h2>
        
        <div class="settings-grid">
          
          <div class="form-group">
            <label for="timeLimit"> Время (минуты)</label>
            <input
              id="timeLimit"
              v-model.number="form.timeLimit"
              type="number"
              min="1"
              max="180"
              placeholder="0 = без ограничения"
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
              placeholder="60"
            />
          </div>

          <div class="form-group">
            <label for="maxAttempts"> Макс. попыток</label>
            <input
              id="maxAttempts"
              v-model.number="form.maxAttempts"
              type="number"
              min="0"
              max="100"
              placeholder="0 = без ограничения"
            />
          </div>
        </div>

        <div class="settings-checkboxes">
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.strictMode" />
            <span> Строгий режим (отмена при переключении вкладки)</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.shuffleQuestions" />
            <span> Перемешивать вопросы</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.shuffleOptions" />
            <span> Перемешивать варианты ответов</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.showHints" />
            <span> Показывать подсказки</span>
          </label>
        </div>
      </section>

      <section v-else class="form-section">
        <h2>3⃣ Настройки теста</h2>
        
        <div class="settings-checkboxes">
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.allowTrainingMode" />
            <span> Разрешить режим тренировки</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.showHints" />
            <span> Показывать подсказки</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" v-model="form.showExplanations" />
            <span> Показывать объяснения после ответа</span>
          </label>
        </div>
      </section>

      <section class="form-section questions-section">
        <div class="section-header">
          <h2>4⃣ Вопросы</h2>
          <button type="button" @click="addQuestion" class="btn btn-outline btn-sm">
             Добавить вопрос
          </button>
        </div>

        <div v-if="form.questions.length === 0" class="no-questions">
          <p> Пока нет вопросов. Добавьте первый!</p>
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
              <label>Текст вопроса *</label>
              <textarea
                v-model="question.text"
                placeholder="Введите текст вопроса..."
                rows="2"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label>Тип вопроса</label>
              <select v-model="question.type">
                <option value="single">Один правильный ответ</option>
                <option value="multiple">Несколько правильных ответов</option>
                <option value="text">Текстовый ответ</option>
              </select>
            </div>

            <div 
              v-if="question.type === 'single' || question.type === 'multiple'" 
              class="options-editor"
            >
              <label>Варианты ответов</label>
              
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
                  placeholder="Текст варианта..."
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

              <button 
                type="button" 
                @click="addOption(qIndex)" 
                class="btn btn-text"
              >
                 Добавить вариант
              </button>
            </div>

            <div v-else-if="question.type === 'text'" class="form-group">
              <label>Правильный ответ</label>
              <input
                v-model="question.correctAnswer"
                type="text"
                placeholder="Введите правильный ответ..."
              />
            </div>

            <div class="form-group">
              <label> Подсказка (необязательно)</label>
              <input
                v-model="question.hint"
                type="text"
                placeholder="Подсказка для студента..."
              />
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
          {{ isSubmitting ? ' Создание...' : ' Создать ' + (form.type === 'exam' ? 'экзамен' : 'тест') }}
        </button>
      </div>
      
    </form>
    
  </div>
</template>

<script setup lang="ts">

import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { TestType } from '@/types'

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

const isSubmitting = ref(false)

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

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value || isSubmitting.value) return
  
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

    await testsStore.createTest(testData)

    router.push('/dashboard')
    
  } catch (error) {
    console.error('Ошибка создания теста:', error)
    alert('Ошибка при создании теста. Попробуйте ещё раз.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>

.create-test-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 1rem;
  transition: color 0.2s;
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

.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.type-option {
  cursor: pointer;
}

.type-option input {
  display: none;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.2s;
}

.type-option input:checked + .type-card {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.type-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.type-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.type-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-text);
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
  transition: border-color 0.2s;
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

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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

.checkbox-item:hover {
  background: rgba(99, 102, 241, 0.05);
}

.checkbox-item input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.questions-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.questions-section .section-header h2 {
  margin: 0;
  padding: 0;
  border: none;
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
  cursor: pointer;
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
  transition: background 0.2s;
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
  .type-selector {
    grid-template-columns: 1fr;
  }

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
