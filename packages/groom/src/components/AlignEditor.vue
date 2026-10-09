<template>
  <div class="relative w-full border border-white/10 rounded-xl overflow-hidden bg-[#141621] focus-within:border-teal-500/80 transition-colors shadow-inner flex flex-col">
    <!-- エディタヘッダー -->
    <div class="flex items-center justify-between px-3.5 py-1.5 bg-[#161822] border-b border-white/[0.08] text-xs font-mono text-white/50 select-none">
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full shadow-sm" :class="isSource ? 'bg-cyan-400 shadow-cyan-500/40' : 'bg-teal-400 shadow-teal-500/40'"></span>
        <span class="font-semibold text-white/80">{{ label }}</span>
        <span v-if="pipeCount > 0" class="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans border border-amber-500/30">
          {|} × {{ pipeCount }}
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- 選択範囲または全体の {|} を改行に置換するクイックボタン -->
        <button 
          v-if="pipeCount > 0"
          @click="replacePipeWithNewline"
          :title="hasSelection ? '選択範囲内の {|} を改行に置換' : 'このエディタ内のすべての {|} を改行に置換'"
          class="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-sans transition-colors flex items-center gap-1"
        >
          <span>↵ {|} を改行に</span>
          <span v-if="hasSelection" class="text-[9px] bg-amber-400/30 px-1 rounded font-mono">選択部</span>
        </button>

        <span class="text-[11px] px-2 py-0.5 rounded bg-[#1a1d2e] text-white/60 font-mono border border-white/5">
          {{ lineCount }} 行
        </span>
      </div>
    </div>

    <!-- CodeMirror マウントコンテナ -->
    <div ref="editorContainer" class="cm-wrapper flex-1 text-sm font-mono leading-relaxed cursor-text min-h-[90px]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { 
  EditorView, 
  keymap, 
  lineNumbers, 
  highlightActiveLine, 
  highlightActiveLineGutter,
  Decoration,
  MatchDecorator,
  ViewPlugin
} from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

const props = defineProps<{
  modelValue: string;
  label: string;
  isSource?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'push-down', remainingText: string, pushedText: string): void;
  (e: 'toggle-side'): void;
  (e: 'navigate-vertical', direction: 'up' | 'down'): void;
}>();

const editorContainer = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;
let isInternalUpdate = false;
const hasSelection = ref(false);

const lineCount = computed(() => {
  if (!props.modelValue) return 0;
  return props.modelValue.split('\n').length;
});

const pipeCount = computed(() => {
  if (!props.modelValue) return 0;
  const matches = props.modelValue.match(/\{\|\}/g);
  return matches ? matches.length : 0;
});

// {|} と {/} のハイライトデコレータ
const markerDecorator = new MatchDecorator({
  regexp: /\{\|\}|\{\/\}/g,
  decoration: (match) => {
    const isPipe = match[0] === '{|}';
    return Decoration.mark({
      class: isPipe ? 'cm-pipe-badge' : 'cm-slash-badge',
    });
  }
});

const markerPlugin = ViewPlugin.fromClass(class {
  decorations: any;
  constructor(view: EditorView) {
    this.decorations = markerDecorator.createDeco(view);
  }
  update(update: any) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = markerDecorator.updateDeco(update, this.decorations);
    }
  }
}, {
  decorations: v => v.decorations
});

// CodeMirror カスタムテーマ (Teal / Emerald Dark)
const customTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'rgba(255, 255, 245, 0.92)',
    backgroundColor: 'transparent',
    fontSize: '13px',
  },
  '.cm-content': {
    padding: '10px 14px',
    caretColor: '#14b8a6',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#14b8a6',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: '#161822',
    color: 'rgba(235, 235, 245, 0.36)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    paddingRight: '6px',
    userSelect: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(20, 184, 166, 0.06)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    color: '#2dd4bf',
    fontWeight: 'bold',
  },
  '.cm-line': {
    padding: '0 4px',
    lineHeight: '1.6',
  },
  '.cm-pipe-badge': {
    backgroundColor: '#f59e0b25',
    color: '#fbbf24',
    border: '1px solid #f59e0b50',
    borderRadius: '3px',
    padding: '1px 3px',
    fontWeight: 'bold',
    fontSize: '11px',
    letterSpacing: '0.5px',
  },
  '.cm-slash-badge': {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    color: '#2dd4bf',
    border: '1px solid rgba(20, 184, 166, 0.4)',
    borderRadius: '3px',
    padding: '1px 3px',
    fontWeight: 'bold',
    fontSize: '11px',
  }
});

// ショートカットキー設定
const customKeymap = keymap.of([
  // Tabキー: 同じブロック内の左右エディタ間で往復
  {
    key: 'Tab',
    run: () => {
      emit('toggle-side');
      return true;
    }
  },
  {
    key: 'Shift-Tab',
    run: () => {
      emit('toggle-side');
      return true;
    }
  },
  // Ctrl+Up: 前のブロックのエディタへ移動
  {
    key: 'Ctrl-ArrowUp',
    mac: 'Cmd-ArrowUp',
    run: () => {
      emit('navigate-vertical', 'up');
      return true;
    }
  },
  // Ctrl+Down: 次のブロックのエディタへ移動
  {
    key: 'Ctrl-ArrowDown',
    mac: 'Cmd-ArrowDown',
    run: () => {
      emit('navigate-vertical', 'down');
      return true;
    }
  },
  // Ctrl+Shift+Enter: カーソル位置から後を次ブロックへ送る（選択範囲は削除）
  {
    key: 'Ctrl-Shift-Enter',
    mac: 'Cmd-Shift-Enter',
    run: (v) => {
      const selection = v.state.selection.main;
      const fullDoc = v.state.doc.toString();
      
      const remainingText = fullDoc.slice(0, selection.from);
      const pushedText = fullDoc.slice(selection.to);
      
      emit('push-down', remainingText, pushedText);
      return true;
    }
  }
]);

// 外部からのフォーカス用メソッド
function focus(position: 'start' | 'end' = 'start') {
  if (!view) return;
  view.focus();
  const pos = position === 'start' ? 0 : view.state.doc.length;
  view.dispatch({
    selection: { anchor: pos, head: pos },
    scrollIntoView: true,
  });
}

// {|} を改行に置換
function replacePipeWithNewline() {
  if (!view) return;
  const selection = view.state.selection.main;
  
  if (!selection.empty) {
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    const replaced = selectedText.replace(/\{\|\}/g, '\n');
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: replaced },
      userEvent: 'input.replace',
    });
  } else {
    const fullText = view.state.doc.toString();
    const replaced = fullText.replace(/\{\|\}/g, '\n');
    view.dispatch({
      changes: { from: 0, to: fullText.length, insert: replaced },
      userEvent: 'input.replace',
    });
  }
}

defineExpose({
  focus,
  replacePipeWithNewline,
});

onMounted(() => {
  if (!editorContainer.value) return;

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      EditorView.lineWrapping,
      markerPlugin,
      customTheme,
      customKeymap,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          isInternalUpdate = true;
          const newValue = update.state.doc.toString();
          emit('update:modelValue', newValue);
          setTimeout(() => {
            isInternalUpdate = false;
          }, 0);
        }
        if (update.selectionSet || update.docChanged) {
          hasSelection.value = !update.state.selection.main.empty;
        }
      }),
    ],
  });

  view = new EditorView({
    state: startState,
    parent: editorContainer.value,
  });
});

watch(() => props.modelValue, (newVal) => {
  if (view && !isInternalUpdate) {
    const currentDoc = view.state.doc.toString();
    if (newVal !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: newVal },
      });
    }
  }
});

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});
</script>

<style>
.cm-wrapper .cm-editor {
  outline: none !important;
  height: 100%;
}
</style>