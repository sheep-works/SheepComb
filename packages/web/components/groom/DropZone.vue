<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
    <div class="bg-[#161822] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- モーダルヘッダー -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#1a1d2e]">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">📂</span>
          <h3 class="font-bold text-base text-white/90">ファイルまたはテキストの読み込み</h3>
        </div>
        <button 
          v-if="canClose" 
          @click="$emit('close')" 
          class="text-white/40 hover:text-white/90 text-lg p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- モーダルボディ -->
      <div class="p-6 space-y-6">
        <!-- ファイルドロップエリア -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3"
          :class="isDragging 
            ? 'border-teal-400 bg-teal-500/10' 
            : 'border-white/15 hover:border-teal-500/50 bg-[#141621] hover:bg-[#1a1d2e]'"
          @click="fileInput?.click()"
        >
          <input 
            ref="fileInput" 
            type="file" 
            accept=".xlsx,.xls,.tsv,.csv,.txt" 
            class="hidden" 
            @change="handleFileSelect" 
          />
          <div class="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl shadow-inner">
            📊
          </div>
          <div>
            <p class="text-sm font-semibold text-white/90">
              Excelファイル（Files.xlsx など）や TSV をドラッグ＆ドロップ
            </p>
            <p class="text-xs text-white/40 mt-1">またはクリックしてファイルを選択</p>
          </div>
        </div>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-white/[0.08]"></div>
          <span class="flex-shrink mx-4 text-xs text-white/30 uppercase tracking-wider font-mono">OR 直接ペースト</span>
          <div class="flex-grow border-t border-white/[0.08]"></div>
        </div>

        <!-- テキストペーストエリア -->
        <div>
          <textarea 
            v-model="pastedText"
            placeholder="ここにTSVデータやマーカー付きテキスト（# または _@§_）を直接貼り付け..."
            class="w-full h-28 bg-[#141621] border border-white/10 rounded-xl p-3 text-xs font-mono text-white/80 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none shadow-inner placeholder:text-white/30"
          ></textarea>
        </div>
      </div>

      <!-- モーダルフッター -->
      <div class="flex items-center justify-end space-x-3 px-6 py-4 border-t border-white/[0.08] bg-[#1a1d2e]">
        <button 
          v-if="canClose" 
          @click="$emit('close')"
          class="px-4 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors"
        >
          キャンセル
        </button>
        <button 
          @click="handlePasteSubmit"
          :disabled="!pastedText.trim()"
          class="px-5 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-teal-900/30 transition-all"
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
