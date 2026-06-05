<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <h1 class="logo" @click="$router.push('/dashboard')">📚 面试知识库</h1>
        <div class="header-right">
          <span class="username">{{ store.username }}</span>
          <button class="btn-logout" @click="handleLogout">退出</button>
        </div>
      </div>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';

const store = useUserStore();
const router = useRouter();

function handleLogout() {
  store.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  color: #667eea;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-size: 14px;
  color: #666;
}

.btn-logout {
  padding: 6px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
</style>
