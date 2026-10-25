/**
 * utils/suffolkWasm.ts
 * Pure Rust Okapi Tikal 互換エンジン Suffolk の WebAssembly ローダー & ラッパー
 */

export interface SuffolkFilterOptions {
  seg?: boolean
  srcLang?: string
  trgLang?: string
  rawTags?: boolean
  to?: 'shwv' | 'xliff'
  encoding?: string
  xlsxSource?: string | string[]
  xlsxTarget?: string | string[]
  xlsxContext?: string | string[]
  xlsxSkipRows?: number | string | number[]
  xlsxSheet?: string
  xlsxConfigCsv?: string
}

export interface SuffolkMergeOptions {
  encoding?: string
  xlsxSource?: string | string[]
  xlsxTarget?: string | string[]
  xlsxConfigCsv?: string
}

export interface SuffolkFailsafeResult {
  csv: string
  txt: string
}

let suffolkModule: any = null
let initialized = false
let initPromise: Promise<any> | null = null

/**
 * Suffolk WASM モジュールを初期化します
 */
export async function initSuffolkWasm() {
  if (initialized && suffolkModule) return suffolkModule
  if (initPromise) return initPromise
  if (import.meta.server) return null

  initPromise = (async () => {
    try {
      const config = useRuntimeConfig()
      const base = config.app?.baseURL || '/'
      const cleanBase = base.endsWith('/') ? base : `${base}/`

      // public/pkg-suffolk から静的ファイルを読み込み
      // @ts-ignore
      const suffolk = await import(/* @vite-ignore */ `${cleanBase}pkg-suffolk/suffolk_wasm.js`)
      const wasmUrl = `${cleanBase}pkg-suffolk/suffolk_wasm_bg.wasm`

      await suffolk.default({ module_or_path: wasmUrl })
      suffolkModule = suffolk
      initialized = true
      console.log(`[SheepComb] Suffolk WASM Initialized successfully (v${suffolk.suffolk_version ? suffolk.suffolk_version() : 'unknown'})`)
      return suffolkModule
    } catch (e) {
      console.error('[SheepComb] Suffolk WASM Initialization failed:', e)
      throw e
    } finally {
      initPromise = null
    }
  })()

  return initPromise
}

/**
 * 初期化済みモジュールを取得します
 */
export function getSuffolk() {
  if (!initialized || !suffolkModule) {
    throw new Error('Suffolk WASM is not initialized. Please call initSuffolkWasm() first.')
  }
  return suffolkModule
}

/**
 * 初期化状態を返します
 */
export function isSuffolkReady(): boolean {
  return initialized && !!suffolkModule
}

/**
 * 単一ファイルからの抽出（Filter / Extract）
 */
export async function extractDocument(
  fileBytes: Uint8Array,
  fileName: string,
  options: SuffolkFilterOptions = {}
): Promise<any> {
  const mod = await initSuffolkWasm()
  return mod.suffolk_browser_extract(fileBytes, fileName, options)
}

/**
 * 複数ファイルの一括抽出（Batch Extract）
 */
export async function extractBatchDocuments(
  files: { name: string; data: Uint8Array }[],
  options: SuffolkFilterOptions = {}
): Promise<any> {
  const mod = await initSuffolkWasm()
  return mod.suffolk_browser_extract_batch(files, options)
}

/**
 * 元ファイル（スケルトン）への翻訳データ復元（Merge / Rebuild）
 */
export async function mergeDocument(
  skeletonBytes: Uint8Array,
  fileName: string,
  translationData: any,
  options: SuffolkMergeOptions = {}
): Promise<Uint8Array> {
  const mod = await initSuffolkWasm()
  return mod.suffolk_browser_merge(skeletonBytes, fileName, translationData, options)
}

/**
 * フェイルセーフ救助出力（対照 CSV / プレーン TXT）の生成
 */
export async function exportFailsafe(
  translationData: any
): Promise<SuffolkFailsafeResult> {
  const mod = await initSuffolkWasm()
  return mod.suffolk_browser_export_failsafe(translationData)
}

/**
 * Suffolk バージョンの取得
 */
export function getSuffolkVersion(): string {
  try {
    const mod = getSuffolk()
    return mod.suffolk_version ? mod.suffolk_version() : '0.0.2'
  } catch {
    return '0.0.2'
  }
}
