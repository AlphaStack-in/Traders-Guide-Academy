/**
 * Name of the admin session cookie. Lives in its own dependency-free module
 * so src/proxy.ts can import it without pulling Prisma / node:crypto (via
 * admin-rbac.ts) into the proxy bundle.
 */
export const ADMIN_SESSION_COOKIE = "admin_session";
