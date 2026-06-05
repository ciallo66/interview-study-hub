import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI } from '../api';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const username = computed(() => user.value?.username || '');

  // 登录
  async function login(username, password) {
    const res = await authAPI.login({ username, password });
    token.value = res.data.token;
    user.value = { id: res.data.userId, username: res.data.username };
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  // 注册
  async function register(username, password) {
    const res = await authAPI.register({ username, password });
    token.value = res.data.token;
    user.value = { id: res.data.userId, username: res.data.username };
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  // 登出
  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token, user, isLoggedIn, username, login, register, logout };
});
