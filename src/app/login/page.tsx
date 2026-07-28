import { Suspense } from "react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SubscriberLoginForm } from "@/components/auth/subscriber-login-form";

export default function SubscriberLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="thc-glass thc-gold-border w-full rounded-2xl p-8">
          <h1 className="font-heading text-2xl font-bold">
            Subscriber <span className="thc-gold-text">Login</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with the email on your premium subscription to connect your broker and place
            orders straight from your trade signals.
          </p>
          <div className="mt-6">
            <Suspense>
              <SubscriberLoginForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
