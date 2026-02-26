import { ref, reactive, computed } from 'vue'

interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const values = reactive<T>({ ...initialValues })
  const errors = reactive<Record<keyof T, string>>({} as Record<keyof T, string>)
  const rules = ref<Record<keyof T, ValidationRule[]>>({} as Record<keyof T, ValidationRule[]>)
  const isSubmitting = ref(false)
  const isDirty = ref(false)

  const hasErrors = computed(() => 
    Object.values(errors).some(error => !!error)
  )

  const isValid = computed(() => !hasErrors.value)

  function setRules(field: keyof T, fieldRules: ValidationRule[]) {
    rules.value[field] = fieldRules
  }

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

  function validate(): boolean {
    let isValid = true

    for (const field of Object.keys(rules.value) as (keyof T)[]) {
      if (!validateField(field)) {
        isValid = false
      }
    }

    return isValid
  }

  function reset() {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach(key => {
      errors[key as keyof T] = ''
    })
    isDirty.value = false
  }

  function setValue(field: keyof T, value: any) {
    values[field] = value
    isDirty.value = true
  }

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
    values,
    errors,
    isSubmitting,
    isDirty,
    hasErrors,
    isValid,
    setRules,
    validateField,
    validate,
    reset,
    setValue,
    handleSubmit
  }
}

export const validationRules = {
  required: (message = 'Это поле обязательно'): ValidationRule => ({
    validate: (value) => !!value && value.toString().trim() !== '',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.toString().length >= min,
    message: message || `Минимум ${min} символов`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.toString().length <= max,
    message: message || `Максимум ${max} символов`
  }),

  email: (message = 'Некорректный email'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message
  }),

  numeric: (message = 'Только цифры'): ValidationRule => ({
    validate: (value) => !value || /^\d+$/.test(value.toString()),
    message
  }),

  matches: (getValue: () => any, message = 'Значения не совпадают'): ValidationRule => ({
    validate: (value) => value === getValue(),
    message
  })
}
