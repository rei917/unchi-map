# Unchi Map v21

## 追加内容

### 1. プロフィール画像変更

ユーザーメニューに「画像」セクションを追加しました。
画像URLを入力すると、ヘッダーアバターとグループメンバー一覧に反映されます。

- Googleユーザー: Google画像よりカスタム画像を優先
- ゲストユーザー: 入力した画像URLを利用
- 画像の保存先: localStorage + group_members.avatar_url

### 2. グループメンバー表示

通常グループ選択時に「👥 メンバー」ボタンを追加しました。
クリックすると、group_members のメンバー一覧を画像つきで表示します。

### 3. DB互換性

`group_members.avatar_url` カラムが未追加でも、表示名だけで動くようにフォールバックを入れています。
画像つきメンバー表示を使う場合は、下記SQLを実行してください。

```sql
alter table group_members
add column if not exists avatar_url text;
```

Realtimeでメンバー一覧も更新したい場合は、Supabase Dashboard の Publications で `group_members` を有効にしてください。

```sql
alter publication supabase_realtime add table group_members;
```

すでに追加済みの場合、このSQLはエラーになることがあります。その場合は無視してOKです。

## 変更ファイル

- src/types/index.ts
- src/hooks/useCurrentUser.ts
- src/hooks/useGroups.ts
- src/hooks/useGroupMembers.ts
- src/lib/storage.ts
- src/components/ui/UserMenu.tsx
- src/components/ui/Header.tsx
- src/app/page.tsx
- src/app/globals.css
