import { Suspense } from "react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="signalflow-glass signalflow-gold-border w-full rounded-2xl p-8">
          <h1 className="font-heading text-2xl font-bold">
            Set New <span className="signalflow-gold-text">Password</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below to update your premium subscriber login credentials.
          </p>
          <div className="mt-6">
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
