<!-- eslint-disable vue/no-mutating-props -->
<template>
  <AppLayout>
    <div class="editor-page">
      <div v-if="loading && isEditMode" class="state">
        <div class="spinner"></div>
        <p>加载中<span class="loading-dots"></span></p>
      </div>

      <div v-else>
        <router-link to="/questions" class="back-link">← 返回列表</router-link>

        <div class="editor__header">
          <h2>{{ isEditMode ? '编辑题目' : '新增题目' }}</h2>
          <div v-if="isEditMode" style="margin-left: auto; display: flex; gap: 8px;">
            <button
              type="button"
              :class="['btn-fav', { active: form.isMistake }]"
              @click="handleToggleMistake"
            >
              {{ form.isMistake ? '已收藏' : '收藏' }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="handleDelete">
              删除
            </button>
          </div>
        </div>


        <form class="editor__form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group form-group--half">
              <label>标题 <span class="required">*</span></label>
              <input v-model="form.title" type="text" placeholder="请输入题目标题" />
              <p v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</p>
            </div>

            <div class="form-group form-group--half">
              <label>难度 <span class="required">*</span></label>
              <select v-model="form.difficulty">
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>来源</label>
            <input v-model="form.source" type="text" placeholder="例如：美团面试题、LeetCode 第 1 题" />
          </div>

          <div class="form-group">
            <label>标签</label>
            <div class="tags-area">
              <div class="tags-selected">
                <span v-if="selectedTags.length === 0" class="tags-empty">尚未选择标签</span>
                <span v-for="tag in selectedTags" :key="tag._key" class="tag--selected">
                  {{ tag.name }}
                  <button type="button" class="tag-remove" @click="removeTag(tag)">✕</button>
                </span>
              </div>
              <div class="tags-add-row">
                <select v-model="newTagId" class="tag-select">
                  <option value="">选择已有标签...</option>
                  <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
                </select>
                <span class="tags-or">或</span>
                <input v-model="newTagName" class="tag-input" placeholder="输入新标签" @keydown.enter.prevent="addTag" />
                <button type="button" class="btn-tag-add" :disabled="!newTagId && !newTagName.trim()" @click="addTag">添加</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>题解内容 <span class="required">*</span> <span style="font-weight:400;color:var(--color-text-muted);font-size:13px;">支持 Markdown</span></label>
            <div class="md-editor">
              <div class="md-editor__textarea-wrap">
                <textarea v-model="form.content" class="md-editor__textarea" placeholder="请用 Markdown 格式写你的题解..." @input="clearFieldError('content')"></textarea>
                <button type="button" class="btn-toggle-preview-float" @click="showPreview = !showPreview">
                  {{ showPreview ? '编辑' : '预览' }}
                </button>
              </div>
              <div v-if="showPreview" class="md-editor__preview">
                <div class="md-editor__preview-header">
                  <span class="md-editor__preview-label">预览</span>
                </div>
                <div class="md-editor__preview-content markdown-body" v-html="previewHtml"></div>
              </div>
            </div>
            <p v-if="fieldErrors.content" class="field-error">{{ fieldErrors.content }}</p>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
            <router-link to="/questions" class="btn btn-ghost">取消</router-link>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import AppLayout from '../components/AppLayout.vue'
import { questionAPI } from '../api/question'
import { tagAPI } from '../api/tag'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()
const { showConfirm } = useConfirm()
const toast = useToast()

const isEditMode = computed(() => !!route.params.id)
const editId = computed(() => route.params.id || null)

const loading = ref(false)
const submitting = ref(false)
const showPreview = ref(false)

const form = reactive({
  title: '',
  difficulty: 'medium',
  source: '',
  content: '',
  isMistake: false,
})

const fieldErrors = reactive({ title: '', content: '' })
const selectedTags = ref([])
const allTags = ref([])
const newTagId = ref('')
const newTagName = ref('')

const availableTags = computed(() =>
  allTags.value.filter(t => !selectedTags.value.some(s => s.id === t.id))
)

const previewHtml = computed(() => {
  if (!form.content) return '<p style="color:#9ca3af;">输入内容后可预览效果</p>'
  return DOMPurify.sanitize(marked.parse(form.content))
})

function validate() {
  let valid = true
  fieldErrors.title = ''
  fieldErrors.content = ''

  if (!form.title.trim()) {
    fieldErrors.title = '请输入题目标题'
    valid = false
  }
  if (!form.content.trim()) {
    fieldErrors.content = '请输入题解内容'
    valid = false
  }
  return valid
}

function clearFieldError(field) { fieldErrors[field] = '' }

function addTag() {
  // 从下拉框选已有标签
  const existing = allTags.value.find(t => t.id === Number(newTagId.value))
  if (existing && !selectedTags.value.some(s => s.id === existing.id)) {
    selectedTags.value.push({ ...existing, _key: existing.id })
    newTagId.value = ''
    return
  }

  // 手动输入标签名
  const name = newTagName.value.trim()
  if (!name) return

  // 先查数据库是否已存在同名标签
  const matched = allTags.value.find(t => t.name === name)
  if (matched) {
    if (!selectedTags.value.some(s => s.id === matched.id)) {
      selectedTags.value.push({ ...matched, _key: matched.id })
    }
    newTagName.value = ''
    return
  }

  // 数据库也没有，才是真正的新标签
  if (!selectedTags.value.some(s => s.name === name)) {
    selectedTags.value.push({ id: null, name, _key: Date.now() + Math.random() })
    newTagName.value = ''
  }
}

function removeTag(tag) {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true

  // 处理自定义新标签（id 为 null 的），先创建到后端拿到真实 id
  const customTags = selectedTags.value.filter(t => t.id === null)
  for (const tag of customTags) {
    try {
      const newTag = await tagAPI.create(tag.name)
      tag.id = newTag.id
    } catch (err) {
      toast.error(`标签 "${tag.name}" 创建失败`)
      submitting.value = false
      return
    }
  }

  const payload = {
    title: form.title.trim(),
    difficulty: form.difficulty,
    source: form.source.trim(),
    content: form.content,
    tagIds: selectedTags.value.map(t => t.id),
  }

  try {
    if (isEditMode.value) {
      const data = await questionAPI.update(editId.value, payload)
      toast.success('保存成功')
      router.push('/questions/' + data.id)
    } else {
      const data = await questionAPI.create(payload)
      toast.success('创建成功')
      router.push('/questions/' + data.id)
    }
  } catch (err) {
    toast.error(err.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  const ok = await showConfirm('确定删除这道题目吗？', { danger: true })
  if (!ok) return
  try {
    await questionAPI.remove(editId.value)
    toast.success('删除成功')
    router.push('/questions')
  } catch (err) {
    toast.error(err.message || '删除失败')
  }
}

async function handleToggleMistake() {
  try {
    const data = await questionAPI.toggleMistake(editId.value)
    form.isMistake = data.is_mistake
    toast.success(data.is_mistake ? '已收藏' : '已取消收藏')
  } catch (err) {
    toast.error(err.message || '操作失败')
  }
}

onMounted(async () => {
  try {
    const tagData = await tagAPI.getList()
    allTags.value = tagData || []
  } catch (err) {
    console.error('加载标签失败:', err)
  }

  if (isEditMode.value) {
    loading.value = true
    try {
      const data = await questionAPI.getById(editId.value)
      form.title = data.title || ''
      form.difficulty = data.difficulty || 'medium'
      form.source = data.source || ''
      form.content = data.content || ''
      form.isMistake = data.is_mistake || false
      selectedTags.value = (data.tags || []).map(t => ({ ...t, _key: t.id }))
    } catch (err) {
      toast.error(err.message || '加载失败')
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped>
.editor__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.editor__header h2 {
  font-size: 22px;
  color: var(--color-text);
  flex: 1;
}
.btn-fav {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-family: inherit;
}
.btn-fav.active {
  background: var(--color-warning-bg);
  border-color: #f0d060;
  color: var(--color-warning);
}
.editor__form { display: flex; flex-direction: column; gap: 20px; }
.editor__form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 0;
}
.editor__form .form-group label { font-weight: 600; color: var(--color-text); }
.required { color: var(--color-danger); }
.field-error { font-size: 13px; color: var(--color-danger); margin-top: 2px; }
.form-row { display: flex; gap: 16px; }
.form-group--half { flex: 1; }
.tags-area {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  background: var(--color-surface);
}
.tags-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  min-height: 28px;
  max-height: 260px;
  overflow-y: auto;
  align-content: flex-start;
}
.tags-empty { font-size: 13px; color: var(--color-text-muted); }
.tag--selected {
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
}
.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 0 2px;
}
.tag-remove:hover { color: var(--color-danger); }
.tags-add-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tag-select, .tag-input {
  flex: 1;
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  outline: none;
  font-family: inherit;
}
.tags-or { font-size: 12px; color: var(--color-text-muted); }
.btn-tag-add {
  padding: 8px 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}
.btn-tag-add:disabled { opacity: 0.4; cursor: not-allowed; }
.md-editor { display: flex; gap: 16px; min-height: 400px; }
.md-editor__textarea-wrap { flex: 1; position: relative; display: flex; }
.md-editor__textarea {
  flex: 1;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: var(--font-mono);
  line-height: 1.7;
  resize: vertical;
  min-height: 400px;
  outline: none;
}
.md-editor__textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 110, 232, 0.12);
}
.btn-toggle-preview-float {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.md-editor__preview {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.md-editor__preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.md-editor__preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.md-editor__preview-content { flex: 1; padding: 14px; overflow-y: auto; }
.form-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
@media (max-width: 768px) {
  .md-editor { flex-direction: column; min-height: auto; }
  .md-editor__textarea { min-height: 250px; }
  .md-editor__preview { min-height: 250px; }
  .form-row { flex-direction: column; }
}
</style>
