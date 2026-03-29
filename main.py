import argparse
import subprocess
import sys
from scripts.util import config
from scripts.add_tm_to_csv import run_pipeline

def main():
    parser = argparse.ArgumentParser(description="SheepComb Tool Manager")
    parser.add_argument("-a", "--add-tm", action="store_true", help="Run add_tm_to_csv.py pipeline")
    parser.add_argument("-m", "--mxliff", type=str, metavar="FILE", help="Run xlfhack.py on the specified MXLIFF file")
    
    # xlfhack.py options (passed through when -m is used)
    parser.add_argument("--mode", choices=["char", "word"], default=None, help="Comparison mode for mxliff (char/word). If omitted, prompts for input.")
    parser.add_argument("--threshold", type=float, default=90.0, help="Similarity threshold for mxliff (0-100)")
    parser.add_argument("--output", type=str, help="Output file path for mxliff")

    args = parser.parse_args()

    if args.add_tm:
        print("Running: add_tm_to_csv.py pipeline")
        run_pipeline(
            config.INPUT_FILE, 
            config.TMS, 
            config.OUTPUT_FILE, 
            config.SOURCE_LANG, 
            config.TARGET_LANG
        )
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
