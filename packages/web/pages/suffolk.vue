<script setup lang="ts">
/**
 * web/pages/suffolk.vue
 * Pure Rust Okapi Tikal 互換エンジン Suffolk によるドキュメント抽出 & 復元
 */
definePageMeta({
  title: 'Suffolk (XLIFF作成・復元)',
  icon: 'sparkles'
})

import { ref, computed, onMounted, toRaw } from 'vue'
import {
  Sparkles,
  FileUp,
  Download,
  Database,
  Trash2,
  Loader2,
  Hammer,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Settings2,
  Code2,
  FileText,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  Save,
  RefreshCw
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useShuttleStore } from '../stores/shuttleStore'
import { useToast } from '../composables/useToast'
import AppCardCollapse from '../components/common/AppCardCollapse.vue'
import {
  initSuffolkWasm,
  isSuffolkReady,
  extractDocument,
  extractBatchDocuments,
  mergeDocument,
  exportFailsafe,
  getSuffolkVersion,
  type SuffolkFilterOptions,
  type SuffolkMergeOptions
} from '../utils/suffolkWasm'
import { pickFilesWithFsa, saveFileWithFsa, isFsaSupported } from '../utils/fileSystemAccess'
import { FileIO } from '../utils/fileIO'

const { t } = useI18n()
const localePath = useLocalePath()
const store = useShuttleStore()
const toast = useToast()

// WASM 初期化状態
const isWasmLoading = ref(true)
const wasmReady = ref(false)
const suffolkVer = ref('')

// サポート拡張子
const supportedDocExts = ['docx', 'xlsx', 'pptx', 'html', 'htm', 'txt', 'md', 'idml']
const supportedTransExts = ['xlf', 'xliff', 'json']

// ==========================================
// 1. 抽出 (Extract / Filter) 状態
// ==========================================
interface InputFileItem {
  file: File
  name: string
  size: number
  ext: string
  bytes: Uint8Array
}

const inputFiles = ref<InputFileItem[]>([])
const isInputDragOver = ref(false)
const isExtracting = ref(false)

// 抽出オプション
const filterOptions = ref<{
  to: 'shwv' | 'xliff'
  seg: boolean
  srcLang: string
  trgLang: string
  rawTags: boolean
  encoding: string
  autoLoadToManage: boolean
  // Excel詳細
  xlsxSource: string
  xlsxTarget: string
  xlsxContext: string
  xlsxSkipRows: number
  xlsxSheet: string
  showAdvanced: boolean
}>({
  to: 'shwv',
  seg: false,
  srcLang: 'en',
  trgLang: 'ja',
  rawTags: false,
  encoding: 'auto',
  autoLoadToManage: true,
  xlsxSource: '',
  xlsxTarget: '',
  xlsxContext: '',
  xlsxSkipRows: 0,
  xlsxSheet: '',
  showAdvanced: false
})

// 抽出結果
const extractedResult = ref<{
  format: 'shwv' | 'xliff'
  data: any
  unitCount: number
  fileName: string
  xliffContent?: string
} | null>(null)

// ==========================================
// 2. 復元 (Merge / Rebuild) 状態
// ==========================================
const useExtractedSource = ref(true)
const mergeSkeletonFile = ref<InputFileItem | null>(null)
const isSkeletonDragOver = ref(false)

interface TransFileItem {
  file?: File
  name: string
  content: string | any
  isStoreData?: boolean
}

const mergeTransFile = ref<TransFileItem | null>(null)
const isTransDragOver = ref(false)
const isMerging = ref(false)

const mergeResult = ref<{
  fileName: string
  bytes: Uint8Array
  sourceName: string
} | null>(null)

// 折りたたみカードの状態
const isExtractCardOpen = ref(true)
const isMergeCardOpen = ref(true)

// ==========================================
// ライフサイクル & WASM 初期化
// ==========================================
onMounted(async () => {
  try {
    isWasmLoading.value = true
    await initSuffolkWasm()
    wasmReady.value = true
    suffolkVer.value = getSuffolkVersion()
  } catch (err: any) {
    console.error('Failed to init Suffolk WASM:', err)
    toast.error('Suffolk WASMエンジンの初期化に失敗しました')
  } finally {
    isWasmLoading.value = false
  }
})

// ==========================================
// 抽出側: ファイル操作 (D&D + FSA)
// ==========================================
const handleInputDrop = async (e: DragEvent) => {
  isInputDragOver.value = false
  if (!e.dataTransfer?.files) return
  await addFiles(Array.from(e.dataTransfer.files))
}

const handleInputClick = async () => {
  const files = await pickFilesWithFsa({
    multiple: true,
    acceptExtensions: supportedDocExts
  })
  if (files.length > 0) {
    await addFiles(files)
  }
}

const addFiles = async (files: File[]) => {
  const validFiles = files.filter(f => {
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    return supportedDocExts.includes(ext)
  })

  if (validFiles.length === 0) {
    toast.error('対応しているドキュメント形式 (.docx, .xlsx, .pptx, .html, .txt, .md, .idml) を選択してください')
    return
  }

  for (const f of validFiles) {
    // 既存重複チェック
    if (inputFiles.value.some(item => item.name === f.name)) continue
    const buffer = await f.arrayBuffer()
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    inputFiles.value.push({
      file: f,
      name: f.name,
      size: f.size,
      ext,
      bytes: new Uint8Array(buffer)
    })
  }

  toast.info(`${validFiles.length} 件の原稿ファイルを読み込みました`)
}

const removeInputFile = (index: number) => {
  inputFiles.value.splice(index, 1)
  if (inputFiles.value.length === 0) {
    extractedResult.value = null
  }
}

const clearInputFiles = () => {
  inputFiles.value = []
  extractedResult.value = null
}

// ドロップされたファイルに XLSX が含まれるか
const hasXlsxInput = computed(() => {
  return inputFiles.value.some(f => f.ext === 'xlsx')
})

// ==========================================
// 抽出（パース）実行
// ==========================================
const handleExtract = async () => {
  if (inputFiles.value.length === 0) {
    toast.error('抽出する原稿ファイルを追加してください')
    return
  }
  if (!wasmReady.value) {
    toast.error('Suffolk WASMエンジンが準備できていません')
    return
  }

  isExtracting.value = true
  try {
    const opts: SuffolkFilterOptions = {
      to: filterOptions.value.to,
      seg: filterOptions.value.seg,
      srcLang: filterOptions.value.srcLang.trim() || 'en',
      trgLang: filterOptions.value.trgLang.trim() || 'ja',
      rawTags: filterOptions.value.rawTags,
      encoding: filterOptions.value.encoding === 'auto' ? undefined : filterOptions.value.encoding
    }

    if (hasXlsxInput.value) {
      if (filterOptions.value.xlsxSource) opts.xlsxSource = filterOptions.value.xlsxSource.trim()
      if (filterOptions.value.xlsxTarget) opts.xlsxTarget = filterOptions.value.xlsxTarget.trim()
      if (filterOptions.value.xlsxContext) opts.xlsxContext = filterOptions.value.xlsxContext.trim()
      if (filterOptions.value.xlsxSkipRows > 0) opts.xlsxSkipRows = filterOptions.value.xlsxSkipRows
      if (filterOptions.value.xlsxSheet) opts.xlsxSheet = filterOptions.value.xlsxSheet.trim()
    }

    if (inputFiles.value.length === 1) {
      // 単一ファイル抽出
      const targetFile = inputFiles.value[0]
      if (!targetFile) return
      const result = await extractDocument(targetFile.bytes, targetFile.name, opts)

      if (filterOptions.value.to === 'xliff') {
        extractedResult.value = {
          format: 'xliff',
          data: result,
          unitCount: (result.content.match(/<trans-unit/g) || []).length,
          fileName: result.fileName || `${targetFile.name}.xlf`,
          xliffContent: result.content
        }
      } else {
        const plainResult = JSON.parse(JSON.stringify(result))
        const units = plainResult?.body?.units || []
        extractedResult.value = {
          format: 'shwv',
          data: plainResult,
          unitCount: units.length,
          fileName: 'project.json'
        }

        // 自動で管理ストアへ読み込む
        if (filterOptions.value.autoLoadToManage) {
          await store.loadShwvData(plainResult, targetFile.name)
          toast.success(`🐑 ${units.length} 件のユニットを管理ストアへ自動読み込みしました`)
        }
      }
    } else {
      // 複数ファイル一括バッチ抽出
      const batchList = inputFiles.value.map(f => ({
        name: f.name,
        data: f.bytes
      }))
      const result = await extractBatchDocuments(batchList, opts)
      const plainResult = JSON.parse(JSON.stringify(result))

      const units = plainResult?.body?.units || []
      extractedResult.value = {
        format: 'shwv',
        data: plainResult,
        unitCount: units.length,
        fileName: 'project.json'
      }

      if (filterOptions.value.autoLoadToManage) {
        await store.loadShwvData(plainResult, `batch_${inputFiles.value.length}_files`)
        toast.success(`🐑 ${inputFiles.value.length} ファイルから ${units.length} 件を管理ストアに読み込みました`)
      }
    }

    toast.success(`抽出が完了しました（${extractedResult.value?.unitCount || 0} ユニット）`)
  } catch (err: any) {
    console.error('Suffolk extract failed:', err)
    toast.error(`抽出エラー: ${err?.message || err}`)
  } finally {
    isExtracting.value = false
  }
}

// 抽出結果のアクション
const handleSendToManage = async () => {
  if (!extractedResult.value?.data || extractedResult.value.format !== 'shwv') return
  const firstFileName = inputFiles.value[0]?.name || 'Suffolk_Project'
  const plainData = JSON.parse(JSON.stringify(toRaw(extractedResult.value.data)))
  await store.loadShwvData(plainData, firstFileName)
  toast.success('🐑 管理ストアにデータをセットしました。管理画面へ移動します')
  await navigateTo(localePath('/shuttle/manage'))
}

const handleDownloadExtractResult = async () => {
  if (!extractedResult.value) return
  if (extractedResult.value.format === 'xliff') {
    const xml = extractedResult.value.xliffContent || ''
    const fileName = extractedResult.value.fileName || 'extracted.xlf'
    await saveFileWithFsa(xml, fileName, {
      mimeType: 'application/x-xliff+xml',
      types: [{ description: 'XLIFF File', accept: { 'application/x-xliff+xml': ['.xlf', '.xliff'] } }]
    })
  } else {
    const jsonStr = JSON.stringify(extractedResult.value.data, null, 2)
    await saveFileWithFsa(jsonStr, extractedResult.value.fileName || 'project.json', {
      mimeType: 'application/json',
      types: [{ description: 'ShWvData JSON', accept: { 'application/json': ['.json'] } }]
    })
  }
}

// 緊急救助フェイルセーフ出力
const handleExportFailsafe = async () => {
  if (!extractedResult.value?.data) return
  try {
    const failsafe = await exportFailsafe(extractedResult.value.data)
    // CSV と TXT を保存
    const baseName = inputFiles.value[0]?.name || 'suffolk'
    FileIO.downloadCsv(failsafe.csv, `${baseName}.failsafe.csv`)
    FileIO.download(failsafe.txt, `${baseName}.failsafe.txt`, 'text/plain;charset=utf-8')
    toast.success('🛡️ 緊急フェイルセーフファイル（対照CSV & 訳文TXT）を出力しました')
  } catch (e: any) {
    toast.error(`フェイルセーフ出力エラー: ${e?.message || e}`)
  }
}

// ==========================================
// 復元側: ファイル指定 (スケルトン & 翻訳データ)
// ==========================================
// 実質的に使用するスケルトンファイル
const activeSkeletonFile = computed<InputFileItem | null>(() => {
  if (useExtractedSource.value && inputFiles.value.length > 0) {
    return inputFiles.value[0] || null
  }
  return mergeSkeletonFile.value
})

const handleSkeletonDrop = async (e: DragEvent) => {
  isSkeletonDragOver.value = false
  if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return
  const f = e.dataTransfer.files[0]
  if (!f) return
  const ext = f.name.split('.').pop()?.toLowerCase() || ''
  if (!supportedDocExts.includes(ext)) {
    toast.error('対応原稿形式のファイルを選択してください')
    return
  }
  const buffer = await f.arrayBuffer()
  mergeSkeletonFile.value = {
    file: f,
    name: f.name,
    size: f.size,
    ext,
    bytes: new Uint8Array(buffer)
  }
  useExtractedSource.value = false
}

const handleSkeletonClick = async () => {
  const files = await pickFilesWithFsa({
    multiple: false,
    acceptExtensions: supportedDocExts
  })
  if (files.length > 0 && files[0]) {
    const f = files[0]
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    const buffer = await f.arrayBuffer()
    mergeSkeletonFile.value = {
      file: f,
      name: f.name,
      size: f.size,
      ext,
      bytes: new Uint8Array(buffer)
    }
    useExtractedSource.value = false
  }
}

// 翻訳ファイルの指定 (XLIFF / ShWvData)
const handleTransDrop = async (e: DragEvent) => {
  isTransDragOver.value = false
  if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return
  const f = e.dataTransfer.files[0]
  if (!f) return
  await loadTransFile(f)
}

const handleTransClick = async () => {
  const files = await pickFilesWithFsa({
    multiple: false,
    acceptExtensions: supportedTransExts
  })
  if (files.length > 0 && files[0]) {
    await loadTransFile(files[0])
  }
}

const loadTransFile = async (f: File) => {
  const ext = f.name.split('.').pop()?.toLowerCase() || ''
  if (!supportedTransExts.includes(ext)) {
    toast.error('XLIFF (.xlf, .xliff) または ShWvData (.json) を選択してください')
    return
  }
  const text = await FileIO.readAsText(f)
  let parsedContent: any = text
  if (ext === 'json') {
    try {
      parsedContent = JSON.parse(text)
    } catch {
      toast.error('JSON の構文が不正です')
      return
    }
  }
  mergeTransFile.value = {
    file: f,
    name: f.name,
    content: parsedContent,
    isStoreData: false
  }
  toast.info(`翻訳ファイル「${f.name}」を読み込みました`)
}

// 管理ストア（ShuttleStore）のデータを復元用翻訳データとして適用
const handleUseStoreDataForMerge = () => {
  if (!store.data) {
    toast.error('現在、管理ストアにデータがありません')
    return
  }
  mergeTransFile.value = {
    name: `(管理ストアデータ: ${store.currentFileName || 'project.json'})`,
    content: store.data,
    isStoreData: true
  }
  toast.success('🐑 管理ストアの作業データを復元対象にセットしました')
}

// ==========================================
// 復元（マージ）実行
// ==========================================
const handleMerge = async () => {
  if (!activeSkeletonFile.value) {
    toast.error('元ファイル（スケルトン）を指定してください')
    return
  }
  if (!mergeTransFile.value) {
    toast.error('翻訳データ（XLIFF または ShWvData）を指定してください')
    return
  }
  if (!wasmReady.value) {
    toast.error('Suffolk WASMエンジンが準備できていません')
    return
  }

  isMerging.value = true
  try {
    const skeleton = activeSkeletonFile.value
    const trans = mergeTransFile.value

    const mergeOpts: SuffolkMergeOptions = {}
    if (skeleton.ext === 'xlsx') {
      if (filterOptions.value.xlsxSource) mergeOpts.xlsxSource = filterOptions.value.xlsxSource
      if (filterOptions.value.xlsxTarget) mergeOpts.xlsxTarget = filterOptions.value.xlsxTarget
    }

    // マージ実行
    const resultBytes = await mergeDocument(
      skeleton.bytes,
      skeleton.name,
      trans.content,
      mergeOpts
    )

    // 出力ファイル名 (.out.<拡張子>)
    const dotIdx = skeleton.name.lastIndexOf('.')
    const baseName = dotIdx !== -1 ? skeleton.name.substring(0, dotIdx) : skeleton.name
    const outName = `${baseName}.out.${skeleton.ext}`

    mergeResult.value = {
      fileName: outName,
      bytes: resultBytes,
      sourceName: skeleton.name
    }

    toast.success(`復元が完了しました: ${outName}`)
  } catch (err: any) {
    console.error('Suffolk merge failed:', err)
    toast.error(`復元エラー: ${err?.message || err}`)

    // 自動フェイルセーフ案内
    if (mergeTransFile.value?.content) {
      try {
        const failsafe = await exportFailsafe(mergeTransFile.value.content)
        const base = activeSkeletonFile.value?.name || 'recovery'
        FileIO.downloadCsv(failsafe.csv, `${base}.emergency.csv`)
        toast.info('🛡️ 自動緊急リカバリ: 翻訳データを対照CSVとして救出しました')
      } catch {
        // ignore
      }
    }
  } finally {
    isMerging.value = false
  }
}

// 完成文書の保存
const handleSaveMergedDocument = async () => {
  if (!mergeResult.value) return
  const { bytes, fileName } = mergeResult.value
  await saveFileWithFsa(bytes, fileName, {
    types: [
      {
        description: 'Document File',
        accept: {
          'application/octet-stream': [`.${fileName.split('.').pop()}`]
        }
      }
    ]
  })
}

// フォーマットサイズヘルパー
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="suffolk-page-container">
    <!-- ページトップヘッダー -->
    <header class="suffolk-header">
      <div class="header-main-title">
        <div class="title-with-badge">
          <h1 class="page-title">
            <span class="icon-sheep">🐑</span>
            Suffolk
            <span class="version-tag">v{{ suffolkVer || '0.0.2' }}</span>
          </h1>
          <span class="badge-experimental">
            <Sparkles :size="13" />
            実験的機能 (Experimental)
          </span>
        </div>
        <p class="page-desc">
          Okapi Tikal 互換 Pure Rust フィルタ＆マージエンジン。
          Office文書・HTML・IDML等の多言語ドキュメントから XLIFF 1.2 / ShWvData を抽出し、翻訳後に元ファイルへ安全に組み戻します。
        </p>
      </div>

      <div class="header-meta">
        <div class="status-indicator" :class="{ ready: wasmReady, loading: isWasmLoading }">
          <span class="dot"></span>
          {{ wasmReady ? 'Suffolk WASM Ready' : 'WASM Loading...' }}
        </div>
        <div v-if="isFsaSupported()" class="fsa-pill" title="File System Access API 対応ブラウザです">
          <FolderOpen :size="13" />
          Native FS Access
        </div>
      </div>
    </header>

    <!-- メインコンテンツグリッド -->
    <div class="suffolk-content-layout">
      <!-- ============================================== -->
      <!-- 1. 抽出 (Filter / Extract) カード -->
      <!-- ============================================== -->
      <AppCardCollapse v-model:open="isExtractCardOpen" title="1. ドキュメント抽出 (Filter / Extract)">
        <template #header>
          <div class="card-header-custom">
            <Layers :size="18" class="text-primary" />
            <span class="card-header-title">1. ドキュメント抽出 (Filter / Extract)</span>
            <span class="card-header-desc">— 原稿から XLIFF または ShWvData を抽出</span>
          </div>
        </template>

        <div class="card-inner-flow">
          <!-- 原稿ファイルドロップゾーン -->
          <div
            class="dropzone-area"
            :class="{ 'is-dragover': isInputDragOver, 'has-files': inputFiles.length > 0 }"
            @dragover.prevent="isInputDragOver = true"
            @dragleave.prevent="isInputDragOver = false"
            @drop.prevent="handleInputDrop"
            @click="handleInputClick"
          >
            <div class="dropzone-content">
              <FileUp :size="32" class="dropzone-icon" />
              <div class="dropzone-text">
                <span class="dropzone-prompt">原稿ファイルをドラッグ＆ドロップ、またはクリックして選択</span>
                <span class="dropzone-sub">
                  対応形式: <strong>.docx, .xlsx, .pptx, .html, .txt, .md, .idml</strong>（複数選択可）
                </span>
              </div>
            </div>
          </div>

          <!-- 選択中ファイルリスト -->
          <div v-if="inputFiles.length > 0" class="file-list-card">
            <div class="file-list-header">
              <span class="file-list-title">読み込み中の原稿 ({{ inputFiles.length }} 件)</span>
              <button class="btn-text-danger" @click.stop="clearInputFiles">
                <Trash2 :size="14" />
                すべてクリア
              </button>
            </div>
            <ul class="file-list-items">
              <li v-for="(item, idx) in inputFiles" :key="idx" class="file-item-row">
                <div class="file-info">
                  <span class="file-ext-badge" :data-ext="item.ext">{{ item.ext.toUpperCase() }}</span>
                  <span class="file-name" :title="item.name">{{ item.name }}</span>
                  <span class="file-size">({{ formatFileSize(item.size) }})</span>
                </div>
                <button class="btn-remove-file" @click.stop="removeInputFile(idx)" title="削除">
                  <Trash2 :size="14" />
                </button>
              </li>
            </ul>
          </div>

          <!-- 抽出設定パネル -->
          <div class="options-container">
            <div class="options-row primary-options">
              <!-- 出力フォーマット -->
              <div class="option-field">
                <label class="field-label">出力形式</label>
                <div class="format-toggle-group">
                  <button
                    type="button"
                    class="btn-format"
                    :class="{ active: filterOptions.to === 'shwv' }"
                    @click="filterOptions.to = 'shwv'"
                  >
                    <Code2 :size="14" />
                    ShWvData (JSON)
                  </button>
                  <button
                    type="button"
                    class="btn-format"
                    :class="{ active: filterOptions.to === 'xliff' }"
                    @click="filterOptions.to = 'xliff'"
                  >
                    <FileText :size="14" />
                    XLIFF 1.2 (.xlf)
                  </button>
                </div>
              </div>

              <!-- 原文言語 / 訳文言語 -->
              <div class="option-field">
                <label class="field-label">言語コード (原文 ➔ 訳文)</label>
                <div class="lang-inputs-pair">
                  <input
                    v-model="filterOptions.srcLang"
                    type="text"
                    class="input-text-sm"
                    placeholder="en"
                    title="原文言語コード"
                  />
                  <ArrowRight :size="14" class="text-muted" />
                  <input
                    v-model="filterOptions.trgLang"
                    type="text"
                    class="input-text-sm"
                    placeholder="ja"
                    title="訳文言語コード"
                  />
                </div>
              </div>

              <!-- 文セグメンテーション -->
              <div class="option-field">
                <label class="field-label">文単位分割 (-seg)</label>
                <label class="switch-control">
                  <input v-model="filterOptions.seg" type="checkbox" />
                  <span class="switch-slider"></span>
                  <span class="switch-text">{{ filterOptions.seg ? '文単位分割 ON' : '段落/ブロック単位' }}</span>
                </label>
              </div>

              <!-- 管理ストアへ自動反映 (ShWvData 時) -->
              <div v-if="filterOptions.to === 'shwv'" class="option-field">
                <label class="field-label">管理ストア連携</label>
                <label class="switch-control">
                  <input v-model="filterOptions.autoLoadToManage" type="checkbox" />
                  <span class="switch-slider"></span>
                  <span class="switch-text">抽出後に自動で管理にロード</span>
                </label>
              </div>
            </div>

            <!-- 詳細設定トグル -->
            <div class="advanced-toggle-row">
              <button
                type="button"
                class="btn-toggle-advanced"
                @click="filterOptions.showAdvanced = !filterOptions.showAdvanced"
              >
                <Settings2 :size="14" />
                <span>{{ filterOptions.showAdvanced ? '詳細オプションを閉じる' : '詳細オプション（Excel列設定・タグ・文字コード）' }}</span>
              </button>
            </div>

            <!-- 詳細設定ボディ -->
            <div v-if="filterOptions.showAdvanced" class="advanced-options-body">
              <!-- Excel (XLSX) 列設定 -->
              <div class="advanced-section" :class="{ 'highlight-section': hasXlsxInput }">
                <div class="section-badge-title">
                  <FileSpreadsheet :size="15" />
                  <span>Excel (XLSX) 多言語抽出ルール</span>
                  <span v-if="hasXlsxInput" class="badge-active-format">XLSX 検出中</span>
                </div>
                <div class="xlsx-grid-fields">
                  <div class="sub-field">
                    <label>原文列</label>
                    <input v-model="filterOptions.xlsxSource" type="text" placeholder="例: A" class="input-text-sm" />
                  </div>
                  <div class="sub-field">
                    <label>訳文列（事前翻訳）</label>
                    <input v-model="filterOptions.xlsxTarget" type="text" placeholder="例: B" class="input-text-sm" />
                  </div>
                  <div class="sub-field">
                    <label>コンテキスト列</label>
                    <input v-model="filterOptions.xlsxContext" type="text" placeholder="例: C" class="input-text-sm" />
                  </div>
                  <div class="sub-field">
                    <label>ヘッダースキップ行</label>
                    <input v-model.number="filterOptions.xlsxSkipRows" type="number" min="0" placeholder="1" class="input-text-sm" />
                  </div>
                  <div class="sub-field full-width">
                    <label>対象シート名正規表現（空欄は全シート）</label>
                    <input v-model="filterOptions.xlsxSheet" type="text" placeholder="例: Sheet1|Device_.*" class="input-text-sm" />
                  </div>
                </div>
              </div>

              <!-- その他のオプション -->
              <div class="advanced-section">
                <div class="section-badge-title">
                  <Settings2 :size="15" />
                  <span>タグ制御・文字コード</span>
                </div>
                <div class="other-grid-fields">
                  <label class="checkbox-label">
                    <input v-model="filterOptions.rawTags" type="checkbox" />
                    <span>生のタグをそのまま保持（タグ最小化を無効化: --raw-tags）</span>
                  </label>
                  <div class="sub-field inline-subfield">
                    <label>文字コード自動判定:</label>
                    <select v-model="filterOptions.encoding" class="select-sm">
                      <option value="auto">自動判別 (UTF-8 / Shift-JIS)</option>
                      <option value="utf-8">UTF-8 固定</option>
                      <option value="shift-jis">Shift-JIS (CP932) 固定</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 抽出実行アクション -->
          <div class="action-submit-row">
            <button
              class="btn-primary-action"
              :disabled="inputFiles.length === 0 || isExtracting || !wasmReady"
              @click="handleExtract"
            >
              <Loader2 v-if="isExtracting" class="spinner" :size="18" />
              <Sparkles v-else :size="18" />
              <span>{{ isExtracting ? 'WASM 高速抽出処理中...' : '抽出（パース）実行' }}</span>
            </button>
          </div>

          <!-- 抽出結果エリア -->
          <div v-if="extractedResult" class="result-box-card">
            <div class="result-header">
              <div class="result-title-group">
                <CheckCircle2 :size="18" class="text-success" />
                <span class="result-title">抽出完了</span>
                <span class="badge-units">{{ extractedResult.unitCount }} ユニット</span>
                <span class="badge-format">{{ extractedResult.format.toUpperCase() }}</span>
              </div>

              <div class="result-actions-group">
                <!-- ShWvData の場合: 管理へ送る -->
                <button
                  v-if="extractedResult.format === 'shwv'"
                  class="btn-action-accent"
                  @click="handleSendToManage"
                  title="SheepComb の管理画面 (Manage) にデータを渡して移動します"
                >
                  <Database :size="15" />
                  <span>管理 (Manage) へ渡して移動 ➔</span>
                </button>

                <!-- ダウンロード / 保存 -->
                <button class="btn-action-primary" @click="handleDownloadExtractResult">
                  <Save :size="15" />
                  <span>{{ extractedResult.format === 'xliff' ? 'XLIFF (.xlf) を保存' : 'project.json を保存' }}</span>
                </button>

                <!-- フェイルセーフ救済 -->
                <button
                  class="btn-action-secondary"
                  @click="handleExportFailsafe"
                  title="緊急時用に対照 CSV とプレーン TXT を救出エクスポートします"
                >
                  <ShieldAlert :size="15" />
                  <span>フェイルセーフ出力 (CSV/TXT)</span>
                </button>
              </div>
            </div>

            <!-- XLIFF プレビュー (XLIFF 出力時) -->
            <div v-if="extractedResult.format === 'xliff' && extractedResult.xliffContent" class="xliff-preview-area">
              <div class="preview-header">XLIFF 1.2 XML プレビュー (先頭部分):</div>
              <pre class="preview-code">{{ extractedResult.xliffContent.slice(0, 1500) }}{{ extractedResult.xliffContent.length > 1500 ? '\n... (以降省略)' : '' }}</pre>
            </div>
          </div>
        </div>
      </AppCardCollapse>

      <!-- ============================================== -->
      <!-- 2. 復元・組み戻し (Merge / Rebuild) カード -->
      <!-- ============================================== -->
      <AppCardCollapse v-model:open="isMergeCardOpen" title="2. ドキュメント復元・組み戻し (Merge / Rebuild)">
        <template #header>
          <div class="card-header-custom">
            <Hammer :size="18" class="text-primary" />
            <span class="card-header-title">2. ドキュメント復元・組み戻し (Merge / Rebuild)</span>
            <span class="card-header-desc">— 確定した翻訳データを元ドキュメント（スケルトン）に差し込み</span>
          </div>
        </template>

        <div class="card-inner-flow">
          <div class="merge-inputs-columns">
            <!-- 左: 元ファイル（スケルトン）の指定 -->
            <div class="merge-column-box">
              <div class="column-box-header">
                <span class="col-title">① 元ファイル (スケルトン)</span>
                <label v-if="inputFiles.length > 0" class="checkbox-label-sm">
                  <input v-model="useExtractedSource" type="checkbox" />
                  <span>上で抽出した原稿ファイルを使用</span>
                </label>
              </div>

              <!-- 抽出原稿を使用する場合 -->
              <div v-if="useExtractedSource && inputFiles.length > 0" class="active-source-badge">
                <CheckCircle2 :size="16" class="text-success" />
                <div class="source-info">
                  <span class="source-name">{{ inputFiles[0]?.name }}</span>
                  <span class="source-sub">抽出セクションの原稿をそのままスケルトンとして流用します</span>
                </div>
              </div>

              <!-- 個別ドロップゾーン -->
              <div
                v-else
                class="dropzone-area-sm"
                :class="{ 'is-dragover': isSkeletonDragOver, 'has-file': !!mergeSkeletonFile }"
                @dragover.prevent="isSkeletonDragOver = true"
                @dragleave.prevent="isSkeletonDragOver = false"
                @drop.prevent="handleSkeletonDrop"
                @click="handleSkeletonClick"
              >
                <div v-if="mergeSkeletonFile" class="selected-file-simple">
                  <span class="file-ext-badge">{{ mergeSkeletonFile.ext.toUpperCase() }}</span>
                  <span class="file-name">{{ mergeSkeletonFile.name }}</span>
                  <button class="btn-clear-sm" @click.stop="mergeSkeletonFile = null">
                    <Trash2 :size="13" />
                  </button>
                </div>
                <div v-else class="dropzone-simple-prompt">
                  <FileUp :size="20" />
                  <span>元ファイルをドロップ / 選択</span>
                </div>
              </div>
            </div>

            <!-- 右: 翻訳データ (XLIFF / ShWvData) の指定 -->
            <div class="merge-column-box">
              <div class="column-box-header">
                <span class="col-title">② 翻訳データ (XLIFF / ShWvData)</span>
                <button
                  v-if="store.data"
                  class="btn-store-data-link"
                  @click="handleUseStoreDataForMerge"
                  title="現在管理画面で編集・保持しているデータを適用します"
                >
                  <Database :size="13" />
                  <span>管理ストアのデータを適用</span>
                </button>
              </div>

              <div
                class="dropzone-area-sm"
                :class="{ 'is-dragover': isTransDragOver, 'has-file': !!mergeTransFile }"
                @dragover.prevent="isTransDragOver = true"
                @dragleave.prevent="isTransDragOver = false"
                @drop.prevent="handleTransDrop"
                @click="handleTransClick"
              >
                <div v-if="mergeTransFile" class="selected-file-simple">
                  <CheckCircle2 :size="16" class="text-success" />
                  <span class="file-name">{{ mergeTransFile.name }}</span>
                  <button class="btn-clear-sm" @click.stop="mergeTransFile = null">
                    <Trash2 :size="13" />
                  </button>
                </div>
                <div v-else class="dropzone-simple-prompt">
                  <FileText :size="20" />
                  <span>XLIFF (.xlf) または JSON (.json) をドロップ / 選択</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 復元実行アクション -->
          <div class="action-submit-row">
            <button
              class="btn-primary-action btn-merge"
              :disabled="!activeSkeletonFile || !mergeTransFile || isMerging || !wasmReady"
              @click="handleMerge"
            >
              <Loader2 v-if="isMerging" class="spinner" :size="18" />
              <Hammer v-else :size="18" />
              <span>{{ isMerging ? 'WASM ドキュメント復元中...' : '元ファイルに復元（組み戻し）実行' }}</span>
            </button>
          </div>

          <!-- 復元結果エリア -->
          <div v-if="mergeResult" class="result-box-card merge-result-card">
            <div class="result-header">
              <div class="result-title-group">
                <CheckCircle2 :size="18" class="text-success" />
                <span class="result-title">完成文書の再構築に成功しました</span>
                <span class="badge-units">{{ mergeResult.fileName }}</span>
                <span class="badge-format">{{ formatFileSize(mergeResult.bytes.length) }}</span>
              </div>

              <div class="result-actions-group">
                <button class="btn-action-primary btn-save-merged" @click="handleSaveMergedDocument">
                  <Save :size="16" />
                  <span>完成文書を保存 (ダウンロード)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppCardCollapse>
    </div>
  </div>
</template>

<style scoped>
.suffolk-page-container {
  padding: 24px;
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ヘッダー */
.suffolk-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.icon-sheep {
  font-size: 1.6rem;
}

.version-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  vertical-align: middle;
}

.badge-experimental {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15));
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  letter-spacing: 0.02em;
}

.page-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  max-width: 820px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.status-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-indicator.ready .dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.status-indicator.loading .dot {
  background: #f59e0b;
  animation: pulse 1.2s infinite;
}

.fsa-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

/* レイアウト */
.suffolk-content-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header-custom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-header-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.card-inner-flow {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

/* ドロップゾーン */
.dropzone-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.015);
  padding: 32px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.dropzone-area:hover,
.dropzone-area.is-dragover {
  border-color: var(--primary, #3b82f6);
  background: rgba(59, 130, 246, 0.05);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.dropzone-icon {
  color: var(--primary, #3b82f6);
}

.dropzone-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropzone-prompt {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dropzone-sub {
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* ファイル一覧 */
.file-list-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-list-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.btn-text-danger {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 0.78rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
}

.file-list-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.file-ext-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.file-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-remove-file {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.btn-remove-file:hover {
  color: #ef4444;
}

/* 設定パネル */
.options-container {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.options-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px;
}

.option-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.format-toggle-group {
  display: flex;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 2px;
}

.btn-format {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.btn-format.active {
  background: var(--primary, #3b82f6);
  color: #fff;
}

.lang-inputs-pair {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-text-sm {
  width: 70px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  padding: 5px 8px;
  font-size: 0.82rem;
  text-align: center;
}

.switch-control {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.switch-control input {
  display: none;
}

.switch-slider {
  width: 34px;
  height: 18px;
  background: var(--border);
  border-radius: 9999px;
  position: relative;
  transition: 0.2s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  left: 2px;
  top: 2px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}

.switch-control input:checked + .switch-slider {
  background: var(--primary, #3b82f6);
}

.switch-control input:checked + .switch-slider::before {
  transform: translateX(16px);
}

.switch-text {
  font-size: 0.82rem;
  color: var(--text-primary);
}

/* 詳細設定 */
.advanced-toggle-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 10px;
}

.btn-toggle-advanced {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.btn-toggle-advanced:hover {
  color: var(--text-primary);
}

.advanced-options-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
}

.advanced-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advanced-section.highlight-section {
  background: rgba(59, 130, 246, 0.05);
  border: 1px dashed rgba(59, 130, 246, 0.3);
  padding: 10px;
  border-radius: var(--radius-xs);
}

.section-badge-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-active-format {
  font-size: 0.68rem;
  background: #10b981;
  color: #fff;
  padding: 1px 6px;
  border-radius: 9999px;
  margin-left: 6px;
}

.xlsx-grid-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.sub-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-field label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.sub-field input {
  width: 100%;
  text-align: left;
}

.sub-field.full-width {
  grid-column: 1 / -1;
}

.other-grid-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-primary);
  cursor: pointer;
}

.inline-subfield {
  flex-direction: row;
  align-items: center;
}

.select-sm {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  padding: 4px 8px;
  font-size: 0.8rem;
}

/* アクション実行ボタン */
.action-submit-row {
  display: flex;
  justify-content: flex-end;
}

.btn-primary-action {
  background: var(--primary, #3b82f6);
  color: #fff;
  border: none;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.btn-primary-action:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-merge {
  background: #10b981;
}

.spinner {
  animation: spin 1s linear infinite;
}

/* 抽出結果 */
.result-box-card {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.result-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-units {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.badge-format {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
}

.result-actions-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.btn-action-accent {
  background: #6366f1;
  color: #fff;
  border: none;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-primary {
  background: var(--primary, #3b82f6);
  color: #fff;
  border: none;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.xliff-preview-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.preview-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.preview-code {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 10px;
  font-family: monospace;
  font-size: 0.78rem;
  color: #a5b4fc;
  max-height: 180px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* 復元セクション 2カラム */
.merge-inputs-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 800px) {
  .merge-inputs-columns {
    grid-template-columns: 1fr;
  }
}

.merge-column-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.col-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.checkbox-label-sm {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-store-data-link {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #818cf8;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.active-source-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: var(--radius-xs);
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.source-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.source-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.dropzone-area-sm {
  border: 2px dashed var(--border);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.015);
  padding: 20px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone-area-sm:hover,
.dropzone-area-sm.is-dragover {
  border-color: var(--primary, #3b82f6);
  background: rgba(59, 130, 246, 0.05);
}

.dropzone-simple-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.selected-file-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.btn-clear-sm {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
}

.btn-clear-sm:hover {
  color: #ef4444;
}

.merge-result-card {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.4);
}

.btn-save-merged {
  background: #10b981;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
