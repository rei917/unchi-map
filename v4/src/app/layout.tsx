// ============================================================
// app/layout.tsx
// ルートレイアウト
// ============================================================

import type { Metadata, Viewport } from "next";
import "./globals.css";
// Leaflet CSS をグローバルで読み込む
import "leaflet/dist/leaflet.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "🚽 うんちマップ β",
  description: "友人同士で共有するトイレ記録SNS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
