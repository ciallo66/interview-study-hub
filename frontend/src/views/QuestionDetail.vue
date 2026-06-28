<template>
  <AppLayout>
    <div class="detail-page">
      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>加载中<span class="loading-dots"></span></p>
      </div>

      <div v-else-if="loadError" class="state state--error">
        <p>{{ loadError }}</p>
        <div class="state__actions">
          <button class="btn btn-danger" @click="loadQuestion">重试</button>
          <router-link to="/questions" class="btn btn-outline">返回列表</router-link>
        </div>
      </div>

      <template v-else>
        <router-link to="/questions" class="back-link">← 返回列表</router-link>

        <header class="detail__header">
          <div class="detail__title-row">
            <span :class="['badge', 'badge--' + question.difficulty]">
              {{ difficultyLabel[question.difficulty] || '未知' }}
            </span>
            <h1 class="detail__title">{{ question.title }}</h1>
            <span v-if="question.is_mistake && store.isLoggedIn" class="badge badge--mistake">已收藏</span>
          </div>

          <div class="detail__meta">
            <span v-if="question.source">来源：{{ question.source }}</span>
            <time>更新于 {{ formatDate(question.updated_at) }}</time>
          </div>
        </header>

        <div class="detail__tags">
          <span v-if="!question.tags || question.tags.length === 0" class="detail__tags-empty">暂无标签</span>
          <router-link
            v-for="tag in question.tags"
            :key="tag.id"
            :to="'/questions?tagId=' + tag.id"
            class="tag tag--clickable"
          >
            {{ tag.name }}
          </router-link>
        </div>

        <div class="detail__content markdown-body surface-card" v-html="renderedMarkdown"></div>

        <footer class="detail__actions">
          <template v-if="store.isLoggedIn">
            <router-link :to="'/questions/' + question.id + '/edit'" class="btn-action btn-action--primary">
              编辑
            </router-link>
            <button
              type="button"
              class="btn-action"
              :class="{ 'btn-action--active': question.is_mistake }"
              @click="handleToggleMistake"
            >
              {{ question.is_mistake ? '取消收藏' : '收藏' }}
            </button>
            <button type="button" class="btn-action btn-action--danger" @click="handleDelete">删除</button>
          </template>
          <template v-else>
            <p class="detail__login-tip">
              <router-link to="/login">登录</router-link> 后可以收藏和编辑
            </p>
          </template>
        </footer>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import AppLayout from '../components/AppLayout.vue'
import { useUserStore } from '../stores/user'
import { questionAPI } from '../api/question'
import { formatDate, difficultyLabel } from '../utils/format'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const store = useUserStore()
const { showConfirm } = useConfirm()
const toast = useToast()

const loading = ref(false)
const loadError = ref('')
const question = reactive({
  id: null,
  title: '',
  difficulty: 'medium',
  source: '',
  content: '',
  is_mistake: false,
  tags: [],
  updated_at: '',
})

const renderedMarkdown = computed(() => {
  if (!question.content) return '<p style="color:#9ca3af;">暂无内容</p>'
  return DOMPurify.sanitize(marked.parse(question.content))
})

async function loadQuestion() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await questionAPI.getById(route.params.id)
    Object.assign(question, data)
  } catch (err) {
    loadError.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleToggleMistake() {
  try {
    const data = await questionAPI.toggleMistake(question.id)
    question.is_mistake = data.is_mistake
    toast.success(question.is_mistake ? '已收藏' : '已取消收藏')
  } catch (err) {
    toast.error(err.message || '操作失败')
  }
}

async function handleDelete() {
  const ok = await showConfirm('确定删除这道题目吗？', { danger: true })
  if (!ok) return
  try {
    await questionAPI.remove(question.id)
    toast.success('删除成功')
    router.push('/questions')
  } catch (err) {
    toast.error(err.message || '删除失败')
  }
}

onMounted(loadQuestion)
</script>

<style scoped>
.detail-page {
  max-width: 100%;
  margin: 0 auto;
}
.detail__header { margin-bottom: 16px; }
.detail__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.detail__title {
  font-size: 24px;
  color: var(--color-text);
  font-weight: 600;
}
.detail__meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-muted);
}
.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.detail__tags-empty { font-size: 13px; color: var(--color-text-muted); }
.detail__content { padding: 24px; font-size: 16px; margin-bottom: 24px; }
.detail__content :deep(h2) {
  font-size: 20px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 6px;
}
.detail__content :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 16px;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 12px 0;
}
.detail__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px 0;
}
.detail__login-tip { font-size: 14px; color: var(--color-text-muted); }
.detail__login-tip a { font-weight: 500; }
</style>
