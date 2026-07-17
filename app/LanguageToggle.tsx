"use client";

import { LOCALE_COOKIE } from "../lib/i18n";
import { useI18n } from "./I18nProvider";

export function LanguageToggle() {
  const { locale, t } = useI18n();

  function toggle() {
    const next = locale === "zh-CN" ? "en" : "zh-CN";
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-white/80 bg-white/55 px-3 py-2.5 text-stone-600 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:text-stone-900"
      aria-label={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
    >
      {t.language}
    </button>
  );
}
