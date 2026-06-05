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
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "🚽 うんちマップ β",
  description: "友人同士で共有するトイレ記録SNS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "うんちマップ",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
          <ToastProvider>
            <ServiceWorkerRegister />
            {children}
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
