import { InstrumentLiteral } from "./instruments";

export type InstrumentCategory = InstrumentLiteral | "STOCK";

export interface ExpiryOption {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "13-Aug-2026 (Thu)"
}

export interface ExpiryResult {
  expiryDate: string; // YYYY-MM-DD
  formattedExpiry: string;
  instrument: InstrumentCategory;
  upcomingExpiries: ExpiryOption[];
}

function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatExpiryLabel(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yyyy = d.getFullYear();
  const dayName = days[d.getDay()];
  return `${dd}-${mm}-${yyyy} (${dayName})`;
}

function getLastThursdayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const diff = (lastDay.getDay() - 4 + 7) % 7;
  lastDay.setDate(lastDay.getDate() - diff);
  return lastDay;
}

function isPastCutoff(d: Date): boolean {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return hours > 15 || (hours === 15 && minutes >= 30);
}

export function getNextExpiry(
  instrument: InstrumentCategory | string,
  refDate: Date = new Date(),
  stockSymbol?: string
): ExpiryResult {
  const baseDate = new Date(refDate);
  const category = (instrument || "NIFTY").toUpperCase() as InstrumentCategory;
  const upcoming: ExpiryOption[] = [];

  if (category === "STOCK") {
    // Monthly last Thursday expiry for stocks
    for (let m = 0; m < 3; m++) {
      const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, 1);
      const lastThursday = getLastThursdayOfMonth(targetMonth.getFullYear(), targetMonth.getMonth());

      // If today is past last Thursday of this month, move to next month
      const startOfDay = new Date(baseDate);
      startOfDay.setHours(0, 0, 0, 0);

      if (m > 0 || lastThursday >= startOfDay) {
        if (m === 0 && lastThursday.getTime() === startOfDay.getTime() && isPastCutoff(baseDate)) {
          continue; // Past trading cutoff on expiry day
        }
        const dateStr = formatDateISO(lastThursday);
        const labelStr = formatExpiryLabel(lastThursday);
        if (!upcoming.some((u) => u.date === dateStr)) {
          upcoming.push({ date: dateStr, label: labelStr });
        }
      }
    }
  } else {
    // Index Expiries
    // NIFTY: Thursday (4)
    // SENSEX: Friday (5)
    // BANK_NIFTY: Wednesday (3)
    // MIDCAP_NIFTY: Monday (1)
    let targetDay = 4;
    if (category === "SENSEX") targetDay = 5;
    else if (category === "BANK_NIFTY") targetDay = 3;
    else if (category === "MIDCAP_NIFTY") targetDay = 1;

    for (let w = 0; w < 4; w++) {
      const testDate = new Date(baseDate);
      testDate.setDate(baseDate.getDate() + (w * 7));
      let daysToAdd = (targetDay - testDate.getDay() + 7) % 7;

      if (w === 0 && daysToAdd === 0 && isPastCutoff(baseDate)) {
        daysToAdd = 7;
      }

      const expDate = new Date(testDate);
      expDate.setDate(testDate.getDate() + daysToAdd);

      const dateStr = formatDateISO(expDate);
      const labelStr = formatExpiryLabel(expDate);
      if (!upcoming.some((u) => u.date === dateStr)) {
        upcoming.push({ date: dateStr, label: labelStr });
      }
    }
  }

  const primary = upcoming[0] || {
    date: formatDateISO(baseDate),
    label: formatExpiryLabel(baseDate),
  };

  return {
    expiryDate: primary.date,
    formattedExpiry: primary.label,
    instrument: category,
    upcomingExpiries: upcoming,
  };
}

export function nextWeeklyExpiry(from: Date = new Date()): string {
  return getNextExpiry("NIFTY", from).expiryDate;
}
