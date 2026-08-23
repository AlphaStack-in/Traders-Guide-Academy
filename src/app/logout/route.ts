import { NextResponse } from "next/server";
import { clearSubscriberSession } from "@/lib/subscriber-auth";

export async function POST() {
  await clearSubscriberSession();
  return NextResponse.json({ ok: true });
}
