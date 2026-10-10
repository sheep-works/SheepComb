<script setup lang="ts">
import { computed } from 'vue'
import { 
  Trash2, ChevronDown, Database, Zap, Code2, Cloud, 
  Split, Search, BookOpen, Hammer, Percent, Scissors, 
  Gamepad2, Sparkles, Bell as BellIcon 
} from 'lucide-vue-next'
import { useShuttleStore } from '../stores/shuttleStore'
import { useDiffStore } from '../stores/diffStore'
import { useToast } from '~/composables/useToast'
import AppDataClearModal from './common/AppDataClearModal.vue'

const shuttleStore = useShuttleStore()
const diffStore = useDiffStore()
const route = useRoute()
const { t, locale, locales, setLocale } = useI18n()
const toast = useToast()
const config = useRuntimeConfig()
const appVersion = computed(() => (config.public.appVersion as string) || '2.0.0')

const isWasmReady = defineModel<boolean>('wasmReady', { default: false })
const showClearModal = ref(false)

const currentSubtitle = computed(() => {
  const path = route.path
  const pageTitle = (route.meta.title as string) || ''

  if (path === '/' || path === '') {
    return 'Web Application Portal'
  }
  if (path.startsWith('/shuttle')) {
    return pageTitle ? `SheepShuttle - ${pageTitle}` : 'SheepShuttle'
  }
  if (path.startsWith('/groom')) {
    return pageTitle ? `SheepGroom - ${pageTitle}` : 'SheepGroom'
  }
  if (path.startsWith('/bell')) {
    return pageTitle ? `SheepBell - ${pageTitle}` : 'SheepBell'
  }
  if (path.startsWith('/tools')) {
    return pageTitle ? `Tools - ${pageTitle}` : 'Tools'
  }
  if (path.startsWith('/play')) {
    return pageTitle ? `Playground - ${pageTitle}` : 'Playground'
  }
  if (path.startsWith('/manual')) {
    return 'User Manual'
  }
  if (path.startsWith('/license')) {
    return 'Open Source License'
  }
  return pageTitle || 'Web Application Portal'
})

const handleResetAll = () => {
  showClearModal.value = true
}

const handleLocaleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  if (target) {
    if (target.value === 'ja' || target.value === 'en' || target.value === 'zh') {
      setLocale(target.value)
    } else {
      setLocale('ja')
    }
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <NuxtLink to="/" class="logo-link">
        <div class="logo-area">
          <h1 class="logo-text">
            <span class="logo-icon">🐑</span>
            SheepComb
            <span class="logo-version">v{{ appVersion }}</span>
          </h1>
          <p class="logo-subtitle">{{ currentSubtitle }}</p>
        </div>
      </NuxtLink>
    </div>

    <nav class="header-nav" aria-label="Global Navigation">
      <div class="nav-main-groups">
        <!-- 1. Shuttle Group -->
        <div class="nav-item has-dropdown">
          <button class="nav-group-trigger" :class="{ active: route.path.startsWith('/shuttle') }">
            <Database :size="16" />
            <span>{{ $t('header.nav.shuttle', 'Shuttle') }}</span>
            <ChevronDown :size="14" class="chevron" />
          </button>
          <div class="dropdown-menu">
            <NuxtLink to="/shuttle/parser" class="dropdown-item" active-class="active">
              <Database :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.parser', 'Parser') }}</span>
                <span class="desc">{{ $t('header.nav.parser_desc', 'ファイル構文解析・抽出') }}</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/shuttle/analyzer" class="dropdown-item" active-class="active">
              <Zap :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.analyzer', 'Analyzer') }}</span>
                <span class="desc">{{ $t('header.nav.analyzer_desc', 'TM/TB一致率・類似度解析') }}</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/shuttle/manage" class="dropdown-item" active-class="active">
              <Code2 :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.manage', 'Manage') }}</span>
                <span class="desc">{{ $t('header.nav.manage_desc', 'プロジェクトデータ確認・編集') }}</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/shuttle/builder" class="dropdown-item" active-class="active">
              <Hammer :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.builder', 'Builder') }}</span>
                <span class="desc">{{ $t('header.nav.builder_desc', 'バイリンガルファイル再構築') }}</span>
              </div>
            </NuxtLink>
            <div class="dropdown-divider"></div>
            <NuxtLink to="/shuttle/api" class="dropdown-item" active-class="active">
              <Cloud :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.api', 'API Pipeline') }}</span>
                <span class="desc">{{ $t('header.nav.api_desc', 'AI/LLM自動翻訳パイプライン') }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- 2. Groom (Direct link) -->
        <div class="nav-item">
          <NuxtLink to="/groom" class="nav-group-trigger nav-link-btn" :class="{ active: route.path.startsWith('/groom') }">
            <Scissors :size="16" />
            <span>SheepGroom</span>
          </NuxtLink>
        </div>

        <!-- 3. Bell (Direct link) -->
        <div class="nav-item">
          <NuxtLink to="/bell" class="nav-group-trigger nav-link-btn" :class="{ active: route.path.startsWith('/bell') }">
            <BellIcon :size="16" />
            <span>SheepBell</span>
          </NuxtLink>
        </div>

        <!-- 4. Tools Group -->
        <div class="nav-item has-dropdown">
          <button class="nav-group-trigger" :class="{ active: route.path.startsWith('/tools') }">
            <Split :size="16" />
            <span>{{ $t('header.nav.tools', 'Tools') }}</span>
            <ChevronDown :size="14" class="chevron" />
          </button>
          <div class="dropdown-menu">
            <NuxtLink to="/tools/batch" class="dropdown-item" active-class="active">
              <Split :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.batch', 'Diff') }}</span>
                <span class="desc">{{ $t('header.nav.batch_desc', 'テキスト・TM差分検証') }}</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/tools/concordance" class="dropdown-item" active-class="active">
              <Search :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.concordance', 'Concordance') }}</span>
                <span class="desc">{{ $t('header.nav.concordance_desc', '用例・文脈検索') }}</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/tools/check-percentage" class="dropdown-item" active-class="active">
              <Percent :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.check_percentage', 'Match %') }}</span>
                <span class="desc">{{ $t('header.nav.check_percentage_desc', '類似度・一致率計算') }}</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/tools/chunk" class="dropdown-item" active-class="active">
              <Scissors :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.chunk', 'Chunk') }}</span>
                <span class="desc">{{ $t('header.nav.chunk_desc', 'テキスト分割') }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- 5. Play Group -->
        <div class="nav-item has-dropdown">
          <button class="nav-group-trigger" :class="{ active: route.path.startsWith('/play') }">
            <Gamepad2 :size="16" />
            <span>{{ $t('header.nav.play', 'Play') }}</span>
            <ChevronDown :size="14" class="chevron" />
          </button>
          <div class="dropdown-menu">
            <NuxtLink to="/play/edit-distance" class="dropdown-item" active-class="active">
              <Sparkles :size="14" />
              <div class="item-text">
                <span class="label">{{ $t('header.nav.edit_distance', 'Edit Distance') }}</span>
                <span class="desc">{{ $t('header.nav.edit_distance_desc', 'レーベンシュタイン距離可視化') }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- 6. Manual Link -->
        <div class="nav-item">
          <NuxtLink to="/manual" class="nav-group-trigger nav-link-btn" :class="{ active: route.path.startsWith('/manual') }">
            <BookOpen :size="16" />
            <span>{{ $t('header.nav.manual', 'Manual') }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <div class="header-right">
      <div class="locale-switcher">
        <select :value="locale" @change="handleLocaleChange" class="locale-select" aria-label="Select Language">
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">
            {{ loc.name }}
          </option>
        </select>
      </div>
      
      <button class="btn-reset-all" @click="handleResetAll" :title="$t('common.reset_all_title', '全データ初期化')">
        <Trash2 :size="16" />
      </button>

      <div class="wasm-badge" :class="isWasmReady ? 'ready' : 'loading'" :title="isWasmReady ? 'WASM Ready' : 'WASM Initializing'">
        <span class="wasm-dot"></span>
        {{ isWasmReady ? 'WASM' : 'LOADING' }}
      </div>
    </div>

    <!-- Data Clear Modal -->
    <AppDataClearModal v-model:open="showClearModal" />
  </header>
</template>

<style scoped>
.app-header {
  height: 60px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.logo-link {
  text-decoration: none;
  transition: var(--transition);
}

.logo-link:hover {
  opacity: 0.8;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}

.logo-icon {
  -webkit-text-fill-color: initial;
  font-size: 1.1rem;
  margin-right: 2px;
}

.logo-version {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: var(--accent-glow);
  -webkit-text-fill-color: var(--accent-light);
  border-radius: 4px;
  font-family: 'Inter', monospace;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.logo-subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: -2px;
}

/* Navigation */
.header-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0 20px;
}

.nav-main-groups {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  position: relative;
}

.nav-group-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}

.nav-group-trigger:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-group-trigger.active {
  color: var(--accent);
  background: var(--accent-glow);
}

.chevron {
  opacity: 0.5;
  transition: transform 0.3s ease;
}

.nav-item:hover .chevron {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  min-width: 220px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 200;
}

.nav-item:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(4px);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  text-decoration: none;
  color: var(--text-muted);
  transition: var(--transition);
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item.active {
  background: var(--accent-glow);
  color: var(--accent);
}

.item-text {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.82rem;
  font-weight: 700;
}

.desc {
  font-size: 0.68rem;
  opacity: 0.6;
}

.dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 4px;
}

/* Header Right */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  justify-content: flex-end;
}

.locale-select {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
  transition: var(--transition);
}

.locale-select:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.btn-reset-all {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-xs);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  cursor: pointer;
  transition: var(--transition);
}

.btn-reset-all:hover {
  background: var(--error);
  color: #fff;
  border-color: var(--error);
}

.wasm-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-family: 'Inter', monospace;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.wasm-badge.ready {
  color: var(--accent-light);
  border-color: var(--border-accent);
}

.wasm-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

.wasm-badge.ready .wasm-dot {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

@media (max-width: 1024px) {
  .header-nav {
    display: none; /* 小画面時はモバイルメニュー等 */
  }
}
</style>
