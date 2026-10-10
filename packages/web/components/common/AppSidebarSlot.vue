<script setup lang="ts">
interface Props {
  showPlaceholder?: boolean
}

withDefaults(defineProps<Props>(), {
  showPlaceholder: false
})
</script>

<template>
  <aside class="app-sidebar-slot" aria-label="Sponsor or advertisement space">
    <div class="slot-container">
      <slot>
        <!-- 将来の広告/スポンサー枠のプレースホルダー（デフォルトは非表示または控えめな表示） -->
        <div v-if="showPlaceholder" class="slot-placeholder">
          <span class="slot-badge">Sponsor</span>
          <div class="slot-card">
            <p class="slot-title">SheepComb OSS</p>
            <p class="slot-desc">Supporting open-source localization tools.</p>
          </div>
        </div>
      </slot>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar-slot {
  display: none;
  flex-shrink: 0;
  width: 180px;
  padding: 16px 12px 16px 0;
}

/* PC/デスクトップ（ワイド画面）のみ表示 */
@media (min-width: 1380px) {
  .app-sidebar-slot {
    display: block;
  }
}

.slot-container {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-placeholder {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slot-badge {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
  padding-left: 2px;
}

.slot-card {
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
}

.slot-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.slot-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.3;
}
</style>
