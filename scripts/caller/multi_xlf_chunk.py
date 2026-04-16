from scripts.features.consistency_chunker import chunk_consistency
from scripts.parser.parse_wrapper import batch_parse
from scripts.caller.file_io import batch_read_documents
import os
import json

def multi_xlf_chunk(input_dir, output_dir, threshold, output_chunk_size=2):
    
    documents = batch_read_documents([input_dir], exts=[".xlf", ".xliff"])
    file_contents = batch_parse(documents)
    merged_content = [item for sublist in file_contents for item in sublist]
    chunked_content = chunk_consistency(merged_content, threshold)
    chunked_content = [chunk for chunk in chunked_content if len(chunk) >= output_chunk_size]
    chunked_content.sort(key=len, reverse=True)
    
    # 出力ディレクトリを作成し、結果を保存する
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "merged_chunks.jsonl")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for chunk in chunked_content:
            f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
    
    print(f"Done! {len(chunked_content)} chunks saved to {output_path}")

if __name__ == "__main__":
    main()