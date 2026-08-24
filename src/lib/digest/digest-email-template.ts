import { clientConfig } from "@/lib/client-config";
import type { DigestMetrics, DigestSignalRow } from "./weekly-digest";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatPnl(points: number): string {
  const sign = points >= 0 ? "+" : "";
  return `${sign}${points.toFixed(1)}`;
}

function formatRupees(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}₹${Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function tradeCalloutHtml(label: string, trade: DigestSignalRow | null): string {
  if (!trade) return "";
  const color = trade.pnlPoints >= 0 ? "#22c55e" : "#ef4444";
  return `
    <div style="display: inline-block; width: 48%; vertical-align: top; padding: 12px; background-color: #1a1a1d; border-radius: 8px; margin-bottom: 8px;">
      <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 4px;">${label}</div>
      <div style="font-size: 14px; color: #F3F4F6;">${trade.instrument} ${trade.strike} ${trade.optionType}</div>
      <div style="font-size: 16px; font-weight: bold; color: ${color};">${formatPnl(trade.pnlPoints)} pts${trade.pnlRupees != null ? ` (${formatRupees(trade.pnlRupees)})` : ""}</div>
    </div>
  `;
}

function signalRowHtml(signal: DigestSignalRow): string {
  const pnlColor = signal.pnlPoints >= 0 ? "#22c55e" : "#ef4444";
  const rupeeText = signal.pnlRupees != null ? formatRupees(signal.pnlRupees) : "N/A";
  return `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 8px 6px; font-size: 13px; color: #F3F4F6;">${signal.instrument}</td>
      <td style="padding: 8px 6px; font-size: 13px; color: #F3F4F6;">${signal.strike} ${signal.optionType}</td>
      <td style="padding: 8px 6px; font-size: 13px; color: #F3F4F6; text-align: right;">${signal.entryPrice.toFixed(1)}</td>
      <td style="padding: 8px 6px; font-size: 13px; color: #F3F4F6; text-align: right;">${signal.sellPrice.toFixed(1)}</td>
      <td style="padding: 8px 6px; font-size: 13px; color: ${pnlColor}; text-align: right; font-weight: bold;">${formatPnl(signal.pnlPoints)}</td>
      <td style="padding: 8px 6px; font-size: 13px; color: ${pnlColor}; text-align: right;">${rupeeText}</td>
    </tr>
  `;
}

export interface DigestEmailParams {
  subscriberName: string;
  metrics: DigestMetrics;
  weekStart: Date;
  weekEnd: Date;
  unsubscribeUrl: string;
}

/**
 * Renders the weekly performance digest email as an HTML string with
 * fully inline styles (no external CSS or images).
 */
export function renderDigestEmail(params: DigestEmailParams): string {
  const { subscriberName, metrics, weekStart, weekEnd, unsubscribeUrl } = params;
  const siteName = clientConfig.siteName;

  const weekRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  const winRateColor = metrics.winRate >= 50 ? "#22c55e" : "#ef4444";

  const rupeeSummary =
    metrics.totalPnlRupees != null
      ? `<div style="display: inline-block; width: 48%; text-align: center; padding: 12px; background-color: #1a1a1d; border-radius: 8px;">
          <div style="font-size: 12px; color: #9CA3AF;">Total P&L (₹)</div>
          <div style="font-size: 20px; font-weight: bold; color: ${metrics.totalPnlRupees >= 0 ? "#22c55e" : "#ef4444"};">${formatRupees(metrics.totalPnlRupees)}</div>
        </div>`
      : "";

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #F0C949; margin: 0 0 4px 0; font-size: 22px;">${siteName}</h1>
    <div style="font-size: 14px; color: #9CA3AF;">Weekly Performance Digest</div>
    <div style="font-size: 13px; color: #6B7280; margin-top: 4px;">${weekRange}</div>
  </div>

  <!-- Greeting -->
  <p style="margin: 0 0 20px 0; font-size: 14px;">Hi ${subscriberName},</p>
  <p style="margin: 0 0 20px 0; font-size: 14px; color: #D1D5DB;">Here is your weekly signal performance summary:</p>

  <!-- Summary Stats -->
  <div style="margin-bottom: 20px; text-align: center;">
    <div style="display: inline-block; width: 30%; text-align: center; padding: 12px; background-color: #1a1a1d; border-radius: 8px;">
      <div style="font-size: 12px; color: #9CA3AF;">Signals Closed</div>
      <div style="font-size: 24px; font-weight: bold; color: #F0C949;">${metrics.signalCount}</div>
    </div>
    <div style="display: inline-block; width: 30%; text-align: center; padding: 12px; background-color: #1a1a1d; border-radius: 8px;">
      <div style="font-size: 12px; color: #9CA3AF;">Win Rate</div>
      <div style="font-size: 24px; font-weight: bold; color: ${winRateColor};">${metrics.winRate.toFixed(0)}%</div>
    </div>
    <div style="display: inline-block; width: 30%; text-align: center; padding: 12px; background-color: #1a1a1d; border-radius: 8px;">
      <div style="font-size: 12px; color: #9CA3AF;">Total P&L (pts)</div>
      <div style="font-size: 24px; font-weight: bold; color: ${metrics.totalPnlPoints >= 0 ? "#22c55e" : "#ef4444"};">${formatPnl(metrics.totalPnlPoints)}</div>
    </div>
  </div>

  ${rupeeSummary ? `<div style="margin-bottom: 20px; text-align: center;">${rupeeSummary}</div>` : ""}

  <!-- Best / Worst Trade -->
  ${metrics.bestTrade || metrics.worstTrade ? `
  <div style="margin-bottom: 20px;">
    ${tradeCalloutHtml("Best Trade", metrics.bestTrade)}
    ${tradeCalloutHtml("Worst Trade", metrics.worstTrade)}
  </div>
  ` : ""}

  <!-- Signal Table -->
  ${metrics.signals.length > 0 ? `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="border-bottom: 2px solid rgba(255,255,255,0.1);">
        <th style="padding: 8px 6px; font-size: 12px; color: #9CA3AF; text-align: left;">Instrument</th>
        <th style="padding: 8px 6px; font-size: 12px; color: #9CA3AF; text-align: left;">Strike</th>
        <th style="padding: 8px 6px; font-size: 12px; color: #9CA3AF; text-align: right;">Entry</th>
        <th style="padding: 8px 6px; font-size: 12px; color: #9CA3AF; text-align: right;">Exit</th>
        <th style="padding: 8px 6px; font-size: 12px; color: #9CA3AF; text-align: right;">P&L (pts)</th>
        <th style="padding: 8px 6px; font-size: 12px; color: #9CA3AF; text-align: right;">P&L (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${metrics.signals.map(signalRowHtml).join("")}
    </tbody>
  </table>
  ` : ""}

  <!-- Win/Loss Breakdown -->
  <div style="margin-bottom: 24px; font-size: 13px; color: #9CA3AF; text-align: center;">
    ${metrics.winCount} win${metrics.winCount !== 1 ? "s" : ""} &middot; ${metrics.lossCount} loss${metrics.lossCount !== 1 ? "es" : ""}
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center;">
    <p style="font-size: 12px; color: #6B7280; margin: 0 0 8px 0;">
      You are receiving this because you are subscribed to ${siteName} Premium.
    </p>
    <a href="${unsubscribeUrl}" style="font-size: 12px; color: #9CA3AF; text-decoration: underline;">Unsubscribe from weekly digest</a>
  </div>
</div>
  `.trim();
}
