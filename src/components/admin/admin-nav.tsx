"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  LogOut,
  MessageSquare,
  Shield,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
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
import { IstClock } from "@/components/site/ist-clock";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/signals", label: "Manage Signals", icon: Zap },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

const membersLinks = [
  { href: "/admin/subscribers", label: "View Members" },
  { href: "/admin/referrals", label: "Referrals" },
  ...(clientConfig.dhanConnectEnabled
    ? [{ href: "/admin/broker-sessions", label: "Broker Sessions" }]
    : []),
];

function getAdminGroupLinks(isSuperAdmin: boolean) {
  return [
    { href: "/admin/changelog", label: "Changelog" },
    ...(clientConfig.goodwillBrokerEnabled
      ? [{ href: "/admin/goodwill-orders", label: "Order Requests" }]
      : []),
    ...(isSuperAdmin ? [{ href: "/admin/admin-users", label: "Admin Users" }] : []),
  ];
}

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

export function AdminNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const username = useUsername();
  const adminGroupLinks = getAdminGroupLinks(isSuperAdmin);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const isMembersActive = membersLinks.some((link) => pathname.startsWith(link.href));
  const isAdminGroupActive = adminGroupLinks.some((link) => pathname.startsWith(link.href));

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <IstClock />
      <nav className="hidden items-center gap-2 lg:flex">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all",
                active
                  ? "border border-primary/40 bg-primary/10 text-primary thc-glow font-semibold"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              <span>{link.label}</span>
            </Link>
          );
        })}

        {/* Members Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none transition-all cursor-pointer",
              isMembersActive
                ? "border border-primary/40 bg-primary/10 text-primary thc-glow font-semibold"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Users className={cn("h-4 w-4", isMembersActive ? "text-primary" : "text-muted-foreground")} />
            <span>Members</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {membersLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
                  <Link
                    href={link.href}
                    className={cn(active && "font-semibold text-primary")}
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin Group Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none transition-all cursor-pointer",
              isAdminGroupActive
                ? "border border-primary/40 bg-primary/10 text-primary thc-glow font-semibold"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Shield className={cn("h-4 w-4", isAdminGroupActive ? "text-primary" : "text-muted-foreground")} />
            <span>Admin</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {adminGroupLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
                  <Link
                    href={link.href}
                    className={cn(active && "font-semibold text-primary")}
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      {username && (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="hidden text-xs font-semibold capitalize sm:inline">{username}</span>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs font-medium">
        <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Logout</span>
      </Button>
    </div>
  );
}

export function AdminMobileNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const allLinks = [...links, ...membersLinks, ...getAdminGroupLinks(isSuperAdmin)];

  return (
    <nav className="flex items-center gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
      {allLinks.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              active
                ? "border border-primary/40 bg-primary/10 text-primary thc-glow font-semibold"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
