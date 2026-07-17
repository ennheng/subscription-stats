import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../db";
import { payments, subscriptions } from "../../../db/schema";
import { getSessionForHeaders } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionForHeaders(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const [subscriptionRows, paymentRows] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        ownerContact: subscriptions.ownerContact,
        totalPriceCents: subscriptions.totalPriceCents,
        shareCents: subscriptions.shareCents,
        cycle: subscriptions.cycle,
        nextDueDate: subscriptions.nextDueDate,
        note: subscriptions.note,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id)),
    db
      .select({
        id: payments.id,
        subscriptionId: payments.subscriptionId,
        periodDueDate: payments.periodDueDate,
        amountCents: payments.amountCents,
        status: payments.status,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .where(eq(subscriptions.userId, session.user.id)),
  ]);

  return NextResponse.json(
    {
      format: "subscription-stats-export-v1",
      exportedAt: new Date().toISOString(),
      username: session.user.username ?? session.user.name,
      subscriptions: subscriptionRows,
      payments: paymentRows,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="subscription-stats-data.json"',
      },
    },
  );
}
