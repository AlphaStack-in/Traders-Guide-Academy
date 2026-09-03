import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { getSubscriberPreferences } from "@/app/account/settings/actions";
import { SubscriberSettingsForm } from "@/components/account/settings-form";

export default async function AccountSettingsPage() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/settings");
  }

  const preferences = await getSubscriberPreferences();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            <span className="signalflow-gold-text">Settings</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Control what notifications you receive.
          </p>
        </div>
        <SubscriberSettingsForm initial={preferences} />
      </main>
      <Footer />
    </div>
  );
}
