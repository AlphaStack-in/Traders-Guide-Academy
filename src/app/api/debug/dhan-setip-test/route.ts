import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/broker/crypto";
import { setDhanStaticIp } from "@/lib/broker/dhan-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// TEMPORARY — isolated one-shot test for the setIP call during staging
// validation. Remove before this branch merges to main.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proxyUrl = process.env.QUOTAGUARD_URL;
  if (!proxyUrl) {
    return NextResponse.json({ error: "QUOTAGUARD_URL is not set" }, { status: 500 });
  }
  const dispatcher = new ProxyAgent(proxyUrl);

  // Hit an IP-echo service a few times through the proxy — QuotaGuard Static
  // typically rotates between two fixed IPs, so we want to discover both
  // rather than assume a single one.
  const seenIps = new Set<string>();
  for (let i = 0; i < 4; i++) {
    try {
      const res = await undiciFetch("https://api.ipify.org?format=json", { dispatcher });
      const body = (await res.json()) as { ip?: string };
      if (body.ip) seenIps.add(body.ip);
    } catch (error) {
      return NextResponse.json(
        { step: "detect-egress-ip", error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }
  }

  const connection = await prisma.brokerConnection.findFirst({ where: { status: "ACTIVE" } });
  if (!connection) {
    return NextResponse.json({ error: "No ACTIVE BrokerConnection found" }, { status: 404 });
  }

  const accessToken = decryptSecret(connection.accessTokenEnc);
  const ips = Array.from(seenIps);
  const flags: ("PRIMARY" | "SECONDARY")[] = ["PRIMARY", "SECONDARY"];

  const setIpResults = [];
  for (let i = 0; i < ips.length && i < 2; i++) {
    const result = await setDhanStaticIp({
      accessToken,
      dhanClientId: connection.dhanClientId,
      ip: ips[i],
      ipFlag: flags[i],
    });
    setIpResults.push({ ip: ips[i], ipFlag: flags[i], status: result.status, ok: result.ok, body: result.rawBody });
  }

  const anySuccess = setIpResults.some((r) => r.ok);
  if (anySuccess) {
    await prisma.brokerConnection.update({
      where: { id: connection.id },
      data: { ipWhitelisted: true },
    });
  }

  return NextResponse.json({
    detectedEgressIps: ips,
    dhanClientId: connection.dhanClientId,
    setIpResults,
  });
}
