<template>
  <div class="input-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="input-wrapper">
      <span v-if="icon" class="input-icon">{{ icon }}</span>
      
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
    
    <span v-if="error" class="input-error">{{ error }}</span>
    
    <span v-else-if="hint" class="input-hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search'
  label?: string
  placeholder?: string
  icon?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  minlength?: number
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

const inputId = computed(() => 
  `input-${Math.random().toString(36).substring(2, 9)}`
)
</script>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

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

.input-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
</style>

