import { cn } from "@/lib/utils";

/** Pure helper (kept separate from JSX so it's unit-testable — see
 * src/lib/__tests__/star-rating.test.ts): how many of the 5 stars render
 * solid for a given rating, e.g. 4.8 -> 4 solid + 1 outline. */
export function computeStarFill(rating: number): { solid: number; outline: number } {
  const clamped = Math.max(0, Math.min(5, rating));
  const solid = Math.floor(clamped);
  const outline = 5 - solid;
  return { solid, outline };
}

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "#f0c949" : "none"}
      stroke="#f0c949"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6.06 6.6.77-4.86 4.6 1.28 6.57L12 17.3l-5.92 3.2 1.28-6.57-4.86-4.6 6.6-.77z" />
    </svg>
  );
}

/**
 * Renders a product's rating as 5 individual stars (solid = Math.floor(rating),
 * remainder outline) followed by the numeric rating and review count — used
 * on every catalog row and the product detail page. Returns null when a
 * product has no rating yet (several of the migrated Graphy listings don't).
 */
export function StarRating({
  rating,
  count,
  className,
  starClassName,
}: {
  rating: number | null | undefined;
  count?: number | null;
  className?: string;
  starClassName?: string;
}) {
  if (rating == null) return null;
  const { solid, outline } = computeStarFill(rating);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: solid }).map((_, i) => (
          <Star key={`solid-${i}`} filled className={cn("h-3.5 w-3.5", starClassName)} />
        ))}
        {Array.from({ length: outline }).map((_, i) => (
          <Star key={`outline-${i}`} filled={false} className={cn("h-3.5 w-3.5", starClassName)} />
        ))}
      </div>
      <span className="text-xs font-medium text-foreground/80">{rating.toFixed(1)}</span>
      {count != null && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
