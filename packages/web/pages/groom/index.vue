<template>
  <div class="groom-view min-h-[calc(100vh-120px)] flex flex-col bg-[#0f1117] text-white/90 selection:bg-teal-500/30 selection:text-teal-200">
    
    <!-- 画面1: ファイルペアリング (初期画面) -->
    <PairingView 
      v-if="currentView === 'pairing'"
      @start-align="handleStartAlign"
      @open-importer="showImporter = true"
      @show-toast="showToast"
    />

    <!-- 画面2: アラインエディタ -->
    <div v-else class="flex flex-col flex-1">
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
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-4">
        
        <!-- 検索・クイックバー -->
        <div class="flex items-center justify-between gap-4 bg-[#161822] p-3 rounded-2xl border border-white/[0.08] shadow-md">
          <div class="flex items-center space-x-2.5 flex-1 max-w-md bg-[#141621] px-3 py-1.5 rounded-xl border border-white/5 focus-within:border-teal-500/50 transition-colors">
            <span class="text-white/40 text-sm">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="テキストやセクション名を検索..." 
              class="bg-transparent text-xs text-white/90 focus:outline-none w-full placeholder:text-white/30"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="text-xs text-white/40 hover:text-white/80">✕</button>
          </div>

          <div class="flex items-center space-x-3">
            <button 
              @click="addNewBlock"
              class="px-3.5 py-1.5 rounded-xl bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 text-xs font-semibold border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 shadow-sm"
            >
              ➕ ブロック追加
            </button>
          </div>
        </div>

        <!-- ブロック一覧 -->
        <div v-if="filteredBlocks.length > 0" class="space-y-4">
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
        <div v-else class="text-center py-16 bg-[#161822]/60 rounded-3xl border border-dashed border-white/10 space-y-4">
          <div class="text-4xl">📄</div>
          <div class="space-y-1">
            <p class="text-sm font-semibold text-white/80">表示できるブロックがありません</p>
            <p class="text-xs text-white/40">ファイルを読み込むか、フィルタを解除してください</p>
          </div>
          <button 
            @click="currentView = 'pairing'"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-teal-900/30 transition-all"
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
      class="fixed bottom-6 right-6 z-50 bg-[#161822] border border-teal-500/40 text-teal-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md break-all"
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

// 画面ステート: 'pairing' (ファイル選択) ↔ 'editor' (アラインエディタ)
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

// 一致・不一致のカウント
const matchCount = computed(() => {
  return currentBlocks.value.filter(b => {
    const s = b.sourceText ? b.sourceText.split('\n').length : 0;
    const t = b.targetText ? b.targetText.split('\n').length : 0;
    return s === t;
  }).length;
});

const unmatchCount = computed(() => currentBlocks.value.length - matchCount.value);

// フィルタ・検索適用後のブロック一覧
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

// エディタ間の垂直移動 (Ctrl+Up / Ctrl+Down)
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

// Ctrl+Shift+Enter: カーソル以降を次ブロックへ送る
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
.groom-view {
  font-family: inherit;
}
</style>
