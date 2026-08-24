import { describe, it, expect } from "vitest";
import { getISTWeekBoundary, computeDigestMetrics } from "../weekly-digest";
import type { Signal } from "@prisma/client";

describe("getISTWeekBoundary", () => {
  it("returns Monday-Sunday IST boundary for a Wednesday", () => {
    // Wednesday 2026-08-19 12:00 UTC = Wednesday 17:30 IST
    const ref = new Date("2026-08-19T12:00:00Z");
    const { weekStart, weekEnd } = getISTWeekBoundary(ref);

    // Monday 2026-08-17 00:00 IST = Sunday 2026-08-16 18:30 UTC
    expect(weekStart.toISOString()).toBe("2026-08-16T18:30:00.000Z");

    // Sunday 2026-08-23 23:59:59.999 IST = Sunday 2026-08-23 18:29:59.999 UTC
    expect(weekEnd.toISOString()).toBe("2026-08-23T18:29:59.999Z");
  });

  it("returns correct boundary for a Sunday morning IST (cron fire time)", () => {
    // Sunday 2026-08-23 04:00 UTC = Sunday 09:30 IST (cron fire time)
    const ref = new Date("2026-08-23T04:00:00Z");
    const { weekStart, weekEnd } = getISTWeekBoundary(ref);

    // Still in the same week (Monday Aug 17 - Sunday Aug 23)
    expect(weekStart.toISOString()).toBe("2026-08-16T18:30:00.000Z");
    expect(weekEnd.toISOString()).toBe("2026-08-23T18:29:59.999Z");
  });

  it("returns correct boundary for a Monday 00:01 IST", () => {
    // Monday 2026-08-17 00:01 IST = Sunday 2026-08-16 18:31 UTC
    const ref = new Date("2026-08-16T18:31:00Z");
    const { weekStart, weekEnd } = getISTWeekBoundary(ref);

    expect(weekStart.toISOString()).toBe("2026-08-16T18:30:00.000Z");
    expect(weekEnd.toISOString()).toBe("2026-08-23T18:29:59.999Z");
  });

  it("returns previous week boundary for Sunday 23:59 IST", () => {
    // Sunday 2026-08-23 23:59 IST = Sunday 2026-08-23 18:29 UTC
    const ref = new Date("2026-08-23T18:29:00Z");
    const { weekStart, weekEnd } = getISTWeekBoundary(ref);

    // Still Monday Aug 17 - Sunday Aug 23
    expect(weekStart.toISOString()).toBe("2026-08-16T18:30:00.000Z");
    expect(weekEnd.toISOString()).toBe("2026-08-23T18:29:59.999Z");
  });

  it("rolls to new week at Monday 00:00 IST", () => {
    // Monday 2026-08-24 00:00 IST = Sunday 2026-08-23 18:30 UTC
    const ref = new Date("2026-08-23T18:30:00Z");
    const { weekStart, weekEnd } = getISTWeekBoundary(ref);

    // New week: Monday Aug 24 - Sunday Aug 30
    expect(weekStart.toISOString()).toBe("2026-08-23T18:30:00.000Z");
    expect(weekEnd.toISOString()).toBe("2026-08-30T18:29:59.999Z");
  });
});

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "test-id",
    strike: 25000,
    optionType: "CE",
    instrument: "NIFTY",
    entryPrice: 100,
    sellPrice: 120,
    stopLoss: 80,
    targets: [130],
    priceAtSignal: 100,
    status: "TARGET_HIT",
    pnlPercent: 20,
    signalTime: new Date("2026-08-20T10:00:00Z"),
    closedTime: new Date("2026-08-20T14:00:00Z"),
    createdAt: new Date("2026-08-20T10:00:00Z"),
    updatedAt: new Date("2026-08-20T14:00:00Z"),
    rawMessage: "test",
    adminNote: null,
    expiry: new Date("2026-08-28"),
    silentUpdateAt: null,
    lotSize: 75,
    chartImageUrl: null,
    entryLow: null,
    entryHigh: null,
    target1: 130,
    target2: null,
    contextTags: [],
    confidence: "HIGH",
    parserName: "SIGNALFLOW",
    parserVersion: "1.0.0",
    ...overrides,
  };
}

describe("computeDigestMetrics", () => {
  it("computes correct metrics for a mix of wins and losses", () => {
    const signals = [
      makeSignal({ id: "1", entryPrice: 100, sellPrice: 120, lotSize: 75, status: "TARGET_HIT" }),
      makeSignal({ id: "2", entryPrice: 100, sellPrice: 130, lotSize: 75, status: "TARGET_HIT" }),
      makeSignal({ id: "3", entryPrice: 100, sellPrice: 80, lotSize: 75, status: "SL_HIT" }),
    ];

    const metrics = computeDigestMetrics(signals);

    expect(metrics.signalCount).toBe(3);
    expect(metrics.winCount).toBe(2);
    expect(metrics.lossCount).toBe(1);
    expect(metrics.winRate).toBeCloseTo(66.67, 1);
    // P&L points: (120-100) + (130-100) + (80-100) = 20 + 30 + (-20) = 30
    expect(metrics.totalPnlPoints).toBeCloseTo(30);
    // P&L rupees: 20*75 + 30*75 + (-20)*75 = 1500 + 2250 + (-1500) = 2250
    expect(metrics.totalPnlRupees).toBe(2250);
    expect(metrics.bestTrade).not.toBeNull();
    expect(metrics.bestTrade!.pnlPoints).toBeCloseTo(30);
    expect(metrics.worstTrade).not.toBeNull();
    expect(metrics.worstTrade!.pnlPoints).toBeCloseTo(-20);
  });

  it("returns zero metrics for empty signals", () => {
    const metrics = computeDigestMetrics([]);
    expect(metrics.signalCount).toBe(0);
    expect(metrics.winRate).toBe(0);
    expect(metrics.totalPnlPoints).toBe(0);
    expect(metrics.totalPnlRupees).toBeNull();
    expect(metrics.bestTrade).toBeNull();
    expect(metrics.worstTrade).toBeNull();
  });

  it("handles signals without lotSize (rupee P&L is null)", () => {
    const signals = [
      makeSignal({ id: "1", entryPrice: 100, sellPrice: 120, lotSize: null }),
    ];

    const metrics = computeDigestMetrics(signals);
    expect(metrics.signalCount).toBe(1);
    expect(metrics.totalPnlPoints).toBeCloseTo(20);
    expect(metrics.totalPnlRupees).toBeNull();
  });

  it("computes mixed lotSize correctly (some have, some do not)", () => {
    const signals = [
      makeSignal({ id: "1", entryPrice: 100, sellPrice: 120, lotSize: 75 }),
      makeSignal({ id: "2", entryPrice: 100, sellPrice: 110, lotSize: null }),
    ];

    const metrics = computeDigestMetrics(signals);
    expect(metrics.signalCount).toBe(2);
    expect(metrics.totalPnlPoints).toBeCloseTo(30);
    // Only signal 1 has rupee P&L: 20 * 75 = 1500
    expect(metrics.totalPnlRupees).toBe(1500);
  });

  it("skips signals without sellPrice", () => {
    const signals = [
      makeSignal({ id: "1", entryPrice: 100, sellPrice: null }),
    ];
    const metrics = computeDigestMetrics(signals);
    expect(metrics.signalCount).toBe(0);
  });
});
