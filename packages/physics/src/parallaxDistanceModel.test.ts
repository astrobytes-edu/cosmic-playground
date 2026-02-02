import { describe, expect, test } from "vitest";

import { ParallaxDistanceModel } from "./parallaxDistanceModel";

describe("ParallaxDistanceModel", () => {
  test("parsec definition: d(pc)=1/p(arcsec)", () => {
    expect(ParallaxDistanceModel.distanceParsecFromParallaxArcsec(1)).toBeCloseTo(1, 12);
    expect(ParallaxDistanceModel.distanceParsecFromParallaxArcsec(0.1)).toBeCloseTo(10, 12);
    expect(ParallaxDistanceModel.distanceParsecFromParallaxArcsec(0.01)).toBeCloseTo(100, 12);
  });

  test("mas convenience: d(pc)=1000/p(mas)", () => {
    expect(ParallaxDistanceModel.distanceParsecFromParallaxMas(1000)).toBeCloseTo(1, 12);
    expect(ParallaxDistanceModel.distanceParsecFromParallaxMas(100)).toBeCloseTo(10, 12);
    expect(ParallaxDistanceModel.distanceParsecFromParallaxMas(10)).toBeCloseTo(100, 12);
  });

  test("limiting behavior: p → 0 implies d → ∞", () => {
    expect(ParallaxDistanceModel.distanceParsecFromParallaxArcsec(0)).toBe(Infinity);
    expect(ParallaxDistanceModel.distanceParsecFromParallaxMas(0)).toBe(Infinity);
  });

  test("unit conversion: pc ↔ ly", () => {
    expect(ParallaxDistanceModel.distanceLyFromParsec(1)).toBeCloseTo(3.26156, 5);
    expect(ParallaxDistanceModel.distanceParsecFromLy(3.26156)).toBeCloseTo(1, 5);
  });
});

