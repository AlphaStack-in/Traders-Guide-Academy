// One-off dev helper: simulates the first-time "membership activated" email
// that the Cashfree SUBSCRIPTION_STATUS_CHANGE webhook sends when a
// subscription goes ACTIVE — including the activationEmailSentAt one-time guard.
//
// Usage:
//   npx tsx scripts/seed-test-subscription-activation.ts <subscriber-email>
//
// Idempotent: finds or creates a dev-only Subscription row
// (providerSubscriptionId = dev-activation-test-<subscriberId>) with ACTIVE
// status. Replicates the guard in src/app/api/webhooks/cashfree/route.ts.
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { sendSubscriptionActivatedEmail } from "../src/lib/email";
import { normalizeEmail } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.argv[2];
  if (!rawEmail) {
    console.error("Usage: npx tsx scripts/seed-test-subscription-activation.ts <subscriber-email>");
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

  const providerSubscriptionId = `dev-activation-test-${subscriber.id}`;
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  let subscription = await prisma.subscription.findUnique({
    where: { providerSubscriptionId },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        subscriberId: subscriber.id,
        billingCycle: "MONTHLY",
        providerSubscriptionId,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
    });
    console.log(
      `Created dev test subscription ${subscription.id} (ACTIVE, renews ${periodEnd.toDateString()}).`,
    );
  } else {
    console.log(`Reusing dev test subscription ${subscription.id}.`);
  }

  const updated = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscription.id },
    include: { subscriber: true },
  });

  if (!updated.activationEmailSentAt) {
    if (updated.subscriber.email && updated.currentPeriodEnd) {
      const billingCycleLabel =
        updated.billingCycle.charAt(0) + updated.billingCycle.slice(1).toLowerCase();
      await sendSubscriptionActivatedEmail({
        toEmail: updated.subscriber.email,
        memberName: updated.subscriber.name,
        billingCycleLabel,
        startDate: new Date(),
        renewsOn: updated.currentPeriodEnd,
      });
      console.log("Activation email sent (or dev-simulated above).");
    } else {
      console.log("Skipping email — subscriber has no email or subscription has no currentPeriodEnd.");
    }
    await prisma.subscription.update({
      where: { id: updated.id },
      data: { activationEmailSentAt: new Date() },
    });
  } else {
    console.log(
      `Activation email already sent on ${updated.activationEmailSentAt.toISOString()} — skipping (this is the intended first-time-only behavior).`,
    );
  }
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
