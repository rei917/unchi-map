// ============================================================
// app/layout.tsx
// ルートレイアウト
// ============================================================

import type { Metadata, Viewport } from "next";
import "./globals.css";
// Leaflet CSS をグローバルで読み込む
import "leaflet/dist/leaflet.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: "🚽 うんちマップ β",
  description: "友人同士で共有するトイレ記録SNS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthSessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
