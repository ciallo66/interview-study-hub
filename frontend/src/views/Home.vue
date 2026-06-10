<template>
  <AppLayout>
    <div class="home">
      <!-- Hero -->
      <section class="hero">
        <h1>📚 面试知识库</h1>
        <p class="hero-desc">
          收录前端 / 算法面试题，Markdown 编写题解，标签分类管理，搜你所想。
        </p>
        <div class="hero-actions">
          <router-link to="/questions" class="btn-hero">浏览题库</router-link>
          <router-link to="/random" class="btn-hero btn-hero--outline">随机一题</router-link>
        </div>
      </section>

      <!-- 统计卡片 -->
      <section class="stats" v-if="stats.total > 0">
        <div class="stat-card">
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-label">总题目</span>
        </div>
        <div class="stat-card stat-card--easy">
          <span class="stat-number">{{ stats.easy }}</span>
          <span class="stat-label">简单</span>
        </div>
        <div class="stat-card stat-card--medium">
          <span class="stat-number">{{ stats.medium }}</span>
          <span class="stat-label">中等</span>
        </div>
        <div class="stat-card stat-card--hard">
          <span class="stat-number">{{ stats.hard }}</span>
          <span class="stat-label">困难</span>
        </div>
      </section>

      <!-- 最近题目 -->
      <section class="recent" v-if="recentQuestions.length > 0">
        <h2>📌 最近更新</h2>
        <div class="recent-list">
          <router-link
            v-for="q in recentQuestions"
            :key="q.id"
            :to="'/questions/' + q.id"
            class="recent-item"
          >
            <span :class="['badge-sm', 'badge-sm--' + q.difficulty]">
              {{ { easy: '简', medium: '中', hard: '难' }[q.difficulty] }}
            </span>
            <span class="recent-title">{{ q.title }}</span>
            <span class="recent-date">{{ formatDate(q.updated_at) }}</span>
          </router-link>
        </div>
      </section>

      <!-- 空状态 -->
      <section class="hero" v-if="stats.total === 0 && !loading">
        <p class="hero-desc">题库暂空，登录后添加第一道题目。</p>
        <router-link to="/login" class="btn-hero">登录后使用</router-link>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { questionAPI } from '../api/question';

const loading = ref(false);
const allQuestions = ref([]);

const stats = computed(() => {
  const list = allQuestions.value;
  return {
    total: list.length,
    easy: list.filter(q => q.difficulty === 'easy').length,
    medium: list.filter(q => q.difficulty === 'medium').length,
    hard: list.filter(q => q.difficulty === 'hard').length,
  };
});

const recentQuestions = computed(() => {
  return allQuestions.value.slice(0, 8);
});

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '';
}

onMounted(async () => {
  loading.value = true;
  try {
    const data = await questionAPI.getList({ page: 1, pageSize: 100 });
    allQuestions.value = data.list || [];
  } catch (err) {
    console.error('加载首页数据失败:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home {
  font-size: 16px;
  /* 容器 */
}

/* Hero */
.hero {
  text-align: center;
  padding: 60px 20px 40px;
}

.hero h1 {
  font-size: 36px;
  color: #1a1a2e;
  margin-bottom: 14px;
}

.hero-desc {
  font-size: 16px;
  color: #888;
  max-width: 480px;
  margin: 0 auto 28px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-hero {
  padding: 12px 28px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.btn-hero:hover {
  opacity: 0.9;
}

.btn-hero--outline {
  background: #fff;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-hero--outline:hover {
  background: #f0f2ff;
  opacity: 1;
}

/* 统计卡片 */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 0 0 40px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border-left: 4px solid #667eea;
}

.stat-card--easy { border-left-color: #2e7d32; }
.stat-card--medium { border-left-color: #e65100; }
.stat-card--hard { border-left-color: #c62828; }

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

/* 最近更新 */
.recent {
  margin-bottom: 40px;
}

.recent h2 {
  font-size: 20px;
  color: #1a1a2e;
  margin-bottom: 14px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #fff;
  border-radius: 10px;
  text-decoration: none;
  border: 1px solid #eee;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.recent-item:hover {
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  border-color: #d0d5ff;
}

.recent-title {
  flex: 1;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.recent-date {
  font-size: 12px;
  color: #bbb;
}

.badge-sm {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.badge-sm--easy { background: #e8f5e9; color: #2e7d32; }
.badge-sm--medium { background: #fff3e0; color: #e65100; }
.badge-sm--hard { background: #ffebee; color: #c62828; }

@media (max-width: 640px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
