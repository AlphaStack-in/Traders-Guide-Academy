"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  WhatsAppIcon,
  InstagramIcon,
  TelegramIcon,
  FacebookIcon,
  TwitterIcon,
  YouTubeIcon,
  LinkedInIcon,
} from "@/components/site/icons";
import { clientConfig } from "@/lib/client-config";

export function Hero() {
  const socialLinks = [
    { href: clientConfig.whatsappUrl, Icon: WhatsAppIcon, label: "WhatsApp" },
    { href: clientConfig.instagramUrl, Icon: InstagramIcon, label: "Instagram" },
    { href: clientConfig.telegramUrl, Icon: TelegramIcon, label: "Telegram" },
    { href: clientConfig.facebookUrl, Icon: FacebookIcon, label: "Facebook" },
    { href: clientConfig.twitterUrl, Icon: TwitterIcon, label: "Twitter" },
    { href: clientConfig.youtubeUrl, Icon: YouTubeIcon, label: "YouTube" },
    { href: clientConfig.linkedinUrl, Icon: LinkedInIcon, label: "LinkedIn" },
  ].filter((link) => link.href);

  return (
    <section className="relative flex min-h-[520px] items-center overflow-hidden px-4 pt-10 pb-20 sm:min-h-[600px] sm:px-6 sm:pt-14 sm:pb-28 lg:px-8">
      <video
        className="absolute inset-0 -z-30 h-full w-full object-cover"
        src="/videos/trading.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-black/85" />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--thc-gold-start) 22%, transparent), transparent 70%), radial-gradient(40% 35% at 85% 15%, color-mix(in oklab, var(--thc-pe) 14%, transparent), transparent 70%), radial-gradient(40% 35% at 12% 30%, color-mix(in oklab, var(--thc-ce) 12%, transparent), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mx-auto max-w-7xl text-center"
      >
        <div
          className={
            clientConfig.id === "thc"
              ? "flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:text-left"
              : ""
          }
        >
          {clientConfig.id === "thc" && (
            <Image
              src="/thc-hero-emblem.png"
              alt={clientConfig.siteName}
              width={240}
              height={240}
              className="h-40 w-auto shrink-0 object-contain sm:h-52 lg:h-full lg:w-auto"
              priority
            />
          )}
          <div>
            <p className="mb-4 inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-sm font-medium text-muted-foreground">
              {clientConfig.heroBadgeLabel ?? "Intraday Option Buying Signals"}
            </p>
            <h1 className="font-heading text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Trade with <span className="thc-gold-text">accuracy</span> and{" "}
              <span className="thc-gold-text">consistency</span>
            </h1>
            <div
              className={
                clientConfig.id === "thc" ? "mt-6 max-w-3xl lg:mx-0" : "mx-auto mt-6 max-w-3xl"
              }
            >
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Precision, <span className="thc-gold-text">not luck</span>
              </h2>
              <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                Every call gets a defined entry, stop loss, and target before it&apos;s posted — no
                vague hunches, no moving the goalposts after the fact. Our live Win Rate and Total
                Capture % are the same numbers you can verify on the{" "}
                <Link href="/dashboard" className="text-primary underline underline-offset-2">
                  Dashboard
                </Link>
                , trade by trade.
              </p>
            </div>
            <p
              className={
                clientConfig.id === "thc"
                  ? "mt-5 max-w-3xl text-lg text-muted-foreground sm:text-xl lg:mx-0"
                  : "mx-auto mt-5 max-w-3xl text-lg text-muted-foreground sm:text-xl"
              }
            >
              {clientConfig.siteName} publishes transparent, intraday options-buying calls to
              premium subscribers — every entry, stop loss and target tracked in the open.
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            size="lg"
            className="thc-glow thc-btn-gradient h-14 gap-2.5 px-10 text-base"
          >
            <Link href="/register">Register Premium</Link>
          </Button>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Follow us free on</p>
          <div className="flex flex-wrap items-start justify-center gap-4">
            {socialLinks.map(({ href, Icon, label }) => (
              <Button
                key={label}
                asChild
                size="lg"
                variant="outline"
                className="thc-glow h-32 w-28 flex-col gap-2 px-0"
              >
                <a href={href} target="_blank" rel="noopener noreferrer">
                  <Icon
                    className="size-12"
                    style={{ color: clientConfig.logoAccent ?? "var(--thc-gold-start)" }}
                  />
                  <span className="text-[10px] font-normal text-muted-foreground">{label}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
