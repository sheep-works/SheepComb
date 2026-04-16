import argparse
import os
import json
import sys
from typing import List
from rapidfuzz import fuzz

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from scripts.parser.parse_wrapper import parse_document
from scripts.caller.file_io import read_document
from scripts.util.tools import strip_tags_from_item, lowercase_item, add_index_to_item
from scripts.util.types import Segment, SegmentList

def parse_args():
    parser = argparse.ArgumentParser(description="Group similar segments into chunks for consistency checking.")
    parser.add_argument("input_file", help="Path to the input file (xlf, mqxlf, mxlf, sdlxlf, tmx)")
    parser.add_argument("output_file", help="Path to the output JSONL file")
    parser.add_argument("--threshold", type=float, default=80.0, help="Similarity threshold (0-100, default: 80.0)")
    parser.add_argument("--src-lang", default="ja", help="Source language (for TMX, default: ja)")
    parser.add_argument("--tgt-lang", default="en", help="Target language (for TMX, default: en)")
    return parser.parse_args()

def text_pipeline(item: Segment, i: int) -> Segment:
    item = strip_tags_from_item(item)
    item = lowercase_item(item)
    item = add_index_to_item(item, i)
    return item

def chunk_consistency(items: SegmentList, threshold: float) -> List[SegmentList]:
    """
    セグメントのリストを受け取り、類似度に基づいてチャンク（二重リスト）にまとめて返す。
    """
    # 前処理
    processed_items: SegmentList = [text_pipeline(item, i) for i, item in enumerate(items)]

    results: List[SegmentList] = []
    total_items = len(processed_items)
    print(f"Chunking {total_items} items with threshold {threshold}...")

    items_to_process = processed_items.copy()

    while items_to_process:
        # 1. 最初の要素を取り出す
        seed = items_to_process.pop(0)
        seed_src = seed.get('src_stripped', '')
        seed_tgt = seed.get('tgt_stripped', '')
        
        # temp_chunkを作成 (strippedな値を使用)
        temp_chunk: SegmentList = [{
            'idx': seed.get('idx', ''),
            'src': seed.get('src_stripped', ''),
            'tgt': seed.get('tgt_stripped', '')
        }]
        
        # 2 & 3. 残りの要素と比較して類似したものを抽出
        remaining: SegmentList = []
        for item in items_to_process:
            # srcが同じ場合
            # tgtも同じであれば、一貫性のチェックは不要なのでスキップ
            if seed_src == item.get('src_stripped', ''):
                if seed_tgt == item.get('tgt_stripped', ''):
                    continue
                else:
                    temp_chunk.append({
                        'idx': item.get('idx', ''),
                        'src': item.get('src_stripped', ''),
                        'tgt': item.get('tgt_stripped', '')
                    })
            # srcが異なる場合、類似度を計測。ある程度似ている場合のみチャンクに追加
            else:
                score = fuzz.ratio(seed_src, item.get('src_stripped', ''))
                if score >= threshold:
                    temp_chunk.append({
                        'idx': item.get('idx', ''),
                        'src': item.get('src_stripped', ''),
                        'tgt': item.get('tgt_stripped', '')
                    })
                else:
                    remaining.append(item)
        
        results.append(temp_chunk)
        items_to_process = remaining
        
        if len(results) % 10 == 0:
            print(f"Processed {total_items - len(items_to_process)}/{total_items} items...")
            
    return results


def main():
    args = parse_args()
    input_file = args.input_file
    output_file = args.output_file
    threshold = args.threshold
    
    doc = read_document(input_file, metadata={"src_lang": args.src_lang, "tgt_lang": args.tgt_lang})
    items = parse_document(doc, src_lang=args.src_lang, tgt_lang=args.tgt_lang)

    # チャンク実行
    results = chunk_consistency(items, threshold)

    print(f"Created {len(results)} chunks. Saving to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for chunk in results:
            f.write(json.dumps(chunk, ensure_ascii=False) + '\n')

    print("Done!")

if __name__ == "__main__":
    main()
