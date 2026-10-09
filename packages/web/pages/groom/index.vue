<template>
  <div class="groom-page-root">
    
    <!-- 画面1: ファイルペアリング (初期画面) -->
    <PairingView 
      v-if="currentView === 'pairing'"
      @start-align="handleStartAlign"
      @open-importer="showImporter = true"
      @show-toast="showToast"
    />

    <!-- 画面2: アラインエディタ -->
    <div v-else class="editor-view-wrapper">
      <!-- ツールバー -->
      <Toolbar 
        :sheets="sheets"
        :active-sheet-index="activeSheetIndex"
        :total-blocks="currentBlocks.length"
        :match-count="matchCount"
        :unmatch-count="unmatchCount"
        :filter-only-unmatch="filterOnlyUnmatch"
        @back-to-pairing="currentView = 'pairing'"
        @change-sheet="activeSheetIndex = $event"
        @toggle-filter-unmatch="filterOnlyUnmatch = !filterOnlyUnmatch"
        @pad-all="handlePadAll"
        @replace-all-pipes="handleReplaceAllPipes"
        @copy-tsv="handleCopyTsv"
        @export-xlsx="handleExportXlsx"
        @open-importer="showImporter = true"
      />

      <!-- メインコンテンツ -->
      <main class="editor-main-container">
        
        <!-- 検索・クイック操作バー -->
        <div class="search-action-bar">
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="テキストやセクション名を検索..." 
              class="search-input"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">✕</button>
          </div>

          <div class="action-buttons-group">
            <button 
              @click="addNewBlock"
              class="btn-add-block"
            >
              ➕ ブロック追加
            </button>
          </div>
        </div>

        <!-- ブロック一覧 -->
        <div v-if="filteredBlocks.length > 0" class="block-cards-list">
          <BlockCard 
            v-for="block in filteredBlocks"
            :key="block.id"
            :ref="(el) => setCardRef(el, getActualIndex(block))"
            :block="block"
            :index="getActualIndex(block)"
            :has-next="getActualIndex(block) < currentBlocks.length - 1"
            @merge-with-next="handleMergeWithNext"
            @remove-block="handleRemoveBlock"
            @push-down="handlePushDown"
            @navigate-editor="handleNavigateEditor"
          />
        </div>

        <!-- 空状態 -->
        <div v-else class="empty-state-box">
          <div class="empty-icon">📄</div>
          <div class="empty-texts">
            <p class="empty-title">表示できるブロックがありません</p>
            <p class="empty-desc">ファイルを読み込むか、検索・フィルタを解除してください</p>
          </div>
          <button 
            @click="currentView = 'pairing'"
            class="btn-return-pairing"
          >
            ファイル選択画面へ戻る
          </button>
        </div>

      </main>
    </div>

    <!-- インポーターモーダル (既存Excel / TSV読み込み用) -->
    <DropZone 
      v-if="showImporter"
      :can-close="true"
      @file-loaded="handleFileLoaded"
      @text-loaded="handleTextLoaded"
      @close="showImporter = false"
    />

    <!-- トースト通知 -->
    <div 
      v-if="toastMessage" 
      class="toast-notification"
    >
      <span>{{ toastMessage }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { SheetData, AlignBlock } from '~/types/groom';
import { parseXlsx, parseTsvOrText, exportToXlsx, exportAllSheetsToXlsx, exportToPaddedTsv } from '~/utils/groomParser';
import PairingView from '~/components/groom/PairingView.vue';
import Toolbar from '~/components/groom/Toolbar.vue';
import BlockCard from '~/components/groom/BlockCard.vue';
import DropZone from '~/components/groom/DropZone.vue';

definePageMeta({
  title: 'SheepGroom Align',
});

const currentView = ref<'pairing' | 'editor'>('pairing');

const sheets = ref<SheetData[]>([]);
const activeSheetIndex = ref(0);
const filterOnlyUnmatch = ref(false);
const searchQuery = ref('');
const showImporter = ref(false);
const toastMessage = ref('');

const cardRefs = ref<Map<number, any>>(new Map());

function setCardRef(el: any, index: number) {
  if (el) {
    cardRefs.value.set(index, el);
  } else {
    cardRefs.value.delete(index);
  }
}

const currentSheet = computed(() => sheets.value[activeSheetIndex.value] || { sheetName: '', blocks: [] });
const currentBlocks = computed(() => currentSheet.value.blocks);

const matchCount = computed(() => {
  return currentBlocks.value.filter(b => {
    const s = b.sourceText ? b.sourceText.split('\n').length : 0;
    const t = b.targetText ? b.targetText.split('\n').length : 0;
    return s === t;
  }).length;
});

const unmatchCount = computed(() => currentBlocks.value.length - matchCount.value);

const filteredBlocks = computed(() => {
  return currentBlocks.value.filter(b => {
    if (filterOnlyUnmatch.value) {
      const s = b.sourceText ? b.sourceText.split('\n').length : 0;
      const t = b.targetText ? b.targetText.split('\n').length : 0;
      if (s === t) return false;
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const matched = b.sectionName.toLowerCase().includes(q) ||
        b.sourceText.toLowerCase().includes(q) ||
        b.targetText.toLowerCase().includes(q);
      if (!matched) return false;
    }
    return true;
  });
});

function getActualIndex(block: AlignBlock): number {
  return currentBlocks.value.findIndex(b => b.id === block.id);
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 3500);
}

function handleNavigateEditor(index: number, side: 'source' | 'target', direction: 'up' | 'down') {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex >= 0 && targetIndex < currentBlocks.value.length) {
    nextTick(() => {
      const card = cardRefs.value.get(targetIndex);
      if (card) {
        card.focusSide(side, 'start');
      }
    });
  }
}

function handlePushDown(index: number, side: 'source' | 'target', remainingText: string, pushedText: string) {
  const currBlock = currentBlocks.value[index];
  const sideKey = side === 'source' ? 'sourceText' : 'targetText';

  currBlock[sideKey] = remainingText;

  const hasNext = index < currentBlocks.value.length - 1;
  const nextBlock = hasNext ? currentBlocks.value[index + 1] : null;

  if (nextBlock && !nextBlock[sideKey]?.trim()) {
    nextBlock[sideKey] = pushedText;
    showToast(`⬇️ 次のブロック #${index + 2} にテキストを挿入しました`);
    nextTick(() => {
      const card = cardRefs.value.get(index + 1);
      if (card) card.focusSide(side, 'start');
    });
  } else {
    const newBlock: AlignBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sectionName: `${currBlock.sectionName} (Split)`,
      sourceText: side === 'source' ? pushedText : '',
      targetText: side === 'target' ? pushedText : '',
    };

    currentBlocks.value.splice(index + 1, 0, newBlock);
    showToast(`✂️ 新しいブロック #${index + 2} を挿入しました`);
    nextTick(() => {
      const card = cardRefs.value.get(index + 1);
      if (card) card.focusSide(side, 'start');
    });
  }
}

function handleStartAlign(extractedSheets: SheetData[]) {
  sheets.value = extractedSheets;
  activeSheetIndex.value = 0;
  currentView.value = 'editor';
}

async function handleFileLoaded(file: File) {
  try {
    const buffer = await file.arrayBuffer();
    const parsedSheets = await parseXlsx(buffer);
    if (parsedSheets.length > 0) {
      sheets.value = parsedSheets;
      activeSheetIndex.value = 0;
      showImporter.value = false;
      currentView.value = 'editor';
      showToast(`📊 ${file.name} から ${parsedSheets.length} シートを読み込みました`);
    } else {
      showToast('⚠️ 有効なシートデータが見つかりませんでした');
    }
  } catch (err) {
    console.error(err);
    showToast('❌ ファイル読み込みに失敗しました');
  }
}

function handleTextLoaded(text: string) {
  const blocks = parseTsvOrText(text);
  if (blocks.length > 0) {
    sheets.value = [{
      sheetName: 'Imported',
      blocks,
    }];
    activeSheetIndex.value = 0;
    showImporter.value = false;
    currentView.value = 'editor';
    showToast(`📝 ${blocks.length} 件のブロックを読み込みました`);
  }
}

function handleMergeWithNext(index: number) {
  if (index >= currentBlocks.value.length - 1) return;
  const curr = currentBlocks.value[index];
  const next = currentBlocks.value[index + 1];

  const mergedSource = [curr.sourceText, next.sourceText].filter(Boolean).join('\n');
  const mergedTarget = [curr.targetText, next.targetText].filter(Boolean).join('\n');

  curr.sourceText = mergedSource;
  curr.targetText = mergedTarget;
  curr.sectionName = `${curr.sectionName} + ${next.sectionName}`;

  currentBlocks.value.splice(index + 1, 1);
  showToast(`🔗 #${index + 1} と #${index + 2} を合体しました`);
}

function handleRemoveBlock(index: number) {
  if (confirm(`ブロック #${index + 1} を削除しますか？`)) {
    currentBlocks.value.splice(index, 1);
    showToast(`🗑️ ブロック #${index + 1} を削除しました`);
  }
}

function addNewBlock() {
  const newBlock: AlignBlock = {
    id: `block-${Date.now()}`,
    sectionName: `Section ${currentBlocks.value.length + 1}`,
    sourceText: '',
    targetText: '',
  };
  currentBlocks.value.push(newBlock);
  showToast('➕ 新規ブロックを追加しました');
}

function handlePadAll() {
  let count = 0;
  for (const block of currentBlocks.value) {
    const sLines = block.sourceText ? block.sourceText.split('\n') : [];
    const tLines = block.targetText ? block.targetText.split('\n') : [];
    if (sLines.length !== tLines.length) {
      const max = Math.max(sLines.length, tLines.length);
      while (sLines.length < max) sLines.push('');
      while (tLines.length < max) tLines.push('');
      block.sourceText = sLines.join('\n');
      block.targetText = tLines.join('\n');
      count++;
    }
  }
  showToast(`🧹 ${count} 件のブロックを行数パディングしました`);
}

function handleReplaceAllPipes() {
  for (const block of currentBlocks.value) {
    if (block.sourceText && block.sourceText.includes('{|}')) {
      block.sourceText = block.sourceText.replace(/\{\|\}/g, '\n');
    }
    if (block.targetText && block.targetText.includes('{|}')) {
      block.targetText = block.targetText.replace(/\{\|\}/g, '\n');
    }
  }
  showToast(`↵ 全ブロック内の {|} を改行に置換しました`);
}

async function handleCopyTsv() {
  const tsv = exportToPaddedTsv(currentBlocks.value, currentSheet.value.sheetName);
  await navigator.clipboard.writeText(tsv);
  showToast('📋 TSV をクリップボードにコピーしました（Excelに貼付可能）');
}

async function handleExportXlsx() {
  const buffer = sheets.value.length > 1
    ? exportAllSheetsToXlsx(sheets.value)
    : exportToXlsx(currentSheet.value);

  const blob = new Blob([buffer.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentSheet.value.sheetName || 'aligned'}_aligned.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Excel ファイルをダウンロードしました');
}
</script>

<style scoped>
.groom-page-root {
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.editor-view-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.editor-main-container {
  flex: 1;
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--bg-secondary);
  padding: 12px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 420px;
  background: var(--bg-input);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  transition: border-color var(--transition);
}

.search-input-box:focus-within {
  border-color: var(--accent);
}

.search-icon {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.search-input {
  background: transparent;
  border: none;
  font-size: 0.8rem;
  color: var(--text-primary);
  width: 100%;
}

.search-input:focus {
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.btn-clear-search {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-add-block {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-add-block:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.block-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state-box {
  text-align: center;
  padding: 64px 20px;
  background: rgba(22, 24, 34, 0.5);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 2.5rem;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-return-pairing {
  padding: 8px 18px;
  border-radius: var(--radius-xs);
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition);
}

.btn-return-pairing:hover {
  background: var(--accent-hover);
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  background: var(--bg-secondary);
  border: 1px solid var(--accent);
  color: #34d399;
  font-size: 0.75rem;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  word-break: break-all;
}
</style>
