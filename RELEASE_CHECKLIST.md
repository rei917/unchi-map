# RELEASE_CHECKLIST

## リリース前チェック

### 1. Vercel環境変数

Vercelの Environment Variables に以下があること。

```env
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_INVITE_CODE=
```

### 2. Supabase Tables

以下が存在すること。

- records
- groups
- group_members
- record_groups

### 3. Supabase Storage

以下が存在すること。

- avatars bucket
- Public bucket: ON

### 4. Realtime

以下をON推奨。

- records
- record_groups
- group_members

### 5. 実機テスト

PCとスマホで確認。

- サイト招待コードで入れる
- Googleログインできる
- ゲスト参加できる
- 記録追加できる
- 記録削除できる
- グループ作成できる
- 招待コードでグループ参加できる
- グループ脱退できる
- Realtime同期される
- 同じ場所の複数ピンがずれる
- メンバー一覧が見える
- 画像変更できる
- メンバー画像に反映される
- iPhone Safariで上部/下部が見切れない

### 6. 身内公開時の注意

- サイト招待コードは身内だけに共有
- URLをSNSに公開しない
- ゲスト参加はお試し用途として扱う
- 本格公開するならRLSをより強化する


### 7. PWA確認

- Vercelにデプロイ後、iPhone Safariで開く
- 共有 → ホーム画面に追加
- ホーム画面から起動
- 上下のSafe Areaが崩れない
- Googleログイン/ゲスト参加できる
- 地図が表示される
- Realtimeが動く
