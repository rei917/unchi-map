// ============================================================
// app/api/auth/[...nextauth]/route.ts
// NextAuth.js の API ルート
// Google OAuth プロバイダーを設定
// ============================================================

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // セッションは JWT で管理（DB不要）
  session: {
    strategy: "jwt",
  },

  callbacks: {
    // JWT にユーザー情報を追加
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // セッションに JWT の情報を反映
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },

  // カスタムページ
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
