# V22_FIX_CHANGES

## 修正内容

### メンバーリストの画像反映を強化

画像変更後に以下を確実に行うようにしました。

1. ヘッダーの自分の画像を即時更新
2. `group_members.avatar_url` をSupabaseで更新
3. 現在表示中のメンバー一覧を `refetchMembers()` で再取得
4. Headerを安全に再評価させるため `memberProfileVersion` を追加
5. 成功/失敗トーストを表示

### updateUserMembershipProfileの確認強化

`group_members` 更新時に `.select("id")` を付け、更新件数をログに出すようにしました。
これにより、画像が反映されない場合に「対象行が更新されているか」を確認しやすくしています。

## Supabase側で必要なもの

```sql
alter table group_members
add column if not exists avatar_url text;
```

Storage:
- `avatars` bucket
- Public bucket ON
- storage.objects の select / insert / update policy

## Realtime

別端末にもメンバー画像更新を即時反映したい場合は、
`group_members` の Realtime をONにしてください。
