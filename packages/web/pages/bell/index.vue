<template>
  <div class="bell-page-root">
    
    <!-- 隠しフォルダ入力 -->
    <input 
      ref="fallbackFolderInput" 
      type="file" 
      webkitdirectory 
      directory 
      class="hidden-file-input" 
      @change="handleFallbackFolderSelect" 
    />

    <!-- メインコンテンツ -->
    <main class="bell-main-container">
      
      <!-- 未読み込み状態: ウェルカムカード -->
      <div 
        v-if="issues.length === 0 && !isLoading"
        class="card welcome-card"
      >
        <div class="welcome-icon-circle">
          🔔
        </div>
        <div class="welcome-texts">
          <h2>LQA issues フォルダを開いてください</h2>
          <p>
            SheepBell CLI で出力された <code>lqa_issues.json</code>（または保存済み <code>lqa_issues_review.json</code>）や動画クリップ・画像が入っているフォルダを選択します。
          </p>
        </div>
        <div>
          <button 
            @click="handleOpenFolderClick"
            class="btn-open-large"
          >
            <span>📂</span>
            <span>フォルダを選択する</span>
          </button>
        </div>
      </div>

      <!-- ローディング表示 -->
      <div v-else-if="isLoading" class="loading-box">
        <div class="spinner-large">⏳</div>
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>

      <!-- 読み込み後: 操作バー & 検索・フィルタバー & 一覧 -->
      <div v-else class="issues-view-wrapper">
        
        <!-- 上部操作バー -->
        <div class="issues-action-bar">
          <div class="action-bar-left">
            <div v-if="folderName" class="folder-badge">
              <span>📁</span>
              <span>{{ folderName }}</span>
            </div>

            <div v-if="loadedFileName" class="file-badge">
              {{ loadedFileName }}
            </div>

            <span v-if="lastSavedTime" class="save-time-text">
              最終保存: {{ lastSavedTime }}
            </span>

            <span v-if="hasUnsavedChanges" class="unsaved-badge">
              <span>⚠️</span>
              <span>未保存の変更あり</span>
            </span>
          </div>

          <div class="action-bar-right">
            <!-- フォルダを開く -->
            <button 
              @click="handleOpenFolderClick" 
              :disabled="isLoading"
              class="btn-tool"
            >
              <span>📂</span>
              <span>フォルダを開く</span>
            </button>

            <!-- 保存ボタン (Ctrl+S) -->
            <button 
              @click="() => saveIssues({ reason: 'manual' })"
              class="btn-save"
            >
              <span>💾</span>
              <span>保存 <kbd>Ctrl+S</kbd></span>
            </button>

            <!-- エクスポートドロップダウン -->
            <div class="export-dropdown-wrapper">
              <button 
                @click="showExportMenu = !showExportMenu"
                class="btn-tool"
              >
                <span>📤</span>
                <span>エクスポート ▾</span>
              </button>
              <div 
                v-if="showExportMenu" 
                class="dropdown-menu"
              >
                <button 
                  @click="exportCsv(); showExportMenu = false"
                  class="dropdown-item"
                >
                  <span>📊</span>
                  <span>標準 CSV (Excel互換)</span>
                </button>
                <button 
                  @click="downloadJson(); showExportMenu = false"
                  class="dropdown-item"
                >
                  <span>📋</span>
                  <span>標準 JSON</span>
                </button>
              </div>
            </div>

            <!-- 使い方 -->
            <button 
              @click="showManualModal = true"
              class="btn-help"
              title="使い方ガイド"
            >
              ❓
            </button>
          </div>
        </div>

        <!-- 検索・フィルタツールバー -->
        <div class="filter-bar">
          <!-- 検索インプット -->
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Description / Comment / ID を検索..." 
              class="search-input"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">✕</button>
          </div>

          <!-- コメント状態フィルタ -->
          <div class="filter-group">
            <span class="filter-label">コメント:</span>
            <select 
              v-model="commentFilter"
              class="filter-select"
            >
              <option value="all">すべて</option>
              <option value="has_comment">記入あり</option>
              <option value="no_comment">未記入</option>
            </select>
          </div>

          <!-- タグフィルタ -->
          <div v-if="availableTags.length > 0" class="filter-group">
            <span class="filter-label">タグ:</span>
            <select 
              v-model="selectedTag"
              class="filter-select"
            >
              <option value="all">すべて</option>
              <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </div>

          <!-- 全行一括メディア表示切替 -->
          <div class="filter-group">
            <span class="filter-label">メディア:</span>
            <div class="segmented-control">
              <button 
                @click="setAllMediaView('image')"
                :class="['segment-btn', { 'segment-active': globalMediaView === 'image' }]"
              >
                🖼️ 画像
              </button>
              <button 
                @click="setAllMediaView('video')"
                :class="['segment-btn', { 'segment-active': globalMediaView === 'video' }]"
              >
                🎬 動画
              </button>
            </div>
          </div>

          <!-- 件数表示 -->
          <div class="count-badge">
            表示中: <strong>{{ filteredIssues.length }}</strong> / 全 {{ issues.length }} 件
          </div>
        </div>

        <!-- Issue カードリスト -->
        <div class="issue-cards-list">
          <div 
            v-for="item in filteredIssues" 
            :key="item.id"
            class="card issue-card"
          >
            <!-- カードヘッダー -->
            <div class="issue-card-header">
              <div class="issue-header-meta">
                <span class="issue-id-badge">
                  #{{ item.id }}
                </span>
                <span v-if="item.file_prefix" class="issue-prefix">
                  {{ item.file_prefix }}
                </span>
                <span v-if="item.issue_tag" class="issue-tag-chip">
                  {{ item.issue_tag }}
                </span>
                <span class="issue-timestamp">
                  ⏱️ {{ formatTime(item.timestamp_start) }} 〜 {{ formatTime(item.timestamp_end) }} ({{ getDuration(item.timestamp_start, item.timestamp_end) }}s)
                </span>
              </div>

              <!-- メディア切り替えミニトグル & 削除 -->
              <div class="issue-header-controls">
                <div class="segmented-control mini-control">
                  <button 
                    @click="setRowMediaMode(item.id, 'image')"
                    :class="['segment-btn', { 'segment-active': getRowMediaMode(item.id) === 'image' }]"
                    :disabled="!item.snapshot_path"
                  >
                    画像
                  </button>
                  <button 
                    @click="setRowMediaMode(item.id, 'video')"
                    :class="['segment-btn', { 'segment-active': getRowMediaMode(item.id) === 'video' }]"
                    :disabled="!item.clip_path"
                  >
                    動画
                  </button>
                </div>

                <button 
                  @click="removeIssue(item.id)"
                  class="btn-delete-issue"
                  title="このイシューを削除"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- カードボディ: 左右分割 (メディア & テキスト) -->
            <div class="issue-card-body">
              
              <!-- 左: メディアプレビュー -->
              <div class="media-column">
                <div v-if="getRowMediaMode(item.id) === 'video' && item.clip_path">
                  <MediaVideo :filename="item.clip_path" :get-media-url="getMediaUrl" />
                </div>
                <div v-else-if="item.snapshot_path">
                  <MediaImage 
                    :filename="item.snapshot_path" 
                    :get-media-url="getMediaUrl" 
                    @click="openImageModal(item)"
                  />
                </div>
                <div v-else class="empty-media-box">
                  メディアファイルなし
                </div>
              </div>

              <!-- 右: Description & Comment -->
              <div class="text-column">
                <!-- Description -->
                <div class="text-group">
                  <span class="text-group-label">
                    💬 自動抽出 / Whisper 文字起こし (Description)
                  </span>
                  <textarea 
                    v-model="item.description"
                    rows="3"
                    class="issue-textarea"
                    placeholder="不具合箇所の文字起こしや説明..."
                    @input="markChanged"
                  ></textarea>
                </div>

                <!-- Comment -->
                <div class="text-group">
                  <span class="text-group-label comment-label">
                    ✍️ レビューコメント (Comment)
                  </span>
                  <textarea 
                    v-model="item.comment"
                    rows="3"
                    class="issue-textarea comment-textarea"
                    placeholder="修正指示やレビューコメントを入力..."
                    @input="markChanged"
                  ></textarea>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </main>

    <!-- 画像拡大モーダル (Lightbox) -->
    <div 
      v-if="imageModalOpen && activeItem" 
      class="lightbox-overlay"
      @click.self="imageModalOpen = false"
    >
      <div class="lightbox-dialog">
        <div class="lightbox-header">
          <span class="lightbox-title">
            #{{ activeItem.id }} スナップショット ({{ activeItem.snapshot_path }})
          </span>
          <button @click="imageModalOpen = false" class="lightbox-close">✕</button>
        </div>
        <div class="lightbox-body">
          <img :src="activeMediaUrl" alt="Snapshot" class="lightbox-img" />
        </div>
      </div>
    </div>

    <!-- 使い方モーダル -->
    <div 
      v-if="showManualModal" 
      class="lightbox-overlay"
      @click.self="showManualModal = false"
    >
      <div class="manual-dialog">
        <div class="manual-header">
          <div class="manual-title">
            <span>📖</span>
            <h3>SheepBell LQA Editor 使い方</h3>
          </div>
          <button @click="showManualModal = false" class="lightbox-close">✕</button>
        </div>
        <div class="manual-body">
          <p><strong>1. フォルダを開く:</strong> SheepBell パイプラインが出力した <code>issues/</code> フォルダを選択します。動画・画像・<code>lqa_issues.json</code> が一括で読み込まれます。</p>
          <p><strong>2. プレビュー & 校正:</strong> 画像と動画を切り替えて不具合箇所を確認。Whisper による文字起こしテキストの修正や、レビューコメントを記入します。</p>
          <p><strong>3. 保存 & エクスポート:</strong> <kbd>Ctrl+S</kbd> で <code>lqa_issues_review.json</code> に直接上書き保存されます。CSV や JSON でダウンロード出力も可能です。</p>
        </div>
        <div class="manual-footer">
          <button @click="showManualModal = false" class="btn-primary-sm">
            閉じる
          </button>
        </div>
      </div>
    </div>

    <!-- トースト通知 -->
    <div 
      v-if="toast.show" 
      class="toast-notification"
    >
      <span>{{ toast.text }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { LqaIssueReview } from '~/types/bell';
import { useBellIssueManager } from '~/composables/useBellIssueManager';
import MediaImage from '~/components/bell/MediaImage.vue';
import MediaVideo from '~/components/bell/MediaVideo.vue';

definePageMeta({
  title: 'LQA支援',
});

const {
  issues,
  folderName,
  loadedFileName,
  hasUnsavedChanges,
  isLoading,
  loadingMessage,
  lastSavedTime,
  toast,
  showToast,
  markChanged,
  getMediaUrl,
  clearMediaCaches,
  saveIssues,
  downloadJson,
  exportCsv,
  openDirectory,
  loadFallbackFiles,
} = useBellIssueManager();

const fallbackFolderInput = ref<HTMLInputElement | null>(null);
const showExportMenu = ref(false);
const showManualModal = ref(false);

const searchQuery = ref('');
const commentFilter = ref<'all' | 'has_comment' | 'no_comment'>('all');
const selectedTag = ref<string>('all');
const globalMediaView = ref<'image' | 'video'>('image');
const rowMediaModes = ref<Map<number, 'image' | 'video'>>(new Map());

const imageModalOpen = ref(false);
const activeItem = ref<LqaIssueReview | null>(null);
const activeMediaUrl = ref('');

const availableTags = computed(() => {
  const set = new Set<string>();
  issues.value.forEach(i => {
    if (i.issue_tag) set.add(i.issue_tag);
  });
  return Array.from(set);
});

const filteredIssues = computed(() => {
  return issues.value.filter(item => {
    if (commentFilter.value === 'has_comment' && !item.comment?.trim()) return false;
    if (commentFilter.value === 'no_comment' && !!item.comment?.trim()) return false;
    if (selectedTag.value !== 'all' && item.issue_tag !== selectedTag.value) return false;

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const matchId = String(item.id).includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q) ?? false;
      const matchComment = item.comment?.toLowerCase().includes(q) ?? false;
      const matchTag = item.issue_tag?.toLowerCase().includes(q) ?? false;
      if (!matchId && !matchDesc && !matchComment && !matchTag) return false;
    }
    return true;
  });
});

function handleOpenFolderClick() {
  openDirectory(fallbackFolderInput.value);
}

function handleFallbackFolderSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  loadFallbackFiles(input.files);
}

function getRowMediaMode(id: number): 'image' | 'video' {
  return rowMediaModes.value.get(id) || globalMediaView.value;
}

function setRowMediaMode(id: number, mode: 'image' | 'video') {
  rowMediaModes.value.set(id, mode);
}

function setAllMediaView(mode: 'image' | 'video') {
  globalMediaView.value = mode;
  rowMediaModes.value.clear();
}

async function openImageModal(item: LqaIssueReview) {
  if (!item.snapshot_path) return;
  activeItem.value = item;
  activeMediaUrl.value = await getMediaUrl(item.snapshot_path);
  imageModalOpen.value = true;
}

function removeIssue(id: number) {
  if (confirm(`イシュー #${id} を削除しますか？`)) {
    const idx = issues.value.findIndex(i => i.id === id);
    if (idx !== -1) {
      issues.value.splice(idx, 1);
      markChanged();
      showToast(`イシュー #${id} を削除しました`);
    }
  }
}

function formatTime(seconds?: number): string {
  if (seconds == null || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDuration(start?: number, end?: number): string {
  if (start == null || end == null) return '0.0';
  return (end - start).toFixed(1);
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveIssues({ reason: 'manual' });
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.bell-page-root {
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.issues-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bg-secondary);
  padding: 10px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.action-bar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.action-bar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.folder-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #2dd4bf;
  font-size: 0.75rem;
  font-family: monospace;
}

.file-badge {
  font-size: 0.7rem;
  font-family: monospace;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.save-time-text {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.unsaved-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  font-size: 0.7rem;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.hidden-file-input {
  display: none;
}

.btn-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-tool:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.btn-save {
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

.btn-save:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-glow);
}

.btn-save kbd {
  font-size: 0.65rem;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 4px;
  border-radius: 3px;
}

.export-dropdown-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 6px;
  width: 190px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 0.75rem;
  border-radius: var(--radius-xs);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition);
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-help {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-xs);
  font-size: 0.9rem;
}

.btn-help:hover {
  color: var(--text-primary);
}

.bell-main-container {
  flex: 1;
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-card {
  text-align: center;
  padding: 64px 24px;
  max-width: 640px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.welcome-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
}

.welcome-texts h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.welcome-texts p {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-top: 6px;
  max-width: 460px;
}

.welcome-texts code {
  font-family: monospace;
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
  color: #2dd4bf;
}

.btn-open-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
  transition: all var(--transition);
}

.btn-open-large:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.loading-box {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner-large {
  font-size: 2.5rem;
}

.loading-text {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.issues-view-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-bar {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 240px;
  max-width: 380px;
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

.btn-clear-search {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.filter-label {
  color: var(--text-muted);
}

.filter-select {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  font-size: 0.75rem;
  padding: 4px 8px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent);
}

.segmented-control {
  display: inline-flex;
  padding: 2px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  gap: 2px;
}

.segment-btn {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition);
}

.segment-btn.segment-active {
  background: rgba(20, 184, 166, 0.2);
  color: #2dd4bf;
  font-weight: 600;
}

.count-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.count-badge strong {
  color: var(--text-primary);
}

.issue-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-card {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.issue-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
}

.issue-header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.issue-id-badge {
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  border: 1px solid rgba(20, 184, 166, 0.3);
}

.issue-prefix {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-muted);
}

.issue-tag-chip {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(6, 182, 212, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.issue-timestamp {
  font-size: 0.72rem;
  font-family: monospace;
  color: var(--text-muted);
}

.issue-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-control {
  font-size: 0.68rem;
}

.btn-delete-issue {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.btn-delete-issue:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

.issue-card-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  align-items: start;
}

@media (max-width: 900px) {
  .issue-card-body {
    grid-template-columns: 1fr;
  }
}

.media-column {
  width: 100%;
}

.empty-media-box {
  height: 180px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.text-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.comment-label {
  color: #2dd4bf;
}

.issue-textarea {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 0.8rem;
  color: var(--text-primary);
  line-height: 1.5;
  resize: vertical;
  transition: border-color var(--transition);
}

.issue-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.comment-textarea {
  border-color: rgba(20, 184, 166, 0.3);
}

.comment-textarea:focus {
  border-color: #2dd4bf;
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.lightbox-dialog {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.lightbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.lightbox-title {
  font-size: 0.8rem;
  font-weight: 700;
  font-family: monospace;
  color: var(--text-primary);
}

.lightbox-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}

.lightbox-close:hover {
  color: var(--text-primary);
}

.lightbox-body {
  padding: 8px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.lightbox-img {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
}

.manual-dialog {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-width: 560px;
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-lg);
}

.manual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

.manual-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.manual-title h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.manual-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.manual-body code, .manual-body kbd {
  font-family: monospace;
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.manual-footer {
  text-align: right;
  padding-top: 8px;
}

.btn-primary-sm {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 6px 18px;
  border-radius: var(--radius-xs);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
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
