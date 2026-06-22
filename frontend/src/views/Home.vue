<template>
  <AppLayout>
    <div class="home">
      <!-- Hero -->
      <section class="hero">
        <h1 class="hero__title">面试知识库</h1>
        <p class="hero__desc">
          收录前端与算法面试题，Markdown 题解，标签分类，随时搜索与随机练习。
        </p>

        <form class="hero__search" @submit.prevent="handleSearch">
          <div class="search-box">
            <span class="search-box__icon">🔍</span>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索题目标题或内容..."
            />
          </div>
          <button type="submit" class="btn btn-primary">搜索</button>
        </form>

        <div class="hero__actions">
          <router-link to="/questions" class="btn btn-primary">浏览题库</router-link>
          <router-link to="/random" class="btn btn-outline">随机一题</router-link>
        </div>
      </section>

      <!-- 加载中 -->
      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>加载中<span class="loading-dots"></span></p>
      </div>

      <template v-else>
        <!-- 统计卡片 -->
        <section class="stats" v-if="stats.total > 0">
          <router-link to="/questions" class="stat-card">
            <span class="stat-card__num">{{ stats.total }}</span>
            <span class="stat-card__label">总题目</span>
          </router-link>
          <router-link to="/questions?difficulty=easy" class="stat-card stat-card--easy">
            <span class="stat-card__num">{{ stats.easy }}</span>
            <span class="stat-card__label">简单</span>
          </router-link>
          <router-link to="/questions?difficulty=medium" class="stat-card stat-card--medium">
            <span class="stat-card__num">{{ stats.medium }}</span>
            <span class="stat-card__label">中等</span>
          </router-link>
          <router-link to="/questions?difficulty=hard" class="stat-card stat-card--hard">
            <span class="stat-card__num">{{ stats.hard }}</span>
            <span class="stat-card__label">困难</span>
          </router-link>
        </section>

        <!-- 最近更新 -->
        <section class="section" v-if="recentQuestions.length > 0">
          <div class="section__header">
            <h2 class="section__title">最近更新</h2>
            <router-link to="/questions" class="section__link">查看全部 →</router-link>
          </div>
          <div class="recent-list">
            <router-link
              v-for="q in recentQuestions"
              :key="q.id"
              :to="'/questions/' + q.id"
              class="list-item"
            >
              <span :class="['badge', 'badge--' + q.difficulty]">
                {{ difficultyShort[q.difficulty] }}
              </span>
              <span class="list-item__title">{{ q.title }}</span>
              <span v-if="q.tags && q.tags.length" class="list-item__tags">
                <span v-for="t in q.tags.slice(0, 2)" :key="t.id" class="mini-tag">{{ t.name }}</span>
              </span>
              <span class="list-item__meta">{{ formatRelativeDate(q.updated_at) }}</span>
            </router-link>
          </div>
        </section>

        <!-- 空状态 -->
        <section class="state" v-if="stats.total === 0">
          <p class="state__icon">📭</p>
          <p>题库暂空，登录后可以添加第一道题目</p>
          <div class="state__actions">
            <router-link to="/login" class="btn btn-primary">登录</router-link>
            <router-link to="/register" class="btn btn-outline">注册</router-link>
          </div>
        </section>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import AppLayout from '../components/AppLayout.vue';
import { questionAPI } from '../api/question';
import { formatRelativeDate, difficultyShort } from '../utils/format';

const router = useRouter();
const loading = ref(false);
const allQuestions = ref([]);
const searchKeyword = ref('');

const stats = computed(() => {
  const list = allQuestions.value;
  return {
    total: list.length,
    easy: list.filter(q => q.difficulty === 'easy').length,
    medium: list.filter(q => q.difficulty === 'medium').length,
    hard: list.filter(q => q.difficulty === 'hard').length,
  };
});

const recentQuestions = computed(() => allQuestions.value.slice(0, 4));

function handleSearch() {
  const kw = searchKeyword.value.trim();
  if (kw) {
    router.push({ path: '/questions', query: { keyword: kw } });
  } else {
    router.push('/questions');
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const questionData = await questionAPI.getList({ page: 1, pageSize: 100 });
    allQuestions.value = questionData.list || [];
  } catch (err) {
    console.error('加载首页数据失败:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 48px 24px 36px;
  margin: -28px -24px 32px;
  background: linear-gradient(180deg, #eef1fb 0%, var(--color-bg) 100%);
  border-bottom: 1px solid var(--color-border);
}

.hero__title {
  font-size: 32px;
  color: var(--color-text);
  margin-bottom: 12px;
  font-weight: 700;
}

.hero__desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  max-width: 520px;
  margin: 0 auto 24px;
  line-height: 1.7;
}

.hero__search {
  display: flex;
  gap: 10px;
  max-width: 480px;
  margin: 0 auto 20px;
}

.hero__search .search-box {
  flex: 1;
}

.hero__actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: center;
  text-decoration: none;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  transition: box-shadow 0.2s, transform 0.15s;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-card--easy { border-left-color: var(--color-easy); }
.stat-card--medium { border-left-color: var(--color-medium); }
.stat-card--hard { border-left-color: var(--color-hard); }

.stat-card__num {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
}

.stat-card__label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.section {
  margin-bottom: 32px;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section__title {
  font-size: 18px;
  color: var(--color-text);
  font-weight: 600;
}

.section__link {
  font-size: 14px;
  text-decoration: none;
  color: var(--color-primary);
}

.section__link:hover {
  text-decoration: underline;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  padding: 10px 12px;
}

.list-item__title {
  font-size: 14px;
}

.list-item__meta {
  font-size: 11px;
}

@media (max-width: 640px) {
  .hero {
    margin: -28px -16px 24px;
    padding: 36px 16px 28px;
  }

  .hero__title {
    font-size: 26px;
  }

  .hero__search {
    flex-direction: column;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .list-item {
    flex-wrap: wrap;
  }

  .list-item__tags {
    display: none;
  }
}
</style>
