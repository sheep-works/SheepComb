import { ref } from 'vue';
import type { LqaIssue, LqaIssueReview, SaveOptions } from '~/types/bell';
import { downloadExportedFile, defaultCsvExporter, defaultJsonExporter } from '~/utils/bellExporters';

export interface ToastState {
  show: boolean;
  text: string;
  color: 'success' | 'error' | 'warning' | 'info';
}

export function useBellIssueManager() {
  const issues = ref<LqaIssueReview[]>([]);
  const folderName = ref<string>('');
  const loadedFileName = ref<string>('');
  const currentDirHandle = ref<any | null>(null);
  const mediaFilesMap = ref<Map<string, any>>(new Map());
  const mediaBlobUrlCache = ref<Map<string, string>>(new Map());
  const hasUnsavedChanges = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const loadingMessage = ref<string>('');
  const lastSavedTime = ref<string>('');

  const toast = ref<ToastState>({
    show: false,
    text: '',
    color: 'success',
  });

  const showToast = (text: string, color: ToastState['color'] = 'success') => {
    toast.value = { show: true, text, color };
    setTimeout(() => {
      if (toast.value.text === text) {
        toast.value.show = false;
      }
    }, 3500);
  };

  const markChanged = () => {
    hasUnsavedChanges.value = true;
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'gif': return 'image/gif';
      case 'mp4': return 'video/mp4';
      case 'mkv': return 'video/mp4';
      case 'webm': return 'video/webm';
      default: return '';
    }
  };

  const getMediaUrl = async (filename?: string): Promise<string> => {
    if (!filename) return '';
    if (mediaBlobUrlCache.value.has(filename)) {
      return mediaBlobUrlCache.value.get(filename)!;
    }

    const handleOrFile = mediaFilesMap.value.get(filename);
    if (!handleOrFile) return '';

    try {
      let file: File | null = null;
      if (handleOrFile instanceof File) {
        file = handleOrFile;
      } else if ('getFile' in handleOrFile && typeof handleOrFile.getFile === 'function') {
        file = await handleOrFile.getFile();
      }
      if (file) {
        const mimeType = getMimeType(filename);
        const blob = mimeType ? file.slice(0, file.size, mimeType) : file;
        const url = URL.createObjectURL(blob);
        mediaBlobUrlCache.value.set(filename, url);
        return url;
      }
    } catch (err) {
      console.error(`Failed to load media ${filename}:`, err);
    }
    return '';
  };

  const clearMediaCaches = () => {
    mediaBlobUrlCache.value.forEach((url) => URL.revokeObjectURL(url));
    mediaBlobUrlCache.value.clear();
  };

  const saveIssues = async (options: SaveOptions = {}): Promise<boolean> => {
    const { silent = false, reason = 'manual' } = options;
    if (issues.value.length === 0) return false;

    const jsonString = JSON.stringify(issues.value, null, 2);

    if (currentDirHandle.value && typeof currentDirHandle.value.getFileHandle === 'function') {
      try {
        const reviewHandle = await currentDirHandle.value.getFileHandle('lqa_issues_review.json', { create: true });
        const writable = await reviewHandle.createWritable();
        await writable.write(jsonString);
        await writable.close();

        mediaFilesMap.value.set('lqa_issues_review.json', reviewHandle);
        loadedFileName.value = 'lqa_issues_review.json';
        hasUnsavedChanges.value = false;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        lastSavedTime.value = timeStr;

        if (reason === 'interval') {
          showToast(`定期自動保存完了 (${timeStr})`, 'info');
        } else if (!silent) {
          showToast('lqa_issues_review.json に保存しました！');
        }
        return true;
      } catch (err: any) {
        console.error('Save failed:', err);
        if (!silent || reason === 'manual') {
          showToast(`保存に失敗しました: ${err.message}`, 'error');
        }
        return false;
      }
    }

    if (reason === 'manual' && !silent) {
      downloadJson();
      return true;
    }

    return false;
  };

  const downloadJson = async () => {
    await downloadExportedFile(defaultJsonExporter, issues.value);
    hasUnsavedChanges.value = false;
    showToast('lqa_issues_review.json をダウンロードしました');
  };

  const exportCsv = async () => {
    await downloadExportedFile(defaultCsvExporter, issues.value);
    showToast('lqa_issues_review.csv をエクスポートしました');
  };

  const openDirectory = async (fallbackInput?: HTMLInputElement | null): Promise<boolean> => {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      if (fallbackInput) fallbackInput.click();
      return false;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      isLoading.value = true;
      loadingMessage.value = 'ファイル一覧を取得中...';
      currentDirHandle.value = dirHandle;
      folderName.value = dirHandle.name;

      clearMediaCaches();
      mediaFilesMap.value.clear();

      let jsonReviewHandle: any = null;
      let jsonBaseHandle: any = null;

      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file') {
          mediaFilesMap.value.set(entry.name, entry);
          if (entry.name === 'lqa_issues_review.json') {
            jsonReviewHandle = entry;
          } else if (entry.name === 'lqa_issues.json') {
            jsonBaseHandle = entry;
          }
        }
      }

      const targetJsonHandle = jsonReviewHandle || jsonBaseHandle;

      if (!targetJsonHandle) {
        showToast('フォルダ内に lqa_issues.json または lqa_issues_review.json が見つかりませんでした', 'warning');
        isLoading.value = false;
        return false;
      }

      loadedFileName.value = targetJsonHandle.name;
      loadingMessage.value = `${targetJsonHandle.name} を読み込み中...`;
      const file = await targetJsonHandle.getFile();
      const text = await file.text();
      const parsed: LqaIssue[] = JSON.parse(text);

      issues.value = parsed.map((item) => ({
        ...item,
        comment: (item as any).comment != null ? String((item as any).comment) : '',
        status: (item as any).status || 'open',
        severity: (item as any).severity || 'major',
      }));

      hasUnsavedChanges.value = false;
      showToast(`${targetJsonHandle.name} から ${issues.value.length} 件のイシューを読み込みました`);
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        showToast(`フォルダを開けませんでした: ${err.message}`, 'error');
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const loadFallbackFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    isLoading.value = true;
    loadingMessage.value = 'ファイルを読み込み中...';
    clearMediaCaches();
    mediaFilesMap.value.clear();

    let reviewFile: File | null = null;
    let baseFile: File | null = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      mediaFilesMap.value.set(file.name, file);
      if (file.name === 'lqa_issues_review.json') {
        reviewFile = file;
      } else if (file.name === 'lqa_issues.json') {
        baseFile = file;
      }
    }

    if (files[0].webkitRelativePath) {
      folderName.value = files[0].webkitRelativePath.split('/')[0];
    }

    const targetFile = reviewFile || baseFile;

    if (targetFile) {
      try {
        loadedFileName.value = targetFile.name;
        const text = await targetFile.text();
        const parsed: LqaIssue[] = JSON.parse(text);
        issues.value = parsed.map((item) => ({
          ...item,
          comment: (item as any).comment != null ? String((item as any).comment) : '',
          status: (item as any).status || 'open',
          severity: (item as any).severity || 'major',
        }));
        hasUnsavedChanges.value = false;
        showToast(`${targetFile.name} から ${issues.value.length} 件のイシューを読み込みました`);
      } catch (err: any) {
        showToast(`JSONパース失敗: ${err.message}`, 'error');
      }
    } else {
      showToast('lqa_issues.json または lqa_issues_review.json が見つかりませんでした', 'warning');
    }
    isLoading.value = false;
  };

  return {
    issues,
    folderName,
    loadedFileName,
    currentDirHandle,
    hasUnsavedChanges,
    isLoading,
    loadingMessage,
    lastSavedTime,
    toast,
    showToast,
    markChanged,
    getMediaUrl,
    clearMediaCaches,
    saveIssues,
    downloadJson,
    exportCsv,
    openDirectory,
    loadFallbackFiles,
  };
}
