import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpNavLinkProps {
  href: string;
  className?: string;
}

export function HelpNavLink({ href, className }: HelpNavLinkProps) {
  return (
    <Link
      href={href}
      aria-label="Help manual"
      title="Help manual"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
        className,
      )}
    >
      <HelpCircle className="h-4 w-4" />
    </Link>
  );
}
