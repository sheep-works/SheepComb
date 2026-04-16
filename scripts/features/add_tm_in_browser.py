import csv
import io
import os
from typing import List, Dict, Any, Optional
from rapidfuzz import process
from difflib import SequenceMatcher

from scripts.util.tools import strip_tags, batch_strip_tags
from scripts.util.types import Segment, SegmentList

# --- 設定 ---
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

def process_single_row(row: Dict[str, Any], tm_items: SegmentList) -> Dict[str, Any]:
    """1行に対してTMマッチングを行うコアロジック (ブラウザ/同期版)"""
    # 既存のCSVカラム名に対応 (Source/原文, Target/訳文)
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
    matches = process.extract(source_stripped, candidate_sources, limit=MAX_MATCHES * 5, score_cutoff=SIMILARITY_THRESHOLD)

    seen_srcs = set()
    valid_count = 0

    for match_text_stripped, score, idx in matches:
        tm_item = candidates[idx]
        tm_src = tm_item['src']
        tm_tgt = tm_item['tgt']
        
        if tm_src in seen_srcs:
            continue
        seen_srcs.add(tm_src)
        
        if score >= 99.9:
            tagged_src = tm_src
        else:
            tagged_src = get_tagged_diff(tm_src, source_orig)
        
        results[f"類似文{valid_count+1}原文"] = tagged_src
        results[f"類似文{valid_count+1}訳文"] = tm_tgt
        valid_count += 1
        
        if score >= 99.9:
            break
        if valid_count >= MAX_MATCHES:
            break
            
    return results

def add_tm_matches_sync(headers: List[str], rows: List[List[str]], tm_data: SegmentList) -> List[List[str]]:
    """
    同期的にTMマッチングを行い、結果の二重リストを返す。
    """
    # 辞書のリストに変換
    csv_rows = [dict(zip(headers, row)) for row in rows]
    
    # TMデータのタグ除去
    tm_items = batch_strip_tags(tm_data)
    
    # 並列化せず逐次処理
    final_rows = []
    for row in csv_rows:
        final_rows.append(process_single_row(row, tm_items))
    
    column_order = [
        "行番号", "原文", "訳文", 
        "類似文1原文", "類似文1訳文", 
        "類似文2原文", "類似文2訳文", "備考"
    ]
    
    results = [column_order]
    for row_dict in final_rows:
        results.append([str(row_dict.get(col, "")) for col in column_order])
        
    return results

def run_pipeline_in_browser(csv_content: str, tm_data: SegmentList) -> str:
    """
    ブラウザ（PyScript）内での実行用エントリーポイント。
    CSV文字列を受け取り、マッチング後のCSV文字列を返す。
    """
    # CSV読み込み (io.StringIOを使用)
    f = io.StringIO(csv_content)
    reader = csv.reader(f)
    csv_list = list(reader)
    
    if not csv_list:
        return ""
        
    headers = csv_list[0]
    rows = csv_list[1:]
    
    # マッチング実行
    results_list = add_tm_matches_sync(headers, rows, tm_data)
    
    # CSV書き出し
    out = io.StringIO()
    writer = csv.writer(out, lineterminator='\n')
    writer.writerows(results_list)
    
    return out.getvalue()
