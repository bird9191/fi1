<template>
  <aside class="sidebar">
    <div v-if="$slots.header" class="sidebar-header">
      <slot name="header" />
    </div>
    
    <nav class="sidebar-nav">
      <button
        v-for="item in items"
        :key="item.id"
        class="nav-item"
        :class="{ active: modelValue === item.id }"
        @click="$emit('update:modelValue', item.id)"
      >
        <span v-if="item.icon" class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </button>
    </nav>
    
    <div v-if="$slots.footer" class="sidebar-footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<script setup lang="ts">
export interface SidebarItem {
  id: string
  label: string
  icon?: string
  badge?: string | number
}

interface Props {
  modelValue: string
  items: SidebarItem[]
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.sidebar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 5rem;
}

.sidebar-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
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

.nav-item:hover {
  background: var(--color-background);
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary);
}

.nav-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 10px;
}

.sidebar-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .sidebar {
    position: static;
  }
  
  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.5rem;
  }
  
  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
</style>

