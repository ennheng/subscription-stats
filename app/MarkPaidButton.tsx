"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { markGuestSubscriptionPaid } from "../lib/guest-subscriptions";
import { useI18n } from "./I18nProvider";

export function MarkPaidButton({
  id,
  name,
  compact = false,
  mode = "cloud",
  onGuestPaid,
}: {
  id: number;
  name: string;
  compact?: boolean;
  mode?: "cloud" | "guest";
  onGuestPaid?: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [pending, setPending] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function markPaid() {
    if (!window.confirm(t.paidConfirm(name))) {
      return;
    }
    setPending(true);
    try {
      if (mode === "guest") {
        if (!markGuestSubscriptionPaid(id)) {
          window.alert(t.actionFailed);
          return;
        }
        setJustPaid(true);
        timer.current = setTimeout(() => {
          setJustPaid(false);
          onGuestPaid?.();
        }, 600);
        return;
      }
      const res = await fetch(`/api/subscriptions/${id}/pay`, {
        method: "POST",
        headers: { "Accept-Language": locale },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(body?.error ?? t.actionFailed);
        return;
      }
      if (compact) {
        setJustPaid(true);
        timer.current = setTimeout(() => {
          setJustPaid(false);
          router.refresh();
        }, 1200);
      } else {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={markPaid}
        disabled={pending}
        title={t.markPaid}
        aria-label={t.markPaid}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm shadow-sm backdrop-blur-xl transition-all hover:scale-105 disabled:opacity-50 ${
          justPaid
            ? "border-green-400 bg-green-500 text-white"
            : "border-white/80 bg-white/70 text-stone-400 hover:bg-white hover:text-emerald-600"
        }`}
      >
        {justPaid ? "✓" : pending ? "…" : "✓"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={markPaid}
      disabled={pending}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
    >
      {pending ? t.processing : t.markPaid}
    </button>
  );
}
