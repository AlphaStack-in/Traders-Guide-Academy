/**
 * Shared broker list for the "Current Trading Broker" selector, used at
 * registration (src/components/register/register-form.tsx) and on the
 * account profile edit form (src/components/account/profile-edit-form.tsx).
 * Kept in one place so the two forms can't drift apart.
 */
// Sentinel value (not a real broker) selectable in the dropdown for a
// subscriber who doesn't have a Demat account yet — used by the profile
// page to surface an "open a new Demat account under our referral" CTA
// (see profile-edit-form.tsx) instead of just showing a broker name.
export const NEEDS_DEMAT_BROKER_VALUE = "Need New Demat A/C";

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
  NEEDS_DEMAT_BROKER_VALUE,
  "Other",
] as const;
