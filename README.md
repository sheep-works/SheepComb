# SheepComb

Sheep ファミリーのうち、XLIFF/TMX/TBX を活用するためのツール

# 使い方

```bash
./gui.ps1
```

# 実装機能

## 汎用 (util/tools.py)
- [x] タグ削除
- [x] 小文字化
- [x] インデックス追加

## パーサー

### 汎用系
- [ ] xlsx       (parser/xlsx_parser.py)
- [ ] csv/tsv    (parser/csv_parser.py)
- [ ] json       (parser/json_parser.py)

### CATツール系
- [x] XLIFF      (parser/xlf_parser.py)
- [x] MQXLIFF    (parser/mqxlf_parser.py)
- [x] MXLIFF     (parser/mxlf_parser.py)
- [x] SDLXLIFF   (parser/sdlxlf_parser.py)
- [x] TMX        (parser/tmx_parser.py)
- [ ] TBX        (parser/tbx_parser.py)

## 処理

### 重複＆類似ロック
- [ ] XLIFF      (features/xlf_lock.py)
- [ ] MQXLIFF    (features/mqxlf_lock.py)
- [x] MXLIFF     (features/mxlf_lock.py)
- [ ] SDLXLIFF   (features/sdlxlf_lock.py)

### その他
- [x] CSVに類似文情報を追加  (features/add_tm_to_csv.py)
- [x] 類似度チャンク化       (features/consistency_chunker.py)
- [x] 訳文のみを取得         (caller/multi_xlf_get_tgt.py)