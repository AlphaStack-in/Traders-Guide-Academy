import { prisma } from "../src/lib/prisma";
import { normalizeEmail } from "../src/lib/utils";

async function runAudit() {
  console.log("=== SUBSCRIBER DATABASE READ-ONLY AUDIT ===");

  const subscribers = await prisma.subscriber.findMany({
    include: {
      brokerConnection: true,
      goodwillOrderRequests: true,
      orderAuditLogs: true,
      rewardTransactions: true,
      socialPromotionEvents: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total subscribers in database: ${subscribers.length}\n`);

  // Group by email and normalized email
  const rawEmailGroups = new Map<string, typeof subscribers>();
  const normEmailGroups = new Map<string, typeof subscribers>();
  const authUserIdGroups = new Map<string, typeof subscribers>();

  let nullAuthCount = 0;
  let linkedAuthCount = 0;

  for (const sub of subscribers) {
    if (!sub.authUserId) {
      nullAuthCount++;
    } else {
      linkedAuthCount++;
      const authList = authUserIdGroups.get(sub.authUserId) || [];
      authList.push(sub);
      authUserIdGroups.set(sub.authUserId, authList);
    }

    if (sub.email) {
      const rawEmail = sub.email.trim();
      const rawList = rawEmailGroups.get(rawEmail) || [];
      rawList.push(sub);
      rawEmailGroups.set(rawEmail, rawList);

      const norm = normalizeEmail(sub.email);
      if (norm) {
        const normList = normEmailGroups.get(norm) || [];
        normList.push(sub);
        normEmailGroups.set(norm, normList);
      }
    }
  }

  console.log(`Subscribers with authUserId: ${linkedAuthCount}`);
  console.log(`Subscribers with authUserId = NULL: ${nullAuthCount}`);

  // Check duplicate raw emails
  const duplicateRawEmails = Array.from(rawEmailGroups.entries()).filter(
    ([_, list]) => list.length > 1
  );

  // Check duplicate normalized emails
  const duplicateNormEmails = Array.from(normEmailGroups.entries()).filter(
    ([_, list]) => list.length > 1
  );

  // Check duplicate authUserIds
  const duplicateAuthUserIds = Array.from(authUserIdGroups.entries()).filter(
    ([_, list]) => list.length > 1
  );

  console.log(`Unique raw emails with duplicates: ${duplicateRawEmails.length}`);
  console.log(`Unique normalized emails with duplicates: ${duplicateNormEmails.length}`);
  console.log(`Duplicate authUserId instances: ${duplicateAuthUserIds.length}`);

  console.log("\n--- DETAILED SUBSCRIBER LISTING ---");
  for (const s of subscribers) {
    const norm = s.email ? normalizeEmail(s.email) : "N/A";
    const relations = [
      s.brokerConnection ? "BrokerConnection" : null,
      s.goodwillOrderRequests.length > 0 ? `GoodwillOrders(${s.goodwillOrderRequests.length})` : null,
      s.orderAuditLogs.length > 0 ? `OrderLogs(${s.orderAuditLogs.length})` : null,
      s.rewardTransactions.length > 0 ? `Rewards(${s.rewardTransactions.length})` : null,
      s.socialPromotionEvents.length > 0 ? `SocialPromos(${s.socialPromotionEvents.length})` : null,
    ]
      .filter(Boolean)
      .join(", ");

    console.log(`ID: ${s.id}`);
    console.log(`  Name: ${s.name} | Phone: ${s.phone}`);
    console.log(`  Email: ${s.email} (Normalized: ${norm})`);
    console.log(`  authUserId: ${s.authUserId || "NULL"}`);
    console.log(`  Plan: ${s.plan} | CreatedAt: ${s.createdAt.toISOString()}`);
    console.log(`  Relations: ${relations || "None"}`);
    console.log("---------------------------------------------------");
  }

  if (duplicateNormEmails.length > 0) {
    console.log("\n--- DUPLICATE EMAIL GROUPS ANALYSIS ---");
    for (const [normEmail, list] of duplicateNormEmails) {
      console.log(`\nNormalized Email: "${normEmail}" (${list.length} records):`);
      
      // Determine canonical record recommendation
      // Prefer record with authUserId and active relations, or earliest created
      let recommendedCanonical = list.find((r) => r.authUserId && r.brokerConnection);
      if (!recommendedCanonical) {
        recommendedCanonical = list.find((r) => r.authUserId);
      }
      if (!recommendedCanonical) {
        recommendedCanonical = list.find(
          (r) =>
            r.brokerConnection ||
            r.goodwillOrderRequests.length > 0 ||
            r.orderAuditLogs.length > 0 ||
            r.rewardTransactions.length > 0
        );
      }
      if (!recommendedCanonical) {
        recommendedCanonical = list[0];
      }

      for (const rec of list) {
        const isCanonical = rec.id === recommendedCanonical.id;
        const activeRelCount =
          (rec.brokerConnection ? 1 : 0) +
          rec.goodwillOrderRequests.length +
          rec.orderAuditLogs.length +
          rec.rewardTransactions.length;
        
        let statusReason = "";
        if (isCanonical) {
          statusReason = "RECOMMENDED CANONICAL RECORD: ";
          if (rec.authUserId && rec.brokerConnection) statusReason += "Has linked authUserId and active BrokerConnection.";
          else if (rec.authUserId) statusReason += "Has linked authUserId.";
          else if (activeRelCount > 0) statusReason += "Has active database relations.";
          else statusReason += "Earliest created record.";
        } else {
          statusReason = "DUPLICATE RECORD TO ARCHIVE/CLEAN: ";
          if (!rec.authUserId && activeRelCount === 0) statusReason += "Unlinked record with zero relations.";
          else statusReason += `Unlinked record with ${activeRelCount} relations.`;
        }

        console.log(`  Subscriber ID: ${rec.id}`);
        console.log(`    Email: ${rec.email}`);
        console.log(`    authUserId: ${rec.authUserId || "NULL"}`);
        console.log(`    Plan: ${rec.plan}`);
        console.log(`    CreatedAt: ${rec.createdAt.toISOString()}`);
        console.log(`    Recommendation: ${statusReason}`);
      }
    }
  }
}

runAudit()
  .catch((e) => console.error("Audit error:", e))
  .finally(() => prisma.$disconnect());
