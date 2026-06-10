<template>
  <AppLayout>
    <div class="editor-page">
      <div v-if="loading" class="state"><p>加载中...</p></div>

      <div v-else-if="loadError" class="state state--error">
        <p>{{ loadError }}</p>
        <button class="btn-retry" @click="loadQuestion">重试</button>
        <router-link to="/questions" class="back-link">← 返回列表</router-link>
      </div>

      <template v-else>
        <header class="editor__header">
          <router-link to="/questions" class="back-link">← 返回列表</router-link>
          <h2>{{ isEditMode ? '编辑题目' : '新增题目' }}</h2>
          <button
            v-if="isEditMode"
            type="button"
            class="btn-fav"
            :class="{ active: form.isMistake }"
            @click="handleToggleMistake"
          >
            {{ form.isMistake ? '✅ 取消收藏' : '⭐ 收藏' }}
          </button>
        </header>

        <form class="editor__form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="title">题目标题 <span class="required">*</span></label>
            <input id="title" v-model="form.title" type="text" placeholder="例：Vue3 响应式原理" maxlength="200" />
            <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
          </div>

          <div class="form-row">
            <div class="form-group form-group--half">
              <label for="difficulty">难度</label>
              <select id="difficulty" v-model="form.difficulty">
                <option value="easy">🟢 简单</option>
                <option value="medium">🟡 中等</option>
                <option value="hard">🔴 困难</option>
              </select>
            </div>
            <div class="form-group form-group--half">
              <label for="source">来源</label>
              <input id="source" v-model="form.source" type="text" placeholder="例：字节跳动一面 / LeetCode 1" maxlength="100" />
            </div>
          </div>

          <div class="form-group">
            <label>标签</label>
            <div class="tags-area">
              <div class="tags-selected">
                <span v-if="selectedTags.length === 0" class="tags-empty">暂未选择标签</span>
                <span v-for="tag in selectedTags" :key="tag.id" class="tag tag--selected">
                  {{ tag.name }}
                  <button type="button" class="tag-remove" @click="removeTag(tag.id)">✕</button>
                </span>
              </div>
              <div class="tags-add-row">
                <select v-model="selectedTagId" class="tag-select" @change="addTagFromSelect">
                  <option value="">选择已有标签...</option>
                  <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
                </select>
                <span class="tags-or">或</span>
                <input v-model="newTagName" type="text" placeholder="新标签名" class="tag-input" maxlength="50" @keyup.enter.prevent="createTag" />
                <button type="button" class="btn-tag-add" :disabled="!newTagName.trim()" @click="createTag">+ 创建</button>
              </div>
              <span v-if="errors.tags" class="field-error">{{ errors.tags }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="content">题目内容（Markdown）</label>
                        <div class="md-editor" :class="{ 'md-editor--preview-hidden': !showPreview }">
              <div class="md-editor__textarea-wrap">
                <textarea id="content" v-model="form.content" placeholder="支持 Markdown 语法" class="md-editor__textarea"></textarea>
                <button type="button" class="btn-toggle-preview-float" @click="showPreview = !showPreview" v-if="!showPreview">📖 显示预览</button>
              </div>
              <div class="md-editor__preview" v-show="showPreview">
                <div class="md-editor__preview-header">
                  <span class="md-editor__preview-label">预览</span>
                  <button type="button" class="btn-toggle-preview" @click="showPreview = !showPreview">隐藏</button>
                </div>
                <div class="md-editor__preview-content" v-html="renderedMarkdown"></div>
              </div>
            </div>
          </div>

          <div v-if="submitError" class="form-error">{{ submitError }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? '保存中...' : (isEditMode ? '保存修改' : '创建题目') }}
            </button>
            <button v-if="isEditMode" type="button" class="btn-delete" @click="handleDelete">删除题目</button>
            <router-link to="/questions" class="btn-cancel">取消</router-link>
          </div>
        </form>
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
import { questionAPI } from '../api/question';
import { tagAPI } from '../api/tag';

const route = useRoute();
const router = useRouter();

const isEditMode = computed(() => !!route.params.id);
const editId = computed(() => route.params.id || null);

const loading = ref(false);
const loadError = ref('');
const submitting = ref(false);
const submitError = ref('');
const showPreview = ref(false);

const form = reactive({
  title: '',
  difficulty: 'medium',
  source: '',
  content: '',
  isMistake: false,
});

const errors = reactive({ title: '', tags: '' });

const allTags = ref([]);
const selectedTags = ref([]);
const selectedTagId = ref('');
const newTagName = ref('');

const availableTags = computed(() => {
  const selectedIds = new Set(selectedTags.value.map(t => t.id));
  return allTags.value.filter(t => !selectedIds.has(t.id));
});

const renderedMarkdown = computed(() => {
  if (!form.content) return '<p style="color:#ccc;">输入内容后这里显示预览</p>';
  return DOMPurify.sanitize(marked.parse(form.content));
});

async function loadTags() {
  try {
    const data = await tagAPI.getList();
    allTags.value = data || [];
  } catch (err) {
    console.error('加载标签失败:', err);
  }
}

async function loadQuestion() {
  if (!isEditMode.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const data = await questionAPI.getById(editId.value);
    form.title = data.title;
    form.difficulty = data.difficulty;
    form.source = data.source || '';
    form.content = data.content || '';
    form.isMistake = data.is_mistake;
    selectedTags.value = (data.tags || []).map(t => ({ id: t.id, name: t.name }));
  } catch (err) {
    loadError.value = err.message || '加载题目失败';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => { await loadTags(); await loadQuestion(); });

function addTagFromSelect() {
  const id = Number(selectedTagId.value);
  if (!id) return;
  const tag = allTags.value.find(t => t.id === id);
  if (!tag || selectedTags.value.some(t => t.id === id)) { selectedTagId.value = ''; return; }
  selectedTags.value.push({ id: tag.id, name: tag.name });
  selectedTagId.value = '';
}

async function createTag() {
  const name = newTagName.value.trim();
  if (!name || selectedTags.value.some(t => t.name === name)) { newTagName.value = ''; return; }
  try {
    const data = await tagAPI.create(name);
    const newTag = data || { id: Date.now(), name };
    allTags.value.push({ id: newTag.id, name: newTag.name, question_count: 0 });
    selectedTags.value.push({ id: newTag.id, name: newTag.name });
    newTagName.value = '';
  } catch (err) { alert(err.message || '创建标签失败'); }
}

function removeTag(tagId) { selectedTags.value = selectedTags.value.filter(t => t.id !== tagId); }

function validate() {
  let valid = true;
  if (!form.title.trim()) { errors.title = '请输入题目标题'; valid = false; } else { errors.title = ''; }
  errors.tags = '';
  return valid;
}

async function handleSubmit() {
  if (!validate()) return;
  submitting.value = true;
  submitError.value = '';
  const payload = { title: form.title.trim(), difficulty: form.difficulty, source: form.source.trim(), content: form.content, tagIds: selectedTags.value.map(t => t.id) };
  try {
    if (isEditMode.value) {
      const data = await questionAPI.update(editId.value, payload);
      router.push('/questions/' + data.id);
    } else {
      const data = await questionAPI.create(payload);
      router.push('/questions/' + data.id);
    }
  } catch (err) { submitError.value = err.message || '保存失败'; } finally { submitting.value = false; }
}

async function handleDelete() {
  if (!confirm('确定删除这道题目吗？')) return;
  try { await questionAPI.remove(editId.value); router.push('/questions'); } catch (err) { alert(err.message || '删除失败'); }
}

async function handleToggleMistake() {
  try { const data = await questionAPI.toggleMistake(editId.value); form.isMistake = data.is_mistake; } catch (err) { alert(err.message || '操作失败'); }
}
</script>

<style scoped>
.editor-page { /* 由 AppLayout 包裹 */ }

.editor__header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.editor__header h2 { font-size: 22px; color: #1a1a2e; flex: 1; }

.btn-fav { padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer; transition: all 0.2s; color: #666; }
.btn-fav.active { background: #fffbe6; border-color: #f0d060; color: #b8860b; }

.editor__form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 14px; font-weight: 600; color: #333; }
.required { color: #e74c3c; }
.form-group input[type="text"], .form-group select, .form-group textarea { padding: 10px 14px; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 15px; background: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }
.field-error { font-size: 13px; color: #e74c3c; margin-top: 2px; }
.form-row { display: flex; gap: 16px; }
.form-group--half { flex: 1; }

.tags-area { border: 1px solid #e0e0e0; border-radius: 10px; padding: 14px; background: #fff; }
.tags-selected { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; min-height: 28px; }
.tags-empty { font-size: 13px; color: #ccc; }
.tag { font-size: 13px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
.tag--selected { background: #eef0ff; color: #667eea; }
.tag-remove { background: none; border: none; cursor: pointer; font-size: 11px; color: #999; padding: 0 2px; line-height: 1; }
.tag-remove:hover { color: #e74c3c; }
.tags-add-row { display: flex; align-items: center; gap: 8px; }
.tag-select { flex: 1; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 13px; background: #fff; outline: none; }
.tags-or { font-size: 12px; color: #ccc; }
.tag-input { flex: 1; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 13px; outline: none; }
.btn-tag-add { padding: 8px 14px; background: #667eea; color: #fff; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; }
.btn-tag-add:disabled { opacity: 0.4; cursor: not-allowed; }

.md-editor { display: flex; gap: 16px; min-height: 400px; }
.md-editor--preview-hidden .md-editor__textarea-wrap { flex: 1; }
.md-editor__textarea-wrap { flex: 1; position: relative; display: flex; }
.md-editor__textarea { flex: 1; padding: 14px; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 15px; font-family: 'Menlo','Consolas',monospace; line-height: 1.7; resize: vertical; min-height: 400px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
.md-editor__textarea:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }
.btn-toggle-preview-float { position: absolute; top: 10px; right: 10px; padding: 6px 14px; border: 1px solid #667eea; border-radius: 6px; background: #667eea; color: #fff; font-size: 13px; cursor: pointer; z-index: 1; transition: opacity 0.2s; }
.btn-toggle-preview-float:hover { opacity: 0.85; }
.md-editor__preview { flex: 1; border: 1px solid #e0e0e0; border-radius: 10px; background: #fafbfc; display: flex; flex-direction: column; overflow: hidden; }
.md-editor__preview-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #eee; background: #fff; }
.md-editor__preview-label { font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
.btn-toggle-preview { padding: 4px 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; font-size: 12px; cursor: pointer; color: #888; }
.btn-toggle-preview:hover { border-color: #667eea; color: #667eea; }
.md-editor__preview-content { flex: 1; padding: 14px; overflow-y: auto; font-size: 14px; line-height: 1.75; color: #333; }
.md-editor__preview-content :deep(code) { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.md-editor__preview-content :deep(pre) { background: #2d2d2d; color: #f8f8f2; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
.md-editor__preview-content :deep(pre code) { background: none; padding: 0; }
.md-editor__preview-content :deep(h2), .md-editor__preview-content :deep(h3), .md-editor__preview-content :deep(h4) { margin: 16px 0 8px; color: #1a1a2e; }
.md-editor__preview-content :deep(ul), .md-editor__preview-content :deep(ol) { padding-left: 20px; }
.md-editor__preview-content :deep(p) { margin-bottom: 10px; }

.form-error { background: #fff0f0; color: #e74c3c; padding: 10px 14px; border-radius: 8px; font-size: 14px; }
.form-actions { display: flex; gap: 12px; align-items: center; padding-top: 4px; }
.btn-submit { padding: 12px 32px; background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-submit:hover { opacity: 0.9; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-delete { padding: 12px 24px; border: 1px solid #e0e0e0; border-radius: 10px; background: #fff; font-size: 14px; cursor: pointer; color: #e74c3c; transition: all 0.2s; }
.btn-delete:hover { background: #fff0f0; border-color: #e74c3c; }
.btn-cancel { padding: 12px 24px; border: 1px solid #e0e0e0; border-radius: 10px; background: #fff; font-size: 14px; cursor: pointer; color: #666; text-decoration: none; transition: all 0.2s; }
.btn-cancel:hover { border-color: #999; color: #333; }

.state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; color: #999; }
.state--error { color: #e74c3c; }
.btn-retry { margin-top: 12px; margin-bottom: 12px; padding: 8px 20px; border: 1px solid #e74c3c; border-radius: 8px; background: #fff; color: #e74c3c; cursor: pointer; display: inline-block; }
.back-link { color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
    .md-editor { flex-direction: column; min-height: auto; }
  .md-editor__textarea-wrap { min-height: 250px; }
  .md-editor__textarea { min-height: 250px; }
  .md-editor__preview { min-height: 250px; }
  .form-row { flex-direction: column; }
}
</style>
