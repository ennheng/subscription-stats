"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUBSCRIPTION_PRESETS } from "../../lib/presets";
import {
  isValidDateString,
  parseYuan,
  type Cycle,
} from "../../lib/subscriptions";
import {
  deleteGuestSubscription,
  saveGuestSubscription,
} from "../../lib/guest-subscriptions";
import { ServiceIcon } from "../../components/ServiceIcon";
import { useI18n } from "../I18nProvider";

export interface SubscriptionFormInitial {
  name: string;
  ownerContact: string;
  totalPrice: string;
  share: string;
  cycle: Cycle;
  nextDueDate: string;
  note: string;
}

interface Props {
  mode: "create" | "edit";
  subscriptionId?: number;
  initial?: Partial<SubscriptionFormInitial>;
  storageMode?: "cloud" | "guest";
}

const inputClass =
  "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition-colors placeholder:text-stone-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export function SubscriptionForm({
  mode,
  subscriptionId,
  initial,
  storageMode = "cloud",
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [form, setForm] = useState<SubscriptionFormInitial>({
    name: initial?.name ?? "",
    ownerContact: initial?.ownerContact ?? "",
    totalPrice: initial?.totalPrice ?? "",
    share: initial?.share ?? "",
    cycle: initial?.cycle ?? "yearly",
    nextDueDate: initial?.nextDueDate ?? "",
    note: initial?.note ?? "",
  });
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  function selectPreset(id: string | null) {
    setSelectedPreset(id);
    if (id === null) return;
    const preset = SUBSCRIPTION_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setForm((prev) => ({ ...prev, name: preset.name, cycle: preset.cycle }));
  }

  function update<K extends keyof SubscriptionFormInitial>(
    key: K,
    value: SubscriptionFormInitial[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onDelete() {
    if (!window.confirm(t.deleteConfirm(form.name))) return;
    if (!window.confirm(t.deleteFinalConfirm)) return;

    setDeleting(true);
    setError(null);
    try {
      if (storageMode === "guest") {
        if (subscriptionId !== undefined) deleteGuestSubscription(subscriptionId);
        window.location.replace("/guest");
        return;
      }
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
        headers: { "Accept-Language": locale },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? t.deleteFailed);
        return;
      }
      window.location.replace("/");
    } finally {
      setDeleting(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (storageMode === "guest") {
        const totalPriceCents = form.totalPrice.trim() ? parseYuan(form.totalPrice) : null;
        const shareCents = parseYuan(form.share);
        if (!form.name.trim()) return setError(t.invalidName);
        if (form.totalPrice.trim() && (totalPriceCents === null || totalPriceCents < 0)) {
          return setError(t.invalidTotalPrice);
        }
        if (shareCents === null || shareCents < 0) return setError(t.invalidShare);
        if (!isValidDateString(form.nextDueDate)) return setError(t.invalidDate);
        const saved = saveGuestSubscription(
          {
            name: form.name.trim(),
            ownerContact: form.ownerContact.trim(),
            totalPriceCents,
            shareCents,
            cycle: form.cycle,
            nextDueDate: form.nextDueDate,
            note: form.note.trim(),
          },
          mode === "edit" ? subscriptionId : undefined,
        );
        if (!saved) return setError(t.saveFailed);
        window.location.replace("/guest");
        return;
      }
      const url =
        mode === "create" ? "/api/subscriptions" : `/api/subscriptions/${subscriptionId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "Accept-Language": locale },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? t.saveFailed);
        return;
      }
      window.location.replace("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {mode === "create" && (
        <div className="text-sm font-medium text-stone-700">
          {t.commonSubscriptions}
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {SUBSCRIPTION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-xs transition-all ${
                  selectedPreset === preset.id
                    ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                }`}
              >
                <ServiceIcon
                  presetId={preset.id}
                  name={preset.name}
                  color={preset.color}
                  className="h-8 w-8 text-base"
                />
                <span className="w-full truncate text-center text-stone-600">
                  {preset.name}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectPreset(null)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-xs transition-all ${
                selectedPreset === null && form.name
                  ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                  : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-300 text-base text-white">
                ＋
              </span>
              <span className="w-full truncate text-center text-stone-600">{t.custom}</span>
            </button>
          </div>
        </div>
      )}

      <label className="block text-sm font-medium text-stone-700">
        {t.subscriptionName}
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder={t.subscriptionNamePlaceholder}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-stone-700">
        {t.ownerContact}
        <input
          value={form.ownerContact}
          onChange={(e) => update("ownerContact", e.target.value)}
          placeholder={t.ownerContactPlaceholder}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          {t.totalPrice}<span className="ml-1 text-xs text-neutral-400">{t.optional}</span>
          <input
            inputMode="decimal"
            value={form.totalPrice}
            onChange={(e) => update("totalPrice", e.target.value)}
            placeholder="如 68"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t.sharePrice}
          <input
            required
            inputMode="decimal"
            value={form.share}
            onChange={(e) => update("share", e.target.value)}
            placeholder="如 17"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          {t.paymentCycle}
          <select
            value={form.cycle}
            onChange={(e) => update("cycle", e.target.value as Cycle)}
            className={inputClass}
          >
            {(["monthly", "quarterly", "yearly"] as Cycle[]).map((cycle) => (
              <option key={cycle} value={cycle}>
                {t[cycle]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t.nextDueDate}
          <input
            required
            type="date"
            value={form.nextDueDate}
            onChange={(e) => update("nextDueDate", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-stone-700">
        {t.note}
        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder={t.notePlaceholder}
          rows={3}
          className={inputClass}
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-500 disabled:opacity-50"
        >
          {pending ? t.saving : t.save}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-stone-500 transition-colors hover:text-stone-700"
        >
          {t.cancel}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto text-sm text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? t.deleting : t.deleteSubscription}
          </button>
        )}
      </div>
    </form>
  );
}
