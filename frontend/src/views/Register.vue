<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>注册</h2>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

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

        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '注 册' }}
        </button>
      </form>

      <div class="auth-link">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const store = useUserStore();

const form = reactive({ username: '', password: '', confirmPassword: '' });
const errorMsg = ref('');
const loading = ref(false);

async function handleRegister() {
  errorMsg.value = '';
  if (!form.username || !form.password) {
    errorMsg.value = '请填写完整信息';
    return;
  }
  if (form.password !== form.confirmPassword) {
    errorMsg.value = '两次密码不一致';
    return;
  }
  if (form.password.length < 6) {
    errorMsg.value = '密码至少6位';
    return;
  }
  loading.value = true;
  try {
    await store.register(form.username, form.password);
    router.push('/questions');
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  max-width: 400px;
  margin: 60px auto;
  padding: 0 20px;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.login-card h2 {
  text-align: center;
  margin-bottom: 28px;
  font-size: 24px;
  color: #1a1a2e;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
  outline: none;
}

.form-group input:focus {
  border-color: #667eea;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.auth-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #888;
}

.auth-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.auth-link a:hover {
  text-decoration: underline;
}

.error-msg {
  background: #fff0f0;
  color: #e74c3c;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>

