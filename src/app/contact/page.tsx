import Image from "next/image";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon, InstagramIcon } from "@/components/site/icons";
import { ReferralForm } from "@/components/contact/referral-form";
import { clientConfig } from "@/lib/client-config";

const PROMO_BANNERS = [
  { src: "/promo/offer1.jpeg", width: 852, height: 1280, alt: "Traders Hub Center jackpot offer" },
  { src: "/promo/offer2.jpeg", width: 1024, height: 1536, alt: "Traders Hub Center 13th batch offer" },
];

function toWhatsAppLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Get in <span className="thc-gold-text">Touch</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions about a signal, a batch, or payment — reach us directly.
          </p>
        </div>

        {clientConfig.id === "thc" && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {PROMO_BANNERS.map((banner) => (
              <a
                key={banner.src}
                href={clientConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="thc-glow overflow-hidden rounded-2xl border border-white/5"
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  width={banner.width}
                  height={banner.height}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </a>
            ))}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href={clientConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="thc-glass thc-glow group relative overflow-hidden rounded-2xl border border-white/5 p-6 transition-colors hover:border-primary/40"
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ backgroundImage: "var(--thc-gold-gradient)" }}
            />
            <WhatsAppIcon className="h-8 w-8 text-primary" />
            <p className="mt-4 font-heading text-lg font-bold">WhatsApp Group</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Join the group for live signals during market hours.
            </p>
          </a>

          <a
            href={clientConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="thc-glass thc-glow group relative overflow-hidden rounded-2xl border border-white/5 p-6 transition-colors hover:border-primary/40"
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ backgroundImage: "var(--thc-gold-gradient)" }}
            />
            <InstagramIcon className="h-8 w-8 text-primary" />
            <p className="mt-4 font-heading text-lg font-bold">Instagram</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow for trade breakdowns and highlights.
            </p>
          </a>
        </div>

        <div className="mt-10">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">
            Support Team
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {clientConfig.paymentInfo.managers.map((manager) => (
              <div
                key={manager.phone}
                className="thc-glass rounded-xl border border-white/5 p-5"
              >
                <p className="font-heading text-base font-bold">{manager.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{manager.phone}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="thc-glow">
                    <a href={`tel:${manager.phone}`}>Call</a>
                  </Button>
                  <Button asChild size="sm" className="thc-glow thc-btn-gradient">
                    <a
                      href={toWhatsAppLink(manager.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Message
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ReferralForm />
      </main>
      <Footer />
    </div>
  );
}
