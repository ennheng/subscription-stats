import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { subscriptions } from "../../../db/schema";
import { isCycle, isValidDateString, parseYuan } from "../../../lib/subscriptions";

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

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(subscriptions)
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

export function validateSubscriptionPayload(payload: SubscriptionPayload) {
  const name = payload.name?.trim() ?? "";
  const ownerContact = payload.ownerContact?.trim() ?? "";
  const note = payload.note?.trim() ?? "";
  const totalPriceRaw = payload.totalPrice?.trim() ?? "";
  // 总价可选:留空记为 null,填了才校验格式。
  const totalPriceCents = totalPriceRaw === "" ? null : parseYuan(totalPriceRaw);
  const shareCents = parseYuan(payload.share ?? "");
  const cycle = payload.cycle;
  const nextDueDate = payload.nextDueDate ?? "";

  if (!name) return { error: "请填写订阅名称" } as const;
  if (totalPriceRaw !== "" && (totalPriceCents === null || totalPriceCents < 0))
    return { error: "总价格式不正确,请输入数字(如 25 或 25.5)" } as const;
  if (shareCents === null || shareCents < 0)
    return { error: "我的份额格式不正确,请输入数字(如 25 或 25.5)" } as const;
  if (!isCycle(cycle)) return { error: "请选择付款周期" } as const;
  if (!isValidDateString(nextDueDate))
    return { error: "下次到期日格式不正确" } as const;

  return {
    value: { name, ownerContact, totalPriceCents, shareCents, cycle, nextDueDate, note },
  } as const;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SubscriptionPayload;
    const parsed = validateSubscriptionPayload(payload);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = await getDb();
    const [subscription] = await db
      .insert(subscriptions)
      .values(parsed.value)
      .returning();
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
