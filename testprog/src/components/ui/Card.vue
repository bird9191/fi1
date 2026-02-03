<!--
  ==========================================
  КОМПОНЕНТ КАРТОЧКИ (Card.vue)
  ==========================================
  
  Универсальная карточка-контейнер:
  - С заголовком
  - С футером
  - Разные варианты оформления
-->

<template>
  <div class="card" :class="[`card-${variant}`, { 'card-hover': hover }]">
    <!-- Заголовок карточки -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </slot>
    </div>
    
    <!-- Основной контент -->
    <div class="card-body" :class="{ 'no-padding': noPadding }">
      <slot />
    </div>
    
    <!-- Футер карточки -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Пропсы компонента
 */
interface Props {
  /** Заголовок */
  title?: string
  /** Подзаголовок */
  subtitle?: string
  /** Вариант оформления */
  variant?: 'default' | 'bordered' | 'elevated'
  /** Эффект при наведении */
  hover?: boolean
  /** Без внутренних отступов */
  noPadding?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  variant: 'default',
  hover: false,
  noPadding: false
})
</script>

<style scoped>
/* ==========================================
   БАЗОВЫЕ СТИЛИ КАРТОЧКИ
   ========================================== */

.card {
  background: var(--color-surface);
  border-radius: 20px;
  overflow: hidden;
}

/* ==========================================
   ВАРИАНТЫ
   ========================================== */

.card-default {
  border: 1px solid var(--color-border);
}

.card-bordered {
  border: 2px solid var(--color-border);
}

.card-elevated {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* ==========================================
   ЭФФЕКТ НАВЕДЕНИЯ
   ========================================== */

.card-hover {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

/* ==========================================
   ЗАГОЛОВОК
   ========================================== */

.card-header {
  padding: 1.5rem 1.5rem 0;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.card-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* ==========================================
   КОНТЕНТ
   ========================================== */

.card-body {
  padding: 1.5rem;
}

.card-body.no-padding {
  padding: 0;
}

/* ==========================================
   ФУТЕР
   ========================================== */

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}
</style>




