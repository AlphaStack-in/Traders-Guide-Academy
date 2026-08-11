"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function requestSubscriberMagicLink(
  emailInput: string,
  origin: string,
  redirectToParam?: string
): Promise<{ success: boolean; error?: string }> {
  const email = emailInput.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // 1. Verify subscriber exists in database before sending link
  const subscriber = await prisma.subscriber.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!subscriber) {
    return {
      success: false,
      error: "This email is not registered as a premium subscriber. Please check your email or register first.",
    };
  }

  // 2. Build email redirect URL using current origin
  const redirectTo = redirectToParam || "/signals";
  const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

  // 3. Request magic link via Supabase Auth
  const supabase = await createSupabaseServerClient();
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: callbackUrl,
    },
  });

  if (otpError) {
    console.error("Supabase Auth signInWithOtp error for", email, ":", otpError);
    if (otpError.message.includes("rate limit") || otpError.status === 429) {
      return {
        success: false,
        error: "Email send rate limit reached. Please wait a few minutes before trying again.",
      };
    }
    if (otpError.message.includes("redirect")) {
      return {
        success: false,
        error: "Sign-in redirect URL is not authorized in Supabase Auth configuration.",
      };
    }
    return {
      success: false,
      error: `Unable to send sign-in link (${otpError.message}). Please try again.`,
    };
  }

  return { success: true };
}

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
