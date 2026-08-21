"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Mail, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/signals", label: "Signals", icon: Zap },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function isLinkActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1.5 md:flex">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const active = isLinkActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? "border border-primary/40 bg-primary/10 text-primary signalflow-glow font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const active = isLinkActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border border-primary/40 bg-primary/10 text-primary signalflow-glow font-semibold"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
