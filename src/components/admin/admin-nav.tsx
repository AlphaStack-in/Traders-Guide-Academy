"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clientConfig } from "@/lib/client-config";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/signals", label: "Manage Signals" },
  { href: "/admin/messages", label: "Messages" },
];

const membersLinks = [
  { href: "/admin/subscribers", label: "View Members" },
  { href: "/admin/referrals", label: "Referrals" },
  ...(clientConfig.dhanConnectEnabled
    ? [{ href: "/admin/broker-sessions", label: "Broker Sessions" }]
    : []),
  ...(clientConfig.goodwillBrokerEnabled
    ? [{ href: "/admin/goodwill-orders", label: "Order Requests" }]
    : []),
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
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-primary",
              membersLinks.some((link) => link.href === pathname) && "text-primary",
            )}
          >
            Members
            <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {membersLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href}>{link.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
      {[...links, ...membersLinks].map((link) => (
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
