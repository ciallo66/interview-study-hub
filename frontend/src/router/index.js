import { createRouter, createWebHistory } from 'vue-router';

//使用懒加载方式
const routes = [
  // ── 公开 ──
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { guest: true } },
  { path: '/questions', name: 'Questions', component: () => import('../views/Questions.vue') },
  { path: '/questions/:id', name: 'QuestionDetail', component: () => import('../views/QuestionDetail.vue') },
  { path: '/random', name: 'Random', component: () => import('../views/Random.vue') },

  // ── 需登录 ──
  { path: '/questions/new', name: 'QuestionNew', component: () => import('../views/QuestionEdit.vue'), meta: { requiresAuth: true } },
  { path: '/questions/:id/edit', name: 'QuestionEdit', component: () => import('../views/QuestionEdit.vue'), meta: { requiresAuth: true } },
  { path: '/favorites', name: 'Favorites', component: () => import('../views/Favorites.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  // 1.  定义公开白名单（游客随便看的页面路径）
  const whiteList = ['/', '/login', '/register', '/questions', '/random'];
  
  // 或者是根据动态匹配 id 的详情页 `/questions/6`
  const isQuestionDetail = to.path.startsWith('/questions/');


  // 2. 如果去的是公开页面，或者是帖子详情页 ──  直接无条件放行！
  if (whiteList.includes(to.path) || isQuestionDetail) {
    // 额外加一个：如果已经登录了，就别让去登录注册页了
    if (to.meta.guest && token) {
      return next('/');
    }
    return next(); // 游客访问公开页，直接放行！
  }

  // 3. ── 剩下所有没在白名单里的（比如 /favorites, /profile），必须卡 Token ──
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
