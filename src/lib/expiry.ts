export type Exchange = "NSE" | "BSE";

export type InstrumentCategory = "NIFTY" | "BANK_NIFTY" | "MIDCAP_NIFTY" | "SENSEX" | "STOCK";

export interface ExpiryParams {
  exchange?: Exchange;
  instrument: InstrumentCategory | string;
  stockSymbol?: string;
  referenceDate?: Date;
}

export interface ExpiryOption {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "18-Aug-2026 (Tue)"
  isWeekly: boolean;
  isHolidayAdjusted: boolean;
}

export interface ExpiryResult {
  expiryDate: string; // YYYY-MM-DD
  formattedExpiry: string;
  instrument: string;
  exchange: Exchange;
  upcomingExpiries: ExpiryOption[];
}

// Official NSE/BSE Trading Holidays (2026 / 2027 calendar bounds)
export const TRADING_HOLIDAYS: Set<string> = new Set([
  // 2026 Official Exchange Holidays
  "2026-01-26", // Republic Day
  "2026-03-03", // Holi
  "2026-03-20", // Id-ul-Fitr (Ramzan Id)
  "2026-04-03", // Good Friday
  "2026-04-14", // Dr. Baba Saheb Ambedkar Jayanti
  "2026-05-01", // Maharashtra Day
  "2026-05-27", // Bakri Id
  "2026-06-25", // Muharram
  "2026-08-15", // Independence Day
  "2026-08-25", // Id-e-Milad
  "2026-10-02", // Mahatma Gandhi Jayanti
  "2026-10-20", // Dussehra
  "2026-11-09", // Diwali Balipratipada
  "2026-11-24", // Gurunanak Jayanti
  "2026-12-25", // Christmas

  // 2027 Major Fixed Holidays
  "2027-01-26",
  "2027-08-15",
  "2027-10-02",
  "2027-12-25",
]);

/**
 * Checks if a given date is a trading holiday or weekend (Sat/Sun).
 */
export function isExchangeHoliday(date: Date, exchange: Exchange = "NSE"): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true; // Weekend
  const dateStr = formatDateISO(date);
  return TRADING_HOLIDAYS.has(dateStr);
}

/**
 * Adjusts a target expiry date: if it falls on a weekend or trading holiday,
 * returns the preceding valid trading day.
 */
export function getPreviousTradingDay(date: Date, exchange: Exchange = "NSE"): Date {
  const cur = new Date(date);
  while (isExchangeHoliday(cur, exchange)) {
    cur.setDate(cur.getDate() - 1);
  }
  return cur;
}

function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatExpiryLabel(d: Date, isAdjusted: boolean): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yyyy = d.getFullYear();
  const dayName = days[d.getDay()];
  const tag = isAdjusted ? " *" : "";
  return `${dd}-${mm}-${yyyy} (${dayName})${tag}`;
}

function isPastCutoff(d: Date): boolean {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return hours > 15 || (hours === 15 && minutes >= 30);
}

function getLastDayOfWeekInMonth(year: number, month: number, dayOfWeek: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const diff = (lastDay.getDay() - dayOfWeek + 7) % 7;
  lastDay.setDate(lastDay.getDate() - diff);
  return lastDay;
}

/**
 * Returns all valid upcoming contract expiries for an instrument according to
 * official current exchange specifications (NSE/BSE).
 */
export function getValidExpiries(params: ExpiryParams): ExpiryOption[] {
  const category = (params.instrument || "NIFTY").toUpperCase() as InstrumentCategory;
  const exchange: Exchange = params.exchange || (category === "SENSEX" ? "BSE" : "NSE");
  const baseDate = params.referenceDate ? new Date(params.referenceDate) : new Date();

  const upcoming: ExpiryOption[] = [];

  if (category === "NIFTY") {
    // Current NSE Nifty Weekly Index Options expire on TUESDAY (2)
    // If Tuesday is a holiday, use previous trading day (e.g. Monday)
    const TUESDAY = 2;
    for (let w = 0; w < 4; w++) {
      const testDate = new Date(baseDate);
      testDate.setDate(baseDate.getDate() + (w * 7));
      let daysToAdd = (TUESDAY - testDate.getDay() + 7) % 7;

      if (w === 0 && daysToAdd === 0 && isPastCutoff(baseDate)) {
        daysToAdd = 7;
      }

      const nominalExpiry = new Date(testDate);
      nominalExpiry.setDate(testDate.getDate() + daysToAdd);

      const actualExpiry = getPreviousTradingDay(nominalExpiry, exchange);
      const isAdjusted = nominalExpiry.getTime() !== actualExpiry.getTime();

      const dateStr = formatDateISO(actualExpiry);
      const labelStr = formatExpiryLabel(actualExpiry, isAdjusted);

      if (!upcoming.some((u) => u.date === dateStr)) {
        upcoming.push({
          date: dateStr,
          label: labelStr,
          isWeekly: true,
          isHolidayAdjusted: isAdjusted,
        });
      }
    }
  } else if (category === "SENSEX") {
    // Current BSE Sensex Index Options expire on FRIDAY (5)
    // If Friday is a holiday, use previous trading day (e.g. Thursday)
    const FRIDAY = 5;
    for (let w = 0; w < 4; w++) {
      const testDate = new Date(baseDate);
      testDate.setDate(baseDate.getDate() + (w * 7));
      let daysToAdd = (FRIDAY - testDate.getDay() + 7) % 7;

      if (w === 0 && daysToAdd === 0 && isPastCutoff(baseDate)) {
        daysToAdd = 7;
      }

      const nominalExpiry = new Date(testDate);
      nominalExpiry.setDate(testDate.getDate() + daysToAdd);

      const actualExpiry = getPreviousTradingDay(nominalExpiry, exchange);
      const isAdjusted = nominalExpiry.getTime() !== actualExpiry.getTime();

      const dateStr = formatDateISO(actualExpiry);
      const labelStr = formatExpiryLabel(actualExpiry, isAdjusted);

      if (!upcoming.some((u) => u.date === dateStr)) {
        upcoming.push({
          date: dateStr,
          label: labelStr,
          isWeekly: true,
          isHolidayAdjusted: isAdjusted,
        });
      }
    }
  } else if (category === "BANK_NIFTY" || category === "STOCK") {
    // BANKNIFTY weekly options DISCONTINUED by NSE! Monthly only (Last Thursday of the month)
    // Individual Stocks: Monthly only (Last Thursday of the month)
    const THURSDAY = 4;
    for (let m = 0; m < 3; m++) {
      const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, 1);
      const nominalExpiry = getLastDayOfWeekInMonth(targetMonth.getFullYear(), targetMonth.getMonth(), THURSDAY);

      const actualExpiry = getPreviousTradingDay(nominalExpiry, exchange);
      const isAdjusted = nominalExpiry.getTime() !== actualExpiry.getTime();

      const startOfDay = new Date(baseDate);
      startOfDay.setHours(0, 0, 0, 0);

      if (m > 0 || actualExpiry >= startOfDay) {
        if (m === 0 && actualExpiry.getTime() === startOfDay.getTime() && isPastCutoff(baseDate)) {
          continue; // Past cutoff on expiry day
        }
        const dateStr = formatDateISO(actualExpiry);
        const labelStr = formatExpiryLabel(actualExpiry, isAdjusted);

        if (!upcoming.some((u) => u.date === dateStr)) {
          upcoming.push({
            date: dateStr,
            label: labelStr,
            isWeekly: false,
            isHolidayAdjusted: isAdjusted,
          });
        }
      }
    }
  } else if (category === "MIDCAP_NIFTY") {
    // MIDCAP_NIFTY weekly options DISCONTINUED by NSE! Monthly only (Last Monday of the month)
    const MONDAY = 1;
    for (let m = 0; m < 3; m++) {
      const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, 1);
      const nominalExpiry = getLastDayOfWeekInMonth(targetMonth.getFullYear(), targetMonth.getMonth(), MONDAY);

      const actualExpiry = getPreviousTradingDay(nominalExpiry, exchange);
      const isAdjusted = nominalExpiry.getTime() !== actualExpiry.getTime();

      const startOfDay = new Date(baseDate);
      startOfDay.setHours(0, 0, 0, 0);

      if (m > 0 || actualExpiry >= startOfDay) {
        if (m === 0 && actualExpiry.getTime() === startOfDay.getTime() && isPastCutoff(baseDate)) {
          continue; // Past cutoff on expiry day
        }
        const dateStr = formatDateISO(actualExpiry);
        const labelStr = formatExpiryLabel(actualExpiry, isAdjusted);

        if (!upcoming.some((u) => u.date === dateStr)) {
          upcoming.push({
            date: dateStr,
            label: labelStr,
            isWeekly: false,
            isHolidayAdjusted: isAdjusted,
          });
        }
      }
    }
  }

  return upcoming;
}

/**
 * Returns the primary next valid contract expiry for an instrument.
 */
export function getNextExpiry(
  params: ExpiryParams | string,
  refDate?: Date,
  stockSymbol?: string
): ExpiryResult {
  let p: ExpiryParams;
  if (typeof params === "string") {
    p = {
      instrument: params,
      referenceDate: refDate,
      stockSymbol,
    };
  } else {
    p = params;
  }

  const category = (p.instrument || "NIFTY").toUpperCase() as InstrumentCategory;
  const exchange: Exchange = p.exchange || (category === "SENSEX" ? "BSE" : "NSE");
  const upcoming = getValidExpiries(p);

  const baseDate = p.referenceDate ? new Date(p.referenceDate) : new Date();

  const primary = upcoming[0] || {
    date: formatDateISO(baseDate),
    label: formatExpiryLabel(baseDate, false),
    isWeekly: false,
    isHolidayAdjusted: false,
  };

  return {
    expiryDate: primary.date,
    formattedExpiry: primary.label,
    instrument: category,
    exchange,
    upcomingExpiries: upcoming,
  };
}

export function nextWeeklyExpiry(from: Date = new Date()): string {
  return getNextExpiry("NIFTY", from).expiryDate;
}
