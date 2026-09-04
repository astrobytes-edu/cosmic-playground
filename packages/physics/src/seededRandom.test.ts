import { describe, expect, it } from "vitest";
import { hashSeed, mulberry32, subStream, xmur3 } from "./seededRandom";

describe("seededRandom", () => {
  it("returns uniforms in [0, 1)", () => {
    const random = mulberry32(12345);
    for (let i = 0; i < 1000; i += 1) {
      const u = random();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const first = Array.from({ length: 20 }, () => a());
    const second = Array.from({ length: 20 }, () => b());
    expect(first).toEqual(second);
  });

  it("gives different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("is roughly uniform over [0, 1)", () => {
    const random = mulberry32(7);
    const bins = new Array(10).fill(0);
    const n = 100_000;
    for (let i = 0; i < n; i += 1) bins[Math.floor(random() * 10)] += 1;
    // Each decile should hold ~10% of the draws; 1% tolerance is ~10 sigma here.
    for (const count of bins) expect(Math.abs(count / n - 0.1)).toBeLessThan(0.01);
  });

  it("hashes string and numeric seeds to stable uint32 values", () => {
    expect(hashSeed("cluster")).toBe(hashSeed("cluster"));
    expect(hashSeed(7)).toBe(hashSeed("7"));
    expect(hashSeed("a")).toBeGreaterThanOrEqual(0);
    expect(hashSeed("a")).toBeLessThan(2 ** 32);
  });

  it("decorrelates adjacent labels through xmur3", () => {
    // Adjacent seeds fed straight to mulberry32 produce visibly similar first draws;
    // that is the failure xmur3 exists to prevent.
    const a = xmur3("1:mass");
    const b = xmur3("1:position");
    expect(Math.abs(a - b)).toBeGreaterThan(1_000_000);
  });

  it("gives each named sub-stream an independent sequence", () => {
    const mass = subStream(2026, "mass");
    const position = subStream(2026, "position");
    expect(mass()).not.toBe(position());
  });

  it("keeps a sub-stream stable when a sibling stream is added or consumed", () => {
    // The property that lets a new sampled quantity ship without invalidating a seed
    // a student wrote down.
    const before = Array.from({ length: 5 }, subStream(99, "mass"));
    const sibling = subStream(99, "velocity");
    for (let i = 0; i < 50; i += 1) sibling();
    const after = Array.from({ length: 5 }, subStream(99, "mass"));
    expect(after).toEqual(before);
  });
});
