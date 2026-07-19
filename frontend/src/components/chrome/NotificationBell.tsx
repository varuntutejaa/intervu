import { useState } from "react";
import { Bell, CheckCircle2, Send } from "lucide-react";
import { useNotificationsQuery, type Notification } from "../../features/applications/api";
import { formatRelativeTime } from "../../lib/format";

function notificationText(n: Notification): string {
  if (n.kind === "applied") return `You applied to ${n.title} at ${n.company}`;
  return `${n.company} moved your application for ${n.title} to "${n.status}"`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  // Only ever rendered for a candidate session (gated in NavBar) — always
  // enabled so the unread-style count badge is accurate even before the
  // dropdown is first opened.
  const notificationsQuery = useNotificationsQuery(true);
  const notifications = notificationsQuery.data ?? [];
  const count = notifications.length;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/70 transition-colors hover:bg-black/10 hover:text-black"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-black/10 bg-[#f7f7f8] shadow-2xl">
            <div className="border-b border-black/10 px-4 py-3">
              <p className="font-fustat text-sm font-semibold text-black">Notifications</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notificationsQuery.isPending && (
                <p className="px-4 py-6 text-center text-sm text-black/40">Loading…</p>
              )}
              {notificationsQuery.isError && (
                <p className="px-4 py-6 text-center text-sm text-red-600">Couldn't load notifications.</p>
              )}
              {notificationsQuery.isSuccess && notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-black/40">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.applicationId}
                  className="flex items-start gap-2.5 border-b border-black/5 px-4 py-3 last:border-b-0"
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      n.kind === "applied" ? "bg-accent/10 text-accent-soft" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {n.kind === "applied" ? <Send className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-black">{notificationText(n)}</p>
                    <p className="mt-0.5 text-xs text-black/40">{formatRelativeTime(n.occurredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
