<script setup lang="ts">
definePageMeta({
  title: 'テキストチャンク',
  icon: 'scissors',
})

import { ref, computed } from 'vue'
import { Scissors, Layers, Trash2, Copy, Check, Pencil, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'

const inputText = ref('')
const chunkSize = ref(3000)
const removeDuplicates = ref(false)
const isBlockView = ref(false)
const collapsedBlocks = ref<Set<number>>(new Set())
const copiedIndex = ref<number | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const CHUNK_MARK_SPLIT_RE = /(?:\r?\n)?--- CHUNK \d+ ---(?:\r?\n)?/

const chunkCount = computed(() => {
  if (!inputText.value) return 0
  const matches = inputText.value.match(/--- CHUNK \d+ ---/g)
  return (matches ? matches.length : 0) + 1
})

const chunkBlocks = computed(() => {
  if (!inputText.value) return []
  return inputText.value.split(CHUNK_MARK_SPLIT_RE)
})

const runChunk = () => {
  // First clear any existing chunk marks to avoid nesting/duplication
  let text = inputText.value.replace(/--- CHUNK \d+ ---\n?/g, '')
  if (!text) return
  
  let lines = text.split('\n')
  
  if (removeDuplicates.value) {
    const seen = new Set<string>()
    lines = lines.filter(line => {
      if (line.trim() === '') return true // 空行は重複除外しない
      if (seen.has(line)) return false
      seen.add(line)
      return true
    })
  }

  const chunks = []
  let currentChunk = []
  let currentLength = 0
  
  for (const line of lines) {
    if (currentLength + line.length > chunkSize.value && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'))
      currentChunk = [line]
      currentLength = line.length + 1
    } else {
      currentChunk.push(line)
      currentLength += line.length + 1
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'))
  }
  
  let result = chunks[0] || ''
  for (let i = 1; i < chunks.length; i++) {
    result += `\n--- CHUNK ${i} ---\n` + chunks[i]
  }
  
  inputText.value = result
  collapsedBlocks.value = new Set()
}

const clearChunks = () => {
  inputText.value = inputText.value.replace(/--- CHUNK \d+ ---\n?/g, '')
  isBlockView.value = false
  collapsedBlocks.value = new Set()
}

const toggleBlockView = () => {
  if (!inputText.value) return
  isBlockView.value = !isBlockView.value
}

const isBlockOpen = (index: number) => !collapsedBlocks.value.has(index)

const handleBlockToggle = (index: number, event: Event) => {
  const details = event.target as HTMLDetailsElement | null
  if (!details) return
  const next = new Set(collapsedBlocks.value)
  if (details.open) {
    next.delete(index)
  } else {
    next.add(index)
  }
  collapsedBlocks.value = next
}

const allCollapsed = computed(
  () => chunkBlocks.value.length > 0 && chunkBlocks.value.every((_, i) => collapsedBlocks.value.has(i))
)

const toggleAllBlocks = () => {
  if (allCollapsed.value) {
    collapsedBlocks.value = new Set()
  } else {
    collapsedBlocks.value = new Set(chunkBlocks.value.map((_, i) => i))
  }
}

const copyBlock = async (text: string, index: number) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = index
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      if (copiedIndex.value === index) {
        copiedIndex.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>

<template>
  <div class="chunk-view">
    <div class="chunk-layout">
      <!-- Sidebar: Controls -->
      <aside class="sidebar">
        <div class="card">
          <div class="card-header">
            <h2>テキストチャンクツール</h2>
          </div>
          <div class="action-list">
            <div class="input-group">
              <label for="chunk-size">チャンクサイズ</label>
              <input 
                id="chunk-size"
                type="number" 
                v-model.number="chunkSize" 
                min="1" 
                class="num-input" 
              />
            </div>

            <label class="checkbox-label">
              <input type="checkbox" v-model="removeDuplicates" />
              <span>重複する行を削除する</span>
            </label>
            
            <button class="btn primary" @click="runChunk" :disabled="!inputText">
              <Scissors :size="18" /> 実行
            </button>

            <button
              class="btn outline"
              :class="{ active: isBlockView && inputText }"
              @click="toggleBlockView"
              :disabled="!inputText"
            >
              <Layers :size="18" /> ブロック分割
            </button>
            
            <button class="btn outline" @click="clearChunks" :disabled="!inputText">
              <Trash2 :size="18" /> チャンクマーク消去
            </button>
          </div>
          
          <div class="stats-box" v-if="inputText">
            <div class="stat-item">
              <span class="stat-label">現在のチャンク数</span>
              <span class="stat-value">{{ chunkCount }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="card fill-height">
          <div class="card-header space-between">
            <h3>{{ isBlockView && inputText ? `ブロック分割 (${chunkBlocks.length})` : 'テキスト入力' }}</h3>
            <div v-if="isBlockView && inputText" class="header-actions">
              <button
                class="btn-outline"
                @click="toggleAllBlocks"
              >
                <ChevronsUpDown :size="14" /> {{ allCollapsed ? 'すべて展開' : 'すべて折りたたむ' }}
              </button>
              <button
                class="btn-outline"
                @click="isBlockView = false"
              >
                <Pencil :size="14" /> テキスト編集に戻る
              </button>
            </div>
          </div>
          <div v-if="isBlockView && inputText" class="blocks-area">
            <details
              v-for="(block, index) in chunkBlocks"
              :key="index"
              class="chunk-block"
              :open="isBlockOpen(index)"
              @toggle="handleBlockToggle(index, $event)"
            >
              <summary class="chunk-block-header">
                <div class="chunk-block-meta">
                  <ChevronDown :size="16" class="chunk-chevron" />
                  <span class="chunk-badge">CHUNK {{ index + 1 }}</span>
                  <span class="chunk-length">{{ block.length.toLocaleString() }} 文字</span>
                </div>
                <button
                  type="button"
                  class="btn-copy"
                  @click.stop.prevent="copyBlock(block, index)"
                  :title="copiedIndex === index ? 'コピーしました' : 'コピー'"
                >
                  <Check v-if="copiedIndex === index" :size="14" class="copy-done" />
                  <Copy v-else :size="14" />
                  <span>{{ copiedIndex === index ? 'コピー済み' : 'コピー' }}</span>
                </button>
              </summary>
              <pre class="chunk-pre"><code>{{ block }}</code></pre>
            </details>
          </div>
          <div v-else class="editor-area">
            <textarea
              v-model="inputText"
              placeholder="ここにテキストを入力してください..."
              class="text-area"
            ></textarea>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.chunk-view {
  min-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.chunk-layout {
  display: flex;
  gap: 24px;
  flex: 1;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 84px;
  align-self: start;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fill-height {
  height: 100%;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.card-header h2, .card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.action-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.input-group label {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
}

.checkbox-label input {
  cursor: pointer;
}

.stats-box {
  padding: 16px 20px;
  background: var(--bg-hover);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--text-muted, #6b7280);
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

.num-input {
  padding: 10px 12px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition, all 0.2s);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--accent);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn.outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn.outline:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn.outline.active {
  border-color: var(--accent);
  color: var(--accent-light);
  background: var(--accent-glow);
}

.editor-area {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.blocks-area {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chunk-block {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-input);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chunk-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: var(--transition);
}

.chunk-block-header::-webkit-details-marker {
  display: none;
}

.chunk-block-header:hover {
  background: var(--bg-hover);
}

.chunk-block[open] > .chunk-block-header {
  border-bottom: 1px solid var(--border);
}

.chunk-chevron {
  color: var(--text-secondary);
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
  flex-shrink: 0;
}

.chunk-block[open] .chunk-chevron {
  transform: rotate(0deg);
}

.chunk-block-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chunk-badge {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--accent-light);
  background: var(--accent-glow);
  border: 1px solid var(--border-accent);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.chunk-length {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-xs);
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: var(--transition);
}

.btn-copy:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
  background: var(--bg-hover);
}

.copy-done {
  color: var(--success);
}

.chunk-pre {
  margin: 0;
  padding: 16px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  user-select: text;
}

.chunk-pre code {
  font-family: inherit;
  font-size: inherit;
  background: transparent;
  padding: 0;
}

.text-area {
  flex: 1;
  min-height: 420px;
  width: 100%;
  resize: vertical;
  padding: 16px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-primary);
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
}

.text-area:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
