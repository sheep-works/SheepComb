<script setup lang="ts">
import { type Component } from 'vue'
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: Component
  iconRight?: Component
  type?: 'button' | 'submit' | 'reset'
  to?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})
</script>

<template>
  <NuxtLink 
    v-if="to && !disabled" 
    :to="to" 
    class="app-btn" 
    :class="[`btn-${variant}`, `btn-${size}`, { 'is-loading': loading }]"
  >
    <Loader2 v-if="loading" :size="16" class="btn-spinner" />
    <component :is="icon" v-else-if="icon" :size="size === 'sm' ? 14 : size === 'lg' ? 18 : 16" class="btn-icon" />
    <span class="btn-content"><slot /></span>
    <component :is="iconRight" v-if="iconRight && !loading" :size="size === 'sm' ? 14 : size === 'lg' ? 18 : 16" class="btn-icon" />
  </NuxtLink>

  <button 
    v-else 
    :type="type" 
    :disabled="disabled || loading" 
    class="app-btn" 
    :class="[`btn-${variant}`, `btn-${size}`, { 'is-loading': loading }]"
  >
    <Loader2 v-if="loading" :size="16" class="btn-spinner" />
    <component :is="icon" v-else-if="icon" :size="size === 'sm' ? 14 : size === 'lg' ? 18 : 16" class="btn-icon" />
    <span class="btn-content"><slot /></span>
    <component :is="iconRight" v-if="iconRight && !loading" :size="size === 'sm' ? 14 : size === 'lg' ? 18 : 16" class="btn-icon" />
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  user-select: none;
  white-space: nowrap;
  border: 1px solid transparent;
}

.app-btn:disabled,
.app-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Sizes */
.btn-sm {
  font-size: 0.78rem;
  padding: 6px 12px;
  border-radius: var(--radius-xs);
}
.btn-md {
  font-size: 0.88rem;
  padding: 8px 16px;
}
.btn-lg {
  font-size: 0.98rem;
  padding: 12px 24px;
}

/* Variants */
/* Primary (Monochrome Flat) */
.btn-primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  border-color: var(--text-primary);
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Secondary (Slate Outline/Surface) */
.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

/* Success (Teal Accent) */
.btn-success {
  background: var(--accent);
  color: #042f20;
  font-weight: 700;
}
.btn-success:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
.btn-success:active:not(:disabled) {
  transform: translateY(0);
}

/* Danger (Red Warning) */
.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
}
.btn-danger:hover:not(:disabled) {
  background: var(--error);
  color: #fff;
  border-color: var(--error);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
