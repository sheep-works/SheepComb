<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  title?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  disabled: false
})

const isOpen = defineModel<boolean>('open', { default: true })

const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="card collapsible-card" :class="{ 'is-closed': !isOpen, 'is-disabled': disabled }">
    <div 
      class="card-collapse-header" 
      @click="toggle" 
      role="button" 
      :tabindex="disabled ? -1 : 0" 
      @keydown.enter.prevent="toggle" 
      @keydown.space.prevent="toggle"
    >
      <div class="header-left">
        <slot name="header">
          <h2 class="card-title">{{ title }}</h2>
        </slot>
      </div>
      <div class="header-right">
        <slot name="actions" />
        <button class="btn-toggle" :aria-expanded="isOpen" aria-label="Toggle section" tabindex="-1">
          <ChevronDown :size="16" class="chevron-icon" :class="{ 'is-rotated': isOpen }" />
        </button>
      </div>
    </div>

    <Transition name="collapse">
      <div v-show="isOpen" class="card-collapse-body">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapsible-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: var(--transition);
  overflow: hidden;
}

.card-collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: var(--transition);
}

.card-collapse-header:hover {
  background: rgba(255, 255, 255, 0.02);
}

.card-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-toggle {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  transition: var(--transition);
}

.btn-toggle:hover {
  color: var(--text-primary);
}

.chevron-icon {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform: rotate(-90deg);
}

.chevron-icon.is-rotated {
  transform: rotate(0deg);
}

.card-collapse-body {
  padding: 0 16px 16px;
}

/* Transitions */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 1000px;
}
</style>
