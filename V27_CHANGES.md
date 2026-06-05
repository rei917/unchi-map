# V27_CHANGES

## 目的

v27はPWA対応版です。

iPhone/Androidでホーム画面へ追加し、アプリのように起動できるようにしました。

## 追加内容

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png`
- `src/components/pwa/ServiceWorkerRegister.tsx`
- `app/layout.tsx` のPWAメタデータ
- standalone表示向けCSS

## 使い方

### iPhone

SafariでVercel URLを開く

共有ボタン
↓
ホーム画面に追加

### Android

ChromeでVercel URLを開く

メニュー
↓
ホーム画面に追加 / アプリをインストール

## 注意

Service Workerはproduction環境でのみ登録されます。
ローカル `npm run dev` では登録しません。

つまり、Vercelにデプロイして確認してください。

## キャッシュ方針

- Supabase通信はキャッシュしない
- Google/OAuth系はキャッシュしない
- OpenStreetMapタイルはキャッシュしない
- 静的アセットのみ軽くキャッシュ

RealtimeやDB更新を邪魔しにくい安全寄り設定です。

## v28へ向けて

v28では以下を推奨します。

- リリース前UI微調整
- 初回説明/使い方
- エラー表示改善
- 空グループ自動削除
- バージョン表示
