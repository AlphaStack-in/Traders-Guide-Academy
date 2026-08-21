import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { clientConfig } from "@/lib/client-config";

export function Logo({ className }: { className?: string }) {
  const [firstWord, ...rest] = clientConfig.siteName.split(" ");
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <Image
        src={clientConfig.logoSrc}
        alt={clientConfig.logoAlt}
        width={56}
        height={56}
        className="h-12 w-12 rounded-full shadow-[0_2px_16px_-4px_var(--signalflow-gold-start)] transition-transform group-hover:scale-105 sm:h-14 sm:w-14"
        priority
      />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-bold tracking-tight sm:text-xl">
          <span className="signalflow-gold-text">{firstWord}</span>{" "}
          {rest.length > 0 && <span className="text-foreground">{rest.join(" ")}</span>}
        </span>
        {clientConfig.tagline && (
          <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[10px]">
            {clientConfig.tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
