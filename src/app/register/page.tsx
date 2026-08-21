import { Suspense } from "react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { RegisterForm } from "@/components/register/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="signalflow-glass signalflow-gold-border w-full rounded-2xl p-8">
          <h1 className="font-heading text-2xl font-bold">
            Register <span className="signalflow-gold-text">Premium</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Leave your details and we&apos;ll add you to our premium signal group — every
            intraday call, straight to your phone.
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
