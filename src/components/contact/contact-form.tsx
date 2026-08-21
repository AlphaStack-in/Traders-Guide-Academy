"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/app/contact/actions";

const EMPTY = { name: "", phone: "", email: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, startSubmitting] = useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startSubmitting(async () => {
      const result = await submitContactMessage(form);
      if (result.success) {
        toast.success("Message sent — we'll get back to you soon.");
        setForm(EMPTY);
      } else {
        toast.error(result.error ?? "Failed to send message.");
      }
    });
  }

  return (
    <div className="signalflow-glass signalflow-glow mt-10 rounded-2xl border border-white/5 p-6">
      <h2 className="font-heading text-lg font-bold">
        Send us a <span className="signalflow-gold-text">Message</span>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Have a question or feedback? Drop us a message and we&apos;ll reply directly.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactName">Your Name</Label>
            <Input
              id="contactName"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone">Your Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="contactEmail">Email (optional)</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactMessage">Message</Label>
          <Textarea
            id="contactMessage"
            required
            rows={4}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="signalflow-glow signalflow-btn-gradient mt-1 w-fit"
        >
          {isSubmitting ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
