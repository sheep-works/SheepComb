<script setup lang="ts">
import { ref } from 'vue'
import { FolderOpen, AlertCircle, FileCheck, Film, Image as ImageIcon, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  title: 'SheepBell',
})

const folderName = ref<string | null>(null)
const isSupported = ref(typeof window !== 'undefined' && 'showDirectoryPicker' in window)

async function openDirectory() {
  if (!('showDirectoryPicker' in window)) {
    alert('お使いのブラウザは File System Access API に対応していません。Chrome / Edge をご利用ください。')
    return
  }
  try {
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker()
    folderName.value = dirHandle.name
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error(err)
    }
  }
}
</script>

<template>
  <div class="bell-view">
    <div class="container">
      <!-- ヘッダーエリア -->
      <div class="page-header">
        <div class="badge-pill">
          <span class="dot"></span>
          <span>LQA 課題管理 & クリップビューアー</span>
        </div>
        <h1 class="page-title">
          <span class="icon">🔔</span> SheepBell Viewer
        </h1>
        <p class="page-desc">
          ゲームやアプリの LQA（言語品質保証）検証でキャプチャされた録画クリップ、スクリーンショット、Whisper 音声文字起こしを一覧表示・プレビュー・編集します。
        </p>
      </div>

      <!-- 操作・機能カード -->
      <div class="content-grid">
        <!-- フォルダを開く -->
        <div class="feature-card highlight-card">
          <div class="card-icon">
            <FolderOpen :size="28" />
          </div>
          <div class="card-content">
            <h3>LQA 課題フォルダの読み込み</h3>
            <p>SheepBell CLI や Python パイプラインで生成された <code>issues/</code> フォルダをブラウザで直接読み込みます。</p>
            
            <div class="action-box">
              <button @click="openDirectory" class="btn-primary">
                <FolderOpen :size="18" />
                <span>フォルダを開く</span>
              </button>
              <span v-if="folderName" class="folder-badge">選択中: {{ folderName }}</span>
            </div>

            <p v-if="!isSupported" class="warn-text">
              ※ ブラウザが File System Access API をサポートしていません。Chrome または Edge でご利用ください。
            </p>
          </div>
        </div>

        <!-- 連携カード -->
        <div class="feature-card">
          <div class="card-icon">
            <Film :size="28" />
          </div>
          <div class="card-content">
            <h3>主な機能</h3>
            <ul class="feature-list">
              <li>ゲーム音声 / マイク音声の分離プレビュー</li>
              <li>Whisper AI による自動文字起こしテキストの確認・編集</li>
              <li>不具合スナップショット画像のサムネイル一覧</li>
              <li>Excel / Markdown 形式でのバグレポート出力</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bell-view {
  min-height: calc(100vh - 120px);
  padding: 2.5rem 1.5rem;
  background: radial-gradient(circle at top right, rgba(234, 179, 8, 0.08), transparent 400px),
              radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.05), transparent 400px);
}

.container {
  max-width: 1040px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2.5rem;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: #facc15;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.badge-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #facc15;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.page-desc {
  font-size: 1.05rem;
  color: #94a3b8;
  max-width: 680px;
  line-height: 1.6;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.highlight-card {
  background: linear-gradient(135deg, #1e293b 0%, #25221b 100%);
  border-color: rgba(234, 179, 8, 0.3);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
}

.card-content p {
  color: #94a3b8;
  font-size: 0.925rem;
  line-height: 1.55;
  margin-bottom: 1rem;
}

.action-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.4rem;
  background: #ca8a04;
  color: #fff;
  border: none;
  border-radius: 0.6rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #a16207;
}

.folder-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-size: 0.85rem;
}

.warn-text {
  color: #f87171 !important;
  font-size: 0.85rem !important;
  margin-top: 0.75rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.feature-list li {
  position: relative;
  padding-left: 1.25rem;
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #facc15;
  font-weight: bold;
}
</style>
