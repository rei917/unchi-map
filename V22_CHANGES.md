# V22_CHANGES

## 追加・修正内容

### 1. ローカル画像からプロフィール画像を変更

ユーザーメニューの画像変更を、URL入力から端末内画像の選択に変更しました。

流れ:

1. ユーザーメニューを開く
2. 「画像を変更」
3. 端末から画像を選択
4. Supabase Storage の `avatars` バケットへアップロード
5. 公開URLを取得
6. `group_members.avatar_url` とローカル表示に反映

### 2. メンバー表示名の改善

`group_members.display_name` が空、または user_id がそのまま入っている場合、
`records.user_name` から名前を補完するようにしました。

これにより、メンバー一覧がID表示になりにくくなります。

### 3. メンバー画像の表示改善

- `group_members.avatar_url` を優先表示
- 現在ログイン中ユーザーは `user.image` をフォールバック表示
- 画像がない場合は名前の頭文字を表示

### 4. iPhoneでメンバー名が見切れる問題を改善

スマホ幅ではメンバー一覧を画面下部の固定パネル寄りに表示し、
横幅を `100vw` 内に収めるようにしました。

---

## Supabaseで必要な作業

### group_membersにavatar_urlカラムを追加

```sql
alter table group_members
add column if not exists avatar_url text;
```

### Storage bucketを作成

Supabase Dashboard:

Storage
→ New bucket
→ `avatars`
→ Public bucket を ON

身内向け・試作段階ではPublic bucketでOKです。

### Storage policy例

StorageのPoliciesでうまくアップロードできない場合は、
SQL Editorで以下を実行してください。

```sql
create policy "Allow public read avatars"
on storage.objects
for select
to anon
using (bucket_id = 'avatars');

create policy "Allow upload avatars"
on storage.objects
for insert
to anon
with check (bucket_id = 'avatars');

create policy "Allow update avatars"
on storage.objects
for update
to anon
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');
```

開発用の緩め設定です。
本番化する場合は user_id とファイルパスを照合するポリシーに強化してください。

---

## 変更ファイル

- `src/components/ui/UserMenu.tsx`
- `src/components/ui/Header.tsx`
- `src/lib/storage.ts`
- `src/app/globals.css`
