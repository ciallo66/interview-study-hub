import axios from 'axios';
import { useUserStore } from '../stores/user';

const http = axios.create({
  baseURL: '/api',       // vite proxy 会转发到 localhost:3000
  timeout: 10000,
});

// 请求拦截 → 自动携带 token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// 响应拦截 → 统一处理错误 + 401 跳转登录
http.interceptors.response.use(
  (res) => res.data,     // 直接返回 { code, message, data }
  (err) => {
    const userStore = useUserStore(); // 放在内部动态获取，防止报错
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (userStore.clearUserData) {
        userStore.clearUserData();
      }
      window.location.href = '/login';
    }
    const message = err.response?.data?.message || '网络错误xixixi';
    return Promise.reject(new Error(message));
  }
);

export default http;

// ---- API 方法 ----
export const authAPI = {
  register: (data) => http.post('/auth/register', data),
  login: (data) => http.post('/auth/login', data),
  getMe: () => http.get('/auth/me'),
};