"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function linkSubscriberAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "No authenticated session found." };
  }

  const existing = await prisma.subscriber.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });

  if (!existing) {
    return {
      success: false,
      error: "This email isn't registered as a premium subscriber yet.",
    };
  }

  if (existing.authUserId && existing.authUserId !== user.id) {
    return {
      success: false,
      error: "This email is already linked to a different account.",
    };
  }

  if (!existing.authUserId) {
    await prisma.subscriber.update({
      where: { id: existing.id },
      data: { authUserId: user.id },
    });
  }

  return { success: true };
}
