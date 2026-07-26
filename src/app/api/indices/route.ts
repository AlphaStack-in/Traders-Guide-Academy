import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYMBOLS: { label: string; symbol: string }[] = [
  { label: "NIFTY 50", symbol: "%5ENSEI" },
  { label: "BANK NIFTY", symbol: "%5ENSEBANK" },
  { label: "SENSEX", symbol: "%5EBSESN" },
  { label: "MIDCAP NIFTY", symbol: "%5ENSEMDCP50" },
];

interface IndexQuote {
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

async function fetchQuote({ label, symbol }: { label: string; symbol: string }) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 15 } },
  );
  if (!res.ok) return null;

  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const price = meta.regularMarketPrice;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return { label, price, change, changePercent } satisfies IndexQuote;
}

export async function GET() {
  const results = await Promise.all(SYMBOLS.map((s) => fetchQuote(s).catch(() => null)));
  const quotes = results.filter((q): q is IndexQuote => q !== null);
  return NextResponse.json({ quotes }, { headers: { "Cache-Control": "no-store" } });
}
