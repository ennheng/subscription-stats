import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../../db";
import { subscriptions } from "../../../../db/schema";
import { SubscriptionForm } from "../../SubscriptionForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function centsToYuan(cents: number | null): string {
  if (cents === null) return "";
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

export default async function EditSubscriptionPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const db = await getDb();
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id));
  if (!subscription) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">编辑订阅</h1>
      <SubscriptionForm
        mode="edit"
        subscriptionId={subscription.id}
        initial={{
          name: subscription.name,
          ownerContact: subscription.ownerContact,
          totalPrice: centsToYuan(subscription.totalPriceCents),
          share: centsToYuan(subscription.shareCents),
          cycle: subscription.cycle,
          nextDueDate: subscription.nextDueDate,
          note: subscription.note,
        }}
      />
    </main>
  );
}
