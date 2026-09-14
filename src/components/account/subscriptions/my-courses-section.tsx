import Link from "next/link";
import { formatDateOnly, cn } from "@/lib/utils";
import { tgaManagerWhatsAppLink } from "@/lib/product-fulfillment";
import { WhatsAppIcon } from "@/components/site/icons";
import { TerminalCard, EyebrowBadge } from "@/components/account/subscriptions/ui";
import type { CourseEntry } from "@/lib/subscriptions";

/**
 * "My Courses" section of /account/subscriptions — every COURSE-category
 * ProductPurchase, with its computed validity/expiry (Product.accessValidityDays,
 * null = lifetime access, which is every seeded course today) and an access
 * CTA: Product.courseAccessUrl when set, otherwise the existing "ask us on
 * WhatsApp" fallback already used for high-touch categories on the product
 * detail page.
 */
export function MyCoursesSection({ courses }: { courses: CourseEntry[] }) {
  return (
    <TerminalCard
      title="My Courses"
      subtitle="Courses you've purchased."
      accent="primary"
      padding="compact"
      badge={<EyebrowBadge tone="primary">{courses.length} Enrolled</EyebrowBadge>}
    >
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t purchased a course yet — browse the{" "}
          <Link href="/products" className="text-primary underline underline-offset-2">
            catalog
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {courses.map((course) => {
            const whatsappLink = tgaManagerWhatsAppLink(
              `Hi, I'd like help accessing my course "${course.productName}".`,
            );
            const accessHref = course.courseAccessUrl ?? whatsappLink;
            return (
              <li key={course.purchaseId} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                <div className="min-w-0">
                  <span className="mb-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Course
                  </span>
                  <p className="font-heading font-bold text-white">{course.productName}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>Purchased {formatDateOnly(course.purchasedAt)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    {course.accessValidityDays == null ? (
                      <span className="font-medium text-[var(--signalflow-win)]">Lifetime access</span>
                    ) : course.isExpired ? (
                      <span className="text-[var(--signalflow-loss)]">Expired {formatDateOnly(course.expiresAt!)}</span>
                    ) : (
                      <span>Valid until {formatDateOnly(course.expiresAt!)}</span>
                    )}
                  </p>
                </div>
                {accessHref && (
                  <a
                    href={accessHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                      course.courseAccessUrl
                        ? "signalflow-glow signalflow-btn-gradient text-white"
                        : "border border-primary/25 bg-slate-900 text-primary hover:bg-slate-800",
                    )}
                  >
                    {!course.courseAccessUrl && <WhatsAppIcon className="h-3.5 w-3.5" />}
                    {course.courseAccessUrl ? "Access Course" : "Ask about access"}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </TerminalCard>
  );
}
