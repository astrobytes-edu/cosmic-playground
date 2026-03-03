import { describe, it, expect } from "vitest";
import {
  INVARIANT_STATEMENTS,
  bodyPositions,
  bodyRadius,
  clamp,
  computeModel,
  evaluateInvariants,
  evaluatePredictionChoices,
  gradeRvInference,
  formatNumber,
  gradeInvariantSelection,
  isRvChallengeLocked,
  isPredictionLocked,
  logSliderToValue,
  orbitAutoScaleLogFactor,
  pixelsPerUnit,
  rvCacheKey,
  energyScaleCueForControl,
  scalingCueForControl,
  selectDisplayModel,
  valueToLogSlider,
} from "./logic";

describe("Binary Orbits -- UI Logic", () => {
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
  });

  describe("formatNumber", () => {
    it("formats normal numbers with fixed digits", () => {
      expect(formatNumber(3.14159, 3)).toBe("3.142");
    });
    it("returns em-dash for NaN", () => {
      expect(formatNumber(Number.NaN)).toBe("\u2014");
    });
  });

  describe("computeModel", () => {
    it("equal masses (q=1): barycenter at midpoint", () => {
      const m = computeModel(1, 4, 90);
      expect(m.m1).toBe(1);
      expect(m.m2).toBe(1);
      expect(m.r1).toBeCloseTo(2, 10);
      expect(m.r2).toBeCloseTo(2, 10);
    });

    it("unequal ratio (q=0.2): barycenter closer to primary", () => {
      const m = computeModel(0.2, 6, 90);
      expect(m.r1).toBeCloseTo(1, 10);
      expect(m.r2).toBeCloseTo(5, 10);
    });

    it("period follows Kepler's third law", () => {
      const m1 = computeModel(1, 1, 90);
      const m2 = computeModel(1, 4, 90);
      expect(m1.periodYr).toBeCloseTo(Math.sqrt(0.5), 8);
      expect(m2.periodYr).toBeCloseTo(Math.sqrt(32), 8);
    });

    it("clamps massRatio to [0.001, 1.0]", () => {
      const low = computeModel(0.0001, 4, 90);
      expect(low.massRatio).toBe(0.001);
      const high = computeModel(100, 4, 90);
      expect(high.massRatio).toBe(1);
    });

    it("clamps separation to [0.1, 100]", () => {
      const low = computeModel(1, 0.001, 90);
      expect(low.separation).toBe(0.1);
      const high = computeModel(1, 1000, 90);
      expect(high.separation).toBe(100);
    });

    it("clamps inclination to [0, 90]", () => {
      const low = computeModel(0.5, 4, -20);
      expect(low.inclinationDeg).toBe(0);
      const high = computeModel(0.5, 4, 120);
      expect(high.inclinationDeg).toBe(90);
    });

    it("r1 + r2 equals separation", () => {
      const m = computeModel(0.2, 5, 90);
      expect(m.r1 + m.r2).toBeCloseTo(m.separation, 10);
    });

    it("omega is 2*pi / period", () => {
      const m = computeModel(1, 4, 90);
      expect(m.omegaRadPerYr).toBeCloseTo((2 * Math.PI) / m.periodYr, 8);
    });

    it("includes consistent orbital speeds", () => {
      const m = computeModel(0.2, 4, 90);
      expect(m.v1AuPerYr).toBeCloseTo(m.omegaRadPerYr * m.r1, 10);
      expect(m.v2AuPerYr).toBeCloseTo(m.omegaRadPerYr * m.r2, 10);
    });

    it("enforces momentum balance in barycentric frame", () => {
      const m = computeModel(0.2, 4, 90);
      expect(m.p1SolarAuPerYr).toBeCloseTo(m.p2SolarAuPerYr, 10);
      expect(m.momentumDifferenceSolarAuPerYr).toBeLessThan(1e-10);
    });

    it("RV amplitudes vanish face-on and match orbital speeds edge-on", () => {
      const faceOn = computeModel(0.2, 4, 0);
      expect(faceOn.k1AuPerYr).toBeCloseTo(0, 12);
      expect(faceOn.k2AuPerYr).toBeCloseTo(0, 12);

      const edgeOn = computeModel(0.2, 4, 90);
      expect(edgeOn.k1AuPerYr).toBeCloseTo(edgeOn.v1AuPerYr, 12);
      expect(edgeOn.k2AuPerYr).toBeCloseTo(edgeOn.v2AuPerYr, 12);
    });
  });

  describe("invariants", () => {
    it("exposes six invariant statements (4 true + 2 distractors)", () => {
      expect(INVARIANT_STATEMENTS).toHaveLength(6);
      const mustBeTrue = INVARIANT_STATEMENTS.filter((statement) => statement.mustBeTrue);
      expect(mustBeTrue).toHaveLength(4);
    });

    it("marks all invariants true for physically valid state", () => {
      const model = computeModel(0.2, 4, 90);
      const checks = evaluateInvariants(model);
      expect(checks).toHaveLength(6);
      expect(checks.filter((check) => check.mustBeTrue)).toHaveLength(4);
      expect(checks.filter((check) => !check.mustBeTrue)).toHaveLength(2);
    });

    it("grades invariant selection with full credit when all true statements are selected", () => {
      const model = computeModel(0.2, 4, 90);
      const checks = evaluateInvariants(model);
      const selectedKeys = checks.filter((check) => check.mustBeTrue).map((check) => check.key);
      const grade = gradeInvariantSelection({ checks, selectedKeys });
      expect(grade.trueRequiredCount).toBe(4);
      expect(grade.trueSelectedCount).toBe(4);
      expect(grade.falseSelectedCount).toBe(0);
      expect(grade.allTrueSelected).toBe(true);
      expect(grade.anyFalseSelected).toBe(false);
    });

    it("flags selections that include distractors", () => {
      const model = computeModel(0.2, 4, 90);
      const checks = evaluateInvariants(model);
      const selectedKeys = checks.map((check) => check.key);
      const grade = gradeInvariantSelection({ checks, selectedKeys });
      expect(grade.falseSelectedCount).toBe(2);
      expect(grade.anyFalseSelected).toBe(true);
    });
  });

  describe("prediction lock helpers", () => {
    it("locks actions only while prediction is pending", () => {
      expect(isPredictionLocked({ predictionPending: true })).toBe(true);
      expect(isPredictionLocked({ predictionPending: false })).toBe(false);
    });

    it("selects revealed model while prediction is pending", () => {
      const revealed = computeModel(1, 4, 90);
      const current = computeModel(0.2, 4, 90);

      const displayPending = selectDisplayModel({
        predictionPending: true,
        revealedModel: revealed,
        currentModel: current,
      });
      expect(displayPending.massRatio).toBeCloseTo(revealed.massRatio, 12);

      const displayResolved = selectDisplayModel({
        predictionPending: false,
        revealedModel: revealed,
        currentModel: current,
      });
      expect(displayResolved.massRatio).toBeCloseTo(current.massRatio, 12);
    });
  });

  describe("RV challenge helpers", () => {
    it("locks only while RV challenge is active and unrevealed", () => {
      expect(isRvChallengeLocked({ active: true, revealed: false })).toBe(true);
      expect(isRvChallengeLocked({ active: true, revealed: true })).toBe(false);
      expect(isRvChallengeLocked({ active: false, revealed: false })).toBe(false);
    });

    it("grades RV inference against true q with percent and absolute error", () => {
      const grade = gradeRvInference({ inferredQ: 0.22, trueQ: 0.2 });
      expect(grade.absoluteError).toBeCloseTo(0.02, 12);
      expect(grade.percentError).toBeCloseTo(10, 12);
    });
  });

  describe("prediction evaluator", () => {
    it("scores prediction trends correctly", () => {
      const before = computeModel(1, 4, 90);
      const after = computeModel(0.2, 4, 90);

      const result = evaluatePredictionChoices({
        before,
        after,
        predicted: {
          periodTrend: "increase",
          v1Trend: "decrease",
          a1Trend: "decrease",
        },
      });

      expect(result.actual.periodTrend).toBe("increase");
      expect(result.actual.v1Trend).toBe("decrease");
      expect(result.actual.a1Trend).toBe("decrease");
      expect(result.allCorrect).toBe(true);
    });
  });

  describe("scaling cues", () => {
    it("returns separation scaling cue for separation control", () => {
      const cue = scalingCueForControl("separation");
      expect(cue.key).toBe("separation");
      expect(cue.equation).toContain("a^{3/2}");
    });

    it("returns total-mass scaling cue for mass ratio control", () => {
      const cue = scalingCueForControl("massRatio");
      expect(cue.key).toBe("totalMass");
      expect(cue.equation).toContain("(M1 + M2)^{-1/2}");
    });
  });

  describe("energy scaling cues", () => {
    it("routes separation control to inverse-a energy cue", () => {
      const cue = energyScaleCueForControl("separation");
      expect(cue.equation).toContain("-1/a");
    });

    it("routes mass-ratio control to |E| proportionality cue", () => {
      const cue = energyScaleCueForControl("massRatio");
      expect(cue.equation).toContain("|E|");
      expect(cue.equation).toContain("M2");
    });
  });

  describe("RV cache key", () => {
    it("returns deterministic keys for identical model inputs", () => {
      const model = computeModel(0.2, 4, 60);
      const keyA = rvCacheKey(model, 180);
      const keyB = rvCacheKey(model, 180);
      expect(keyA).toBe(keyB);
    });

    it("changes key when RV-defining parameters change", () => {
      const base = computeModel(0.2, 4, 60);
      const changedInclination = computeModel(0.2, 4, 20);
      const changedMassRatio = computeModel(0.5, 4, 60);
      expect(rvCacheKey(base, 180)).not.toBe(rvCacheKey(changedInclination, 180));
      expect(rvCacheKey(base, 180)).not.toBe(rvCacheKey(changedMassRatio, 180));
    });
  });

  describe("log slider conversion", () => {
    const MIN = 0.1;
    const MAX = 100;

    it("maps slider endpoints to min/max", () => {
      expect(logSliderToValue(0, MIN, MAX)).toBeCloseTo(MIN, 10);
      expect(logSliderToValue(1000, MIN, MAX)).toBeCloseTo(MAX, 10);
    });

    it("valueToLogSlider round-trips with logSliderToValue", () => {
      for (const value of [0.1, 0.5, 1, 4, 10, 25, 100]) {
        const slider = valueToLogSlider(value, MIN, MAX);
        const back = logSliderToValue(slider, MIN, MAX);
        expect(back / value).toBeGreaterThan(0.97);
        expect(back / value).toBeLessThan(1.03);
      }
    });
  });

  describe("bodyRadius", () => {
    it("returns positive for valid inputs", () => {
      expect(bodyRadius(1, 10)).toBeGreaterThan(0);
    });

    it("monotonically increases with mass", () => {
      const r1 = bodyRadius(1, 10);
      const r2 = bodyRadius(2, 10);
      const r5 = bodyRadius(5, 10);
      expect(r2).toBeGreaterThan(r1);
      expect(r5).toBeGreaterThan(r2);
    });
  });

  describe("bodyPositions", () => {
    it("at phase=0, bodies are on the x-axis", () => {
      const { x1, y1, x2, y2 } = bodyPositions(200, 200, 50, 30, 0);
      expect(x1).toBeCloseTo(150, 10);
      expect(y1).toBeCloseTo(200, 10);
      expect(x2).toBeCloseTo(230, 10);
      expect(y2).toBeCloseTo(200, 10);
    });

    it("at phase=pi, bodies swap sides", () => {
      const { x1, y1, x2, y2 } = bodyPositions(200, 200, 50, 30, Math.PI);
      expect(x1).toBeCloseTo(250, 8);
      expect(y1).toBeCloseTo(200, 8);
      expect(x2).toBeCloseTo(170, 8);
      expect(y2).toBeCloseTo(200, 8);
    });
  });

  describe("pixelsPerUnit", () => {
    it("scales so larger orbit uses 38% of smaller canvas dimension", () => {
      const scale = pixelsPerUnit(3, 1, 400, 300);
      expect(scale).toBeCloseTo(38, 8);
    });

    it("returns 1 when both radii are zero", () => {
      expect(pixelsPerUnit(0, 0, 400, 400)).toBe(1);
    });
  });

  describe("orbitAutoScaleLogFactor", () => {
    it("returns finite bounded values across the supported separation range", () => {
      for (const a of [0.1, 0.3, 1, 3, 10, 30, 100]) {
        const factor = orbitAutoScaleLogFactor(a);
        expect(Number.isFinite(factor)).toBe(true);
        expect(factor).toBeGreaterThanOrEqual(0.68);
        expect(factor).toBeLessThanOrEqual(1.22);
      }
    });

    it("decreases smoothly as separation increases", () => {
      const f1 = orbitAutoScaleLogFactor(0.1);
      const f2 = orbitAutoScaleLogFactor(1);
      const f3 = orbitAutoScaleLogFactor(10);
      const f4 = orbitAutoScaleLogFactor(100);
      expect(f1).toBeGreaterThan(f2);
      expect(f2).toBeGreaterThan(f3);
      expect(f3).toBeGreaterThan(f4);
    });
  });
});
