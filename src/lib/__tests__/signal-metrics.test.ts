import { describe, it, expect } from "vitest";
import { calcPnlPoints, calcPnlPercent } from "../signal-metrics";

describe("calcPnlPoints", () => {
  it("returns positive for profitable trade", () => {
    expect(calcPnlPoints(100, 120)).toBe(20);
  });

  it("returns negative for losing trade", () => {
    expect(calcPnlPoints(100, 80)).toBe(-20);
  });

  it("returns zero for break-even trade", () => {
    expect(calcPnlPoints(100, 100)).toBe(0);
  });

  it("handles decimal prices", () => {
    expect(calcPnlPoints(150.5, 175.25)).toBeCloseTo(24.75);
  });
});

describe("calcPnlPercent", () => {
  it("returns correct percentage", () => {
    expect(calcPnlPercent(100, 120)).toBeCloseTo(20);
  });

  it("returns negative percentage for loss", () => {
    expect(calcPnlPercent(100, 80)).toBeCloseTo(-20);
  });
});
