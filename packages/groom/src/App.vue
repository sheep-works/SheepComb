<template>
  <div class="min-h-screen flex flex-col bg-[#0f1117] text-white/90 selection:bg-teal-500/30 selection:text-teal-200 font-sans antialiased">
    
    <!-- 画面1: ファイルペアリング (初期画面) -->
    <PairingView 
      v-if="currentView === 'pairing'"
      @start-align="handleStartAlign"
      @open-importer="showImporter = true"
      @show-toast="showToast"
    />

    <!-- 画面2: アラインエディタ -->
    <div v-else class="flex flex-col min-h-screen">
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
        @open-split-modal="showSplitModal = true"
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
              v-if="filterOnlyUnmatch"
              @click="filterOnlyUnmatch = false"
              class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm"
              title="不一致のみフィルタを解除して全件表示"
            >
              <span>⚠️ 不一致のみ表示中</span>
              <span class="text-amber-300/70 hover:text-white font-bold ml-0.5">✕</span>
            </button>
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
            @shift-up="handleShiftUp"
            @shift-down="handleShiftDown"
          />
        </div>

        <!-- 空状態 -->
        <div v-else class="text-center py-16 bg-[#161822]/60 rounded-3xl border border-dashed border-white/10 space-y-4">
          <div class="text-4xl">{{ unmatchCount === 0 && filterOnlyUnmatch ? '🎉' : '📄' }}</div>
          <div class="space-y-1">
            <p class="text-sm font-semibold text-white/80">
              {{ unmatchCount === 0 && filterOnlyUnmatch ? 'すべてのブロックの行数が一致しました！' : '表示できるブロックがありません' }}
            </p>
            <p class="text-xs text-white/40">
              {{ unmatchCount === 0 && filterOnlyUnmatch ? '不一致ブロックがすべて解消されました。フィルタを解除して全ブロックを確認・編集できます。' : (filterOnlyUnmatch || searchQuery ? 'フィルタまたは検索条件をリセットして全件表示できます' : 'ファイルを読み込んでください') }}
            </p>
          </div>
          <div class="flex items-center justify-center gap-3">
            <button 
              v-if="filterOnlyUnmatch || searchQuery"
              @click="filterOnlyUnmatch = false; searchQuery = ''"
              class="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-teal-900/30 transition-all flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>フィルタを解除して全ブロックを表示</span>
            </button>
            <button 
              @click="currentView = 'pairing'"
              class="px-4 py-2 bg-[#1a1d2e] hover:bg-[#252a3a] text-white/80 border border-white/10 text-xs font-semibold rounded-xl transition-all"
            >
              ファイル選択画面へ戻る
            </button>
          </div>
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

    <!-- 次の後で改行 (文分割) モーダル -->
    <SplitNewlineModal 
      v-if="showSplitModal"
      :total-blocks="currentBlocks.length"
      :unmatch-count="unmatchCount"
      @apply="handleApplySplit"
      @close="showSplitModal = false"
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
import type { SheetData, AlignBlock } from './types/align';
import { parseXlsx, parseTsvOrText, exportToXlsx, exportAllSheetsToXlsx, exportToPaddedTsv, splitTextAfterChars } from './utils/parser';
import PairingView from './components/PairingView.vue';
import Toolbar from './components/Toolbar.vue';
import BlockCard from './components/BlockCard.vue';
import DropZone from './components/DropZone.vue';
import SplitNewlineModal from './components/SplitNewlineModal.vue';

// 画面ステート: 'pairing' (ファイル選択) ↔ 'editor' (アラインエディタ)
const currentView = ref<'pairing' | 'editor'>('pairing');

const sheets = ref<SheetData[]>([]);
const activeSheetIndex = ref(0);
const filterOnlyUnmatch = ref(false);
const searchQuery = ref('');
const showImporter = ref(false);
const showSplitModal = ref(false);
const toastMessage = ref('');

const cardRefs = ref<Map<number, InstanceType<typeof BlockCard>>>(new Map());

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

// Ctrl+Shift+Enter: カーソル以降を次ブロックへ送る (空白なら挿入、相手方は空ブロック)
function handlePushDown(index: number, side: 'source' | 'target', remainingText: string, pushedText: string) {
  const currBlock = currentBlocks.value[index];
  const sideKey = side === 'source' ? 'sourceText' : 'targetText';

  // 現在のブロックのテキストを残り部分に更新
  currBlock[sideKey] = remainingText;

  const hasNext = index < currentBlocks.value.length - 1;
  const nextBlock = hasNext ? currentBlocks.value[index + 1] : null;

  // 分岐: 次のブロックが存在し、かつそのサイドが空文字（空白のみ）の場合
  if (nextBlock && !nextBlock[sideKey]?.trim()) {
    nextBlock[sideKey] = pushedText;
    showToast(`⬇️ 次のブロック #${index + 2} にテキストを挿入しました`);
    nextTick(() => {
      const card = cardRefs.value.get(index + 1);
      if (card) card.focusSide(side, 'start');
    });
  } else {
    // 次のブロックが存在しない、またはすでにテキストがある場合は新規ブロックを挿入
    const newBlock: AlignBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sectionName: `${currBlock.sectionName} (Split)`,
      sourceText: side === 'source' ? pushedText : '',
      targetText: side === 'target' ? pushedText : '',
    };

    currentBlocks.value.splice(index + 1, 0, newBlock);
    showToast(`✂️ 新しいブロック #${index + 2} を挿入しました (相手側は空白)`);
    nextTick(() => {
      const card = cardRefs.value.get(index + 1);
      if (card) card.focusSide(side, 'start');
    });
  }
}

// ダイレクト抽出からの開始ハンドラ
function handleStartAlign(extractedSheets: SheetData[]) {
  sheets.value = extractedSheets;
  activeSheetIndex.value = 0;
  currentView.value = 'editor';
}

// ファイル読み込みハンドラ (Excel)
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

// テキスト読み込みハンドラ (TSV)
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

// 下のブロックと合体
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

// ブロック削除
function handleRemoveBlock(index: number) {
  if (confirm(`ブロック #${index + 1} を削除しますか？`)) {
    currentBlocks.value.splice(index, 1);
    showToast(`🗑️ ブロック #${index + 1} を削除しました`);
  }
}

// 新規ブロック追加
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

// 一方のブロックのみ削除（繰り上げ）
function handleShiftUp(index: number, side: 'source' | 'target') {
  const sideKey = side === 'source' ? 'sourceText' : 'targetText';
  const label = side === 'source' ? '原文' : '訳文';

  if (!confirm(`ブロック #${index + 1} の【${label}】を削除し、以降の${label}を1段上に繰り上げますか？`)) {
    return;
  }

  // index から末尾直前までを 1 つずつ上にシフト
  for (let i = index; i < currentBlocks.value.length - 1; i++) {
    currentBlocks.value[i][sideKey] = currentBlocks.value[i + 1][sideKey];
  }
  // 最後のブロックの当該列を空にする
  currentBlocks.value[currentBlocks.value.length - 1][sideKey] = '';

  // 末尾ブロックが原文・訳文ともに空になった場合は末尾ブロックを削除（1ブロックのみの場合は残す）
  const lastBlock = currentBlocks.value[currentBlocks.value.length - 1];
  if (lastBlock && !lastBlock.sourceText.trim() && !lastBlock.targetText.trim() && currentBlocks.value.length > 1) {
    currentBlocks.value.pop();
  }

  showToast(`⬆️ ブロック #${index + 1} 以降の【${label}】を1段上に繰り上げました`);
}

// 一方のブロックのみ繰り下げ（空枠挿入）
function handleShiftDown(index: number, side: 'source' | 'target') {
  const sideKey = side === 'source' ? 'sourceText' : 'targetText';
  const label = side === 'source' ? '原文' : '訳文';

  // 最後のブロックの当該列にテキストがある場合、新ブロックを末尾に追加して押し出せるようにする
  const lastBlock = currentBlocks.value[currentBlocks.value.length - 1];
  if (lastBlock && lastBlock[sideKey]?.trim() !== '') {
    currentBlocks.value.push({
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sectionName: `Section ${currentBlocks.value.length + 1}`,
      sourceText: '',
      targetText: '',
    });
  }

  // 末尾から index までを後ろに1つずつシフト
  for (let i = currentBlocks.value.length - 1; i > index; i--) {
    currentBlocks.value[i][sideKey] = currentBlocks.value[i - 1][sideKey];
  }
  // 対象ブロックの当該列を空にする
  currentBlocks.value[index][sideKey] = '';

  showToast(`⬇️ ブロック #${index + 1} の【${label}】に空枠を挿入し、以降を繰り下げました`);
}

// 全ブロック一括パディング
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

// 全ブロックの全 {|} を改行に置換
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

// 次の後で改行 (文分割) の一括適用
function handleApplySplit(payload: {
  chars: string;
  targetSide: 'all' | 'source' | 'target';
  targetScope: 'all' | 'unmatched';
  trimSpaces: boolean;
}) {
  let count = 0;
  for (const block of currentBlocks.value) {
    if (payload.targetScope === 'unmatched') {
      const s = block.sourceText ? block.sourceText.split('\n').length : 0;
      const t = block.targetText ? block.targetText.split('\n').length : 0;
      if (s === t) continue;
    }

    let changed = false;
    if (payload.targetSide === 'all' || payload.targetSide === 'source') {
      const newText = splitTextAfterChars(block.sourceText, payload.chars, payload.trimSpaces);
      if (newText !== block.sourceText) {
        block.sourceText = newText;
        changed = true;
      }
    }
    if (payload.targetSide === 'all' || payload.targetSide === 'target') {
      const newText = splitTextAfterChars(block.targetText, payload.chars, payload.trimSpaces);
      if (newText !== block.targetText) {
        block.targetText = newText;
        changed = true;
      }
    }
    if (changed) count++;
  }

  showSplitModal.value = false;
  showToast(`↵ ${count} 件のブロックを「${payload.chars}」の後で改行分割しました`);
}

// TSV コピー
async function handleCopyTsv() {
  const tsv = exportToPaddedTsv(currentBlocks.value, currentSheet.value.sheetName);
  await navigator.clipboard.writeText(tsv);
  showToast('📋 TSV をクリップボードにコピーしました（Excelに貼付可能）');
}

// XLSX エクスポート (pywebview ネイティブ保存 / Web フォールバック)
async function handleExportXlsx() {
  if (window.pywebview?.api?.save_excel_file) {
    try {
      const defaultName = sheets.value.length === 1 
        ? `${sheets.value[0].sheetName || 'aligned'}_aligned.xlsx`
        : 'aligned_all.xlsx';

      const res = await window.pywebview.api.save_excel_file(
        sheets.value,
        defaultName
      );
      if (res.success && res.path) {
        showToast(`💾 保存完了: ${res.path}`);
        return;
      } else if (res.cancelled) {
        return;
      } else {
        showToast(`❌ 保存失敗: ${res.error || '不明なエラー'}`);
        return;
      }
    } catch (e: any) {
      console.error(e);
      showToast(`❌ 保存エラー: ${e.message || e}`);
      return;
    }
  }

  // Web ブラウザ環境でのフォールバックダウンロード
  const buffer = sheets.value.length > 1
    ? exportAllSheetsToXlsx(sheets.value)
    : exportToXlsx(currentSheet.value);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = sheets.value.length === 1 
    ? `${sheets.value[0].sheetName || 'aligned'}_aligned.xlsx`
    : 'aligned_all.xlsx';
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Excel ファイルをダウンロードしました');
}
</script>