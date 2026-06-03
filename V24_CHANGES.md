# V24_CHANGES

## 修正内容

### 過去ピンの投稿者名を現在の表示名へ同期

表示名変更時に、以下を同時に実行するようにしました。

1. ローカル表示名の更新
2. `group_members.display_name` の更新
3. `records.user_name` の一括更新

これにより、これまでに打ったピンの投稿者名も現在の表示名に変わります。

## 追加関数

`src/lib/storage.ts`

```ts
updateUserRecordNames(userId, displayName)
```

対象:

```sql
records
where user_id = currentUserId
```

更新内容:

```sql
user_name = 新しい表示名
```

## 注意

この仕様では、過去投稿の名前もすべて現在の名前に統一されます。
過去の名前を履歴として残す仕様ではありません。
