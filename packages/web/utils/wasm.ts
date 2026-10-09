let wasmModule: any = null
let initialized = false

export async function initWasm() {
  if (initialized) return wasmModule
  if (import.meta.server) return null

  try {
    const config = useRuntimeConfig()
    const base = config.app?.baseURL || '/'
    const cleanBase = base.endsWith('/') ? base : `${base}/`

    // public/pkg-web から静的ファイルを読み込み
    // @ts-ignore
    const spindle = await import(/* @vite-ignore */ `${cleanBase}pkg-web/sheep_spindle.js`)
    const wasmUrl = `${cleanBase}pkg-web/sheep_spindle_bg.wasm`

    await spindle.default(wasmUrl)
    wasmModule = spindle
    initialized = true
    console.log('[SheepComb] WASM Initialized successfully')
    return wasmModule
  } catch (e) {
    console.error('[SheepComb] WASM Initialization failed:', e)
    throw e
  }
}

export function getWasm() {
  if (!initialized || !wasmModule) {
    throw new Error('WASM not initialized. Call initWasm() first.')
  }
  return wasmModule
}

export function isWasmReady() {
  return initialized
}
