import { describe, it, expect } from "vitest";
import {
  buildParallaxBasis,
  clamp,
  computeCaptureInference,
  describeMeasurability,
  deterministicAxisNoiseMas,
  detectorTrueOffsetMasFromPhase,
  dotVec2,
  errorRadiusPx,
  formatNumber,
  normalizePhaseDeg,
  offsetPx,
  phaseSeparationDeg,
  signalToNoise,
  vecLength
} from "./logic";

describe("Parallax Distance -- UI Logic", () => {
  describe("utility helpers", () => {
    it("clamps values to bounds", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-2, 0, 10)).toBe(0);
      expect(clamp(17, 0, 10)).toBe(10);
    });

    it("formats finite/non-finite values safely", () => {
      expect(formatNumber(3.14159)).toBe("3.14");
      expect(formatNumber(3.14159, 4)).toBe("3.1416");
      expect(formatNumber(NaN)).toBe("\u2014");
      expect(formatNumber(Infinity)).toBe("\u2014");
    });

    it("normalizes phase and computes minimal phase separation", () => {
      expect(normalizePhaseDeg(725)).toBeCloseTo(5, 12);
      expect(normalizePhaseDeg(-90)).toBeCloseTo(270, 12);
      expect(phaseSeparationDeg(10, 350)).toBeCloseTo(20, 12);
      expect(phaseSeparationDeg(0, 180)).toBeCloseTo(180, 12);
    });
  });

  describe("basis and detector geometry", () => {
    it("builds axisHat perpendicular to starDirHat", () => {
      const basis = buildParallaxBasis({ x: 0, y: 1 });
      expect(basis.starDirHat.x).toBeCloseTo(0, 12);
      expect(basis.starDirHat.y).toBeCloseTo(1, 12);
      expect(basis.axisHat.x).toBeCloseTo(-1, 12);
      expect(basis.axisHat.y).toBeCloseTo(0, 12);
      expect(dotVec2(basis.starDirHat, basis.axisHat)).toBeCloseTo(0, 12);
      expect(vecLength(basis.axisHat)).toBeCloseTo(1, 12);
    });

    it("keeps detector true offset on the measurement axis", () => {
      const basis = buildParallaxBasis({ x: 0, y: 1 });
      const axis = basis.axisHat;

      const at0 = detectorTrueOffsetMasFromPhase(50, 0, axis);
      const at90 = detectorTrueOffsetMasFromPhase(50, 90, axis);
      const at180 = detectorTrueOffsetMasFromPhase(50, 180, axis);

      expect(at0.y).toBeCloseTo(0, 12);
      expect(at90.x).toBeCloseTo(0, 12);
      expect(at90.y).toBeCloseTo(0, 12);
      expect(at180.y).toBeCloseTo(0, 12);
      expect(at0.x).toBeCloseTo(-at180.x, 10);
    });
  });

  describe("deterministic noise", () => {
    it("returns repeatable noise for the same capture key", () => {
      const args = {
        epochLabel: "A",
        phaseDeg: 43.28,
        distancePc: 25,
        sigmaMas: 2
      } as const;

      const n1 = deterministicAxisNoiseMas(args);
      const n2 = deterministicAxisNoiseMas(args);

      expect(n1).toBeCloseTo(n2, 12);
    });

    it("changes noise when the capture key changes", () => {
      const base = deterministicAxisNoiseMas({
        epochLabel: "A",
        phaseDeg: 43.2,
        distancePc: 25,
        sigmaMas: 2
      });
      const changed = deterministicAxisNoiseMas({
        epochLabel: "B",
        phaseDeg: 43.2,
        distancePc: 25,
        sigmaMas: 2
      });
      expect(changed).not.toBeCloseTo(base, 10);
    });
  });

  describe("capture inference", () => {
    it("recovers parallax from projection along effective baseline", () => {
      // True distance 20 pc -> true p = 50 mas.
      // axisHat = {-1, 0}, A phase 0, B phase 180.
      const result = computeCaptureInference({
        earthPosAuA: { x: 1, y: 0 },
        earthPosAuB: { x: -1, y: 0 },
        detectorMeasMasA: { x: -50, y: 0 },
        detectorMeasMasB: { x: 50, y: 0 },
        phaseDegA: 0,
        phaseDegB: 180,
        axisHat: { x: -1, y: 0 },
        sigmaEpochMas: 1
      });

      expect(result.computable).toBe(true);
      expect(result.reason).toBe("ok");
      expect(result.deltaThetaMas).toBeCloseTo(100, 10);
      expect(result.baselineEffAu).toBeCloseTo(2, 12);
      expect(result.pHatMas).toBeCloseTo(50, 10);
      expect(result.dHatPc).toBeCloseTo(20, 10);
      expect(result.equivalentSixMonthShiftMas).toBeCloseTo(100, 10);
    });

    it("keeps signed shift direction and flips sign when epochs are swapped", () => {
      const aToB = computeCaptureInference({
        earthPosAuA: { x: 1, y: 0 },
        earthPosAuB: { x: -1, y: 0 },
        detectorMeasMasA: { x: -40, y: 0 },
        detectorMeasMasB: { x: 40, y: 0 },
        phaseDegA: 0,
        phaseDegB: 180,
        axisHat: { x: -1, y: 0 },
        sigmaEpochMas: 1
      });
      const bToA = computeCaptureInference({
        earthPosAuA: { x: -1, y: 0 },
        earthPosAuB: { x: 1, y: 0 },
        detectorMeasMasA: { x: 40, y: 0 },
        detectorMeasMasB: { x: -40, y: 0 },
        phaseDegA: 180,
        phaseDegB: 0,
        axisHat: { x: -1, y: 0 },
        sigmaEpochMas: 1
      });

      expect(aToB.deltaThetaSignedMas).toBeCloseTo(-bToA.deltaThetaSignedMas, 10);
      expect(aToB.deltaThetaMas).toBeCloseTo(bToA.deltaThetaMas, 10);
      expect(aToB.pHatMas).toBeCloseTo(bToA.pHatMas ?? 0, 10);
    });

    it("returns non-computable when effective baseline is too small", () => {
      const result = computeCaptureInference({
        earthPosAuA: { x: 0, y: 1 },
        earthPosAuB: { x: 0, y: -1 },
        detectorMeasMasA: { x: 0, y: 0 },
        detectorMeasMasB: { x: 0, y: 0 },
        phaseDegA: 90,
        phaseDegB: 270,
        axisHat: { x: -1, y: 0 },
        sigmaEpochMas: 1,
        minEffectiveBaselineAu: 0.2
      });

      expect(result.computable).toBe(false);
      expect(result.reason).toBe("baseline_too_small");
      expect(result.pHatMas).toBeNull();
      expect(result.dHatPc).toBeNull();
    });

    it("returns non-computable when captures are missing", () => {
      const result = computeCaptureInference({
        earthPosAuA: null,
        earthPosAuB: null,
        detectorMeasMasA: null,
        detectorMeasMasB: null,
        phaseDegA: null,
        phaseDegB: null,
        axisHat: { x: -1, y: 0 },
        sigmaEpochMas: 1
      });

      expect(result.computable).toBe(false);
      expect(result.reason).toBe("missing_capture");
    });
  });

  describe("readability helpers", () => {
    it("computes SNR and quality labels", () => {
      expect(signalToNoise(100, 2)).toBeCloseTo(50, 12);
      expect(describeMeasurability(25)).toBe("Excellent");
      expect(describeMeasurability(6)).toBe("Good");
      expect(describeMeasurability(2)).toBe("Poor");
      expect(describeMeasurability(0)).toBe("Not measurable");
    });

    it("keeps visual exaggeration and error radius display-only", () => {
      const base = offsetPx(10, 1, 0.06);
      const exaggerated = offsetPx(10, 12, 0.06);
      expect(exaggerated).toBeCloseTo(base * 12, 12);

      const low = errorRadiusPx(0.1, 5, 0.08, 3, 40);
      const high = errorRadiusPx(12, 5, 0.08, 3, 40);
      expect(high).toBeGreaterThan(low);
    });
  });
});
