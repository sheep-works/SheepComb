/* tslint:disable */
/* eslint-disable */

/**
 * [汎用ショートハンド] フェイルセーフ CSV / TXT の生成
 */
export function export_failsafe(translation_data: any): any;

/**
 * [汎用ショートハンド] 単一原稿ファイルからの抽出
 */
export function extract(file_bytes: Uint8Array, file_name: string, options: any): any;

/**
 * [汎用ショートハンド] 複数原稿ファイルの一括抽出
 */
export function extract_batch(files: any, options: any): any;

/**
 * [汎用ショートハンド] 翻訳データからの完成文書マージ
 */
export function merge(skeleton_bytes: Uint8Array, file_name: string, translation_data: any, options: any): Uint8Array;

/**
 * [Browser エントリポイント]
 * マージが困難な場合のフェイルセーフ出力（対照 CSV および プレーン TXT）を生成します。
 *
 * ### 戻り値
 * `{ csv: string, txt: string }`
 */
export function suffolk_browser_export_failsafe(translation_data: any): any;

/**
 * [Browser エントリポイント]
 * 単一原稿ファイルのバイナリ（Uint8Array）からテキストを抽出します。
 *
 * ### 引数
 * - `file_bytes`: 原稿ファイルのバイナリ (`Uint8Array`)
 * - `file_name`: ファイル名（拡張子付き、例: `"guide.docx"`, `"config.xlsx"`）
 * - `options`: オプション設定 JSON オブジェクト (省略時はデフォルト)
 *
 * ### 戻り値
 * - デフォルト: `ShWvData` 形式の JavaScript オブジェクト
 * - `options.to == "xliff"` 指定時: `{ format: "xliff", content: string, fileName: string }`
 */
export function suffolk_browser_extract(file_bytes: Uint8Array, file_name: string, options: any): any;

/**
 * [Browser エントリポイント]
 * 複数原稿ファイルの一括抽出を行い、統合された `project.json` (ShWvData) を返します。
 * ブラウザ上のドラッグ＆ドロップで複数ファイルが渡された場合に最適です。
 *
 * ### 引数
 * - `files`: `[{ name: "file1.docx", data: Uint8Array }, ...]` 形式の配列
 * - `options`: オプション設定 JSON オブジェクト
 */
export function suffolk_browser_extract_batch(files: any, options: any): any;

/**
 * [Browser エントリポイント]
 * 原稿スケルトンファイルに確定した翻訳データを流し込み、完成バイナリを出力します。
 *
 * ### 引数
 * - `skeleton_bytes`: 元原稿ファイルのバイナリ (`Uint8Array`)
 * - `file_name`: ファイル名（例: `"guide.docx"`）
 * - `translation_data`: 翻訳データ（`ShWvData` オブジェクトまたは XLIFF 文字列）
 * - `options`: マージオプション設定 JSON オブジェクト
 *
 * ### 戻り値
 * - 完成文書のバイナリデータ (`Uint8Array`)。そのまま `Blob` 化してダウンロード可能です。
 */
export function suffolk_browser_merge(skeleton_bytes: Uint8Array, file_name: string, translation_data: any, options: any): Uint8Array;

/**
 * Suffolk WASM コアエンジンのバージョン
 */
export function suffolk_version(): string;

/**
 * [VS Code 拡張 エントリポイント]
 * フェイルセーフ出力（対照 CSV および プレーン TXT）を生成します。
 *
 * ### 戻り値
 * `{ csv: string, txt: string }`
 */
export function suffolk_vscode_export_failsafe(translation_data: any): any;

/**
 * [VS Code 拡張 エントリポイント]
 * 単一ドキュメント（Buffer / Uint8Array）から翻訳セグメントを抽出します。
 * `vscode.workspace.fs.readFile(uri)` で取得した Uint8Array をそのまま渡せます。
 *
 * ### 引数
 * - `file_bytes`: 原稿ファイルのバイナリ (`Uint8Array` / `Buffer`)
 * - `file_name`: ファイル名（例: `"document.docx"`, `"config.xlsx"`）
 * - `options`: オプション設定 JSON オブジェクト
 *
 * ### 戻り値
 * - デフォルト: `ShWvData` 形式の JavaScript オブジェクト
 * - `options.to == "xliff"` 指定時: `{ format: "xliff", content: string, fileName: string }`
 */
export function suffolk_vscode_extract(file_bytes: Uint8Array, file_name: string, options: any): any;

/**
 * [VS Code 拡張 エントリポイント]
 * ワークスペース内の複数ファイルの一括抽出を行い、統合された `project.json` (ShWvData) を返します。
 *
 * ### 引数
 * - `files`: `[{ name: string, data: Uint8Array }]` の配列
 * - `options`: オプション設定 JSON オブジェクト
 */
export function suffolk_vscode_extract_batch(files: any, options: any): any;

/**
 * [VS Code 拡張 便利機能]
 * Suffolk が対応している全フォーマットと拡張子の一覧を返します。
 * VS Code のファイルピッカー（`showOpenDialog`）のフィルター定義等に利用できます。
 */
export function suffolk_vscode_get_supported_formats(): any;

/**
 * [VS Code 拡張 エントリポイント]
 * スケルトンファイルに翻訳結果を流し込み、完成バイナリを出力します。
 * `vscode.workspace.fs.writeFile(uri, resultBytes)` に直接書き込めます。
 *
 * ### 引数
 * - `skeleton_bytes`: 元原稿ファイルのバイナリ (`Uint8Array` / `Buffer`)
 * - `file_name`: ファイル名（例: `"document.docx"`）
 * - `translation_data`: 翻訳データ（`ShWvData` オブジェクトまたは XLIFF 文字列）
 * - `options`: マージオプション設定 JSON オブジェクト
 *
 * ### 戻り値
 * 完成バイナリ (`Uint8Array`)
 */
export function suffolk_vscode_merge(skeleton_bytes: Uint8Array, file_name: string, translation_data: any, options: any): Uint8Array;

/**
 * [VS Code 拡張 便利機能]
 * 選択テキストや段落テキストを Suffolk の文分割ルールでセグメント分割します。
 * エディタ上でリアルタイムに文境界をプレビュー・ハイライト表示する際に便利です。
 *
 * ### 引数
 * - `text`: 分割対象テキスト
 *
 * ### 戻り値
 * `string[]` (分割された文の配列)
 */
export function suffolk_vscode_segment_text(text: string): any;

/**
 * [VS Code 拡張 便利機能]
 * 原文と訳文のインライン装飾タグ（`{@0}`, `{@1}`, `{0}` 等）の整合性を検証します。
 * ポストエディット作業中のタグ欠損や余計なタグ挿入を警告する際に活用できます。
 *
 * ### 戻り値
 * `{ valid: boolean, missing: string[], extra: string[] }`
 */
export function suffolk_vscode_validate_tags(source: string, target: string): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly export_failsafe: (a: any) => [number, number, number];
    readonly extract: (a: number, b: number, c: number, d: number, e: any) => [number, number, number];
    readonly extract_batch: (a: any, b: any) => [number, number, number];
    readonly merge: (a: number, b: number, c: number, d: number, e: any, f: any) => [number, number, number];
    readonly suffolk_browser_export_failsafe: (a: any) => [number, number, number];
    readonly suffolk_browser_extract: (a: number, b: number, c: number, d: number, e: any) => [number, number, number];
    readonly suffolk_browser_extract_batch: (a: any, b: any) => [number, number, number];
    readonly suffolk_browser_merge: (a: number, b: number, c: number, d: number, e: any, f: any) => [number, number, number];
    readonly suffolk_version: () => [number, number];
    readonly suffolk_vscode_export_failsafe: (a: any) => [number, number, number];
    readonly suffolk_vscode_extract: (a: number, b: number, c: number, d: number, e: any) => [number, number, number];
    readonly suffolk_vscode_extract_batch: (a: any, b: any) => [number, number, number];
    readonly suffolk_vscode_get_supported_formats: () => any;
    readonly suffolk_vscode_merge: (a: number, b: number, c: number, d: number, e: any, f: any) => [number, number, number];
    readonly suffolk_vscode_segment_text: (a: number, b: number) => [number, number, number];
    readonly suffolk_vscode_validate_tags: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
