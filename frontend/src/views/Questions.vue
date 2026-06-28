<template>
  <AppLayout>
    <div class="page">
      <header class="page-header">
        <div>
          <h2>题目列表</h2>
          <p v-if="!loading && pagination.total > 0" class="page-header__meta">
            共 {{ pagination.total }} 题
          </p>
        </div>
        <router-link v-if="store.isLoggedIn" to="/questions/new" class="btn btn-primary">+ 新增题目</router-link>
      </header>

      <FilterBar
        :initial-keyword="initialFilters.keyword"
        :initial-difficulty="initialFilters.difficulty"
        :initial-tag-id="initialFilters.tagId"
        @filter-change="handleFilterChange"
      />

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
        <p class="state__icon">📭</p>
        <p>{{ emptyMessage }}</p>
        <div v-if="store.isLoggedIn" class="state__actions">
          <router-link to="/questions/new" class="btn btn-primary">+ 新增题目</router-link>
        </div>
      </div>

      <template v-else>
        <QuestionCard
          v-for="item in list"
          :key="item.id"
          :question="item"
          @delete="handleDelete"
          @refresh="fetchList"
        />

        <AppPagination
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          @change="handlePageChange"
        />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import FilterBar from '../components/FilterBar.vue'
import QuestionCard from '../components/QuestionCard.vue'
import AppPagination from '../components/AppPagination.vue'
import { questionAPI } from '../api/question'
import { useUserStore } from '../stores/user'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const store = useUserStore()
const { showConfirm } = useConfirm()
const toast = useToast()

const list = ref([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const loading = ref(false)
const errorMsg = ref('')

const initialFilters = computed(() => ({
  keyword: route.query.keyword || '',
  difficulty: route.query.difficulty || '',
  tagId: route.query.tagId || '',
}))

const emptyMessage = computed(() => {
  if (currentFilters.keyword) return '没有找到匹配的题目，换个关键词试试'
  if (currentFilters.difficulty || currentFilters.tagId) return '当前筛选条件下没有题目'
  return store.isLoggedIn ? '还没有题目，点击上方「新增题目」开始吧' : '还没有题目'
})

let currentFilters = {}

function syncQueryToUrl() {
  const query = {}
  if (currentFilters.keyword) query.keyword = currentFilters.keyword
  if (currentFilters.difficulty) query.difficulty = currentFilters.difficulty
  if (currentFilters.tagId) query.tagId = currentFilters.tagId
  router.replace({ query })
}

async function fetchList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, ...currentFilters }
    const data = currentFilters.keyword
      ? await questionAPI.search(params)
      : await questionAPI.getList(params)

    list.value = data.list || []
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (err) {
    errorMsg.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function handleFilterChange(filters) {
  currentFilters = { ...filters }
  pagination.page = 1
  syncQueryToUrl()
  fetchList()
}

function handlePageChange(page) {
  pagination.page = page
  fetchList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleDelete(id) {
  const ok = await showConfirm('确定删除这道题目吗？', { danger: true })
  if (!ok) return
  try {
    await questionAPI.remove(id)
    toast.success('删除成功')
    fetchList()
  } catch (err) {
    toast.error(err.message || '删除失败')
  }
}

onMounted(() => {
  currentFilters = {
    keyword: route.query.keyword || '',
    difficulty: route.query.difficulty || '',
    tagId: route.query.tagId || '',
    isMistake: false,
  }
  fetchList()
})
</script>
