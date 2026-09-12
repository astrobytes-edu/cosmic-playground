import { describe, it, expect } from "vitest";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatOrbitType,
  toSvg,
  buildPathD,
  viewRadiusAu,
  pickArrowDtDays,
  arrowLengthPx,
  arrowScale,
  formatSpeedFactor,
  formatSpecificEnergy,
  formatEccentricity,
  formatPeriapsis,
  orbitAnnouncement,
  animationTimeScaleYrPerSec,
  formatTimeScale,
  DEFAULT_SIM_YEARS_PER_SEC,
  MIN_ON_SCREEN_ORBIT_SEC,
  leftViewMessage,
  captionTimeLine,
  trailSegments,
  energyBarLayout,
  effectivePotentialPlot,
  turningPointsText,
  potentialEnergyWindow,
  potentialProfile,
} from "./logic";

describe("Conservation Laws -- UI Logic", () => {
  // -----------------------------------------------------------------------
  // clamp
  // -----------------------------------------------------------------------
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max", () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });
    it("handles min === max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // logSliderToValue / valueToLogSlider
  // -----------------------------------------------------------------------
  describe("logSliderToValue", () => {
    it("slider 0 maps to 10^0 = 1", () => {
      expect(logSliderToValue(0)).toBe(1);
    });
    it("slider 1 maps to 10", () => {
      expect(logSliderToValue(1)).toBeCloseTo(10, 8);
    });
    it("slider -1 maps to 0.1", () => {
      expect(logSliderToValue(-1)).toBeCloseTo(0.1, 8);
    });
    it("slider 0.5 maps to sqrt(10)", () => {
      expect(logSliderToValue(0.5)).toBeCloseTo(Math.sqrt(10), 8);
    });
  });

  describe("valueToLogSlider", () => {
    it("value 1 maps to slider 0", () => {
      expect(valueToLogSlider(1)).toBe(0);
    });
    it("value 10 maps to slider 1", () => {
      expect(valueToLogSlider(10)).toBeCloseTo(1, 8);
    });
    it("value 0.1 maps to slider -1", () => {
      expect(valueToLogSlider(0.1)).toBeCloseTo(-1, 8);
    });
    it("returns 0 for zero", () => {
      expect(valueToLogSlider(0)).toBe(0);
    });
    it("returns 0 for negative", () => {
      expect(valueToLogSlider(-5)).toBe(0);
    });
    it("returns 0 for NaN", () => {
      expect(valueToLogSlider(NaN)).toBe(0);
    });
  });

  describe("logSliderToValue / valueToLogSlider round-trip", () => {
    it("round-trips for typical values", () => {
      for (const v of [0.1, 0.5, 1, 2.5, 5, 10]) {
        const slider = valueToLogSlider(v);
        const back = logSliderToValue(slider);
        expect(back).toBeCloseTo(v, 6);
      }
    });
  });

  // -----------------------------------------------------------------------
  // formatNumber
  // -----------------------------------------------------------------------
  describe("formatNumber", () => {
    it("formats normal numbers with fixed digits", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });
    it("writes large numbers out in full, never e-notation", () => {
      expect(formatNumber(1.5e8, 3)).toBe("150000000.000");
    });
    it("keeps `digits` significant figures for small numbers, as decimals", () => {
      expect(formatNumber(0.00012, 3)).toBe("0.000120");
      expect(formatNumber(3.8e-8, 3)).toBe("0.0000000380");
    });
    it("never uses e-notation for values the readouts can reach", () => {
      for (const v of [1e-12, 3.3e-7, 5.476e-4, 1.631e7, -1.632e7]) {
        expect(formatNumber(v, 3)).not.toMatch(/e[+-]/);
      }
    });
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatNumber(Infinity)).toBe("\u2014");
    });
    it("returns em-dash for -Infinity", () => {
      expect(formatNumber(-Infinity)).toBe("\u2014");
    });
    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });
    it("handles negative numbers", () => {
      expect(formatNumber(-2.5, 2)).toBe("-2.50");
    });
    it("handles negative very large", () => {
      expect(formatNumber(-1e7, 3)).toBe("-10000000.000");
    });
    it("uses digits default of 3", () => {
      expect(formatNumber(1.23456)).toBe("1.235");
    });
    it("digits=0 gives no decimal places for a large number", () => {
      expect(formatNumber(1e8, 0)).toBe("100000000");
    });
  });

  // -----------------------------------------------------------------------
  // formatOrbitType
  // -----------------------------------------------------------------------
  describe("formatOrbitType", () => {
    it("circular -> 'circular'", () => {
      expect(formatOrbitType("circular")).toBe("circular");
    });
    it("elliptical -> 'elliptical'", () => {
      expect(formatOrbitType("elliptical")).toBe("elliptical");
    });
    it("parabolic -> 'parabolic (escape)'", () => {
      expect(formatOrbitType("parabolic")).toBe("parabolic (escape)");
    });
    it("hyperbolic -> 'hyperbolic'", () => {
      expect(formatOrbitType("hyperbolic")).toBe("hyperbolic");
    });
    it("unknown -> 'invalid'", () => {
      expect(formatOrbitType("foo")).toBe("invalid");
      expect(formatOrbitType("")).toBe("invalid");
    });
    it("radial -> 'radial', short enough not to wrap its readout card (V2)", () => {
      expect(formatOrbitType("radial")).toBe("radial");
    });
  });

  // -----------------------------------------------------------------------
  // toSvg
  // -----------------------------------------------------------------------
  describe("toSvg", () => {
    const center = { x: 300, y: 300 };

    it("origin maps to center", () => {
      const p = toSvg(0, 0, center, 100);
      expect(p.x).toBe(300);
      expect(p.y).toBe(300);
    });
    it("positive x moves right", () => {
      const p = toSvg(1, 0, center, 100);
      expect(p.x).toBe(400);
      expect(p.y).toBe(300);
    });
    it("positive y moves up (SVG y-down)", () => {
      const p = toSvg(0, 1, center, 100);
      expect(p.x).toBe(300);
      expect(p.y).toBe(200);
    });
    it("negative coordinates work correctly", () => {
      const p = toSvg(-2, -1, center, 50);
      expect(p.x).toBe(200); // 300 + (-2)*50
      expect(p.y).toBe(350); // 300 - (-1)*50
    });
  });

  // -----------------------------------------------------------------------
  // buildPathD
  // -----------------------------------------------------------------------
  describe("buildPathD", () => {
    const center = { x: 300, y: 300 };

    it("returns empty string for no points", () => {
      expect(buildPathD([], center, 100)).toBe("");
    });
    it("single point gives M command", () => {
      const d = buildPathD([{ xAu: 0, yAu: 0 }], center, 100);
      expect(d).toBe("M 300.00 300.00");
    });
    it("two points give M + L command", () => {
      const d = buildPathD(
        [{ xAu: 0, yAu: 0 }, { xAu: 1, yAu: 0 }],
        center,
        100,
      );
      expect(d).toBe("M 300.00 300.00 L 400.00 300.00");
    });
    it("builds path with correct y-flip", () => {
      const d = buildPathD(
        [{ xAu: 0, yAu: 0 }, { xAu: 0, yAu: 1 }],
        center,
        100,
      );
      // y=1 AU -> SVG y = 300 - 100 = 200
      expect(d).toBe("M 300.00 300.00 L 300.00 200.00");
    });
  });

  // -----------------------------------------------------------------------
  // viewRadiusAu
  // -----------------------------------------------------------------------
  describe("viewRadiusAu", () => {
    it("fits a small closed orbit with the 1.5 r0 floor", () => {
      expect(viewRadiusAu({ raAu: 1, r0Au: 1 })).toBe(1.5);
    });

    it("floors the window at 1.5 r0, not 1.5 AU, so a small orbit is not drawn inside the Sun (P6)", () => {
      expect(viewRadiusAu({ raAu: 0.1, r0Au: 0.1 })).toBeCloseTo(0.15, 12);
      expect(viewRadiusAu({ raAu: 10, r0Au: 10 })).toBeCloseTo(15, 12);
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 10 })).toBe(50);
    });

    it("puts a circular orbit's start point 250/1.5 = 166.67 px from centre at every r0 (P6)", () => {
      for (const r0Au of [0.1, 10 ** -0.5, 1, 10 ** 0.5, 10]) {
        expect((r0Au * 250) / viewRadiusAu({ raAu: r0Au, r0Au })).toBeCloseTo(250 / 1.5, 6);
      }
    });

    it("is continuous across escape: 1.40 (bound, ra = 49 AU) and 1.42 (open) share one window", () => {
      expect(viewRadiusAu({ raAu: 49, r0Au: 1 })).toBe(6);
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 1 })).toBe(6);
    });

    it("keeps the start point well clear of the 10 px Sun near escape", () => {
      expect((1 * 250) / viewRadiusAu({ raAu: 49, r0Au: 1 })).toBeGreaterThan(41);
    });

    it("fits a moderately eccentric orbit with a 10% margin", () => {
      expect(viewRadiusAu({ raAu: 3.381308, r0Au: 1 })).toBeCloseTo(3.719438, 5);
    });

    it("caps at 50 AU and floors at 1.5 r0", () => {
      expect(viewRadiusAu({ raAu: Number.POSITIVE_INFINITY, r0Au: 10 })).toBe(50);
      // Was 1.5 under the old 1.5 AU floor; the floor is now 1.5 r0 = 1.5 x 10^-0.3 AU.
      expect(viewRadiusAu({ raAu: 0.642859, r0Au: 10 ** -0.3 })).toBeCloseTo(0.751781, 5);
    });
  });

  // -----------------------------------------------------------------------
  // arrow time step and length
  // -----------------------------------------------------------------------
  describe("arrow time step and length", () => {
    const s15 = 250 / 1.5;
    const s6 = 250 / 6;

    it("default circular orbit: 20 days, 57.3 px", () => {
      expect(pickArrowDtDays(2 * Math.PI, s15)).toBe(20);
      expect(arrowLengthPx(2 * Math.PI, 20, s15)).toBeCloseTo(57.341, 3);
    });

    it("is exactly proportional to speed: periapsis / apoapsis = (1 + e)/(1 - e), no clamp", () => {
      const dt = pickArrowDtDays(12.042772, s15)!;
      expect(dt).toBe(20);
      const apo = arrowLengthPx(0.75 * 2 * Math.PI, dt, s15);
      const peri = arrowLengthPx(12.042772, dt, s15);
      expect(apo).toBeCloseTo(43.006, 3);
      expect(peri).toBeCloseTo(109.904, 3);
      expect(peri / apo).toBeCloseTo(1.4375 / 0.5625, 5);
    });

    it("ten solar masses: per-day length is sqrt(10) times longer", () => {
      const dt10 = pickArrowDtDays(19.869177, s15)!;
      expect(dt10).toBe(10);
      const perDay1 = arrowLengthPx(2 * Math.PI, 20, s15) / 20;
      const perDay10 = arrowLengthPx(19.869177, dt10, s15) / dt10;
      expect(perDay10 / perDay1).toBeCloseTo(Math.sqrt(10), 5);
    });

    it("escape, hyperbolic and slow zoomed-out orbits", () => {
      expect(pickArrowDtDays(8.885766, s6)).toBe(100);
      expect(pickArrowDtDays(11.309734, s6)).toBe(50);
      expect(pickArrowDtDays(3.576452, 5)).toBe(2000);
    });

    it("returns null when nothing moves", () => {
      expect(pickArrowDtDays(0, s15)).toBeNull();
    });

    it("never exceeds 120 px at the fastest point unless even one day would", () => {
      for (const v of [0.5, 3, 12, 40, 150]) {
        const dt = pickArrowDtDays(v, s15)!;
        if (dt > 1) expect(arrowLengthPx(v, dt, s15)).toBeLessThanOrEqual(120);
      }
    });

    it("caps the fastest arrow at 120 px, not to scale, when even one day overflows (L2)", () => {
      // M = 10, r0 = 0.1 AU, speed factor 0.1: periapsis speed 1250 AU/yr; at this 1.5 AU scale one day is 570 px.
      const s = arrowScale(1250, s15);
      expect(s.toScale).toBe(false);
      expect(s.dtDays).toBeNull();
      expect(1250 * s.pxPerAuYr).toBeCloseTo(120, 10);
    });

    it("stays to scale with the round step whenever that step fits", () => {
      const s = arrowScale(2 * Math.PI, s15);
      expect(s.dtDays).toBe(20);
      expect(s.toScale).toBe(true);
      expect(2 * Math.PI * s.pxPerAuYr).toBeCloseTo(57.341, 3);
    });

    it("draws no arrow when nothing moves", () => {
      const s = arrowScale(0, 100);
      expect(s.dtDays).toBeNull();
      expect(s.pxPerAuYr).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // formatSpeedFactor
  // -----------------------------------------------------------------------
  describe("formatSpeedFactor", () => {
    it("shows three decimals so the exact escape preset reads differently from the slider's 1.41", () => {
      expect(formatSpeedFactor(Math.SQRT2)).toBe("1.414");
      expect(formatSpeedFactor(1.41)).toBe("1.410");
      expect(formatSpeedFactor(1)).toBe("1.000");
      expect(formatSpeedFactor(0)).toBe("0");
    });
  });

  // -----------------------------------------------------------------------
  // formatSpecificEnergy
  // -----------------------------------------------------------------------
  describe("formatSpecificEnergy", () => {
    it("shows round-off at exact escape as 0, never e-notation", () => {
      expect(formatSpecificEnergy(3.5e-15, 39.478418)).toBe("0");
      expect(formatSpecificEnergy(-1.4e-14, 197.860789)).toBe("0");
    });

    it("formats ordinary energies to four decimals", () => {
      expect(formatSpecificEnergy(-28.375113, 39.478418)).toBe("-28.3751");
      expect(formatSpecificEnergy(-0.2349, 39.478418)).toBe("-0.2349");
    });
  });

  // -----------------------------------------------------------------------
  // formatEccentricity / formatPeriapsis
  // -----------------------------------------------------------------------
  describe("formatEccentricity and formatPeriapsis", () => {
    it("shows a circular orbit's round-off eccentricity as 0", () => {
      expect(formatEccentricity("circular", 1.11e-16, 3)).toBe("0");
      expect(formatEccentricity("circular", 1.11e-16, 6)).toBe("0");
    });

    it("shows an em dash for radial or invalid motion, which has no conic", () => {
      expect(formatEccentricity("radial", 1, 6)).toBe("—");
      expect(formatPeriapsis("radial", 0, 6)).toBe("—");
      expect(formatEccentricity("invalid", NaN, 3)).toBe("—");
      expect(formatPeriapsis("invalid", NaN, 3)).toBe("—");
    });

    it("formats an elliptical orbit's e and r_p to the requested digits", () => {
      expect(formatEccentricity("elliptical", 0.4375, 3)).toBe("0.438");
      expect(formatEccentricity("elliptical", 0.4375, 6)).toBe("0.437500");
      expect(formatPeriapsis("elliptical", 0.391304, 3)).toBe("0.391");
    });
  });

  // -----------------------------------------------------------------------
  // orbitAnnouncement
  // -----------------------------------------------------------------------
  describe("orbitAnnouncement", () => {
    it("says bound, at escape or unbound in words", () => {
      expect(orbitAnnouncement({ orbitType: "circular", ecc: 0, epsAu2Yr2: -19.7 })).toBe("Circular orbit: bound, eccentricity 0.");
      expect(orbitAnnouncement({ orbitType: "elliptical", ecc: 0.4375, epsAu2Yr2: -28.4 })).toBe("Elliptical orbit: bound, eccentricity 0.438.");
      expect(orbitAnnouncement({ orbitType: "parabolic", ecc: 1, epsAu2Yr2: 0 })).toBe("Parabolic orbit: exactly at escape, specific energy 0.");
      expect(orbitAnnouncement({ orbitType: "hyperbolic", ecc: 2.24, epsAu2Yr2: 24.5 })).toBe("Hyperbolic orbit: unbound, eccentricity 2.240.");
      expect(orbitAnnouncement({ orbitType: "radial", ecc: 1, epsAu2Yr2: -39.5 })).toBe("Radial motion: with no sideways speed the body falls straight in.");
      expect(orbitAnnouncement({ orbitType: "radial", ecc: 1, epsAu2Yr2: 5 })).toBe("Radial motion: the body moves straight out and escapes.");
      expect(orbitAnnouncement({ orbitType: "invalid", ecc: NaN, epsAu2Yr2: NaN })).toBe("No valid orbit for these settings.");
    });
  });

  // -----------------------------------------------------------------------
  // animation time scale and its caption
  // -----------------------------------------------------------------------
  describe("animationTimeScaleYrPerSec", () => {
    it("keeps 1/3 yr per s for an orbit lasting at least 1.5 s on screen (1 yr takes 3 s)", () => {
      expect(DEFAULT_SIM_YEARS_PER_SEC).toBe(1 / 3);
      expect(MIN_ON_SCREEN_ORBIT_SEC).toBe(1.5);
      expect(animationTimeScaleYrPerSec(1)).toBe(1 / 3);
    });

    it("keeps 1/3 yr per s when there is no characteristic time (radial motion)", () => {
      expect(animationTimeScaleYrPerSec(NaN)).toBe(1 / 3);
      expect(animationTimeScaleYrPerSec(0)).toBe(1 / 3);
    });

    it("slows a 0.01 yr orbit (M = 10, r0 = 0.1 AU, circular) so one lap takes 1.5 s", () => {
      expect(animationTimeScaleYrPerSec(0.01)).toBeCloseTo(0.006667, 6);
    });
  });

  describe("formatTimeScale", () => {
    it("states the default scale in whole months", () => {
      expect(formatTimeScale(1 / 3)).toBe("4 months");
    });

    it("states a slowed scale in days, one decimal", () => {
      expect(formatTimeScale(0.0066667)).toBe("2.4 days");
      expect(formatTimeScale(0.05)).toBe("18.3 days");
    });

    it("states a scale under a day in hours, one decimal", () => {
      expect(formatTimeScale(0.0023747)).toBe("20.8 hours");
    });
  });

  // -----------------------------------------------------------------------
  // status and caption text that depend on reduced motion
  // -----------------------------------------------------------------------
  describe("leftViewMessage", () => {
    it("names Play normally and Step under reduced motion, where Play is disabled (M1)", () => {
      expect(leftViewMessage(false)).toBe("The body has left the view. Press Play to run it again.");
      expect(leftViewMessage(true)).toBe("The body has left the view. Press Step to run it again.");
    });
  });

  // -----------------------------------------------------------------------
  // motion trail
  // -----------------------------------------------------------------------
  describe("trailSegments", () => {
    it("draws nothing from an empty or one-entry history", () => {
      expect(trailSegments([], 1000)).toEqual([]);
      expect(trailSegments([{ tMs: 1000, nuRad: 1 }], 1000)).toEqual([]);
    });

    it("two entries give one segment at the newest opacity, 0.85", () => {
      const segs = trailSegments([{ tMs: 984, nuRad: 1.0 }, { tMs: 1000, nuRad: 1.1 }], 1000);
      expect(segs).toHaveLength(1);
      expect(segs[0].nuFromRad).toBe(1.0);
      expect(segs[0].nuToRad).toBe(1.1);
      expect(segs[0].opacity).toBeCloseTo(0.85, 12);
    });

    it("entries spread evenly across the window give six contiguous segments, opacity rising linearly 0.15 to 0.85", () => {
      // 13 entries 25 ms apart from the window edge (700 ms) to now (1000 ms): two intervals in each 50 ms bucket.
      const history = Array.from({ length: 13 }, (_, i) => ({ tMs: 700 + 25 * i, nuRad: 0.7 + 0.025 * i }));
      const segs = trailSegments(history, 1000, 300, 6);
      expect(segs).toHaveLength(6);
      for (let i = 0; i < segs.length; i++) {
        expect(segs[i].nuFromRad).toBe(history[2 * i].nuRad);
        expect(segs[i].nuToRad).toBe(history[2 * i + 2].nuRad);
        expect(segs[i].opacity).toBeCloseTo(0.15 + 0.14 * i, 12);
      }
      for (let i = 1; i < segs.length; i++) {
        expect(segs[i].opacity).toBeGreaterThan(segs[i - 1].opacity);
        expect(segs[i].nuFromRad).toBe(segs[i - 1].nuToRad);
      }
    });

    it("drops entries older than the window, keeping the newest one at or before its edge as the arc's start", () => {
      const history = [
        { tMs: 100, nuRad: 0.1 },
        { tMs: 200, nuRad: 0.2 },
        { tMs: 750, nuRad: 0.75 },
        { tMs: 850, nuRad: 0.85 },
        { tMs: 1000, nuRad: 1.0 },
      ];
      const segs = trailSegments(history, 1000);
      expect(segs.length).toBeGreaterThan(0);
      expect(segs[0].nuFromRad).toBe(0.2);
      expect(segs[segs.length - 1].nuToRad).toBe(1.0);
      expect(segs.some((s) => s.nuFromRad === 0.1 || s.nuToRad === 0.1)).toBe(false);
      // Both entries are older than the window: only the start anchor survives, and one entry draws nothing.
      expect(trailSegments([{ tMs: 100, nuRad: 0.1 }, { tMs: 200, nuRad: 0.2 }], 1000)).toEqual([]);
    });
  });

  describe("captionTimeLine", () => {
    it("states the playback scale normally, one Step's duration under reduced motion, and neither without a path (L2, V8)", () => {
      expect(captionTimeLine({ canStep: true, reducedMotion: false })).toBe("playback");
      expect(captionTimeLine({ canStep: true, reducedMotion: true })).toBe("step");
      expect(captionTimeLine({ canStep: false, reducedMotion: false })).toBe("none");
      expect(captionTimeLine({ canStep: false, reducedMotion: true })).toBe("none");
    });
  });
});

describe("energyBarLayout", () => {
  // One bound orbit seen at two points: near periapsis (K large) and far out (K small).
  const base = { epsAu2Yr2: -11.05, uDeepestAu2Yr2: -39.48, widthPx: 300 };
  // Built inside each test, not at describe scope: a throw there fails collection ("no tests"), not an assertion.
  const layouts = () => {
    const near = energyBarLayout({ ...base, kAu2Yr2: 28.43, uAu2Yr2: -39.48 });
    const far = energyBarLayout({ ...base, kAu2Yr2: 4.66, uAu2Yr2: -15.71 });
    if (!near || !far) throw new Error("expected layouts");
    return { near, far };
  };

  it("keeps the total-energy marker still while K and U trade length", () => {
    const { near, far } = layouts();
    expect(near.epsPx).toBe(far.epsPx);
    expect(near.kBar.widthPx).toBeGreaterThan(far.kBar.widthPx);
    expect(near.uBar.widthPx).toBeGreaterThan(far.uBar.widthPx);
  });

  it("ends U at zero, starts K where U ends, and ends K on the marker", () => {
    const { near, far } = layouts();
    for (const b of [near, far]) {
      expect(b.uBar.xPx + b.uBar.widthPx).toBeCloseTo(b.zeroPx, 9);
      expect(b.kBar.xPx).toBe(b.uBar.xPx);
      expect(b.kBar.xPx + b.kBar.widthPx).toBeCloseTo(b.epsPx, 9);
    }
  });

  it("puts zero and eps at known pixels: scale from 1.06 x -39.48 to 0 + 0.2 x 39.48", () => {
    const { near } = layouts();
    // lo = -41.8488, hi = 7.896, span = 49.7448
    expect(near.zeroPx).toBeCloseTo((41.8488 / 49.7448) * 300, 6);
    expect(near.epsPx).toBeCloseTo(((-11.05 + 41.8488) / 49.7448) * 300, 6);
  });

  it("fits an unbound orbit, with eps > 0 right of zero and inside the track", () => {
    const b = energyBarLayout({ kAu2Yr2: 60, uAu2Yr2: -39.48, epsAu2Yr2: 20.52, uDeepestAu2Yr2: -39.48, widthPx: 300 });
    if (!b) throw new Error("expected a layout");
    expect(b.epsPx).toBeGreaterThan(b.zeroPx);
    expect(b.epsPx).toBeLessThanOrEqual(300);
  });

  it("returns null without a finite negative deepest potential or a width", () => {
    expect(energyBarLayout({ ...base, kAu2Yr2: 1, uAu2Yr2: -1, uDeepestAu2Yr2: Number.NEGATIVE_INFINITY })).toBeNull();
    expect(energyBarLayout({ ...base, kAu2Yr2: 1, uAu2Yr2: -1, widthPx: 0 })).toBeNull();
  });
});

describe("effectivePotentialPlot", () => {
  // Toy units with a closed form: mu = 2, h = 1, so U_eff = -2/r + 1/(2 r^2), minimum -2 at r_c = 0.5.
  // eps = -1.5 gives -1.5 r^2 + 2 r - 0.5 = 0, i.e. turning points r_p = 1/3 and r_a = 1.
  const uEff = (r: number) => -2 / r + 1 / (2 * r * r);
  const args = { uEff, epsAu2Yr2: -1.5, uEffMinAu2Yr2: -2, rpAu: 1 / 3, raAu: 1, rMaxAu: 2, widthPx: 300, heightPx: 150 };
  const makePlot = () => {
    const plot = effectivePotentialPlot(args);
    if (!plot) throw new Error("expected a plot");
    return plot;
  };
  // rMin = 0.55 / 3; energy from 1.12 x -2 = -2.24 up to 0 + 0.45 x 2 = 0.9.
  const rMin = 0.55 / 3;

  it("maps r and energy to known pixels", () => {
    const plot = makePlot();
    expect(plot.rpXPx).toBeCloseTo(((1 / 3 - rMin) / (2 - rMin)) * 300, 9);
    expect(plot.raXPx ?? Number.NaN).toBeCloseTo(((1 - rMin) / (2 - rMin)) * 300, 9);
    expect(plot.zeroYPx).toBeCloseTo((0.9 / 3.14) * 150, 9);
    expect(plot.epsYPx).toBeCloseTo((2.4 / 3.14) * 150, 9);
  });

  it("puts both turning points on the energy line", () => {
    const plot = makePlot();
    expect(plot.yPx(uEff(1 / 3))).toBeCloseTo(plot.epsYPx, 6);
    expect(plot.yPx(uEff(1))).toBeCloseTo(plot.epsYPx, 6);
  });

  it("keeps the minimum inside the plot and clamps the centrifugal barrier to the top edge", () => {
    const plot = makePlot();
    expect(plot.yPx(-2)).toBeLessThan(150);
    expect(plot.yPx(uEff(rMin))).toBe(0);
  });

  it("draws the curve with samples + 1 points and closes the allowed region", () => {
    const plot = makePlot();
    expect(plot.curveD.startsWith("M 0.00 ")).toBe(true);
    expect(plot.curveD.split(" L ").length).toBe(121);
    expect(plot.allowedD.endsWith("Z")).toBe(true);
    expect(plot.curveD).not.toContain("NaN");
  });

  it("has no outer turning point for an open orbit, and the allowed region runs to the edge", () => {
    const open = effectivePotentialPlot({ ...args, epsAu2Yr2: 0.5, raAu: Number.POSITIVE_INFINITY });
    if (!open) throw new Error("expected a plot");
    expect(open.raXPx).toBeNull();
    expect(open.allowedD).toContain(`L ${(300).toFixed(2)} ${open.epsYPx.toFixed(2)} Z`);
  });

  it("returns null for radial motion or a degenerate window", () => {
    expect(effectivePotentialPlot({ ...args, rpAu: 0 })).toBeNull();
    expect(effectivePotentialPlot({ ...args, rMaxAu: 0.2 })).toBeNull();
    expect(effectivePotentialPlot({ ...args, heightPx: 0 })).toBeNull();
  });

  it("starts a near-circular orbit's curve at the top edge, so the centrifugal barrier is drawn (physics review)", () => {
    // Circular toy: eps = U_eff,min = -2 at r_c = r_p = 0.5. At 0.55 r_p = 0.275, U_eff = -0.66, still below the
    // window's top (0.9), so a start at 0.55 r_p drew a well open towards the Sun (y = 74.5 of 150 px).
    const circ = effectivePotentialPlot({ ...args, epsAu2Yr2: -2, rpAu: 0.5, raAu: 0.5, rMaxAu: 1.5 });
    if (!circ) throw new Error("expected a plot");
    const [, x0, y0] = /^M (\S+) (\S+)/.exec(circ.curveD) ?? [];
    expect(x0).toBe("0.00");
    expect(Number(y0)).toBeLessThanOrEqual(0.01);
  });
});

describe("turningPointsText", () => {
  it("names both turning points of a bound orbit", () => {
    expect(turningPointsText({ orbitType: "elliptical", rpAu: 1.1015, raAu: 3.0183 })).toBe("Turns around at 1.10 AU and 3.02 AU.");
  });
  it("names the one turning point of an open orbit", () => {
    expect(turningPointsText({ orbitType: "hyperbolic", rpAu: 1, raAu: Number.POSITIVE_INFINITY })).toBe(
      "Turns around once, at 1.00 AU, and does not come back."
    );
  });
  it("describes a circular orbit as touching the bottom of the curve", () => {
    expect(turningPointsText({ orbitType: "circular", rpAu: 1, raAu: 1 })).toBe(
      "Circular: the energy line touches the bottom of the curve at 1.00 AU."
    );
  });
  it("explains radial motion", () => {
    expect(turningPointsText({ orbitType: "radial", rpAu: 0, raAu: 1.2 })).toBe(
      "No angular momentum, so there is no barrier: the body falls straight in."
    );
  });
});

describe("potentialEnergyWindow", () => {
  it("runs from 12% below the minimum to max(eps, 0) plus 45% of the depth", () => {
    // toBeCloseTo, not toEqual: 1.12 * -2 is -2.2400000000000002 in floating point.
    const bound = potentialEnergyWindow({ epsAu2Yr2: -1.5, uEffMinAu2Yr2: -2 });
    expect(bound.eLo).toBeCloseTo(-2.24, 12);
    expect(bound.eHi).toBeCloseTo(0.9, 12);
    const open = potentialEnergyWindow({ epsAu2Yr2: 0.5, uEffMinAu2Yr2: -2 });
    expect(open.eLo).toBeCloseTo(-2.24, 12);
    expect(open.eHi).toBeCloseTo(1.4, 12);
  });
});

describe("potentialProfile", () => {
  // Same toy as effectivePotentialPlot: mu = 2, h = 1, turning points 1/3 and 1 at eps = -1.5.
  const uEff = (r: number) => -2 / r + 1 / (2 * r * r);
  const args = { uEff, epsAu2Yr2: -1.5, uEffMinAu2Yr2: -2, rpAu: 1 / 3, raAu: 1, rMaxAu: 2, widthPx: 600, heightPx: 300 };
  // Built inside each test, not at describe scope: a throw there fails collection ("no tests"), not an assertion.
  const makeProfile = () => {
    const prof = potentialProfile(args);
    if (!prof) throw new Error("expected a profile");
    return prof;
  };

  it("puts the Sun at the centre and r on a linear scale out to rMaxAu on each side", () => {
    const prof = makeProfile();
    expect(prof.xPx(0)).toBe(300);
    expect(prof.xPx(2)).toBe(600);
    expect(prof.xPx(-2)).toBe(0);
    expect(prof.rpXPx).toBeCloseTo(350, 9);
    expect(prof.raXPx ?? Number.NaN).toBeCloseTo(450, 9);
  });

  it("is mirror-symmetric about the Sun", () => {
    const prof = makeProfile();
    for (const r of [0.4, 0.8, 1.7]) {
      expect(prof.xPx(r) + prof.xPx(-r)).toBeCloseTo(600, 9);
    }
  });

  it("puts the turning points on the energy line", () => {
    const prof = makeProfile();
    expect(prof.yPx(uEff(1 / 3))).toBeCloseTo(prof.epsYPx, 6);
    expect(prof.yPx(uEff(1))).toBeCloseTo(prof.epsYPx, 6);
  });

  it("draws two curve halves and two closed allowed regions, with no NaN", () => {
    const prof = makeProfile();
    expect(prof.curveD.match(/M /g)?.length).toBe(2);
    expect(prof.allowedD.match(/Z/g)?.length).toBe(2);
    expect(prof.curveD).not.toContain("NaN");
  });

  it("uses the same energy window as the instrument plot", () => {
    const prof = makeProfile();
    const plot = effectivePotentialPlot({ ...args, widthPx: 300, heightPx: 300 });
    expect(prof.epsYPx).toBeCloseTo(plot?.epsYPx ?? Number.NaN, 9);
  });

  it("has no outer turning point for an open orbit, and is null for radial motion", () => {
    expect(potentialProfile({ ...args, epsAu2Yr2: 0.5, raAu: Number.POSITIVE_INFINITY })?.raXPx).toBeNull();
    expect(potentialProfile({ ...args, rpAu: 0 })).toBeNull();
  });

  it("starts both halves of a near-circular orbit's curve at the top edge (physics review)", () => {
    const circ = potentialProfile({ ...args, epsAu2Yr2: -2, rpAu: 0.5, raAu: 0.5, rMaxAu: 1.5 });
    if (!circ) throw new Error("expected a profile");
    const starts = [...circ.curveD.matchAll(/M (\S+) (\S+)/g)].map((m) => Number(m[2]));
    expect(starts).toHaveLength(2);
    for (const y of starts) expect(y).toBeLessThanOrEqual(0.01);
  });
});
