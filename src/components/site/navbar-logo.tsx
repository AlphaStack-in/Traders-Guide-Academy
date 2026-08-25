import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavbarLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center group", className)}>
      <div className="rounded-lg border border-white/20 p-2 transition-all group-hover:shadow-lg group-hover:shadow-blue-400/30 group-hover:scale-105 sm:p-2.5">
        <Image
          src="/tga-logo-horizontal.png"
          alt="Traders Guide Academy"
          width={200}
          height={48}
          className="h-10 w-auto"
          priority
        />
      </div>
    </Link>
  );
}
