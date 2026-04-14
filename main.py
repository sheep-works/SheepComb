import argparse
import subprocess
import sys
import os
import pandas as pd
from scripts.util import config
from scripts.parser.parse_wrapper import parse_file, batch_parse
from scripts.features.add_tm_to_csv import add_tm_matches, run_pipeline
from scripts.features.consistency_chunker import chunk_consistency

def main():
    parser = argparse.ArgumentParser(description="SheepComb Tool Manager")
    parser.add_argument("-a", "--add-tm", action="store_true", help="Run add_tm_to_csv pipeline")
    parser.add_argument("-c", "--chunk", action="store_true", help="Run consistency chunker")
    parser.add_argument("-m", "--mxliff", type=str, metavar="FILE", help="Run xlfhack.py on MXLIFF")
    
    # Common options
    parser.add_argument("-i", "--input", help="Input file path (overrides config)")
    parser.add_argument("-o", "--output", help="Output file path (overrides config)")
    parser.add_argument("--threshold", type=float, default=90.0, help="Similarity threshold (0-100, default: 90.0)")
    parser.add_argument("--mode", choices=["char", "word"], default=None, help="Comparison mode (for mxliff)")

    args = parser.parse_args()

    if args.add_tm:
        input_file = args.input or config.INPUT_FILE
        output_file = args.output or config.OUTPUT_FILE
        print(f"Running: add_tm_to_csv on {input_file}")
        run_pipeline(
            input_file, 
            config.TMS, 
            output_file, 
            config.SOURCE_LANG, 
            config.TARGET_LANG
        )
    elif args.chunk:
        input_file = args.input or config.INPUT_FILE
        output_file = args.output or "chunks.jsonl"
        print(f"Running: consistency_chunker on {input_file}")
        
        # パーサーと機能を組み合わせる例
        items = parse_file(input_file, src_lang=config.SOURCE_LANG, tgt_lang=config.TARGET_LANG)
        if not items:
            print("No items to process.")
            sys.exit(1)
            
        results = chunk_consistency(items, args.threshold)
        
        import json
        with open(output_file, 'w', encoding='utf-8') as f:
            for chunk in results:
                f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
        print(f"Saved chunks to {output_file}")
    elif args.mxliff:
        if args.mode is None:
            while True:
                user_input = input("比較モードを入力してください (char または word) [デフォルト: char]: ").strip().lower()
                if user_input in ["char", "word"]:
                    args.mode = user_input
                    break
                elif user_input == "":
                    args.mode = "char"
                    break
                else:
                    print("無効な入力です。「char」または「word」を入力してください。")

        print(f"Running: xlfhack.py on {args.mxliff} (mode: {args.mode})")
        # Build command to call xlfhack.py
        cmd = [sys.executable, "scripts/xlfhack.py", args.mxliff, "--mode", args.mode, "--threshold", str(args.threshold)]
        if args.output:
            cmd.extend(["--output", args.output])
        
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error occurred while running xlfhack.py: {e}")
            sys.exit(e.returncode)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
