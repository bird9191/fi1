<!--
  ==========================================
  КОМПОНЕНТ БЕЙДЖА (Badge.vue)
  ==========================================
  
  Метка/тег для отображения статуса:
  - Разные цвета
  - Размеры
-->

<template>
  <span 
    class="badge" 
    :class="[`badge-${variant}`, `badge-${size}`]"
  >
    <span v-if="icon" class="badge-icon">{{ icon }}</span>
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * Пропсы компонента
 */
interface Props {
  /** Вариант цвета */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  /** Размер */
  size?: 'sm' | 'md'
  /** Иконка */
  icon?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
  icon: ''
})
</script>

<style scoped>
/* ==========================================
   БАЗОВЫЕ СТИЛИ
   ========================================== */

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
  border-radius: 8px;
}

/* ==========================================
   РАЗМЕРЫ
   ========================================== */

.badge-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.badge-md {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

/* ==========================================
   ВАРИАНТЫ ЦВЕТОВ
   ========================================== */

.badge-primary {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary);
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.badge-warning {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.badge-info {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.badge-neutral {
  background: var(--color-background);
  color: var(--color-text-muted);
}
</style>




