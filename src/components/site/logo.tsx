import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { clientConfig } from "@/lib/client-config";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <Image
        src={clientConfig.logoSrc}
        alt={clientConfig.logoAlt}
        width={56}
        height={56}
        className="h-12 w-12 transition-transform group-hover:scale-105 sm:h-14 sm:w-14"
        priority
      />
    </Link>
  );
}
