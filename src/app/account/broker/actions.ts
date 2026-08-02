"use server";

import { requireSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/broker/crypto";
import { clientConfig } from "@/lib/client-config";

interface DhanProfile {
  dhanClientId: string;
  dhanClientName?: string;
  tokenValidity: string;
}

// Dhan returns tokenValidity as "DD/MM/YYYY HH:mm".
function parseTokenValidity(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, day, month, year, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function connectDhanPersonalToken(input: {
  dhanClientId: string;
  accessToken: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!clientConfig.dhanConnectEnabled) {
    return { success: false, error: "Broker connect isn't available on this platform." };
  }

  const subscriber = await requireSubscriber();

  const dhanClientId = input.dhanClientId.trim();
  const accessToken = input.accessToken.trim();

  if (!dhanClientId || !accessToken) {
    return { success: false, error: "Client ID and access token are both required." };
  }

  let profile: DhanProfile;
  try {
    const res = await fetch("https://api.dhan.co/v2/profile", {
      headers: { "access-token": accessToken },
    });

    if (!res.ok) {
      return {
        success: false,
        error: "Dhan rejected that access token — check it's current and try again.",
      };
    }

    profile = await res.json();
  } catch {
    return { success: false, error: "Couldn't reach Dhan to verify the token. Try again shortly." };
  }

  if (profile.dhanClientId !== dhanClientId) {
    return {
      success: false,
      error: "That access token doesn't belong to the Client ID you entered.",
    };
  }

  const tokenExpiresAt = parseTokenValidity(profile.tokenValidity);
  if (!tokenExpiresAt) {
    return { success: false, error: "Couldn't read the token's validity from Dhan's response." };
  }

  await prisma.brokerConnection.upsert({
    where: { subscriberId: subscriber.id },
    create: {
      subscriberId: subscriber.id,
      dhanClientId: profile.dhanClientId,
      dhanClientName: profile.dhanClientName ?? null,
      connectMethod: "PERSONAL_TOKEN",
      accessTokenEnc: encryptSecret(accessToken),
      tokenExpiresAt,
      status: "ACTIVE",
      lastError: null,
    },
    update: {
      dhanClientId: profile.dhanClientId,
      dhanClientName: profile.dhanClientName ?? null,
      connectMethod: "PERSONAL_TOKEN",
      accessTokenEnc: encryptSecret(accessToken),
      tokenExpiresAt,
      status: "ACTIVE",
      lastError: null,
    },
  });

  return { success: true };
}

export async function disconnectDhan(): Promise<{ success: boolean; error?: string }> {
  if (!clientConfig.dhanConnectEnabled) {
    return { success: false, error: "Broker connect isn't available on this platform." };
  }

  const subscriber = await requireSubscriber();

  await prisma.brokerConnection.deleteMany({ where: { subscriberId: subscriber.id } });

  return { success: true };
}

export async function getBrokerConnectionStatus() {
  if (!clientConfig.dhanConnectEnabled) return null;

  const subscriber = await requireSubscriber();

  const connection = await prisma.brokerConnection.findUnique({
    where: { subscriberId: subscriber.id },
    select: {
      dhanClientId: true,
      dhanClientName: true,
      status: true,
      tokenExpiresAt: true,
      connectMethod: true,
    },
  });

  return connection;
}
