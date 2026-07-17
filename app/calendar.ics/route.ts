import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { subscriptions } from "../../db/schema";
import { advanceDate, formatYuan } from "../../lib/subscriptions";
import { getSessionForHeaders } from "../../lib/auth";

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

export async function GET(request: NextRequest) {
  const session = await getSessionForHeaders(request.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "zh-CN";
  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(asc(subscriptions.nextDueDate), asc(subscriptions.id));

  const dtstamp = toIcsTimestamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subscription Stats//Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${locale === "zh-CN" ? "订阅统计" : "Subscription Stats"}`,
  ];

  for (const sub of rows) {
    let due = sub.nextDueDate;
    for (let i = 0; i < OCCURRENCES; i += 1) {
      const description = [
        sub.ownerContact
          ? `${locale === "zh-CN" ? "联系人" : "Contact"}:${sub.ownerContact}`
          : "",
        `${locale === "zh-CN" ? "我的份额" : "My share"}:${formatYuan(sub.shareCents)}`,
        sub.note ? `${locale === "zh-CN" ? "备注" : "Notes"}:${sub.note}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      lines.push(
        "BEGIN:VEVENT",
        `UID:sub-${sub.id}-${due}@subscription-stats`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${toIcsDate(due)}`,
        `SUMMARY:${escapeIcsText(`${locale === "zh-CN" ? "续费" : "Renew"} ${sub.name} ${formatYuan(sub.shareCents)}`)}`,
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
      "Content-Disposition": 'attachment; filename="subscription-stats.ics"',
    },
  });
}
