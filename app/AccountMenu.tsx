"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useI18n } from "./I18nProvider";

export function AccountMenu({ username }: { username: string }) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    window.location.assign("/");
  }

  async function deleteAccount() {
    if (!window.confirm(t.deleteAccountConfirm)) return;
    const password = window.prompt(t.enterPasswordToDelete);
    if (!password) return;
    setPending(true);
    const result = await authClient.deleteUser({ password });
    if (result.error) {
      window.alert(t.deleteAccountFailed);
      setPending(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-2.5 text-xs text-stone-600 shadow-sm backdrop-blur-xl"
      >
        <span className="max-w-24 truncate" title={username}>@{username}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-white/90 bg-white/95 p-1.5 text-sm shadow-[0_18px_55px_rgba(41,37,36,0.16)] backdrop-blur-xl">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{t.account}</p>
          <a href="/api/export" download className="block rounded-xl px-3 py-2.5 text-stone-700 hover:bg-stone-100">{t.exportData}</a>
          <Link href="/privacy" className="block rounded-xl px-3 py-2.5 text-stone-700 hover:bg-stone-100">{t.privacyPolicy}</Link>
          <button type="button" disabled={pending} onClick={signOut} className="block w-full rounded-xl px-3 py-2.5 text-left text-stone-700 hover:bg-stone-100 disabled:opacity-50">{pending ? t.signingOut : t.signOut}</button>
          <button type="button" disabled={pending} onClick={deleteAccount} className="block w-full rounded-xl px-3 py-2.5 text-left text-red-600 hover:bg-red-50 disabled:opacity-50">{t.deleteAccount}</button>
        </div>
      )}
    </div>
  );
}
