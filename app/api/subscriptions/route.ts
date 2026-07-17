import { NextRequest, NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { subscriptions } from "../../../db/schema";
import { getSessionForHeaders } from "../../../lib/auth";
import { isCycle, isValidDateString, parseYuan } from "../../../lib/subscriptions";
import { isSameOriginMutation } from "../../../lib/request-security";

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

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForHeaders(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDb();
    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .orderBy(asc(subscriptions.nextDueDate), asc(subscriptions.id));
    return NextResponse.json({ subscriptions: rows });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

interface SubscriptionPayload {
  name?: string;
  ownerContact?: string;
  totalPrice?: string;
  share?: string;
  cycle?: string;
  nextDueDate?: string;
  note?: string;
}

export type ApiLocale = "zh-CN" | "en";

export function apiLocale(request: NextRequest): ApiLocale {
  return request.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "zh-CN";
}

export function subscriptionApiMessages(locale: ApiLocale) {
  return locale === "en"
    ? {
        invalidId: "Invalid subscription ID",
        notFound: "Subscription not found",
        invalidName: "Enter a subscription name",
        invalidTotal: "Enter a valid total price, such as 25 or 25.5",
        invalidShare: "Enter a valid share, such as 25 or 25.5",
        invalidCycle: "Choose a billing cycle",
        invalidDate: "Enter a valid renewal date",
        limit: "Each account can store up to 200 subscriptions.",
      }
    : {
        invalidId: "无效的订阅 ID",
        notFound: "订阅不存在",
        invalidName: "请填写订阅名称",
        invalidTotal: "总价格式不正确，请输入数字（如 25 或 25.5）",
        invalidShare: "我的份额格式不正确，请输入数字（如 25 或 25.5）",
        invalidCycle: "请选择付款周期",
        invalidDate: "下次到期日格式不正确",
        limit: "每个账号最多可保存 200 项订阅。",
      };
}

export function validateSubscriptionPayload(payload: SubscriptionPayload, locale: ApiLocale = "zh-CN") {
  const messages = subscriptionApiMessages(locale);
  const name = payload.name?.trim() ?? "";
  const ownerContact = payload.ownerContact?.trim() ?? "";
  const note = payload.note?.trim() ?? "";
  const totalPriceRaw = payload.totalPrice?.trim() ?? "";
  // 总价可选:留空记为 null,填了才校验格式。
  const totalPriceCents = totalPriceRaw === "" ? null : parseYuan(totalPriceRaw);
  const shareCents = parseYuan(payload.share ?? "");
  const cycle = payload.cycle;
  const nextDueDate = payload.nextDueDate ?? "";

  if (!name) return { error: messages.invalidName } as const;
  if (totalPriceRaw !== "" && (totalPriceCents === null || totalPriceCents < 0))
    return { error: messages.invalidTotal } as const;
  if (shareCents === null || shareCents < 0)
    return { error: messages.invalidShare } as const;
  if (!isCycle(cycle)) return { error: messages.invalidCycle } as const;
  if (!isValidDateString(nextDueDate))
    return { error: messages.invalidDate } as const;

  return {
    value: { name, ownerContact, totalPriceCents, shareCents, cycle, nextDueDate, note },
  } as const;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginMutation(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const session = await getSessionForHeaders(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = (await request.json()) as SubscriptionPayload;
    const locale = apiLocale(request);
    const messages = subscriptionApiMessages(locale);
    const parsed = validateSubscriptionPayload(payload, locale);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = await getDb();
    const [{ total }] = await db
      .select({ total: count() })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id));
    if (total >= 200) {
      return NextResponse.json(
        { error: messages.limit },
        { status: 409 },
      );
    }
    const [subscription] = await db
      .insert(subscriptions)
      .values({ ...parsed.value, userId: session.user.id })
      .returning();
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
