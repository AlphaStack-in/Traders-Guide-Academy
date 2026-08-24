import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavbarLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center group", className)}>
      <Image
        src="/tga-logo-horizontal.png"
        alt="Traders Guide Academy"
        width={200}
        height={48}
        className="h-10 w-auto transition-transform group-hover:scale-105 sm:h-12"
        priority
      />
    </Link>
  );
}
