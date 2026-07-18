"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every page (landing, guest, and signed-in)
 * so the offline guest cache in /sw.js actually works for signed-out users.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return null;
}
