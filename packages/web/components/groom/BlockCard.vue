<template>
  <div 
    class="block-card"
    :class="{ 'block-unmatch': !isMatched }"
  >
    <!-- カードヘッダー -->
    <div class="card-header-bar">
      <div class="header-left">
        <span class="block-index-badge">#{{ index + 1 }}</span>
        <input 
          v-model="block.sectionName" 
          class="section-input"
          placeholder="セクション名"
        />
        <!-- 一致状態バッジ -->
        <span 
          class="match-badge"
          :class="isMatched ? 'badge-matched' : 'badge-unmatched'"
        >
          <span class="badge-dot"></span>
          {{ srcCount }}行 / {{ tgtCount }}行 
          <span v-if="!isMatched" class="diff-text">({{ diffText }})</span>
        </span>
      </div>

      <!-- アクションボタン群 -->
      <div class="header-actions">
        <!-- {|} を改行に一括置換 -->
        <button 
          v-if="hasPipes"
          @click="replaceAllPipes"
          title="このブロック内の左右すべての {|} を改行に置換します"
          class="action-btn btn-pipe"
        >
          ↵ {|} を改行に
        </button>

        <!-- パディング (行数合わせ) -->
        <button 
          v-if="!isMatched"
          @click="padLines"
          title="行数が少ない側の末尾に空行を追加して行数を揃えます"
          class="action-btn btn-pad"
        >
          🧹 揃える
        </button>

        <!-- 下のブロックと結合 -->
        <button 
          v-if="hasNext"
          @click="emit('merge-with-next', index)"
          title="下のブロックと合体します"
          class="action-btn btn-merge"
        >
          🔗 下と合体
        </button>

        <!-- 削除 -->
        <button 
          @click="emit('remove-block', index)"
          title="このブロックを削除"
          class="action-btn btn-delete"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- 左右エディタグリッド -->
    <div class="editor-grid">
      <AlignEditor 
        ref="srcEditorRef"
        v-model="block.sourceText" 
        label="原文 (Source)" 
        :is-source="true"
        @push-down="(remaining, pushed) => emit('push-down', index, 'source', remaining, pushed)"
        @toggle-side="focusTarget"
        @navigate-vertical="(dir) => emit('navigate-editor', index, 'source', dir)"
      />
      <AlignEditor 
        ref="tgtEditorRef"
        v-model="block.targetText" 
        label="訳文 (Target)" 
        :is-source="false"
        @push-down="(remaining, pushed) => emit('push-down', index, 'target', remaining, pushed)"
        @toggle-side="focusSource"
        @navigate-vertical="(dir) => emit('navigate-editor', index, 'target', dir)"
      />
    </div>

    <!-- ショートカット案内フッター -->
    <div class="card-footer">
      <div class="shortcuts-guide">
        <span><kbd>Tab</kbd> 左右切替</span>
        <span><kbd>Ctrl+↑/↓</kbd> 前後ブロック移動</span>
        <span><kbd>Ctrl+Shift+Enter</kbd> 次ブロックへ送る</span>
      </div>
      <span v-if="!isMatched" class="unmatch-warning">⚠️ 左右の行数が不一致です</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AlignBlock } from '~/types/groom';
import AlignEditor from './AlignEditor.vue';

const props = defineProps<{
  block: AlignBlock;
  index: number;
  hasNext: boolean;
}>();

const emit = defineEmits<{
  (e: 'merge-with-next', index: number): void;
  (e: 'remove-block', index: number): void;
  (e: 'push-down', index: number, side: 'source' | 'target', remainingText: string, pushedText: string): void;
  (e: 'navigate-editor', index: number, side: 'source' | 'target', direction: 'up' | 'down'): void;
}>();

const srcEditorRef = ref<InstanceType<typeof AlignEditor> | null>(null);
const tgtEditorRef = ref<InstanceType<typeof AlignEditor> | null>(null);

const srcLines = computed(() => props.block.sourceText ? props.block.sourceText.split('\n') : []);
const tgtLines = computed(() => props.block.targetText ? props.block.targetText.split('\n') : []);

const srcCount = computed(() => srcLines.value.length);
const tgtCount = computed(() => tgtLines.value.length);
const isMatched = computed(() => srcCount.value === tgtCount.value);

const hasPipes = computed(() => {
  return (props.block.sourceText && props.block.sourceText.includes('{|}')) ||
         (props.block.targetText && props.block.targetText.includes('{|}'));
});

const diffText = computed(() => {
  if (srcCount.value > tgtCount.value) {
    return `+${srcCount.value - tgtCount.value} 原文`;
  } else {
    return `+${tgtCount.value - srcCount.value} 訳文`;
  }
});

function focusSource(pos: 'start' | 'end' = 'start') {
  srcEditorRef.value?.focus(pos);
}

function focusTarget(pos: 'start' | 'end' = 'start') {
  tgtEditorRef.value?.focus(pos);
}

function focusSide(side: 'source' | 'target', pos: 'start' | 'end' = 'start') {
  if (side === 'source') focusSource(pos);
  else focusTarget(pos);
}

defineExpose({
  focusSource,
  focusTarget,
  focusSide,
});

function padLines() {
  const max = Math.max(srcCount.value, tgtCount.value);
  const src = [...srcLines.value];
  const tgt = [...tgtLines.value];

  while (src.length < max) src.push('');
  while (tgt.length < max) tgt.push('');

  props.block.sourceText = src.join('\n');
  props.block.targetText = tgt.join('\n');
}

function replaceAllPipes() {
  if (props.block.sourceText) {
    props.block.sourceText = props.block.sourceText.replace(/\{\|\}/g, '\n');
  }
  if (props.block.targetText) {
    props.block.targetText = props.block.targetText.replace(/\{\|\}/g, '\n');
  }
}
</script>

<style scoped>
.block-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-md);
  transition: all var(--transition);
}

.block-card:hover {
  border-color: var(--border-hover);
}

.block-card.block-unmatch {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.03);
}

.block-card.block-unmatch:hover {
  border-color: rgba(245, 158, 11, 0.6);
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.block-index-badge {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  border: 1px solid rgba(20, 184, 166, 0.3);
}

.section-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 2px 6px;
  max-width: 200px;
  transition: border-color var(--transition);
}

.section-input:hover {
  border-bottom-color: var(--border-hover);
}

.section-input:focus {
  outline: none;
  border-bottom-color: var(--accent);
}

.match-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-matched {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-matched .badge-dot {
  background: #34d399;
}

.badge-unmatched {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-unmatched .badge-dot {
  background: #fbbf24;
}

.diff-text {
  font-size: 0.68rem;
  opacity: 0.85;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}

.action-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.btn-pipe {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}

.btn-pipe:hover {
  background: rgba(245, 158, 11, 0.25);
}

.btn-pad {
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  border-color: rgba(20, 184, 166, 0.3);
}

.btn-pad:hover {
  background: rgba(20, 184, 166, 0.25);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding-top: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.shortcuts-guide {
  display: flex;
  align-items: center;
  gap: 12px;
}

kbd {
  padding: 2px 6px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  font-family: monospace;
  font-size: 0.68rem;
}

.unmatch-warning {
  color: #fbbf24;
  font-weight: 500;
}
</style>
