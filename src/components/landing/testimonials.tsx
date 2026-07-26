import { clientConfig } from "@/lib/client-config";
import { repeatForMarquee } from "@/lib/marquee";

// w-80 (320px) card + mr-4 (16px).
const CARD_WIDTH_PX = 336;

const AVATAR_COLORS = [
  "var(--thc-gold-start)",
  "var(--thc-ce)",
  "var(--thc-pe)",
  "var(--thc-win)",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  const repeated = repeatForMarquee(clientConfig.testimonials, CARD_WIDTH_PX);
  const items = [...repeated, ...repeated];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          What our <span className="thc-gold-text">subscribers say</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Real feedback from our premium subscribers.
        </p>
      </div>

      <div
        className="relative mt-10 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="thc-marquee-track flex w-max"
          style={{ ["--thc-marquee-duration" as string]: "56s" }}
        >
          {items.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="thc-glass thc-glow mr-4 flex w-80 shrink-0 flex-col rounded-2xl border border-white/5 p-5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-2xl leading-none text-primary">&ldquo;</span>
                <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--thc-win)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--thc-win)]" />
                  Verified
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {t.date}
                </span>
                <span className="text-xs text-[var(--thc-gold-start)]">★★★★★</span>
              </div>
              <p className="mt-3 text-sm text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-2.5 border-t border-white/5 pt-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {initials(t.name)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
