"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUBSCRIPTION_PRESETS } from "../../lib/presets";
import { CYCLE_LABELS, type Cycle } from "../../lib/subscriptions";
import { ServiceIcon } from "../../components/ServiceIcon";

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
}

const inputClass =
  "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition-colors placeholder:text-stone-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export function SubscriptionForm({ mode, subscriptionId, initial }: Props) {
  const router = useRouter();
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
    if (!window.confirm(`确认删除「${form.name}」?`)) return;
    if (!window.confirm("删除后无法恢复,其付款记录也会一并清除。仍要删除吗?")) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "删除失败,请重试");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const url =
        mode === "create" ? "/api/subscriptions" : `/api/subscriptions/${subscriptionId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "保存失败,请重试");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {mode === "create" && (
        <div className="text-sm font-medium text-stone-700">
          常见订阅
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
              <span className="w-full truncate text-center text-stone-600">自定义</span>
            </button>
          </div>
        </div>
      )}

      <label className="block text-sm font-medium text-stone-700">
        订阅名称
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="如 Netflix"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-stone-700">
        车主联系方式
        <input
          value={form.ownerContact}
          onChange={(e) => update("ownerContact", e.target.value)}
          placeholder="如 微信-小明"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          总价(¥/期)<span className="ml-1 text-xs text-neutral-400">选填</span>
          <input
            inputMode="decimal"
            value={form.totalPrice}
            onChange={(e) => update("totalPrice", e.target.value)}
            placeholder="如 68"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          我的份额(¥/期)
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
          付款周期
          <select
            value={form.cycle}
            onChange={(e) => update("cycle", e.target.value as Cycle)}
            className={inputClass}
          >
            {(Object.keys(CYCLE_LABELS) as Cycle[]).map((cycle) => (
              <option key={cycle} value={cycle}>
                {CYCLE_LABELS[cycle]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-stone-700">
          下次到期日
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
        备注
        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="账号信息、车位备注等"
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
          {pending ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-stone-500 transition-colors hover:text-stone-700"
        >
          取消
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto text-sm text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "删除中…" : "删除订阅"}
          </button>
        )}
      </div>
    </form>
  );
}
