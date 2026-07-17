import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { payments, subscriptions } from "../../../../../db/schema";
import { settleCurrentPeriod } from "../../../../../lib/subscriptions";

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

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "无效的订阅 ID" }, { status: 400 });
    }

    const db = await getDb();
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    if (!subscription) {
      return NextResponse.json({ error: "订阅不存在" }, { status: 404 });
    }

    await db.insert(payments).values({
      subscriptionId: id,
      periodDueDate: subscription.nextDueDate,
      amountCents: subscription.shareCents,
      status: "paid",
      paidAt: new Date().toISOString(),
    });

    const nextDueDate = settleCurrentPeriod(subscription.nextDueDate, subscription.cycle);
    const [updated] = await db
      .update(subscriptions)
      .set({ nextDueDate })
      .where(eq(subscriptions.id, id))
      .returning();

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
