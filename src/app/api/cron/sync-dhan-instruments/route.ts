import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncDhanInstruments } from "@/lib/broker/dhan-instrument-sync";
import { getActiveBroker } from "@/lib/app-settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const activeBroker = await getActiveBroker();
  if (activeBroker !== "dhan") {
    return NextResponse.json({ success: true, skipped: "Dhan connect not enabled for this client." });
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncDhanInstruments();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
