"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartImageUploader } from "@/components/signals/chart-image-uploader";
import { createNewsAlert } from "@/app/admin/(protected)/news-alerts/actions";

// Sentinel for the Select's "no product" option — Radix Select doesn't
// allow an empty-string item value, so this stands in for `productSlug: null`.
const NO_PRODUCT = "__none__";

export interface ProductOption {
  slug: string;
  name: string;
}

// Covers both use cases the News & Alerts admin page manages: a poster
// (title + image + short caption + optional product link and/or
// registration link — content left blank falls back to the caption, see
// createNewsAlert) and a plain text market alert (skip the image, write a
// fuller summary/content).
export function AddNewsAlertForm({ products = [] }: { products?: ProductOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Webinar");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [productSlug, setProductSlug] = useState(NO_PRODUCT);

  function reset() {
    setTitle("");
    setCategory("Webinar");
    setSummary("");
    setContent("");
    setImageUrl(null);
    setSourceUrl("");
    setProductSlug(NO_PRODUCT);
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!summary.trim()) {
      toast.error("Add a short caption/summary.");
      return;
    }

    startTransition(async () => {
      const result = await createNewsAlert({
        title,
        category,
        summary,
        content: content.trim() || null,
        imageUrl,
        sourceUrl: sourceUrl.trim() || null,
        productSlug: productSlug === NO_PRODUCT ? null : productSlug,
      });
      if (result.success) {
        toast.success("Added — it's active on the site now (toggle it off below if needed).");
        reset();
        router.refresh();
      } else {
        toast.error(result.error ?? "Couldn't save that.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0e14]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold">Add poster or alert</h2>
          <p className="text-xs text-muted-foreground">
            Paste/upload a poster image for a webinar or community update, or leave the image
            blank for a plain text market alert.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="na-title">Title</Label>
          <Input
            id="na-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Live Webinar — Option Hedging Strategy"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="na-category">Category</Label>
          <Input
            id="na-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Webinar, Community Update, Market…"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="na-summary">Caption / summary</Label>
        <Textarea
          id="na-summary"
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One or two lines shown under the poster — e.g. the session topic and time."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="na-content">
          Full details <span className="text-muted-foreground font-normal">(optional — shown when expanded)</span>
        </Label>
        <Textarea
          id="na-content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Leave blank to just repeat the caption above."
        />
      </div>

      <ChartImageUploader value={imageUrl} onChange={setImageUrl} label="Poster image" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="na-product">
            Link to product <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Select value={productSlug} onValueChange={setProductSlug}>
            <SelectTrigger id="na-product" className="w-full">
              <SelectValue placeholder="No product — just an announcement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PRODUCT}>No product — just an announcement</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            When set, the poster gets a &quot;View &amp; Buy&quot; button to that product&apos;s
            page — and its own image becomes that product&apos;s thumbnail there.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="na-link">
            Registration / WhatsApp / Zoom link <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="na-link"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="signalflow-glow signalflow-btn-gradient w-fit gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {isPending ? "Saving…" : "Add to site"}
      </Button>
    </div>
  );
}
