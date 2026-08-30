/**
 * "Continue with Google" link-button used on both /admin/login and /login.
 * Plain <a> (not a client onClick handler) — it just needs to navigate to
 * the start route, which issues the actual redirect to Google.
 */
interface GoogleSignInButtonProps {
  role: "admin" | "subscriber";
  redirectTo?: string;
  label?: string;
}

export function GoogleSignInButton({ role, redirectTo, label = "Continue with Google" }: GoogleSignInButtonProps) {
  const params = new URLSearchParams({ role });
  if (redirectTo) params.set("redirectTo", redirectTo);

  return (
    <a
      href={`/api/auth/google/start?${params.toString()}`}
      className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.6 5.6 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3c-1.08.72-2.45 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.28A12 12 0 0 0 0 12c0 1.93.46 3.76 1.28 5.39z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      {label}
    </a>
  );
}
