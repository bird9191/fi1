<!--
  ==========================================
  КОМПОНЕНТ ПОЛЯ ВВОДА (Input.vue)
  ==========================================
  
  Универсальное поле ввода с:
  - Лейблом
  - Иконкой
  - Валидацией
  - Состоянием ошибки
-->

<template>
  <div class="input-group" :class="{ 'has-error': error }">
    <!-- Лейбл -->
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <!-- Контейнер поля -->
    <div class="input-wrapper">
      <!-- Иконка слева -->
      <span v-if="icon" class="input-icon">{{ icon }}</span>
      
      <!-- Поле ввода -->
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :minlength="minlength"
        :maxlength="maxlength"
        class="input-field"
        :class="{ 'has-icon': icon }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
      />
    </div>
    
    <!-- Сообщение об ошибке -->
    <span v-if="error" class="input-error">{{ error }}</span>
    
    <!-- Подсказка -->
    <span v-else-if="hint" class="input-hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Пропсы компонента
 */
interface Props {
  /** Значение (v-model) */
  modelValue?: string | number
  /** Тип поля */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search'
  /** Лейбл */
  label?: string
  /** Плейсхолдер */
  placeholder?: string
  /** Иконка */
  icon?: string
  /** Сообщение об ошибке */
  error?: string
  /** Подсказка */
  hint?: string
  /** Обязательное поле */
  required?: boolean
  /** Отключено */
  disabled?: boolean
  /** Минимальная длина */
  minlength?: number
  /** Максимальная длина */
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  label: '',
  placeholder: '',
  icon: '',
  error: '',
  hint: '',
  required: false,
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
}>()

/** Уникальный ID для связи label-input */
const inputId = computed(() => 
  `input-${Math.random().toString(36).substring(2, 9)}`
)
</script>

<style scoped>
/* ==========================================
   СТИЛИ ПОЛЯ ВВОДА
   ========================================== */

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ==========================================
   ЛЕЙБЛ
   ========================================== */

.input-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

/* ==========================================
   КОНТЕЙНЕР
   ========================================== */

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

/* ==========================================
   ПОЛЕ ВВОДА
   ========================================== */

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field.has-icon {
  padding-left: 2.75rem;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-field::placeholder {
  color: var(--color-text-muted);
}

/* ==========================================
   СОСТОЯНИЕ ОШИБКИ
   ========================================== */

.has-error .input-field {
  border-color: #ef4444;
}

.has-error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-error {
  font-size: 0.85rem;
  color: #ef4444;
}

/* ==========================================
   ПОДСКАЗКА
   ========================================== */

.input-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
</style>




