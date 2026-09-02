// Constants + types shared between the server-side publisher
// (src/lib/ably.ts, src/app/api/ably-auth/route.ts) and the browser
// subscriber (notification-bell.tsx). Deliberately has no "ably" import
// of its own -- it's plain strings/types, safe to pull into either the
// server or client bundle without dragging the Ably SDK along with it.

// Single broadcast channel -- every subscriber's browser listens here for
// any admin-authored update: a new signal, a per-signal note, a
// target/SL-hit panel entry, a general broadcast, or a Registered-Members
// "Announcement" in-app post.
export const ADMIN_UPDATES_CHANNEL = "admin-updates";
export const ADMIN_UPDATE_EVENT = "new-update";

// Mirrors the notification bell's client-side UpdateItem shape (see
// notification-bell.tsx) so a pushed message can be rendered without an
// extra round trip back to getRecentAdminUpdates().
export interface AdminUpdatePushPayload {
  id: string;
  signalId: string | null;
  strike: number | null;
  optionType: string | null;
  instrument: string | null;
  message: string;
  createdAt: string; // ISO
}
