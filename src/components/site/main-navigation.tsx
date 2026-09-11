"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Mail, ShoppingBag, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/signals", label: "Signals", icon: Zap },
  { href: "/products", label: "Products", icon: ShoppingBag },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function isLinkActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

/**
 * Vertical nav-link list rendered inside the left sidebar (see
 * site-sidebar.tsx). A single instance is mounted — the same aside element
 * is reused as the persistent desktop sidebar and the mobile drawer — so
 * `onNavigate` (used to close the drawer on mobile after a tap) is the only
 * thing that varies by context.
 */
export function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const active = isLinkActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
