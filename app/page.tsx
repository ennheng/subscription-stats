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
    <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <Onboarding />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-lg font-bold text-white">
            合
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">合租订阅</h1>
        </div>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <a
            href="/calendar.ics"
            className="rounded-full border border-white/60 bg-white/50 px-4 py-2 text-stone-600 backdrop-blur-xl transition-colors hover:bg-white/70 hover:text-stone-800"
          >
            导出日历
          </a>
          <Link
            href="/subscriptions/new"
            className="rounded-full bg-orange-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-orange-500"
          >
            + 新增订阅
          </Link>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-stone-500">月均支出</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-stone-900">
            {formatYuan(Math.round(stats.monthlyTotalCents))}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-stone-500">年付合计</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-stone-900">
            {formatYuan(Math.round(stats.yearlyTotalCents))}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-stone-500">待处理</p>
          <p
            className={`mt-1 text-xl font-semibold tracking-tight ${
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
        </div>
      </div>

      <p className="mt-4 text-xs text-stone-400">
        提示:「导出日历」下载的是当前全部订阅的快照。订阅有增删后,请在日历 App
        里删除旧的「合租订阅」日历,再重新下载导入,以免重复。
      </p>

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
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((sub) => {
            const left = daysLeft(sub.nextDueDate);
            const preset = findPresetByName(sub.name);
            const overdue = left < 0;
            const dueSoon = !overdue && left <= 7;
            return (
              <li key={sub.id} className="relative">
                <Link
                  href={`/subscriptions/${sub.id}/edit`}
                  className={`flex flex-col items-center rounded-2xl px-3 pb-6 pt-5 text-center backdrop-blur-xl backdrop-saturate-150 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    overdue
                      ? "border border-red-200/70 bg-red-400/15 shadow-[0_8px_32px_rgba(220,38,38,0.10),inset_0_1px_0_rgba(255,255,255,0.6)]"
                      : dueSoon
                        ? "border border-amber-200/70 bg-amber-400/15 shadow-[0_8px_32px_rgba(217,119,6,0.10),inset_0_1px_0_rgba(255,255,255,0.6)]"
                        : "border border-white/60 bg-white/50 shadow-[0_8px_32px_rgba(28,25,23,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]"
                  }`}
                >
                  <ServiceIcon
                    presetId={preset?.id}
                    name={sub.name}
                    color={preset?.color}
                    className="h-16 w-16 text-2xl"
                  />

                  <p className="mt-3 w-full truncate font-medium text-stone-900">
                    {sub.name}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {CYCLE_LABELS[sub.cycle]} {formatYuan(sub.shareCents)}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-md ${
                      overdue
                        ? "border border-red-200/60 bg-red-500/15 text-red-700"
                        : dueSoon
                          ? "border border-amber-200/60 bg-amber-500/15 text-amber-700"
                          : "border border-white/50 bg-white/50 text-stone-500"
                    }`}
                  >
                    {overdue
                      ? `已逾期 ${-left} 天`
                      : left === 0
                        ? "今天续费"
                        : `${left} 天后续费`}
                  </span>
                </Link>
                <div className="absolute bottom-2.5 right-2.5">
                  <MarkPaidButton id={sub.id} name={sub.name} compact />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
