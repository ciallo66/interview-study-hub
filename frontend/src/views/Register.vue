<template>
  <div class="auth-page">
    <div class="auth-card">
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
    router.push('/dashboard');
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
