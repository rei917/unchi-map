# V26_STRICT_RLS_FUTURE_PLAN

## 現在の限界

現在のアプリは、Supabaseから見るとブラウザのアクセスは基本的に `anon` です。

そのため、RLSで以下を厳密に判定できません。

- この `user_id` が本当に本人か
- このゲストIDが本当にその人のものか
- このユーザーが本当にそのグループに所属しているか

アプリ側ではチェックできますが、DB側で完全防御するには追加設計が必要です。

## 本格公開する場合の選択肢

### 案A: Supabase Authへ統一

Googleログインやゲスト相当の匿名ログインをSupabase Authへ寄せます。

メリット:
- `auth.uid()` が使える
- RLSで本人確認しやすい
- Supabase標準構成

デメリット:
- NextAuthからの移行が必要
- 既存user_idの移行が必要

### 案B: Next.js API Routes経由にする

ブラウザからSupabaseを直接触らず、Next.js API Routeを通します。
API Routeの中でNextAuth sessionを確認し、service_roleでDB操作します。

メリット:
- NextAuthを維持できる
- DB操作をサーバー側で制御できる
- 既存コードを段階的に移行できる

デメリット:
- API実装量が増える
- Realtimeの扱いを少し考える必要がある

## 当面の身内公開なら

- サイト招待コード
- 身内だけにURL共有
- Supabase anon policyはrelease-lite
- 定期的にDBバックアップ
- 不審なデータがないかTable Editorで確認

で十分現実的です。
