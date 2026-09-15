"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

export function FeaturedCourses() {
  const { courses } = clientConfig;
  if (courses.length === 0) return null;

  return (
    <section id="courses" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">Featured Courses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Master options &amp; technical analysis with structured training.
            </p>
          </div>
          <Link
            href="/contact"
            className="hidden shrink-0 items-center text-sm font-semibold text-primary transition-colors hover:text-foreground sm:flex"
          >
            View all <span className="ml-1">→</span>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card transition-colors hover:border-primary/40"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-primary uppercase">
                    Course
                  </span>
                  <span
                    className={cn(
                      "rounded px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide uppercase",
                      course.tag === "Free"
                        ? "bg-[var(--signalflow-win)]/15 text-[var(--signalflow-win)]"
                        : "bg-white/5 text-muted-foreground",
                    )}
                  >
                    {course.tag}
                  </span>
                </div>
                <div className="mb-5 flex h-24 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <GraduationCap className="h-8 w-8 text-primary/70" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {course.description}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-white/10 px-6 py-4">
                <span
                  className={cn(
                    "font-bold",
                    course.priceLabel === "Free"
                      ? "text-[var(--signalflow-win)]"
                      : "font-mono text-foreground",
                  )}
                >
                  {course.priceLabel}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={course.href}>{course.ctaLabel}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
