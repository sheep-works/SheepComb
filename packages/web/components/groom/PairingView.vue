<template>
  <div class="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
    
    <!-- ヘッダー -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-1 shadow-sm">
        <span>🐑 SheepGroom</span>
        <span class="text-white/20">|</span>
        <span>対訳作成 & アライメント支援</span>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-white">
        ファイルペアリング & アライン
      </h1>
      <p class="text-sm text-white/50 max-w-xl mx-auto">
        原文ファイルと訳文ファイルをマッチングし、一括で対訳エディタへ展開します。Excel (.xlsx) や TSV、テキストを直接読み込んで整列・校正できます。
      </p>
    </div>

    <!-- メインカード: ペアリングテーブル -->
    <div class="bg-[#161822] border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      
      <!-- カード上部ツールバー -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">📋</span>
          <div>
            <h2 class="font-bold text-base text-white/90">ファイル対応テーブル</h2>
            <p class="text-xs text-white/40">左右のファイルが正しくペアになっているか確認・調整してください</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-xs">
          <!-- 複数ファイル一括選択 -->
          <label class="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all font-medium flex items-center gap-1.5 shadow-sm cursor-pointer">
            <span>📂 ファイル一括読込</span>
            <input 
              type="file" 
              multiple 
              class="hidden" 
              accept=".xlsx,.xls,.tsv,.csv,.txt,.docx,.pptx"
              @change="handleBatchFileSelect"
            />
          </label>

          <!-- 新規ペア行追加 -->
          <button 
            @click="addPairRow"
            class="px-3 py-1.5 rounded-xl bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 border border-white/10 hover:border-white/20 transition-all font-medium flex items-center gap-1.5 shadow-sm"
          >
            <span>➕ ペア行を追加</span>
          </button>
        </div>
      </div>

      <!-- ペアリングテーブル -->
      <div class="w-full overflow-hidden">
        <table class="w-full table-fixed text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/10 pb-2">
              <th class="py-2.5 px-2 w-12 text-center">No</th>
              <th class="py-2.5 px-3 w-[calc(50%-36px)] text-cyan-400">📄 原文ファイル (Source)</th>
              <th class="py-2.5 px-3 w-[calc(50%-36px)] text-teal-400">🌐 訳文ファイル (Target)</th>
              <th class="py-2.5 px-2 w-12 text-center">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.05] text-xs">
            <tr 
              v-for="(pair, idx) in pairs" 
              :key="pair.id"
              class="hover:bg-white/[0.02] transition-colors group"
            >
              <!-- 行番号 -->
              <td class="py-3 px-2 text-center font-mono text-white/40 font-bold align-top pt-5">
                #{{ idx + 1 }}
              </td>

              <!-- 原文ファイル列 -->
              <td class="py-3 px-3 align-top">
                <div class="flex items-start space-x-2">
                  <div class="flex-1 min-w-0 bg-[#141621] p-3 rounded-xl border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                    <p class="font-mono text-xs text-white/90 font-semibold break-all leading-relaxed" :title="pair.srcPath">
                      {{ getFileName(pair.srcPath) || '（未選択）' }}
                    </p>
                    <p v-if="pair.srcFile" class="text-[10px] text-teal-400/80 mt-1">
                      {{ (pair.srcFile.size / 1024).toFixed(1) }} KB
                    </p>
                  </div>
                  <label class="p-2.5 bg-[#1a1d2e] hover:bg-[#252a3a] text-cyan-300 text-xs rounded-xl border border-white/10 hover:border-cyan-500/40 shrink-0 transition-colors mt-0.5 shadow-sm cursor-pointer" title="ファイルを選択">
                    📂
                    <input type="file" class="hidden" accept=".xlsx,.xls,.tsv,.csv,.txt" @change="(e) => onSingleFileSelect(e, idx, 'src')" />
                  </label>
                </div>
              </td>

              <!-- 訳文ファイル列 -->
              <td class="py-3 px-3 align-top">
                <div class="flex items-start space-x-2">
                  <div class="flex-1 min-w-0 bg-[#141621] p-3 rounded-xl border border-white/5 group-hover:border-teal-500/30 transition-colors">
                    <p class="font-mono text-xs text-white/90 font-semibold break-all leading-relaxed" :title="pair.tgtPath">
                      {{ getFileName(pair.tgtPath) || '（未選択）' }}
                    </p>
                    <p v-if="pair.tgtFile" class="text-[10px] text-teal-400/80 mt-1">
                      {{ (pair.tgtFile.size / 1024).toFixed(1) }} KB
                    </p>
                  </div>
                  <label class="p-2.5 bg-[#1a1d2e] hover:bg-[#252a3a] text-teal-300 text-xs rounded-xl border border-white/10 hover:border-teal-500/40 shrink-0 transition-colors mt-0.5 shadow-sm cursor-pointer" title="ファイルを選択">
                    📂
                    <input type="file" class="hidden" accept=".xlsx,.xls,.tsv,.csv,.txt" @change="(e) => onSingleFileSelect(e, idx, 'tgt')" />
                  </label>
                </div>
              </td>

              <!-- 操作列 -->
              <td class="py-3 px-2 text-center align-top pt-4">
                <button 
                  v-if="pairs.length > 1"
                  @click="removePairRow(idx)"
                  class="text-white/30 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="このペア行を削除"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- アクションボタンエリア -->
      <div class="flex flex-col items-center justify-center pt-4 space-y-2">
        <button 
          @click="startAllAlign"
          :disabled="!validPairsCount || isLoading"
          class="w-full md:w-auto px-10 py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-xl shadow-teal-900/40 transition-all flex items-center justify-center gap-2.5"
        >
          <span v-if="isLoading" class="animate-spin text-base">⏳</span>
          <span v-else>⚡</span>
          <span>{{ isLoading ? '対訳を展開中...' : `全 ${validPairsCount} ペアをアラインエディタへ展開` }}</span>
        </button>
        <span v-if="validPairsCount < pairs.length" class="text-[11px] text-amber-400/80">
          ⚠️ 未設定のペア行があります (有効なペアのみ展開されます)
        </span>
      </div>

    </div>

    <!-- サブカード: 既存の Files.xlsx / TSV を開く -->
    <div class="bg-[#161822]/60 border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <span class="text-lg">📊</span>
          <h3 class="font-bold text-sm text-white/90">既存の Excel (Files.xlsx) や TSV を開く</h3>
        </div>
        <p class="text-xs text-white/40">
          過去に出力した Files.xlsx やクリップボードのテキストをそのまま読み込んで微調整します。
        </p>
      </div>
      <button 
        @click="$emit('open-importer')"
        class="px-4 py-2 bg-[#1a1d2e] hover:bg-[#252a3a] text-white/90 text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-sm"
      >
        📂 ファイル / テキスト読込
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SheetData, FilePair } from '~/types/groom';
import { parseXlsx, parseTsvOrText } from '~/utils/groomParser';

const emit = defineEmits<{
  (e: 'start-align', sheets: SheetData[]): void;
  (e: 'open-importer'): void;
  (e: 'show-toast', message: string): void;
}>();

const pairs = ref<FilePair[]>([
  { id: 'pair-1', srcPath: '', tgtPath: '' }
]);

const isLoading = ref(false);

const validPairsCount = computed(() => {
  return pairs.value.filter(p => !!p.srcPath && !!p.tgtPath).length;
});

function getFileName(p: string): string {
  if (!p) return '';
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1];
}

function addPairRow() {
  pairs.value.push({
    id: `pair-${Date.now()}-${pairs.value.length + 1}`,
    srcPath: '',
    tgtPath: ''
  });
}

function removePairRow(index: number) {
  pairs.value.splice(index, 1);
}

function onSingleFileSelect(e: Event, index: number, side: 'src' | 'tgt') {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (side === 'src') {
    pairs.value[index].srcPath = file.name;
    pairs.value[index].srcFile = file;
  } else {
    pairs.value[index].tgtPath = file.name;
    pairs.value[index].tgtFile = file;
  }
}

function handleBatchFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const fileList = Array.from(input.files);

  if (fileList.length === 1 && fileList[0].name.endsWith('.xlsx')) {
    // 単一 Excel ファイルの場合は直接パースしてアラインへ
    fileList[0].arrayBuffer().then(buf => {
      parseXlsx(buf).then(sheets => {
        if (sheets.length > 0) {
          emit('start-align', sheets);
          emit('show-toast', `📊 ${sheets.length} シートを読み込みました`);
        }
      });
    });
    return;
  }

  // 複数ファイルを自動ペアリング
  const newPairs: FilePair[] = [];
  const srcCandidates = fileList.filter(f => /(_ja|-ja|ja_|_jp|-jp)/i.test(f.name) || !/(_en|-en|en_|_zh|-zh)/i.test(f.name));
  const tgtCandidates = fileList.filter(f => /(_en|-en|en_|_zh|-zh)/i.test(f.name));

  if (srcCandidates.length > 0 && tgtCandidates.length > 0) {
    srcCandidates.forEach((sf, i) => {
      const tf = tgtCandidates[i] || null;
      newPairs.push({
        id: `pair-${Date.now()}-${i}`,
        srcPath: sf.name,
        tgtPath: tf ? tf.name : '',
        srcFile: sf,
        tgtFile: tf || undefined
      });
    });
  } else {
    for (let i = 0; i < fileList.length; i += 2) {
      newPairs.push({
        id: `pair-${Date.now()}-${i}`,
        srcPath: fileList[i]?.name || '',
        tgtPath: fileList[i + 1]?.name || '',
        srcFile: fileList[i],
        tgtFile: fileList[i + 1]
      });
    }
  }

  if (newPairs.length > 0) {
    pairs.value = newPairs;
    emit('show-toast', `✨ ${newPairs.length} 件のペア候補を読み込みました`);
  }
}

async function startAllAlign() {
  const validPairs = pairs.value.filter(p => !!p.srcPath && !!p.tgtPath);
  if (validPairs.length === 0) return;

  isLoading.value = true;
  try {
    const sheets: SheetData[] = [];

    for (let idx = 0; idx < validPairs.length; idx++) {
      const pair = validPairs[idx];
      const sheetName = `Pair ${idx + 1}`;

      let srcText = '';
      let tgtText = '';

      if (pair.srcFile) {
        srcText = await pair.srcFile.text();
      }
      if (pair.tgtFile) {
        tgtText = await pair.tgtFile.text();
      }

      // テキスト・TSVとしてパース
      const srcLines = srcText ? srcText.split(/\r?\n/) : [];
      const tgtLines = tgtText ? tgtText.split(/\r?\n/) : [];
      const maxLen = Math.max(srcLines.length, tgtLines.length, 1);

      const blocks = [{
        id: `block-${Date.now()}-${idx}`,
        sectionName: pair.srcPath ? getFileName(pair.srcPath) : `Block 1`,
        sourceText: srcLines.join('\n'),
        targetText: tgtLines.join('\n'),
      }];

      sheets.push({
        sheetName,
        blocks
      });
    }

    if (sheets.length > 0) {
      emit('start-align', sheets);
      emit('show-toast', `⚡ ${sheets.length} 件のペアを展開しました`);
    }
  } catch (err: any) {
    console.error(err);
    emit('show-toast', `❌ エラー: ${err.message || err}`);
  } finally {
    isLoading.value = false;
  }
}
</script>
