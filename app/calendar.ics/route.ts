import { asc } from "drizzle-orm";
import { getDb } from "../../db";
import { subscriptions } from "../../db/schema";
import { advanceDate, formatYuan } from "../../lib/subscriptions";

export const dynamic = "force-dynamic";

const OCCURRENCES = 8;

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

function toIcsTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export async function GET() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .orderBy(asc(subscriptions.nextDueDate), asc(subscriptions.id));

  const dtstamp = toIcsTimestamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//shared-subscriptions//ZH-CN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:合租订阅",
  ];

  for (const sub of rows) {
    let due = sub.nextDueDate;
    for (let i = 0; i < OCCURRENCES; i += 1) {
      const description = [
        sub.ownerContact ? `车主:${sub.ownerContact}` : "",
        `我的份额:${formatYuan(sub.shareCents)}`,
        sub.note ? `备注:${sub.note}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      lines.push(
        "BEGIN:VEVENT",
        `UID:sub-${sub.id}-${due}@shared-subscriptions`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${toIcsDate(due)}`,
        `SUMMARY:${escapeIcsText(`续费 ${sub.name} ${formatYuan(sub.shareCents)}`)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        "END:VEVENT",
      );
      due = advanceDate(due, sub.cycle);
    }
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscriptions.ics"',
    },
  });
}
