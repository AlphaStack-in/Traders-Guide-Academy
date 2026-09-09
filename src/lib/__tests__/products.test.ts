import { describe, it, expect } from "vitest";
import { formatPriceInPaise, isHighTouchCategory } from "../products";

describe("formatPriceInPaise", () => {
  it("renders 0 as Free", () => {
    expect(formatPriceInPaise(0)).toBe("Free");
  });

  it("formats whole-rupee amounts with the ₹ symbol and Indian grouping", () => {
    expect(formatPriceInPaise(499900)).toBe("₹4,999");
    expect(formatPriceInPaise(3000000)).toBe("₹30,000");
  });

  it("rounds to the nearest rupee", () => {
    expect(formatPriceInPaise(100050)).toBe("₹1,001");
  });
});

describe("isHighTouchCategory", () => {
  it("is true for Indicators, PMS and Membership Plans", () => {
    expect(isHighTouchCategory("INDICATOR")).toBe(true);
    expect(isHighTouchCategory("PMS")).toBe(true);
    expect(isHighTouchCategory("MEMBERSHIP")).toBe(true);
  });

  it("is false for Courses and E-books", () => {
    expect(isHighTouchCategory("COURSE")).toBe(false);
    expect(isHighTouchCategory("EBOOK")).toBe(false);
  });
});
