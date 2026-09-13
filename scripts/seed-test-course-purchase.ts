// One-off dev helper: creates a CAPTURED ProductPurchase for any catalog
// product (including COURSE) against a real subscriber, WITHOUT going through
// Cashfree — for testing product fulfillment emails and account access UI.
//
// Usage:
//   npx tsx scripts/seed-test-course-purchase.ts <subscriber-email>
//   npx tsx scripts/seed-test-course-purchase.ts <subscriber-email> <product-slug>
//   npx tsx scripts/seed-test-course-purchase.ts <subscriber-email> <product-slug> --fulfill
//
// <product-slug> defaults to "option-mastery" (a seeded COURSE — see
// prisma/seed-products.ts). Pass --fulfill to run fulfillProductPurchase
// (sends the confirmation email + internal Telegram alert).
//
// Idempotent: reuses an existing CAPTURED purchase for this
// subscriber/product. With --fulfill, fulfillment runs only when fulfilledAt
// is still null (same guard as production webhooks).
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "../src/lib/utils";
import { fulfillProductPurchase } from "../src/lib/product-fulfillment";

const prisma = new PrismaClient();

const DEFAULT_COURSE_SLUG = "option-mastery";

async function main() {
  const rawEmail = process.argv[2];
  const rest = process.argv.slice(3);
  const shouldFulfill = rest.includes("--fulfill");
  const productSlug = rest.find((arg) => !arg.startsWith("--")) ?? DEFAULT_COURSE_SLUG;

  if (!rawEmail) {
    console.error(
      "Usage: npx tsx scripts/seed-test-course-purchase.ts <subscriber-email> [product-slug] [--fulfill]",
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

  if (product.accessValidityDays != null) {
    console.log(`Product accessValidityDays: ${product.accessValidityDays}`);
  } else {
    console.log(
      `Product accessValidityDays is null (lifetime access) — set it on this product in the DB to test the validity block in the email.`,
    );
  }

  if (shouldFulfill) {
    if (purchase.fulfilledAt) {
      console.log(
        `Purchase was already fulfilled at ${purchase.fulfilledAt.toISOString()} — skipping fulfillProductPurchase (delete fulfilledAt or use a fresh purchase to re-test the email).`,
      );
    } else {
      await fulfillProductPurchase(purchase.id);
      console.log("Fulfillment ran — check console for [Dev Email Simulation] output (or the subscriber inbox if RESEND_API_KEY is set).");
    }
  }
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
