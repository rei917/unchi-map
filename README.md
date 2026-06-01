# 🚽 うんちマップ β

友人同士で共有する招待制の位置情報SNS。
トイレを利用した場所を地図上に記録し、グループ内で共有できます。

## セットアップ

```bash
cd unchi-map
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## フォルダ構成

```
src/
├── app/
│   ├── layout.tsx        # ルートレイアウト
│   ├── page.tsx          # メインページ
│   └── globals.css       # グローバルスタイル
├── components/
│   ├── map/
│   │   ├── MapView.tsx      # Leaflet 地図コンポーネント
│   │   └── RecordPopup.tsx  # ピン押下時ポップアップ
│   ├── modals/
│   │   └── PostModal.tsx    # 記録投稿モーダル
│   └── ui/
│       ├── Header.tsx       # ヘッダー・グループ切替
│       ├── PostButton.tsx   # 「記録する」ボタン
│       └── StarRating.tsx   # 星評価コンポーネント
├── hooks/
│   ├── useGeolocation.ts   # 現在地取得フック
│   └── useRecords.ts       # 記録データ管理フック
├── lib/
│   └── storage.ts          # localStorage ユーティリティ
├── data/
│   └── mockData.ts         # モックデータ・定数
└── types/
    └── index.ts            # 型定義
```

## 技術スタック

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Leaflet** + **react-leaflet** (地図)
- **OpenStreetMap** (タイル)
- **localStorage** (データ保存)

## MVP 機能

- [x] 現在地取得（Geolocation API）
- [x] 全画面地図表示（OpenStreetMap）
- [x] グループ切替（モック）
- [x] トイレ記録の投稿（快適度・コメント）
- [x] ピン表示・ポップアップ
- [x] localStorage 保存・永続化

## 将来実装予定

- [ ] Google ログイン
- [ ] Supabase への移行
- [ ] 招待リンク参加
- [ ] 写真添付
- [ ] ヒートマップ
