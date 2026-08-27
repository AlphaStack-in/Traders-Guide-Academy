"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Gift, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SubscriberNavStatus({
  subscriberName,
  hasRegistered,
}: {
  subscriberName: string | null;
  hasRegistered: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (!subscriberName) {
    if (!hasRegistered) {
      return (
        <Button asChild size="sm" className="signalflow-glow signalflow-btn-gradient text-xs font-semibold">
          <Link href="/register">Register Premium</Link>
        </Button>
      );
    }

    const isLoginActive = pathname.startsWith("/login");
    return (
      <Link
        href="/login"
        aria-current={isLoginActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:inline-flex",
          isLoginActive
            ? "border border-primary/40 bg-primary/10 text-primary signalflow-glow font-semibold"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        <LogIn className="h-3.5 w-3.5 text-primary" />
        <span>Login</span>
      </Link>
    );
  }

  async function handleLogout() {
    await fetch("/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initial = subscriberName.trim().charAt(0).toUpperCase() || "?";
  const isAccountActive = pathname.startsWith("/account");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${subscriberName}'s account menu`}
        className={cn(
          "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold outline-none transition-colors",
          isAccountActive
            ? "border-primary/60 bg-primary/20 text-primary signalflow-glow"
            : "border-primary/40 bg-primary/10 text-primary hover:border-primary/70"
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
          {initial}
        </span>
        <span className="hidden max-w-[90px] truncate sm:inline">{subscriberName.split(" ")[0]}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary/70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <Link href="/account/profile">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <Link href="/account/refer">
            <Gift className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Refer &amp; Earn</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
