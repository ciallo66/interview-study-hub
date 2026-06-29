<template>
  <AppLayout>
    <div class="profile-page">
      <header class="page-header">
        <h2>个人中心</h2>
      </header>

      <div class="profile-card surface-card">
        <div class="profile-avatar">{{ profileInitial }}</div>
        <div class="profile-info">
          <h3>{{ profile.username || store.username }}</h3>
          <p class="profile-meta">用户 ID：{{ profile.id || store.user?.id || '—' }}</p>
          <p class="profile-meta">账号状态：{{ profile.status || '已登录' }}</p>
          <div class="profile-badges">
            <span class="badge badge--easy">题库 {{ stats.total }} 道</span>
            <span class="badge badge--medium">收藏 {{ stats.favorites }} 道</span>
            <span class="badge badge--hard">难度分布已统计</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>加载统计中<span class="loading-dots"></span></p>
      </div>

      <div v-else-if="stats.total > 0" class="profile-content">
        <section class="stats-row">
          <div class="stat-box surface-card">
            <span class="stat-box__num">{{ stats.total }}</span>
            <span class="stat-box__label">总题目</span>
          </div>
          <router-link to="/favorites" class="stat-box surface-card stat-box--link">
            <span class="stat-box__num">{{ stats.favorites }}</span>
            <span class="stat-box__label">收藏</span>
          </router-link>
          <router-link to="/questions?difficulty=easy" class="stat-box surface-card stat-box--link">
            <span class="stat-box__num stat-box__num--easy">{{ stats.easy }}</span>
            <span class="stat-box__label">简单</span>
          </router-link>
          <router-link to="/questions?difficulty=medium" class="stat-box surface-card stat-box--link">
            <span class="stat-box__num stat-box__num--medium">{{ stats.medium }}</span>
            <span class="stat-box__label">中等</span>
          </router-link>
          <router-link to="/questions?difficulty=hard" class="stat-box surface-card stat-box--link">
            <span class="stat-box__num stat-box__num--hard">{{ stats.hard }}</span>
            <span class="stat-box__label">困难</span>
          </router-link>
        </section>

        <section class="profile-grid">
          <article class="surface-card quick-card">
            <h3>快捷入口</h3>
            <div class="quick-actions">
              <router-link to="/questions" class="btn btn-primary btn-sm">浏览题库</router-link>
              <router-link to="/random" class="btn btn-outline btn-sm">随机一题</router-link>
              <router-link to="/favorites" class="btn btn-ghost btn-sm">收藏夹</router-link>
            </div>
          </article>

          <article class="surface-card quick-card">
            <h3>学习建议</h3>
            <ul class="tips-list">
              <li>优先复习收藏题，巩固薄弱点。</li>
              <li>困难题占比 {{ stats.hardRatio }}%，建议按难度分层练习。</li>
              <li>已收录 {{ stats.total }} 道题，可继续补充案例。</li>
            </ul>
          </article>
        </section>

        <section class="profile-grid profile-grid--wide">
          <article class="surface-card">
            <div class="section-heading">
              <h3>我创建的题目</h3>
              <router-link to="/questions/new" class="section-link">+ 新建</router-link>
            </div>
            <div v-if="myQuestions.length" class="mini-list">
              <router-link
                v-for="item in myQuestions.slice(0, 5)"
                :key="item.id"
                :to="'/questions/' + item.id"
                class="mini-list__item"
              >
                <span class="mini-list__title">{{ item.title }}</span>
                <span class="mini-list__meta">{{ item.difficulty === 'easy' ? '简单' : item.difficulty === 'medium' ? '中等' : '困难' }}</span>
              </router-link>
            </div>
            <p v-else class="muted-text">还没有创建过题目，去添加第一道吧。</p>
          </article>

          <article class="surface-card">
            <div class="section-heading">
              <h3>最近收藏</h3>
              <router-link to="/favorites" class="section-link">查看全部</router-link>
            </div>
            <div v-if="favorites.length" class="mini-list">
              <router-link
                v-for="item in favorites.slice(0, 4)"
                :key="item.id"
                :to="'/questions/' + item.id"
                class="mini-list__item"
              >
                <span class="mini-list__title">{{ item.title }}</span>
                <span class="mini-list__meta">{{ item.difficulty === 'easy' ? '简单' : item.difficulty === 'medium' ? '中等' : '困难' }}</span>
              </router-link>
            </div>
            <p v-else class="muted-text">暂无收藏题目，先收藏一些题目吧。</p>
          </article>

          <article class="surface-card">
            <h3>题型分布</h3>
            <div class="distribution-list">
              <div class="distribution-row"><span>简单</span><strong>{{ stats.easy }}</strong></div>
              <div class="distribution-row"><span>中等</span><strong>{{ stats.medium }}</strong></div>
              <div class="distribution-row"><span>困难</span><strong>{{ stats.hard }}</strong></div>
            </div>
          </article>
        </section>
      </div>

      <div v-else class="state">
        <p>还没有题目，去添加第一道吧</p>
        <div class="state__actions">
          <router-link to="/questions/new" class="btn btn-primary">+ 新增题目</router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { useUserStore } from '../stores/user';
import { authAPI } from '../api';
import { questionAPI } from '../api/question';
import { formatRelativeDate } from '../utils/format';

const store = useUserStore();
const loading = ref(false);
const allQuestions = ref([]);
const favorites = ref([]);
const profile = ref({ username: '', id: '', status: '已登录' });

const profileInitial = computed(() => (profile.value.username || store.username || 'U').charAt(0).toUpperCase());

const recentUpdates = computed(() => {
  return [...allQuestions.value]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 5);
});

const stats = computed(() => {
  const list = allQuestions.value;
  const total = list.length;
  const easy = list.filter(q => q.difficulty === 'easy').length;
  const medium = list.filter(q => q.difficulty === 'medium').length;
  const hard = list.filter(q => q.difficulty === 'hard').length;

  return {
    total,
    favorites: favorites.value.length,
    easy,
    medium,
    hard,
    hardRatio: total ? Math.round((hard / total) * 100) : 0,
  };
});

onMounted(async () => {
  loading.value = true;
  try {
    const [questionData, favoriteData, meData] = await Promise.all([
      questionAPI.getList({ page: 1, pageSize: 500 }),
      questionAPI.getList({ page: 1, pageSize: 100, isMistake: 'true' }),
      authAPI.getMe().catch(() => null),
    ]);

    allQuestions.value = questionData.list || [];
    favorites.value = favoriteData.list || [];

    const profilePayload = meData?.data ?? meData;

    if (profilePayload) {
      profile.value = {
        username: profilePayload.username || store.username,
        id: profilePayload.id || store.user?.id || '',
        status: profilePayload.status || '已登录',
      };
    } else {
      profile.value = {
        username: store.username,
        id: store.user?.id || '',
        status: '已登录',
      };
    }
  } catch (err) {
    console.error('加载统计失败:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.profile-info h3 {
  font-size: 20px;
  color: var(--color-text);
  margin-bottom: 4px;
}

.profile-meta {
  font-size: 13px;
  color: var(--color-text-muted);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.stat-box {
  padding: 18px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.stat-box--link:hover {
  box-shadow: var(--shadow-md);
}

.stat-box__num {
  display: block;
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 2px;
}

.stat-box__num--easy { color: var(--color-easy); }
.stat-box__num--medium { color: var(--color-medium); }
.stat-box__num--hard { color: var(--color-hard); }

.stat-box__label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.profile-grid--wide {
  grid-template-columns: 1.3fr 1fr;
}

.quick-card h3,
.surface-card h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--color-text);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tips-list {
  padding-left: 18px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.tips-list li + li {
  margin-top: 6px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.section-link {
  text-decoration: none;
  color: var(--color-primary);
  font-size: 13px;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-list__item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  background: var(--color-bg);
}

.mini-list__title {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
}

.mini-list__meta {
  color: var(--color-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--color-border);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.distribution-row strong {
  color: var(--color-text);
}

.muted-text {
  color: var(--color-text-muted);
  font-size: 13px;
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-grid,
  .profile-grid--wide {
    grid-template-columns: 1fr;
  }

  .profile-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
