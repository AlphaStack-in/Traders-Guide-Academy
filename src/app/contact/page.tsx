import Image from "next/image";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { InstagramIcon } from "@/components/site/icons";
import { ReferralForm } from "@/components/contact/referral-form";
import { ContactForm } from "@/components/contact/contact-form";
import { clientConfig } from "@/lib/client-config";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 sm:grid-cols-2 items-center signalflow-glass signalflow-glow rounded-2xl border border-white/5 p-8">
          <div className="flex justify-center">
            <div className="relative">
              <Image
                src="/satish-rathod.png"
                alt="Satish Rathod, Founder of Traders Guide Academy"
                width={300}
                height={400}
                className="rounded-xl shadow-lg h-full"
              />
            </div>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold">
              About <span className="signalflow-gold-text">Traders Guide Academy</span>
            </h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Traders Guide Academy (TGA)</strong> is a trading education and market-learning platform founded by <strong className="text-foreground">Satish Rathod, a NISM-certified market professional</strong>. TGA focuses on practical trading education, technical analysis, options strategies, market behaviour and disciplined risk management.
              </p>
              <p>
                With a strong emphasis on structured learning, strategy development and data-driven decision-making, TGA aims to help traders become more disciplined and independent in their market journey.
              </p>
              <p>
                With SignalFlow, TGA is bringing its market insights and trading frameworks into a technology-driven platform, making structured market intelligence and trading signals easier to access, monitor and act upon.
              </p>
              <p>
                Satish Rathod combines his market knowledge and NISM certification with a practical, hands-on approach to trading education and strategy development, with a focus on simplifying complex market concepts into practical frameworks for traders. Our approach is aimed at helping traders make more informed and disciplined decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Get in <span className="signalflow-gold-text">Touch</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions about a signal, a batch, or payment — reach us directly.
          </p>
        </div>

        <div className="grid gap-6">
          <a
            href={clientConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="signalflow-glass signalflow-glow group relative overflow-hidden rounded-2xl border border-white/5 p-6 transition-colors hover:border-primary/40"
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ backgroundImage: "var(--signalflow-gold-gradient)" }}
            />
            <InstagramIcon className="h-8 w-8 text-primary" />
            <p className="mt-4 font-heading text-lg font-bold">Instagram</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow for trade breakdowns and highlights.
            </p>
          </a>
        </div>

        <ContactForm />

        <ReferralForm />
      </main>
      <Footer />
    </div>
  );
}
