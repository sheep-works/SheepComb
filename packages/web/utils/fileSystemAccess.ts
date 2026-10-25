/**
 * utils/fileSystemAccess.ts
 * File System Access API (showOpenFilePicker / showSaveFilePicker) のユーティリティ
 * Chromium 系での直接保存・選択をサポートし、Safari / Firefox / レガシー環境では安全にフォールバックします。
 */
import { FileIO } from './fileIO'

export interface FsaFileType {
  description?: string
  accept: Record<string, string[]>
}

/**
 * File System Access API がサポートされているか判定
 */
export function isFsaSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * ファイルピッカーを開いて File オブジェクトの配列を取得
 */
export async function pickFilesWithFsa(options: {
  multiple?: boolean
  types?: FsaFileType[]
  acceptExtensions?: string[]
}): Promise<File[]> {
  const { multiple = false, types, acceptExtensions } = options

  if (isFsaSupported()) {
    try {
      // @ts-ignore
      const handles: FileSystemFileHandle[] = await window.showOpenFilePicker({
        multiple,
        types: types || (acceptExtensions ? [
          {
            description: 'Supported Documents',
            accept: {
              '*/*': acceptExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`)
            }
          }
        ] : undefined)
      })

      const files: File[] = []
      for (const handle of handles) {
        const file = await handle.getFile()
        files.push(file)
      }
      return files
    } catch (e: any) {
      // ユーザーキャンセル（AbortError）の場合は空配列を返す
      if (e?.name === 'AbortError') {
        return []
      }
      console.warn('[FSA] showOpenFilePicker failed, falling back to input:', e)
    }
  }

  // フォールバック: <input type="file">
  return new Promise<File[]>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    if (acceptExtensions && acceptExtensions.length > 0) {
      input.accept = acceptExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`).join(',')
    }

    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve(Array.from(input.files))
      } else {
        resolve([])
      }
    }

    // キャンセル検知（モダンブラウザの cancel イベント）
    input.oncancel = () => {
      resolve([])
    }

    input.click()
  })
}

/**
 * ファイルを名前・場所を指定して保存 (FSA または通常ダウンロード)
 */
export async function saveFileWithFsa(
  content: Uint8Array | Blob | string,
  suggestedName: string,
  options: {
    types?: FsaFileType[]
    mimeType?: string
  } = {}
): Promise<{ success: boolean; method: 'fsa' | 'download' | 'cancelled' }> {
  const blob = content instanceof Blob
    ? content
    : new Blob([content as any], { type: options.mimeType || 'application/octet-stream' })

  if (isFsaSupported()) {
    try {
      // @ts-ignore
      const handle: FileSystemFileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: options.types || [
          {
            description: 'File',
            accept: {
              [options.mimeType || 'application/octet-stream']: [
                suggestedName.includes('.') ? `.${suggestedName.split('.').pop()}` : ''
              ]
            }
          }
        ]
      })

      // @ts-ignore
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return { success: true, method: 'fsa' }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { success: false, method: 'cancelled' }
      }
      console.warn('[FSA] showSaveFilePicker failed, falling back to download:', e)
    }
  }

  // フォールバック: Blob ダウンロード
  FileIO.download(blob, suggestedName, options.mimeType || 'application/octet-stream')
  return { success: true, method: 'download' }
}
