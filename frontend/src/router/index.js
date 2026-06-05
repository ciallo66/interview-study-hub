import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
/* router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.guest && token) {
    next('/dashboard');
  } else {
    next();
  }
}); */
router.beforeEach((to, from) => {
  // 1. 获取本地存储的 token
  const token = localStorage.getItem('token');

  // 2. 如果页面需要登录权限，且用户没有登录 -> 拦截并重定向到登录页
  if (to.meta.requiresAuth && !token) {
    return '/login'; 
  } 

  // 3. 如果是访客专属页面（比如登录/注册页），但用户已经登录了 -> 直接送他去首页/控制台
  if (to.meta.guest && token) {
    return '/dashboard'; 
  }

  // 4. 💥 重点：原来的 else { next(); } 彻底不用写了！
  // Vue Router 4 规定：只要你不 return 任何东西，默认就是直接放行，天王老子都不拦着！
});

export default router;

