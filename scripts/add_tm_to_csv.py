import os
import pandas as pd
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from rapidfuzz import process, utils
from difflib import SequenceMatcher

from scripts.util.tmx_parser import parse_tmx, strip_tags

# --- 設定 ---
NUM_CORES = os.cpu_count() or 4
SIMILARITY_THRESHOLD = 60.0
MAX_MATCHES = 2

def get_tagged_diff(ref_text, src_text):
    """difflibを使用して、今回の原文(src)に差分タグを付与する"""
    matcher = SequenceMatcher(None, ref_text, src_text)
    tagged_text = ""
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        chunk = src_text[j1:j2]
        if tag == 'equal':
            tagged_text += chunk
        elif tag == 'insert':
            tagged_text += f"[INS]{chunk}[/INS]"
        elif tag == 'replace':
            tagged_text += f"[REPLACE]{chunk}[/REPLACE]"
        # delete (TMにあるが今回ないもの) は原文表示には含めない
    return tagged_text


def parse_csv(file_path):
    """CSVファイルを読み込む"""
    df = pd.read_csv(file_path)
    # 欠損値などをよしなに埋めて辞書リストにする
    return df.fillna("").to_dict('records')

def process_single_row(row, tm_items):
    """1行に対してTMマッチングを行うコアロジック"""
    source_orig = str(row.get('Source', '')) if 'Source' in row else str(row.get('原文', ''))
    target = str(row.get('Target', '')) if 'Target' in row else str(row.get('訳文', ''))
    row_no = str(row.get('No', '')) if 'No' in row else str(row.get('行番号', ''))
    notes = str(row.get('Notes', '')) if 'Notes' in row else str(row.get('備考', ''))

    source_stripped = strip_tags(source_orig)
    source_len = len(source_stripped)
    
    results = {
        "行番号": row_no,
        "原文": source_orig,
        "訳文": target,
        "類似文1原文": "", "類似文1訳文": "",
        "類似文2原文": "", "類似文2訳文": "",
        "備考": notes
    }

    if not source_orig or source_len == 0:
        return results

    # 1. 枝切り (タグ除去後の文字数 ±25% 以内のみ)
    candidates = []
    for item in tm_items:
        tm_len = len(item['src_stripped'])
        if abs(tm_len - source_len) <= (source_len * 0.25):
            candidates.append(item)
    
    if not candidates:
        return results

    # 2. RapidFuzzでタグ除去後のテキストを使って高速抽出
    candidate_sources = [c['src_stripped'] for c in candidates]
    # 同じ原文が複数マッチするのを防ぐため、少し多めに取得してから重複を弾く
    matches = process.extract(source_stripped, candidate_sources, limit=MAX_MATCHES * 5, score_cutoff=SIMILARITY_THRESHOLD)

    seen_srcs = set()
    valid_count = 0

    for match_text_stripped, score, idx in matches:
        tm_item = candidates[idx]
        tm_src_orig = tm_item['src_orig']
        tm_tgt = tm_item['tgt']
        
        # 原文の重複チェック
        if tm_src_orig in seen_srcs:
            continue
        seen_srcs.add(tm_src_orig)
        
        # 3. 100%マッチなら元の原文をそのまま出力、それ以外は元の原文同士でdifflibを使ってタグ付け
        if score >= 99.9:
            tagged_src = tm_src_orig
        else:
            tagged_src = get_tagged_diff(tm_src_orig, source_orig)
        
        results[f"類似文{valid_count+1}原文"] = tagged_src
        results[f"類似文{valid_count+1}訳文"] = tm_tgt
        valid_count += 1
        
        # クライアント要望: 100%マッチがあれば2件目は不要
        if score >= 99.9:
            break
            
        if valid_count >= MAX_MATCHES:
            break
            
    return results

def batch_worker(rows_chunk, tm_items):
    """プロセスごとに割り当てられた塊を処理する"""
    return [process_single_row(row, tm_items) for row in rows_chunk]

def run_pipeline(csv_file, tmx_files, output_csv, source_lang, target_lang):
    """メインの実行パイプライン"""
    print("Reading data...")
    csv_rows = parse_csv(csv_file)
    
    tm_items = []
    for tmx_file in tmx_files:
        print(f"Parsing {tmx_file}...")
        tm_items.extend(parse_tmx(tmx_file, source_lang, target_lang))
    
    print(f"Starting process with {NUM_CORES} cores...")
    
    # データを分割
    if not csv_rows:
        print("No CSV data to process.")
        return
        
    chunk_size = max(1, len(csv_rows) // NUM_CORES)
    chunks = [csv_rows[i:i + chunk_size] for i in range(0, len(csv_rows), chunk_size)]
    
    # 並列実行 (tm_dataを全プロセスに共有)
    worker_with_tm = partial(batch_worker, tm_items=tm_items)
    
    with ProcessPoolExecutor(max_workers=NUM_CORES) as executor:
        result_chunks = list(executor.map(worker_with_tm, chunks))
    
    # フラットなリストに戻す
    final_data = [item for sublist in result_chunks for item in sublist]
    
    column_order = [
        "行番号", "原文", "訳文", 
        "類似文1原文", "類似文1訳文", 
        "類似文2原文", "類似文2訳文", "備考"
    ]
    
    df = pd.DataFrame(final_data)
    # DataFrameの列の順序を整える
    df = df[column_order]
    df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"Done! {output_csv} saved.")
