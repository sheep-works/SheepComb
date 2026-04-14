import os
import sys

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from scripts.features.consistency_chunker import chunk_consistency
from scripts.features.add_tm_to_csv import add_tm_matches

def test_modular_features():
    # 1. Test consistency_chunker (modular)
    print("Testing chunk_consistency...")
    mock_items = [
        {'src': 'Hello world', 'tgt': 'こんにちは世界'},
        {'src': 'Hello world', 'tgt': 'こんにちはセカイ'}, # Diff tgt
        {'src': 'Goodbye', 'tgt': 'さようなら'}
    ]
    chunks = chunk_consistency(mock_items, threshold=90.0)
    print(f"Chunks created: {len(chunks)}")
    for i, chunk in enumerate(chunks):
        print(f" Chunk {i}: {len(chunk)} items")

    # 2. Test add_tm_to_csv (modular)
    print("\nTesting add_tm_matches...")
    # List of lists (with header)
    mock_csv = [
        ['行番号', '原文', '訳文', '備考'],
        ['1', 'Hello world', '', 'test note']
    ]
    # List of dicts
    mock_tm = [
        {'src': 'Hello world', 'tgt': 'こんにちは世界'}
    ]
    
    results = add_tm_matches(mock_csv, mock_tm, threshold=90.0)
    print(f"Results header: {results[0]}")
    for row in results[1:]:
        print(f"Result row: {row}")

if __name__ == "__main__":
    test_modular_features()
