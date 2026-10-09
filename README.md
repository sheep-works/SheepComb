# SheepComb

SheepFamily の Web アプリケーションポータル（モノレポ）。

## 構成

- `packages/web`: Nuxt 3 による Web アプリケーション本体（ポータル・統合 GUI）
  - `/app/shuttle/*`: Shuttle Web GUI（パーサー、アナライザー、ビルダー）
  - `/app/groom/*`: Groom Web GUI（対訳作成・整列ツール）
  - `/app/bell/*`: Bell Web GUI（LQA ビューアー）
- `packages/groom`: SheepGroom の Vue 3 フロントエンドコンポーネント
- `packages/bell`: SheepBell の Vue 3 LQA ビューアーコンポーネント
- `modules/SheepShuttle`: コアライブラリ・パーサー・型定義（Git Submodule）

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev
```

## デプロイ

Netlify により `lambuage.com/app` 向けに静的ビルド（`pnpm generate`）されます。
