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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await registerSubscriber({
        name,
        phone,
        email: email || null,
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
      {error && <p className="text-sm text-[var(--thc-loss)]">{error}</p>}
      <Button type="submit" disabled={isPending} className="thc-glow thc-btn-gradient mt-2">
        {isPending ? "Registering…" : "Register Premium"}
      </Button>
    </form>
  );
}
