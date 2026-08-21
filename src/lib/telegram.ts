import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

const TELEGRAM_API = "https://api.telegram.org";

function instrumentPrefix(instrument: InstrumentLiteral | null | undefined) {
  return instrument ? `${INSTRUMENT_LABEL[instrument]} ` : "";
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram not configured — skipping notification.");
    return;
  }

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    console.error("Telegram notification failed:", await res.text());
  }
}

export function formatNewSignalMessage(signal: {
  strike: number;
  optionType: string;
  instrument?: InstrumentLiteral | null;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
}): string {
  return [
    `🟡 <b>New Signal — ${instrumentPrefix(signal.instrument)}${signal.strike} ${signal.optionType}</b>`,
    `Entry (Above): ${signal.entryPrice}`,
    `SL: ${signal.stopLoss}`,
    `Target${signal.targets.length > 1 ? "s" : ""}: ${signal.targets.join(", ")}`,
  ].join("\n");
}

export function formatSignalUpdateMessage(signal: {
  strike: number;
  optionType: string;
  instrument?: InstrumentLiteral | null;
  sellPrice: number;
  pnlPercent: number;
  status: string;
}): string {
  const emoji = signal.pnlPercent >= 0 ? "✅" : "🔴";
  const statusLabel = signal.status.replace("_", " ");
  return [
    `${emoji} <b>Trade Update — ${instrumentPrefix(signal.instrument)}${signal.strike} ${signal.optionType}</b>`,
    `Closed at: ${signal.sellPrice}`,
    `P&amp;L: ${signal.pnlPercent > 0 ? "+" : ""}${signal.pnlPercent.toFixed(1)}%`,
    `Status: ${statusLabel}`,
  ].join("\n");
}
