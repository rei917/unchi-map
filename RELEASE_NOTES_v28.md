# RELEASE_NOTES_v28

## v28の位置づけ

v28は、身内向けリリース直前の整理版です。

主な目的:

- PWA対応済みの状態を維持
- ロゴをテーマに合わせて更新
- チェンジログを統合
- リリース時に見るファイルを整理

## リリース前に確認すること

1. Vercelへデプロイ
2. iPhone Safariでホーム画面追加
3. Android Chromeでホーム画面追加/アプリインストール
4. Googleログイン
5. ゲスト参加
6. グループ作成
7. 招待コード参加
8. 記録追加/削除
9. Realtime同期
10. メンバー画像変更
11. メンバー一覧
12. 同じ場所のピンずらし表示

## Supabaseで確認すること

- records
- groups
- group_members
- record_groups
- avatars Storage bucket
- Realtime: records / record_groups / group_members

## 注意

現在のRLSは身内公開向けです。
不特定多数に公開する場合は、Next.js API Routes化またはSupabase Auth移行を検討してください。
