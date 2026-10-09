<script setup lang="ts">
import { FileText, ArrowRight, Download, Upload, CheckCircle2, Layers, ExternalLink } from 'lucide-vue-next'

definePageMeta({
  title: 'SheepGroom',
})
</script>

<template>
  <div class="groom-view">
    <div class="container">
      <!-- ヘッダーエリア -->
      <div class="page-header">
        <div class="badge-pill">
          <span class="dot"></span>
          <span>対訳作成 & アライメント支援</span>
        </div>
        <h1 class="page-title">
          <span class="icon">🐑✂️</span> SheepGroom
        </h1>
        <p class="page-desc">
          Word (.docx)、PowerPoint (.pptx)、Excel (.xlsx) 等の文書からテキストを抽出し、高精度に対訳ペアを作成・整列します。
        </p>
      </div>

      <!-- メインカードエリア -->
      <div class="content-grid">
        <!-- カード1: 対訳整列エディタ -->
        <div class="feature-card">
          <div class="card-icon">
            <FileText :size="28" />
          </div>
          <div class="card-content">
            <h3>Office ドキュメントのアライメント</h3>
            <p>原文と訳文のドキュメントを並べて比較・校正。ブロック構造を維持したまま Excel や TSV へ整列出力できます。</p>
            <ul class="feature-list">
              <li>Word (.docx) の見出し・段落ペアリング</li>
              <li>PowerPoint (.pptx) のスライド単位ブロック抽出</li>
              <li>Excel (.xlsx) シート別の対訳マッピング</li>
            </ul>
          </div>
        </div>

        <!-- カード2: 実行モード -->
        <div class="feature-card highlight-card">
          <div class="card-icon">
            <Layers :size="28" />
          </div>
          <div class="card-content">
            <h3>Web & ローカルデスクトップ連携</h3>
            <p>大容量ファイルや大量のローカルファイルの一括処理は、デスクトップ版（SheepBobbin / SheepGroom）と連携して高速に処理できます。</p>
            <div class="card-actions">
              <NuxtLink to="/shuttle/manage" class="btn-primary">
                <span>Shuttle プロジェクトへ読み込む</span>
                <ArrowRight :size="16" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groom-view {
  min-height: calc(100vh - 120px);
  padding: 2.5rem 1.5rem;
  background: radial-gradient(circle at top right, rgba(20, 184, 166, 0.08), transparent 400px),
              radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.05), transparent 400px);
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
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #2dd4bf;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.badge-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2dd4bf;
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
  transition: transform 0.2s, border-color 0.2s;
}

.feature-card:hover {
  border-color: rgba(20, 184, 166, 0.4);
  transform: translateY(-2px);
}

.highlight-card {
  background: linear-gradient(135deg, #1e293b 0%, #132338 100%);
  border-color: rgba(56, 189, 248, 0.3);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  display: flex;
  align-items: center;
  justify-content: center;
}

.highlight-card .card-icon {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
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

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  color: #2dd4bf;
  font-weight: bold;
}

.card-actions {
  margin-top: 1.5rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: #0284c7;
  color: #fff;
  border-radius: 0.6rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0369a1;
}
</style>
