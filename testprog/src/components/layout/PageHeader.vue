<!--
  ==========================================
  ЗАГОЛОВОК СТРАНИЦЫ (PageHeader.vue)
  ==========================================
  
  Переиспользуемый заголовок страницы
-->

<template>
  <header class="page-header">
    <div class="header-content">
      <!-- Кнопка назад -->
      <router-link v-if="backLink" :to="backLink" class="back-link">
        ← {{ backText }}
      </router-link>
      
      <!-- Заголовок -->
      <h1 class="page-title">{{ title }}</h1>
      
      <!-- Подзаголовок -->
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    
    <!-- Действия справа -->
    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * Пропсы компонента
 */
interface Props {
  /** Заголовок */
  title: string
  /** Подзаголовок */
  subtitle?: string
  /** Ссылка назад */
  backLink?: string
  /** Текст кнопки назад */
  backText?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  backLink: '',
  backText: 'Назад'
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--color-text-muted);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
}
</style>




