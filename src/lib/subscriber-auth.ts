import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentSubscriber() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.subscriber.findUnique({ where: { authUserId: user.id } });
}

export async function requireSubscriber() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    throw new Error("Not authenticated as a subscriber.");
  }
  return subscriber;
}
