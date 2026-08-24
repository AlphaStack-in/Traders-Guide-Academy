import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/digest/unsubscribe";
import { clientConfig } from "@/lib/client-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subscriberId = searchParams.get("id");
  const token = searchParams.get("token");

  if (!subscriberId || !token) {
    return new NextResponse(renderPage("Invalid Link", "The unsubscribe link is missing required parameters."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!verifyUnsubscribeToken(subscriberId, token)) {
    return new NextResponse(renderPage("Invalid Link", "This unsubscribe link is invalid or has expired. Please contact support if you need help."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    await prisma.subscriber.update({
      where: { id: subscriberId },
      data: { emailDigestOptOut: true },
    });

    return new NextResponse(renderPage("Unsubscribed", "You have been successfully unsubscribed from the weekly performance digest. You will no longer receive these emails."), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(renderPage("Error", "Something went wrong. Please try again or contact support."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${clientConfig.siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
  <div style="max-width: 400px; padding: 32px; text-align: center; color: #F3F4F6;">
    <h1 style="color: #F0C949; font-size: 24px; margin-bottom: 16px;">${title}</h1>
    <p style="font-size: 14px; color: #D1D5DB; line-height: 1.6;">${message}</p>
    <p style="font-size: 12px; color: #6B7280; margin-top: 24px;">${clientConfig.siteName}</p>
  </div>
</body>
</html>`;
}
