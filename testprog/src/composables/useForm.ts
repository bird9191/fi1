/**
 * ==========================================
 * ХУК ФОРМЫ (useForm.ts)
 * ==========================================
 * 
 * Composable для работы с формами
 */

import { ref, reactive, computed } from 'vue'

/**
 * Правило валидации
 */
interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

/**
 * Хук для работы с формами
 * 
 * @param initialValues - Начальные значения формы
 */
export function useForm<T extends Record<string, any>>(initialValues: T) {
  // ==========================================
  // СОСТОЯНИЕ
  // ==========================================

  /** Значения формы */
  const values = reactive<T>({ ...initialValues })

  /** Ошибки валидации */
  const errors = reactive<Record<keyof T, string>>({} as Record<keyof T, string>)

  /** Правила валидации */
  const rules = ref<Record<keyof T, ValidationRule[]>>({} as Record<keyof T, ValidationRule[]>)

  /** Флаг отправки */
  const isSubmitting = ref(false)

  /** Флаг изменения формы */
  const isDirty = ref(false)

  // ==========================================
  // ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ==========================================

  /** Есть ли ошибки */
  const hasErrors = computed(() => 
    Object.values(errors).some(error => !!error)
  )

  /** Валидна ли форма */
  const isValid = computed(() => !hasErrors.value)

  // ==========================================
  // МЕТОДЫ
  // ==========================================

  /**
   * Устанавливает правила валидации для поля
   */
  function setRules(field: keyof T, fieldRules: ValidationRule[]) {
    rules.value[field] = fieldRules
  }

  /**
   * Валидирует одно поле
   */
  function validateField(field: keyof T): boolean {
    const fieldRules = rules.value[field]
    if (!fieldRules) return true

    for (const rule of fieldRules) {
      if (!rule.validate(values[field])) {
        errors[field] = rule.message
        return false
      }
    }

    errors[field] = ''
    return true
  }

  /**
   * Валидирует все поля
   */
  function validate(): boolean {
    let isValid = true

    for (const field of Object.keys(rules.value) as (keyof T)[]) {
      if (!validateField(field)) {
        isValid = false
      }
    }

    return isValid
  }

  /**
   * Сбрасывает форму к начальным значениям
   */
  function reset() {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach(key => {
      errors[key as keyof T] = ''
    })
    isDirty.value = false
  }

  /**
   * Устанавливает значение поля
   */
  function setValue(field: keyof T, value: any) {
    values[field] = value
    isDirty.value = true
  }

  /**
   * Обработчик отправки формы
   */
  async function handleSubmit(onSubmit: (values: T) => Promise<void>) {
    if (!validate()) return

    isSubmitting.value = true

    try {
      await onSubmit(values as T)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // Состояние
    values,
    errors,
    isSubmitting,
    isDirty,
    hasErrors,
    isValid,

    // Методы
    setRules,
    validateField,
    validate,
    reset,
    setValue,
    handleSubmit
  }
}

// ==========================================
// ГОТОВЫЕ ПРАВИЛА ВАЛИДАЦИИ
// ==========================================

export const validationRules = {
  /** Обязательное поле */
  required: (message = 'Это поле обязательно'): ValidationRule => ({
    validate: (value) => !!value && value.toString().trim() !== '',
    message
  }),

  /** Минимальная длина */
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.toString().length >= min,
    message: message || `Минимум ${min} символов`
  }),

  /** Максимальная длина */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.toString().length <= max,
    message: message || `Максимум ${max} символов`
  }),

  /** Email формат */
  email: (message = 'Некорректный email'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message
  }),

  /** Только цифры */
  numeric: (message = 'Только цифры'): ValidationRule => ({
    validate: (value) => !value || /^\d+$/.test(value.toString()),
    message
  }),

  /** Совпадение с другим полем */
  matches: (getValue: () => any, message = 'Значения не совпадают'): ValidationRule => ({
    validate: (value) => value === getValue(),
    message
  })
}




