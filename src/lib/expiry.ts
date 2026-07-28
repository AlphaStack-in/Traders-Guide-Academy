// Starting-guess default for a signal's options expiry — always editable by
// the admin before saving, never trusted as-is for order placement.
export function nextWeeklyExpiry(from: Date = new Date()): string {
  const date = new Date(from);
  const THURSDAY = 4;
  const daysUntilThursday = (THURSDAY - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntilThursday);
  return date.toISOString().slice(0, 10);
}
