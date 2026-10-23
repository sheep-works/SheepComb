<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      
      <!-- モーダルヘッダー -->
      <div class="modal-header">
        <div class="header-title">
          <span class="header-icon">↵</span>
          <div>
            <h3>次の後で改行（文分割）</h3>
            <p class="header-desc">指定した文字の直後に改行を挿入して、文や節単位に分割します</p>
          </div>
        </div>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <!-- モーダルボディ -->
      <div class="modal-body">
        <!-- 1. 区切り文字入力 -->
        <div class="form-group">
          <label class="form-label">
            区切り文字（正規表現の <code>[ ]</code> に入る文字）
          </label>
          <div class="input-bracket-wrapper">
            <span class="bracket-prefix">[</span>
            <input 
              v-model="chars" 
              type="text" 
              placeholder="例: 。！？ または .!?" 
              class="input-chars"
            />
            <span class="bracket-suffix">]</span>
          </div>

          <!-- クイックプリセット -->
          <div class="presets-row">
            <span class="presets-label">プリセット:</span>
            <button 
              type="button"
              @click="chars = '。！？'"
              class="btn-preset"
            >
              [。！？] 日本語
            </button>
            <button 
              type="button"
              @click="chars = '.!?'"
              class="btn-preset"
            >
              [.!?] 英語
            </button>
            <button 
              type="button"
              @click="chars = '。！？.!?'"
              class="btn-preset"
            >
              [。！？.!?] 日英両用
            </button>
            <button 
              type="button"
              @click="chars = '、，,'"
              class="btn-preset"
            >
              [、，,] 読点
            </button>
          </div>
        </div>

        <!-- 2. 適用対象の列 (サイド) -->
        <div class="form-group">
          <label class="form-label">適用する列</label>
          <div class="side-selector-grid">
            <button 
              type="button"
              @click="targetSide = 'all'"
              :class="['btn-side', { 'side-active': targetSide === 'all' }]"
            >
              <span class="side-title">両方</span>
              <span class="side-sub">原文 ＆ 訳文</span>
            </button>
            <button 
              type="button"
              @click="targetSide = 'source'"
              :class="['btn-side', { 'side-active': targetSide === 'source' }]"
            >
              <span class="side-title">原文のみ</span>
              <span class="side-sub">Source</span>
            </button>
            <button 
              type="button"
              @click="targetSide = 'target'"
              :class="['btn-side', { 'side-active': targetSide === 'target' }]"
            >
              <span class="side-title">訳文のみ</span>
              <span class="side-sub">Target</span>
            </button>
          </div>
        </div>

        <!-- 3. 適用範囲 (ブロック) -->
        <div class="form-group">
          <label class="form-label">適用するブロック</label>
          <div class="scope-options">
            <label class="radio-label">
              <input 
                v-model="targetScope" 
                type="radio" 
                value="all" 
              />
              <span>全ブロック ({{ totalBlocks }} 件)</span>
            </label>
            <label 
              v-if="unmatchCount > 0"
              class="radio-label"
            >
              <input 
                v-model="targetScope" 
                type="radio" 
                value="unmatched" 
              />
              <span class="unmatch-text">⚠️ 不一致ブロックのみ ({{ unmatchCount }} 件)</span>
            </label>
          </div>
        </div>

        <!-- 4. オプション -->
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="trimSpaces" 
              type="checkbox" 
            />
            <span>直後の空白文字（半角/全角スペース・タブ）を除去して改行</span>
          </label>
        </div>

        <!-- 5. リアルタイムプレビュー -->
        <div class="preview-box">
          <span class="preview-title">分割プレビュー:</span>
          <div class="preview-content">
            <div class="preview-input">入力: {{ sampleText }}</div>
            <div class="preview-output">結果:
<span class="preview-highlight">{{ previewResult }}</span></div>
          </div>
        </div>

      </div>

      <!-- モーダルフッター -->
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-cancel">
          キャンセル
        </button>
        <button 
          @click="handleApply"
          :disabled="!chars"
          class="btn-apply"
        >
          <span>↵ 実行する</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { splitTextAfterChars } from '~/utils/groomParser';

const props = defineProps<{
  totalBlocks: number;
  unmatchCount: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', payload: {
    chars: string;
    targetSide: 'all' | 'source' | 'target';
    targetScope: 'all' | 'unmatched';
    trimSpaces: boolean;
  }): void;
}>();

const chars = ref('。！？');
const targetSide = ref<'all' | 'source' | 'target'>('all');
const targetScope = ref<'all' | 'unmatched'>('all');
const trimSpaces = ref(true);

const sampleText = computed(() => {
  if (chars.value.includes('.') || chars.value.includes('!') || chars.value.includes('?')) {
    return 'Hello! How are you? I am fine. Thanks.';
  }
  return '吾輩は猫である。名前はまだ無い！どこで生れたかとんと見当がつかぬ？';
});

const previewResult = computed(() => {
  return splitTextAfterChars(sampleText.value, chars.value, trimSpaces.value);
});

function handleApply() {
  if (!chars.value) return;
  emit('apply', {
    chars: chars.value,
    targetSide: targetSide.value,
    targetScope: targetScope.value,
    trimSpaces: trimSpaces.value,
  });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.modal-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 1.3rem;
}

.header-title h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.header-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  transition: all var(--transition);
}

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 0.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.78rem;
}

.form-label code {
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--bg-input);
  color: #2dd4bf;
  font-family: monospace;
}

.input-bracket-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.bracket-prefix, .bracket-suffix {
  position: absolute;
  font-family: monospace;
  font-size: 1rem;
  color: var(--text-muted);
}

.bracket-prefix {
  left: 10px;
}

.bracket-suffix {
  right: 10px;
}

.input-chars {
  width: 100%;
  padding: 8px 24px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  font-family: monospace;
  font-size: 0.9rem;
  outline: none;
  transition: border-color var(--transition);
}

.input-chars:focus {
  border-color: var(--accent);
}

.presets-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.presets-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.btn-preset {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  cursor: pointer;
  font-family: monospace;
  transition: all var(--transition);
}

.btn-preset:hover {
  background: var(--bg-input);
  color: var(--text-primary);
  border-color: var(--accent);
}

.side-selector-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.btn-side {
  padding: 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-side:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-side.side-active {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: #10b981;
}

.side-title {
  font-weight: 600;
  font-size: 0.78rem;
}

.side-sub {
  font-size: 0.65rem;
  opacity: 0.7;
}

.scope-options {
  display: flex;
  align-items: center;
  gap: 16px;
}

.radio-label, .checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  user-select: none;
}

.radio-label:hover, .checkbox-label:hover {
  color: var(--text-primary);
}

.unmatch-text {
  color: #fbbf24;
}

.preview-box {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
}

.preview-content {
  font-family: monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-input {
  color: var(--text-muted);
}

.preview-output {
  color: #34d399;
  white-space: pre-wrap;
}

.preview-highlight {
  color: #6ee7b7;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-input);
  border-top: 1px solid var(--border);
}

.btn-cancel {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 8px 14px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition);
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-apply {
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--transition);
}

.btn-apply:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-apply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
