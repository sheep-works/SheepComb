<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  Database, Zap, Code2, Box, Cloud, 
  Split, Search, Scissors, Percent, 
  Bell as BellIcon, Gamepad2, Sparkles, 
  ArrowRight, Layers, CheckCircle2
} from 'lucide-vue-next'

definePageMeta({
  title: 'Home',
})

const { t } = useI18n()

// 1. 左カラム: 基幹パイプライン (SheepShuttle - Teal / Emerald)
const shuttleSteps = computed(() => [
  { 
    step: '1',
    to: '/shuttle/parser', 
    label: t('header.nav.parser', 'Parser'), 
    desc: t('index.parser_desc', '各種対訳ファイルを解析し、テキストセグメントを抽出'), 
    icon: Database 
  },
  { 
    step: '2',
    to: '/shuttle/analyzer', 
    label: t('header.nav.analyzer', 'Analyzer'), 
    desc: t('index.analyzer_desc', 'TM/TB一致率や内部類似度を高速解析・構造化'), 
    icon: Zap 
  },
  { 
    step: '3',
    to: '/shuttle/manage', 
    label: t('header.nav.manage', 'Manage'), 
    desc: t('index.manage_desc', '解析済みプロジェクトデータの確認・編集・品質チェック'), 
    icon: Code2 
  },
  { 
    step: '4',
    to: '/shuttle/builder', 
    label: t('header.nav.builder', 'Builder'), 
    desc: t('header.nav.builder_desc', '構造化データからバイリンガルファイル等を再構築'), 
    icon: Box 
  },
  { 
    step: '5',
    to: '/shuttle/api', 
    label: t('header.nav.api', 'API Pipeline'), 
    desc: t('index.api_desc', 'AI / LLMによる自動翻訳パイプラインを実行'), 
    icon: Cloud 
  },
])

// 2. 中央カラム: 独立した言語業務特化ツール (Groom & Bell - Warm Yellow / Amber)
const specializedApps = computed(() => [
  {
    to: '/groom',
    title: 'SheepGroom',
    badge: 'Alignment',
    desc: 'Word / PPTX / Excel などの多言語文書から高精度に対訳セグメントを抽出・自動整列し、コーパスを作成します。',
    features: ['Office文書直接抽出', 'インタラクティブ整列エディタ', 'TMX / CSV書き出し'],
    icon: Scissors,
    color: 'amber'
  },
  {
    to: '/bell',
    title: 'SheepBell',
    badge: 'LQA Viewer',
    desc: 'ローカリゼーション品質検証（LQA）の課題一覧、録画動画クリップ、音声文字起こしを一体型ビューアーで高速プレビュー。',
    features: ['動画・画像アセット連携', 'タイムライン連動再生', 'Excel/CSV一括エクスポート'],
    icon: BellIcon,
    color: 'yellow'
  }
])

// 3. 右カラム: 小型ユーティリティツール群 (Tools - Cool Sky Blue)
const utilityTools = computed(() => [
  { 
    to: '/tools/batch', 
    label: t('header.nav.batch', 'Diff'), 
    desc: t('index.batch_desc', '翻訳メモリの差分比較や一括テキスト差分検証'), 
    icon: Split,
    tag: 'Diff'
  },
  { 
    to: '/tools/concordance', 
    label: t('header.nav.concordance', 'Concordance'), 
    desc: t('index.concordance_desc', '大量のTMから指定用語の用例・文脈を高速検索'), 
    icon: Search,
    tag: 'Search'
  },
  { 
    to: '/tools/check-percentage', 
    label: t('header.nav.check_percentage', 'Match %'), 
    desc: t('header.nav.check_percentage_desc', '類似度・一致率の閾値やウェイト計算シミュレーション'), 
    icon: Percent,
    tag: 'Match'
  },
  { 
    to: '/tools/chunk', 
    label: t('header.nav.chunk', 'Chunk Splitter'), 
    desc: t('index.chunk_desc', '長文テキストを指定文字数・トークン単位で分割'), 
    icon: Scissors,
    tag: 'Split'
  },
])

// 4. 最下部: Playground (実験・遊び心 - Purple)
const playgroundLinks = computed(() => [
  { 
    to: '/play/edit-distance', 
    label: t('header.nav.edit_distance', 'Edit Distance Visualizer'), 
    desc: t('index.edit_distance_desc', 'レーベンシュタイン距離（編集距離）の計算アルゴリズムをインタラクティブに可視化・体験'), 
    icon: Sparkles 
  },
])
</script>

<template>
  <div class="home-view">
    <!-- ヒーローセクション -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="emoji">🐑</span>
          SheepComb<span class="gradient-text">Web</span>
        </h1>
        <p class="hero-subtitle">
          {{ $t('index.hero_subtitle_1', '翻訳データ処理・解析プラットフォーム') }}
          <br />
          {{ $t('index.hero_subtitle_2', '多言語アセットを自在にパースして構造化し、AI＆LLMでの処理を可能に') }}
        </p>
      </div>
    </section>

    <!-- メインエリア: 3カラム構成 -->
    <div class="main-3columns-wrapper">
      
      <!-- カラム1: SheepShuttle パイプライン (Teal / Emerald) -->
      <section class="column-section shuttle-column">
        <div class="section-badge-header">
          <span class="column-pill pill-shuttle">Core Engine</span>
          <h2 class="column-heading">
            <Database :size="20" class="heading-icon icon-shuttle" />
            <span>基幹パイプライン</span>
          </h2>
          <p class="column-subtext">翻訳ワークフローの主軸となる一連の工程</p>
        </div>

        <div class="shuttle-hero-card">
          <div class="shuttle-card-header">
            <div class="shuttle-icon-wrap">
              <Database :size="24" />
            </div>
            <div class="shuttle-title-area">
              <div class="title-row">
                <h3>SheepShuttle</h3>
                <span class="shuttle-badge">Pipeline 5</span>
              </div>
              <p class="shuttle-summary">パースから解析・再構築・AI翻訳まで完結</p>
            </div>
          </div>

          <div class="pipeline-step-list">
            <NuxtLink 
              v-for="step in shuttleSteps" 
              :key="step.to" 
              :to="step.to" 
              class="step-item"
            >
              <div class="step-num">{{ step.step }}</div>
              <div class="step-icon">
                <component :is="step.icon" :size="16" />
              </div>
              <div class="step-details">
                <div class="step-name">{{ step.label }}</div>
                <div class="step-desc">{{ step.desc }}</div>
              </div>
              <ArrowRight class="step-arrow" :size="14" />
            </NuxtLink>
          </div>

          <div class="shuttle-card-footer">
            <NuxtLink to="/shuttle/parser" class="btn-start-pipeline">
              <span>パイプラインを開始 (Step 1へ)</span>
              <ArrowRight :size="15" class="btn-arrow" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- カラム2: 独立特化型ツール (SheepGroom & SheepBell - Yellow / Amber) -->
      <section class="column-section apps-column">
        <div class="section-badge-header">
          <span class="column-pill pill-apps">Specialized Apps</span>
          <h2 class="column-heading">
            <Layers :size="20" class="heading-icon icon-apps" />
            <span>言語支援 & LQA</span>
          </h2>
          <p class="column-subtext">業務を強力にサポートする特化型独立アプリ</p>
        </div>

        <div class="apps-stack">
          <NuxtLink 
            v-for="app in specializedApps" 
            :key="app.to" 
            :to="app.to" 
            class="app-hero-card"
            :class="`card-${app.color}`"
          >
            <div class="app-card-header">
              <div class="app-icon-wrap">
                <component :is="app.icon" :size="22" />
              </div>
              <div class="app-title-area">
                <div class="title-row">
                  <h3>{{ app.title }}</h3>
                  <span class="app-badge">{{ app.badge }}</span>
                </div>
              </div>
            </div>

            <p class="app-desc">{{ app.desc }}</p>

            <ul class="app-features">
              <li v-for="(feat, idx) in app.features" :key="idx">
                <span class="feat-dot"></span>
                <span>{{ feat }}</span>
              </li>
            </ul>

            <div class="app-action">
              <span>ツールを開く</span>
              <ArrowRight :size="15" class="action-arrow" />
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- カラム3: 小型ユーティリティ (Tools - Sky Blue) -->
      <section class="column-section tools-column">
        <div class="section-badge-header">
          <span class="column-pill pill-tools">Quick Utilities</span>
          <h2 class="column-heading">
            <Split :size="20" class="heading-icon icon-tools" />
            <span>小型ツール集</span>
          </h2>
          <p class="column-subtext">実務で即座に役立つ軽量ユーティリティ群</p>
        </div>

        <div class="tools-list">
          <NuxtLink 
            v-for="tool in utilityTools" 
            :key="tool.to" 
            :to="tool.to" 
            class="tool-card-box"
          >
            <div class="tool-icon-wrap">
              <component :is="tool.icon" :size="18" />
            </div>
            <div class="tool-content">
              <div class="tool-title-row">
                <h3>{{ tool.label }}</h3>
                <span class="tool-tag">{{ tool.tag }}</span>
              </div>
              <p>{{ tool.desc }}</p>
            </div>
            <ArrowRight class="tool-arrow" :size="15" />
          </NuxtLink>
        </div>
      </section>

    </div>

    <!-- 区切り線 -->
    <div class="section-divider">
      <hr />
      <span class="divider-label">Playground & Experiment</span>
    </div>

    <!-- 下部: Playground (Purple) -->
    <section class="playground-section">
      <div class="playground-header">
        <h2 class="playground-title">
          <Gamepad2 :size="20" class="heading-icon icon-play" />
          <span>{{ $t('index.category_play', '実験 & 遊び場') }}</span>
        </h2>
        <p class="playground-subtext">好奇心を刺激するアルゴリズムのインタラクティブ可視化</p>
      </div>

      <div class="playground-grid">
        <NuxtLink 
          v-for="play in playgroundLinks" 
          :key="play.to" 
          :to="play.to" 
          class="play-card-box"
        >
          <div class="play-icon">
            <component :is="play.icon" :size="24" />
          </div>
          <div class="play-content">
            <h3>{{ play.label }}</h3>
            <p>{{ play.desc }}</p>
          </div>
          <ArrowRight class="play-arrow" :size="18" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 4rem;
}

/* ヒーロー */
.hero {
  text-align: center;
  padding: 1.5rem 1rem 2.5rem;
}

.hero-title {
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.gradient-text {
  background: linear-gradient(135deg, #10b981 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.5;
}

/* 3カラムレイアウト */
.main-3columns-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-items: stretch;
}

/* カラムフォーカス演出: いずれかのカラムにホバー時、非ホバーのカラムを少し落ち着かせる */
@media (min-width: 1024px) {
  .main-3columns-wrapper:hover .column-section:not(:hover) {
    opacity: 0.55;
    filter: saturate(0.85) brightness(0.92);
  }
}

@media (max-width: 1100px) {
  .main-3columns-wrapper {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  .tools-column {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .main-3columns-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .tools-column {
    grid-column: span 1;
  }
}

.column-section {
  display: flex;
  flex-direction: column;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.section-badge-header {
  margin-bottom: 1.1rem;
}

.column-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}

/* Column Badges & Heading Icons */
/* Left: Teal */
.pill-shuttle {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.heading-icon.icon-shuttle { color: #34d399; }

/* Center: Amber / Yellow */
.pill-apps {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.heading-icon.icon-apps { color: #fbbf24; }

/* Right: Sky Blue */
.pill-tools {
  background: rgba(14, 165, 233, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(14, 165, 233, 0.3);
}
.heading-icon.icon-tools { color: #38bdf8; }

/* Bottom: Purple */
.heading-icon.icon-play { color: #c084fc; }

.column-heading {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.column-subtext {
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* ===================================================
   1. Shuttle 特大リッチカード (Teal Accent)
   =================================================== */
.shuttle-hero-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  height: 100%;
  transition: var(--transition);
}

.shuttle-hero-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(16, 185, 129, 0.45);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.12);
}

.shuttle-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border);
}

.shuttle-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xs);
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shuttle-title-area {
  flex: 1;
}

.shuttle-title-area h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
}

.shuttle-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  text-transform: uppercase;
}

.shuttle-summary {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.pipeline-step-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  text-decoration: none;
  transition: var(--transition);
}

.step-item:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateX(3px);
}

.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: var(--transition);
}

.step-item:hover .step-icon {
  color: #34d399;
}

.step-details {
  flex: 1;
  min-width: 0;
}

.step-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.step-desc {
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-arrow {
  color: var(--text-muted);
  opacity: 0;
  transition: var(--transition);
  flex-shrink: 0;
}

.step-item:hover .step-arrow {
  opacity: 1;
  color: #34d399;
  transform: translateX(2px);
}

.shuttle-card-footer {
  margin-top: auto;
  padding-top: 0.75rem;
}

.btn-start-pipeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: var(--radius-xs);
  background: linear-gradient(135deg, #059669, #10b981);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: var(--transition);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.25);
}

.btn-start-pipeline:hover {
  background: linear-gradient(135deg, #047857, #059669);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.play-icon {
  fill: currentColor;
}

/* ===================================================
   2. Apps Stack (Groom & Bell - Warm Yellow/Amber)
   =================================================== */
.apps-stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 100%;
}

.app-hero-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: var(--transition);
}

.app-hero-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(245, 158, 11, 0.45);
  box-shadow: 0 8px 28px rgba(245, 158, 11, 0.12);
  transform: translateY(-2px);
}

.app-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.75rem;
}

.app-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
}

.app-title-area {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-row h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.app-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  background: rgba(245, 158, 11, 0.15);
  color: #fde68a;
}

.app-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin-bottom: 0.85rem;
}

.app-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.app-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.73rem;
  color: var(--text-muted);
}

.feat-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fbbf24;
  flex-shrink: 0;
}

.app-action {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: var(--transition);
}

.app-hero-card:hover .app-action { 
  color: #fbbf24; 
}

.action-arrow {
  transition: transform var(--transition);
}

.app-hero-card:hover .action-arrow {
  transform: translateX(4px);
}

/* ===================================================
   3. Tools リスト (Cool Sky Blue)
   =================================================== */
.tools-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  height: 100%;
}

.tool-card-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: var(--transition);
}

.tool-card-box:hover {
  background: var(--bg-card-hover);
  border-color: rgba(14, 165, 233, 0.45);
  box-shadow: 0 4px 18px rgba(14, 165, 233, 0.1);
  transform: translateX(3px);
}

.tool-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-xs);
  background: rgba(14, 165, 233, 0.12);
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}

.tool-card-box:hover .tool-icon-wrap {
  background: rgba(14, 165, 233, 0.2);
  color: #7dd3fc;
}

.tool-content {
  flex: 1;
  min-width: 0;
}

.tool-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.15rem;
}

.tool-title-row h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.tool-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: rgba(14, 165, 233, 0.1);
  color: #7dd3fc;
}

.tool-content p {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-arrow {
  color: var(--text-muted);
  transition: var(--transition);
  flex-shrink: 0;
}

.tool-card-box:hover .tool-arrow {
  color: #38bdf8;
  transform: translateX(3px);
}

/* ===================================================
   区切り線
   =================================================== */
.section-divider {
  position: relative;
  text-align: center;
  margin: 3.5rem 0 2rem;
}

.section-divider hr {
  border: none;
  border-top: 1px solid var(--border);
}

.divider-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  padding: 0 16px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

/* ===================================================
   4. Playground (Purple)
   =================================================== */
.playground-section {
  display: flex;
  flex-direction: column;
}

.playground-header {
  margin-bottom: 1.25rem;
}

.playground-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.playground-subtext {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.playground-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.play-card-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: var(--transition);
}

.play-card-box:hover {
  background: var(--bg-card-hover);
  border-color: rgba(168, 85, 247, 0.45);
  box-shadow: 0 8px 28px rgba(168, 85, 247, 0.12);
  transform: translateY(-2px);
}

.play-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xs);
  background: rgba(168, 85, 247, 0.14);
  color: #c084fc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.play-content {
  flex: 1;
}

.play-content h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.2rem;
}

.play-content p {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.play-arrow {
  color: var(--text-muted);
  transition: var(--transition);
  flex-shrink: 0;
}

.play-card-box:hover .play-arrow {
  color: #c084fc;
  transform: translateX(4px);
}
</style>
