import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentSubscriber() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  let subscriber = await prisma.subscriber.findUnique({ where: { authUserId: user.id } });

  if (!subscriber) {
    subscriber = await prisma.subscriber.findFirst({
      where: { email: { equals: user.email, mode: "insensitive" } },
    });
    if (subscriber && !subscriber.authUserId) {
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { authUserId: user.id },
      });
    }
  }

  return subscriber;
}

export async function requireSubscriber() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    throw new Error("Not authenticated as a subscriber.");
  }
  return subscriber;
}
