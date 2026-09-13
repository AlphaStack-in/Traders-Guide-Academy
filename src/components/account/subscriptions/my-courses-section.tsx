import Link from "next/link";
import { formatDateOnly, cn } from "@/lib/utils";
import { tgaManagerWhatsAppLink } from "@/lib/product-fulfillment";
import { WhatsAppIcon } from "@/components/site/icons";
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
    <div className="signalflow-glass signalflow-neutral-border flex flex-col gap-3 rounded-2xl border p-5">
      <div>
        <h2 className="font-heading text-lg font-bold">My Courses</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Courses you&apos;ve purchased.</p>
      </div>

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
              <li
                key={course.purchaseId}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-heading font-semibold">{course.productName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Purchased {formatDateOnly(course.purchasedAt)} ·{" "}
                    {course.accessValidityDays == null ? (
                      "Lifetime access"
                    ) : course.isExpired ? (
                      <span className="text-[var(--signalflow-loss)]">
                        Expired {formatDateOnly(course.expiresAt!)}
                      </span>
                    ) : (
                      `Valid until ${formatDateOnly(course.expiresAt!)}`
                    )}
                  </p>
                </div>
                {accessHref && (
                  <a
                    href={accessHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold",
                      course.courseAccessUrl
                        ? "signalflow-glow signalflow-btn-gradient text-white"
                        : "border border-white/10 text-primary",
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
    </div>
  );
}
