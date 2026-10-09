<template>
  <div class="pairing-container">
    
    <!-- ヘッダー -->
    <div class="pairing-header">
      <div class="badge-pill">
        <span>🐑 SheepGroom</span>
        <span class="pill-sep">|</span>
        <span>対訳作成 & アライメント支援</span>
      </div>
      <h1 class="header-title">
        ファイルペアリング & アライン
      </h1>
      <p class="header-desc">
        原文ファイルと訳文ファイルをマッチングし、一括で対訳エディタへ展開します。Excel (.xlsx) や TSV、テキストを直接読み込んで整列・校正できます。
      </p>
    </div>

    <!-- メインカード: ペアリングテーブル -->
    <div class="card pairing-card">
      
      <!-- カード上部ツールバー -->
      <div class="card-toolbar">
        <div class="toolbar-title-group">
          <span class="toolbar-icon">📋</span>
          <div>
            <h2 class="toolbar-title">ファイル対応テーブル</h2>
            <p class="toolbar-desc">左右のファイルが正しくペアになっているか確認・調整してください</p>
          </div>
        </div>

        <div class="toolbar-actions">
          <!-- 複数ファイル一括選択 -->
          <label class="btn-action-tool btn-batch">
            <span>📂 ファイル一括読込</span>
            <input 
              type="file" 
              multiple 
              class="hidden-file-input" 
              accept=".xlsx,.xls,.tsv,.csv,.txt,.docx,.pptx"
              @change="handleBatchFileSelect"
            />
          </label>

          <!-- 新規ペア行追加 -->
          <button 
            @click="addPairRow"
            class="btn-action-tool btn-add-row"
          >
            <span>➕ ペア行を追加</span>
          </button>
        </div>
      </div>

      <!-- ペアリングテーブル -->
      <div class="table-wrapper">
        <table class="pairing-table">
          <thead>
            <tr>
              <th class="th-no">No</th>
              <th class="th-src">📄 原文ファイル (Source)</th>
              <th class="th-tgt">🌐 訳文ファイル (Target)</th>
              <th class="th-op">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(pair, idx) in pairs" 
              :key="pair.id"
            >
              <!-- 行番号 -->
              <td class="td-no">
                #{{ idx + 1 }}
              </td>

              <!-- 原文ファイル列 -->
              <td class="td-file">
                <div class="file-box-wrapper">
                  <div class="file-info-box box-src">
                    <p class="file-name" :title="pair.srcPath">
                      {{ getFileName(pair.srcPath) || '（未選択）' }}
                    </p>
                    <p v-if="pair.srcFile" class="file-size">
                      {{ (pair.srcFile.size / 1024).toFixed(1) }} KB
                    </p>
                  </div>
                  <label class="btn-select-file btn-select-src" title="ファイルを選択">
                    📂
                    <input type="file" class="hidden-file-input" accept=".xlsx,.xls,.tsv,.csv,.txt" @change="(e) => onSingleFileSelect(e, idx, 'src')" />
                  </label>
                </div>
              </td>

              <!-- 訳文ファイル列 -->
              <td class="td-file">
                <div class="file-box-wrapper">
                  <div class="file-info-box box-tgt">
                    <p class="file-name" :title="pair.tgtPath">
                      {{ getFileName(pair.tgtPath) || '（未選択）' }}
                    </p>
                    <p v-if="pair.tgtFile" class="file-size">
                      {{ (pair.tgtFile.size / 1024).toFixed(1) }} KB
                    </p>
                  </div>
                  <label class="btn-select-file btn-select-tgt" title="ファイルを選択">
                    📂
                    <input type="file" class="hidden-file-input" accept=".xlsx,.xls,.tsv,.csv,.txt" @change="(e) => onSingleFileSelect(e, idx, 'tgt')" />
                  </label>
                </div>
              </td>

              <!-- 操作列 -->
              <td class="td-op">
                <button 
                  v-if="pairs.length > 1"
                  @click="removePairRow(idx)"
                  class="btn-remove-row"
                  title="このペア行を削除"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- アクションボタンエリア -->
      <div class="bottom-actions">
        <button 
          @click="startAllAlign"
          :disabled="!validPairsCount || isLoading"
          class="btn-start-align"
        >
          <span v-if="isLoading" class="spinner">⏳</span>
          <span v-else>⚡</span>
          <span>{{ isLoading ? '対訳を展開中...' : `全 ${validPairsCount} ペアをアラインエディタへ展開` }}</span>
        </button>
        <span v-if="validPairsCount < pairs.length" class="warning-hint">
          ⚠️ 未設定のペア行があります (有効なペアのみ展開されます)
        </span>
      </div>

    </div>

    <!-- サブカード: 既存の Files.xlsx / TSV を開く -->
    <div class="card sub-importer-card">
      <div class="importer-info">
        <div class="importer-title">
          <span class="importer-icon">📊</span>
          <h3>既存の Excel (Files.xlsx) や TSV を開く</h3>
        </div>
        <p class="importer-desc">
          過去に出力した Files.xlsx やクリップボードのテキストをそのまま読み込んで微調整します。
        </p>
      </div>
      <button 
        @click="$emit('open-importer')"
        class="btn-open-importer"
      >
        📂 ファイル / テキスト読込
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SheetData, FilePair } from '~/types/groom';
import { parseXlsx } from '~/utils/groomParser';

const emit = defineEmits<{
  (e: 'start-align', sheets: SheetData[]): void;
  (e: 'open-importer'): void;
  (e: 'show-toast', message: string): void;
}>();

const pairs = ref<FilePair[]>([
  { id: 'pair-1', srcPath: '', tgtPath: '' }
]);

const isLoading = ref(false);

const validPairsCount = computed(() => {
  return pairs.value.filter(p => !!p.srcPath && !!p.tgtPath).length;
});

function getFileName(p: string): string {
  if (!p) return '';
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1];
}

function addPairRow() {
  pairs.value.push({
    id: `pair-${Date.now()}-${pairs.value.length + 1}`,
    srcPath: '',
    tgtPath: ''
  });
}

function removePairRow(index: number) {
  pairs.value.splice(index, 1);
}

function onSingleFileSelect(e: Event, index: number, side: 'src' | 'tgt') {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (side === 'src') {
    pairs.value[index].srcPath = file.name;
    pairs.value[index].srcFile = file;
  } else {
    pairs.value[index].tgtPath = file.name;
    pairs.value[index].tgtFile = file;
  }
}

function handleBatchFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const fileList = Array.from(input.files);

  if (fileList.length === 1 && fileList[0].name.endsWith('.xlsx')) {
    fileList[0].arrayBuffer().then(buf => {
      parseXlsx(buf).then(sheets => {
        if (sheets.length > 0) {
          emit('start-align', sheets);
          emit('show-toast', `📊 ${sheets.length} シートを読み込みました`);
        }
      });
    });
    return;
  }

  const newPairs: FilePair[] = [];
  const srcCandidates = fileList.filter(f => /(_ja|-ja|ja_|_jp|-jp)/i.test(f.name) || !/(_en|-en|en_|_zh|-zh)/i.test(f.name));
  const tgtCandidates = fileList.filter(f => /(_en|-en|en_|_zh|-zh)/i.test(f.name));

  if (srcCandidates.length > 0 && tgtCandidates.length > 0) {
    srcCandidates.forEach((sf, i) => {
      const tf = tgtCandidates[i] || null;
      newPairs.push({
        id: `pair-${Date.now()}-${i}`,
        srcPath: sf.name,
        tgtPath: tf ? tf.name : '',
        srcFile: sf,
        tgtFile: tf || undefined
      });
    });
  } else {
    for (let i = 0; i < fileList.length; i += 2) {
      newPairs.push({
        id: `pair-${Date.now()}-${i}`,
        srcPath: fileList[i]?.name || '',
        tgtPath: fileList[i + 1]?.name || '',
        srcFile: fileList[i],
        tgtFile: fileList[i + 1]
      });
    }
  }

  if (newPairs.length > 0) {
    pairs.value = newPairs;
    emit('show-toast', `✨ ${newPairs.length} 件のペア候補を読み込みました`);
  }
}

async function startAllAlign() {
  const validPairs = pairs.value.filter(p => !!p.srcPath && !!p.tgtPath);
  if (validPairs.length === 0) return;

  isLoading.value = true;
  try {
    const sheets: SheetData[] = [];

    for (let idx = 0; idx < validPairs.length; idx++) {
      const pair = validPairs[idx];
      const sheetName = `Pair ${idx + 1}`;

      let srcText = '';
      let tgtText = '';

      if (pair.srcFile) {
        srcText = await pair.srcFile.text();
      }
      if (pair.tgtFile) {
        tgtText = await pair.tgtFile.text();
      }

      const srcLines = srcText ? srcText.split(/\r?\n/) : [];
      const tgtLines = tgtText ? tgtText.split(/\r?\n/) : [];

      const blocks = [{
        id: `block-${Date.now()}-${idx}`,
        sectionName: pair.srcPath ? getFileName(pair.srcPath) : `Block 1`,
        sourceText: srcLines.join('\n'),
        targetText: tgtLines.join('\n'),
      }];

      sheets.push({
        sheetName,
        blocks
      });
    }

    if (sheets.length > 0) {
      emit('start-align', sheets);
      emit('show-toast', `⚡ ${sheets.length} 件のペアを展開しました`);
    }
  } catch (err: any) {
    console.error(err);
    emit('show-toast', `❌ エラー: ${err.message || err}`);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.pairing-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pairing-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #2dd4bf;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-sep {
  color: rgba(255, 255, 255, 0.2);
}

.header-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

.header-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 580px;
  line-height: 1.6;
}

.pairing-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.toolbar-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-icon {
  font-size: 1.25rem;
}

.toolbar-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.toolbar-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hidden-file-input {
  display: none;
}

.btn-action-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-batch {
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #2dd4bf;
}

.btn-batch:hover {
  background: rgba(20, 184, 166, 0.25);
}

.btn-add-row {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.btn-add-row:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.table-wrapper {
  overflow-x: auto;
}

.pairing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.pairing-table th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-align: left;
}

.th-no {
  width: 50px;
  text-align: center !important;
}

.th-src {
  color: #06b6d4 !important;
}

.th-tgt {
  color: #10b981 !important;
}

.th-op {
  width: 60px;
  text-align: center !important;
}

.pairing-table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: top;
}

.td-no {
  text-align: center;
  font-family: monospace;
  font-weight: 700;
  color: var(--text-muted);
  padding-top: 18px !important;
}

.td-file {
  width: calc(50% - 55px);
}

.file-box-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.file-info-box {
  flex: 1;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  min-height: 44px;
}

.file-name {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.file-size {
  font-size: 0.65rem;
  color: #2dd4bf;
  margin-top: 2px;
}

.btn-select-file {
  padding: 10px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--transition);
}

.btn-select-src:hover {
  border-color: #06b6d4;
}

.btn-select-tgt:hover {
  border-color: #10b981;
}

.td-op {
  text-align: center;
  padding-top: 14px !important;
}

.btn-remove-row {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-remove-row:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

.bottom-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
}

.btn-start-align {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 36px;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
  transition: all var(--transition);
}

.btn-start-align:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}

.btn-start-align:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.warning-hint {
  font-size: 0.72rem;
  color: #fbbf24;
}

.sub-importer-card {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.importer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.importer-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.importer-icon {
  font-size: 1.1rem;
}

.importer-title h3 {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.importer-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-open-importer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-xs);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-open-importer:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
}
</style>
