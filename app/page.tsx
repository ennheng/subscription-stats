import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../db";
import { payments, subscriptions } from "../db/schema";
import { findPresetByName } from "../lib/presets";
import {
  computeSpending,
  computeStats,
  CYCLE_LABELS,
  daysLeft,
  formatYuan,
} from "../lib/subscriptions";
import { ServiceIcon } from "../components/ServiceIcon";
import { MarkPaidButton } from "./MarkPaidButton";
import { Onboarding } from "./Onboarding";
import { PwaInstall } from "./PwaInstall";
import { SpendingChart } from "./SpendingChart";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .orderBy(asc(subscriptions.nextDueDate), asc(subscriptions.id));
  const paidRows = await db
    .select({
      subscriptionId: payments.subscriptionId,
      amountCents: payments.amountCents,
    })
    .from(payments)
    .where(eq(payments.status, "paid"));

  const stats = computeStats(rows);
  const spending = computeSpending(rows, paidRows);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-14 pt-6 sm:pb-20 sm:pt-10">
      <Onboarding />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-lg font-bold text-white shadow-[0_8px_20px_rgba(234,88,12,0.25)] ring-1 ring-white/70">
            合
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">合租订阅</h1>
            <p className="mt-0.5 hidden text-xs text-stone-400 sm:block">共享订阅，一眼掌握</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
          <PwaInstall />
          <a
            href="/calendar.ics"
            className="rounded-full border border-white/80 bg-white/55 px-4 py-2.5 text-stone-600 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:text-stone-900"
          >
            导出日历
          </a>
          <Link
            href="/subscriptions/new"
            className="rounded-full bg-orange-600 px-4 py-2.5 font-medium text-white shadow-[0_8px_18px_rgba(234,88,12,0.22)] transition-all hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-[0_10px_22px_rgba(234,88,12,0.28)]"
          >
            + 新增订阅
          </Link>
        </div>
      </header>

      <section aria-label="订阅概览" className="mt-7 grid grid-cols-3 gap-3">
        <div className="glass relative overflow-hidden rounded-3xl px-4 py-4 sm:p-5">
          <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-orange-400/15 blur-2xl" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-stone-500">月均支出</p>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100/80 text-[10px] font-semibold text-orange-700">月</span>
          </div>
          <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-2xl">
            {formatYuan(Math.round(stats.monthlyTotalCents))}
          </p>
          <p className="mt-1 hidden text-[11px] text-stone-400 sm:block">每月平均分摊</p>
        </div>
        <div className="glass relative overflow-hidden rounded-3xl px-4 py-4 sm:p-5">
          <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-400/15 blur-2xl" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-stone-500">年付合计</p>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100/80 text-[10px] font-semibold text-violet-700">年</span>
          </div>
          <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-2xl">
            {formatYuan(Math.round(stats.yearlyTotalCents))}
          </p>
          <p className="mt-1 hidden text-[11px] text-stone-400 sm:block">按全年折算</p>
        </div>
        <div className="glass relative overflow-hidden rounded-3xl px-4 py-4 sm:p-5">
          <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-stone-500">待处理</p>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100/80 text-xs font-semibold text-emerald-700">✓</span>
          </div>
          <p
            className={`mt-3 text-xl font-semibold tracking-[-0.03em] sm:text-2xl ${
              stats.overdueCount > 0
                ? "text-red-600"
                : stats.dueSoonCount > 0
                  ? "text-amber-600"
                  : "text-stone-900"
            }`}
          >
            {stats.overdueCount > 0
              ? `${stats.overdueCount} 笔逾期`
              : stats.dueSoonCount > 0
                ? `${stats.dueSoonCount} 笔将到期`
                : "无"}
          </p>
          <p className="mt-1 hidden text-[11px] text-stone-400 sm:block">续费状态正常</p>
        </div>
      </section>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/65 bg-white/35 px-3.5 py-3 text-xs leading-relaxed text-stone-500 backdrop-blur-xl">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stone-800/8 text-[10px] font-semibold text-stone-500">i</span>
        <p>日历导出的是当前订阅快照。增删订阅后，请删除旧的「合租订阅」日历并重新导入。</p>
      </div>

      {spending.totalPaidCents > 0 && (
        <SpendingChart
          totalPaidCents={spending.totalPaidCents}
          rows={spending.rows}
          percents={spending.percents}
        />
      )}

      {rows.length === 0 ? (
        <div className="mt-16 text-center text-stone-400">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 font-medium text-stone-500">还没有订阅</p>
          <p className="mt-1 text-sm">点右上角「新增订阅」添加第一个合租车位。</p>
        </div>
      ) : (
        <section className="mt-7">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-stone-900">订阅清单</h2>
              <p className="mt-0.5 text-xs text-stone-400">按下次续费时间排序</p>
            </div>
            <span className="rounded-full border border-white/70 bg-white/45 px-2.5 py-1 text-xs text-stone-500 backdrop-blur-xl">共 {rows.length} 项</span>
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
                  href={`/subscriptions/${sub.id}/edit`}
                  className={`group flex min-h-48 flex-col items-center overflow-hidden rounded-3xl px-4 pb-4 pt-4 text-center backdrop-blur-xl backdrop-saturate-150 transition-all hover:-translate-y-1 hover:shadow-xl ${
                    overdue
                      ? "border border-red-200/70 bg-red-400/12 shadow-[0_10px_34px_rgba(220,38,38,0.09),inset_0_1px_0_rgba(255,255,255,0.7)]"
                      : dueSoon
                        ? "border border-amber-200/70 bg-amber-400/12 shadow-[0_10px_34px_rgba(217,119,6,0.09),inset_0_1px_0_rgba(255,255,255,0.7)]"
                        : "border border-white/75 bg-white/55 shadow-[0_10px_34px_rgba(28,25,23,0.055),inset_0_1px_0_rgba(255,255,255,0.82)]"
                  }`}
                >
                  <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                  <ServiceIcon
                    presetId={preset?.id}
                    name={sub.name}
                    color={preset?.color}
                    className="h-16 w-16 text-2xl shadow-[0_10px_24px_rgba(28,25,23,0.12)] ring-1 ring-white/70 transition-transform duration-300 group-hover:scale-105"
                  />

                  <p className="mt-4 w-full truncate font-medium text-stone-900">
                    {sub.name}
                  </p>
                  <p className="mt-1 flex items-baseline gap-1.5 text-stone-500">
                    <span className="text-lg font-semibold tracking-tight text-stone-800">{formatYuan(sub.shareCents)}</span>
                    <span className="text-xs">{CYCLE_LABELS[sub.cycle]}</span>
                  </p>
                  <span
                    className={`mt-auto inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${
                      overdue
                        ? "border border-red-200/60 bg-red-500/15 text-red-700"
                        : dueSoon
                          ? "border border-amber-200/60 bg-amber-500/15 text-amber-700"
                          : "border border-white/70 bg-white/55 text-stone-500"
                    }`}
                  >
                    {overdue
                      ? `已逾期 ${-left} 天`
                      : left === 0
                        ? "今天续费"
                        : `${left} 天后续费`}
                  </span>
                </Link>
                <div className="absolute right-3.5 top-3.5">
                  <MarkPaidButton id={sub.id} name={sub.name} compact />
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
