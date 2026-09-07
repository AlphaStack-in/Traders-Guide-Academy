"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/site/icons";
import { PaymentDetailsCard } from "@/components/account/payment-details-card";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { BROKER_OPTIONS } from "@/lib/brokers";
import { clientConfig, type PricingPlan } from "@/lib/client-config";
import { registerSubscriber } from "@/app/register/actions";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 6;

function resolveInitialPlanId(requested: string | null, plans: PricingPlan[]): PricingPlan["id"] {
  const match = plans.find((p) => p.id === requested);
  if (match) return match.id;
  return plans.find((p) => p.highlight)?.id ?? plans[0].id;
}

interface RegisterFormProps {
  // Set when the visitor arrived here via "Continue with Google" and no
  // subscriber matched their Google account yet (see
  // src/app/api/auth/google/callback/route.ts and getGooglePendingSignup()
  // in src/lib/subscriber-auth.ts). The email is locked to the verified
  // Google address and the password fields become optional — the server
  // action re-derives googleId itself from the signed cookie, this prop is
  // display-only.
  googlePrefill?: { name: string; email: string } | null;
}

export function RegisterForm({ googlePrefill }: RegisterFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("ref") || searchParams.get("token") || null;
  const plans = clientConfig.pricingPlans;
  const isGoogleSignup = Boolean(googlePrefill);

  const [name, setName] = useState(googlePrefill?.name ?? "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(googlePrefill?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [planId, setPlanId] = useState<PricingPlan["id"]>(() =>
    resolveInitialPlanId(searchParams.get("plan"), plans),
  );

  const [currentBroker, setCurrentBroker] = useState("Dhan");

  const selectedPlan = plans.find((p) => p.id === planId) ?? plans[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Google signups can skip setting a password entirely (they always have
    // the Google button to log back in) — but if they do type one, it still
    // has to meet the same bar as a password-only signup.
    const skippingPassword = isGoogleSignup && password.length === 0 && confirmPassword.length === 0;
    if (!skippingPassword) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }

    startTransition(async () => {
      const result = await registerSubscriber({
        name,
        phone,
        email,
        password,
        currentBroker,
        billingCycle: planId.toUpperCase() as "MONTHLY" | "QUARTERLY" | "YEARLY",
        batchNumber: clientConfig.batchInfo.batchNumber,
        invitationToken,
      });
      if (result.success) {
        setSubmitted(true);
        // Registration also logs the subscriber in — refresh so the navbar
        // (a server component reading the session cookie) picks it up.
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <h2 className="font-heading text-2xl font-bold signalflow-gold-text">You&apos;re in!</h2>
        <p className="text-sm text-muted-foreground">
          {`Thanks, ${name.split(" ")[0]} — you're logged in. Complete payment below, then join WhatsApp so we can add you to the group.`}
        </p>

        <PaymentDetailsCard
          className="w-full text-left"
          plan={{
            label: selectedPlan.label,
            priceInr: selectedPlan.priceInr,
            periodLabel: selectedPlan.periodLabel,
          }}
        />

        <Button asChild className="signalflow-glow signalflow-btn-gradient w-full">
          <a href={clientConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-4 w-4" />
            Join WhatsApp Group
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isGoogleSignup && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-muted-foreground">
          Signing up with your Google account (<span className="font-semibold text-foreground">{googlePrefill?.email}</span>).
          Just fill in the rest to finish — you can log back in with the Google button any time.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Choose Your Plan</Label>
        <div className="grid grid-cols-3 gap-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPlanId(plan.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 text-center transition-colors",
                plan.id === planId
                  ? "border-primary/50 bg-primary/10 signalflow-glow"
                  : "border-white/10 hover:border-white/20",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-black">
                  Popular
                </span>
              )}
              <span className="text-xs font-semibold text-foreground">{plan.label}</span>
              <span className="font-heading text-sm font-bold signalflow-gold-text">
                ₹{plan.priceInr.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-muted-foreground">{plan.periodLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          readOnly={isGoogleSignup}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={isGoogleSignup ? "opacity-70" : undefined}
        />
        <p className="text-xs text-muted-foreground/70">
          {isGoogleSignup
            ? "Locked to your verified Google email."
            : "You'll use this to log in later, so make sure it's correct."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{isGoogleSignup ? "Password (optional)" : "Password"}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required={!isGoogleSignup}
            autoComplete="new-password"
            placeholder={
              isGoogleSignup ? "Leave blank to only log in with Google" : `At least ${MIN_PASSWORD_LENGTH} characters`
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          required={!isGoogleSignup}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {!isGoogleSignup && (
        <>
          <div className="relative my-1 text-center text-xs text-muted-foreground">
            <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
            <span className="relative bg-background px-2">or</span>
          </div>
          <GoogleSignInButton role="subscriber" label="Sign up with Google" />
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentBroker">Current Trading Broker</Label>
        <select
          id="currentBroker"
          value={currentBroker}
          onChange={(e) => setCurrentBroker(e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {BROKER_OPTIONS.map((broker) => (
            <option key={broker} value={broker} className="bg-neutral-900 text-foreground">
              {broker === "Other" ? "Other Broker" : broker}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-[var(--signalflow-loss)]">{error}</p>}
      <Button type="submit" disabled={isPending} className="signalflow-glow signalflow-btn-gradient mt-2">
        {isPending ? "Registering…" : "Register Premium"}
      </Button>
    </form>
  );
}
