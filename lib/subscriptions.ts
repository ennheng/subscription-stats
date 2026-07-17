export type Cycle = "monthly" | "quarterly" | "yearly";

export const CYCLE_LABELS: Record<Cycle, string> = {
  monthly: "月付",
  quarterly: "季付",
  yearly: "年付",
};

const MONTHS_IN_CYCLE: Record<Cycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const DAY_MS = 86_400_000;

function parseDateUTC(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Whole days from today until the due date; negative when overdue. */
export function daysLeft(nextDueDate: string, now: Date = todayUTC()): number {
  return Math.round((parseDateUTC(nextDueDate).getTime() - now.getTime()) / DAY_MS);
}

function daysInMonthUTC(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(day, daysInMonthUTC(targetYear, normalizedMonth));
  return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay));
}

/** Advance a due date by one billing cycle, clamping day-of-month. */
export function advanceDate(nextDueDate: string, cycle: Cycle): string {
  const advanced = addMonthsClamped(parseDateUTC(nextDueDate), MONTHS_IN_CYCLE[cycle]);
  return formatDateUTC(advanced);
}

/**
 * Roll a due date forward by whole cycles until it is today or later,
 * so paying off an overdue subscription never lands on another past date.
 */
export function advanceUntilFuture(nextDueDate: string, cycle: Cycle, now: Date = todayUTC()): string {
  let due = nextDueDate;
  while (daysLeft(due, now) < 0) {
    due = advanceDate(due, cycle);
  }
  return due;
}

/**
 * Settle the current period: always move at least one cycle forward
 * (the period just paid for), then keep advancing while still overdue
 * so lapsed subscriptions catch up to a future date.
 */
export function settleCurrentPeriod(nextDueDate: string, cycle: Cycle, now: Date = todayUTC()): string {
  return advanceUntilFuture(advanceDate(nextDueDate, cycle), cycle, now);
}

export function monthlyCents(shareCents: number, cycle: Cycle): number {
  return shareCents / MONTHS_IN_CYCLE[cycle];
}

export function yearlyCents(shareCents: number, cycle: Cycle): number {
  return monthlyCents(shareCents, cycle) * 12;
}

export interface SubscriptionLike {
  shareCents: number;
  cycle: Cycle;
  nextDueDate: string;
}

export interface Stats {
  monthlyTotalCents: number;
  yearlyTotalCents: number;
  overdueCount: number;
  dueSoonCount: number;
}

export function computeStats(subs: SubscriptionLike[], now: Date = todayUTC()): Stats {
  let monthlyTotalCents = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  for (const sub of subs) {
    monthlyTotalCents += monthlyCents(sub.shareCents, sub.cycle);
    const left = daysLeft(sub.nextDueDate, now);
    if (left < 0) overdueCount += 1;
    else if (left <= 7) dueSoonCount += 1;
  }
  return {
    monthlyTotalCents,
    yearlyTotalCents: monthlyTotalCents * 12,
    overdueCount,
    dueSoonCount,
  };
}

/** Format cents as ¥ yuan, dropping decimals when integral. */
export function formatYuan(cents: number): string {
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? `¥${yuan}` : `¥${yuan.toFixed(2)}`;
}

export interface SpendingRow {
  subscriptionId: number;
  name: string;
  cycle: Cycle;
  annualCents: number;
}

export interface SpendingStats {
  totalAnnualCents: number;
  rows: SpendingRow[];
  percents: number[];
}

/**
 * Annualize every current subscription from its billing cycle, then sort by
 * planned annual cost and calculate its share of the current subscription
 * portfolio. This intentionally does not depend on payment history.
 */
export function computeSpending(
  subs: { id: number; name: string; cycle: Cycle; shareCents: number }[],
): SpendingStats {
  const rows = subs
    .map((s) => ({
      subscriptionId: s.id,
      name: s.name,
      cycle: s.cycle,
      annualCents: yearlyCents(s.shareCents, s.cycle),
    }))
    .filter((r) => r.annualCents > 0)
    .sort((a, b) => b.annualCents - a.annualCents);
  const totalAnnualCents = rows.reduce((sum, row) => sum + row.annualCents, 0);
  const percents = rows.map((row) =>
    totalAnnualCents > 0 ? row.annualCents / totalAnnualCents : 0,
  );
  return { totalAnnualCents, rows, percents };
}

/** Parse a yuan string like "25" or "25.5" into cents; null when invalid. */
export function parseYuan(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDateUTC(value);
  return formatDateUTC(date) === value;
}

export function isCycle(value: unknown): value is Cycle {
  return value === "monthly" || value === "quarterly" || value === "yearly";
}
