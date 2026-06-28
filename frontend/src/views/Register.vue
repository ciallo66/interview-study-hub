<template>
  <div class="auth-wrapper">
    <main class="auth-main">
      <div class="auth-card">
        <router-link to="/" class="auth-card__back">← 返回</router-link>
        <h2 class="auth-card__title">注册</h2>

        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="3-20位字符"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="至少6位"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label>确认密码</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              autocomplete="new-password"
            />
          </div>

          <button class="btn btn-primary auth-card__btn" type="submit" :disabled="submitting">
            {{ submitting ? '注册中...' : '注 册' }}
          </button>
        </form>

        <div class="auth-card__link">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../composables/useToast'

const router = useRouter()
const store = useUserStore()
const toast = useToast()

const form = reactive({ username: '', password: '', confirmPassword: '' })
const submitting = ref(false)

async function handleRegister() {
  if (submitting.value) return

  const username = form.username.trim()
  const password = form.password.trim()

  if (!username || !password) {
    toast.error('请填写完整信息')
    return
  }
  if (password !== form.confirmPassword.trim()) {
    toast.error('两次密码不一致')
    return
  }
  if (password.length < 6) {
    toast.error('密码至少6位')
    return
  }

  submitting.value = true
  try {
    await store.register(username, password)
    toast.success('注册成功')
    router.push('/questions')
  } catch (err) {
    toast.error(err.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f4ff 0%, #f4f6f9 50%, var(--color-hero-bg) 100%);
}

.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px 48px;
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 30px 32px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border);
  animation: card-enter 0.45s ease;
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.auth-card__back {
  display: inline-block;
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 12px;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.auth-card__back:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.auth-card__title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 24px;
  color: var(--color-text);
  font-weight: 700;
}

.auth-card__btn {
  width: 100%;
}

.auth-card__link {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: var(--color-text-muted);
}

.auth-card__link a {
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
}

.auth-card__link a:hover { text-decoration: underline; }
</style>
