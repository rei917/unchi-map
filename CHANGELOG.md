# CHANGELOG

## v28 - リリース前整理版

- これまでの個別CHANGEメモをこの `CHANGELOG.md` に統合
- PWAロゴをテーマに合わせたアイコンへ変更
- リリース用ドキュメントを整理
- v27_fixまでの機能をベースに、ファイル構成を見やすく整理

## v27_fix - PWAインストール案内

- モバイルだけ「アプリとして追加」ボタンを表示
- Android ChromeではPWAインストール確認を表示
- iPhone Safariではホーム画面追加の手順モーダルを表示
- PCでは非表示
- 既にPWA起動中なら非表示

## v27 - PWA対応

- PWA manifestを追加
- Service Workerを追加
- iPhone用 apple-touch-iconを追加
- ホーム画面追加向けメタデータを追加
- standalone表示向けCSSを追加

## v26 - リリース準備SQL/チェックリスト

- Supabase/RLS整理用SQLを追加
- 本格RLS化の将来方針を追加
- リリース前チェックリストを追加
- 身内公開向けの運用メモを追加

## v25 - ピン投稿者名の表示改善

- `records.user_name` を直接表示する方式から変更
- 自分の投稿は現在の `user.displayName` を優先
- グループ内メンバーの投稿は `group_members.display_name` を優先
- fallbackとしてのみ `records.user_name` を利用

## v24 - 過去ピン投稿者名の更新

- 表示名変更時に `group_members.display_name` を更新
- 表示名変更時に `records.user_name` も一括更新
- 過去に打ったピンの投稿者名も現在名へ寄せる処理を追加

## v23 - メンバー情報の自動同期

- ログイン/ゲストユーザー情報確定時に `group_members.display_name/avatar_url` を自動同期
- 過去に空で作られていた自分のメンバー行を補正
- メンバー一覧を再取得して表示へ反映

## v22_fix - メンバー画像反映強化

- 画像変更後に `group_members.avatar_url` を更新
- メンバー一覧を再取得
- Header側の再評価処理を追加
- 更新成功/失敗トーストを追加

## v22 - ローカル画像アップロード

- 端末内画像を選択してSupabase Storageへアップロード
- メンバー名がID表示になる問題を補正
- メンバー画像表示を補正
- iPhoneでメンバー一覧が見切れにくい表示へ調整

## v21 - 画像変更とメンバー一覧

- プロフィール画像URL変更
- Google画像よりカスタム画像を優先
- ゲスト画像に対応
- グループメンバー一覧表示
- メンバー画像付き表示

## v20_fix - ゲスト参加修正

- ゲスト参加後にログイン画面へ戻る問題を修正
- ゲスト情報読み込み中の未ログイン判定を回避
- ゲスト名がGoogleログイン後に表示名として残る問題を修正
- 表示名をユーザーID別に保存

## v20 - サイト招待コード・ゲスト参加

- サイト全体の招待コード制を追加
- ゲスト参加を追加
- ゲスト退出を追加
- `NEXT_PUBLIC_SITE_INVITE_CODE` に対応

## v19 - グループピンずらし表示強化

- グループ画面でも複数ピンをずらして表示
- 近い座標を同じ場所扱いし、円状に展開
- DBの座標は変えず表示座標のみ調整

## v18 - record_groups重複対策

- `shareRecordsToGroup()` を `insert` から `upsert(... ignoreDuplicates)` に変更
- `assignRecordToGroup()` も重複に強く修正

## 初期〜v17相当

- Next.js + TypeScript構成
- React Leaflet地図表示
- 現在地表示
- Googleログイン
- Supabase接続
- records/groups/group_members/record_groups DB化
- 招待コード参加
- グループ作成・脱退
- 記録追加・削除
- Realtime同期
- 同一座標ピンのずらし表示
- スマホSafe Area対応
- Leaflet `invalidateSize()` 対応
