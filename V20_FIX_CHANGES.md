# v20_fix changes

## Fixed guest join redirect loop

`useCurrentUser()` now waits until localStorage guest state has been loaded before returning `user: null`.
Previously, guest join saved the guest user but the home page evaluated auth before the hook had read localStorage, so it redirected back to `/login`.

## Fixed guest name leaking into Google login

Display names are now stored per user ID:

- `unchi-map-display-name:<google-user-id>` for Google users
- `unchi-map-display-name:<guest-id>` for guest users

`login/page.tsx` no longer writes the old global `unchi-map-display-name` when creating a guest.

## Notes

If an old browser already has `unchi-map-display-name` from v20, it is no longer used for new Google sessions.
Guest sign-out removes the guest user and per-guest display name.
