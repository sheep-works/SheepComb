import os
from typing import List, Dict, Any, Optional
import pandas as pd
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from rapidfuzz import process
from difflib import SequenceMatcher

from scripts.parser.tmx_parser import parse_tmx
from scripts.util.tools import strip_tags, batch_strip_tags
from scripts.util.types import Segment, SegmentList

# --- 設定 ---
NUM_CORES = os.cpu_count() or 4
SIMILARITY_THRESHOLD = 60.0
MAX_MATCHES = 2

def get_tagged_diff(ref_text: str, src_text: str) -> str:
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


def parse_csv(file_path: str) -> List[Dict[str, Any]]:
    """CSVファイルを読み込む"""
    df = pd.read_csv(file_path)
    # 欠損値などをよしなに埋めて辞書リストにする
    return df.fillna("").to_dict('records')

def process_single_row(row: Dict[str, Any], tm_items: SegmentList) -> Dict[str, Any]:
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
    candidates: SegmentList = []
    for item in tm_items:
        tm_len = len(item.get('src_stripped', ''))
        if abs(tm_len - source_len) <= (source_len * 0.25):
            candidates.append(item)
    
    if not candidates:
        return results

    # 2. RapidFuzzでタグ除去後のテキストを使って高速抽出
    candidate_sources = [c.get('src_stripped', '') for c in candidates]
    # 同じ原文が複数マッチするのを防ぐため、少し多めに取得してから重複を弾く
    matches = process.extract(source_stripped, candidate_sources, limit=MAX_MATCHES * 5, score_cutoff=SIMILARITY_THRESHOLD)

    seen_srcs = set()
    valid_count = 0

    for match_text_stripped, score, idx in matches:
        tm_item = candidates[idx]
        tm_src = tm_item['src']
        tm_tgt = tm_item['tgt']
        
        # 原文の重複チェック
        if tm_src in seen_srcs:
            continue
        seen_srcs.add(tm_src)
        
        # 3. 100%マッチなら元の原文をそのまま出力、それ以外は元の原文同士でdifflibを使ってタグ付け
        if score >= 99.9:
            tagged_src = tm_src
        else:
            tagged_src = get_tagged_diff(tm_src, source_orig)
        
        results[f"類似文{valid_count+1}原文"] = tagged_src
        results[f"類似文{valid_count+1}訳文"] = tm_tgt
        valid_count += 1
        
        # クライアント要望: 100%マッチがあれば2件目は不要
        if score >= 99.9:
            break
            
        if valid_count >= MAX_MATCHES:
            break
            
    return results

def batch_worker(rows_chunk: List[Dict[str, Any]], tm_items: SegmentList) -> List[Dict[str, Any]]:
    """プロセスごとに割り当てられた塊を処理する"""
    return [process_single_row(row, tm_items) for row in rows_chunk]

def add_tm_matches(csv_data: List[List[str]], tm_data: SegmentList, threshold: float = 60.0, max_matches: int = 2, num_cores: Optional[int] = None) -> List[List[str]]:
    """
    CSVデータ（二重リスト）とTMデータ（辞書リスト）を受け取り、類似文を付与した二重リストを返す。
    csv_data[0] はヘッダーと見なす。
    """
    if not csv_data:
        return []
        
    headers = csv_data[0]
    rows = csv_data[1:]
    
    # リストのリストを辞書のリストに変換
    csv_rows = [dict(zip(headers, row)) for row in rows]
    
    # TMデータのタグ除去 (もし未実施なら)
    tm_items = batch_strip_tags(tm_data)
    
    # 並列処理の準備
    n_cores = num_cores or os.cpu_count() or 4
    if not csv_rows:
        return [headers]
        
    chunk_size = max(1, len(csv_rows) // n_cores)
    chunks = [csv_rows[i:i + chunk_size] for i in range(0, len(csv_rows), chunk_size)]
    
    worker_with_tm = partial(batch_worker, tm_items=tm_items)
    
    # 並列実行
    with ProcessPoolExecutor(max_workers=n_cores) as executor:
        result_chunks = list(executor.map(worker_with_tm, chunks))
        
    final_rows = [item for sublist in result_chunks for item in sublist]
    
    # 辞書のリストをリストのリストに戻す
    column_order = [
        "行番号", "原文", "訳文", 
        "類似文1原文", "類似文1訳文", 
        "類似文2原文", "類似文2訳文", "備考"
    ]
    
    results = [column_order]
    for row_dict in final_rows:
        results.append([str(row_dict.get(col, "")) for col in column_order])
        
    return results

def run_pipeline(csv_file: str, tmx_files: List[str], output_csv: str, source_lang: str, target_lang: str):
    """メインの実行パイプライン"""
    print("Reading data...")
    df_in = pd.read_csv(csv_file).fillna("")
    csv_data = [df_in.columns.tolist()] + df_in.values.tolist()
    
    tm_data: SegmentList = []
    for tmx_file in tmx_files:
        print(f"Parsing {tmx_file}...")
        raw_items = parse_tmx(tmx_file, source_lang, target_lang)
        tm_data.extend(raw_items)
    
    print(f"Matching TM...")
    results_list = add_tm_matches(csv_data, tm_data, threshold=SIMILARITY_THRESHOLD, max_matches=MAX_MATCHES, num_cores=NUM_CORES)
    
    # 結果を保存
    headers = results_list[0]
    data = results_list[1:]
    df_out = pd.DataFrame(data, columns=headers)
    df_out.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"Done! {output_csv} saved.")
