import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { subscriptions } from "../../../../db/schema";
import { getSessionForHeaders } from "../../../../lib/auth";
import { isSameOriginMutation } from "../../../../lib/request-security";
import { apiLocale, subscriptionApiMessages, validateSubscriptionPayload } from "../route";

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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const messages = subscriptionApiMessages(apiLocale(request));
    const session = await getSessionForHeaders(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = await parseId(context);
    if (id === null) {
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
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const messages = subscriptionApiMessages(apiLocale(request));
    if (!isSameOriginMutation(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const session = await getSessionForHeaders(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = await parseId(context);
    if (id === null) {
      return NextResponse.json({ error: messages.invalidId }, { status: 400 });
    }

    const db = await getDb();
    // payments rows are removed by ON DELETE CASCADE.
    const [deleted] = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id)))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const locale = apiLocale(request);
    const messages = subscriptionApiMessages(locale);
    if (!isSameOriginMutation(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const session = await getSessionForHeaders(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = await parseId(context);
    if (id === null) {
      return NextResponse.json({ error: messages.invalidId }, { status: 400 });
    }

    const payload = (await request.json()) as Parameters<
      typeof validateSubscriptionPayload
    >[0];
    const parsed = validateSubscriptionPayload(payload, locale);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = await getDb();
    const [subscription] = await db
      .update(subscriptions)
      .set(parsed.value)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id)))
      .returning();
    if (!subscription) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 });
    }
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
