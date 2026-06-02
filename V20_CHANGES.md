# v20 changes

## Implemented

- サイト招待コード制
  - 初回ログイン画面で `NEXT_PUBLIC_SITE_INVITE_CODE` を要求
  - 成功後は `localStorage` に承認済みフラグを保存
  - デフォルト値は `UNCHI-7Q2M`

- ゲスト参加
  - Googleログインなしでゲスト名を入力して参加可能
  - `guest_<uuid>` 形式のユーザーIDを生成
  - 既存の records / groups / group_members の `user_id` として利用
  - ゲスト退出時はゲスト情報をlocalStorageから削除

## Environment variable

```env
NEXT_PUBLIC_SITE_INVITE_CODE=UNCHI-7Q2M
```

Vercelにも同じ環境変数を追加してください。

## Future ideas

### Avatar image change

候補:

1. Googleアカウント画像をそのまま使う
2. ゲスト/Google共通で `profiles` テーブルを作る
3. Supabase Storage に画像アップロード
4. `profiles.avatar_url` をUserMenuで表示

推奨テーブル:

```sql
create table if not exists profiles (
  user_id text primary key,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);
```

### Group member list

`group_members` を `group_id` で取得して、グループメンバー一覧モーダルを表示する。

```sql
select user_id, display_name, joined_at
from group_members
where group_id = '<group_id>'
order by joined_at asc;
```

実装候補:

- Headerに「メンバー」ボタン
- GroupMembersModal.tsx を追加
- group_members.display_name を表示
