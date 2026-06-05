# V27_FIX_CHANGES

## 追加内容

### アプリとして追加ボタン

モバイル端末のみ、画面下部に「アプリとして追加」案内を表示します。

## OSごとの挙動

### Android Chrome

`beforeinstallprompt` が取得できた場合だけ表示します。

「追加」を押すと、Android ChromeのPWAインストール確認が出ます。

### iPhone Safari

iOSはブラウザAPIから直接インストール画面を出せないため、
「追加」を押すと手順モーダルを表示します。

手順:

1. Safari下部の共有ボタンを押す
2. ホーム画面に追加
3. 追加

### PC

PCでは非表示です。

## 表示されない場合

以下の場合は表示しません。

- すでにPWA/standaloneで起動している
- PC表示
- ユーザーが「×」または「今後表示しない」を押した
- Androidでブラウザが `beforeinstallprompt` を出していない

再表示したい場合は、ブラウザのlocalStorageから以下を削除してください。

```text
unchi-map-install-dismissed
```

## 変更ファイル

- `src/components/pwa/InstallPrompt.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
