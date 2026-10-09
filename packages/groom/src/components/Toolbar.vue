<template>
  <header class="sticky top-0 z-30 bg-[#161822]/95 backdrop-blur border-b border-white/[0.08] shadow-lg px-4 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
      
      <!-- ロゴ & プロジェクト情報 & 戻るボタン -->
      <div class="flex items-center space-x-3">
        <!-- ファイル選択に戻るボタン -->
        <button 
          @click="$emit('back-to-pairing')"
          class="px-2.5 py-1 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-white/70 hover:text-white border border-white/10 text-xs font-medium transition-colors flex items-center gap-1"
          title="ファイルペアリング画面に戻る"
        >
          <span>🔙</span>
          <span class="hidden sm:inline">ファイル選択</span>
        </button>

        <div class="h-4 w-px bg-white/10"></div>

        <div class="flex items-center space-x-2">
          <span class="text-xl filter drop-shadow">🐑</span>
          <span class="font-bold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            SheepGroom Align
          </span>
        </div>

        <div class="h-4 w-px bg-white/10"></div>

        <!-- シート選択 -->
        <div v-if="sheets.length > 0" class="flex items-center space-x-2">
          <span class="text-xs text-white/50 font-medium">シート:</span>
          <select 
            :value="activeSheetIndex"
            @change="handleSelectChange"
            class="bg-[#1a1d2e] border border-white/10 text-xs rounded-lg px-2.5 py-1 text-white/90 focus:outline-none focus:border-teal-500 font-medium cursor-pointer transition-colors"
          >
            <option v-for="(sheet, i) in sheets" :key="sheet.sheetName" :value="i">
              {{ sheet.sheetName }} ({{ sheet.blocks.length }} 件)
            </option>
          </select>
        </div>
      </div>

      <!-- 統計バッジ & フィルタ -->
      <div class="flex items-center space-x-3 text-xs">
        <div class="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#1a1d2e] border border-white/10">
          <span class="text-white/50">ブロック:</span>
          <span class="font-bold text-white/90">{{ totalBlocks }}</span>
          <span class="text-white/20">|</span>
          <span class="text-teal-400 font-medium">{{ matchCount }} 🟢 一致</span>
          <span v-if="unmatchCount > 0" class="text-amber-400 font-medium ml-1">
            / {{ unmatchCount }} 🟡 不一致
          </span>
        </div>

        <!-- 不一致のみトグル -->
        <button 
          @click="$emit('toggle-filter-unmatch')"
          :class="filterOnlyUnmatch 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
            : 'bg-[#1a1d2e] text-white/60 border-white/10 hover:text-white/90 hover:bg-[#252a3a]'"
          class="px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 font-medium"
        >
          <span>⚠️ 不一致のみ</span>
        </button>
      </div>

      <!-- アクションボタン群 -->
      <div class="flex items-center space-x-2 text-xs">
        <!-- 一括パディング -->
        <button 
          @click="$emit('pad-all')"
          title="すべての不一致ブロックを一括で空行パディングして行数を揃えます"
          class="px-3 py-1.5 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-white/80 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 font-medium"
        >
          🧹 一括揃え
        </button>

        <!-- 全 {|} を改行に置換 -->
        <button 
          @click="$emit('replace-all-pipes')"
          title="全ブロック内のすべての {|} を改行に一括置換します"
          class="px-3 py-1.5 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all flex items-center gap-1.5 font-medium"
        >
          ↵ 全 {|} を改行に
        </button>

        <!-- TSV コピー -->
        <button 
          @click="$emit('copy-tsv')"
          class="px-3 py-1.5 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-white/80 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 font-medium"
        >
          📋 TSVコピー
        </button>

        <!-- XLSX 保存 (Teal Accent Button) -->
        <button 
          @click="$emit('export-xlsx')"
          class="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md shadow-teal-900/30 transition-all flex items-center gap-1.5"
        >
          💾 Excel保存
        </button>

        <!-- 新規ファイル読み込み -->
        <button 
          @click="$emit('open-importer')"
          class="px-3 py-1.5 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-white/80 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1 font-medium"
        >
          📂 読込
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SheetData } from '../types/align';

defineProps<{
  sheets: SheetData[];
  activeSheetIndex: number;
  totalBlocks: number;
  matchCount: number;
  unmatchCount: number;
  filterOnlyUnmatch: boolean;
}>();

const emit = defineEmits<{
  (e: 'back-to-pairing'): void;
  (e: 'change-sheet', index: number): void;
  (e: 'toggle-filter-unmatch'): void;
  (e: 'pad-all'): void;
  (e: 'replace-all-pipes'): void;
  (e: 'copy-tsv'): void;
  (e: 'export-xlsx'): void;
  (e: 'open-importer'): void;
}>();

function handleSelectChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  emit('change-sheet', Number(target.value));
}
</script>