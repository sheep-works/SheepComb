<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
    <!-- モーダル本体 -->
    <div 
      class="bg-[#161822] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white/90"
      @click.stop
    >
      <!-- ヘッダー -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">↵</span>
          <div>
            <h3 class="font-bold text-sm text-white/90">次の後で改行（文分割）</h3>
            <p class="text-[11px] text-white/50">指定した文字の直後に改行を挿入して、文や節単位に分割します</p>
          </div>
        </div>
        <button 
          @click="$emit('close')"
          class="text-white/40 hover:text-white/90 text-sm p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- ボディ -->
      <div class="p-5 space-y-4 text-xs">
        <!-- 1. 区切り文字入力 -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-white/80">
            区切り文字（正規表現の <code class="px-1 py-0.5 rounded bg-[#1a1d2e] text-teal-300 font-mono text-[11px]">[ ]</code> に入る文字）
          </label>
          <div class="flex items-center space-x-2">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono">[</span>
              <input 
                v-model="chars" 
                type="text" 
                placeholder="例: 。！？ または .!?" 
                class="w-full bg-[#141621] border border-white/10 focus:border-teal-500 rounded-xl pl-6 pr-6 py-2 text-white/90 font-mono text-sm focus:outline-none transition-colors"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 font-mono">]</span>
            </div>
          </div>

          <!-- クイックプリセット -->
          <div class="flex items-center flex-wrap gap-1.5 pt-1">
            <span class="text-[11px] text-white/40 mr-1">プリセット:</span>
            <button 
              type="button"
              @click="chars = '。！？'"
              class="px-2 py-0.5 rounded bg-[#1a1d2e] hover:bg-[#252a3a] text-white/70 hover:text-white border border-white/10 text-[11px] font-mono transition-colors"
            >
              [。！？] 日本語
            </button>
            <button 
              type="button"
              @click="chars = '.!?'"
              class="px-2 py-0.5 rounded bg-[#1a1d2e] hover:bg-[#252a3a] text-white/70 hover:text-white border border-white/10 text-[11px] font-mono transition-colors"
            >
              [.!?] 英語
            </button>
            <button 
              type="button"
              @click="chars = '。！？.!?'"
              class="px-2 py-0.5 rounded bg-[#1a1d2e] hover:bg-[#252a3a] text-white/70 hover:text-white border border-white/10 text-[11px] font-mono transition-colors"
            >
              [。！？.!?] 日英両用
            </button>
            <button 
              type="button"
              @click="chars = '、，,'"
              class="px-2 py-0.5 rounded bg-[#1a1d2e] hover:bg-[#252a3a] text-white/70 hover:text-white border border-white/10 text-[11px] font-mono transition-colors"
            >
              [、，,] 読点
            </button>
          </div>
        </div>

        <!-- 2. 適用対象の列 (サイド) -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-white/80">適用する列</label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              type="button"
              @click="targetSide = 'all'"
              :class="targetSide === 'all' 
                ? 'bg-teal-600/30 text-teal-200 border-teal-500/60 shadow-sm' 
                : 'bg-[#141621] text-white/60 border-white/10 hover:text-white/90 hover:bg-[#1a1d2e]'"
              class="px-3 py-2 rounded-xl border text-center transition-colors font-medium flex flex-col items-center gap-0.5"
            >
              <span>両方</span>
              <span class="text-[10px] opacity-60">原文 ＆ 訳文</span>
            </button>
            <button 
              type="button"
              @click="targetSide = 'source'"
              :class="targetSide === 'source' 
                ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/60 shadow-sm' 
                : 'bg-[#141621] text-white/60 border-white/10 hover:text-white/90 hover:bg-[#1a1d2e]'"
              class="px-3 py-2 rounded-xl border text-center transition-colors font-medium flex flex-col items-center gap-0.5"
            >
              <span>原文のみ</span>
              <span class="text-[10px] opacity-60">Source</span>
            </button>
            <button 
              type="button"
              @click="targetSide = 'target'"
              :class="targetSide === 'target' 
                ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 shadow-sm' 
                : 'bg-[#141621] text-white/60 border-white/10 hover:text-white/90 hover:bg-[#1a1d2e]'"
              class="px-3 py-2 rounded-xl border text-center transition-colors font-medium flex flex-col items-center gap-0.5"
            >
              <span>訳文のみ</span>
              <span class="text-[10px] opacity-60">Target</span>
            </button>
          </div>
        </div>

        <!-- 3. 適用範囲 (ブロック) -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-white/80">適用するブロック</label>
          <div class="flex items-center space-x-3">
            <label class="flex items-center space-x-2 cursor-pointer text-white/70 hover:text-white">
              <input 
                v-model="targetScope" 
                type="radio" 
                value="all" 
                class="accent-teal-500" 
              />
              <span>全ブロック ({{ totalBlocks }} 件)</span>
            </label>
            <label 
              v-if="unmatchCount > 0"
              class="flex items-center space-x-2 cursor-pointer text-white/70 hover:text-white"
            >
              <input 
                v-model="targetScope" 
                type="radio" 
                value="unmatched" 
                class="accent-teal-500" 
              />
              <span class="text-amber-300">⚠️ 不一致ブロックのみ ({{ unmatchCount }} 件)</span>
            </label>
          </div>
        </div>

        <!-- 4. オプション -->
        <div class="space-y-1 pt-1">
          <label class="flex items-center space-x-2 cursor-pointer text-white/70 hover:text-white select-none">
            <input 
              v-model="trimSpaces" 
              type="checkbox" 
              class="accent-teal-500 rounded" 
            />
            <span>直後の空白文字（半角/全角スペース・タブ）を除去して改行</span>
          </label>
        </div>

        <!-- 5. リアルタイムプレビュー -->
        <div class="space-y-1.5 pt-2 border-t border-white/[0.08]">
          <span class="text-[11px] font-semibold text-white/50">分割プレビュー:</span>
          <div class="p-2.5 rounded-xl bg-[#141621] border border-white/5 space-y-1 text-[11px] font-mono leading-relaxed">
            <div class="text-white/40">入力: <span class="text-white/70">{{ sampleText }}</span></div>
            <div class="text-teal-400/90 whitespace-pre-wrap">結果:
<span class="text-teal-200">{{ previewResult }}</span></div>
          </div>
        </div>

      </div>

      <!-- フッター -->
      <div class="flex items-center justify-between px-5 py-3.5 bg-[#141621] border-t border-white/[0.08]">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
        >
          キャンセル
        </button>
        <button 
          @click="handleApply"
          :disabled="!chars"
          :class="chars 
            ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/40 shadow-md' 
            : 'bg-white/10 text-white/30 cursor-not-allowed'"
          class="px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
        >
          <span>↵ 実行する</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { splitTextAfterChars } from '../utils/parser';

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
