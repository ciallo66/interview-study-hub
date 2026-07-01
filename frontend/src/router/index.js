import { createRouter, createWebHistory } from 'vue-router'
import { useToast } from '../composables/useToast'
import { useUserStore } from '../stores/user'


const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { guest: true } },
  { path: '/questions', name: 'Questions', component: () => import('../views/Questions.vue') },
  { path: '/questions/:id', name: 'QuestionDetail', component: () => import('../views/QuestionDetail.vue') },
  { path: '/random', name: 'Random', component: () => import('../views/Random.vue') },
  { path: '/questions/new', name: 'QuestionNew', component: () => import('../views/QuestionEdit.vue'), meta: { requiresAuth: true } },
  { path: '/questions/:id/edit', name: 'QuestionEdit', component: () => import('../views/QuestionEdit.vue'), meta: { requiresAuth: true, isAdmin: true } },
  { path: '/favorites', name: 'Favorites', component: () => import('../views/Favorites.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (!to.meta.requiresAuth && !to.meta.isAdmin) {
    if (to.meta.guest && token) {
      return next('/')
    }
    return next()
  }

  if (!token) {
    return next('/login')
  }

  if (to.meta.isAdmin) {
    const userRole = useUserStore().getRole()
    if (userRole === 'admin') {
      next()
    } else {
      const { error } = useToast()
      error('权限不足，需要管理员账号才能访问')
      next(false)
    }
  } else {
    next()
  }
})

export default router
