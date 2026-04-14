import os
import sys

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from scripts.parser.parse_wrapper import get_parser, parse_file, batch_parse

def test():
    # 既存のサンプルファイルを使用
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../sample'))
    if not os.path.exists(sample_dir):
        print(f"Sample directory not found at {sample_dir}")
        return

    files = [f for f in os.listdir(sample_dir) if f.endswith(('.xlf', '.tmx', '.sdlxlf'))]
    file_paths = [os.path.join(sample_dir, f) for f in files[:2]] # とりあえず2つ
    
    if not file_paths:
        print("No sample files found.")
        return

    print(f"Testing batch_parse with: {file_paths}")
    results = batch_parse(file_paths, src_lang='ja', tgt_lang='en')
    
    print(f"Batch results received: {len(results)} files processed.")
    for i, res in enumerate(results):
        print(f"File {i+1} ({os.path.basename(file_paths[i])}) has {len(res)} items.")
        if res:
            print(f"  First item: {res[0]}")

if __name__ == "__main__":
    test()
