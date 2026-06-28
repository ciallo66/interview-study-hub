<template>
  <AppLayout>
    <div class="page">
      <header class="page-header">
        <div>
          <h2>收藏列表</h2>
          <p v-if="list.length" class="page-header__meta">{{ list.length }} 题</p>
        </div>
      </header>

      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>加载中<span class="loading-dots"></span></p>
      </div>

      <div v-else-if="errorMsg" class="state state--error">
        <p>{{ errorMsg }}</p>
        <div class="state__actions">
          <button class="btn btn-danger" @click="fetchList">重试</button>
        </div>
      </div>

      <div v-else-if="list.length === 0" class="state">
        <p class="state__icon">⭐</p>
        <p>还没有收藏任何题目</p>
        <div class="state__actions">
          <router-link to="/questions" class="btn btn-primary">去浏览题目</router-link>
        </div>
      </div>

      <div v-else class="fav-list">
        <article v-for="q in list" :key="q.id" class="fav-item surface-card surface-card--hover">
          <div class="fav-item__main">
            <span :class="['badge', 'badge--' + q.difficulty]">
              {{ difficultyLabel[q.difficulty] }}
            </span>
            <router-link :to="'/questions/' + q.id" class="fav-item__title">
              {{ q.title }}
            </router-link>
            <span v-if="q.source" class="fav-item__source">{{ q.source }}</span>
          </div>
          <div v-if="q.tags && q.tags.length" class="fav-item__tags">
            <span v-for="t in q.tags" :key="t.id" class="mini-tag">{{ t.name }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="handleUnfavorite(q.id)">取消收藏</button>
        </article>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { questionAPI } from '../api/question'
import { difficultyLabel } from '../utils/format'
import { useToast } from '../composables/useToast'

const toast = useToast()
const list = ref([])
const loading = ref(false)
const errorMsg = ref('')

async function fetchList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await questionAPI.getList({ page: 1, pageSize: 100, isMistake: 'true' })
    list.value = data.list || []
  } catch (err) {
    errorMsg.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleUnfavorite(id) {
  try {
    await questionAPI.toggleMistake(id)
    list.value = list.value.filter(q => q.id !== id)
    toast.success('已取消收藏')
  } catch (err) {
    toast.error(err.message || '操作失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.fav-list { display: flex; flex-direction: column; gap: 10px; }
.fav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 16px 20px;
}
.fav-item__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 180px;
}
.fav-item__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}
.fav-item__title:hover { color: var(--color-primary); }
.fav-item__source { font-size: 12px; color: var(--color-text-muted); }
.fav-item__tags { display: flex; gap: 4px; flex-wrap: wrap; }
</style>
