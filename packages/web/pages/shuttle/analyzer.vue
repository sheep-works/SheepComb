<script setup lang="ts">
/**
 * web/pages/shuttle/analyzer.vue
 * 翻訳対象ファイルの構造化および TM/TB / 内部類似度の解析を一括実行する画面。
 */
definePageMeta({
  title: 'Analyzer',
  icon: 'zap',
})

import { ref, computed } from 'vue'
import { FileUp, Trash2, Play, CheckCircle, AlertCircle, Database, Book, Layers, Download, ArrowRight, Settings2, BarChart2, Search } from 'lucide-vue-next'
import { useShuttleStore } from '../../stores/shuttleStore'
import { initWasm, getWasm } from '~/utils/wasm'
import { FileIO } from '../../utils/fileIO'
import { useI18n } from 'vue-i18n'
import AppCardCollapse from '../../components/common/AppCardCollapse.vue'

const store = useShuttleStore()
const router = useRouter()
const { t } = useI18n()

const isProcessing = ref(false)
const statusMsg = ref({ text: '', type: 'info' as 'info' | 'success' | 'error' })

// カード開閉状態
const isTargetOpen = ref(true)
const isTmTbOpen = ref(false)
const isActionOpen = ref(true)

// ファイル状態
const targetFiles = ref<File[]>([])
const tmFiles = ref<File[]>([])
const tbFiles = ref<File[]>([])

// ProjectInfo 設定 (任意)
const projectName = ref('SheepWeaveProject')
const sourceLang = ref('en-US')
const targetLang = ref('ja-JP')

// ウェイト計算
const countUnit = ref<'CHARA' | 'WORD'>('CHARA')
const weights = ref<number[]>([0.1, 0.3, 0.6, 1.0, 1.0])
const tierCounts = ref<number[] | null>(null)

function doWeightedCount() {
  if (!store.hasData || !store.shuttle.data) return
  tierCounts.value = store.shuttle.manager.calculateTieredCounts(store.shuttle.data, countUnit.value)
}

const weightedSubtotals = computed(() => {
  if (!tierCounts.value) return [0, 0, 0, 0, 0]
  return tierCounts.value.map((count, i) => count * weights.value[i]!)
})

const totalRawCount = computed(() => {
  if (!tierCounts.value) return 0
  return tierCounts.value.reduce((a, b) => a + b, 0)
})

const totalWeightedCount = computed(() => {
  return weightedSubtotals.value.reduce((a, b) => a + b, 0)
})

const hasTargetFiles = computed(() => targetFiles.value.length > 0)
const hasUnitsInStore = computed(() => store.hasUnits)
const hasDataInStore = computed(() => store.hasData)
const hasTm = computed(() => tmFiles.value.length > 0)
const hasTb = computed(() => tbFiles.value.length > 0)

// 実行可能かどうか
const canRun = computed(() => {
  return hasTargetFiles.value || hasUnitsInStore.value || hasDataInStore.value
})

const validTargetExts = ['xlf', 'xliff', 'mxliff', 'sdlxliff', 'mqxliff', 'tmx', 'tbx', 'xlsx', 'csv', 'tsv', 'json', 'jsonl', 'docx']
const validTmExts = ['tmx', 'xlf', 'xliff', 'mxliff', 'mqxliff', 'sdlxliff', 'csv', 'tsv', 'xlsx', 'json', 'jsonl']
const validTbExts = ['tbx', 'csv', 'tsv', 'xlsx', 'json', 'jsonl']

function filterValidFiles(files: File[], validExts: string[], typeName: string): File[] {
  const valid: File[] = []
  const invalid: string[] = []
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    if (validExts.includes(ext)) {
      valid.push(f)
    } else {
      invalid.push(f.name)
    }
  }
  if (invalid.length > 0) {
    statusMsg.value = {
      text: `${typeName}の対象外ファイルを除外しました: ${invalid.join(', ')}`,
      type: 'error'
    }
  }
  return valid
}

// ファイル管理
function addTargetFiles(files: File[]) {
  const filtered = filterValidFiles(files, validTargetExts, '翻訳対象')
  if (filtered.length > 0) {
    targetFiles.value = [...targetFiles.value, ...filtered]
    isTmTbOpen.value = true // 対象が入ったらTM/TBセクションを開く
  }
}
function addTmFiles(files: File[]) {
  const filtered = filterValidFiles(files, validTmExts, 'TM')
  if (filtered.length > 0) tmFiles.value = [...tmFiles.value, ...filtered]
}
function addTbFiles(files: File[]) {
  const filtered = filterValidFiles(files, validTbExts, 'TB')
  if (filtered.length > 0) tbFiles.value = [...tbFiles.value, ...filtered]
}

function removeTargetFile(index: number) { targetFiles.value.splice(index, 1) }
function removeTm(index: number) { tmFiles.value.splice(index, 1) }
function removeTb(index: number) { tbFiles.value.splice(index, 1) }

// 解析・構造化の実行
async function doAnalyzeAndStructure() {
  if (!canRun.value) return
  isProcessing.value = true
  statusMsg.value = { text: '解析および構造化を実行中...', type: 'info' }

  try {
    const wasmReady = await initWasm()
    if (!wasmReady) throw new Error('WASMの初期化に失敗しました')
    const wasm = getWasm()

    // 1. 翻訳対象の確定
    if (hasTargetFiles.value) {
      statusMsg.value = { text: 'ファイルをパース中...', type: 'info' }
      const filesPayload = await Promise.all(targetFiles.value.map(async f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || ''
        const isBinary = ['xlsx', 'docx'].includes(ext)
        const isText = ['xlf', 'xliff', 'mxliff', 'sdlxliff', 'mqxliff', 'tmx', 'tbx', 'csv', 'tsv', 'json', 'jsonl'].includes(ext)
        const content = isText ? await f.text() : await f.arrayBuffer()
        return { name: f.name, content: content as any }
      }))
      await store.parseFiles(filesPayload)
    }

    if (!store.hasUnits && !store.hasData) {
      throw new Error('解析可能なセグメントデータがありません。ファイルを読み込んでください。')
    }

    // 2. 構造化（タグ保護・骨格作成）
    statusMsg.value = { text: 'タグ保護と構造化を実行中...', type: 'info' }
    const projectInfo = {
      version: 2,
      projectName: projectName.value || 'SheepWeaveProject',
      sourceLanguage: sourceLang.value || 'en-US',
      targetLanguage: targetLang.value || 'ja-JP',
      sourceFiles: targetFiles.value.length > 0 ? targetFiles.value.map(f => f.name) : store.fileList.map(f => f.name),
      okapi: [
        {
          filter: "auto",
          files: (targetFiles.value.length > 0 ? targetFiles.value.map(f => f.name) : store.fileList.map(f => f.name)).map(name => ({
            source: `Data/${name}`,
            xliff: `Working/03_XLF_JSON/${name}`,
            status: "extracted" as const
          }))
        }
      ]
    }

    store.convert(projectInfo)

    // 3. TM 読み込み
    if (hasTm.value) {
      statusMsg.value = { text: 'TM を読み込み中...', type: 'info' }
      const tms = await Promise.all(tmFiles.value.map(async f => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        const isBinary = ['xlsx'].includes(ext || '')
        const content = isBinary ? await f.arrayBuffer() : await f.text()
        return { name: f.name, content }
      }))
      await store.addTms(tms)
    }

    // 4. TB 読み込み
    if (hasTb.value) {
      statusMsg.value = { text: 'TB を読み込み中...', type: 'info' }
      const tbs = await Promise.all(tbFiles.value.map(async f => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        const isBinary = ['xlsx'].includes(ext || '')
        const content = isBinary ? await f.arrayBuffer() : await f.text()
        return { name: f.name, content }
      }))
      await store.addTbs(tbs)
    }

    // 5. 解析実行（WASM または JS フォールバック）
    statusMsg.value = { text: 'TM/TB照合および内部類似度を解析中...', type: 'info' }
    await store.analyze(wasm?.analyze_all)

    // 6. ウェイト集計
    doWeightedCount()

    statusMsg.value = { text: `解析と構造化が完了しました (${store.shwvUnitCount} セグメント)`, type: 'success' }
  } catch (err: any) {
    console.error(err)
    statusMsg.value = { text: err.message || 'エラーが発生しました', type: 'error' }
  } finally {
    isProcessing.value = false
  }
}

function downloadShwv() {
  if (!store.hasData || !store.shuttle.data) return
  FileIO.downloadJson(store.shuttle.data, `${projectName.value || 'Project'}.shwv.json`)
}
</script>

<template>
  <div class="analyzer-view">
    <div class="analyzer-layout">
      
      <!-- Sidebar (340px Sticky) -->
      <aside class="sidebar">
        
        <!-- 1. 翻訳対象ファイル -->
        <AppCardCollapse title="1. 翻訳対象ファイル" v-model:open="isTargetOpen" class="sidebar-card">
          <div v-if="hasUnitsInStore && !hasTargetFiles" class="store-notice">
            <CheckCircle :size="14" class="notice-icon" />
            <span>パース済みデータ ({{ store.unitCount }} 件) を利用中</span>
          </div>

          <div class="drop-area" @drop.prevent="(e) => addTargetFiles(Array.from(e.dataTransfer?.files || []))" @dragover.prevent>
            <input type="file" accept=".xlf,.xliff,.mxliff,.sdlxliff,.mqxliff,.tmx,.tbx,.xlsx,.csv,.tsv,.json,.jsonl,.docx" multiple hidden @change="(e) => addTargetFiles(Array.from((e.target as HTMLInputElement).files || []))" ref="targetInput" />
            <div class="drop-label" @click="($refs.targetInput as HTMLInputElement).click()">
              <FileUp :size="24" class="drop-icon" />
              <p>対象ファイルをドロップ、または選択</p>
              <span class="drop-ext-hint">.xlf, .mxliff, .xlsx, .csv, .tmx, .json 等</span>
            </div>
          </div>

          <div class="file-mini-list" v-if="hasTargetFiles">
            <div v-for="(f, i) in targetFiles" :key="i" class="mini-item">
              <span class="mini-name">{{ f.name }}</span>
              <button @click="removeTargetFile(i)" class="btn-remove"><Trash2 :size="12" /></button>
            </div>
          </div>
        </AppCardCollapse>

        <!-- 2. 参照データ (TM / TB) -->
        <AppCardCollapse title="2. 参照データ (TM / TB: 任意)" v-model:open="isTmTbOpen" class="sidebar-card">
          <!-- TM -->
          <div class="sub-drop-group">
            <div class="sub-group-title">
              <Database :size="14" />
              <span>翻訳メモリ (TM)</span>
            </div>
            <div class="drop-area-sm" @drop.prevent="(e) => addTmFiles(Array.from(e.dataTransfer?.files || []))" @dragover.prevent>
              <input type="file" accept=".tmx,.xlf,.xliff,.mxliff,.mqxliff,.sdlxliff,.csv,.tsv,.xlsx,.json,.jsonl" multiple hidden @change="(e) => addTmFiles(Array.from((e.target as HTMLInputElement).files || []))" ref="tmInput" />
              <div class="drop-label" @click="($refs.tmInput as HTMLInputElement).click()">
                <p>TMファイルをドロップまたは選択</p>
              </div>
            </div>
            <div class="file-mini-list" v-if="hasTm">
              <div v-for="(f, i) in tmFiles" :key="i" class="mini-item">
                <span class="mini-name">{{ f.name }}</span>
                <button @click="removeTm(i)" class="btn-remove"><Trash2 :size="12" /></button>
              </div>
            </div>
          </div>

          <!-- TB -->
          <div class="sub-drop-group" style="margin-top: 12px;">
            <div class="sub-group-title">
              <Book :size="14" />
              <span>用語集 (TB)</span>
            </div>
            <div class="drop-area-sm" @drop.prevent="(e) => addTbFiles(Array.from(e.dataTransfer?.files || []))" @dragover.prevent>
              <input type="file" accept=".tbx,.csv,.tsv,.xlsx,.json,.jsonl" multiple hidden @change="(e) => addTbFiles(Array.from((e.target as HTMLInputElement).files || []))" ref="tbInput" />
              <div class="drop-label" @click="($refs.tbInput as HTMLInputElement).click()">
                <p>TBファイルをドロップまたは選択</p>
              </div>
            </div>
            <div class="file-mini-list" v-if="hasTb">
              <div v-for="(f, i) in tbFiles" :key="i" class="mini-item">
                <span class="mini-name">{{ f.name }}</span>
                <button @click="removeTb(i)" class="btn-remove"><Trash2 :size="12" /></button>
              </div>
            </div>
          </div>
        </AppCardCollapse>

        <!-- 3. プロジェクト設定 & 解析実行 -->
        <AppCardCollapse title="3. プロジェクト設定 & 解析実行" v-model:open="isActionOpen" class="sidebar-card">
          <div class="project-settings-box">
            <div class="form-group">
              <label>プロジェクト名:</label>
              <input v-model="projectName" type="text" class="input-sm" placeholder="SheepWeaveProject" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>原文言語:</label>
                <input v-model="sourceLang" type="text" class="input-sm" placeholder="en-US" />
              </div>
              <div class="form-group">
                <label>訳文言語:</label>
                <input v-model="targetLang" type="text" class="input-sm" placeholder="ja-JP" />
              </div>
            </div>
          </div>

          <button class="btn-run" @click="doAnalyzeAndStructure" :disabled="isProcessing || !canRun">
            <span v-if="isProcessing" class="loader"></span>
            <Play v-else :size="16" />
            <span>{{ isProcessing ? '解析中...' : '解析・構造化を実行' }}</span>
          </button>
        </AppCardCollapse>

        <div v-if="statusMsg.text" :class="['status-box', statusMsg.type]">
          <span>{{ statusMsg.text }}</span>
        </div>
      </aside>

      <!-- Main Results Area -->
      <section class="results-area">
        <div class="card full-height">
          
          <div class="card-header space-between">
            <div class="title-group">
              <BarChart2 :size="20" class="header-icon" />
              <h2>解析結果 & 統計サマリー</h2>
              <span class="badge" v-if="store.hasData">
                {{ store.shwvUnitCount }} セグメント
              </span>
            </div>

            <div class="header-actions" v-if="hasDataInStore">
              <div class="unit-toggle">
                <select v-model="countUnit" @change="doWeightedCount" class="select-sm">
                  <option value="CHARA">文字数 (Chara)</option>
                  <option value="WORD">単語数 (Word)</option>
                </select>
              </div>
              <button class="btn-outline" @click="downloadShwv">
                <Download :size="14" /> ShWv (JSON)
              </button>
              <NuxtLink to="/shuttle/manage" class="btn-outline btn-primary-link">
                <span>管理・QAへ</span>
                <ArrowRight :size="14" />
              </NuxtLink>
            </div>
          </div>

          <!-- 統計サマリーテーブル -->
          <div class="table-container" v-if="tierCounts">
            <table class="analyzer-table">
              <thead>
                <tr>
                  <th style="width: 35%;">一致率区分</th>
                  <th style="width: 25%;">文字数 / 単語数</th>
                  <th style="width: 20%;">ウェイト係数</th>
                  <th style="width: 20%;">換算小計</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="match-badge match-100">100% 一致 (内部/外部)</span></td>
                  <td class="num">{{ tierCounts[0]?.toLocaleString() }}</td>
                  <td><input type="number" step="0.1" min="0" max="1" v-model.number="weights[0]" class="input-weight" /></td>
                  <td class="num bold">{{ Math.round(weightedSubtotals[0] || 0).toLocaleString() }}</td>
                </tr>
                <tr>
                  <td><span class="match-badge match-95">99% ～ 95%</span></td>
                  <td class="num">{{ tierCounts[1]?.toLocaleString() }}</td>
                  <td><input type="number" step="0.1" min="0" max="1" v-model.number="weights[1]" class="input-weight" /></td>
                  <td class="num bold">{{ Math.round(weightedSubtotals[1] || 0).toLocaleString() }}</td>
                </tr>
                <tr>
                  <td><span class="match-badge match-85">94% ～ 85%</span></td>
                  <td class="num">{{ tierCounts[2]?.toLocaleString() }}</td>
                  <td><input type="number" step="0.1" min="0" max="1" v-model.number="weights[2]" class="input-weight" /></td>
                  <td class="num bold">{{ Math.round(weightedSubtotals[2] || 0).toLocaleString() }}</td>
                </tr>
                <tr>
                  <td><span class="match-badge match-75">84% ～ 75%</span></td>
                  <td class="num">{{ tierCounts[3]?.toLocaleString() }}</td>
                  <td><input type="number" step="0.1" min="0" max="1" v-model.number="weights[3]" class="input-weight" /></td>
                  <td class="num bold">{{ Math.round(weightedSubtotals[3] || 0).toLocaleString() }}</td>
                </tr>
                <tr class="row-new">
                  <td><span class="match-badge match-new">74% 以下 (新規)</span></td>
                  <td class="num">{{ tierCounts[4]?.toLocaleString() }}</td>
                  <td><input type="number" step="0.1" min="0" max="1" v-model.number="weights[4]" class="input-weight" /></td>
                  <td class="num bold">{{ Math.round(weightedSubtotals[4] || 0).toLocaleString() }}</td>
                </tr>
                <tr class="row-total">
                  <td><strong>総合計</strong></td>
                  <td class="num total-accent">{{ totalRawCount.toLocaleString() }}</td>
                  <td></td>
                  <td class="num total-accent">{{ Math.round(totalWeightedCount).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="empty-state" v-else>
            <Search :size="48" class="empty-icon" />
            <p>左パネルから翻訳対象ファイル・参照データを設定し、「解析・構造化を実行」してください。</p>
          </div>

        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.analyzer-view {
  padding: 24px;
}

.analyzer-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 900px) {
  .analyzer-layout {
    grid-template-columns: 1fr;
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  padding-right: 4px;
}

.store-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--accent-glow);
  color: var(--accent-light);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xs);
  font-size: 0.74rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.drop-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius-xs);
  padding: 20px 14px;
  text-align: center;
  transition: var(--transition);
  cursor: pointer;
}

.drop-area:hover {
  border-color: var(--accent);
  background: var(--accent-glow);
}

.drop-area-sm {
  border: 1px dashed var(--border);
  border-radius: var(--radius-xs);
  padding: 12px 10px;
  text-align: center;
  transition: var(--transition);
  cursor: pointer;
  background: rgba(0, 0, 0, 0.15);
}

.drop-area-sm:hover {
  border-color: var(--accent);
  background: var(--accent-glow);
}

.drop-icon {
  color: var(--accent);
  margin-bottom: 4px;
}

.drop-label p {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin: 0;
}

.drop-ext-hint {
  font-size: 0.68rem;
  color: var(--text-muted);
  display: block;
  margin-top: 4px;
}

.sub-drop-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.file-mini-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  max-height: 100px;
  overflow-y: auto;
}

.mini-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.72rem;
}

.mini-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  color: var(--text-secondary);
}

.btn-remove {
  background: none;
  border: none;
  color: var(--error);
  cursor: pointer;
  opacity: 0.6;
}

.btn-remove:hover { opacity: 1; }

.project-settings-box {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-group label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.input-sm {
  padding: 4px 8px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 0.78rem;
}

.btn-run {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: var(--radius-xs);
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  white-space: nowrap;
}

.btn-run:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #059669);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-box {
  padding: 10px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.78rem;
  line-height: 1.4;
}

.status-box.success { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.status-box.error { background: rgba(239, 68, 68, 0.12); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
.status-box.info { background: rgba(59, 130, 246, 0.12); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }

/* Results Area */
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 12px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-group h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.header-icon {
  color: var(--accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-outline:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.btn-primary-link {
  background: var(--accent-glow);
  color: var(--accent-light);
  border-color: var(--border-accent);
}

.btn-primary-link:hover {
  background: var(--accent);
  color: #042f20;
}

.unit-toggle .select-sm {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 0.76rem;
  padding: 5px 8px;
}

/* Table */
.table-container {
  padding: 16px 20px;
}

table.analyzer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th, td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.02);
}

td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: 'Inter', monospace;
}

td.num.bold {
  font-weight: 700;
  color: var(--text-primary);
}

.input-weight {
  width: 60px;
  padding: 3px 6px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 0.8rem;
  text-align: right;
}

.match-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.match-100 { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.match-95 { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.match-85 { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.match-75 { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.match-new { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

.row-total {
  background: var(--bg-hover);
}

.total-accent {
  font-weight: 800;
  color: var(--accent) !important;
  font-size: 0.95rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: var(--text-muted);
  text-align: center;
  gap: 12px;
}

.empty-icon {
  opacity: 0.3;
}

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
