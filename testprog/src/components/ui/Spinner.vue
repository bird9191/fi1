<template>
  <div class="spinner-container" :class="{ 'spinner-fullscreen': fullscreen }">
    <div class="spinner" :class="`spinner-${size}`"></div>
    <p v-if="text" class="spinner-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  text: '',
  fullscreen: false
})
</script>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.spinner-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.spinner {
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 24px;
  height: 24px;
}

.spinner-md {
  width: 40px;
  height: 40px;
}

.spinner-lg {
  width: 56px;
  height: 56px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-text {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.spinner-fullscreen .spinner-text {
  color: white;
}
</style>

