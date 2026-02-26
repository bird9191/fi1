<template>
  <header class="header">
    <div class="content">
      <router-link v-if="backLink" :to="backLink" class="back">
        ← {{ backText }}
      </router-link>
      
      <h1 class="title">{{ title }}</h1>
      
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>
    
    <div v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  backLink?: string
  backText?: string
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  backLink: '',
  backText: 'Назад'
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.content {
  flex: 1;
}

.back {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.back:hover {
  color: var(--color-primary);
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
  }
  
  .title {
    font-size: 1.5rem;
  }
}
</style>

