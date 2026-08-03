// Runs as a "prebuild" step (see package.json) before every `next build`.
// Fails the build immediately, with a specific actionable message, if this
// deployment's own configured Supabase project or database host isn't
// reachable — added after the 2026-08-02 Goodwill outage where a stale
// DATABASE_URL only surfaced as a runtime Prisma error in production.
import { config as loadEnv } from "dotenv";
import { connect } from "node:net";

// Vercel's real per-deployment env vars are already in process.env by the
// time this runs; dotenv's default "don't override existing keys" behavior
// means these are only a fallback for running the script locally.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const FETCH_TIMEOUT_MS = 5000;
const TCP_TIMEOUT_MS = 3000;

class BuildHealthCheckError extends Error {}

function fail(message: string): never {
  throw new BuildHealthCheckError(message);
}

async function checkSupabaseAuthHealth(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    fail(
      "NEXT_PUBLIC_SUPABASE_URL is not set for this deployment — Supabase Auth will not work at runtime.",
    );
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    fail(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set for this deployment — Supabase Auth will not work at runtime.",
    );
  }

  // GoTrue's health endpoint 401s without an apikey header — it's not
  // actually checking auth, just requires the header to be present.
  const healthUrl = new URL("/auth/v1/health", url).toString();

  let response: Response;
  try {
    response = await fetch(healthUrl, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    fail(
      `Supabase project unreachable at build time — check NEXT_PUBLIC_SUPABASE_URL for this deployment ` +
        `(currently "${url}"). Request to ${healthUrl} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    fail(
      `Supabase project responded but is unhealthy — check NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY ` +
        `for this deployment (currently "${url}"). ${healthUrl} returned HTTP ${response.status}.`,
    );
  }

  console.log(`  Supabase Auth reachable at ${url}`);
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
  console.log("Running build-time Supabase/DB health check...");
  await checkSupabaseAuthHealth();
  await checkDatabaseHostReachable();
  console.log("Build health check passed.\n");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n✖ Build health check failed: ${message}\n`);
  process.exitCode = 1;
});
