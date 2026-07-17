"use client";

import Link from "next/link";
import { LanguageToggle } from "../../LanguageToggle";
import { useI18n } from "../../I18nProvider";
import { SubscriptionForm } from "../../subscriptions/SubscriptionForm";

export default function NewGuestSubscriptionPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/guest" className="text-sm text-stone-400 hover:text-stone-700">← {t.back}</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{t.guestAdd}</h1>
        </div>
        <LanguageToggle />
      </div>
      <SubscriptionForm mode="create" storageMode="guest" />
    </main>
  );
}
