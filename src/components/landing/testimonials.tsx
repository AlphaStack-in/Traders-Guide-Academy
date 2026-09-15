import { clientConfig } from "@/lib/client-config";

const AVATAR_COLORS = [
  "var(--signalflow-gold-start)",
  "var(--signalflow-ce)",
  "var(--signalflow-pe)",
  "var(--signalflow-win)",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span aria-label={`${rating.toFixed(1)} out of 5 stars`} className="text-xs tracking-tight">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < rounded ? "text-[var(--signalflow-gold-start)]" : "text-white/15"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function Testimonials() {
  const testimonials = clientConfig.testimonials;
  const ratings = testimonials.map((t) => t.rating ?? 5);
  const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              What our <span className="signalflow-gold-text">subscribers say</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real feedback from our premium subscribers.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground sm:self-auto">
            <Stars rating={averageRating} />
            <span className="font-bold text-foreground">{averageRating.toFixed(1)} / 5.0</span>
            <span className="hidden text-muted-foreground/70 sm:inline">Overall Rating</span>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-card/70 p-6"
            >
              <div>
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 rounded bg-[var(--signalflow-win)]/10 px-2.5 py-1 font-semibold text-[var(--signalflow-win)]">
                    ✓ Verified Trader
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{t.date}</span>
                </div>
                <div className="mb-3">
                  <Stars rating={t.rating ?? 5} />
                </div>
                <p className="mb-6 text-sm leading-relaxed text-foreground/90 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {initials(t.name)}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
