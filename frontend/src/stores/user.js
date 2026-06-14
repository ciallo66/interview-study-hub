import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI } from '../api';

// 从本地存储中恢复用户信息；如果数据损坏则返回 null，避免页面崩掉。
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export const useUserStore = defineStore('user', () => {
  // 当前登录状态与用户信息，初始值来自本地存储。
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(readStoredUser());

  // 保存登录会话到内存和本地存储，保证页面刷新后仍可恢复。
  function persistSession(nextToken, nextUser) {
    token.value = nextToken;
    user.value = nextUser;

    //将数据存储到本地，使用JSON.stringify(),转换为字符串
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('user_role', nextUser.role);
  }

  // 是否已登录：依据 token 是否存在来判断。
  const isLoggedIn = computed(() => !!token.value);

  // 当前用户名，供页面展示使用。使用可选链?.找不到user直接undefine到后面的 ' '
  const username = computed(() => user.value?.username || '');

  // 登录接口：拿到 token 与用户信息后，写入本地状态。
  async function login(username, password) {
    const res = await authAPI.login({ username, password });
    persistSession(res.data.token, { id: res.data.userId, username: res.data.username ,user_role:res.data.role});
  }

  // 注册接口：注册成功后同样写入登录状态。
  async function register(username, password) {
    const res = await authAPI.register({ username, password });
    persistSession(res.data.token, { id: res.data.userId, username: res.data.username ,user_role:res.data.role});
  }

  // 清理本地登录状态，供 401 处理或退出登录时复用。
  function clearUserData() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    
  }

  // 退出登录：统一走清理逻辑，避免重复写状态重置代码。
  function logout() {
    clearUserData();
  }

  return { token, user, isLoggedIn, username, login, register, logout, clearUserData };
});
