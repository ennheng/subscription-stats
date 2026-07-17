import { SubscriptionForm } from "../SubscriptionForm";
import { dictionaryFor } from "../../../lib/i18n";
import { getLocale } from "../../locale";
import { getServerSession } from "../../../lib/auth";
import { redirect } from "next/navigation";

export default async function NewSubscriptionPage() {
  if (!(await getServerSession())) redirect("/");
  const t = dictionaryFor(await getLocale());
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{t.addSubscription}</h1>
      <SubscriptionForm mode="create" />
    </main>
  );
}
