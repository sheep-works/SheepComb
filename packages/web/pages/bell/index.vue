<template>
  <div class="bell-view min-h-[calc(100vh-120px)] flex flex-col bg-[#0f1117] text-white/90 selection:bg-teal-500/30 selection:text-teal-200">
    
    <!-- ツールバー -->
    <header class="sticky top-0 z-30 bg-[#161822]/95 backdrop-blur border-b border-white/[0.08] shadow-lg px-4 py-3">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        <!-- 左側: タイトル & フォルダ情報 -->
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <span class="text-xl">🔔</span>
            <span class="font-bold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              SheepBell LQA
            </span>
          </div>

          <div v-if="folderName" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono">
            <span>📁</span>
            <span>{{ folderName }}</span>
          </div>

          <div v-if="loadedFileName" class="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
            {{ loadedFileName }}
          </div>
        </div>

        <!-- 右側: アクションボタン群 -->
        <div class="flex items-center space-x-2.5 text-xs">
          <!-- 最終保存時刻 -->
          <span v-if="lastSavedTime" class="hidden md:inline text-white/40 text-[11px] mr-1">
            最終保存: {{ lastSavedTime }}
          </span>

          <!-- 未保存変更バッジ -->
          <span v-if="hasUnsavedChanges" class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium animate-pulse flex items-center gap-1">
            <span>⚠️</span>
            <span>未保存の変更あり</span>
          </span>

          <!-- フォルダを開く -->
          <button 
            @click="handleOpenFolderClick" 
            :disabled="isLoading"
            class="px-3 py-1.5 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 border border-white/10 hover:border-white/20 transition-all font-medium flex items-center gap-1.5 shadow-sm"
          >
            <span>📂</span>
            <span>フォルダを開く</span>
          </button>

          <input 
            ref="fallbackFolderInput" 
            type="file" 
            webkitdirectory 
            directory 
            class="hidden" 
            @change="handleFallbackFolderSelect" 
          />

          <!-- 保存ボタン (Ctrl+S) -->
          <button 
            v-if="issues.length > 0"
            @click="() => saveIssues({ reason: 'manual' })"
            class="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md shadow-teal-900/30 transition-all flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>保存 <kbd class="text-[10px] opacity-75 font-mono">Ctrl+S</kbd></span>
          </button>

          <!-- エクスポートドロップダウン -->
          <div v-if="issues.length > 0" class="relative">
            <button 
              @click="showExportMenu = !showExportMenu"
              class="px-3 py-1.5 rounded-lg bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 border border-white/10 hover:border-white/20 transition-all font-medium flex items-center gap-1.5 shadow-sm"
            >
              <span>📤</span>
              <span>エクスポート ▾</span>
            </button>
            <div 
              v-if="showExportMenu" 
              class="absolute right-0 mt-2 w-48 bg-[#161822] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <button 
                @click="exportCsv(); showExportMenu = false"
                class="w-full text-left px-3.5 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2"
              >
                <span>📊</span>
                <span>標準 CSV (Excel互換)</span>
              </button>
              <button 
                @click="downloadJson(); showExportMenu = false"
                class="w-full text-left px-3.5 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2"
              >
                <span>📋</span>
                <span>標準 JSON</span>
              </button>
            </div>
          </div>

          <!-- 使い方 -->
          <button 
            @click="showManualModal = true"
            class="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="使い方ガイド"
          >
            ❓
          </button>
        </div>

      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-4">
      
      <!-- 未読み込み状態: ウェルカムカード -->
      <div 
        v-if="issues.length === 0 && !isLoading"
        class="text-center py-20 px-6 max-w-2xl mx-auto my-12 bg-[#161822]/80 border border-dashed border-white/10 rounded-3xl space-y-6 shadow-2xl"
      >
        <div class="w-20 h-20 mx-auto rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-4xl shadow-inner">
          🔔
        </div>
        <div class="space-y-2">
          <h2 class="text-xl font-bold text-white">LQA issues フォルダを開いてください</h2>
          <p class="text-xs text-white/50 leading-relaxed max-w-md mx-auto">
            SheepBell CLI で出力された <code>lqa_issues.json</code>（または保存済み <code>lqa_issues_review.json</code>）や動画クリップ・画像が入っているフォルダを選択します。
          </p>
        </div>
        <div>
          <button 
            @click="handleOpenFolderClick"
            class="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-teal-900/40 transition-all inline-flex items-center gap-2"
          >
            <span>📂</span>
            <span>フォルダを選択する</span>
          </button>
        </div>
      </div>

      <!-- ローディング表示 -->
      <div v-else-if="isLoading" class="text-center py-24 space-y-4">
        <div class="animate-spin text-4xl">⏳</div>
        <p class="text-xs text-white/60 font-medium">{{ loadingMessage }}</p>
      </div>

      <!-- 読み込み後: 検索・フィルタバー & 一覧 -->
      <div v-else class="space-y-4">
        
        <!-- 検索・フィルタツールバー -->
        <div class="bg-[#161822] border border-white/[0.08] rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
          <!-- 検索インプット -->
          <div class="flex items-center space-x-2.5 flex-1 min-w-[240px] max-w-md bg-[#141621] px-3 py-1.5 rounded-xl border border-white/5 focus-within:border-teal-500/50 transition-colors">
            <span class="text-white/40 text-sm">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Description / Comment / ID を検索..." 
              class="bg-transparent text-xs text-white/90 focus:outline-none w-full placeholder:text-white/30"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="text-xs text-white/40 hover:text-white/80">✕</button>
          </div>

          <!-- コメント状態フィルタ -->
          <div class="flex items-center space-x-2 text-xs">
            <span class="text-white/40">コメント:</span>
            <select 
              v-model="commentFilter"
              class="bg-[#1a1d2e] border border-white/10 rounded-lg px-2.5 py-1 text-white/80 focus:outline-none focus:border-teal-500"
            >
              <option value="all">すべて</option>
              <option value="has_comment">記入あり</option>
              <option value="no_comment">未記入</option>
            </select>
          </div>

          <!-- タグフィルタ -->
          <div v-if="availableTags.length > 0" class="flex items-center space-x-2 text-xs">
            <span class="text-white/40">タグ:</span>
            <select 
              v-model="selectedTag"
              class="bg-[#1a1d2e] border border-white/10 rounded-lg px-2.5 py-1 text-white/80 focus:outline-none focus:border-teal-500"
            >
              <option value="all">すべて</option>
              <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </div>

          <!-- 全行一括メディア表示切替 -->
          <div class="flex items-center space-x-2 text-xs">
            <span class="text-white/40">メディア:</span>
            <div class="inline-flex rounded-lg border border-white/10 p-0.5 bg-[#141621]">
              <button 
                @click="setAllMediaView('image')"
                :class="globalMediaView === 'image' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-white/60 hover:text-white'"
                class="px-2.5 py-1 rounded-md transition-colors"
              >
                🖼️ 画像
              </button>
              <button 
                @click="setAllMediaView('video')"
                :class="globalMediaView === 'video' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-white/60 hover:text-white'"
                class="px-2.5 py-1 rounded-md transition-colors"
              >
                🎬 動画
              </button>
            </div>
          </div>

          <!-- 件数表示 -->
          <div class="text-xs text-white/40">
            表示中: <strong class="text-white/90">{{ filteredIssues.length }}</strong> / 全 {{ issues.length }} 件
          </div>
        </div>

        <!-- Issue カードリスト -->
        <div class="space-y-4">
          <div 
            v-for="item in filteredIssues" 
            :key="item.id"
            class="bg-[#161822] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-5 shadow-xl transition-all space-y-4"
          >
            <!-- カードヘッダー -->
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div class="flex items-center space-x-3">
                <span class="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 font-mono font-bold text-xs border border-teal-500/30">
                  #{{ item.id }}
                </span>
                <span v-if="item.file_prefix" class="text-xs font-mono text-white/50">
                  {{ item.file_prefix }}
                </span>
                <span v-if="item.issue_tag" class="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {{ item.issue_tag }}
                </span>
                <span class="text-xs font-mono text-white/40">
                  ⏱️ {{ formatTime(item.timestamp_start) }} 〜 {{ formatTime(item.timestamp_end) }} ({{ getDuration(item.timestamp_start, item.timestamp_end) }}s)
                </span>
              </div>

              <!-- メディア切り替えミニトグル -->
              <div class="flex items-center space-x-2 text-xs">
                <div class="inline-flex rounded-lg border border-white/10 p-0.5 bg-[#141621]">
                  <button 
                    @click="setRowMediaMode(item.id, 'image')"
                    :class="getRowMediaMode(item.id) === 'image' ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white'"
                    class="px-2 py-0.5 rounded text-[11px] transition-colors"
                    :disabled="!item.snapshot_path"
                  >
                    画像
                  </button>
                  <button 
                    @click="setRowMediaMode(item.id, 'video')"
                    :class="getRowMediaMode(item.id) === 'video' ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white'"
                    class="px-2 py-0.5 rounded text-[11px] transition-colors"
                    :disabled="!item.clip_path"
                  >
                    動画
                  </button>
                </div>

                <button 
                  @click="removeIssue(item.id)"
                  class="text-white/30 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="このイシューを削除"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- カードボディ: 左右分割 (メディア & テキスト) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              <!-- 左: メディアプレビュー (4カラム) -->
              <div class="lg:col-span-4">
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
                <div v-else class="h-44 rounded-xl border border-white/5 bg-[#141621] flex items-center justify-center text-xs text-white/30">
                  メディアファイルなし
                </div>
              </div>

              <!-- 右: Description & Comment (8カラム) -->
              <div class="lg:col-span-8 space-y-3">
                <!-- Description (Whisper 文字起こし / 自動検出) -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                      💬 自動抽出 / Whisper 文字起こし (Description)
                    </span>
                  </div>
                  <textarea 
                    v-model="item.description"
                    rows="3"
                    class="w-full bg-[#141621] border border-white/10 rounded-xl p-3 text-xs text-white/80 focus:outline-none focus:border-teal-500 resize-y placeholder:text-white/30 font-sans leading-relaxed"
                    placeholder="不具合箇所の文字起こしや説明..."
                    @input="markChanged"
                  ></textarea>
                </div>

                <!-- Comment (レビューコメント) -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
                      ✍️ レビューコメント (Comment)
                    </span>
                  </div>
                  <textarea 
                    v-model="item.comment"
                    rows="3"
                    class="w-full bg-[#141621] border border-teal-500/30 rounded-xl p-3 text-xs text-white/90 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500/50 resize-y placeholder:text-white/30 font-sans leading-relaxed"
                    placeholder="修正指示やコメントを入力..."
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      @click.self="imageModalOpen = false"
    >
      <div class="bg-[#161822] border border-white/10 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#1a1d2e]">
          <span class="font-bold text-xs text-white/90 font-mono">
            #{{ activeItem.id }} スナップショット ({{ activeItem.snapshot_path }})
          </span>
          <button @click="imageModalOpen = false" class="text-white/40 hover:text-white text-base">✕</button>
        </div>
        <div class="p-3 bg-black flex items-center justify-center flex-1 overflow-auto">
          <img :src="activeMediaUrl" alt="Snapshot" class="max-w-full max-h-[75vh] object-contain" />
        </div>
      </div>
    </div>

    <!-- 使い方モーダル -->
    <div 
      v-if="showManualModal" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      @click.self="showManualModal = false"
    >
      <div class="bg-[#161822] border border-white/10 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">📖</span>
            <h3 class="font-bold text-sm text-white/90">SheepBell LQA Editor 使い方</h3>
          </div>
          <button @click="showManualModal = false" class="text-white/40 hover:text-white">✕</button>
        </div>
        <div class="text-xs text-white/70 space-y-3 leading-relaxed">
          <p><strong>1. フォルダを開く:</strong> SheepBell パイプラインが出力した <code>issues/</code> フォルダを選択します。動画・画像・<code>lqa_issues.json</code> が一括で読み込まれます。</p>
          <p><strong>2. プレビュー & 校正:</strong> 画像と動画を切り替えて不具合箇所を確認。Whisper による文字起こしテキストの修正や、レビューコメントを記入します。</p>
          <p><strong>3. 保存 & エクスポート:</strong> <kbd class="px-1 py-0.5 bg-[#141621] rounded border border-white/10">Ctrl+S</kbd> で <code>lqa_issues_review.json</code> に直接上書き保存されます。CSV や JSON でダウンロード出力も可能です。</p>
        </div>
        <div class="pt-2 text-right">
          <button @click="showManualModal = false" class="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold">
            閉じる
          </button>
        </div>
      </div>
    </div>

    <!-- トースト通知 -->
    <div 
      v-if="toast.show" 
      class="fixed bottom-6 right-6 z-50 bg-[#161822] border border-teal-500/40 text-teal-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md break-all"
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
  title: 'SheepBell LQA Viewer',
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
.bell-view {
  font-family: inherit;
}
</style>
