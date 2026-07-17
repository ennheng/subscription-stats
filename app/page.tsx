import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { subscriptions } from "../db/schema";
import { getServerSession } from "../lib/auth";
import { DashboardView } from "./DashboardView";
import { WelcomeView } from "./WelcomeView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();
  if (!session) return <WelcomeView />;

  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(asc(subscriptions.nextDueDate), asc(subscriptions.id));
  return (
    <DashboardView
      rows={rows}
      accountName={session.user.username ?? session.user.name}
    />
  );
}
