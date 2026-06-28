<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="confirmState.visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog">
          <h3 class="confirm-dialog__title">{{ confirmState.title }}</h3>
          <p class="confirm-dialog__msg">{{ confirmState.message }}</p>
          <div class="confirm-dialog__actions">
            <button class="btn btn-ghost" @click="handleCancel">取消</button>
            <button
              :class="['btn', confirmState.danger ? 'btn-danger' : 'btn-primary']"
              @click="handleConfirm"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useConfirm } from '../composables/useConfirm'
const { confirmState, handleConfirm, handleCancel } = useConfirm()
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.confirm-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.confirm-dialog__msg {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.25s ease;
}
.confirm-enter-active .confirm-dialog,
.confirm-leave-active .confirm-dialog {
  transition: transform 0.25s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from .confirm-dialog {
  transform: scale(0.92);
}
.confirm-leave-to .confirm-dialog {
  transform: scale(0.92);
}
</style>
