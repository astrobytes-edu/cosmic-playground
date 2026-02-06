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

  test("round-trip: arcsec -> pc -> arcsec", () => {
    const p = 0.25;
    const d = ParallaxDistanceModel.distanceParsecFromParallaxArcsec(p);
    const pBack = ParallaxDistanceModel.parallaxArcsecFromDistanceParsec(d);
    expect(pBack).toBeCloseTo(p, 12);
  });

  test("round-trip: mas -> pc -> mas", () => {
    const pMas = 42.5;
    const d = ParallaxDistanceModel.distanceParsecFromParallaxMas(pMas);
    const pBack = ParallaxDistanceModel.parallaxMasFromDistanceParsec(d);
    expect(pBack).toBeCloseTo(pMas, 10);
  });

  test("round-trip: pc -> ly -> pc", () => {
    const dPc = 8.7;
    const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
    const dPcBack = ParallaxDistanceModel.distanceParsecFromLy(dLy);
    expect(dPcBack).toBeCloseTo(dPc, 10);
  });

  test("inverse functions return Infinity for non-positive input", () => {
    expect(ParallaxDistanceModel.parallaxArcsecFromDistanceParsec(0)).toBe(Infinity);
    expect(ParallaxDistanceModel.parallaxArcsecFromDistanceParsec(-5)).toBe(Infinity);
    expect(ParallaxDistanceModel.parallaxMasFromDistanceParsec(0)).toBe(Infinity);
    expect(ParallaxDistanceModel.parallaxMasFromDistanceParsec(-1)).toBe(Infinity);
  });

  test("negative parallax returns Infinity distance", () => {
    expect(ParallaxDistanceModel.distanceParsecFromParallaxArcsec(-0.1)).toBe(Infinity);
    expect(ParallaxDistanceModel.distanceParsecFromParallaxMas(-50)).toBe(Infinity);
  });

  test("known star: Proxima Centauri (p=768.5 mas -> d~1.30 pc)", () => {
    const d = ParallaxDistanceModel.distanceParsecFromParallaxMas(768.5);
    expect(d).toBeCloseTo(1.301, 2);
  });
});

