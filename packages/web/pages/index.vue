<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  Database, Zap, Code2, Box, Cloud, 
  Split, Search, Scissors, Percent, 
  Scissors as GroomIcon, Bell as BellIcon, 
  Gamepad2, Sparkles, ArrowRight, CheckCircle2
} from 'lucide-vue-next'

definePageMeta({
  title: 'Home',
})

const { t } = useI18n()

// 左カラム: ワークフロー (Shuttle Pipeline: 順序性のある5ステップ)
const workflowSteps = computed(() => [
  { 
    step: '1',
    to: '/shuttle/parser', 
    label: t('header.nav.parser'), 
    desc: t('index.parser_desc', '翻訳対象ファイルを解析し、テキストセグメントを抽出します'), 
    icon: Database 
  },
  { 
    step: '2',
    to: '/shuttle/analyzer', 
    label: t('header.nav.analyzer'), 
    desc: t('index.analyzer_desc', 'TM/TBとの一致率や内部類似度を解析し構造化します'), 
    icon: Zap 
  },
  { 
    step: '3',
    to: '/shuttle/manage', 
    label: t('header.nav.manage'), 
    desc: t('index.manage_desc', '解析済みプロジェクトデータの確認・編集・管理を行います'), 
    icon: Code2 
  },
  { 
    step: '4',
    to: '/shuttle/builder', 
    label: t('header.nav.builder'), 
    desc: t('header.nav.builder_desc', '構造化データからバイリンガルファイル等を再構築します'), 
    icon: Box 
  },
  { 
    step: '5',
    to: '/shuttle/api', 
    label: t('header.nav.api'), 
    desc: t('index.api_desc', 'AI/LLMによる自動翻訳パイプラインを実行します'), 
    icon: Cloud 
  },
])

// 右カラム: ユーティリティ・ツール群
const utilityTools = computed(() => [
  { 
    to: '/tools/batch', 
    label: t('header.nav.batch'), 
    desc: t('index.batch_desc', '翻訳メモリの差分比較や一括テキスト差分検証'), 
    icon: Split,
    tag: 'Diff'
  },
  { 
    to: '/tools/concordance', 
    label: t('header.nav.concordance'), 
    desc: t('index.concordance_desc', '大量のTMから指定用語の用例・文脈を高速検索'), 
    icon: Search,
    tag: 'Search'
  },
  { 
    to: '/groom', 
    label: 'SheepGroom', 
    desc: 'Word/PPTX/Excel等の文書から高精度に対訳を作成・整列', 
    icon: GroomIcon,
    tag: 'Alignment',
    badgeClass: 'badge-teal'
  },
  { 
    to: '/bell', 
    label: 'SheepBell Viewer', 
    desc: 'LQA課題、録画クリップ、音声文字起こしを一覧プレビュー', 
    icon: BellIcon,
    tag: 'LQA',
    badgeClass: 'badge-amber'
  },
  { 
    to: '/tools/check-percentage', 
    label: t('header.nav.check_percentage'), 
    desc: t('header.nav.check_percentage_desc', '類似度・一致率の閾値やウェイト計算シミュレーション'), 
    icon: Percent,
    tag: 'Match'
  },
  { 
    to: '/tools/chunk', 
    label: t('header.nav.chunk', 'テキストチャンク'), 
    desc: t('index.chunk_desc', '長文テキストを指定文字数・トークン単位で分割'), 
    icon: Scissors,
    tag: 'Split'
  },
])

// 下部: 実験・あそび場
const playgroundLinks = computed(() => [
  { 
    to: '/play/edit-distance', 
    label: t('header.nav.edit_distance'), 
    desc: t('index.edit_distance_desc', 'レーベンシュタイン距離の計算アルゴリズムをインタラクティブに可視化・体験'), 
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
          {{ $t('index.hero_subtitle_1') }}
          <br />
          {{ $t('index.hero_subtitle_2') }}
        </p>
      </div>
    </section>

    <!-- メインエリア: 2カラム構成 -->
    <div class="main-columns-wrapper">
      <!-- 左カラム: ワークフロー (Shuttle Pipeline) -->
      <section class="column-section workflow-column">
        <div class="section-badge-header">
          <span class="column-pill pill-blue">Pipeline</span>
          <h2 class="column-heading">
            <Database :size="20" />
            <span>{{ $t('index.category_shuttle', 'ワークフロー (Shuttle)') }}</span>
          </h2>
          <p class="column-subtext">パースからAI翻訳・書き出しまで順番に実行します</p>
        </div>

        <div class="workflow-timeline">
          <NuxtLink 
            v-for="step in workflowSteps" 
            :key="step.to" 
            :to="step.to" 
            class="timeline-card"
          >
            <div class="step-badge">{{ step.step }}</div>
            <div class="card-icon">
              <component :is="step.icon" :size="22" />
            </div>
            <div class="card-text">
              <h3>{{ step.label }}</h3>
              <p>{{ step.desc }}</p>
            </div>
            <ArrowRight class="step-arrow" :size="16" />
          </NuxtLink>
        </div>
      </section>

      <!-- 右カラム: ユーティリティ & 支援ツール -->
      <section class="column-section tools-column">
        <div class="section-badge-header">
          <span class="column-pill pill-purple">Utilities</span>
          <h2 class="column-heading">
            <Split :size="20" />
            <span>{{ $t('index.category_tools', 'ツール & 支援機能') }}</span>
          </h2>
          <p class="column-subtext">対訳作成、LQA検証、差分比較など各種便利ツール</p>
        </div>

        <div class="tools-grid-layout">
          <NuxtLink 
            v-for="tool in utilityTools" 
            :key="tool.to" 
            :to="tool.to" 
            class="tool-card-box"
          >
            <div class="tool-top">
              <div class="card-icon">
                <component :is="tool.icon" :size="20" />
              </div>
              <span class="tool-tag" :class="tool.badgeClass">{{ tool.tag }}</span>
            </div>
            <div class="card-text">
              <h3>{{ tool.label }}</h3>
              <p>{{ tool.desc }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- 区切り線 -->
    <div class="section-divider">
      <hr />
      <span class="divider-label">Playgrounds</span>
    </div>

    <!-- 下部: あそび場・実験カード -->
    <section class="playground-section">
      <div class="playground-header">
        <h2 class="playground-title">
          <Gamepad2 :size="20" />
          <span>{{ $t('index.category_play', '実験 & あそび場') }}</span>
        </h2>
        <p class="playground-subtext">アルゴリズム体験やインタラクティブな検証ツール</p>
      </div>

      <div class="playground-grid">
        <NuxtLink 
          v-for="play in playgroundLinks" 
          :key="play.to" 
          :to="play.to" 
          class="play-card-box"
        >
          <div class="play-icon">
            <component :is="play.icon" :size="26" />
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
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
}

/* ヒーロー */
.hero {
  text-align: center;
  padding: 2.5rem 1rem 3rem;
}

.hero-title {
  font-size: 2.75rem;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.gradient-text {
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 2カラムレイアウト */
.main-columns-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

@media (max-width: 960px) {
  .main-columns-wrapper {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

.column-section {
  display: flex;
  flex-direction: column;
}

.section-badge-header {
  margin-bottom: 1.25rem;
}

.column-pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.pill-blue {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.pill-purple {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.column-heading {
  font-size: 1.4rem;
  font-weight: 700;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
}

.column-subtext {
  font-size: 0.875rem;
  color: #94a3b8;
}

/* 左側: ワークフロータイムライン */
.workflow-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  position: relative;
}

.timeline-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 0.85rem;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.timeline-card:hover {
  background: #24334a;
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateX(4px);
}

.step-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  font-size: 0.85rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-card .card-icon {
  width: 42px;
  height: 42px;
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-card:hover .card-icon {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}

.card-text {
  flex: 1;
}

.card-text h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 0.2rem;
}

.card-text p {
  font-size: 0.825rem;
  color: #94a3b8;
  line-height: 1.4;
}

.step-arrow {
  color: #64748b;
  transition: transform 0.2s, color 0.2s;
  flex-shrink: 0;
}

.timeline-card:hover .step-arrow {
  color: #38bdf8;
  transform: translateX(3px);
}

/* 右側: ツールグリッド */
.tools-grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (max-width: 600px) {
  .tools-grid-layout {
    grid-template-columns: 1fr;
  }
}

.tool-card-box {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 0.85rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tool-card-box:hover {
  background: #24334a;
  border-color: rgba(168, 85, 247, 0.4);
  transform: translateY(-2px);
}

.tool-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.tool-top .card-icon {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-card-box:hover .card-icon {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.15);
}

.tool-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  background: rgba(255, 255, 255, 0.07);
  color: #94a3b8;
}

.badge-teal {
  background: rgba(20, 184, 166, 0.15) !important;
  color: #2dd4bf !important;
}

.badge-amber {
  background: rgba(245, 158, 11, 0.15) !important;
  color: #fbbf24 !important;
}

.tool-card-box .card-text h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 0.35rem;
}

.tool-card-box .card-text p {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.45;
}

/* 区切り線 */
.section-divider {
  position: relative;
  text-align: center;
  margin: 4rem 0 2.5rem;
}

.section-divider hr {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
}

.divider-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #0f172a;
  padding: 0 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* 下部: あそび場セクション */
.playground-section {
  background: rgba(30, 41, 59, 0.5);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
}

.playground-header {
  margin-bottom: 1.5rem;
}

.playground-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.playground-subtext {
  font-size: 0.85rem;
  color: #94a3b8;
}

.playground-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.play-card-box {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.play-card-box:hover {
  background: #252b42;
  border-color: rgba(244, 63, 94, 0.4);
  transform: translateY(-2px);
}

.play-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.play-content {
  flex: 1;
}

.play-content h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.3rem;
}

.play-content p {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.45;
}

.play-arrow {
  color: #64748b;
  transition: transform 0.2s, color 0.2s;
}

.play-card-box:hover .play-arrow {
  color: #fb7185;
  transform: translateX(4px);
}
</style>
