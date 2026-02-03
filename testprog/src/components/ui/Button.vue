<!--
  ==========================================
  КОМПОНЕНТ КНОПКИ (Button.vue)
  ==========================================
  
  Универсальная кнопка с вариантами:
  - primary, outline, danger, text
  - размеры: sm, md, lg
  - состояния: loading, disabled
-->

<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-loading': loading, 'btn-block': block }
    ]"
    :disabled="disabled || loading"
    :type="type"
  >
    <!-- Индикатор загрузки -->
    <span v-if="loading" class="btn-spinner"></span>
    
    <!-- Иконка слева -->
    <span v-if="icon && !loading" class="btn-icon">{{ icon }}</span>
    
    <!-- Текст кнопки -->
    <span class="btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
/**
 * Пропсы компонента
 */
interface Props {
  /** Вариант оформления */
  variant?: 'primary' | 'outline' | 'danger' | 'text' | 'success'
  /** Размер кнопки */
  size?: 'sm' | 'md' | 'lg'
  /** Тип HTML кнопки */
  type?: 'button' | 'submit' | 'reset'
  /** Отключена */
  disabled?: boolean
  /** Загрузка */
  loading?: boolean
  /** На всю ширину */
  block?: boolean
  /** Иконка слева */
  icon?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
  icon: ''
})
</script>

<style scoped>
/* ==========================================
   БАЗОВЫЕ СТИЛИ КНОПКИ
   ========================================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==========================================
   РАЗМЕРЫ
   ========================================== */

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* ==========================================
   ВАРИАНТЫ
   ========================================== */

/* Primary */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

/* Outline */
.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Danger */
.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Success */
.btn-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
}

/* Text */
.btn-text {
  background: transparent;
  color: var(--color-primary);
  padding: 0.5rem;
}

.btn-text:hover:not(:disabled) {
  text-decoration: underline;
}

/* ==========================================
   МОДИФИКАТОРЫ
   ========================================== */

.btn-block {
  width: 100%;
}

.btn-loading {
  position: relative;
  color: transparent;
}

/* ==========================================
   СПИННЕР
   ========================================== */

.btn-spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-loading .btn-spinner {
  color: white;
}
</style>




