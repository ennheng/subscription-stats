import {
  advanceDate,
  formatYuan,
  type Cycle,
} from "./subscriptions";

export interface DashboardSubscription {
  id: number;
  name: string;
  ownerContact: string;
  totalPriceCents: number | null;
  shareCents: number;
  cycle: Cycle;
  nextDueDate: string;
  note: string;
  createdAt: string;
}

export const GUEST_STORAGE_KEY = "subscription_stats_guest_subscriptions_v1";
const LEGACY_GUEST_STORAGE_KEY = "renewary_guest_subscriptions_v1";
const GUEST_CHANGE_EVENT = "subscription-stats:guest-change";

export function getGuestSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return (
    window.localStorage.getItem(GUEST_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_GUEST_STORAGE_KEY) ??
    "[]"
  );
}

export function getGuestServerSnapshot(): string {
  return "[]";
}

export function parseGuestSnapshot(snapshot: string): DashboardSubscription[] {
  try {
    const value = JSON.parse(snapshot);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readGuestSubscriptions(): DashboardSubscription[] {
  return parseGuestSnapshot(getGuestSnapshot());
}

function writeGuestSubscriptions(rows: DashboardSubscription[]) {
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(GUEST_CHANGE_EVENT));
}

export function subscribeGuestSubscriptions(onChange: () => void) {
  window.addEventListener(GUEST_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(GUEST_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function saveGuestSubscription(
  values: Omit<DashboardSubscription, "id" | "createdAt">,
  id?: number,
) {
  const rows = readGuestSubscriptions();
  if (id !== undefined) {
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return false;
    rows[index] = { ...rows[index], ...values };
  } else {
    const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    rows.push({ ...values, id: nextId, createdAt: new Date().toISOString() });
  }
  writeGuestSubscriptions(rows);
  return true;
}

export function deleteGuestSubscription(id: number) {
  const rows = readGuestSubscriptions();
  writeGuestSubscriptions(rows.filter((row) => row.id !== id));
}

export function markGuestSubscriptionPaid(id: number) {
  const rows = readGuestSubscriptions();
  const row = rows.find((item) => item.id === id);
  if (!row) return false;
  row.nextDueDate = advanceDate(row.nextDueDate, row.cycle);
  writeGuestSubscriptions(rows);
  return true;
}

export function clearGuestSubscriptions() {
  writeGuestSubscriptions([]);
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDate(value: string) {
  return value.replaceAll("-", "");
}

export function buildGuestIcs(rows: DashboardSubscription[], locale: "zh-CN" | "en") {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subscription Stats//Guest//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${locale === "zh-CN" ? "订阅统计" : "Subscription Stats"}`,
  ];

  for (const row of rows) {
    let due = row.nextDueDate;
    for (let occurrence = 0; occurrence < 8; occurrence += 1) {
      const summary =
        locale === "zh-CN"
          ? `续费 ${row.name} ${formatYuan(row.shareCents)}`
          : `Renew ${row.name} ${formatYuan(row.shareCents)}`;
      const description = [
        row.ownerContact
          ? `${locale === "zh-CN" ? "联系人" : "Contact"}: ${row.ownerContact}`
          : "",
        `${locale === "zh-CN" ? "我的份额" : "My share"}: ${formatYuan(row.shareCents)}`,
        row.note ? `${locale === "zh-CN" ? "备注" : "Notes"}: ${row.note}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      lines.push(
        "BEGIN:VEVENT",
        `UID:guest-${row.id}-${due}@subscription-stats`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${icsDate(due)}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        "END:VEVENT",
      );
      due = advanceDate(due, row.cycle);
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadGuestIcs(rows: DashboardSubscription[], locale: "zh-CN" | "en") {
  const blob = new Blob([buildGuestIcs(rows, locale)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "subscription-stats.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}
