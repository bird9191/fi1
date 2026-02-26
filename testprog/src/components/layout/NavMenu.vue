<template>
  <aside class="menu">
    <div v-if="$slots.header" class="menu-header">
      <slot name="header" />
    </div>
    
    <nav class="nav">
      <button
        v-for="item in items"
        :key="item.id"
        class="item"
        :class="{ active: modelValue === item.id }"
        @click="$emit('update:modelValue', item.id)"
      >
        <span v-if="item.icon" class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.label }}</span>
        <span v-if="item.badge" class="badge">{{ item.badge }}</span>
      </button>
    </nav>
    
    <div v-if="$slots.footer" class="menu-footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<script setup lang="ts">
export interface NavMenuItem {
  id: string
  label: string
  icon?: string
  badge?: string | number
}

interface Props {
  modelValue: string
  items: NavMenuItem[]
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.menu {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 5rem;
}

.menu-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.item:hover {
  background: var(--color-background);
}

.item.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary);
}

.icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.label {
  flex: 1;
}

.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 10px;
}

.menu-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .menu {
    position: static;
  }
  
  .nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.5rem;
  }
  
  .item {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
</style>

