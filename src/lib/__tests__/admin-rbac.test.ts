import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks -----------------------------------------------------------------
const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

type Row = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  accessLevel: "VIEWER" | "SUPPORT" | "SIGNAL_MANAGER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
};
const rows = new Map<string, Row>();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) =>
        [...rows.values()].find((r) => r.email === where.email || r.id === where.id) ?? null,
      update: async () => ({}),
    },
  },
}));

import { hashPassword } from "@/lib/password";
import {
  checkAccessLevel,
  createAdminSession,
  getAdminUser,
  resolveAdminIdentity,
  verifyAdminCredentials,
} from "@/lib/admin-rbac";

beforeEach(() => {
  cookieJar.clear();
  rows.clear();
  process.env.SESSION_SECRET = "dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdHRlc3Q=";
  process.env.ADMIN_EMAIL = "Owner@Example.com";
  process.env.ADMIN_PASSWORD_HASH = hashPassword("owner-pass");
  process.env.ADDITIONAL_ADMIN_EMAILS = "extra@example.com";
  rows.set("s1", {
    id: "s1",
    email: "staff@example.com",
    name: "Staff",
    passwordHash: hashPassword("staff-pass"),
    accessLevel: "SUPPORT",
    isActive: true,
  });
});

describe("resolveAdminIdentity", () => {
  it("resolves owner, env extra and active staff", async () => {
    expect((await resolveAdminIdentity("owner@example.com"))?.kind).toBe("owner");
    expect((await resolveAdminIdentity(" EXTRA@example.com "))?.accessLevel).toBe("SUPER_ADMIN");
    const staff = await resolveAdminIdentity("staff@example.com");
    expect(staff).toMatchObject({ kind: "staff", accessLevel: "SUPPORT", staffId: "s1" });
  });

  it("rejects unknown and deactivated staff", async () => {
    expect(await resolveAdminIdentity("nobody@example.com")).toBeNull();
    rows.get("s1")!.isActive = false;
    expect(await resolveAdminIdentity("staff@example.com")).toBeNull();
  });
});

describe("verifyAdminCredentials", () => {
  it("checks owner against env hash and staff against DB hash", async () => {
    expect(await verifyAdminCredentials("owner@example.com", "owner-pass")).toBe(true);
    expect(await verifyAdminCredentials("owner@example.com", "wrong")).toBe(false);
    expect(await verifyAdminCredentials("staff@example.com", "staff-pass")).toBe(true);
    expect(await verifyAdminCredentials("staff@example.com", "owner-pass")).toBe(false);
  });

  it("refuses password login for env extras and Google-only staff", async () => {
    expect(await verifyAdminCredentials("extra@example.com", "anything")).toBe(false);
    rows.get("s1")!.passwordHash = null;
    expect(await verifyAdminCredentials("staff@example.com", "staff-pass")).toBe(false);
  });
});

describe("sessions and roles", () => {
  it("applies the staff role and revokes on deactivation", async () => {
    await createAdminSession("staff@example.com");
    const me = await getAdminUser();
    expect(me.ok && me.accessLevel).toBe("SUPPORT");

    expect((await checkAccessLevel("SUPPORT")).ok).toBe(true);
    const denied = await checkAccessLevel("SIGNAL_MANAGER");
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error).toContain("Signal Manager");

    rows.get("s1")!.accessLevel = "ADMIN";
    expect((await checkAccessLevel("SIGNAL_MANAGER")).ok).toBe(true);

    rows.get("s1")!.isActive = false;
    const after = await getAdminUser();
    expect(after.ok).toBe(false);
  });

  it("owner session is always Super Admin", async () => {
    await createAdminSession("owner@example.com");
    expect((await checkAccessLevel("SUPER_ADMIN")).ok).toBe(true);
  });

  it("no cookie means unauthorized", async () => {
    const me = await getAdminUser();
    expect(me).toMatchObject({ ok: false, status: 401 });
  });
});
