<script setup lang="ts">
/**
 * web/pages/shuttle/builder.vue
 * Bilingual files (XLIFF, MXLIFF, etc.) targets update using ShWvData.
 */
definePageMeta({
  title: 'ビルド',
  icon: 'hammer',
})

import { ref, computed, watch } from 'vue'
import { FileUp, Trash2, Download, Hammer, Loader2, CheckCircle, AlertTriangle, Archive, HelpCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useShuttleStore } from '../../stores/shuttleStore'
import { FileIO } from '../../utils/fileIO'
import JSZip from 'jszip'
import AppCardCollapse from '../../components/common/AppCardCollapse.vue'
import type { ShWvData, ShWvFileInfo } from '@sheep-family/types'

const store = useShuttleStore()
const { t } = useI18n()

// Files state
const xliffInput = ref<HTMLInputElement | null>(null)
const jsonInput = ref<HTMLInputElement | null>(null)

// Collapse state
const isXliffOpen = ref(true)
const isShwvOpen = ref(false)
const isActionsOpen = ref(false)

interface XliffFileState {
  name: string
  content: string
  size: number
  matchedIndex: number // Index in shwvData.meta.files. -1: No match, -2: Use entire ShWvData (all units)
  status: 'pending' | 'success' | 'error'
  errorMsg?: string
  rebuiltContent?: string
}

const xliffFiles = ref<XliffFileState[]>([])
const shwvData = ref<ShWvData | null>(null)
const shwvFileName = ref('')
const isProcessing = ref(false)

const useActiveStoreData = ref(false)

watch(
  () => store.data,
  (newData) => {
    if (useActiveStoreData.value) {
      shwvData.value = newData
      shwvFileName.value = newData ? `(Active Project Data: ${store.currentFileName || 'Unnamed'})` : ''
      // Re-run matching for existing files
      for (const f of xliffFiles.value) {
        f.matchedIndex = performAutoMatch(f.name)
      }
    }
  },
  { deep: true }
)

watch(useActiveStoreData, (val) => {
  if (val) {
    shwvData.value = store.data
    shwvFileName.value = store.data ? `(Active Project Data: ${store.currentFileName || 'Unnamed'})` : ''
    isActionsOpen.value = true
  } else {
    shwvData.value = null
    shwvFileName.value = ''
  }
  // Re-run matching for existing files
  for (const f of xliffFiles.value) {
    f.matchedIndex = performAutoMatch(f.name)
  }
})

// Drag and drop states
const isXliffDragOver = ref(false)
const isJsonDragOver = ref(false)

// Options computed
const shwvFileOptions = computed(() => {
  if (!shwvData.value?.meta?.files) return []
  return shwvData.value.meta.files.map((f, index) => ({
    label: `${f.name} (${f.end - f.start + 1} units)`,
    value: index
  }))
})

// Auto match logic
const performAutoMatch = (filename: string): number => {
  if (!shwvData.value?.meta?.files) {
    // If no meta.files, but we have units, map to "Use entire ShWvData"
    if (shwvData.value?.body?.units?.length) {
      return -2
    }
    return -1
  }

  const cleanName = (name: string) => name.replace(/\.[^/.]+$/, '').toLowerCase()
  const cleanTarget = cleanName(filename)

  // Try exact match or base name match
  const idx = shwvData.value.meta.files.findIndex(f => {
    return cleanName(f.name) === cleanTarget || f.name.toLowerCase() === filename.toLowerCase()
  })

  return idx
}

// Handle file selections
const handleXliffDrop = (e: DragEvent) => {
  e.preventDefault()
  isXliffDragOver.value = false
  if (e.dataTransfer?.files) {
    addXliffFiles(Array.from(e.dataTransfer.files))
  }
}

const handleXliffSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    addXliffFiles(Array.from(target.files))
  }
}

const addXliffFiles = async (files: File[]) => {
  const allowedExts = ['xlf', 'xliff', 'mxliff', 'mqxliff', 'sdlxliff']
  const validFiles = files.filter(f => {
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    return allowedExts.includes(ext)
  })

  for (const file of validFiles) {
    try {
      const text = await file.text()
      const state: XliffFileState = {
        name: file.name,
        content: text,
        size: file.size,
        matchedIndex: -1,
        status: 'pending'
      }
      // Set initial match
      state.matchedIndex = performAutoMatch(file.name)
      xliffFiles.value.push(state)
    } catch (err: any) {
      console.error('Failed to read file:', file.name, err)
    }
  }

  if (xliffFiles.value.length > 0) {
    isShwvOpen.value = true
  }
}

const handleJsonDrop = async (e: DragEvent) => {
  e.preventDefault()
  isJsonDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.name.endsWith('.json')) {
    await loadShwvJson(file)
  }
}

const handleJsonSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await loadShwvJson(file)
  }
}

const loadShwvJson = async (file: File) => {
  try {
    store.setStatus(t('shuttle.builder.msg_loading'), 'info')
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.define || data.define.name !== 'SHWV_DATA') {
      throw new Error('Invalid ShWvData file (define.name is not SHWV_DATA)')
    }

    shwvData.value = data
    shwvFileName.value = file.name
    isActionsOpen.value = true

    // Re-run matching for existing files
    for (const f of xliffFiles.value) {
      f.matchedIndex = performAutoMatch(f.name)
    }

    store.setStatus('', 'info')
  } catch (err: any) {
    console.error(err)
    store.setStatus(t('shuttle.builder.msg_error', { message: err.message }), 'error')
  }
}

const removeXliffFile = (index: number) => {
  xliffFiles.value.splice(index, 1)
}

const clearAll = () => {
  xliffFiles.value = []
  shwvData.value = null
  shwvFileName.value = ''
  useActiveStoreData.value = false
  isXliffOpen.value = true
  isShwvOpen.value = false
  isActionsOpen.value = false
  store.setStatus('', 'info')
}

// Rebuild logic
const doBuild = async () => {
  if (!shwvData.value) return
  isProcessing.value = true
  store.setStatus(t('shuttle.builder.msg_loading'), 'info')

  let successCount = 0
  let errorCount = 0

  for (const file of xliffFiles.value) {
    if (file.matchedIndex === -1) {
      file.status = 'pending'
      continue
    }

    try {
      let fileUnits = []
      if (file.matchedIndex === -2) {
        fileUnits = shwvData.value.body.units
      } else if (file.matchedIndex >= 0) {
        const fileInfo = shwvData.value.meta.files[file.matchedIndex]
        if (fileInfo) {
          fileUnits = shwvData.value.body.units.slice(fileInfo.start, fileInfo.end + 1)
        }
      }

      const fileShwvData = {
        ...shwvData.value,
        body: {
          ...shwvData.value.body,
          units: fileUnits
        }
      }

      // Run core builder
      const rebuiltXml = await store.shuttle.builder.build(file.content, fileShwvData)
      file.rebuiltContent = rebuiltXml
      file.status = 'success'
      file.errorMsg = undefined
      successCount++
    } catch (err: any) {
      console.error('Build error for file:', file.name, err)
      file.status = 'error'
      file.errorMsg = err.message || 'Unknown build error'
      errorCount++
    }
  }

  isProcessing.value = false
  if (errorCount > 0) {
    store.setStatus(t('shuttle.builder.msg_error', { message: `${successCount} built successfully, ${errorCount} failed.` }), 'error')
  } else {
    store.setStatus(t('shuttle.builder.msg_success'), 'success')
  }
}

// Download individual file
const downloadFile = (file: XliffFileState) => {
  if (file.rebuiltContent) {
    FileIO.download(file.rebuiltContent, file.name)
  }
}

// Download all as ZIP
const downloadAllAsZip = async () => {
  const successFiles = xliffFiles.value.filter(f => f.status === 'success' && f.rebuiltContent)
  if (successFiles.length === 0) return

  const zip = new JSZip()
  for (const file of successFiles) {
    zip.file(file.name, file.rebuiltContent!)
  }

  try {
    const blob = await zip.generateAsync({ type: 'blob' })
    FileIO.download(blob, 'rebuilt_bilingual_files.zip')
  } catch (err: any) {
    console.error('ZIP generation failed:', err)
    store.setStatus(t('shuttle.builder.msg_error', { message: 'ZIP generation failed' }), 'error')
  }
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Stats helper
const getUnitsCountString = (matchedIndex: number) => {
  if (!shwvData.value) return ''
  if (matchedIndex === -2) {
    return t('shuttle.builder.desc_units', { count: shwvData.value.body.units.length })
  }
  if (matchedIndex >= 0) {
    const fileInfo = shwvData.value.meta.files[matchedIndex]
    if (fileInfo) {
      return t('shuttle.builder.desc_units', { count: fileInfo.end - fileInfo.start + 1 })
    }
  }
  return ''
}
</script>

<template>
  <div class="builder-view">
    <div class="builder-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Bilingual Files Card -->
        <AppCardCollapse v-model:open="isXliffOpen" :title="$t('shuttle.builder.upload_xliff')">
          <template #header>
            <div class="card-title-group">
              <FileUp :size="16" class="header-icon" />
              <h2 class="card-title">{{ $t('shuttle.builder.upload_xliff') }}</h2>
            </div>
          </template>
          <template #actions>
            <span v-if="xliffFiles.length > 0" class="badge-mini badge-pass">
              {{ xliffFiles.length }}
            </span>
          </template>

          <div
            class="drop-zone"
            :class="{ active: isXliffDragOver }"
            @dragover.prevent="isXliffDragOver = true"
            @dragleave="isXliffDragOver = false"
            @drop="handleXliffDrop"
            @click="xliffInput?.click()"
          >
            <FileUp :size="24" class="drop-icon" />
            <p v-if="xliffFiles.length === 0">{{ $t('shuttle.builder.upload_xliff_desc') }}</p>
            <p v-else class="file-count">{{ $t('shuttle.parser.files_selected', { count: xliffFiles.length }) }}</p>
            <input type="file" ref="xliffInput" hidden multiple accept=".xlf,.xliff,.mxliff,.mqxliff,.sdlxliff" @change="handleXliffSelect" />
          </div>
        </AppCardCollapse>

        <!-- ShWvData Card -->
        <AppCardCollapse v-model:open="isShwvOpen" :title="$t('shuttle.builder.upload_shwv')">
          <template #header>
            <div class="card-title-group">
              <FileUp :size="16" class="header-icon" />
              <h2 class="card-title">{{ $t('shuttle.builder.upload_shwv') }}</h2>
            </div>
          </template>
          <template #actions>
            <span v-if="shwvData" class="badge-mini badge-pass">
              {{ $t('shuttle.builder.desc_units', { count: shwvData.body?.units?.length || 0 }) }}
            </span>
          </template>

          <div style="margin-bottom: 12px;" v-if="store.hasData">
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary);">
              <input type="checkbox" v-model="useActiveStoreData" style="accent-color: var(--accent);" />
              <span>{{ $t('shuttle.builder.lbl_use_active_data') }}</span>
            </label>
          </div>

          <div
            v-if="!useActiveStoreData"
            class="drop-zone"
            :class="{ active: isJsonDragOver }"
            @dragover.prevent="isJsonDragOver = true"
            @dragleave="isJsonDragOver = false"
            @drop="handleJsonDrop"
            @click="jsonInput?.click()"
          >
            <FileUp :size="24" class="drop-icon" />
            <p v-if="!shwvData">{{ $t('shuttle.builder.upload_shwv_desc') }}</p>
            <p v-else class="file-count">{{ shwvFileName }}</p>
            <input type="file" ref="jsonInput" hidden accept=".json" @change="handleJsonSelect" />
          </div>
          <div v-else class="active-data-info" style="padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.82rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
            <div style="font-weight: 600; color: var(--accent);">{{ shwvFileName }}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">{{ $t('shuttle.builder.desc_units', { count: store.shwvUnitCount }) }}</div>
          </div>
        </AppCardCollapse>

        <!-- Actions -->
        <AppCardCollapse v-model:open="isActionsOpen" :title="$t('shuttle.parser.actions_title')">
          <template #header>
            <div class="card-title-group">
              <Hammer :size="16" class="header-icon" />
              <h2 class="card-title">{{ $t('shuttle.parser.actions_title') }}</h2>
            </div>
          </template>

          <div class="actions-body">
            <!-- 1. メインビルドボタン (全幅) -->
            <button class="btn-run-build" @click="doBuild" :disabled="xliffFiles.length === 0 || !shwvData || isProcessing">
              <Loader2 v-if="isProcessing" class="spin" :size="16" />
              <Hammer v-else :size="16" />
              <span>{{ isProcessing ? 'ビルド実行中...' : $t('shuttle.builder.btn_build') }}</span>
            </button>

            <!-- 2. サブアクション (ZIP一括保存 & クリア) -->
            <div class="sub-actions-row">
              <button 
                class="btn-sub-action" 
                @click="downloadAllAsZip" 
                :disabled="xliffFiles.length === 0 || !xliffFiles.some(f => f.status === 'success') || isProcessing"
                :title="$t('shuttle.builder.btn_download_all')"
              >
                <Archive :size="14" />
                <span>{{ $t('shuttle.builder.btn_download_all') }}</span>
              </button>
              <button 
                class="btn-sub-action btn-sub-clear" 
                @click="clearAll" 
                :disabled="isProcessing"
                title="選択ファイルとデータをクリア"
              >
                <Trash2 :size="14" />
                <span>クリア</span>
              </button>
            </div>
          </div>
        </AppCardCollapse>

        <!-- Status Message -->
        <div class="status-msg" v-if="store.statusMsg.text" :class="store.statusMsg.type">
          {{ store.statusMsg.text }}
        </div>
      </aside>

      <!-- Main Content -->
      <section class="results-area">
        <div class="card full-height">
          <div class="card-header space-between">
            <h2>{{ $t('shuttle.builder.file_list_title') }}</h2>
            <span class="badge" v-if="xliffFiles.length > 0">
              {{ xliffFiles.length }} files
            </span>
          </div>

          <div class="file-table-container" v-if="xliffFiles.length > 0">
            <div class="file-list-cards">
              <div v-for="(file, index) in xliffFiles" :key="file.name" class="file-item-card">
                <div class="file-item-header">
                  <div class="file-info-group">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatSize(file.size) }}</span>
                  </div>
                  <div class="status-badge-group">
                    <span class="status-badge" :class="file.status">
                      {{ $t(`shuttle.builder.status_${file.status}`) }}
                    </span>
                    <button class="btn-icon-clear" @click="removeXliffFile(index)">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>

                <div class="file-item-body">
                  <!-- Match settings -->
                  <div class="matching-container">
                    <label class="match-label">{{ $t('shuttle.builder.lbl_override') }}</label>
                    <div class="match-input-group" v-if="shwvData">
                      <select v-model="file.matchedIndex" class="select-sm match-select">
                        <option :value="-1">{{ $t('shuttle.builder.option_no_match') }}</option>
                        <option v-if="shwvData.body.units.length > 0" :value="-2">
                          Use entire ShWvData ({{ shwvData.body.units.length }} units)
                        </option>
                        <option v-for="opt in shwvFileOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </option>
                      </select>
                      <span class="units-badge" v-if="file.matchedIndex !== -1">
                        {{ getUnitsCountString(file.matchedIndex) }}
                      </span>
                    </div>
                    <div class="no-json-warning" v-else>
                      <AlertTriangle :size="14" />
                      <span>ShWvData をロードしてください</span>
                    </div>
                  </div>

                  <!-- Error message -->
                  <div class="error-banner" v-if="file.status === 'error' && file.errorMsg">
                    <AlertTriangle :size="14" />
                    <span>{{ file.errorMsg }}</span>
                  </div>

                  <!-- Download action -->
                  <div class="download-action-row" v-if="file.status === 'success' && file.rebuiltContent">
                    <button class="btn-outline btn-sm" @click="downloadFile(file)">
                      <Download :size="14" />
                      <span>ダウンロード</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" v-else>
            <HelpCircle :size="48" class="empty-icon" />
            <p>{{ $t('shuttle.builder.empty_files') }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.builder-view {
  padding: 24px;
}

.builder-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .builder-layout {
    flex-direction: column;
  }
}

.sidebar {
  width: 350px;
  flex-shrink: 0;
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 90px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--accent);
}

.card-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.badge-mini {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 700;
}

.badge-mini.badge-pass {
  background: var(--success);
  color: white;
}

.file-count {
  color: var(--accent);
  font-weight: 600;
  text-align: center;
  word-break: break-all;
}

.results-area {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.card.full-height {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  width: 100%;
}

.card-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header.space-between {
  justify-content: space-between;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
  flex: 1;
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.actions-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-run-build {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
  white-space: nowrap;
}

.btn-run-build:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn-run-build:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.sub-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-sub-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-xs);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}

.btn-sub-action:hover:not(:disabled) {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.btn-sub-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-sub-clear:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  color: var(--error);
  border-color: rgba(239, 68, 68, 0.3);
}

.file-table-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.file-list-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-item-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: var(--transition);
}

.file-item-card:hover {
  border-color: var(--accent-glow);
  background: rgba(255, 255, 255, 0.04);
}

.file-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.file-info-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.file-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.status-badge-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.status-badge.success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.btn-icon-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  transition: var(--transition);
}

.btn-icon-clear:hover {
  color: var(--error);
  opacity: 1;
}

.file-item-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.matching-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.match-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}

.match-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 260px;
}

.match-select {
  flex: 1;
  max-width: 400px;
}

.units-badge {
  font-size: 0.75rem;
  background: var(--bg-secondary);
  color: var(--accent-light);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 4px;
}

.no-json-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f59e0b;
  font-size: 0.8rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
}

.download-action-row {
  display: flex;
  justify-content: flex-start;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.78rem;
}
</style>
