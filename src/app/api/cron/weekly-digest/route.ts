import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { clientConfig } from "@/lib/client-config";
import { getAppSettings } from "@/lib/app-settings";
import { getResendClient, getFromAddress } from "@/lib/email";
import {
  getISTWeekBoundary,
  getDigestRecipients,
  getWeeklySignals,
  computeDigestMetrics,
  hasAlreadySent,
  logDigestSend,
} from "@/lib/digest/weekly-digest";
import { generateUnsubscribeToken } from "@/lib/digest/unsubscribe";
import { renderDigestEmail } from "@/lib/digest/digest-email-template";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAppSettings();
  if (!settings.digestEnabled) {
    return NextResponse.json({
      success: true,
      skipped: "Digest is not enabled for this client.",
    });
  }

  if (!process.env.DIGEST_UNSUBSCRIBE_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: "DIGEST_UNSUBSCRIBE_SECRET is not configured. Skipping email sending.",
      },
      { status: 500 },
    );
  }

  try {
    const { weekStart, weekEnd } = getISTWeekBoundary(new Date());

    const recipients = await getDigestRecipients();
    const signals = await getWeeklySignals(weekStart, weekEnd);
    const metrics = computeDigestMetrics(signals);

    const resend = getResendClient();
    const fromAddress = getFromAddress();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    let sent = 0;
    let skippedAlreadySent = 0;
    let skippedNoEmail = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      if (!recipient.email) {
        skippedNoEmail++;
        continue;
      }

      // Dedup check
      const alreadySent = await hasAlreadySent(recipient.id, weekStart);
      if (alreadySent) {
        skippedAlreadySent++;
        continue;
      }

      // Skip if no signals this week (no point sending empty digest)
      if (metrics.signalCount === 0) {
        continue;
      }

      const unsubscribeToken = generateUnsubscribeToken(recipient.id);
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${encodeURIComponent(recipient.id)}&token=${encodeURIComponent(unsubscribeToken)}`;

      const html = renderDigestEmail({
        subscriberName: recipient.name,
        metrics,
        weekStart,
        weekEnd,
        unsubscribeUrl,
      });

      const subject = `${clientConfig.siteName} Weekly Digest — ${metrics.winRate.toFixed(0)}% Win Rate, ${metrics.signalCount} Signals`;

      if (resend) {
        try {
          const { error } = await resend.emails.send({
            from: fromAddress,
            to: [recipient.email],
            subject,
            html,
          });

          if (error) {
            errors.push(`${recipient.email}: ${error.message}`);
            continue;
          }
        } catch (err) {
          errors.push(
            `${recipient.email}: ${err instanceof Error ? err.message : "Unknown send error"}`,
          );
          continue;
        }
        // Log the send for dedup
        await logDigestSend({
          subscriberId: recipient.id,
          subscriberEmail: recipient.email,
          weekStartDate: weekStart,
          signalCount: metrics.signalCount,
          winRate: metrics.winRate,
          totalPnlPoints: metrics.totalPnlPoints,
          totalPnlRupees: metrics.totalPnlRupees,
        });
      } else {
        // Dev simulation -- log to console
        console.log(`[Dev Email Simulation] Weekly digest to ${recipient.email}`);
        console.log(`[Dev Email Simulation] Subject: ${subject}`);
        console.log(`[Dev Email Simulation] HTML length: ${html.length} chars`);
      }

      sent++;
    }

    return NextResponse.json({
      success: true,
      weekStart: weekStart.toISOString(),
      recipientCount: recipients.length,
      sent,
      skippedAlreadySent,
      skippedNoEmail,
      signalsInWeek: metrics.signalCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Weekly digest cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
