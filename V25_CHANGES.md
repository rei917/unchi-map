# V25_CHANGES

## 修正内容

### ピンの投稿者名を現在プロフィールから表示

これまでピンの投稿者名は `records.user_name` を表示していました。

しかし `records.user_name` は「投稿時点の名前」のため、同じ `user_id` でも過去投稿に

- れい
- rei_kmikaze
- 神風邪儡異

のように複数の名前が混ざることがありました。

v25では、表示時に以下の優先順位で投稿者名を解決します。

1. 自分の投稿なら `currentUser.displayName`
2. 同じグループのメンバーなら `group_members.display_name`
3. どちらも取れない場合だけ `records.user_name`

これにより、過去ピンの表示名も現在のプロフィール名に寄ります。

## 注意

`records.user_name` 自体は互換性のため残しています。
ただし画面表示では直接使わない方針です。

将来的には、ピンの投稿者画像も同じ考え方で

- currentUser.image
- group_members.avatar_url

から解決するのが自然です。
