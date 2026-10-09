<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      
      <!-- モーダルヘッダー -->
      <div class="modal-header">
        <div class="header-title">
          <span class="header-icon">📂</span>
          <h3>ファイルまたはテキストの読み込み</h3>
        </div>
        <button 
          v-if="canClose" 
          @click="$emit('close')" 
          class="btn-close"
        >
          ✕
        </button>
      </div>

      <!-- モーダルボディ -->
      <div class="modal-body">
        <!-- ファイルドロップエリア -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          class="drop-area"
          :class="{ 'drop-active': isDragging }"
          @click="fileInput?.click()"
        >
          <input 
            ref="fileInput" 
            type="file" 
            accept=".xlsx,.xls,.tsv,.csv,.txt" 
            class="file-input-hidden" 
            @change="handleFileSelect" 
          />
          <div class="drop-circle-icon">
            📊
          </div>
          <div class="drop-texts">
            <p class="drop-main-text">
              Excelファイル（Files.xlsx など）や TSV をドラッグ＆ドロップ
            </p>
            <p class="drop-sub-text">またはクリックしてファイルを選択</p>
          </div>
        </div>

        <div class="divider-or">
          <div class="divider-line"></div>
          <span class="divider-text">OR 直接ペースト</span>
          <div class="divider-line"></div>
        </div>

        <!-- テキストペーストエリア -->
        <div class="paste-area">
          <textarea 
            v-model="pastedText"
            placeholder="ここにTSVデータやマーカー付きテキスト（# または _@§_）を直接貼り付け..."
            class="paste-textarea"
          ></textarea>
        </div>
      </div>

      <!-- モーダルフッター -->
      <div class="modal-footer">
        <button 
          v-if="canClose" 
          @click="$emit('close')"
          class="btn-cancel"
        >
          キャンセル
        </button>
        <button 
          @click="handlePasteSubmit"
          :disabled="!pastedText.trim()"
          class="btn-submit"
        >
          テキストを読み込む
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  canClose?: boolean;
}>();

const emit = defineEmits<{
  (e: 'file-loaded', file: File): void;
  (e: 'text-loaded', text: string): void;
  (e: 'close'): void;
}>();

const isDragging = ref(false);
const pastedText = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    emit('file-loaded', files[0]);
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLSelectElement;
  const inputEl = target as unknown as HTMLInputElement;
  if (inputEl.files && inputEl.files.length > 0) {
    emit('file-loaded', inputEl.files[0]);
  }
}

function handlePasteSubmit() {
  if (pastedText.value.trim()) {
    emit('text-loaded', pastedText.value);
    pastedText.value = '';
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 100%;
  max-width: 540px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 1.25rem;
}

.header-title h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
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
}

.drop-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  background: var(--bg-input);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all var(--transition);
}

.drop-area:hover, .drop-area.drop-active {
  border-color: var(--accent);
  background: var(--accent-glow);
}

.file-input-hidden {
  display: none;
}

.drop-circle-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.drop-main-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.drop-sub-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.divider-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.divider-text {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: monospace;
}

.paste-textarea {
  width: 100%;
  height: 110px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-primary);
  resize: vertical;
  transition: border-color var(--transition);
}

.paste-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
}

.btn-cancel {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 6px 14px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: color var(--transition);
}

.btn-cancel:hover {
  color: var(--text-primary);
}

.btn-submit {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-xs);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 16px;
  cursor: pointer;
  transition: background var(--transition);
}

.btn-submit:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
