import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  function showToast(message, type = 'info', duration = 3000) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => hideToast(id), duration)
    }
  }

  function hideToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(msg) { showToast(msg, 'success') }
  function error(msg)   { showToast(msg, 'error', 4500) }
  function warning(msg) { showToast(msg, 'warning') }
  function info(msg)    { showToast(msg, 'info') }

  return { toasts, showToast, hideToast, success, error, warning, info }
}
