/**
 * admin-auth.ts — backward-compatibility re-export shim.
 *
 * All admin authorization now lives in src/lib/admin-rbac.ts.
 * This file re-exports the public API so that existing Server Actions and
 * API routes that import from "@/lib/admin-auth" continue to work without
 * modification.
 *
 * Do NOT remove this file until all import sites have been updated to
 * import from "@/lib/admin-rbac" directly.
 *
 * Migration checklist (update imports when convenient):
 *   src/app/admin/(protected)/signals/actions.ts
 *   src/app/admin/(protected)/subscribers/actions.ts
 *   src/app/admin/(protected)/broker-sessions/actions.ts
 *   src/app/admin/(protected)/messages/actions.ts
 *   src/app/admin/(protected)/referrals/actions.ts
 *   src/app/admin/(protected)/layout.tsx
 *   src/app/api/news/route.ts
 *   src/components/site/admin-nav-link.tsx
 *   src/app/admin/login/page.tsx  ← already updated to use admin-rbac
 */

export {
  getAdminUser,
  requireAdmin,
  requireAccessLevel,
  hasPermission,
  type AdminCheckResult,
} from "@/lib/admin-rbac";
