# Claude Code Build Prompt — SignalFlow (historical: originally built as "Traders Hub Center/THC")

Copy everything below the line into Claude Code as your starting instruction.

---

## Project Brief

Build a full-stack responsive web app called **SignalFlow** — a platform
for publishing intraday options-buying trade signals to premium subscribers, with an
admin dashboard for signal entry and performance analytics.

### Tech stack
- **Next.js 14+ (App Router)** + TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for base components
- **Recharts** for dashboard charts
- **Supabase** as the backend: Postgres database + Supabase Auth (single admin user)
  + optionally Supabase Storage if you end up hosting the Instagram thumbnail images
  yourself instead of linking out
- **Prisma** as the ORM on top of the Supabase Postgres connection string (or use the
  Supabase JS client directly if that's faster to wire up — your call, just be
  consistent throughout the codebase)
- **Vercel** for hosting/deployment, connected directly to the GitHub repo below for
  auto-deploy on push
- Subscriber "Register Premium" flow stores leads in Supabase for now (no real payment
  gateway needed yet — leave a clearly marked TODO hook for Razorpay/Stripe later)

### Repository & Deployment
- Existing repo: **https://github.com/technojegan/SignalFlow.git** — clone
  this repo first and check what's already scaffolded before starting from scratch;
  build on top of whatever's already there rather than overwriting it. If it's empty,
  initialize the Next.js project directly inside it.
- Push all work to this repo (sensible incremental commits per feature, not one giant
  commit)
- **Supabase setup:**
  1. Create a new Supabase project (or use an existing one if already created)
  2. Add `Signal` and `Subscriber` tables via Supabase migrations (or Prisma migrate
     pointed at the Supabase connection string)
  3. Store `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
     `SUPABASE_SERVICE_ROLE_KEY` (server-only) as environment variables — never
     commit these to the repo; add a `.env.example` with placeholder values instead
  4. Use Supabase Auth for the single admin login (email/password is fine — no public
     sign-up flow needed for the admin side)
- **Vercel setup:**
  1. Connect the GitHub repo to a new Vercel project
  2. Add the same Supabase environment variables in the Vercel project settings
     (Production + Preview)
  3. Confirm the build command (`next build`) and output work out of the box; set the
     root directory correctly if the Next.js app isn't at the repo root
  4. Every push to `main` should auto-deploy to production; pushes to other branches
     get preview deployments — this is Vercel's default behavior, just don't fight it
  5. Once deployed, verify: landing page loads, `/signals` renders seeded data,
     `/admin/login` works against Supabase Auth, and the dashboard charts render with
     real data pulled from Supabase

### Brand & Design System
- Name: **SignalFlow**, shown as **SignalFlow** in the nav/logo mark
- Palette: **Black + Gold** — background near-black (#0B0B0D / #111114), gold accent
  (#D4AF37 / #F0C949 gradient), white/off-white text, with a subtle gold glow/border
  treatment on cards and buttons
- Typography: a clean modern sans for body (e.g. Inter), a slightly bolder/condensed
  display font for headings to feel premium
- "Fancy" touches: soft gold gradient borders, subtle glassmorphism panels, gentle
  hover glow on buttons/cards, smooth scroll-reveal animations — but keep it
  performant and not gaudy
- Fully responsive (mobile-first): landing page, signal cards, and dashboard must all
  reflow cleanly on mobile

---

## Data Model

All signals are **intraday, options-buying calls only** (CE or PE). No "underlying" or
"category" field — every signal is implicitly NIFTY/BANKNIFTY options bought
intraday (whichever index you actually use — just remove those two fields from the
schema and forms entirely).

```
Signal {
  id            string (uuid)
  strike        int          // e.g. 76800
  optionType    enum(CE, PE)
  entryPrice    float        // the "Above -X" trigger/entry price
  stopLoss      float        // "SL"
  targets       float[]      // "Trgt" can have 1 or 2 values, e.g. [155, 170]
  priceAtSignal float        // "Now" — price when the message was sent
  sellPrice     float?       // exit/booking price — null until closed
  status        enum(OPEN, TARGET_HIT, SL_HIT, CLOSED_MANUAL)  // set when sellPrice added
  pnlPercent    float?       // auto-calculated, see formula below
  signalTime    datetime     // when the call was given
  closedTime    datetime?
  rawMessage    string       // original pasted text, for audit/reference
}

Subscriber {
  id        string (uuid)
  name      string
  phone     string
  email     string?
  plan      enum(PREMIUM)   // only one plan for now — "Register Premium"
  createdAt datetime
}
```

**pnlPercent formula (buy calls only):**
`pnlPercent = ((sellPrice - entryPrice) / entryPrice) * 100`

**Dashboard aggregate metrics:**
- Total Signals (count)
- Win Rate % = (signals with pnlPercent > 0) / (total closed signals) × 100
- **Total Capture %** = simple SUM of pnlPercent across all closed signals (this is the
  headline "overall performance" number — not compounded)
- Average % per trade = Total Capture % / number of closed signals
- Best trade % / Worst trade %
- CE vs PE split (count + win rate each)

---

## Smart Paste Parser (critical feature)

The admin "Add New Signal" page must include a **large textarea** where the raw
WhatsApp-style message(s) can be pasted verbatim, e.g.:

```
77300 ce
Above -150
SL -145
Trgt -170
Now -145
selling price 170
```

...and a **"Parse"** button that extracts structured fields automatically. Handle
these real-world quirks:

1. Labels can appear as `Above`, `SL`, `Trgt`/`Target`, `Now`, `selling price` /
   `sell price` (case-insensitive), each optionally followed by `-` before the number.
2. `Trgt` may contain **one or two comma-separated numbers** (e.g. `Trgt -155,170`).
3. **Multiple signal blocks can be pasted in a single message back-to-back** with no
   blank-line separator (e.g. several `XXXXX ce/pe ... sell price NNN` blocks in a row)
   — split the raw text into separate signal blocks using a lookahead on the pattern
   `\d{4,6}\s*(ce|pe)` (case-insensitive) as the block delimiter, then parse each block
   independently.
4. After parsing, show each detected signal as an **editable preview card** so the
   admin can correct/confirm before saving (don't auto-save blindly).
5. `pnlPercent` and `status` are calculated automatically on save — never shown as
   manually-entered fields.

Suggested regex per block (tune as needed):
```
strike + type   : /(\d{4,6})\s*(CE|PE)/i
entry ("Above") : /Above\s*-?\s*(\d+(\.\d+)?)/i
SL               : /SL\s*-?\s*(\d+(\.\d+)?)/i
targets ("Trgt") : /Trgt\.?\s*-?\s*([\d.,\s]+)/i   -> split on comma
priceAtSignal    : /Now\s*-?\s*(\d+(\.\d+)?)/i
sellPrice        : /sell(?:ing)?\s*price\s*-?\s*(\d+(\.\d+)?)/i
```

---

## Pages

### 1. Landing Page (`/`)
- Hero section introducing **SignalFlow**, tagline around accuracy/consistency
  (pull live numbers from the DB: e.g. "X% Win Rate", "Y Signals Given", "Z% Total
  Capture" — don't hardcode fake stats)
- "Register Premium" primary CTA button (not "Register Free") → links to the
  registration form/page
- Short "How it works" section (signals sent to premium subscribers)
- **Join us on Instagram** button/link → https://www.instagram.com/traders_hub_center_/
- **WhatsApp** join link/button → https://chat.whatsapp.com/IuWT73Az2LN9i3cfG4pLnY
- **Instagram video thumbnails section**: a responsive grid of thumbnail cards, each
  linking out to an Instagram video, with a label under each thumbnail. Build this as
  a small data array (`{ thumbnailUrl, videoUrl, label }[]`) that's easy to edit —
  leave 3–4 placeholder entries since no screenshot/video list was actually provided
  yet; wire in the real thumbnails/labels once supplied.
- Footer with brand mark, socials, disclaimer line (e.g. "For educational purposes;
  trading involves risk")

### 2. Past Signals (`/signals`)
- Grid of signal cards, **5 columns on desktop**, responsively collapsing to fewer
  columns on tablet/mobile (e.g. 5 → 3 → 2 → 1)
- Cards should be **compact/short height** — just Strike+Type, Entry, SL, Target(s),
  Sell Price, and the %, nothing else
- Card border/accent color: **green if pnlPercent > 0, red if pnlPercent < 0**,
  neutral gold/grey if still OPEN
- Filter/sort controls: by CE/PE, by date, by result (win/loss)

### 3. Dashboard (`/admin/dashboard`, auth-gated)
KPI cards row: Total Signals, Win Rate %, **Total Capture %**, Avg % per Trade,
Best Trade %, Worst Trade %.

Charts (Recharts):
- Line chart: cumulative % over time (running sum of pnlPercent by signal date)
- Bar chart: win vs loss count per day/week
- Pie/donut: CE vs PE distribution
- Optional: bar chart of best/worst 5 trades

### 4. Admin — Add New Signal (`/admin/signals/new`, auth-gated)
- Smart Paste Parser (see above) as the primary entry method
- Manual fallback form with fields: strike, optionType, entryPrice, stopLoss,
  targets, priceAtSignal, sellPrice (optional at creation, added later to close the
  trade)
- **No underlying/category fields** — removed entirely
- pnlPercent/status computed automatically, never manually entered

### 5. Register Premium (`/register`)
- Simple form: name, phone, email (optional) → saves to Subscriber table
- Confirmation screen mentioning they'll receive signals (via your existing WhatsApp
  group — link the WhatsApp join link here too)

### 6. Admin Login (`/admin/login`)
- Simple credentials-based login via **Supabase Auth**, single admin user created
  directly in the Supabase dashboard (no public sign-up flow)

---

## Build Order (suggested)
1. Clone the existing repo (https://github.com/technojegan/SignalFlow.git),
   check what's already there, scaffold Next.js + Tailwind + shadcn on top of it, set
   up the Black/Gold theme tokens
2. Set up the Supabase project + `Signal`/`Subscriber` tables, connect Prisma (or the
   Supabase client), seed a handful of sample signals (mix of wins/losses,
   OPEN/closed) so the dashboard has real data to render against
3. Signal card component + `/signals` page
4. Dashboard KPIs + charts
5. Smart Paste Parser + Add Signal form
6. Landing page (hero, stats pulled live, Instagram/WhatsApp links, video thumbnail grid)
7. Register Premium form + Supabase Auth admin login
8. Responsive polish pass + animations/gold-glow details
9. Connect the repo to Vercel, set environment variables, deploy, and verify every
   page works end-to-end on the live URL

---

## Notes
- Treat all monetary figures as **points/premium**, not actual rupee amounts, unless
  told otherwise — these are option premium prices, not lot-sized P&L.
- Add a small disclaimer somewhere on the site (footer is fine) noting trading
  involves risk — standard practice for any signals/advisory-style platform.
