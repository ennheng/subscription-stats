"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function MarkPaidButton({
  id,
  name,
  compact = false,
}: {
  id: number;
  name: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function markPaid() {
    if (!window.confirm(`确认已支付「${name}」本期费用?到期日将顺延一个周期。`)) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/subscriptions/${id}/pay`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(body?.error ?? "操作失败,请重试");
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
        title="标记已付"
        aria-label="标记已付"
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
      {pending ? "处理中…" : "标记已付"}
    </button>
  );
}
