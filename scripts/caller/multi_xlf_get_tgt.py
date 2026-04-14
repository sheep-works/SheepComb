from scripts.parser.parse_wrapper import batch_parse
from scripts.util import tools
import os
import json

def multi_xlf_get_tgt(input_dir, output_dir, to_chunk=False, threshold=4000):
    input_files = [os.path.join(input_dir, file) for file in os.listdir(input_dir) if file.endswith((".xlf", ".xliff"))]
    
    file_contents = batch_parse(input_files)
    merged_content = [tools.strip_tags(item['tgt']) for sublist in file_contents for item in sublist]

    if to_chunk:
        # merged_contentをチャンクに分割する
        # 具体的には文字数がthresholdを超えた際に、要素として "Chunk X" を挿入する
        chunked_contents = ["Chunk 1"]
        current_chunk_len = 0
        chunk_count = 2
        for item in merged_content:
            if current_chunk_len + len(item) > threshold:
                chunked_contents.append(f"Chunk {chunk_count}")
                current_chunk_len = 0
                chunk_count += 1
            chunked_contents.append(item)
            current_chunk_len += len(item)
        merged_content = chunked_contents

    # 出力ディレクトリを作成し、結果を保存する
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "merged_tgt.txt")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for chunk in merged_content:
            f.write(chunk + '\n')
    
    print(f"Done! {len(merged_content)} lines of target text saved to {output_path}")

if __name__ == "__main__":
    main()