<script setup lang="ts">
import { computed } from 'vue'
import { History, Sparkles, Tag, Calendar, ArrowLeft } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

useHead({
  meta: [
    { name: 'description', content: 'Version history and release notes for SheepComb since v2.0' }
  ]
})

definePageMeta({
  title: 'Version Log'
})

const { locale } = useI18n()
const localePath = useLocalePath()

type LocaleCode = 'ja' | 'en' | 'zh'

interface ReleaseEntry {
  version: string
  date: string
  isLatest?: boolean
  tag: { ja: string; en: string; zh: string }
  summary: { ja: string; en: string; zh: string }
  items: { ja: string[]; en: string[]; zh: string[] }
}

const releases: ReleaseEntry[] = [
  {
    version: '2.2.0',
    date: '2026-11-11',
    isLatest: true,
    tag: {
      ja: 'UI改善・編集機能',
      en: 'UI & Editing',
      zh: '界面优化与编辑'
    },
    summary: {
      ja: '作業スペースを広く確保するサイドバー折りたたみ機能や、Manage上での訳文修正機能などを追加しました。',
      en: 'Added collapsible sidebars for wider workspaces, inline target editing in Manage, and this version log.',
      zh: '新增侧边栏折叠功能以扩展工作区空间，支持在 Manage 中直接微调译文，并新增版本日志页面。'
    },
    items: {
      ja: [
        '一括差分（Batch）および Shuttle 全ページ（Parser / Analyzer / Manage / API Client / Builder）に、サイドバーの折りたたみ（<<）・展開（>>）機能を実装（開閉状態の自動保存対応）',
        'Manage の詳細ビューで訳文（TGT）の直接編集に対応（編集ボタンまたはダブルクリック）',
        'フッターにバージョンログ（更新履歴）ページを追加'
      ],
      en: [
        'Added collapsible sidebars (<< / >>) with persistent state across Batch Diff and all Shuttle pages (Parser, Analyzer, Manage, API Client, Builder)',
        'Added inline target (TGT) editing in the Manage detail modal (via Edit button or double-click)',
        'Added the Version Log page linked from the footer'
      ],
      zh: [
        '为批量差异工具及所有 Shuttle 页面（Parser / Analyzer / Manage / API Client / Builder）添加侧边栏折叠（<<）/ 展开（>>）及状态保存功能',
        '支持在 Manage 详情弹窗中直接编辑译文（TGT）（点击编辑按钮或双击文本）',
        '在页脚新增版本更新日志页面'
      ]
    }
  },
  {
    version: '2.1.1',
    date: '2026-10-25',
    tag: {
      ja: 'Suffolk統合・PWA',
      en: 'Suffolk & PWA',
      zh: 'Suffolk 集成与 PWA'
    },
    summary: {
      ja: 'テキスト変換エンジン「Suffolk」やアプリ間の相互データ連携、PWA（オフライン対応）を追加しました。',
      en: 'Integrated the Suffolk WASM engine, cross-app Data Bridge, and offline PWA support.',
      zh: '集成了 Suffolk WASM 文本转换引擎、跨工具数据互通以及离线 PWA 支持。'
    },
    items: {
      ja: [
        'WASM ベースのテキスト変換・一括置換アプリ「Suffolk」をポータル・ホーム画面に追加',
        'Shuttle / Groom / Bell / Suffolk 間のデータブリッジ連携（相互取り込み）に対応',
        'PWA（オフライン WASM プリキャッシュ・アプリインストール・アイコン刷新）に対応',
        'Groom の Excel 読み込み・フィルタおよび改行分割モーダルを改善'
      ],
      en: [
        'Integrated the WASM-powered text transformation tool "Suffolk" into the portal and home screen',
        'Added cross-app Data Bridge between Shuttle, Groom, Bell, and Suffolk',
        'Integrated PWA support with offline WASM precaching and refreshed app icons',
        'Improved Groom Excel parsing, filtering, and the newline-splitting modal'
      ],
      zh: [
        '将基于 WASM 的文本转换工具 "Suffolk" 集成至门户及首页',
        '实现 Shuttle / Groom / Bell / Suffolk 之间的数据互通桥接',
        '支持 PWA 离线运行、WASM 预缓存并更新应用图标',
        '优化 Groom 的 Excel 解析、筛选及换行拆分弹窗'
      ]
    }
  },
  {
    version: '2.0.1',
    date: '2026-10-11 〜 2026-10-22',
    tag: {
      ja: 'Shuttle v1.5・QA強化',
      en: 'Shuttle v1.5 & QA',
      zh: 'Shuttle v1.5 与 QA 强化'
    },
    summary: {
      ja: 'コアエンジンを v1.5 へ更新し、禁止用語チェックやメモ編集、各種管理 UI を拡充しました。',
      en: 'Upgraded the core engine to SheepShuttle v1.5 with memo editing, forbidden terms QA, and management UIs.',
      zh: '将核心引擎升级至 SheepShuttle v1.5，新增备注编辑、禁用词 QA 检查及各类管理界面。'
    },
    items: {
      ja: [
        'SheepShuttle v1.5 統合：詳細ビューでのユーザー備考（MEMO）編集、禁止用語の QA・TB チェックに対応',
        '一致率に基づくセグメントロック UI、TB 用語一括反映 UI、TOON フォーマットに対応',
        'package.json と連動したバージョン表記、動的ページタイトル、マニュアルページの充実'
      ],
      en: [
        'Updated core to SheepShuttle v1.5: added unit MEMO editing and forbidden terms support in QA & TB parsing',
        'Added segment lock UI, batch TB apply UI, and TOON format support',
        'Linked version display, dynamic page titles, and expanded manual documentation'
      ],
      zh: [
        '升级至 SheepShuttle v1.5，支持详情页用户备注（MEMO）编辑及禁用词 QA/TB 检查',
        '新增匹配度锁定 UI、术语批量应用 UI 及 TOON 格式支持',
        '关联包版本号显示、动态页面标题并扩充使用手册'
      ]
    }
  },
  {
    version: '2.0.0',
    date: '2026-10-11',
    tag: {
      ja: 'v2.0 全面刷新',
      en: 'Major Release',
      zh: 'v2.0 全面重构'
    },
    summary: {
      ja: 'Nuxt 4 ベースの統合翻訳支援 Web ポータルとしてデザイン・機能構成を全面刷新しました。',
      en: 'Rebuilt from the ground up on Nuxt 4 as an integrated multilingual translation portal.',
      zh: '基于 Nuxt 4 全面重构为一体化多语言翻译支持 Web 门户。'
    },
    items: {
      ja: [
        '2カラムのワークフロー＆ツールレイアウトを採用し、ポータル全体をダーク＆ティールテーマで統一',
        '対訳アライメント「Groom」および LQA レビュー「Bell」のフル GUI を Web ポータルに統合',
        'ブラウザ内での Office 文書（Word / PowerPoint / Excel）テキスト抽出に対応',
        '日本語・英語・中国語の多言語 UI および共通コンポーネント基盤を整備'
      ],
      en: [
        'Introduced 2-column workflow & tools layout with a unified dark/teal design system',
        'Integrated full interactive GUIs for Groom (alignment) and Bell (LQA review)',
        'Added browser-side Office document extractor for Word, PowerPoint, and Excel',
        'Established trilingual UI (ja / en / zh) and shared UI component architecture'
      ],
      zh: [
        '采用工作流与工具双栏布局，统一深色与青绿色主题设计系统',
        '将双语对齐工具 Groom 与 LQA 审校工具 Bell 的完整界面集成至门户',
        '支持在浏览器端直接提取 Word、PowerPoint、Excel 文档内容',
        '构建中/日/英三语界面与通用组件体系'
      ]
    }
  }
]

const currentLang = computed<LocaleCode>(() => {
  const code = locale.value
  if (code === 'en' || code === 'zh') return code
  return 'ja'
})
</script>

<template>
  <div class="changelog-page">
    <div class="page-header">
      <div class="header-icon-wrapper">
        <History :size="28" class="header-icon" />
      </div>
      <div class="header-text">
        <h1>{{ $t('changelog.title') }}</h1>
        <p class="subtitle">{{ $t('changelog.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/')" class="btn-back-home">
        <ArrowLeft :size="15" />
        <span>Home</span>
      </NuxtLink>
    </div>

    <div class="timeline">
      <article
        v-for="release in releases"
        :key="release.version"
        class="release-card"
        :class="{ 'release-latest': release.isLatest }"
      >
        <div class="timeline-marker" :class="{ 'marker-latest': release.isLatest }"></div>

        <div class="release-header">
          <div class="release-version-group">
            <span class="release-version">v{{ release.version }}</span>
            <span v-if="release.isLatest" class="badge-latest">
              <Sparkles :size="12" />
              {{ $t('changelog.latest') }}
            </span>
            <span class="badge-tag">
              <Tag :size="11" />
              {{ release.tag[currentLang] }}
            </span>
          </div>
          <div class="release-date">
            <Calendar :size="13" />
            <span>{{ release.date }}</span>
          </div>
        </div>

        <p class="release-summary">{{ release.summary[currentLang] }}</p>

        <ul class="release-list">
          <li v-for="(item, idx) in release.items[currentLang]" :key="idx">
            {{ item }}
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>

<style scoped>
.changelog-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  background: var(--accent-glow);
  border: 1px solid var(--border-accent);
  flex-shrink: 0;
}

.header-icon {
  color: var(--accent);
}

.header-text {
  flex: 1;
  min-width: 220px;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-back-home {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-xs);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

.btn-back-home:hover {
  color: var(--accent-light);
  border-color: var(--border-accent);
  background: var(--bg-hover);
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: var(--border);
  border-radius: 2px;
}

.release-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition);
}

.release-card:hover {
  border-color: var(--border-hover);
}

.release-latest {
  border-color: var(--border-accent);
  box-shadow: var(--shadow-sm), 0 0 24px rgba(16, 185, 129, 0.06);
}

.timeline-marker {
  position: absolute;
  left: -23px;
  top: 28px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 2px solid var(--text-muted);
}

.marker-latest {
  background: var(--accent);
  border-color: var(--accent-light);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.release-version-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.release-version {
  font-family: 'Inter', monospace;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
}

.badge-latest {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  background: var(--accent-glow);
  color: var(--accent-light);
  border: 1px solid var(--border-accent);
}

.badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.release-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', monospace;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.release-summary {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 14px 0;
}

.release-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.release-list li {
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--text-primary);
}

.release-list li::marker {
  color: var(--accent);
}

@media (max-width: 640px) {
  .changelog-page {
    padding: 24px 16px 48px;
  }

  .timeline {
    padding-left: 18px;
  }

  .timeline::before {
    left: 5px;
  }

  .timeline-marker {
    left: -19px;
    width: 10px;
    height: 10px;
  }

  .release-card {
    padding: 18px;
  }
}
</style>
