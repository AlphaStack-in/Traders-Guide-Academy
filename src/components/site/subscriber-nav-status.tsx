"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SubscriberNavStatus({ subscriberName }: { subscriberName: string | null }) {
  const router = useRouter();

  if (!subscriberName) {
    return (
      <Link
        href="/login"
        className="hidden text-xs text-muted-foreground/70 transition-colors hover:text-primary sm:inline"
      >
        Login
      </Link>
    );
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="text-xs text-muted-foreground/70">Hi, {subscriberName.split(" ")[0]}</span>
      <Link
        href="/account/broker"
        className="text-xs text-muted-foreground/70 transition-colors hover:text-primary"
      >
        Broker
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="text-xs text-muted-foreground/70 underline-offset-2 transition-colors hover:text-primary hover:underline"
      >
        Log out
      </button>
    </div>
  );
}
