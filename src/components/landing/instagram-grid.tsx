"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Play } from "lucide-react";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

export function InstagramGrid() {
  const { instagramThumbnails, reelsSourceLabel = "Instagram" } = clientConfig;
  const isLandscape = reelsSourceLabel !== "Instagram";

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Watch us <span className="signalflow-gold-text">in action</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Videos from our {reelsSourceLabel} — tap any thumbnail to watch.
          </p>
        </div>

        <div
          className={cn(
            "mt-10 grid gap-6",
            isLandscape ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {instagramThumbnails.map((item, i) => (
            <motion.a
              key={item.videoUrl}
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-card transition-colors hover:border-primary/50"
            >
              <div
                className={cn(
                  "relative w-full overflow-hidden bg-muted",
                  isLandscape ? "aspect-video" : "aspect-[4/5]",
                )}
              >
                <Image
                  src={item.thumbnailUrl}
                  alt={item.label}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/90 pl-0.5 text-primary-foreground shadow-lg transition-transform group-hover:scale-110 group-hover:bg-primary">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                </div>
              </div>
              <p className="line-clamp-2 px-3 py-3 text-xs font-semibold leading-snug text-foreground/90 group-hover:text-primary">
                {item.label}
              </p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
