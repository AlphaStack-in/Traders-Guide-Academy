import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FooterLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center group", className)}>
      <div className="rounded-lg bg-white p-1 transition-all group-hover:scale-105 sm:p-1.5">
        <Image
          src="/tga-favicon.png"
          alt="Traders Guide Academy"
          width={80}
          height={80}
          className="h-14 w-14"
          priority
        />
      </div>
    </Link>
  );
}
