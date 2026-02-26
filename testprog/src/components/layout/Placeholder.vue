<template>
  <div class="placeholder">
    <span v-if="icon" class="icon">{{ icon }}</span>
    <h3 class="title">{{ title }}</h3>
    <p v-if="description" class="text">{{ description }}</p>
    
    <div v-if="$slots.default" class="actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  icon: ''
})
</script>

<style scoped>
.placeholder {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
}

.icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.text {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}
</style>
