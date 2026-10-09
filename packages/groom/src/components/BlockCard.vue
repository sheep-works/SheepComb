<template>
  <div 
    class="bg-[#1a1d2e] border rounded-2xl p-4 shadow-xl transition-all duration-200"
    :class="isMatched ? 'border-white/[0.08] hover:border-white/[0.15]' : 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500/60'"
  >
    <!-- カードヘッダー -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-white/[0.08]">
      <div class="flex items-center space-x-3">
        <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 font-mono border border-teal-500/30 shadow-sm">
          #{{ index + 1 }}
        </span>
        <input 
          v-model="block.sectionName" 
          class="bg-transparent text-sm font-semibold text-white/90 border-b border-transparent hover:border-white/20 focus:border-teal-400 focus:outline-none px-1 transition-colors max-w-xs"
          placeholder="セクション名"
        />
        <!-- 一致状態バッジ -->
        <span 
          class="text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 transition-all shadow-sm"
          :class="isMatched 
            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25' 
            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="isMatched ? 'bg-teal-400' : 'bg-amber-400'"></span>
          {{ srcCount }}行 / {{ tgtCount }}行 
          <span v-if="!isMatched" class="text-[11px] opacity-80">
            ({{ diffText }})
          </span>
        </span>
      </div>

      <!-- アクションボタン群 -->
      <div class="flex items-center space-x-1.5 text-xs">
        <!-- {|} を改行に一括置換 -->
        <button 
          v-if="hasPipes"
          @click="replaceAllPipes"
          title="このブロック内の左右すべての {|} を改行に置換します"
          class="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1 font-medium"
        >
          ↵ {|} を改行に
        </button>

        <!-- パディング (行数合わせ) -->
        <button 
          v-if="!isMatched"
          @click="padLines"
          title="行数が少ない側の末尾に空行を追加して行数を揃えます"
          class="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/30 transition-colors flex items-center gap-1 font-medium"
        >
          🧹 揃える
        </button>

        <!-- 下のブロックと結合 -->
        <button 
          v-if="hasNext"
          @click="emit('merge-with-next', index)"
          title="下のブロックと合体します"
          class="px-2.5 py-1 rounded-lg bg-[#252a3a] hover:bg-[#2d3448] text-white/80 border border-white/10 transition-colors flex items-center gap-1 font-medium"
        >
          🔗 下と合体
        </button>

        <!-- 削除 -->
        <button 
          @click="emit('remove-block', index)"
          title="このブロックを削除"
          class="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- 左右エディタグリッド -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
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

    <!-- 💡 ショートカット案内 -->
    <div class="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-white/40 px-1 gap-2">
      <div class="flex items-center space-x-3">
        <span><kbd class="px-1 py-0.5 bg-[#141621] text-white/70 rounded border border-white/10 font-mono">Tab</kbd> 左右切替</span>
        <span><kbd class="px-1 py-0.5 bg-[#141621] text-white/70 rounded border border-white/10 font-mono">Ctrl+↑/↓</kbd> 前後ブロック移動</span>
        <span><kbd class="px-1 py-0.5 bg-[#141621] text-white/70 rounded border border-white/10 font-mono">Ctrl+Shift+Enter</kbd> 次ブロックへ送る</span>
      </div>
      <span v-if="!isMatched" class="text-amber-400/90 font-medium">⚠️ 左右の行数が不一致です</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AlignBlock } from '../types/align';
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

// パディング実行
function padLines() {
  const max = Math.max(srcCount.value, tgtCount.value);
  const src = [...srcLines.value];
  const tgt = [...tgtLines.value];

  while (src.length < max) src.push('');
  while (tgt.length < max) tgt.push('');

  props.block.sourceText = src.join('\n');
  props.block.targetText = tgt.join('\n');
}

// ブロック内の全 {|} を改行に置換
function replaceAllPipes() {
  if (props.block.sourceText) {
    props.block.sourceText = props.block.sourceText.replace(/\{\|\}/g, '\n');
  }
  if (props.block.targetText) {
    props.block.targetText = props.block.targetText.replace(/\{\|\}/g, '\n');
  }
}
</script>