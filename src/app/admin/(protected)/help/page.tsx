import Link from "next/link";
import { TocSidebar, type TocEntry } from "@/components/site/toc-sidebar";
import { LegalSection as Section } from "@/components/site/legal-section";
import { clientConfig } from "@/lib/client-config";

// Admin operator manual — auth is inherited from
// src/app/admin/(protected)/layout.tsx, same as every other page in this
// route group. Deliberately scoped to what's actually wired up in this
// deployment right now: Broker Sessions / Order Requests only render in the
// nav when dhanConnectEnabled / goodwillBrokerEnabled are true, which they
// aren't for TGA, so they get one short note instead of a full walkthrough.
// A couple of gaps found while writing this are called out explicitly
// (Announcement button, subscriber password reset) rather than described as
// if they work, since they don't yet — see each section for specifics.
export default function AdminHelpPage() {
  const goodwillEnabled = clientConfig.goodwillBrokerEnabled;
  const dhanConnectEnabled = clientConfig.dhanConnectEnabled;

  const SECTIONS: TocEntry[] = [
    { id: "logging-in", label: "Logging in" },
    { id: "admin-dashboard", label: "Admin Dashboard" },
    { id: "parse-signal", label: "Parse Signal" },
    { id: "manual-signal-entry", label: "Manual Signal Entry" },
    { id: "ongoing-trades", label: "Ongoing Trades — editing & closing" },
    { id: "all-signals", label: "All Signals table & filters" },
    { id: "members", label: "Registered Members" },
    { id: "messages", label: "Messages" },
    { id: "referrals-admin", label: "Referral & Reward Management" },
    { id: "changelog", label: "Changelog" },
    { id: "inactive-features", label: "Features present but not active for TGA" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Admin <span className="signalflow-gold-text">Manual</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How to use every working feature of the admin panel — see the{" "}
          <Link href="/admin/changelog" className="text-primary underline underline-offset-2">
            Changelog
          </Link>{" "}
          for what changed and when.
        </p>
      </div>

      <div className="flex gap-10">
        <TocSidebar entries={SECTIONS} />

        <div className="signalflow-glass signalflow-neutral-border flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border p-6 sm:p-8">
          <Section id="logging-in" title="Logging in">
            <p>
              Go to <span className="font-mono text-foreground">/admin/login</span> and sign in
              with the single hardcoded admin account&apos;s email and password. There&apos;s no
              self-service admin password reset either — if that password is lost, it has to be
              regenerated from the environment (<span className="font-mono">ADMIN_PASSWORD_HASH</span>
              , via <span className="font-mono">scripts/hash-password.ts</span>) and redeployed, not
              changed from inside the app.
            </p>
          </Section>

          <Section id="admin-dashboard" title="Admin Dashboard">
            <p>
              This is the same performance-analytics view as the public{" "}
              <Link href="/dashboard" className="text-primary underline underline-offset-2">
                /dashboard
              </Link>{" "}
              page (win rate, cumulative %, best/worst trades, recent signals) — nothing here is
              admin-exclusive, it&apos;s just convenient to have it inside the admin panel too.
            </p>
          </Section>

          <Section id="parse-signal" title="Parse Signal">
            <p>
              On <span className="font-mono text-foreground">Manage Signals</span>, open{" "}
              <span className="font-semibold text-foreground">Add New Signal</span> and paste a
              raw signal message into the text box — e.g.
            </p>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-foreground">
{`BUY #NIFTY 24300 CE
ABOVE 160-170
TARGET- 18/40/80/150 POINT
SL-145
EXPIRY 18th aug`}
            </pre>
            <p className="mt-2">
              Click <span className="font-semibold text-foreground">Parse Signal</span>. TGA has
              its own dedicated parser (badge always reads{" "}
              <span className="font-semibold text-foreground">Parser: TGA</span>) — it reads{" "}
              <span className="font-mono">ABOVE</span> for entry (a range like{" "}
              <span className="font-mono">160-170</span> is fine), <span className="font-mono">
                TARGET-
              </span>{" "}
              for targets (comma- or slash-separated), <span className="font-mono">SL-</span> for
              stop-loss, and an optional <span className="font-mono">EXPIRY</span> date. If the
              text says <span className="font-mono">POINT</span>/<span className="font-mono">
                POINTS
              </span>{" "}
              after the targets, they&apos;re treated as points-from-entry and converted to actual
              target prices automatically — a note under the parsed result explains the
              conversion. A confidence badge (High/Medium/Low) and any warnings show what, if
              anything, it couldn&apos;t confidently read. Click{" "}
              <span className="font-semibold text-foreground">Use Parsed Data</span> to send those
              values down into Manual Signal Entry for a final check before sending.
            </p>
          </Section>

          <Section id="manual-signal-entry" title="Manual Signal Entry">
            <p>
              Fill in or review Strike, Type (CE/PE), Instrument, Entry Price, Stop Loss,
              Target(s), CMP <span className="text-muted-foreground">(optional — defaults to
              Entry Price if left blank)</span>, Sell Price (optional), Expiry Date, and Risk
              Rating, then click <span className="font-semibold text-foreground">Send Signal</span>.
              A few things worth knowing:
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
              <li>
                • Expiry Date only lists that instrument&apos;s actual valid tradable expiries —
                it auto-selects the next one, so you can&apos;t accidentally pick a date that
                doesn&apos;t exist as a real contract.
              </li>
              <li>
                • Choosing <span className="font-semibold text-foreground">Stock</span> as
                Instrument reveals a Stock Symbol box — type to search. It suggests symbols
                you&apos;ve already used on this deployment first, then a seeded list of
                frequently-traded intraday F&amp;O stocks, but accepts anything you type,
                known or not.
              </li>
              <li>
                • You can attach a chart screenshot at the bottom before sending.
              </li>
            </ul>
          </Section>

          <Section id="ongoing-trades" title="Ongoing Trades — editing & closing">
            <p>
              Sending a signal automatically collapses{" "}
              <span className="font-semibold text-foreground">Add New Signal</span> and expands{" "}
              <span className="font-semibold text-foreground">Ongoing Trades</span> below it (and
              vice versa once the last open trade closes) — no manual refresh needed, it picks
              this up within the page&apos;s ~20-second background poll.
            </p>
            <p className="mt-2">
              To close a trade, type the actual sell price into its row and click{" "}
              <span className="font-semibold text-foreground">Close</span> — status (Target Hit /
              SL Hit / Closed) is derived automatically from where that price falls versus entry,
              stop-loss, and targets. To change any other field, or to attach an admin note (shown
              to subscribers as an update on that trade), click{" "}
              <span className="font-semibold text-foreground">Edit</span> on the row instead —
              Save applies every change at once, including a sell price if you set one there.
              Delete requires clicking twice within a few seconds (a safety confirm, not a typo).
            </p>
            <p className="mt-2">
              The <span className="font-semibold text-foreground">Admin Updates</span> panel next
              to the risk/reward chart isn&apos;t limited to trades that are currently open — type
              into the box above it and click{" "}
              <span className="font-semibold text-foreground">Post Update</span> to send a general
              message to subscribers (e.g. &quot;no signals today, market holiday&quot;) even when
              nothing is ongoing. It shows up there and on the public Trade Log page&apos;s same
              panel, tagged <span className="italic">General</span> rather than a specific
              instrument.
            </p>
          </Section>

          <Section id="all-signals" title="All Signals table & filters">
            <p>
              Below Ongoing Trades, <span className="font-semibold text-foreground">
                All Signals
              </span>{" "}
              lists every signal ever sent, open or closed. Use the date-range presets (or a
              custom range) above the table to narrow it down — this is the same table/data the
              public{" "}
              <Link href="/signals" className="text-primary underline underline-offset-2">
                Signals
              </Link>{" "}
              page shows subscribers, just with edit/close controls available here. Its Status
              column shows exactly which target closed the trade (
              <span className="font-semibold text-foreground">T1 Hit</span>,{" "}
              <span className="font-semibold text-foreground">T2 Hit</span>, and so on, when there
              was more than one target to tell apart) rather than a flat &quot;Target Hit&quot;,
              and a manual exit that was still in profit shows as{" "}
              <span className="font-semibold text-foreground">Partial Profit</span> instead of a
              flat &quot;Closed&quot;.
            </p>
          </Section>

          <Section id="members" title="Registered Members">
            <p>
              Under <span className="font-semibold text-foreground">Members</span> in the nav,{" "}
              <span className="font-semibold text-foreground">View Members</span> lists every
              subscriber with their plan, broker, and referral status. From here you can:
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
              <li>
                • <span className="font-semibold text-foreground">Add Member</span> — manually
                register someone (e.g. a payment confirmed outside the normal flow).
              </li>
              <li>
                • <span className="font-semibold text-foreground">Edit</span> / {" "}
                <span className="font-semibold text-foreground">Delete</span> a member&apos;s
                record directly.
              </li>
              <li>
                • Click the WhatsApp icon on a row to message that member directly, or the mail
                icon to email them a referral-program invite link (greyed out once they&apos;ve
                already joined via referral).
              </li>
              <li>
                • <span className="font-semibold text-foreground">Export Excel</span> downloads
                the currently filtered list.
              </li>
            </ul>
            <p className="mt-2">
              Filter by broker (or by Dhan / non-Dhan) using the dropdown above the table. The{" "}
              <span className="font-semibold text-foreground">Announcement</span> button is not
              built yet — clicking it just shows a &ldquo;development underway&rdquo; notice.
            </p>
            <p className="mt-2">
              <span className="font-semibold text-amber-400">Gap worth knowing about:</span>{" "}
              there is currently no button anywhere in this table to reset a subscriber&apos;s
              login password. The capability exists in the code
              (<span className="font-mono">setSubscriberPassword</span>) but isn&apos;t wired to
              any UI yet, so today a locked-out subscriber&apos;s password can only be reset by
              someone with direct database access — not from this page. Worth building a real
              button for if this comes up often; happy to add one on request.
            </p>
          </Section>

          <Section id="messages" title="Messages">
            <p>
              Every submission from the public{" "}
              <Link href="/contact" className="text-primary underline underline-offset-2">
                Contact
              </Link>{" "}
              form lands here, flagged <span className="font-semibold text-foreground">New</span>{" "}
              until you act on it. Type into{" "}
              <span className="font-semibold text-foreground">Reply / Internal note</span> and
              click <span className="font-semibold text-foreground">Mark Replied</span> — this
              only saves the note and flips the status to Replied for your own tracking, it does{" "}
              <span className="font-semibold text-foreground">not</span> email or message the
              person automatically. Follow up with them directly (their listed phone/email, or
              WhatsApp) the same way you would any other reply.
            </p>
          </Section>

          <Section id="referrals-admin" title="Referral & Reward Management">
            <p>
              A read-only view of every subscriber&apos;s referral activity — how many successful
              referrals, pending/invited status, total rewards credited, and any amount they&apos;ve
              redeemed toward a renewal. Use this to sanity-check a subscriber&apos;s claimed
              credit balance before applying it manually to a renewal payment (redemptions don&apos;t
              charge anything automatically — see the subscriber Help Manual&apos;s Refer &amp;
              Earn section for how a subscriber requests one).
            </p>
          </Section>

          <Section id="changelog" title="Changelog">
            <p>
              A chronological log of every release, newest first, with the currently-deployed
              version highlighted. This is generated from{" "}
              <span className="font-mono">src/lib/changelog.ts</span> — it&apos;s written by hand
              alongside each version bump, not auto-generated from Git history, so it only reflects
              what a developer explicitly recorded there.
            </p>
          </Section>

          <Section id="inactive-features" title="Features present but not active for TGA">
            <p>
              A few nav items and pages only appear once a feature flag in{" "}
              <span className="font-mono">client-config.ts</span> is turned on — right now, for
              TGA, none of them are:
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
              <li>
                • <span className="font-semibold text-foreground">Broker Sessions</span> (Dhan
                broker-connect) — gated behind{" "}
                <span className="font-mono">dhanConnectEnabled</span>, currently{" "}
                {dhanConnectEnabled ? "on" : "off"}.
              </li>
              <li>
                • <span className="font-semibold text-foreground">Order Requests</span> (Goodwill
                order placement) — gated behind{" "}
                <span className="font-mono">goodwillBrokerEnabled</span>, currently{" "}
                {goodwillEnabled ? "on" : "off"}.
              </li>
              <li>
                • The weekly performance digest email and the home-page News &amp; Market Alerts
                panel are similarly switched off (<span className="font-mono">digestEnabled</span>,{" "}
                <span className="font-mono">newsAlertsEnabled</span>).
              </li>
            </ul>
            <p className="mt-2">
              If any of these get switched on for TGA later, they&apos;ll need their own manual
              sections added here.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
