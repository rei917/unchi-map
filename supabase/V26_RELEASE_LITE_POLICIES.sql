-- ============================================================
-- V26_RELEASE_LITE_POLICIES.sql
-- うんちマップ 身内リリース向け Supabase policy整理
-- ============================================================
--
-- 注意:
-- 現在のアプリは NextAuth/ゲスト認証をアプリ側で管理し、
-- Supabaseには anon key でアクセスしています。
--
-- そのため、Supabase RLSだけでは
-- 「この user_id が本当に本人か」を厳密には検証できません。
--
-- このSQLは「身内リリース用に壊れにくく整理したpolicy」です。
-- 完全な公開サービス用のセキュリティではありません。
--
-- policy名が重複する場合は、既存policyを確認して調整してください。
-- ============================================================

alter table records enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table record_groups enable row level security;

alter table group_members
add column if not exists avatar_url text;

-- records
create policy if not exists "Allow select records"
on records for select to anon using (true);

create policy if not exists "Allow insert records"
on records for insert to anon with check (true);

create policy if not exists "Allow update records"
on records for update to anon using (true) with check (true);

create policy if not exists "Allow delete records"
on records for delete to anon using (true);

-- groups
create policy if not exists "Allow select groups"
on groups for select to anon using (true);

create policy if not exists "Allow insert groups"
on groups for insert to anon with check (true);

create policy if not exists "Allow update groups"
on groups for update to anon using (true) with check (true);

create policy if not exists "Allow delete groups"
on groups for delete to anon using (true);

-- group_members
create policy if not exists "Allow select group_members"
on group_members for select to anon using (true);

create policy if not exists "Allow insert group_members"
on group_members for insert to anon with check (true);

create policy if not exists "Allow update group_members"
on group_members for update to anon using (true) with check (true);

create policy if not exists "Allow delete group_members"
on group_members for delete to anon using (true);

-- record_groups
create policy if not exists "Allow select record_groups"
on record_groups for select to anon using (true);

create policy if not exists "Allow insert record_groups"
on record_groups for insert to anon with check (true);

create policy if not exists "Allow update record_groups"
on record_groups for update to anon using (true) with check (true);

create policy if not exists "Allow delete record_groups"
on record_groups for delete to anon using (true);

-- 重複共有防止
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'record_groups_record_id_group_id_key'
  ) then
    alter table record_groups
    add constraint record_groups_record_id_group_id_key
    unique (record_id, group_id);
  end if;
end $$;

-- Storage: avatars
-- avatars bucket はDashboardから作成:
-- Storage -> New bucket -> avatars -> Public bucket ON

create policy if not exists "Allow public read avatars"
on storage.objects for select to anon
using (bucket_id = 'avatars');

create policy if not exists "Allow upload avatars"
on storage.objects for insert to anon
with check (bucket_id = 'avatars');

create policy if not exists "Allow update avatars"
on storage.objects for update to anon
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

-- 確認用
-- select * from pg_policies where schemaname = 'public';
-- select user_id, display_name, avatar_url from group_members;
-- select user_id, user_name, count(*) from records group by user_id, user_name;
