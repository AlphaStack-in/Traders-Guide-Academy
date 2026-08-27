import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { clientConfig } from "@/lib/client-config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Both formatters pin timeZone to Asia/Kolkata explicitly — these run in
// client components during SSR *and* client hydration, so without a fixed
// timeZone the server (often UTC on Vercel) and a client browser (IST for
// actual users) can format the same instant differently, causing a React
// hydration mismatch (error #418).
export function formatSignalDate(date: string | Date) {
  const d = new Date(date)
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "Asia/Kolkata" })
  const month = d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })
  return `${day}${month}`
}

export function formatSignalTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  })
}

// Used for admin-update timestamps (notification bell, Ongoing Trades) —
// distinct from formatSignalTime above (24h, no seconds): this includes
// seconds and 12h am/pm, e.g. "11:22:23 pm".
export function formatUpdateTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kolkata",
  })
}

// "27 Aug 2026" — a full calendar date (with year) but no time, for ranges
// that can span months/years (e.g. a Yearly plan's estimated renewal date on
// the account profile page), where formatSignalDate's compact "27Aug" (no
// year, meant for same-year signal timestamps) would be ambiguous.
export function formatDateOnly(date: string | Date) {
  const d = new Date(date)
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "Asia/Kolkata" })
  const month = d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })
  const year = d.toLocaleDateString("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" })
  return `${day} ${month} ${year}`
}

// Full date + time, e.g. "27 Aug 2026, 18:57 IST" — same convention as the
// CHANGELOG.md / changelog.ts build timestamps. For places where a bare date
// (formatSignalDate) doesn't say enough, e.g. "Joined" on the account
// profile page.
export function formatFullTimestamp(date: string | Date) {
  const d = new Date(date)
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "Asia/Kolkata" })
  const month = d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })
  const year = d.toLocaleDateString("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" })
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  })
  return `${day} ${month} ${year}, ${time} IST`
}

// Dynamic runtime join URL resolver — a client with its own external
// broker-hosted join page (goodwillBrokerEnabled) uses that instead of this
// app's own domain, to avoid cross-client leaks.
export function getClientJoinUrl(referralToken?: string | null): string {
  if (clientConfig.goodwillBrokerEnabled) {
    return "https://gwcindia.in/register";
  }

  // TODO: set once this client's real production domain is known —
  // currently only reached when window/NEXT_PUBLIC_APP_URL are unavailable.
  let origin = "https://tradershubcenter.com";

  if (typeof window !== "undefined" && window.location?.origin) {
    const locOrigin = window.location.origin;
    if (!locOrigin.includes("localhost") && !locOrigin.includes("127.0.0.1")) {
      origin = locOrigin;
    }
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      origin = envUrl;
    }
  }

  if (referralToken) {
    return `${origin}/register?ref=${encodeURIComponent(referralToken)}`;
  }
  return `${origin}/register`;
}

export function getRuntimeReferralUrl(token?: string | null): string {
  return getClientJoinUrl(token);
}

export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}
