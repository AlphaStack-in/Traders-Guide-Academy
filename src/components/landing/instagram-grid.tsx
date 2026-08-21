import Image from "next/image";
import { clientConfig } from "@/lib/client-config";
import { repeatForMarquee } from "@/lib/marquee";
import { cn } from "@/lib/utils";

// w-48 (192px) portrait card + mr-4 (16px); w-64 (256px) landscape card + mr-4,
// both using the wider sm: breakpoint size.
const PORTRAIT_CARD_WIDTH_PX = 208;
const LANDSCAPE_CARD_WIDTH_PX = 272;

export function InstagramGrid() {
  const { instagramThumbnails, reelsSourceLabel = "Instagram" } = clientConfig;
  const isLandscape = reelsSourceLabel !== "Instagram";
  const repeated = repeatForMarquee(
    instagramThumbnails,
    isLandscape ? LANDSCAPE_CARD_WIDTH_PX : PORTRAIT_CARD_WIDTH_PX,
  );
  const items = [...repeated, ...repeated];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          Watch us <span className="signalflow-gold-text">in action</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Videos from our {reelsSourceLabel} — tap any thumbnail to watch.
        </p>
      </div>

      <div
        className="relative mt-10 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="signalflow-marquee-track flex w-max"
          style={{ ["--signalflow-marquee-duration" as string]: "56s" }}
        >
          {items.map((item, i) => (
            <a
              key={`${item.videoUrl}-${i}`}
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "signalflow-glow group mr-4 shrink-0 overflow-hidden rounded-xl border border-white/5",
                isLandscape ? "w-56 sm:w-64" : "w-40 sm:w-48",
              )}
            >
              <div
                className={cn("relative w-full bg-card", isLandscape ? "aspect-video" : "aspect-[4/5]")}
              >
                <Image
                  src={item.thumbnailUrl}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="signalflow-glass px-2.5 py-2 text-xs font-medium text-foreground">
                {item.label}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
