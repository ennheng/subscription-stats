"use client";

import Link from "next/link";
import { ServiceIcon } from "../components/ServiceIcon";
import type { DashboardSubscription } from "../lib/guest-subscriptions";
import { findPresetByName } from "../lib/presets";
import {
  computeSpending,
  computeStats,
  daysLeft,
  formatYuan,
} from "../lib/subscriptions";
import { useI18n } from "./I18nProvider";
import { AccountMenu } from "./AccountMenu";
import { LanguageToggle } from "./LanguageToggle";
import { MarkPaidButton } from "./MarkPaidButton";
import { Onboarding } from "./Onboarding";
import { PwaInstall } from "./PwaInstall";
import { SpendingChart } from "./SpendingChart";

interface Props {
  rows: DashboardSubscription[];
  mode?: "cloud" | "guest";
  onGuestChange?: () => void;
  onGuestExport?: () => void;
  onGuestClear?: () => void;
  accountName?: string;
}

export function DashboardView({
  rows,
  mode = "cloud",
  onGuestChange,
  onGuestExport,
  onGuestClear,
  accountName,
}: Props) {
  const { locale, t } = useI18n();
  const stats = computeStats(rows);
  const spending = computeSpending(rows);
  const isGuest = mode === "guest";
  const addHref = isGuest ? "/guest/new" : "/subscriptions/new";

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-14 pt-6 sm:pb-20 sm:pt-10">
      <Onboarding storageScope={mode} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-lg font-bold text-white shadow-[0_8px_20px_rgba(234,88,12,0.25)] ring-1 ring-white/70">
            订
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {t.brandName}
              </h1>
              {isGuest && (
                <span className="rounded-full bg-emerald-100/75 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {t.guestBadge}
                </span>
              )}
            </div>
            <p className="mt-0.5 hidden text-xs text-stone-400 sm:block">{t.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
          <LanguageToggle />
          {!isGuest && accountName && <AccountMenu username={accountName} />}
          {!isGuest && <PwaInstall />}
          {isGuest ? (
            <button
              type="button"
              onClick={onGuestExport}
              className="rounded-full border border-white/80 bg-white/55 px-4 py-2.5 text-stone-600 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:text-stone-900"
            >
              {t.exportCalendar}
            </button>
          ) : (
            <a
              href={`/calendar.ics?lang=${locale}`}
              className="rounded-full border border-white/80 bg-white/55 px-4 py-2.5 text-stone-600 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:text-stone-900"
            >
              {t.exportCalendar}
            </a>
          )}
          <Link
            href={addHref}
            className="rounded-full bg-orange-600 px-4 py-2.5 font-medium text-white shadow-[0_8px_18px_rgba(234,88,12,0.22)] transition-all hover:-translate-y-0.5 hover:bg-orange-500"
          >
            + {t.addSubscription}
          </Link>
        </div>
      </header>

      {isGuest && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/55 bg-emerald-50/55 px-4 py-3 text-xs text-emerald-800">
          <p>{t.guestPrivacy}</p>
          <div className="flex gap-3">
            <button type="button" onClick={onGuestClear} className="font-medium hover:underline">
              {t.clearGuestData}
            </button>
            <Link href="/" className="font-medium hover:underline">
              {t.exitGuest}
            </Link>
          </div>
        </div>
      )}

      <section aria-label={t.subscriptionOverview} className="mt-7 grid grid-cols-3 gap-3">
        <OverviewCard label={t.monthlySpend} badge={locale === "zh-CN" ? "月" : "MO"} value={formatYuan(Math.round(stats.monthlyTotalCents))} hint={t.monthlySpendHint} tone="orange" />
        <OverviewCard label={t.annualTotal} badge={locale === "zh-CN" ? "年" : "YR"} value={formatYuan(Math.round(stats.yearlyTotalCents))} hint={t.annualTotalHint} tone="violet" />
        <OverviewCard
          label={t.attention}
          badge="✓"
          value={stats.overdueCount > 0 ? t.overdueCount(stats.overdueCount) : stats.dueSoonCount > 0 ? t.dueSoonCount(stats.dueSoonCount) : t.normal}
          hint={t.renewalNormal}
          tone="emerald"
          alert={stats.overdueCount > 0 ? "red" : stats.dueSoonCount > 0 ? "amber" : undefined}
        />
      </section>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/65 bg-white/35 px-3.5 py-3 text-xs leading-relaxed text-stone-500 backdrop-blur-xl">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stone-800/8 text-[10px] font-semibold">i</span>
        <p>{isGuest ? t.guestPrivacy : t.calendarHint}</p>
      </div>

      {spending.totalAnnualCents > 0 && (
        <SpendingChart totalAnnualCents={spending.totalAnnualCents} rows={spending.rows} percents={spending.percents} />
      )}

      {rows.length === 0 ? (
        <div className="mt-16 text-center text-stone-400">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 font-medium text-stone-500">{t.emptyTitle}</p>
          <p className="mt-1 text-sm">{t.emptyBody}</p>
        </div>
      ) : (
        <section className="mt-7">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-stone-900">{t.subscriptionList}</h2>
              <p className="mt-0.5 text-xs text-stone-400">{t.sortByRenewal}</p>
            </div>
            <span className="rounded-full border border-white/70 bg-white/45 px-2.5 py-1 text-xs text-stone-500 backdrop-blur-xl">{t.itemCount(rows.length)}</span>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rows.map((sub) => {
              const left = daysLeft(sub.nextDueDate);
              const preset = findPresetByName(sub.name);
              const overdue = left < 0;
              const dueSoon = !overdue && left <= 7;
              return (
                <li key={sub.id} className="relative">
                  <Link
                    href={isGuest ? `/guest/${sub.id}/edit` : `/subscriptions/${sub.id}/edit`}
                    className={`group flex min-h-48 flex-col items-center overflow-hidden rounded-3xl px-4 pb-4 pt-4 text-center backdrop-blur-xl backdrop-saturate-150 transition-all hover:-translate-y-1 hover:shadow-xl ${
                      overdue ? "border border-red-200/70 bg-red-400/12" : dueSoon ? "border border-amber-200/70 bg-amber-400/12" : "border border-white/75 bg-white/55 shadow-[0_10px_34px_rgba(28,25,23,0.055)]"
                    }`}
                  >
                    <ServiceIcon presetId={preset?.id} name={sub.name} color={preset?.color} className="h-16 w-16 text-2xl shadow-[0_10px_24px_rgba(28,25,23,0.12)] ring-1 ring-white/70 transition-transform duration-300 group-hover:scale-105" />
                    <p className="mt-4 w-full truncate font-medium text-stone-900">{sub.name}</p>
                    <p className="mt-1 flex items-baseline gap-1.5 text-stone-500">
                      <span className="text-lg font-semibold tracking-tight text-stone-800">{formatYuan(sub.shareCents)}</span>
                      <span className="text-xs">{t[sub.cycle]}</span>
                    </p>
                    <span className={`mt-auto inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${overdue ? "bg-red-500/15 text-red-700" : dueSoon ? "bg-amber-500/15 text-amber-700" : "bg-white/55 text-stone-500"}`}>
                      {overdue ? t.overdueDays(-left) : left === 0 ? t.renewToday : t.renewInDays(left)}
                    </span>
                  </Link>
                  <div className="absolute right-3.5 top-3.5">
                    <MarkPaidButton id={sub.id} name={sub.name} compact mode={mode} onGuestPaid={onGuestChange} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function OverviewCard({
  label,
  badge,
  value,
  hint,
  tone,
  alert,
}: {
  label: string;
  badge: string;
  value: string;
  hint: string;
  tone: "orange" | "violet" | "emerald";
  alert?: "red" | "amber";
}) {
  const toneClass = {
    orange: "bg-orange-100/80 text-orange-700",
    violet: "bg-violet-100/80 text-violet-700",
    emerald: "bg-emerald-100/80 text-emerald-700",
  }[tone];
  return (
    <div className="glass relative overflow-hidden rounded-3xl px-4 py-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <span className={`flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-[10px] font-semibold ${toneClass}`}>{badge}</span>
      </div>
      <p className={`mt-3 text-xl font-semibold tracking-[-0.03em] sm:text-2xl ${alert === "red" ? "text-red-600" : alert === "amber" ? "text-amber-600" : "text-stone-900"}`}>{value}</p>
      <p className="mt-1 hidden text-[11px] text-stone-400 sm:block">{hint}</p>
    </div>
  );
}
