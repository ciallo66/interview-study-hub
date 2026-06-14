import axios from 'axios';
import { useUserStore } from '../stores/user';
import router from '../router';

// 创建 axios 实例，统一管理接口前缀和超时时间。
const http = axios.create({
  baseURL: 'https://my-project-production-0f79.up.railway.app/api',      
  timeout: 10000,
});

// 请求拦截：每次接口请求都会自动补上 Bearer token，减少重复写头部的代码。
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

// 响应拦截：统一处理接口错误；当 token 失效时，清理登录状态并跳回登录页。
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const userStore = useUserStore();

    if (err.response?.status === 401) {
      userStore.logout();
      router.push('/login');
    }

    const message = err.response?.data?.message || '网络错误，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

export default http;

// 认证相关接口封装，供页面直接调用，避免在组件里重复写请求逻辑。
//使用axios向后端发送请求和data数据
export const authAPI = {
  register: (data) => http.post('/auth/register', data),
  login: (data) => http.post('/auth/login', data),
  getMe: () => http.get('/auth/me'),
  user: () => http.get()
};