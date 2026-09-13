// One-off dev helper: creates a CAPTURED ProductPurchase for the PMS product
// against a real subscriber, WITHOUT going through Cashfree — for testing
// the PMS account summary/growth feature (/account/subscriptions,
// /admin/pms-accounts) while Cashfree isn't activated yet (pending SEBI
// license). Not meant for production use — a purchase created this way was
// never actually paid for.
//
// Usage:
//   npx tsx scripts/seed-test-pms-purchase.ts <subscriber-email>
//   npx tsx scripts/seed-test-pms-purchase.ts <subscriber-email> <product-slug>
//   npx tsx scripts/seed-test-pms-purchase.ts <subscriber-email> --fulfill
//
// <product-slug> defaults to "portfolio-management-service" (the only PMS
// product seeded today — see prisma/seed-products.ts). Pass --fulfill to
// also run fulfillProductPurchase (sends the real confirmation email +
// internal Telegram alert, same as a genuine purchase) — omitted by default
// since this is a synthetic purchase and you may not want those side
// effects while testing.
//
// Idempotent: if a CAPTURED purchase already exists for this
// subscriber/product, it's reused rather than duplicated.
import "dotenv/config";

// Prisma client -- direct import since this runs outside Next.js
import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "../src/lib/utils";
import { fulfillProductPurchase } from "../src/lib/product-fulfillment";

const prisma = new PrismaClient();

const DEFAULT_PMS_SLUG = "portfolio-management-service";

async function main() {
  const rawEmail = process.argv[2];
  const rest = process.argv.slice(3);
  const shouldFulfill = rest.includes("--fulfill");
  const productSlug = rest.find((arg) => !arg.startsWith("--")) ?? DEFAULT_PMS_SLUG;

  if (!rawEmail) {
    console.error(
      "Usage: npx tsx scripts/seed-test-pms-purchase.ts <subscriber-email> [product-slug] [--fulfill]",
    );
    process.exit(1);
  }

  const email = normalizeEmail(rawEmail);
  const subscriber = await prisma.subscriber.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!subscriber) {
    console.error(`No subscriber found with email "${rawEmail}".`);
    process.exit(1);
  }

  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product) {
    console.error(`No product found with slug "${productSlug}".`);
    process.exit(1);
  }
  if (product.category !== "PMS") {
    console.error(
      `"${product.name}" is a ${product.category} product, not PMS — pass a PMS product slug ` +
        `(the seeded one is "${DEFAULT_PMS_SLUG}").`,
    );
    process.exit(1);
  }

  const existing = await prisma.productPurchase.findFirst({
    where: { subscriberId: subscriber.id, productId: product.id, status: "CAPTURED" },
  });

  const purchase =
    existing ??
    (await prisma.productPurchase.create({
      data: {
        subscriberId: subscriber.id,
        productId: product.id,
        amountInPaise: product.priceInPaise,
        status: "CAPTURED",
      },
    }));

  console.log(
    existing
      ? `Reusing existing CAPTURED purchase ${purchase.id} for ${subscriber.name} (${subscriber.email}).`
      : `Created CAPTURED purchase ${purchase.id}: ${subscriber.name} (${subscriber.email}) → "${product.name}".`,
  );

  if (shouldFulfill && !purchase.fulfilledAt) {
    await fulfillProductPurchase(purchase.id);
    console.log("Fulfillment ran — check the subscriber's email and the ops Telegram channel.");
  }

  console.log(
    `\nNext: open /admin/pms-accounts, find ${subscriber.name}'s row, and click "Add valuation" — ` +
      `then check /account/subscriptions as that subscriber.`,
  );
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
