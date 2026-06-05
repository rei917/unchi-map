"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Platform = "ios" | "android" | "desktop" | "unknown";

function getPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";

  const ua = window.navigator.userAgent.toLowerCase();
  const isTouchMac =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;

  if (/iphone|ipad|ipod/.test(ua) || isTouchMac) return "ios";
  if (/android/.test(ua)) return "android";

  const isMobile =
    /mobile|windows phone|blackberry|opera mini|iemobile/.test(ua) ||
    window.innerWidth <= 768;

  return isMobile ? "unknown" : "desktop";
}

function isStandalone() {
  if (typeof window === "undefined") return false;

  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return standaloneMedia || iosStandalone;
}

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    setPlatform(getPlatform());
    setInstalled(isStandalone());

    const dismissedValue = localStorage.getItem("unchi-map-install-dismissed");
    setDismissed(dismissedValue === "true");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem("unchi-map-install-dismissed", "true");
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (installed || dismissed) return false;
    if (platform === "desktop") return false;
    if (platform === "android") return Boolean(deferredPrompt);
    if (platform === "ios") return true;
    return false;
  }, [installed, dismissed, platform, deferredPrompt]);

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem("unchi-map-install-dismissed", "true");
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("unchi-map-install-dismissed", "true");
    setDismissed(true);
    setShowIosGuide(false);
  };

  if (!shouldShow) return null;

  return (
    <>
      <div className="install-prompt">
        <div className="install-prompt-text">
          <span className="install-prompt-title">🚽 アプリとして追加</span>
          <span className="install-prompt-subtitle">
            {platform === "ios"
              ? "ホーム画面に追加すると使いやすくなります"
              : "ホーム画面に追加できます"}
          </span>
        </div>
        <div className="install-prompt-actions">
          <button className="install-prompt-button" onClick={handleInstall}>
            追加
          </button>
          <button className="install-prompt-close" onClick={handleDismiss} aria-label="閉じる">
            ×
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="install-guide-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="install-guide-card" onClick={(e) => e.stopPropagation()}>
            <h2>iPhoneでホーム画面に追加</h2>
            <ol>
              <li>Safari下部の共有ボタン <strong>□↑</strong> を押す</li>
              <li><strong>ホーム画面に追加</strong> を選ぶ</li>
              <li><strong>追加</strong> を押す</li>
            </ol>
            <p>追加後はホーム画面からアプリのように起動できます。</p>
            <button className="install-guide-ok" onClick={() => setShowIosGuide(false)}>
              OK
            </button>
            <button className="install-guide-dont-show" onClick={handleDismiss}>
              今後表示しない
            </button>
          </div>
        </div>
      )}
    </>
  );
}
