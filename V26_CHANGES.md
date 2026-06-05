# V26_CHANGES

## 目的

v26は「リリース前のSupabase/RLS整理」と「身内公開前チェック」をまとめたバージョンです。

コードの大きな挙動変更は入れていません。
理由は、現在のアプリが以下の構成だからです。

- 認証: NextAuth Googleログイン + ゲスト参加
- DB接続: ブラウザから Supabase anon key
- ユーザーID: アプリ側で `user_id` として保存

この構成では、Supabase側からは基本的に全アクセスが `anon` に見えます。
そのため、Supabase RLSだけで「本当にこのuser_id本人か」を厳密に判定することはできません。

## 重要な結論

今すぐ身内リリースするなら、

- サイト招待コード
- Googleログイン/ゲスト参加
- Vercel公開URLを身内だけに共有
- Supabase policyは開発より少し整理
- 不特定多数にURLをばらまかない

の方針で十分現実的です。

より本格的なセキュリティにするなら、v28以降で以下のどちらかが必要です。

1. Supabase Authへ統一する
2. Next.js API Routes経由でSupabase service_roleをサーバー側だけで使う

## 追加ファイル

- `supabase/V26_RELEASE_LITE_POLICIES.sql`
- `supabase/V26_STRICT_RLS_FUTURE_PLAN.md`
- `RELEASE_CHECKLIST.md`

## v28までのおすすめロードマップ

### v26
RLS/SQL整理、リリース前チェック

### v27
PWA対応、iPhoneホーム画面追加向け調整

### v28
リリース前UI微調整、説明文、使い方、エラー表示整理
