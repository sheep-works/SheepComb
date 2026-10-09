<template>
  <div class="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
    
    <!-- ヘッダー -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-1 shadow-sm">
        <span>🐑 SheepGroom</span>
        <span class="text-white/20">|</span>
        <span>Office 対訳アラインツール</span>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-white">
        ファイルペアリング & アライン
      </h1>
      <p class="text-sm text-white/50 max-w-xl mx-auto">
        原文ファイルと訳文ファイルをマッチングし、一括で対訳エディタへ展開します。
      </p>
    </div>

    <!-- メインカード: ペアリングテーブル -->
    <div class="bg-[#161822] border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      
      <!-- カード上部ツールバー -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">📋</span>
          <div>
            <h2 class="font-bold text-base text-white/90">ファイル対応テーブル</h2>
            <p class="text-xs text-white/40">左右のファイルが正しくペアになっているか確認・調整してください</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-xs">
          <!-- 自動マッチング -->
          <button 
            v-if="dataFiles.length > 0"
            @click="autoMatchPairs"
            title="ファイル名の共通部分から左右のペアを自動推測してセットします"
            class="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all font-medium flex items-center gap-1.5 shadow-sm"
          >
            <span>✨ 自動ペアリング</span>
          </button>

          <!-- 新規ペア行追加 -->
          <button 
            @click="addPairRow"
            class="px-3 py-1.5 rounded-xl bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 border border-white/10 hover:border-white/20 transition-all font-medium flex items-center gap-1.5 shadow-sm"
          >
            <span>➕ ペア行を追加</span>
          </button>
        </div>
      </div>

      <!-- ペアリングテーブル (table-fixed & 折り返し対応) -->
      <div class="w-full overflow-hidden">
        <table class="w-full table-fixed text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/10 pb-2">
              <th class="py-2.5 px-2 w-12 text-center">No</th>
              <th class="py-2.5 px-3 w-[calc(50%-36px)] text-cyan-400">📄 原文ファイル (Source)</th>
              <th class="py-2.5 px-3 w-[calc(50%-36px)] text-teal-400">🌐 訳文ファイル (Target)</th>
              <th class="py-2.5 px-2 w-12 text-center">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.05] text-xs">
            <tr 
              v-for="(pair, idx) in pairs" 
              :key="pair.id"
              class="hover:bg-white/[0.02] transition-colors group"
            >
              <!-- 行番号 -->
              <td class="py-3 px-2 text-center font-mono text-white/40 font-bold align-top pt-5">
                #{{ idx + 1 }}
              </td>

              <!-- 原文ファイル列 (折り返し優先) -->
              <td class="py-3 px-3 align-top">
                <div class="flex items-start space-x-2">
                  <div class="flex-1 min-w-0 bg-[#141621] p-3 rounded-xl border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                    <p class="font-mono text-xs text-white/90 font-semibold break-all leading-relaxed" :title="pair.srcPath">
                      {{ getFileName(pair.srcPath) || '（未選択）' }}
                    </p>
                    <p v-if="pair.srcPath" class="font-mono text-[10px] text-white/40 break-all mt-1 leading-snug" :title="pair.srcPath">
                      {{ pair.srcPath }}
                    </p>
                  </div>
                  <button 
                    @click="selectSourceForPair(idx)"
                    class="p-2.5 bg-[#1a1d2e] hover:bg-[#252a3a] text-cyan-300 text-xs rounded-xl border border-white/10 hover:border-cyan-500/40 shrink-0 transition-colors mt-0.5 shadow-sm"
                    title="ファイル選択ダイアログを開く"
                  >
                    📂
                  </button>
                </div>
              </td>

              <!-- 訳文ファイル列 (折り返し優先) -->
              <td class="py-3 px-3 align-top">
                <div class="flex items-start space-x-2">
                  <div class="flex-1 min-w-0 bg-[#141621] p-3 rounded-xl border border-white/5 group-hover:border-teal-500/30 transition-colors">
                    <p class="font-mono text-xs text-white/90 font-semibold break-all leading-relaxed" :title="pair.tgtPath">
                      {{ getFileName(pair.tgtPath) || '（未選択）' }}
                    </p>
                    <p v-if="pair.tgtPath" class="font-mono text-[10px] text-white/40 break-all mt-1 leading-snug" :title="pair.tgtPath">
                      {{ pair.tgtPath }}
                    </p>
                  </div>
                  
                  <!-- 訳文選択ダイアログボタン -->
                  <button 
                    @click="selectTargetForPair(idx)"
                    class="p-2.5 bg-[#1a1d2e] hover:bg-[#252a3a] text-teal-300 text-xs rounded-xl border border-white/10 hover:border-teal-500/40 shrink-0 transition-colors mt-0.5 shadow-sm"
                    title="ファイル選択ダイアログを開く"
                  >
                    📂
                  </button>

                  <!-- 訳文の上下シフトボタン -->
                  <div class="flex flex-col space-y-1 shrink-0 mt-0.5">
                    <button 
                      @click="shiftTargetUp(idx)"
                      :disabled="idx === 0"
                      class="px-1.5 py-0.5 bg-[#1a1d2e] hover:bg-[#252a3a] disabled:opacity-20 text-white/60 text-[10px] rounded border border-white/5"
                      title="訳文を1行上にシフト"
                    >
                      ▲
                    </button>
                    <button 
                      @click="shiftTargetDown(idx)"
                      :disabled="idx === pairs.length - 1"
                      class="px-1.5 py-0.5 bg-[#1a1d2e] hover:bg-[#252a3a] disabled:opacity-20 text-white/60 text-[10px] rounded border border-white/5"
                      title="訳文を1行下にシフト"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </td>

              <!-- 行操作 (削除) -->
              <td class="py-3 px-2 text-center align-top pt-4">
                <button 
                  @click="removePairRow(idx)"
                  :disabled="pairs.length <= 1"
                  class="p-2 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 disabled:opacity-10 rounded-lg transition-colors"
                  title="このペア行を削除"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- アクションボタンエリア -->
      <div class="flex flex-col items-center justify-center pt-4 space-y-2">
        <button 
          @click="startAllAlign"
          :disabled="!validPairsCount || isLoading"
          class="w-full md:w-auto px-10 py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-xl shadow-teal-900/40 transition-all flex items-center justify-center gap-2.5"
        >
          <span v-if="isLoading" class="animate-spin text-base">⏳</span>
          <span v-else>⚡</span>
          <span>{{ isLoading ? '全ペアの対訳を抽出中...' : `全 ${validPairsCount} ペアを一括抽出してアラインを開始` }}</span>
        </button>
        <span v-if="validPairsCount < pairs.length" class="text-[11px] text-amber-400/80">
          ⚠️ 未設定のペア行があります (有効なペアのみ抽出されます)
        </span>
      </div>

    </div>

    <!-- サブカード: 既存の Files.xlsx / TSV を開く -->
    <div class="bg-[#161822]/60 border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <span class="text-lg">📊</span>
          <h3 class="font-bold text-sm text-white/90">既存の Excel (Files.xlsx) や TSV を開く</h3>
        </div>
        <p class="text-xs text-white/40">
          過去に出力した Files.xlsx やクリップボードのテキストをそのまま読み込んで微調整します。
        </p>
      </div>
      <button 
        @click="$emit('open-importer')"
        class="px-4 py-2 bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-sm"
      >
        📂 ファイル / テキスト読込
      </button>
    </div>

    <!-- data/ フォルダ検出ファイル一覧 -->
    <div v-if="dataFiles.length > 0" class="bg-[#161822]/40 border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-base">📁</span>
          <h3 class="font-bold text-xs text-white/80 uppercase tracking-wider">data/ フォルダ内の検出ファイル</h3>
        </div>
        <span class="text-[11px] text-white/40">{{ dataFiles.length }} 件検出</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
        <div 
          v-for="file in dataFiles" 
          :key="file.path"
          class="flex items-center justify-between p-2.5 rounded-xl bg-[#141621] border border-white/5 text-xs text-white/70"
        >
          <span class="break-all font-mono text-[11px] text-white/90 mr-2" :title="file.name">{{ file.name }}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40 shrink-0 uppercase">
            {{ file.extension.replace('.', '') }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { SheetData, FilePair, DataFileInfo } from '../types/align';

const emit = defineEmits<{
  (e: 'start-align', sheets: SheetData[]): void;
  (e: 'open-importer'): void;
  (e: 'show-toast', message: string): void;
}>();

const pairs = ref<FilePair[]>([
  { id: 'pair-1', srcPath: '', tgtPath: '' }
]);

const isLoading = ref(false);
const dataFiles = ref<DataFileInfo[]>([]);

const validPairsCount = computed(() => {
  return pairs.value.filter(p => !!p.srcPath && !!p.tgtPath).length;
});

function getFileName(p: string): string {
  if (!p) return '';
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1];
}

onMounted(async () => {
  if (window.pywebview?.api?.scan_data_folder) {
    try {
      dataFiles.value = await window.pywebview.api.scan_data_folder();
      if (dataFiles.value.length > 0) {
        autoMatchPairs();
      }
    } catch (e) {
      console.warn('Scan data folder failed:', e);
    }
  }
});

// ファイル名の類似度・サフィックスから自動ペアリングを構築
function autoMatchPairs() {
  if (dataFiles.value.length === 0) return;

  const files = [...dataFiles.value];
  const newPairs: FilePair[] = [];

  if (files.length === 2) {
    newPairs.push({
      id: `pair-${Date.now()}-1`,
      srcPath: files[0].path,
      tgtPath: files[1].path
    });
    pairs.value = newPairs;
    return;
  }

  const used = new Set<string>();

  for (let i = 0; i < files.length; i++) {
    const f1 = files[i];
    if (used.has(f1.path)) continue;

    let bestMatch: DataFileInfo | null = null;
    let bestScore = -1;

    for (let j = 0; j < files.length; j++) {
      if (i === j) continue;
      const f2 = files[j];
      if (used.has(f2.path)) continue;

      if (f1.extension === f2.extension) {
        const score = getSimilarityScore(f1.name, f2.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = f2;
        }
      }
    }

    if (bestMatch && bestScore > 0.4) {
      used.add(f1.path);
      used.add(bestMatch.path);
      newPairs.push({
        id: `pair-${Date.now()}-${newPairs.length + 1}`,
        srcPath: f1.path,
        tgtPath: bestMatch.path
      });
    } else {
      used.add(f1.path);
      newPairs.push({
        id: `pair-${Date.now()}-${newPairs.length + 1}`,
        srcPath: f1.path,
        tgtPath: ''
      });
    }
  }

  if (newPairs.length > 0) {
    pairs.value = newPairs;
    emit('show-toast', `✨ ${newPairs.length} 件のペア候補を自動設定しました`);
  }
}

function getSimilarityScore(s1: string, s2: string): number {
  const clean = (s: string) => s.replace(/(_ja|_en|-ja|-en|_jp|_ct|-ct|-ckd|\.docx|\.pptx|\.xlsx)/gi, '');
  const c1 = clean(s1).toLowerCase();
  const c2 = clean(s2).toLowerCase();
  if (c1 === c2) return 1.0;
  if (c1.includes(c2) || c2.includes(c1)) return 0.8;
  return 0.0;
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

function shiftTargetUp(index: number) {
  if (index <= 0) return;
  const temp = pairs.value[index].tgtPath;
  pairs.value[index].tgtPath = pairs.value[index - 1].tgtPath;
  pairs.value[index - 1].tgtPath = temp;
}

function shiftTargetDown(index: number) {
  if (index >= pairs.value.length - 1) return;
  const temp = pairs.value[index].tgtPath;
  pairs.value[index].tgtPath = pairs.value[index + 1].tgtPath;
  pairs.value[index + 1].tgtPath = temp;
}

async function selectSourceForPair(index: number) {
  if (window.pywebview?.api?.select_file_dialog) {
    const selected = await window.pywebview.api.select_file_dialog('原文ファイルを選択');
    if (selected) pairs.value[index].srcPath = selected;
  }
}

async function selectTargetForPair(index: number) {
  if (window.pywebview?.api?.select_file_dialog) {
    const selected = await window.pywebview.api.select_file_dialog('訳文ファイルを選択');
    if (selected) pairs.value[index].tgtPath = selected;
  }
}

async function startAllAlign() {
  const validPairs = pairs.value.filter(p => !!p.srcPath && !!p.tgtPath);
  if (validPairs.length === 0) return;

  isLoading.value = true;
  try {
    if (window.pywebview?.api?.extract_multi_pairs) {
      const res = await window.pywebview.api.extract_multi_pairs(validPairs);
      if (res.success && res.sheets && res.sheets.length > 0) {
        emit('start-align', res.sheets);
        const totalBlocks = res.sheets.reduce((acc, s) => acc + s.blocks.length, 0);
        emit('show-toast', `⚡ ${res.sheets.length} シート (${totalBlocks} ブロック) を一括抽出しました`);
      } else {
        emit('show-toast', `❌ 抽出失敗: ${res.error || 'エラーが発生しました'}`);
      }
    } else {
      emit('show-toast', '⚠️ デスクトップアプリ (pywebview) モードで実行してください');
    }
  } catch (err: any) {
    console.error(err);
    emit('show-toast', `❌ エラー: ${err.message || err}`);
  } finally {
    isLoading.value = false;
  }
}
</script>