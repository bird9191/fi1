<!--
  ==========================================
  КАТАЛОГ ТЕСТОВ (TestsListView.vue)
  ==========================================
  
  Страница со списком всех публичных тестов.
  Включает:
  - Поиск по названию
  - Карточки тестов с информацией
  - Кнопки перехода к прохождению
-->

<template>
  <div class="tests-page">
    
    <!-- ==========================================
         ЗАГОЛОВОК СТРАНИЦЫ
         ========================================== -->
    <header class="page-header">
      <div class="header-content">
        <h1>📚 Каталог тестов</h1>
        <p>Найдите интересующий вас тест и проверьте свои знания</p>
      </div>
      
      <!-- Кнопка создания теста (только для учителей) -->
      <router-link 
        v-if="authStore.isTeacher" 
        to="/tests/create" 
        class="btn btn-primary"
      >
        ➕ Создать тест
      </router-link>
    </header>

    <!-- ==========================================
         ФИЛЬТРЫ И ПОИСК
         ========================================== -->
    <div class="filters">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="🔍 Поиск по названию..."
        class="search-input"
      />
    </div>

    <!-- ==========================================
         СОСТОЯНИЯ: ЗАГРУЗКА / ПУСТО / СПИСОК
         ========================================== -->
    
    <!-- Загрузка -->
    <div v-if="testsStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка тестов...</p>
    </div>

    <!-- Ничего не найдено -->
    <div v-else-if="filteredTests.length === 0" class="empty-state">
      <h3>😕 Тесты не найдены</h3>
      <p v-if="searchQuery">Попробуйте изменить поисковый запрос</p>
      <p v-else>Пока нет доступных публичных тестов</p>
    </div>

    <!-- Список тестов -->
    <div v-else class="tests-grid">
      <div v-for="test in filteredTests" :key="test.id" class="test-card">
        
        <!-- Бейджи (тип и время) -->
        <div class="test-card-header">
          <span class="type-badge" :class="test.type || 'test'">
            {{ test.type === 'exam' ? '📋 Экзамен' : '✏️ Тест' }}
          </span>
          <span v-if="test.timeLimit" class="time-badge">
            ⏱ {{ test.timeLimit }} мин
          </span>
        </div>

        <!-- Название и описание -->
        <h3>{{ test.title }}</h3>
        <p class="test-description">{{ test.description }}</p>

        <!-- Мета-информация (автор, кол-во вопросов) -->
        <div class="test-meta">
          <div class="author">
            <span class="author-avatar">{{ test.authorName.charAt(0) }}</span>
            <span>{{ test.authorName }}</span>
          </div>
          <span class="questions-count">{{ test.questions.length }} вопросов</span>
        </div>

        <!-- Действия -->
        <div class="test-actions">
          <router-link :to="`/tests/${test.id}`" class="btn btn-outline">
            📄 Подробнее
          </router-link>
          
          <!-- Для авторизованных - кнопка прохождения -->
          <router-link
            v-if="authStore.isAuthenticated"
            :to="`/tests/${test.id}/take`"
            class="btn btn-primary"
          >
            {{ test.type === 'exam' ? '▶️ Начать' : '▶️ Пройти' }}
          </router-link>
          
          <!-- Для гостей - кнопка входа -->
          <router-link
            v-else
            to="/login"
            class="btn btn-primary"
          >
            🔐 Войти
          </router-link>
        </div>
        
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================================
 * ЛОГИКА КАТАЛОГА ТЕСТОВ
 * ==========================================
 */

import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTestsStore } from '@/stores/tests'

// ==========================================
// ХРАНИЛИЩА
// ==========================================

const authStore = useAuthStore()
const testsStore = useTestsStore()

// ==========================================
// СОСТОЯНИЕ
// ==========================================

/** Поисковый запрос */
const searchQuery = ref('')

// ==========================================
// ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ==========================================

/** Отфильтрованные тесты (по поисковому запросу) */
const filteredTests = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  
  // Если поиск пустой - возвращаем все публичные тесты
  if (!query) {
    return testsStore.publicTests
  }
  
  // Фильтруем по названию и описанию
  return testsStore.publicTests.filter(test =>
    test.title.toLowerCase().includes(query) ||
    test.description.toLowerCase().includes(query)
  )
})

// ==========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ==========================================

onMounted(() => {
  // Загружаем список тестов при открытии страницы
  testsStore.loadTests()
})
</script>

<style scoped>
/* ==========================================
   СТИЛИ КАТАЛОГА ТЕСТОВ
   ========================================== */

.tests-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ==========================================
   ЗАГОЛОВОК
   ========================================== */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.header-content p {
  color: var(--color-text-muted);
}

/* ==========================================
   ФИЛЬТРЫ
   ========================================== */

.filters {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 0.875rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
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
  padding: 4rem;
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

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-muted);
}

/* ==========================================
   СЕТКА ТЕСТОВ
   ========================================== */

.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

/* ==========================================
   КАРТОЧКА ТЕСТА
   ========================================== */

.test-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.test-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

/* Заголовок карточки */
.test-card-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

/* Бейдж типа */
.type-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
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

/* Бейдж времени */
.time-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text-muted);
}

/* Название теста */
.test-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

/* Описание */
.test-description {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ==========================================
   МЕТА-ИНФОРМАЦИЯ
   ========================================== */

.test-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* Автор */
.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

/* ==========================================
   ДЕЙСТВИЯ
   ========================================== */

.test-actions {
  display: flex;
  gap: 0.75rem;
}

.test-actions .btn {
  flex: 1;
  text-align: center;
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .tests-grid {
    grid-template-columns: 1fr;
  }
}
</style>
