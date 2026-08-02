import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/broker/crypto";
import { renewDhanToken } from "@/lib/broker/dhan-client";
import { clientConfig } from "@/lib/client-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dhan's own renewal grant — a successful RenewToken call extends validity
// by another 24h from the moment it's called, regardless of how much of the
// prior window was left.
const RENEWED_TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

interface RenewTokenResponseBody {
  accessToken?: string;
  token?: string;
}

// Runs every morning before market open. Silently renews every ACTIVE
// connection's Dhan token — subscribers only see a "reconnect" prompt if
// their renewal actually fails (lapsed token, Dhan rejection, etc.), not on
// a blanket daily basis.
export async function GET(request: Request) {
  if (!clientConfig.dhanConnectEnabled) {
    return NextResponse.json({ success: true, skipped: "Dhan connect not enabled for this client." });
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.brokerConnection.findMany({ where: { status: "ACTIVE" } });

  let renewed = 0;
  let failed = 0;

  for (const connection of connections) {
    try {
      const accessToken = decryptSecret(connection.accessTokenEnc);
      const result = await renewDhanToken({ accessToken, dhanClientId: connection.dhanClientId });

      if (!result.ok) {
        failed++;
        await prisma.brokerConnection.update({
          where: { id: connection.id },
          data: {
            status: "EXPIRED",
            lastError: `RenewToken failed (HTTP ${result.status}): ${result.rawBody.slice(0, 500)}`,
          },
        });
        continue;
      }

      const body = result.data as RenewTokenResponseBody | null;
      const newAccessToken = body?.accessToken ?? body?.token ?? accessToken;

      await prisma.brokerConnection.update({
        where: { id: connection.id },
        data: {
          accessTokenEnc: encryptSecret(newAccessToken),
          tokenExpiresAt: new Date(Date.now() + RENEWED_TOKEN_VALIDITY_MS),
          lastRenewedAt: new Date(),
          status: "ACTIVE",
          lastError: null,
        },
      });
      renewed++;
    } catch (error) {
      failed++;
      await prisma.brokerConnection.update({
        where: { id: connection.id },
        data: {
          status: "EXPIRED",
          lastError: error instanceof Error ? error.message : "Unknown renewal error",
        },
      });
    }
  }

  return NextResponse.json({ success: true, total: connections.length, renewed, failed });
}
