"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { connectDhanPersonalToken, disconnectDhan } from "@/app/account/broker/actions";

const CONFIRMATION_AUTO_DISMISS_MS = 8000;

export interface BrokerConnectionInfo {
  dhanClientId: string;
  dhanClientName: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  tokenExpiresAt: string;
}

export function BrokerConnectPanel({
  initialConnection,
}: {
  initialConnection: BrokerConnectionInfo | null;
}) {
  const router = useRouter();
  const [dhanClientId, setDhanClientId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justConnected, setJustConnected] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await connectDhanPersonalToken({ dhanClientId, accessToken });

      if (!result.success) {
        setError(result.error ?? "Couldn't connect that account.");
        return;
      }

      toast.success("Dhan account connected!");
      setDhanClientId("");
      setAccessToken("");
      setJustConnected(true);
      setTimeout(() => setJustConnected(false), CONFIRMATION_AUTO_DISMISS_MS);
      router.refresh();
    } catch {
      setError("Something went wrong connecting that account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await disconnectDhan();
      toast.success("Disconnected.");
      router.refresh();
    } catch {
      toast.error("Couldn't disconnect — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (initialConnection) {
    const expiresAt = new Date(initialConnection.tokenExpiresAt);
    const statusVariant =
      initialConnection.status === "ACTIVE"
        ? "default"
        : initialConnection.status === "EXPIRED"
          ? "destructive"
          : "outline";

    return (
      <div className="flex flex-col gap-3">
        {justConnected && (
          <div className="signalflow-glass signalflow-gold-border signalflow-glow flex items-start justify-between gap-3 rounded-xl border p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-medium">
                <span className="font-heading font-bold signalflow-gold-text">Successfully connected!</span>{" "}
                You&apos;re all set to receive one-tap order forms on live signals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setJustConnected(false)}
              aria-label="Dismiss"
              className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="signalflow-glass signalflow-neutral-border flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-semibold">
              {initialConnection.dhanClientName ?? "Dhan Account"}
            </p>
            <Badge variant={statusVariant}>{initialConnection.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Client ID: <span className="text-foreground">{initialConnection.dhanClientId}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Token valid until{" "}
            <span className="text-foreground">{expiresAt.toLocaleString()}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleDisconnect}
            className="w-fit"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleConnect} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Generate an access token from your Dhan account (Profile → DhanHQ Trading APIs) and paste
        it below. Tokens are valid for 24 hours — we&apos;ll auto-renew it each morning, and only
        ask you to reconnect if that fails.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dhanClientId">Dhan Client ID</Label>
        <Input
          id="dhanClientId"
          required
          value={dhanClientId}
          onChange={(e) => setDhanClientId(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          type="password"
          required
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-[var(--signalflow-loss)]">{error}</p>}
      <Button type="submit" disabled={loading} className="signalflow-glow signalflow-btn-gradient mt-2 w-fit">
        {loading ? "Connecting…" : "Connect Dhan"}
      </Button>
    </form>
  );
}
