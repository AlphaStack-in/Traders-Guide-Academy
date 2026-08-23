// Runs as a "prebuild" step (see package.json) before every `next build`.
// Fails the build immediately, with a specific actionable message, if this
// deployment is missing required auth env vars or its database host isn't
// reachable — added after the 2026-08-02 Goodwill outage where a stale
// DATABASE_URL only surfaced as a runtime Prisma error in production.
import { config as loadEnv } from "dotenv";
import { connect } from "node:net";

// Vercel's real per-deployment env vars are already in process.env by the
// time this runs; dotenv's default "don't override existing keys" behavior
// means these are only a fallback for running the script locally.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const TCP_TIMEOUT_MS = 3000;

class BuildHealthCheckError extends Error {}

function fail(message: string): never {
  throw new BuildHealthCheckError(message);
}

// TGA has no external auth provider anymore (single hardcoded admin +
// password-hashed subscribers, see src/lib/admin-rbac.ts /
// src/lib/subscriber-auth.ts) — so there's nothing to reach over the
// network here, just confirm the required env vars are actually set.
function checkAdminAuthEnv(): void {
  if (!process.env.ADMIN_EMAIL) {
    fail("ADMIN_EMAIL is not set for this deployment — admin login will not work at runtime.");
  }
  if (!process.env.ADMIN_PASSWORD_HASH) {
    fail(
      "ADMIN_PASSWORD_HASH is not set for this deployment — admin login will not work at runtime.",
    );
  }
  if (!process.env.SESSION_SECRET) {
    fail(
      "SESSION_SECRET is not set for this deployment — admin and subscriber sessions will not work at runtime.",
    );
  }

  console.log("  Admin auth env vars present (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET).");
}

// TCP-connect only (no Prisma client, no auth, no query) — just confirms the
// host:port this deployment's DATABASE_URL points at will accept a
// connection, which is cheap enough to run on every build.
async function checkDatabaseHostReachable(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("DATABASE_URL is not set for this deployment — Prisma/DB features will not work at runtime.");
  }

  let host: string;
  let port: number;
  try {
    const parsed = new URL(databaseUrl);
    host = parsed.hostname;
    port = parsed.port ? Number(parsed.port) : 5432;
  } catch (error) {
    fail(
      `DATABASE_URL is set but isn't a valid connection string for this deployment. ` +
        `(${error instanceof Error ? error.message : String(error)})`,
    );
  }

  await new Promise<void>((resolve, reject) => {
    const socket = connect({ host, port, timeout: TCP_TIMEOUT_MS });
    const onFailure = (reason: string) => {
      socket.destroy();
      reject(
        new BuildHealthCheckError(
          `Database host unreachable at build time — check DATABASE_URL for this deployment (host "${host}:${port}"). ${reason}`,
        ),
      );
    };
    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => onFailure("Connection timed out."));
    socket.once("error", (error) => onFailure(error.message));
  });

  console.log(`  Database host reachable at ${host}:${port}`);
}

async function main() {
  console.log("Running build-time auth/DB health check...");
  checkAdminAuthEnv();
  await checkDatabaseHostReachable();
  console.log("Build health check passed.\n");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n✖ Build health check failed: ${message}\n`);
  process.exitCode = 1;
});
