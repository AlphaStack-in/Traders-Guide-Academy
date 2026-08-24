import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FooterLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center group", className)}>
      <div className="rounded-lg bg-white p-2 transition-all group-hover:shadow-lg group-hover:shadow-blue-400/30 group-hover:scale-105 sm:p-2.5">
        <Image
          src="/tga-favicon.png"
          alt="Traders Guide Academy"
          width={56}
          height={56}
          className="h-12 w-12"
          priority
        />
      </div>
    </Link>
  );
}
