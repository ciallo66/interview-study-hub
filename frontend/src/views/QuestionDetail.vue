<template>
  <AppLayout>
    <div class="detail-page">
      <div v-if="loading" class="state">
        <p>加载中...</p>
      </div>

      <div v-else-if="loadError" class="state state--error">
        <p>{{ loadError }}</p>
        <button class="btn-retry" @click="loadQuestion">重试</button>
        <router-link to="/questions" class="back-link">← 返回列表</router-link>
      </div>

      <template v-else>
        <router-link to="/questions" class="back-link">← 返回列表</router-link>

        <header class="detail__header">
          <div class="detail__title-row">
            <span :class="['badge', 'badge--' + question.difficulty]">
              {{ difficultyLabel }}
            </span>
            <h2>{{ question.title }}</h2>
            <span v-if="question.is_mistake && store.isLoggedIn" class="badge badge--mistake">⭐ 已收藏</span>
          </div>

          <div class="detail__meta">
            <span v-if="question.source" class="detail__source">📎 来源：{{ question.source }}</span>
            <time>🕐 更新于 {{ formatDate(question.updated_at) }}</time>
          </div>
        </header>

        <div class="detail__tags">
          <span v-if="!question.tags || question.tags.length === 0" class="detail__tags-empty">
            暂无标签
          </span>
          <span v-for="tag in question.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
        </div>

        <div class="detail__content" v-html="renderedMarkdown"></div>

        <!-- 操作区：登录后才显示 -->
        <footer class="detail__actions">
          <template v-if="store.isLoggedIn">
            <router-link
              :to="'/questions/' + question.id + '/edit'"
              class="btn-action btn-action--primary"
            >
              ✏️ 编辑
            </router-link>
            <button
              type="button"
              class="btn-action"
              :class="{ 'btn-action--mistake-active': question.is_mistake }"
              @click="handleToggleMistake"
            >
              {{ question.is_mistake ? '✅ 取消收藏' : '⭐ 收藏' }}
            </button>
            <button type="button" class="btn-action btn-action--danger" @click="handleDelete">
              🗑 删除
            </button>
          </template>
          <template v-else>
            <p class="login-tip">
              <router-link to="/login">登录</router-link> 后可以收藏和编辑
            </p>
          </template>
        </footer>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AppLayout from '../components/AppLayout.vue';
import { useUserStore } from '../stores/user';
import { questionAPI } from '../api/question';

const route = useRoute();
const router = useRouter();
const store = useUserStore();

const loading = ref(false);
const loadError = ref('');
const question = reactive({
  id: null,
  title: '',
  difficulty: 'medium',
  source: '',
  content: '',
  is_mistake: false,
  tags: [],
  updated_at: '',
});

const difficultyLabel = computed(() => {
  const map = { easy: '简单', medium: '中等', hard: '困难' };
  return map[question.difficulty] || '未知';
});

const renderedMarkdown = computed(() => {
  if (!question.content) return '<p style="color:#ccc;">暂无内容</p>';
  const rawHtml = marked.parse(question.content);
  return DOMPurify.sanitize(rawHtml);
});

async function loadQuestion() {
  loading.value = true;
  loadError.value = '';

  try {
    const data = await questionAPI.getById(route.params.id);
    Object.assign(question, data);
  } catch (err) {
    loadError.value = err.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

async function handleToggleMistake() {
  try {
    const data = await questionAPI.toggleMistake(question.id);
    question.is_mistake = data.is_mistake;
  } catch (err) {
    alert(err.message || '操作失败');
  }
}

async function handleDelete() {
  if (!confirm('确定删除这道题目吗？')) return;
  try {
    await questionAPI.remove(question.id);
    router.push('/questions');
  } catch (err) {
    alert(err.message || '删除失败');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

onMounted(() => {
  loadQuestion();
});
</script>

<style scoped>
.detail-page {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.detail__header {
  margin-bottom: 20px;
}

.detail__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.detail__title-row h2 {
  font-size: 24px;
  color: #1a1a2e;
}

.detail__meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}

.detail__source {
  color: #555;
}

.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.detail__tags-empty {
  font-size: 13px;
  color: #ccc;
}

.tag {
  font-size: 13px;
  background: #eef0ff;
  color: #667eea;
  padding: 5px 14px;
  border-radius: 20px;
}

.detail__content {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 28px;
  font-size: 17px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 24px;
}

.detail__content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.detail__content :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 18px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
  margin: 14px 0;
}

.detail__content :deep(pre code) {
  background: none;
  padding: 0;
}

.detail__content :deep(h2) {
  margin: 24px 0 12px;
  font-size: 20px;
  color: #1a1a2e;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.detail__content :deep(h3) {
  margin: 20px 0 10px;
  font-size: 18px;
  color: #1a1a2e;
}

.detail__content :deep(h4) {
  margin: 16px 0 8px;
  font-size: 16px;
  color: #1a1a2e;
}

.detail__content :deep(ul),
.detail__content :deep(ol) {
  padding-left: 24px;
  margin: 10px 0;
}

.detail__content :deep(li) {
  margin-bottom: 4px;
}

.detail__content :deep(p) {
  margin-bottom: 12px;
}

.detail__content :deep(strong) {
  font-weight: 600;
}

.detail__content :deep(blockquote) {
  border-left: 3px solid #667eea;
  padding-left: 14px;
  color: #666;
  margin: 12px 0;
}

/* 操作区 */
.detail__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-action {
  padding: 10px 22px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  color: #555;
  text-decoration: none;
  display: inline-block;
}

.btn-action:hover {
  border-color: #667eea;
  color: #667eea;
}

.btn-action--primary {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.btn-action--primary:hover {
  opacity: 0.85;
  color: #fff;
}

.btn-action--danger:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.btn-action--mistake-active {
  background: #fffbe6;
  border-color: #f0c040;
  color: #b8860b;
}

.login-tip {
  font-size: 14px;
  color: #999;
}

.login-tip a {
  color: #667eea;
  font-weight: 500;
}

/* 徽标 */
.badge {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.badge--easy { background: #e8f5e9; color: #2e7d32; }
.badge--medium { background: #fff3e0; color: #e65100; }
.badge--hard { background: #ffebee; color: #c62828; }
.badge--mistake { background: #fffbe6; color: #b8860b; font-size: 12px; padding: 3px 10px; border-radius: 4px; border: 1px solid #f0d060; }

/* 状态占位 */
.state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  color: #999;
}

.state--error { color: #e74c3c; }

.btn-retry {
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 8px 20px;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  background: #fff;
  color: #e74c3c;
  cursor: pointer;
  display: inline-block;
}
</style>
