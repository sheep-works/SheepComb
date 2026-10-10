<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Trash2, X, AlertTriangle, Database, Scissors, Bell as BellIcon, Split, Sparkles } from 'lucide-vue-next'
import { useShuttleStore } from '../../stores/shuttleStore'
import { useDiffStore } from '../../stores/diffStore'
import { useGroomStore } from '../../stores/groomStore'
import { useToast } from '../../composables/useToast'
import { useI18n } from 'vue-i18n'

const isOpen = defineModel<boolean>('open', { default: false })

const shuttleStore = useShuttleStore()
const diffStore = useDiffStore()
const groomStore = useGroomStore()
const toast = useToast()
const { t } = useI18n()

const toggles = reactive({
  all: false,
  shuttle: false,
  groom: false,
  bell: false,
  others: false
})

const closeModal = () => {
  isOpen.value = false
  // Reset all toggles on close
  toggles.all = false
  toggles.shuttle = false
  toggles.groom = false
  toggles.bell = false
  toggles.others = false
}

const clearStorageByPrefix = (prefixes: string[]) => {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && prefixes.some(p => key.toLowerCase().startsWith(p.toLowerCase()))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && prefixes.some(p => key.toLowerCase().startsWith(p.toLowerCase()))) {
        sessionStorage.removeItem(key)
      }
    }
  } catch (e) {
    console.error('Storage clear error:', e)
  }
}

const handleClear = (type: 'ALL' | 'SHUTTLE' | 'GROOM' | 'BELL' | 'OTHERS') => {
  switch (type) {
    case 'ALL':
      shuttleStore.clear()
      groomStore.clear()
      diffStore.clear?.()
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error(e)
      }
      toggles.all = false
      toast.success(t('common.clear_modal.msg_all_cleared', 'すべての作業データを初期化しました'))
      closeModal()
      break

    case 'SHUTTLE':
      shuttleStore.clear()
      try {
        localStorage.removeItem('shuttle')
      } catch (e) {
        console.error(e)
      }
      toggles.shuttle = false
      toast.success(t('common.clear_modal.msg_shuttle_cleared', 'SheepShuttleの作業データを初期化しました'))
      closeModal()
      break

    case 'GROOM':
      groomStore.clear()
      clearStorageByPrefix(['groom', 'sheep-groom', 'sheepgroom'])
      toggles.groom = false
      toast.success(t('common.clear_modal.msg_groom_cleared', 'SheepGroomのデータを初期化しました'))
      closeModal()
      break

    case 'BELL':
      clearStorageByPrefix(['bell', 'sheep-bell', 'sheepbell'])
      toggles.bell = false
      toast.success(t('common.clear_modal.msg_bell_cleared', 'SheepBellのデータを初期化しました'))
      closeModal()
      break

    case 'OTHERS':
      diffStore.clear?.()
      clearStorageByPrefix(['diff', 'concordance', 'tools', 'percentage', 'chunk', 'edit-distance'])
      toggles.others = false
      toast.success(t('common.clear_modal.msg_others_cleared', 'その他のツールデータを初期化しました'))
      closeModal()
      break
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-dialog" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-title-group">
              <div class="icon-danger-badge">
                <Trash2 :size="20" />
              </div>
              <div>
                <h3 class="modal-title">{{ $t('common.clear_modal.title', 'データ消去・初期化') }}</h3>
                <p class="modal-desc">{{ $t('common.clear_modal.subtitle', '消したいデータを選択して削除をクリックしてください。この操作は取り消せません。') }}</p>
              </div>
            </div>
            <button class="btn-close" @click="closeModal" :aria-label="$t('common.cancel', '閉じる')">
              <X :size="18" />
            </button>
          </div>

          <!-- Body list -->
          <div class="modal-body">
            <div class="clear-items-list">
              
              <!-- 1. 全消去 -->
              <div class="clear-item-row is-all">
                <div class="item-info">
                  <div class="item-header-text">
                    <Sparkles :size="16" class="item-icon danger" />
                    <span class="item-title danger">{{ $t('common.clear_modal.all_title', '全消去 (すべてのデータ)') }}</span>
                  </div>
                  <p class="item-subtext">{{ $t('common.clear_modal.all_desc', 'ブラウザ内に保存された全ツールの作業データとキャッシュを初期化します') }}</p>
                </div>
                <div class="item-controls">
                  <label class="switch-toggle" :title="$t('common.clear_modal.toggle_unlock', '削除ロック解除')">
                    <input type="checkbox" v-model="toggles.all" />
                    <span class="switch-slider"></span>
                  </label>
                  <button 
                    class="btn-delete-row" 
                    :disabled="!toggles.all" 
                    @click="handleClear('ALL')"
                  >
                    <Trash2 :size="14" />
                    <span>{{ $t('common.clear_modal.btn_delete', '削除') }}</span>
                  </button>
                </div>
              </div>

              <!-- 2. SheepShuttle -->
              <div class="clear-item-row">
                <div class="item-info">
                  <div class="item-header-text">
                    <Database :size="16" class="item-icon shuttle" />
                    <span class="item-title">{{ $t('common.clear_modal.shuttle_title', 'SheepShuttle のデータ') }}</span>
                  </div>
                  <p class="item-subtext">{{ $t('common.clear_modal.shuttle_desc', 'パース、解析、管理、APIパイプラインの保持データ') }}</p>
                </div>
                <div class="item-controls">
                  <label class="switch-toggle" :title="$t('common.clear_modal.toggle_unlock', '削除ロック解除')">
                    <input type="checkbox" v-model="toggles.shuttle" />
                    <span class="switch-slider"></span>
                  </label>
                  <button 
                    class="btn-delete-row" 
                    :disabled="!toggles.shuttle" 
                    @click="handleClear('SHUTTLE')"
                  >
                    <Trash2 :size="14" />
                    <span>{{ $t('common.clear_modal.btn_delete', '削除') }}</span>
                  </button>
                </div>
              </div>

              <!-- 3. SheepGroom -->
              <div class="clear-item-row">
                <div class="item-info">
                  <div class="item-header-text">
                    <Scissors :size="16" class="item-icon groom" />
                    <span class="item-title">{{ $t('common.clear_modal.groom_title', 'SheepGroom のデータ') }}</span>
                  </div>
                  <p class="item-subtext">{{ $t('common.clear_modal.groom_desc', '対訳整列（Alignment）プロジェクトデータ') }}</p>
                </div>
                <div class="item-controls">
                  <label class="switch-toggle" :title="$t('common.clear_modal.toggle_unlock', '削除ロック解除')">
                    <input type="checkbox" v-model="toggles.groom" />
                    <span class="switch-slider"></span>
                  </label>
                  <button 
                    class="btn-delete-row" 
                    :disabled="!toggles.groom" 
                    @click="handleClear('GROOM')"
                  >
                    <Trash2 :size="14" />
                    <span>{{ $t('common.clear_modal.btn_delete', '削除') }}</span>
                  </button>
                </div>
              </div>

              <!-- 4. SheepBell -->
              <div class="clear-item-row">
                <div class="item-info">
                  <div class="item-header-text">
                    <BellIcon :size="16" class="item-icon bell" />
                    <span class="item-title">{{ $t('common.clear_modal.bell_title', 'SheepBell のデータ') }}</span>
                  </div>
                  <p class="item-subtext">{{ $t('common.clear_modal.bell_desc', 'LQA検証・ルールチェックデータ') }}</p>
                </div>
                <div class="item-controls">
                  <label class="switch-toggle" :title="$t('common.clear_modal.toggle_unlock', '削除ロック解除')">
                    <input type="checkbox" v-model="toggles.bell" />
                    <span class="switch-slider"></span>
                  </label>
                  <button 
                    class="btn-delete-row" 
                    :disabled="!toggles.bell" 
                    @click="handleClear('BELL')"
                  >
                    <Trash2 :size="14" />
                    <span>{{ $t('common.clear_modal.btn_delete', '削除') }}</span>
                  </button>
                </div>
              </div>

              <!-- 5. その他のデータ -->
              <div class="clear-item-row">
                <div class="item-info">
                  <div class="item-header-text">
                    <Split :size="16" class="item-icon tools" />
                    <span class="item-title">{{ $t('common.clear_modal.others_title', 'その他のデータ') }}</span>
                  </div>
                  <p class="item-subtext">{{ $t('common.clear_modal.others_desc', 'Diff差分検証、コンコーダンス、確率チェック等のデータ') }}</p>
                </div>
                <div class="item-controls">
                  <label class="switch-toggle" :title="$t('common.clear_modal.toggle_unlock', '削除ロック解除')">
                    <input type="checkbox" v-model="toggles.others" />
                    <span class="switch-slider"></span>
                  </label>
                  <button 
                    class="btn-delete-row" 
                    :disabled="!toggles.others" 
                    @click="handleClear('OTHERS')"
                  >
                    <Trash2 :size="14" />
                    <span>{{ $t('common.clear_modal.btn_delete', '削除') }}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">
              {{ $t('common.cancel', '閉じる') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-dialog {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  background: rgba(255, 255, 255, 0.02);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-danger-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  color: var(--error);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.modal-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 4px 0 0;
  line-height: 1.4;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: var(--transition);
}

.btn-close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.modal-body {
  padding: 20px 24px;
  max-height: calc(85vh - 160px);
  overflow-y: auto;
}

.clear-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clear-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.clear-item-row:hover {
  border-color: var(--border-hover);
}

.clear-item-row.is-all {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.25);
}

.clear-item-row.is-all:hover {
  border-color: rgba(239, 68, 68, 0.4);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-header-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-icon {
  flex-shrink: 0;
}

.item-icon.danger { color: var(--error); }
.item-icon.shuttle { color: var(--accent); }
.item-icon.groom { color: var(--warning); }
.item-icon.bell { color: #f59e0b; }
.item-icon.tools { color: #38bdf8; }

.item-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.item-title.danger {
  color: var(--error);
}

.item-subtext {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin: 3px 0 0;
  line-height: 1.35;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Switch Toggle */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 20px;
  flex-shrink: 0;
}

.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-muted);
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

.switch-toggle input:checked + .switch-slider {
  background-color: rgba(239, 68, 68, 0.25);
  border-color: var(--error);
}

.switch-toggle input:checked + .switch-slider:before {
  transform: translateX(18px);
  background-color: var(--error);
}

/* Delete Button */
.btn-delete-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--transition);
  background: var(--bg-hover);
  color: var(--text-muted);
  opacity: 0.4;
}

.btn-delete-row:not(:disabled) {
  background: var(--error);
  color: white;
  opacity: 1;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
}

.btn-delete-row:not(:disabled):hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.01);
}

.btn-cancel {
  padding: 8px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

/* Modal animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
