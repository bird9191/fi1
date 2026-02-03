<!--
  ==========================================
  ПУСТОЕ СОСТОЯНИЕ (EmptyState.vue)
  ==========================================
  
  Отображается когда нет данных
-->

<template>
  <div class="empty-state">
    <span v-if="icon" class="empty-icon">{{ icon }}</span>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    
    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Пропсы компонента
 */
interface Props {
  /** Заголовок */
  title: string
  /** Описание */
  description?: string
  /** Иконка */
  icon?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  icon: '📭'
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
}

.empty-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}
</style>




