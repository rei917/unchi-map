# v18 changes

## 修正内容

`src/lib/storage.ts` の `record_groups` 追加処理を `insert` から `upsert(..., { onConflict: "record_id,group_id", ignoreDuplicates: true })` に変更しました。

対象:

- `assignRecordToGroup()`
- `shareRecordsToGroup()`

## 理由

`insert` だと、既に共有済みの `record_id + group_id` が1件でも含まれる場合、重複エラーで処理全体が失敗する可能性があります。

`upsert` + `ignoreDuplicates` にすることで、既存共有は無視しつつ、未共有の記録だけ安全に追加できます。

## Supabase側で必要な制約

以下が未作成の場合は SQL Editor で実行してください。

```sql
alter table record_groups
add constraint record_groups_record_id_group_id_key
unique (record_id, group_id);
```

既に同等の UNIQUE 制約がある場合は不要です。
