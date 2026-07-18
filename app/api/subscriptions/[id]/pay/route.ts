import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { payments, subscriptions } from "../../../../../db/schema";
import { settleCurrentPeriod } from "../../../../../lib/subscriptions";
import { getSessionForHeaders } from "../../../../../lib/auth";
import { isSameOriginMutation } from "../../../../../lib/request-security";
import { apiLocale, subscriptionApiMessages } from "../../route";

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table")) {
    return "数据库表不存在。请先运行 `npm run db:generate` 生成迁移,再用 wrangler 应用到本地或远端 D1。";
  }

  return message;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const messages = subscriptionApiMessages(apiLocale(request));
    if (!isSameOriginMutation(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const session = await getSessionForHeaders(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: messages.invalidId }, { status: 400 });
    }

    const db = await getDb();
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id)));
    if (!subscription) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 });
    }

    const nextDueDate = settleCurrentPeriod(subscription.nextDueDate, subscription.cycle);
    const [, updatedRows] = await db.batch([
      db.insert(payments).values({
        subscriptionId: id,
        periodDueDate: subscription.nextDueDate,
        amountCents: subscription.shareCents,
        status: "paid",
        paidAt: new Date().toISOString(),
      }),
      db
        .update(subscriptions)
        .set({ nextDueDate })
        .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id)))
        .returning(),
    ]);

    return NextResponse.json({ subscription: updatedRows[0] });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
