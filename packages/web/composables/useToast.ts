import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toasts = ref<ToastItem[]>([])

export function useToast() {
  const show = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const item: ToastItem = { id, message, type, duration }
    toasts.value.push(item)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    return id
  }

  const success = (message: string, duration = 4000) => show(message, 'success', duration)
  const error = (message: string, duration = 5000) => show(message, 'error', duration)
  const info = (message: string, duration = 4000) => show(message, 'info', duration)
  const warning = (message: string, duration = 4500) => show(message, 'warning', duration)

  const remove = (id: string) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
  }

  const clearAll = () => {
    toasts.value = []
  }

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    remove,
    clearAll
  }
}
