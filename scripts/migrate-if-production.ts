// Runs during "prebuild" (after check-build-health, before `next build`).
// Applies pending Prisma migrations only on Vercel Production deployments.
// Preview and local builds skip this — TGA shares one DATABASE_URL across
// Production, Preview, and dev, so running migrate deploy on every preview
// would apply unreviewed branch migrations to the live database.
import { config as loadEnv } from "dotenv";
import { execSync } from "node:child_process";

// Same env loading as check-build-health.ts — Vercel injects real vars first;
// dotenv only fills gaps for local runs.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

function main(): void {
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv !== "production") {
    const label = vercelEnv ?? "local/unset";
    console.log(`Skipping prisma migrate deploy (VERCEL_ENV=${label}, production-only).\n`);
    return;
  }

  console.log("VERCEL_ENV=production — running prisma migrate deploy...");

  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
  } catch {
    console.error("\n✖ prisma migrate deploy failed.\n");
    process.exitCode = 1;
    return;
  }

  console.log("Prisma migrations applied.\n");
}

main();
