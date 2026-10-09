<template>
  <div class="align-editor-container">
    <!-- エディタヘッダー -->
    <div class="editor-header">
      <div class="header-left">
        <span class="indicator-dot" :class="isSource ? 'dot-source' : 'dot-target'"></span>
        <span class="header-label">{{ label }}</span>
        <span v-if="pipeCount > 0" class="pipe-count-badge">
          {|} × {{ pipeCount }}
        </span>
      </div>
      
      <div class="header-right">
        <!-- 選択範囲または全体の {|} を改行に置換するクイックボタン -->
        <button 
          v-if="pipeCount > 0"
          @click="replacePipeWithNewline"
          :title="hasSelection ? '選択範囲内の {|} を改行に置換' : 'このエディタ内のすべての {|} を改行に置換'"
          class="btn-pipe-replace"
        >
          <span>↵ {|} を改行に</span>
          <span v-if="hasSelection" class="selection-chip">選択部</span>
        </button>

        <span class="line-count-badge">
          {{ lineCount }} 行
        </span>
      </div>
    </div>

    <!-- CodeMirror マウントコンテナ -->
    <div ref="editorContainer" class="cm-wrapper"></div>
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

// CodeMirror カスタムテーマ
const customTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'rgba(255, 255, 245, 0.92)',
    backgroundColor: 'transparent',
    fontSize: '13px',
  },
  '.cm-content': {
    padding: '10px 14px',
    caretColor: '#10b981',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#10b981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    fontWeight: 'bold',
  },
  '.cm-line': {
    padding: '0 4px',
    lineHeight: '1.6',
  },
  '.cm-pipe-badge': {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '3px',
    padding: '1px 4px',
    fontWeight: 'bold',
    fontSize: '11px',
  },
  '.cm-slash-badge': {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '3px',
    padding: '1px 4px',
    fontWeight: 'bold',
    fontSize: '11px',
  }
});

const customKeymap = keymap.of([
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
  {
    key: 'Ctrl-ArrowUp',
    mac: 'Cmd-ArrowUp',
    run: () => {
      emit('navigate-vertical', 'up');
      return true;
    }
  },
  {
    key: 'Ctrl-ArrowDown',
    mac: 'Cmd-ArrowDown',
    run: () => {
      emit('navigate-vertical', 'down');
      return true;
    }
  },
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

function focus(position: 'start' | 'end' = 'start') {
  if (!view) return;
  view.focus();
  const pos = position === 'start' ? 0 : view.state.doc.length;
  view.dispatch({
    selection: { anchor: pos, head: pos },
    scrollIntoView: true,
  });
}

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

<style scoped>
.align-editor-container {
  position: relative;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-input);
  display: flex;
  flex-direction: column;
  transition: border-color var(--transition);
}

.align-editor-container:focus-within {
  border-color: var(--accent);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
  user-select: none;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-source {
  background: #06b6d4;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
}

.dot-target {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.header-label {
  font-weight: 600;
  color: var(--text-primary);
}

.pipe-count-badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.btn-pipe-replace {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  cursor: pointer;
  transition: all var(--transition);
}

.btn-pipe-replace:hover {
  background: rgba(245, 158, 11, 0.25);
}

.selection-chip {
  font-size: 0.6rem;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(245, 158, 11, 0.3);
}

.line-count-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-family: monospace;
}

.cm-wrapper {
  flex: 1;
  min-height: 100px;
  cursor: text;
}
</style>

<style>
.cm-wrapper .cm-editor {
  outline: none !important;
  height: 100%;
}
</style>
