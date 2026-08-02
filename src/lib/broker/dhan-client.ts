import { ProxyAgent, fetch as undiciFetch } from "undici";

const DHAN_BASE_URL = "https://api.dhan.co";

// Dhan's order-placement APIs (orders, RenewToken, ip/setIP) require the
// calling IP to be pre-registered against the subscriber's Dhan account
// (SEBI/exchange mandate). We route just these calls through QuotaGuard's
// static-IP proxy rather than Vercel's default (unpredictable) egress IP.
let proxyDispatcher: ProxyAgent | null = null;

function getDhanProxyDispatcher(): ProxyAgent {
  if (proxyDispatcher) return proxyDispatcher;
  const proxyUrl = process.env.QUOTAGUARD_URL;
  if (!proxyUrl) {
    throw new Error(
      "QUOTAGUARD_URL is not set — Dhan order-placement calls require the static-IP proxy.",
    );
  }
  proxyDispatcher = new ProxyAgent(proxyUrl);
  return proxyDispatcher;
}

export interface DhanApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  rawBody: string;
}

async function dhanProxyRequest<T>(
  path: string,
  init: { method: string; headers: Record<string, string>; body?: string },
): Promise<DhanApiResult<T>> {
  const res = await undiciFetch(`${DHAN_BASE_URL}${path}`, {
    ...init,
    dispatcher: getDhanProxyDispatcher(),
  });
  const rawBody = await res.text();
  let data: T | null = null;
  try {
    data = rawBody ? (JSON.parse(rawBody) as T) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data, rawBody };
}

export interface DhanSetIpInput {
  accessToken: string;
  dhanClientId: string;
  ip: string;
  ipFlag: "PRIMARY" | "SECONDARY";
}

// One-time per subscriber (then at most once every 7 days thereafter — see
// PUT /v2/ip/modifyIP for changes after the initial call — that's Dhan's own
// limit, not ours).
export function setDhanStaticIp(input: DhanSetIpInput) {
  return dhanProxyRequest(
    "/v2/ip/setIP",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "access-token": input.accessToken,
      },
      body: JSON.stringify({
        dhanClientId: input.dhanClientId,
        ip: input.ip,
        ipFlag: input.ipFlag,
      }),
    },
  );
}

export interface DhanRenewTokenInput {
  accessToken: string;
  dhanClientId: string;
}

export function renewDhanToken(input: DhanRenewTokenInput) {
  return dhanProxyRequest("/v2/RenewToken", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "access-token": input.accessToken,
      dhanClientId: input.dhanClientId,
    },
  });
}

export interface DhanFundLimitInput {
  accessToken: string;
}

export interface DhanFundLimitData {
  dhanClientId: string;
  // Dhan's own field name/typo, not ours — kept as-is to match their response.
  availabelBalance: number;
}

// Data-only endpoint (like /v2/profile) — no static-IP requirement, so this
// intentionally does NOT go through the QuotaGuard proxy.
export async function getDhanFundLimit(
  input: DhanFundLimitInput,
): Promise<DhanApiResult<DhanFundLimitData>> {
  const res = await fetch(`${DHAN_BASE_URL}/v2/fundlimit`, {
    headers: { Accept: "application/json", "access-token": input.accessToken },
  });
  const rawBody = await res.text();
  let data: DhanFundLimitData | null = null;
  try {
    data = rawBody ? (JSON.parse(rawBody) as DhanFundLimitData) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data, rawBody };
}

export interface DhanOrderInput {
  accessToken: string;
  dhanClientId: string;
  transactionType: "BUY" | "SELL";
  exchangeSegment: "NSE_FNO" | "BSE_FNO";
  productType: "INTRADAY";
  orderType: "MARKET" | "LIMIT";
  validity: "DAY";
  securityId: string;
  quantity: number;
  price: number;
  correlationId?: string;
}

// Not wired into any subscriber-facing flow yet — transport-layer only,
// ready for the order-placement UI/flow once that's built and confirmed.
export function placeDhanOrder(input: DhanOrderInput) {
  const { accessToken, ...body } = input;
  return dhanProxyRequest("/v2/orders", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "access-token": accessToken,
    },
    body: JSON.stringify(body),
  });
}
