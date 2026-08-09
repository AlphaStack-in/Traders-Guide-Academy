"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/site/icons";
import { clientConfig } from "@/lib/client-config";
import { registerSubscriber } from "@/app/register/actions";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("ref") || searchParams.get("token") || null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [currentBroker, setCurrentBroker] = useState("Dhan");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await registerSubscriber({
        name,
        phone,
        email: email || null,
        currentBroker,
        batchNumber: clientConfig.batchInfo.batchNumber,
        invitationToken,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <h2 className="font-heading text-2xl font-bold thc-gold-text">You&apos;re in!</h2>
        <p className="text-sm text-muted-foreground">
          {`Thanks, ${name.split(" ")[0]} — we've saved your details. Complete payment below, then join WhatsApp so we can add you to the group.`}
        </p>

        <div className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-left text-sm">
          <p className="font-heading font-semibold">
            Pay ₹{clientConfig.batchInfo.priceInr.toLocaleString("en-IN")} via UPI
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
            {clientConfig.paymentInfo.upiIds.map((upi) => (
              <li key={upi.vpa}>
                <span className="font-medium text-foreground">{upi.vpa}</span> ({upi.name})
              </li>
            ))}
          </ul>
          <p className="mt-3 font-heading font-semibold">Questions? Contact</p>
          <ul className="mt-1 flex flex-col gap-1 text-muted-foreground">
            {clientConfig.paymentInfo.managers.map((manager) => (
              <li key={manager.phone}>
                {manager.name} —{" "}
                <a href={`tel:${manager.phone}`} className="text-primary">
                  {manager.phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground/70">
            {clientConfig.batchInfo.refundPolicy}{" "}
            <Link href="/terms" className="text-primary underline underline-offset-2">
              T &amp; C
            </Link>
          </p>
        </div>

        <Button asChild className="thc-glow thc-btn-gradient w-full">
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
        <p className="font-heading text-sm font-semibold thc-gold-text">
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
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          <option value="Dhan" className="bg-neutral-900 text-foreground">Dhan</option>
          <option value="Zerodha" className="bg-neutral-900 text-foreground">Zerodha</option>
          <option value="Angel One" className="bg-neutral-900 text-foreground">Angel One</option>
          <option value="Upstox" className="bg-neutral-900 text-foreground">Upstox</option>
          <option value="Groww" className="bg-neutral-900 text-foreground">Groww</option>
          <option value="Goodwill" className="bg-neutral-900 text-foreground">Goodwill</option>
          <option value="ICICI Direct" className="bg-neutral-900 text-foreground">ICICI Direct</option>
          <option value="Kotak Securities" className="bg-neutral-900 text-foreground">Kotak Securities</option>
          <option value="HDFC Securities" className="bg-neutral-900 text-foreground">HDFC Securities</option>
          <option value="Motilal Oswal" className="bg-neutral-900 text-foreground">Motilal Oswal</option>
          <option value="Sharekhan" className="bg-neutral-900 text-foreground">Sharekhan</option>
          <option value="Fyers" className="bg-neutral-900 text-foreground">Fyers</option>
          <option value="5paisa" className="bg-neutral-900 text-foreground">5paisa</option>
          <option value="Other" className="bg-neutral-900 text-foreground">Other Broker</option>
        </select>
      </div>

      {error && <p className="text-sm text-[var(--thc-loss)]">{error}</p>}
      <Button type="submit" disabled={isPending} className="thc-glow thc-btn-gradient mt-2">
        {isPending ? "Registering…" : "Register Premium"}
      </Button>
    </form>
  );
}
