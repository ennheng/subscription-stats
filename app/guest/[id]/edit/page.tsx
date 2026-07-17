"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import {
  getGuestServerSnapshot,
  getGuestSnapshot,
  parseGuestSnapshot,
  subscribeGuestSubscriptions,
} from "../../../../lib/guest-subscriptions";
import { LanguageToggle } from "../../../LanguageToggle";
import { useI18n } from "../../../I18nProvider";
import { SubscriptionForm } from "../../../subscriptions/SubscriptionForm";

const emptySubscribe = () => () => {};

function centsToYuan(cents: number | null) {
  if (cents === null) return "";
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function EditGuestSubscriptionPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const snapshot = useSyncExternalStore(
    subscribeGuestSubscriptions,
    getGuestSnapshot,
    getGuestServerSnapshot,
  );
  const subscription = useMemo(
    () => parseGuestSnapshot(snapshot).find((row) => row.id === id),
    [id, snapshot],
  );

  if (!hydrated) return null;
  if (!subscription) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/guest" className="text-sm text-stone-500">← {t.back}</Link>
        <p className="mt-8 text-stone-600">{t.notFound}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/guest" className="text-sm text-stone-400 hover:text-stone-700">← {t.back}</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{t.guestEdit}</h1>
        </div>
        <LanguageToggle />
      </div>
      <SubscriptionForm
        mode="edit"
        storageMode="guest"
        subscriptionId={subscription.id}
        initial={{
          name: subscription.name,
          ownerContact: subscription.ownerContact,
          totalPrice: centsToYuan(subscription.totalPriceCents),
          share: centsToYuan(subscription.shareCents),
          cycle: subscription.cycle,
          nextDueDate: subscription.nextDueDate,
          note: subscription.note,
        }}
      />
    </main>
  );
}
