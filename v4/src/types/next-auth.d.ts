// ============================================================
// types/next-auth.d.ts
// NextAuth のセッション型を拡張
// ============================================================

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
