import json
import os

# プロジェクトルートを取得 (scripts/util/config.py から見て2つ上の階層)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            _config_data = json.load(f)
    except Exception:
        _config_data = {}
else:
    _config_data = {}

def resolve_path(path):
    """パスをプロジェクトルートからの相対パスとして解決する"""
    if not path:
        return ""
    if os.path.isabs(path):
        return path
    return os.path.join(BASE_DIR, path)

INPUT_FILE = resolve_path(_config_data.get("input_file", "sample.csv"))
TMS = [resolve_path(tm) for tm in _config_data.get("tms", [])]
OUTPUT_FILE = resolve_path(_config_data.get("output_file", "ai_check_list.csv"))
SOURCE_LANG = _config_data.get("source_lang", "ja")
TARGET_LANG = _config_data.get("target_lang", "en")
