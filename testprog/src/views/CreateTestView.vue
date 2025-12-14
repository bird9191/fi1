<template>
  <div class="create-test-page">
    <header class="page-header">
      <router-link to="/dashboard" class="back-link">Назад</router-link>
      <h1>Создание {{ isExam ? 'экзамена' : 'теста' }}</h1>
    </header>

    <!-- Выбор типа -->
    <div v-if="!typeSelected" class="type-selection">
      <h2>Что вы хотите создать?</h2>
      
      <div class="type-cards">
        <button class="type-card" @click="selectType('test')">
          <div class="type-icon test-icon">T</div>
          <h3>Тест</h3>
          <p>Простой формат для быстрой проверки знаний</p>
          <ul class="type-features">
            <li>Быстрое создание</li>
            <li>Без ограничения времени</li>
            <li>Простые результаты</li>
            <li>Подходит для самопроверки</li>
          </ul>
        </button>

        <button class="type-card" @click="selectType('exam')">
          <div class="type-icon exam-icon">E</div>
          <h3>Экзамен</h3>
          <p>Полноценный контроль знаний</p>
          <ul class="type-features">
            <li>Настраиваемый таймер</li>
            <li>Защита от списывания</li>
            <li>Режим тренировки</li>
            <li>Подробная аналитика</li>
            <li>Проходной балл</li>
          </ul>
        </button>
      </div>
    </div>

    <!-- Форма создания -->
    <form v-else @submit.prevent="handleSubmit" class="test-form">
      <!-- Основная информация -->
      <section class="form-section">
        <h2>Основная информация</h2>

        <div class="form-group">
          <label for="title">Название {{ isExam ? 'экзамена' : 'теста' }} *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            :placeholder="isExam ? 'Например: Итоговый экзамен по физике' : 'Например: Проверка знаний по теме'"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            :placeholder="isExam ? 'Инструкции для студентов, правила экзамена...' : 'Краткое описание теста...'"
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

          <!-- Таймер только для экзаменов -->
          <div v-if="isExam" class="form-group">
            <label for="timeLimit">Лимит времени (минуты)</label>
            <input
              id="timeLimit"
              v-model.number="form.timeLimit"
              type="number"
              min="0"
              placeholder="0 = без ограничений"
            />
          </div>
        </div>
      </section>

      <!-- Настройки экзамена -->
      <section v-if="isExam" class="form-section exam-settings">
        <h2>Настройки экзамена</h2>

        <div class="settings-grid">
          <label class="setting-item">
            <input type="checkbox" v-model="form.strictMode" />
            <div class="setting-info">
              <span class="setting-title">Строгий режим</span>
              <span class="setting-desc">Отмена экзамена при переключении вкладки</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" v-model="form.allowTrainingMode" />
            <div class="setting-info">
              <span class="setting-title">Режим тренировки</span>
              <span class="setting-desc">Разрешить проходить без строгих условий</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" v-model="form.shuffleQuestions" />
            <div class="setting-info">
              <span class="setting-title">Перемешать вопросы</span>
              <span class="setting-desc">Случайный порядок для каждого студента</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" v-model="form.shuffleOptions" />
            <div class="setting-info">
              <span class="setting-title">Перемешать ответы</span>
              <span class="setting-desc">Случайный порядок вариантов ответов</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" v-model="form.showHints" />
            <div class="setting-info">
              <span class="setting-title">Подсказки</span>
              <span class="setting-desc">Показывать подсказки в режиме тренировки</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" v-model="form.showExplanations" />
            <div class="setting-info">
              <span class="setting-title">Объяснения</span>
              <span class="setting-desc">Показывать объяснения после ответа</span>
            </div>
          </label>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="passingScore">Проходной балл (%)</label>
            <input
              id="passingScore"
              v-model.number="form.passingScore"
              type="number"
              min="0"
              max="100"
              placeholder="60"
            />
          </div>

          <div class="form-group">
            <label for="maxAttempts">Макс. попыток</label>
            <input
              id="maxAttempts"
              v-model.number="form.maxAttempts"
              type="number"
              min="0"
              placeholder="0 = без ограничений"
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
            :key="qIndex"
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
                placeholder="Введите вопрос..."
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

            <!-- Варианты ответов -->
            <div v-if="question.type !== 'text'" class="options-section">
              <label>Варианты ответов</label>

              <div
                v-for="(option, oIndex) in question.options"
                :key="oIndex"
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
                  placeholder="Вариант ответа..."
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

            <div v-else class="text-answer-note">
              <p>Текстовый ответ будет проверяться вручную</p>
            </div>

            <!-- Дополнительные поля для экзаменов -->
            <div v-if="isExam" class="question-extras">
              <div class="form-group">
                <label>Подсказка (опционально)</label>
                <input
                  v-model="question.hint"
                  type="text"
                  placeholder="Подсказка для режима тренировки..."
                />
              </div>
              <div class="form-group">
                <label>Объяснение (опционально)</label>
                <input
                  v-model="question.explanation"
                  type="text"
                  placeholder="Объяснение правильного ответа..."
                />
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline add-question-btn" @click="addQuestion">
          + Добавить вопрос
        </button>
      </section>

      <!-- Действия -->
      <div class="form-actions">
        <button type="button" class="btn btn-outline" @click="typeSelected = false">
          Изменить тип
        </button>
        <router-link to="/dashboard" class="btn btn-outline">
          Отмена
        </router-link>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Сохранение...' : `Создать ${isExam ? 'экзамен' : 'тест'}` }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import type { QuestionType, TestVisibility, Question, AnswerOption, TestType } from '@/types'

const router = useRouter()
const testsStore = useTestsStore()

const typeSelected = ref(false)
const selectedType = ref<TestType>('test')
const isSubmitting = ref(false)

const isExam = computed(() => selectedType.value === 'exam')

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
    options: [createOption(), createOption()],
    hint: '',
    explanation: ''
  }
}

const form = reactive({
  title: '',
  description: '',
  visibility: 'public' as TestVisibility,
  timeLimit: null as number | null,
  questions: [createQuestion()] as Question[],
  // Настройки экзамена
  strictMode: true,
  allowTrainingMode: true,
  shuffleQuestions: false,
  shuffleOptions: false,
  showHints: true,
  showExplanations: true,
  passingScore: 60,
  maxAttempts: null as number | null
})

function selectType(type: TestType) {
  selectedType.value = type
  typeSelected.value = true
  
  // Сбросить настройки для теста
  if (type === 'test') {
    form.timeLimit = null
    form.strictMode = false
    form.allowTrainingMode = false
  }
}

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
  // Validation
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
    const testData = {
      type: selectedType.value,
      title: form.title,
      description: form.description,
      visibility: form.visibility,
      questions: form.questions,
      // Для экзаменов добавляем все настройки
      ...(isExam.value && {
        timeLimit: form.timeLimit || null,
        strictMode: form.strictMode,
        allowTrainingMode: form.allowTrainingMode,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        showHints: form.showHints,
        showExplanations: form.showExplanations,
        passingScore: form.passingScore || 60,
        maxAttempts: form.maxAttempts || null
      })
    }

    const test = await testsStore.createTest(testData)

    if (test) {
      router.push(`/tests/${test.id}`)
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.create-test-page {
  padding: 2rem;
  max-width: 900px;
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
  font-size: 0.9rem;
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header h1 {
  font-size: 2rem;
}

/* Type Selection */
.type-selection {
  text-align: center;
}

.type-selection h2 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: var(--color-text);
}

.type-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.type-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
}

.type-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.type-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.test-icon {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
  color: #4ade80;
}

.exam-icon {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  color: #a78bfa;
}

.type-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.type-card > p {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.type-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.type-features li {
  padding: 0.4rem 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.type-features li:last-child {
  border-bottom: none;
}

/* Form */
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

/* Exam settings */
.exam-settings {
  border-color: rgba(139, 92, 246, 0.3);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.setting-item:hover {
  background: var(--accent-glow);
}

.setting-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-top: 0.1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.setting-title {
  font-weight: 500;
  color: var(--color-text);
}

.setting-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Form elements */
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

/* Questions */
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

.text-answer-note {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.question-extras {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.question-extras .form-group {
  margin-bottom: 0.75rem;
}

.question-extras .form-group:last-child {
  margin-bottom: 0;
}

.question-extras input {
  font-size: 0.9rem;
  padding: 0.6rem 0.875rem;
}

.add-question-btn {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .type-cards {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
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
