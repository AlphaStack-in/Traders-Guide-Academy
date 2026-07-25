"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/signals/new", label: "Add Signal" },
  { href: "/admin/signals", label: "Manage Signals" },
  { href: "/admin/referrals", label: "Referrals" },
];

function useUsername() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      setUsername(email ? email.split("@")[0] : null);
    });
  }, []);

  return username;
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const username = useUsername();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <nav className="hidden items-center gap-4 sm:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
              pathname === link.href && "text-primary",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {username && (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="hidden text-sm font-medium capitalize sm:inline">{username}</span>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 overflow-x-auto border-t border-white/5 px-4 py-2 sm:hidden">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
            pathname === link.href && "text-primary",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
