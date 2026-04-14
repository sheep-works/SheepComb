import os

# 処理 1
# 複数のXLIFFファイルに対し、類似度を計算して一つのJSONLにしたい
from scripts.caller.multi_xlf_chunk import multi_xlf_chunk

# 処理 2
# 複数のXLIFFファイルから訳文だけを取り出したい
from scripts.caller.multi_xlf_get_tgt import multi_xlf_get_tgt

if __name__ == "__main__":

    # 処理 1
    input_dir = "./data/xlf"
    output_dir = "./data/xlf_chunked"
    threshold = 80.0
    output_chunk_size = 2
    multi_xlf_chunk(input_dir, output_dir, threshold, output_chunk_size)
    # 処理 1 ここまで

    # 処理 2
    # input_dir = "./data/xlf"
    # output_dir = "./data/xlf_chunked"
    # to_chunk = True
    # threshold = 4000
    # multi_xlf_get_tgt(input_dir, output_dir, to_chunk, threshold)
    # 処理 2 ここまで
