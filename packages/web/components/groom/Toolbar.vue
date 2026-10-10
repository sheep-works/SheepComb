<template>
  <header class="groom-toolbar">
    <div class="toolbar-inner">
      
      <!-- 1行目: ファイル操作関連 -->
      <div class="toolbar-row toolbar-row-file">
        <div class="row-left">
          <!-- ファイル選択に戻るボタン -->
          <button 
            @click="$emit('back-to-pairing')"
            class="btn-tool btn-back"
            title="ファイルペアリング画面に戻る"
          >
            <span>🔙</span>
            <span>ファイル選択</span>
          </button>

          <!-- 追加読込 -->
          <button 
            @click="$emit('open-importer')"
            class="btn-tool"
            title="別のExcelやTSVファイルを読み込む"
          >
            <span>📂</span>
            <span>追加読込</span>
          </button>

          <!-- 保存ドロップダウン (Excel / TSV) -->
          <div class="dropdown-wrapper">
            <button 
              @click="showSaveMenu = !showSaveMenu"
              class="btn-tool btn-save-dropdown"
              title="ExcelまたはTSVとして保存・出力"
            >
              <span>💾</span>
              <span>保存 ▾</span>
            </button>
            <div 
              v-if="showSaveMenu" 
              class="save-menu"
              @click="showSaveMenu = false"
            >
              <button 
                @click="$emit('export-xlsx')"
                class="save-menu-item"
              >
                <span>📊</span>
                <div class="item-texts">
                  <span class="item-title">Excel保存 (.xlsx)</span>
                  <span class="item-desc">全シートまたは現在シートを出力</span>
                </div>
              </button>
              <button 
                @click="$emit('copy-tsv')"
                class="save-menu-item"
              >
                <span>📋</span>
                <div class="item-texts">
                  <span class="item-title">TSVコピー</span>
                  <span class="item-desc">Excelに直接貼り付け可能</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="row-right">
          <!-- シート選択 -->
          <div v-if="sheets.length > 0" class="sheet-selector">
            <span class="sheet-label">作業中:</span>
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
      </div>

      <!-- 2行目: データ操作関連 -->
      <div class="toolbar-row toolbar-row-data">
        <div class="row-left">
          <!-- ブロック追加ボタン -->
          <button 
            @click="$emit('add-block')"
            class="btn-tool btn-add-block"
            title="末尾に新しい対訳ブロックを追加"
          >
            <span>➕</span>
            <span>追加</span>
          </button>

          <!-- 一括揃え -->
          <button 
            @click="$emit('pad-all')"
            title="すべての不一致ブロックを一括で空行パディングして行数を揃えます"
            class="btn-tool"
          >
            <span>🧹</span>
            <span>一括揃え</span>
          </button>

          <!-- {|}置換 -->
          <button 
            @click="$emit('replace-all-pipes')"
            title="全ブロック内のすべての {|} を改行に一括置換します"
            class="btn-tool btn-pipe-all"
          >
            <span>↵</span>
            <span>{|}置換</span>
          </button>

          <!-- 検索ボックス -->
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              :value="searchQuery" 
              @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text" 
              placeholder="テキストやセクション名を検索..." 
              class="search-input"
            />
            <button 
              v-if="searchQuery" 
              @click="$emit('update:searchQuery', '')" 
              class="btn-clear-search"
              title="検索クリア"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- 右側: 不一致時のみ v-if で表示する統計・不一致フィルタ -->
        <div v-if="unmatchCount > 0" class="row-right unmatch-alert-area">
          <div class="unmatch-pill">
            <span class="unmatch-icon">🟡</span>
            <span>不一致 <strong>{{ unmatchCount }}</strong> / {{ totalBlocks }} 件</span>
          </div>

          <!-- 不一致のみトグル -->
          <button 
            @click="$emit('toggle-filter-unmatch')"
            :class="['btn-tool', 'filter-btn', { 'filter-active': filterOnlyUnmatch }]"
            title="行数が不一致のブロックのみを抽出表示"
          >
            <span>⚠️</span>
            <span>不一致のみ</span>
          </button>
        </div>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SheetData } from '~/types/groom';

defineProps<{
  sheets: SheetData[];
  activeSheetIndex: number;
  totalBlocks: number;
  matchCount: number;
  unmatchCount: number;
  filterOnlyUnmatch: boolean;
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'back-to-pairing'): void;
  (e: 'change-sheet', index: number): void;
  (e: 'toggle-filter-unmatch'): void;
  (e: 'update:searchQuery', value: string): void;
  (e: 'add-block'): void;
  (e: 'pad-all'): void;
  (e: 'replace-all-pipes'): void;
  (e: 'copy-tsv'): void;
  (e: 'export-xlsx'): void;
  (e: 'open-importer'): void;
}>();

const showSaveMenu = ref(false);

function handleSelectChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  emit('change-sheet', Number(target.value));
}
</script>

<style scoped>
.groom-toolbar {
  position: sticky;
  top: 60px; /* AppHeaderの高さに合わせて固定 */
  z-index: 30;
  background: rgba(22, 24, 34, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  padding: 8px 16px;
}

.toolbar-inner {
  max-width: 1360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-row-file {
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}

.row-left,
.row-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
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
  padding: 4px 8px;
  cursor: pointer;
  max-width: 260px;
}

.sheet-select:focus {
  outline: none;
  border-color: var(--accent);
}

.dropdown-wrapper {
  position: relative;
}

.btn-save-dropdown {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
  font-weight: 600;
}

.btn-save-dropdown:hover {
  background: var(--accent-hover);
  color: #fff;
}

.save-menu {
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  z-index: 50;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.save-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition);
}

.save-menu-item:hover {
  background: var(--bg-hover);
}

.item-texts {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.item-desc {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-input);
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  transition: border-color var(--transition);
  width: 260px;
}

.search-input-box:focus-within {
  border-color: var(--accent);
}

.search-icon {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.search-input {
  background: transparent;
  border: none;
  font-size: 0.75rem;
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
  font-size: 0.7rem;
  padding: 0;
}

.btn-tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition);
}

.btn-tool:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.btn-add-block {
  color: #2dd4bf;
  border-color: rgba(20, 184, 166, 0.3);
  background: rgba(20, 184, 166, 0.1);
  font-weight: 600;
}

.btn-add-block:hover {
  background: rgba(20, 184, 166, 0.25);
  color: #fff;
}

.btn-pipe-all {
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}

.btn-pipe-all:hover {
  background: rgba(245, 158, 11, 0.15);
}

.unmatch-alert-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unmatch-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 500;
}

.filter-btn.filter-active {
  background: rgba(245, 158, 11, 0.25);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.5);
  font-weight: 600;
}
</style>
