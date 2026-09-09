import { describe, it, expect } from "vitest";
import { computeStarFill } from "../star-rating";

describe("computeStarFill", () => {
  it("splits a 4.8 rating into 4 solid + 1 outline", () => {
    expect(computeStarFill(4.8)).toEqual({ solid: 4, outline: 1 });
  });

  it("splits a whole-number rating into all-solid, no outline", () => {
    expect(computeStarFill(5)).toEqual({ solid: 5, outline: 0 });
  });

  it("splits a 0 rating into all-outline", () => {
    expect(computeStarFill(0)).toEqual({ solid: 0, outline: 5 });
  });

  it("clamps out-of-range ratings into 0-5", () => {
    expect(computeStarFill(7)).toEqual({ solid: 5, outline: 0 });
    expect(computeStarFill(-2)).toEqual({ solid: 0, outline: 5 });
  });
});
