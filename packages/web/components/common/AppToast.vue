<script setup lang="ts">
import { useToast } from '~/composables/useToast'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

const { toasts, remove } = useToast()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast-slide">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-card" 
        :class="`toast-${toast.type}`"
      >
        <div class="toast-icon">
          <CheckCircle2 v-if="toast.type === 'success'" :size="18" />
          <AlertCircle v-else-if="toast.type === 'error'" :size="18" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="18" />
          <Info v-else :size="18" />
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close-btn" @click="remove(toast.id)" aria-label="Close notification">
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
  pointer-events: none;
  max-width: 400px;
  width: calc(100vw - 48px);
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  font-size: 0.88rem;
  backdrop-filter: blur(12px);
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  transition: var(--transition);
}

.toast-close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* State Variants */
.toast-success {
  border-color: rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), var(--bg-card));
}
.toast-success .toast-icon {
  color: var(--accent);
}

.toast-error {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-card));
}
.toast-error .toast-icon {
  color: var(--error);
}

.toast-warning {
  border-color: rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), var(--bg-card));
}
.toast-warning .toast-icon {
  color: var(--warning);
}

.toast-info {
  border-color: rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), var(--bg-card));
}
.toast-info .toast-icon {
  color: var(--info);
}

/* Animations */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
</style>
