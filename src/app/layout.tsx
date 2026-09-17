import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SoundAlertProvider } from "@/components/site/sound-alert-provider";
import { clientConfig } from "@/lib/client-config";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: `${clientConfig.siteName} | Intraday Options Signals`,
  description: clientConfig.siteDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Per-client brand colors — overrides gold/accent tokens in globals.css
            for multi-tenant deployments. Primary button/link teal comes from
            globals.css and is not overridden here. */}
        <style>{`
          :root {
            --chart-1: ${clientConfig.goldStart};
            --accent: ${clientConfig.goldEnd};
            --chart-4: ${clientConfig.goldEnd};
            --signalflow-gold-start: ${clientConfig.goldStart};
            --signalflow-gold-end: ${clientConfig.goldEnd};
            --signalflow-logo-accent: ${clientConfig.logoAccent ?? clientConfig.goldStart};
            --signalflow-logo-accent-mix: ${clientConfig.logoAccent ? "18%" : "0%"};
          }
        `}</style>
        <div className="signalflow-mesh-bg" aria-hidden="true" />
        <SoundAlertProvider>{children}</SoundAlertProvider>
        <Toaster richColors theme="dark" />
        <Script id="tawk-to-widget" strategy="lazyOnload">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6aab455fef8aaa3444a167cc/1k2mgdve9';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
