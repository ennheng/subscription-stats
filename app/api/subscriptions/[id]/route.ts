import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { subscriptions } from "../../../../db/schema";
import { validateSubscriptionPayload } from "../route";

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

async function parseId(context: RouteContext): Promise<number | null> {
  const { id } = await context.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const id = await parseId(context);
    if (id === null) {
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
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const id = await parseId(context);
    if (id === null) {
      return NextResponse.json({ error: "无效的订阅 ID" }, { status: 400 });
    }

    const db = await getDb();
    // payments rows are removed by ON DELETE CASCADE.
    const [deleted] = await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: "订阅不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const id = await parseId(context);
    if (id === null) {
      return NextResponse.json({ error: "无效的订阅 ID" }, { status: 400 });
    }

    const payload = (await request.json()) as Parameters<
      typeof validateSubscriptionPayload
    >[0];
    const parsed = validateSubscriptionPayload(payload);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = await getDb();
    const [subscription] = await db
      .update(subscriptions)
      .set(parsed.value)
      .where(eq(subscriptions.id, id))
      .returning();
    if (!subscription) {
      return NextResponse.json({ error: "订阅不存在" }, { status: 404 });
    }
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
