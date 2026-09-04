import { describe, expect, it } from "vitest";
import {
  AGE_MAX_MYR,
  AGE_MIN_MYR,
  LSUN_SYMBOL,
  MSUN_SYMBOL,
  SLIDER_STEPS,
  STAR_COUNT_MAX,
  STAR_COUNT_MIN,
  ageMyrToSlider,
  axisFontPx,
  buildLogMassBins,
  censusAnnouncement,
  clamp,
  countIntoBins,
  expectedCounts,
  fehToSlider,
  formatAge,
  formatCount,
  formatLogLuminosity,
  formatMassMsun,
  formatRadiusPc,
  formatStellarRadius,
  logClusterMassToSlider,
  massToDotRadiusPx,
  pickNearest,
  powerOfTenLabel,
  projectToPixels,
  radiusEnclosingFractionPc,
  rgbToCss,
  sliderToAgeMyr,
  sliderToFeH,
  sliderToLogClusterMass,
  sliderToStarCount,
  slopeVerdict,
  starCountToSlider,
  temperatureTickLabel,
  temperatureToRgb,
  toSuperscript,
  turnoffMassMsun
} from "./logic";
import type { CensusStar } from "./logic";

describe("slider mappings", () => {
  it("maps the star-count slider across its full range", () => {
    expect(sliderToStarCount(0)).toBe(STAR_COUNT_MIN);
    expect(sliderToStarCount(SLIDER_STEPS)).toBe(STAR_COUNT_MAX);
  });

  it("round-trips star counts", () => {
    for (const count of [50, 120, 500, 2000, 8000, 20_000]) {
      expect(sliderToStarCount(starCountToSlider(count)) / count).toBeCloseTo(1, 1);
    }
  });

  it("is monotonic in star count", () => {
    let previous = 0;
    for (let s = 0; s <= SLIDER_STEPS; s += 25) {
      const count = sliderToStarCount(s);
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
  });

  it("clamps star-count sliders outside the range", () => {
    expect(sliderToStarCount(-100)).toBe(STAR_COUNT_MIN);
    expect(sliderToStarCount(5000)).toBe(STAR_COUNT_MAX);
  });

  it("reserves the first age step for a cluster that has not aged", () => {
    // A log mapping cannot reach zero, and zero is a setting a user wants.
    expect(sliderToAgeMyr(0)).toBe(0);
    expect(sliderToAgeMyr(1)).toBeGreaterThan(0);
    expect(ageMyrToSlider(0)).toBe(0);
  });

  it("maps the age slider across its full range", () => {
    expect(sliderToAgeMyr(1)).toBeGreaterThanOrEqual(AGE_MIN_MYR);
    expect(sliderToAgeMyr(SLIDER_STEPS)).toBeCloseTo(AGE_MAX_MYR, 6);
  });

  it("round-trips ages", () => {
    for (const age of [1, 10, 100, 1000, 13_000]) {
      expect(sliderToAgeMyr(ageMyrToSlider(age)) / age).toBeCloseTo(1, 1);
    }
  });

  it("clamps", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe("log mass bins", () => {
  it("spans exactly the requested range", () => {
    const { edgesMsun } = buildLogMassBins(0.08, 150, 24);
    expect(edgesMsun).toHaveLength(25);
    expect(edgesMsun[0]).toBeCloseTo(0.08, 12);
    expect(edgesMsun[24]).toBeCloseTo(150, 10);
  });

  it("spaces edges geometrically, so a power law plots straight", () => {
    const { edgesMsun } = buildLogMassBins(0.1, 100, 6);
    const ratios: number[] = [];
    for (let i = 1; i < edgesMsun.length; i += 1) ratios.push(edgesMsun[i] / edgesMsun[i - 1]);
    for (const ratio of ratios) expect(ratio).toBeCloseTo(ratios[0], 12);
  });

  it("puts each centre at the geometric mean of its edges", () => {
    const { edgesMsun, centresMsun } = buildLogMassBins(0.1, 100, 5);
    expect(centresMsun).toHaveLength(5);
    for (let i = 0; i < centresMsun.length; i += 1) {
      expect(centresMsun[i]).toBeCloseTo(Math.sqrt(edgesMsun[i] * edgesMsun[i + 1]), 12);
    }
  });
});

describe("binning", () => {
  const { edgesMsun } = buildLogMassBins(1, 1000, 3); // edges at 1, 10, 100, 1000

  it("counts into the right bins", () => {
    expect(countIntoBins([2, 5, 20, 200, 900], edgesMsun)).toEqual([2, 1, 2]);
  });

  it("counts a value on the upper limit rather than dropping it", () => {
    expect(countIntoBins([1000], edgesMsun)).toEqual([0, 0, 1]);
  });

  it("puts a value on an internal edge in the upper bin", () => {
    expect(countIntoBins([10], edgesMsun)).toEqual([0, 1, 0]);
  });

  it("ignores values outside the range", () => {
    expect(countIntoBins([0.5, 5000], edgesMsun)).toEqual([0, 0, 0]);
  });

  it("conserves the total for in-range values", () => {
    const masses = Array.from({ length: 500 }, (_, i) => 1 + (i * 999) / 499);
    const counts = countIntoBins(masses, edgesMsun);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(masses.length);
  });

  it("handles an empty edge list", () => {
    expect(countIntoBins([1, 2], [])).toEqual([]);
  });
});

describe("expected counts", () => {
  it("scales an analytic fraction to the sample size", () => {
    const edges = [1, 2, 4];
    const counts = expectedCounts(edges, 1000, (lo, hi) => (hi - lo) / 3);
    expect(counts).toEqual([1000 / 3, 2000 / 3]);
  });

  it("sums to the sample size when the fractions cover everything", () => {
    const { edgesMsun } = buildLogMassBins(0.08, 150, 20);
    const total = 5000;
    const uniformFraction = (lo: number, hi: number) =>
      (Math.log(hi) - Math.log(lo)) / (Math.log(150) - Math.log(0.08));
    const counts = expectedCounts(edgesMsun, total, uniformFraction);
    expect(counts.reduce((a, b) => a + b, 0)).toBeCloseTo(total, 6);
  });
});

describe("derived cluster quantities", () => {
  const star = (massMsun: number, phase: string, radiusPc = 1): CensusStar => ({
    massMsun,
    phase,
    radiusPc,
    temperatureK: 5000,
    luminosityLsun: 1,
    positionPc: { x: 0, y: 0, z: 0 }
  });

  it("finds the heaviest star still on the main sequence", () => {
    const stars = [
      star(0.5, "main-sequence"),
      star(3, "main-sequence"),
      star(40, "remnant"),
      star(0.09, "outside-model-range")
    ];
    expect(turnoffMassMsun(stars)).toBe(3);
  });

  it("returns null rather than zero when nothing is left shining", () => {
    // Zero would plot as a real turnoff at the bottom of the mass axis.
    expect(turnoffMassMsun([star(40, "remnant")])).toBeNull();
    expect(turnoffMassMsun([])).toBeNull();
  });

  it("ignores out-of-domain stars when finding the turnoff", () => {
    expect(turnoffMassMsun([star(120, "outside-model-range"), star(2, "main-sequence")])).toBe(2);
  });

  it("finds the radius enclosing a fraction of the stars", () => {
    const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => star(1, "main-sequence", r));
    expect(radiusEnclosingFractionPc(stars, 0.5)).toBe(6);
    expect(radiusEnclosingFractionPc(stars, 0)).toBe(1);
    expect(radiusEnclosingFractionPc(stars, 1)).toBe(10);
  });

  it("returns zero radius for an empty cluster", () => {
    expect(radiusEnclosingFractionPc([], 0.5)).toBe(0);
  });
});

describe("temperature colours", () => {
  it("makes hot stars blue and cool stars red", () => {
    const hot = temperatureToRgb(30000);
    const cool = temperatureToRgb(3000);
    expect(hot[2]).toBeGreaterThan(hot[0]);
    expect(cool[0]).toBeGreaterThan(cool[2]);
  });

  it("keeps every channel inside the byte range", () => {
    for (let t = 500; t <= 60000; t += 250) {
      for (const channel of temperatureToRgb(t)) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
        expect(Number.isInteger(channel)).toBe(true);
      }
    }
  });

  it("saturates outside the fitted range instead of producing nonsense", () => {
    expect(temperatureToRgb(0)).toEqual(temperatureToRgb(1000));
    expect(temperatureToRgb(1e9)).toEqual(temperatureToRgb(40000));
  });

  it("renders CSS colours with and without alpha", () => {
    expect(rgbToCss([1, 2, 3])).toBe("rgb(1, 2, 3)");
    expect(rgbToCss([1, 2, 3], 0.5)).toBe("rgba(1, 2, 3, 0.5)");
  });
});

describe("plot helpers", () => {
  it("grows the dot radius sub-linearly with mass", () => {
    // A 100 Msun star is about 1000x a 0.1 Msun star in mass but must not be 1000x the
    // dot, or one star owns the frame.
    const small = massToDotRadiusPx(0.1);
    const large = massToDotRadiusPx(100);
    expect(large).toBeGreaterThan(small);
    expect(large / small).toBeLessThan(10);
  });

  it("keeps the dot visible for the smallest stars", () => {
    expect(massToDotRadiusPx(0.08)).toBeGreaterThan(1);
  });

  it("projects values onto a pixel axis", () => {
    expect(projectToPixels(0, { min: 0, max: 10 }, 100, 200)).toBe(100);
    expect(projectToPixels(10, { min: 0, max: 10 }, 100, 200)).toBe(200);
    expect(projectToPixels(5, { min: 0, max: 10 }, 100, 200)).toBe(150);
  });

  it("inverts for axes that run the other way, as the HR temperature axis does", () => {
    expect(projectToPixels(0, { min: 0, max: 10 }, 100, 200, true)).toBe(200);
    expect(projectToPixels(10, { min: 0, max: 10 }, 100, 200, true)).toBe(100);
  });

  it("clamps out-of-range values to the axis ends", () => {
    expect(projectToPixels(-5, { min: 0, max: 10 }, 100, 200)).toBe(100);
    expect(projectToPixels(50, { min: 0, max: 10 }, 100, 200)).toBe(200);
  });

  it("does not divide by zero on a degenerate axis", () => {
    expect(Number.isFinite(projectToPixels(1, { min: 5, max: 5 }, 0, 100))).toBe(true);
  });
});

describe("formatting", () => {
  it("shows mass with a precision that suits its size", () => {
    expect(formatMassMsun(0.085)).toBe("0.09");
    expect(formatMassMsun(1.234)).toBe("1.23");
    expect(formatMassMsun(12.34)).toBe("12.3");
    expect(formatMassMsun(123.4)).toBe("123");
  });

  it("marks a non-finite mass rather than printing a number", () => {
    expect(formatMassMsun(Number.NaN)).toBe("--");
    expect(formatMassMsun(Number.POSITIVE_INFINITY)).toBe("--");
  });

  it("groups large counts", () => {
    expect(formatCount(20000)).toBe("20,000");
    expect(formatCount(7)).toBe("7");
  });

  it("switches age units instead of growing the number", () => {
    expect(formatAge(0)).toEqual({ value: "0", unit: "Myr" });
    expect(formatAge(3.4)).toEqual({ value: "3.4", unit: "Myr" });
    expect(formatAge(250)).toEqual({ value: "250", unit: "Myr" });
    expect(formatAge(12_000)).toEqual({ value: "12.0", unit: "Gyr" });
  });

  it("marks a non-finite age", () => {
    expect(formatAge(Number.NaN).value).toBe("--");
    expect(formatAge(-1).value).toBe("--");
  });

  it("formats radii", () => {
    expect(formatRadiusPc(1.234)).toBe("1.23");
    expect(formatRadiusPc(12.34)).toBe("12.3");
    expect(formatRadiusPc(Number.NaN)).toBe("--");
  });
});

describe("census announcement", () => {
  it("carries the numbers the picture is showing", () => {
    const text = censusAnnouncement({
      starCount: 2000,
      law: "maschberger",
      ageMyr: 100,
      mostMassiveMsun: 34.2,
      turnoffMsun: 5.1,
      remnantCount: 3,
      giantCount: 2
    });
    expect(text).toContain("2,000 stars");
    expect(text).toContain("Maschberger");
    expect(text).toContain("100 Myr");
    expect(text).toContain("34.2");
    expect(text).toContain("turnoff at 5.10");
    expect(text).toContain("3 remnants");
    expect(text).toContain("2 giants");
  });

  it("does not report a turnoff before any star has left the main sequence", () => {
    const text = censusAnnouncement({
      starCount: 800,
      law: "maschberger",
      ageMyr: 0,
      mostMassiveMsun: 17.8,
      turnoffMsun: 17.8,
      remnantCount: 0,
      giantCount: 0
    });
    // The old wording reported "turnoff at 17.8" at age zero, which is just the heaviest
    // star restated -- two readouts agreeing for no reason a student could learn from.
    expect(text).toContain("no star has left the main sequence yet");
    expect(text).not.toContain("turnoff at");
  });

  it("names the law that is actually selected", () => {
    const text = censusAnnouncement({
      starCount: 10,
      law: "kroupa",
      ageMyr: 0,
      mostMassiveMsun: 1,
      turnoffMsun: 1,
      remnantCount: 0,
      giantCount: 0
    });
    expect(text).toContain("Kroupa");
  });

  it("says so in words when nothing is left on the main sequence", () => {
    const text = censusAnnouncement({
      starCount: 10,
      law: "kroupa",
      ageMyr: 13_000,
      mostMassiveMsun: 40,
      turnoffMsun: null,
      remnantCount: 10,
      giantCount: 0
    });
    expect(text).toContain("no stars remain on the main sequence");
    expect(text).not.toContain("turnoff at");
  });
});

describe("canvas typography", () => {
  it("renders exponents as superscripts, including negatives", () => {
    expect(toSuperscript(0)).toBe("\u2070");
    expect(toSuperscript(6)).toBe("\u2076");
    expect(toSuperscript(-4)).toBe("\u207b\u2074");
    expect(toSuperscript(12)).toBe("\u00b9\u00b2");
  });

  it("builds decade labels without a caret", () => {
    expect(powerOfTenLabel(3)).toBe("10\u00b3");
    expect(powerOfTenLabel(-2)).toBe("10\u207b\u00b2");
    // The caret form is what this replaced; it should not survive anywhere.
    expect(powerOfTenLabel(3)).not.toContain("^");
  });

  it("uses the solar symbol rather than an ASCII stand-in", () => {
    expect(MSUN_SYMBOL).toBe("M\u2609");
    expect(LSUN_SYMBOL).toBe("L\u2609");
  });

  it("never prints the same temperature tick twice in a row", () => {
    // 2500 and 3000 both rounded to "3k" before this, which is worse than no label.
    expect(temperatureTickLabel(3000)).toBe("3k");
    expect(temperatureTickLabel(2500)).toBe("2.5k");
    expect(temperatureTickLabel(3000)).not.toBe(temperatureTickLabel(2500));
    expect(temperatureTickLabel(40000)).toBe("40k");
    expect(temperatureTickLabel(900)).toBe("900");
  });

  it("scales the axis font with the panel and clamps at both ends", () => {
    expect(axisFontPx(300)).toBe(11);
    expect(axisFontPx(5000)).toBe(16);
    expect(axisFontPx(630)).toBeGreaterThan(axisFontPx(300));
  });
});

describe("star inspector formatting", () => {
  it("reports luminosity as a log and refuses to log a dark star", () => {
    expect(formatLogLuminosity(1)).toBe("0.00");
    expect(formatLogLuminosity(1000)).toBe("3.00");
    expect(formatLogLuminosity(0)).toBe("--");
  });

  it("drops precision as the radius grows, and reports nothing for a remnant", () => {
    expect(formatStellarRadius(1.234)).toBe("1.23");
    // Not 63.55: that is stored as 63.5499... so toFixed(1) rounds it DOWN, and an
    // expectation written from decimal intuition would fail for the wrong reason.
    expect(formatStellarRadius(63.57)).toBe("63.6");
    expect(formatStellarRadius(155.4)).toBe("155");
    expect(formatStellarRadius(0)).toBe("--");
  });
});

describe("picking", () => {
  const candidates = [
    { id: 1, x: 100, y: 100, radiusPx: 3 },
    { id: 2, x: 140, y: 100, radiusPx: 12 },
    { id: 3, x: 143, y: 100, radiusPx: 2 }
  ];

  it("returns nothing when the pointer is over empty sky", () => {
    expect(pickNearest(candidates, 400, 400)).toBeNull();
  });

  it("returns the star under the pointer", () => {
    expect(pickNearest(candidates, 100, 101)).toBe(1);
  });

  it("prefers the small star sitting inside a big one's halo", () => {
    // A massive star's drawn disc can cover a dozen dwarfs. Always returning the big one
    // makes every faint star in the crowded centre unselectable.
    expect(pickNearest(candidates, 143, 100)).toBe(3);
    // ...but pointing at the big star's own disc, away from the dwarf, still gets it.
    expect(pickNearest(candidates, 134, 100)).toBe(2);
  });

  it("still finds a star a few pixels off, so a 2px dot is not impossible to hit", () => {
    expect(pickNearest(candidates, 105, 100)).toBe(1);
    expect(pickNearest(candidates, 100, 112)).toBeNull();
  });

  it("has no opinion when there is nothing drawn", () => {
    expect(pickNearest([], 10, 10)).toBeNull();
  });
});

describe("derived high-mass slope controls", () => {
  it("round-trips the metallicity slider", () => {
    for (const feH of [-2, -0.75, 0, 0.5]) {
      expect(sliderToFeH(fehToSlider(feH))).toBeCloseTo(feH, 10);
    }
  });

  it("round-trips the cluster-mass slider", () => {
    for (const logMass of [2, 3.5, 4, 6]) {
      expect(sliderToLogClusterMass(logClusterMassToSlider(logMass))).toBeCloseTo(logMass, 10);
    }
  });

  it("says nothing special when the slope is canonical", () => {
    expect(slopeVerdict(2.3, 2.3)).toMatch(/nothing special/i);
  });

  it("escalates its wording as the slope flattens", () => {
    // The number alone is not enough: a reader who has never met a mass-function slope
    // cannot tell whether 1.74 is a big change or a rounding difference.
    expect(slopeVerdict(2.1, 2.3)).toMatch(/slightly top-heavy/i);
    expect(slopeVerdict(1.74, 2.3)).toMatch(/^top-heavy/i);
    expect(slopeVerdict(0.9, 2.3)).toMatch(/^top-heavy/i);
  });
});
