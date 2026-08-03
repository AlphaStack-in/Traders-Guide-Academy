import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SoundAlertProvider } from "@/components/site/sound-alert-provider";
import { clientConfig } from "@/lib/client-config";
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
        {/* Per-client brand colors — overrides the THC defaults baked into
            globals.css so one codebase can serve multiple deployments. */}
        <style>{`
          :root {
            --primary: ${clientConfig.goldStart};
            --ring: ${clientConfig.goldStart};
            --chart-1: ${clientConfig.goldStart};
            --sidebar-primary: ${clientConfig.goldStart};
            --sidebar-ring: ${clientConfig.goldStart};
            --accent: ${clientConfig.goldEnd};
            --chart-4: ${clientConfig.goldEnd};
            --thc-gold-start: ${clientConfig.goldStart};
            --thc-gold-end: ${clientConfig.goldEnd};
            --thc-logo-accent: ${clientConfig.logoAccent ?? clientConfig.goldStart};
            --thc-logo-accent-mix: ${clientConfig.logoAccent ? "18%" : "0%"};
          }
        `}</style>
        <div className="thc-mesh-bg" aria-hidden="true" />
        <SoundAlertProvider>{children}</SoundAlertProvider>
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
