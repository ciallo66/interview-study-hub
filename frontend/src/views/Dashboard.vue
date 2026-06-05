<template>
  <AppLayout>
    <div class="welcome">
      <h2>👋 欢迎回来，{{ store.username }}</h2>
      <p>你的面试知识库已就绪，Day2 我们将在这里添加题目列表。</p>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../components/AppLayout.vue';
import { useUserStore } from '../stores/user';

const store = useUserStore();
</script>

<style scoped>
.welcome {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.welcome h2 {
  font-size: 24px;
  margin-bottom: 12px;
  color: #1a1a2e;
}

.welcome p {
  color: #888;
  font-size: 15px;
}
</style>
