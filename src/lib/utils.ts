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

// Dynamic runtime join URL resolver — enforces Goodwill's public join URL
// (https://gwcindia.in/register) and THC's domain without cross-client leaks.
export function getClientJoinUrl(referralToken?: string | null): string {
  if (clientConfig.id === "goodwill") {
    return "https://gwcindia.in/register";
  }

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
