# 使い方

## ファイルの準備

まずは SheepBell で動画から問題点を抽出します。
SheepBell の使い方はこちら
- [README](https://github.com/sheep-works/SheepBell/blob/main/README_ja.md)
- [Google Colab](https://colab.research.google.com/drive/16QP6Icwj6o253Chpfzn9itJU2EEMMRvg?usp=sharing)

## フォルダの指定

上記の手順で問題点のクリップを抽出したフォルダを選択し、アクセスを許可してください。
指定フォルダ内にある `lqa_issues.json` が読み込まれ、動画/画像が表示されます。

## 内容の編集

動画や画像を見ながら、内容の修正を行っていきます。
- Description：マイクに入力した内容です。報告書向けに清書します。
- Comment：カテゴリーやタグ、重要度など、Description だけでは書けない内容を記載します。`#` を使った特殊な変換を用意する予定です。

編集した内容は、保存を押すか Ctrl + S で `lqa_issues_review.json` として保存されます。

## エクスポート

編集が完了したらエクスポートで CSV 形式に変換できます。
（より細かい変換ロジックも今後実装するかもしれません）
