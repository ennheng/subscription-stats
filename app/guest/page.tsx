"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  clearGuestSubscriptions,
  downloadGuestIcs,
  getGuestServerSnapshot,
  getGuestSnapshot,
  parseGuestSnapshot,
  subscribeGuestSubscriptions,
} from "../../lib/guest-subscriptions";
import { DashboardView } from "../DashboardView";
import { useI18n } from "../I18nProvider";

export default function GuestDashboardPage() {
  const { locale, t } = useI18n();
  const snapshot = useSyncExternalStore(
    subscribeGuestSubscriptions,
    getGuestSnapshot,
    getGuestServerSnapshot,
  );
  const rows = useMemo(
    () =>
      parseGuestSnapshot(snapshot).sort(
        (a, b) => a.nextDueDate.localeCompare(b.nextDueDate) || a.id - b.id,
      ),
    [snapshot],
  );

  function clearData() {
    if (!window.confirm(t.clearGuestConfirm)) return;
    clearGuestSubscriptions();
  }

  return (
    <DashboardView
      rows={rows}
      mode="guest"
      onGuestChange={() => window.dispatchEvent(new Event("subscription-stats:guest-change"))}
      onGuestExport={() => downloadGuestIcs(rows, locale)}
      onGuestClear={clearData}
    />
  );
}
