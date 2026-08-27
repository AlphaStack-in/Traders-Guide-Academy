/**
 * Shared broker list for the "Current Trading Broker" selector, used at
 * registration (src/components/register/register-form.tsx) and on the
 * account profile edit form (src/components/account/profile-edit-form.tsx).
 * Kept in one place so the two forms can't drift apart.
 */
export const BROKER_OPTIONS = [
  "Dhan",
  "Zerodha",
  "Angel One",
  "Upstox",
  "Groww",
  "Goodwill",
  "Alice Blue",
  "Lemonn",
  "Sahi",
  "ICICI Direct",
  "Kotak Securities",
  "HDFC Securities",
  "SBI Securities",
  "Motilal Oswal",
  "Sharekhan",
  "IIFL Securities",
  "Paytm Money",
  "SAMCO",
  "Fyers",
  "5paisa",
  "Other",
] as const;
