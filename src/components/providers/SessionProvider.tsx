// ============================================================
// components/providers/SessionProvider.tsx
// NextAuth の SessionProvider を "use client" でラップ
// app/layout.tsx（Server Component）から利用するため
// ============================================================

"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
