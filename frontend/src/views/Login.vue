<template>
  <div class="auth-wrapper">
    <main class="auth-main">
      <div class="auth-card">
        <router-link to="/" class="auth-card__back">← 返回</router-link>
        <h2 class="auth-card__title">登录</h2>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>

          <button class="btn btn-primary auth-card__btn" type="submit" :disabled="submitting">
            {{ submitting ? '登录中...' : '登 录' }}
          </button>
        </form>

        <div class="auth-card__link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>

        <details class="auth-card__hint">
          <summary>体验账号 📝</summary>
          <div class="auth-card__hint-body">
            普通用户：<code>user</code> / <code>123456</code><br />
            管理员：<code>admin</code> / <code>123456</code>
          </div>
        </details>
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

const form = reactive({ username: '', password: '' })
const submitting = ref(false)

async function handleLogin() {
  if (submitting.value) return

  const username = form.username.trim()
  const password = form.password.trim()

  if (!username || !password) {
    toast.error('请输入用户名和密码')
    return
  }

  submitting.value = true
  try {
    await store.login(username, password)
    toast.success('登录成功')
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

.auth-card__hint {
  margin-top: 16px;
  border-radius: var(--radius-md);
  background: #f8faff;
  border: 1px dashed var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.auth-card__hint summary {
  cursor: pointer;
  padding: 10px 14px;
  font-weight: 500;
  user-select: none;
}

.auth-card__hint summary:hover {
  color: var(--color-primary);
}

.auth-card__hint-body {
  padding: 0 14px 12px;
}

.auth-card__hint code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--color-primary-light);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--color-primary);
}
</style>
