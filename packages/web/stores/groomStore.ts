import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SheetData, AlignBlock } from '~/types/groom';

export const useGroomStore = defineStore('groom', () => {
  const currentView = ref<'pairing' | 'editor'>('pairing');
  const sheets = ref<SheetData[]>([]);
  const activeSheetIndex = ref<number>(0);
  const filterOnlyUnmatch = ref<boolean>(false);
  const searchQuery = ref<string>('');

  const currentSheet = computed(() => {
    return sheets.value[activeSheetIndex.value] || { sheetName: '', blocks: [] };
  });

  const currentBlocks = computed(() => {
    return currentSheet.value.blocks;
  });

  const matchCount = computed(() => {
    return currentBlocks.value.filter(b => {
      const s = b.sourceText ? b.sourceText.split('\n').length : 0;
      const t = b.targetText ? b.targetText.split('\n').length : 0;
      return s === t;
    }).length;
  });

  const unmatchCount = computed(() => {
    return currentBlocks.value.length - matchCount.value;
  });

  const filteredBlocks = computed(() => {
    return currentBlocks.value.filter(b => {
      if (filterOnlyUnmatch.value) {
        const s = b.sourceText ? b.sourceText.split('\n').length : 0;
        const t = b.targetText ? b.targetText.split('\n').length : 0;
        if (s === t) return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        const matched = b.sectionName.toLowerCase().includes(q) ||
          b.sourceText.toLowerCase().includes(q) ||
          b.targetText.toLowerCase().includes(q);
        if (!matched) return false;
      }
      return true;
    });
  });

  function setSheets(newSheets: SheetData[]) {
    sheets.value = newSheets;
    activeSheetIndex.value = 0;
    currentView.value = 'editor';
  }

  function clear() {
    sheets.value = [];
    activeSheetIndex.value = 0;
    currentView.value = 'pairing';
    filterOnlyUnmatch.value = false;
    searchQuery.value = '';
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && /groom|sheep-groom|sheepgroom/i.test(key)) {
          localStorage.removeItem(key);
        }
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && /groom|sheep-groom|sheepgroom/i.test(key)) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    currentView,
    sheets,
    activeSheetIndex,
    filterOnlyUnmatch,
    searchQuery,
    currentSheet,
    currentBlocks,
    matchCount,
    unmatchCount,
    filteredBlocks,
    setSheets,
    clear,
  };
});
