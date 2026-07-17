"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Platform = "android" | "ios" | "other";

const emptySubscribe = () => () => {};
const getServerStandaloneSnapshot = () => false;
const getServerPlatformSnapshot = (): Platform => "other";

function getStandaloneSnapshot() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function subscribeStandalone(onStoreChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onStoreChange);
  window.addEventListener("appinstalled", onStoreChange);
  return () => {
    media.removeEventListener("change", onStoreChange);
    window.removeEventListener("appinstalled", onStoreChange);
  };
}

function getPlatformSnapshot(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  return "other";
}

export function PwaInstall() {
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getServerStandaloneSnapshot,
  );
  const platform = useSyncExternalStore(
    emptySubscribe,
    getPlatformSnapshot,
    getServerPlatformSnapshot,
  );
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    function handleInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setShowGuide(false);
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setShowGuide(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  if (standalone) return null;

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="rounded-full border border-white/80 bg-white/55 px-3 py-2.5 text-stone-600 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:text-stone-900"
        aria-label="安装合租订阅应用"
      >
        ↓ 安装
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/35 p-3 backdrop-blur-sm sm:items-center" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-guide-title"
            className="glass-strong w-full max-w-sm rounded-[28px] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-orange-600">三端共用同一套数据</p>
                <h2 id="install-guide-title" className="mt-1 text-xl font-semibold tracking-tight text-stone-900">
                  安装到你的设备
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg text-stone-400 transition-colors hover:bg-white hover:text-stone-700"
                aria-label="关闭安装说明"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {(platform === "ios" || platform === "other") && (
                <div className="rounded-2xl border border-white/70 bg-white/55 p-4">
                  <p className="font-semibold text-stone-800">iPhone / iPad</p>
                  <p className="mt-1.5 leading-relaxed text-stone-500">
                    用 Safari 打开本站，点底部「分享」按钮，再选择「添加到主屏幕」。
                  </p>
                </div>
              )}
              {(platform === "android" || platform === "other") && (
                <div className="rounded-2xl border border-white/70 bg-white/55 p-4">
                  <p className="font-semibold text-stone-800">Android</p>
                  <p className="mt-1.5 leading-relaxed text-stone-500">
                    用 Chrome 打开本站，点右上角菜单，再选择「安装应用」或「添加到主屏幕」。
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-stone-400">
              安装后会像普通 App 一样从桌面启动；网页端仍可直接使用。
            </p>
          </section>
        </div>
      )}
    </>
  );
}
