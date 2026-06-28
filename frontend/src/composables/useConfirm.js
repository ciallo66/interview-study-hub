import { reactive } from 'vue'

const confirmState = reactive({
  visible: false,
  message: '',
  title: '',
  resolve: null,
  danger: false,
})

export function useConfirm() {
  function showConfirm(message, options = {}) {
    confirmState.message = message
    confirmState.title = options.title || '确认操作'
    confirmState.danger = options.danger || false
    confirmState.visible = true
    return new Promise((resolve) => {
      confirmState.resolve = resolve
    })
  }

  function handleConfirm() {
    confirmState.visible = false
    if (confirmState.resolve) {
      confirmState.resolve(true)
      confirmState.resolve = null
    }
  }

  function handleCancel() {
    confirmState.visible = false
    if (confirmState.resolve) {
      confirmState.resolve(false)
      confirmState.resolve = null
    }
  }

  return { confirmState, showConfirm, handleConfirm, handleCancel }
}
