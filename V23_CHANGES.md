# V23_CHANGES

## 修正内容

### group_members の表示名・画像を自動同期

ログイン/ゲストユーザー情報が確定したタイミングで、

```ts
updateUserMembershipProfile(user.id, user.displayName, user.image)
```

を自動実行するようにしました。

これにより、過去に `group_members.display_name` や `avatar_url` が空のまま作成された行も、
アプリを開いたタイミングで現在ユーザー分は補正されます。

## 直る想定の症状

- メンバーリストがIDや名無しさんになる
- 自分の画像を変えてもメンバーリストに反映されない
- `group_members.avatar_url` がNULLのままになる

## 注意

他人の行は、そのユーザー本人がアプリを開いたタイミングで補正されます。
管理者が一括補正したい場合は、Supabase SQLで手動更新が必要です。

## 必要SQL

```sql
alter table group_members
add column if not exists avatar_url text;
```

Storageの `avatars` bucket とPolicyもv22と同じく必要です。

## 確認SQL

```sql
select user_id, display_name, avatar_url
from group_members
order by joined_at desc;
```
