<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast--' + t.type]">
      <span class="toast__icon">
        <template v-if="t.type === 'success'">✓</template>
        <template v-else-if="t.type === 'error'">✕</template>
        <template v-else-if="t.type === 'warning'">!</template>
        <template v-else>i</template>
      </span>
      <span class="toast__text">{{ t.message }}</span>
      <button class="toast__close" @click="hideToast(t.id)">✕</button>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { useToast } from '../composables/useToast'
const { toasts, hideToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.13);
  border: 1px solid var(--color-border);
  font-size: 14px;
  min-width: 260px;
  max-width: 400px;
  pointer-events: auto;
  animation: toast-in 0.3s ease;
}

.toast__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.toast--success .toast__icon { background: var(--color-easy); }
.toast--error .toast__icon   { background: var(--color-danger); }
.toast--warning .toast__icon { background: var(--color-medium); }
.toast--info .toast__icon    { background: var(--color-primary); }

.toast--success { border-left: 4px solid var(--color-easy); }
.toast--error   { border-left: 4px solid var(--color-danger); }
.toast--warning { border-left: 4px solid var(--color-medium); }
.toast--info    { border-left: 4px solid var(--color-primary); }

.toast__text {
  flex: 1;
  color: var(--color-text);
}

.toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-muted);
  padding: 2px;
  line-height: 1;
}
.toast__close:hover { color: var(--color-text); }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}

.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
