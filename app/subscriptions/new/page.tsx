import { SubscriptionForm } from "../SubscriptionForm";

export default function NewSubscriptionPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">新增订阅</h1>
      <SubscriptionForm mode="create" />
    </main>
  );
}
