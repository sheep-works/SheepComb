<template>
  <header class="groom-toolbar">
    <div class="toolbar-inner">
      
      <!-- ロゴ & プロジェクト情報 & 戻るボタン -->
      <div class="toolbar-section">
        <!-- ファイル選択に戻るボタン -->
        <button 
          @click="$emit('back-to-pairing')"
          class="btn-back"
          title="ファイルペアリング画面に戻る"
        >
          <span>🔙</span>
          <span class="btn-text">ファイル選択</span>
        </button>

        <div class="divider"></div>

        <div class="brand-title">
          <span class="brand-icon">🐑</span>
          <span class="brand-text">SheepGroom Align</span>
        </div>

        <div class="divider"></div>

        <!-- シート選択 -->
        <div v-if="sheets.length > 0" class="sheet-selector">
          <span class="sheet-label">シート:</span>
          <select 
            :value="activeSheetIndex"
            @change="handleSelectChange"
            class="sheet-select"
          >
            <option v-for="(sheet, i) in sheets" :key="sheet.sheetName" :value="i">
              {{ sheet.sheetName }} ({{ sheet.blocks.length }} 件)
            </option>
          </select>
        </div>
      </div>

      <!-- 統計バッジ & フィルタ -->
      <div class="toolbar-section">
        <div class="stats-pill">
          <span class="stat-muted">ブロック:</span>
          <span class="stat-strong">{{ totalBlocks }}</span>
          <span class="stat-sep">|</span>
          <span class="stat-match">{{ matchCount }} 🟢 一致</span>
          <span v-if="unmatchCount > 0" class="stat-unmatch">
            / {{ unmatchCount }} 🟡 不一致
          </span>
        </div>

        <!-- 不一致のみトグル -->
        <button 
          @click="$emit('toggle-filter-unmatch')"
          :class="['filter-btn', { 'filter-active': filterOnlyUnmatch }]"
        >
          <span>⚠️ 不一致のみ</span>
        </button>
      </div>

      <!-- アクションボタン群 -->
      <div class="toolbar-section action-buttons">
        <button 
          @click="$emit('pad-all')"
          title="すべての不一致ブロックを一括で空行パディングして行数を揃えます"
          class="btn-tool"
        >
          🧹 一括揃え
        </button>

        <button 
          @click="$emit('replace-all-pipes')"
          title="全ブロック内のすべての {|} を改行に一括置換します"
          class="btn-tool btn-pipe-all"
        >
          ↵ 全 {|} を改行に
        </button>

        <button 
          @click="$emit('copy-tsv')"
          class="btn-tool"
        >
          📋 TSVコピー
        </button>

        <button 
          @click="$emit('export-xlsx')"
          class="btn-save-excel"
        >
          💾 Excel保存
        </button>

        <button 
          @click="$emit('open-importer')"
          class="btn-tool"
        >
          📂 読込
        </button>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import type { SheetData } from '~/types/groom';

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

<style scoped>
.groom-toolbar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(22, 24, 34, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  padding: 10px 16px;
}

.toolbar-inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-back:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.divider {
  width: 1px;
  height: 18px;
  background: var(--border);
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-icon {
  font-size: 1.15rem;
}

.brand-text {
  font-size: 0.95rem;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sheet-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.sheet-label {
  color: var(--text-muted);
}

.sheet-select {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  font-size: 0.75rem;
  padding: 4px 10px;
  cursor: pointer;
}

.sheet-select:focus {
  outline: none;
  border-color: var(--accent);
}

.stats-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border);
  font-size: 0.75rem;
}

.stat-muted {
  color: var(--text-muted);
}

.stat-strong {
  font-weight: 700;
  color: var(--text-primary);
}

.stat-sep {
  color: var(--border-hover);
}

.stat-match {
  color: #34d399;
  font-weight: 500;
}

.stat-unmatch {
  color: #fbbf24;
  font-weight: 500;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}

.filter-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-btn.filter-active {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.4);
}

.btn-tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-tool:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-pipe-all {
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}

.btn-pipe-all:hover {
  background: rgba(245, 158, 11, 0.15);
}

.btn-save-excel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-xs);
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
}

.btn-save-excel:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-glow);
}
</style>
