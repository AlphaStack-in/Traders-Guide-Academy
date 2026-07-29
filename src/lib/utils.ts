import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
