"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/site/icons";
import { PaymentDetailsCard } from "@/components/account/payment-details-card";
import { BROKER_OPTIONS } from "@/lib/brokers";
import { clientConfig } from "@/lib/client-config";
import { registerSubscriber } from "@/app/register/actions";

const MIN_PASSWORD_LENGTH = 6;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("ref") || searchParams.get("token") || null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [currentBroker, setCurrentBroker] = useState("Dhan");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    startTransition(async () => {
      const result = await registerSubscriber({
        name,
        phone,
        email,
        password,
        currentBroker,
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

        <PaymentDetailsCard className="w-full text-left" />

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
      {/* Current Running Batch Indicator */}
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
        <p className="text-xs text-muted-foreground">Joining Batch</p>
        <p className="font-heading text-sm font-semibold signalflow-gold-text">
          Batch {clientConfig.batchInfo.batchNumber} ({clientConfig.batchInfo.startDate})
        </p>
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
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground/70">
          You&apos;ll use this to log in later, so make sure it&apos;s correct.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

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
