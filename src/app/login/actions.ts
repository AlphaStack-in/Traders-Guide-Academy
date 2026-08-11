"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { linkSubscriberAccount as linkSubscriberAccountImpl } from "@/lib/subscriber-auth";


export async function linkSubscriberAccount() {
  return linkSubscriberAccountImpl();
}



/**
 * Request passwordless magic link for registered subscribers.
 */
export async function requestSubscriberMagicLink(
  emailInput: string,
  origin: string,
  redirectToParam?: string
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeEmail(emailInput);

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // Verify subscriber exists in database before sending link
  const subscriber = await prisma.subscriber.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!subscriber) {
    return {
      success: false,
      error: "This email is not registered as a premium subscriber. Please check your email or register first.",
    };
  }

  const redirectTo = redirectToParam || "/signals";
  const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

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

/**
 * Request password reset email for existing subscribers.
 */
export async function requestPasswordReset(
  emailInput: string,
  origin: string
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeEmail(emailInput);

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!subscriber) {
    return {
      success: false,
      error: "This email is not registered as a premium subscriber. Please check your email or register first.",
    };
  }

  const redirectUrl = `${origin}/auth/reset-password`;
  const supabase = await createSupabaseServerClient();
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (resetError) {
    console.error("Supabase resetPasswordForEmail error for", email, ":", resetError);
    return {
      success: false,
      error: `Unable to send password reset email (${resetError.message}). Please try again.`,
    };
  }

  return { success: true };
}



