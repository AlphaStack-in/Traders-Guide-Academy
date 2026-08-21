import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

export async function getCurrentSubscriber() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) return null;

    const normalized = normalizeEmail(user.email);
    if (!normalized) return null;

    // 1. First check if linked by authUserId
    let subscriber = await prisma.subscriber.findUnique({
      where: { authUserId: user.id },
    });

    if (subscriber) {
      return subscriber;
    }

    // 2. If not linked by authUserId yet, look up by normalized email
    const subscribersByEmail = await prisma.subscriber.findMany({
      where: { email: { equals: normalized, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });

    if (subscribersByEmail.length === 0) {
      return null;
    }

    // Find unlinked subscriber record
    const unlinked = subscribersByEmail.find((s) => !s.authUserId);

    if (unlinked) {
      try {
        subscriber = await prisma.subscriber.update({
          where: { id: unlinked.id },
          data: { authUserId: user.id },
        });
        return subscriber;
      } catch (err) {
        console.error("getCurrentSubscriber: failed to link authUserId:", err);
        return unlinked;
      }
    }

    // If no unlinked record was found, check if one matches authUserId
    const matched = subscribersByEmail.find((s) => s.authUserId === user.id);
    return matched || null;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("getCurrentSubscriber exception:", err);
    }
    return null;
  }
}

export async function requireSubscriber() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    throw new Error("Not authenticated as a subscriber.");
  }
  return subscriber;
}

/**
 * Hardened subscriber account linking helper.
 * Enforces canonical linking: Supabase User ID <-> Subscriber.authUserId.
 */
export async function linkSubscriberAccount(): Promise<{
  success: boolean;
  error?: string;
  errorCode?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      console.error("linkSubscriberAccount: No valid authenticated user session found:", userError);
      return {
        success: false,
        error: "No authenticated session found. Please try logging in again.",
        errorCode: "auth_failed",
      };
    }

    const normalized = normalizeEmail(user.email);
    if (!normalized) {
      console.error("linkSubscriberAccount: User email could not be normalized:", user.email);
      return {
        success: false,
        error: "Invalid email format on user account.",
        errorCode: "auth_failed",
      };
    }

    // 1. Check if there is already a subscriber linked to user.id
    const subscriberByAuthId = await prisma.subscriber.findUnique({
      where: { authUserId: user.id },
    });

    // 2. Find all subscriber records matching normalized email
    const subscribersByEmail = await prisma.subscriber.findMany({
      where: { email: { equals: normalized, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });

    // Security Rule: Never create a Subscriber automatically.
    // If no subscriber record exists for this email AND no subscriber is linked to user.id:
    if (subscribersByEmail.length === 0 && !subscriberByAuthId) {
      console.warn("linkSubscriberAccount: Email not in Subscriber table:", normalized);
      return {
        success: false,
        error: "This email is not registered as a premium subscriber. Please check your email or register first.",
        errorCode: "not_a_subscriber",
      };
    }

    // Security Rule: If subscriberByAuthId exists, verify it matches the user's email
    if (subscriberByAuthId) {
      const authIdEmailNormalized = subscriberByAuthId.email ? normalizeEmail(subscriberByAuthId.email) : null;
      if (authIdEmailNormalized === normalized) {
        // Authenticated user is already properly linked to their subscriber record
        return { success: true };
      } else {
        // Account Takeover Prevention: user.id is linked to Subscriber A (email A), but current session email is email B
        console.warn(
          `linkSubscriberAccount: Mismatch! user.id ${user.id} is linked to subscriber ${subscriberByAuthId.id} (${subscriberByAuthId.email}), but current session email is ${normalized}`
        );
        return {
          success: false,
          error: "This account is already linked to a different subscriber.",
          errorCode: "account_already_linked",
        };
      }
    }

    // At this point, subscriberByAuthId is null.
    // Check if any subscriber in subscribersByEmail is already linked to a DIFFERENT authUserId
    const linkedToOther = subscribersByEmail.find(
      (s) => s.authUserId && s.authUserId !== user.id
    );

    const unlinkedSubscriber = subscribersByEmail.find((s) => !s.authUserId);

    if (!unlinkedSubscriber) {
      if (linkedToOther) {
        console.warn(
          `linkSubscriberAccount: Account takeover attempt. Subscriber ${linkedToOther.id} (${normalized}) is already linked to authUserId: ${linkedToOther.authUserId}`
        );
        return {
          success: false,
          error: "This email is already linked to a different account.",
          errorCode: "account_already_linked",
        };
      }
      return {
        success: false,
        error: "No eligible subscriber account found for linking.",
        errorCode: "auth_failed",
      };
    }

    // Link authUserId to the unlinked subscriber record
    try {
      await prisma.subscriber.update({
        where: { id: unlinkedSubscriber.id },
        data: { authUserId: user.id },
      });
      console.log(
        `linkSubscriberAccount: Successfully linked authUserId ${user.id} to subscriber ${unlinkedSubscriber.id} (${normalized})`
      );
    } catch (updateErr: unknown) {
      console.error("linkSubscriberAccount: Prisma error during subscriber update:", updateErr);
      // Race condition fallback: Did a concurrent request complete the linking?
      try {
        const recheck = await prisma.subscriber.findUnique({
          where: { authUserId: user.id },
        });
        if (recheck && recheck.email && normalizeEmail(recheck.email) === normalized) {
          console.log(`linkSubscriberAccount: Race condition recovered for user ${user.id}`);
          return { success: true };
        }
      } catch (recheckErr) {
        console.error("linkSubscriberAccount: Recheck error during fallback:", recheckErr);
      }

      return {
        success: false,
        error: "Failed to link subscriber account.",
        errorCode: "auth_failed",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("linkSubscriberAccount exception during DB lookup or update:", err);
    return {
      success: false,
      error: "Subscriber account verification failed. Please try again.",
      errorCode: "auth_failed",
    };
  }
}

