<template>
  <div class="filter-bar">
    <div class="search-box">
      <span class="search-box__icon">🔍</span>
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索题目标题或内容..."
        @input="onKeywordInput"
      />
      <button v-if="keyword" class="search-box__clear" @click="clearKeyword">✕</button>
    </div>

    <div class="filter-bar__group">
      <select v-model="difficulty" @change="emitChange">
        <option value="">全部难度</option>
        <option value="easy">简单</option>
        <option value="medium">中等</option>
        <option value="hard">困难</option>
      </select>

      <select v-model="tagId" @change="emitChange">
        <option value="">全部标签</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.id">
          {{ tag.name }} ({{ tag.question_count }})
        </option>
      </select>

      <button
        v-if="store.isLoggedIn"
        type="button"
        :class="['toggle-btn', { active: isMistake }]"
        @click="toggleMistake"
      >
        仅看收藏
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { tagAPI } from '../api/tag'
import { useUserStore } from '../stores/user'

const store = useUserStore()

const props = defineProps({
  initialKeyword: { type: String, default: '' },
  initialDifficulty: { type: String, default: '' },
  initialTagId: { type: [String, Number], default: '' },
})

const emit = defineEmits(['filter-change'])

const keyword = ref(props.initialKeyword)
const difficulty = ref(props.initialDifficulty)
const tagId = ref(props.initialTagId ? String(props.initialTagId) : '')
const isMistake = ref(false)
const tags = ref([])

let timer = null

watch(
  () => [props.initialKeyword, props.initialDifficulty, props.initialTagId],
  ([kw, diff, tid]) => {
    keyword.value = kw || ''
    difficulty.value = diff || ''
    tagId.value = tid ? String(tid) : ''
  }
)

function onKeywordInput() {
  clearTimeout(timer)
  timer = setTimeout(emitChange, 300)
}

function clearKeyword() {
  keyword.value = ''
  emitChange()
}

function toggleMistake() {
  isMistake.value = !isMistake.value
  emitChange()
}

function emitChange() {
  emit('filter-change', {
    keyword: keyword.value,
    difficulty: difficulty.value,
    tagId: tagId.value,
    isMistake: isMistake.value,
  })
}

onMounted(async () => {
  try {
    const data = await tagAPI.getList()
    tags.value = data || []
  } catch (err) {
    console.error('加载标签失败:', err)
    tags.value = []
  }
})
</script>
