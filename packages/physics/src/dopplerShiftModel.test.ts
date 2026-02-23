import { describe, expect, it } from "vitest";
import { DopplerShiftModel } from "./dopplerShiftModel";

describe("DopplerShiftModel", () => {
  describe("benchmark checks", () => {
    it("H-alpha at rest returns identical wavelength", () => {
      const lambdaObsNm = DopplerShiftModel.shiftedWavelengthNm({
        lambdaRestNm: 656.281,
        velocityKmS: 0,
        relativistic: false,
      });
      expect(lambdaObsNm).toBeCloseTo(656.281, 6);
    });

    it("H-alpha receding at +300 km/s (non-rel)", () => {
      const lambdaObsNm = DopplerShiftModel.shiftedWavelengthNm({
        lambdaRestNm: 656.281,
        velocityKmS: 300,
        relativistic: false,
      });
      expect(lambdaObsNm).toBeCloseTo(656.938, 3);
    });

    it("H-alpha approaching at -300 km/s (non-rel)", () => {
      const lambdaObsNm = DopplerShiftModel.shiftedWavelengthNm({
        lambdaRestNm: 656.281,
        velocityKmS: -300,
        relativistic: false,
      });
      expect(lambdaObsNm).toBeCloseTo(655.624, 3);
    });

    it("wavelength nm to frequency THz conversion", () => {
      const nuRestTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(656.281);
      expect(nuRestTHz).toBeCloseTo(456.805, 3);
    });

    it("frequency shift at +300 km/s (non-rel)", () => {
      const nuRestTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(656.281);
      const nuObsTHz = DopplerShiftModel.shiftedFrequencyTHz({
        nuRestTHz,
        velocityKmS: 300,
        relativistic: false,
      });
      expect(nuObsTHz).toBeCloseTo(456.348, 3);
    });

    it("z=0.158 non-rel inversion", () => {
      const velocityKmS = DopplerShiftModel.velocityFromRedshift({ z: 0.158, relativistic: false });
      expect(velocityKmS).toBeCloseTo(47_367, 0);
    });

    it("z=0.158 relativistic inversion", () => {
      const velocityKmS = DopplerShiftModel.velocityFromRedshift({ z: 0.158, relativistic: true });
      expect(velocityKmS).toBeCloseTo(43_665, 0);
    });

    it("z=2 relativistic inversion gives beta=0.8", () => {
      const velocityKmS = DopplerShiftModel.velocityFromRedshift({ z: 2, relativistic: true });
      const beta = DopplerShiftModel.beta(velocityKmS);
      expect(beta).toBeCloseTo(0.8, 6);
      expect(velocityKmS).toBeCloseTo(239_834, 0);
    });

    it("z=0 is identity", () => {
      const velocityKmS = DopplerShiftModel.velocityFromRedshift({ z: 0, relativistic: true });
      const zBack = DopplerShiftModel.redshiftFromVelocity({ velocityKmS, relativistic: true });
      expect(velocityKmS).toBeCloseTo(0, 10);
      expect(zBack).toBeCloseTo(0, 10);
    });

    it("divergence near 0.02c is about 1%", () => {
      const divergence = DopplerShiftModel.formulaDivergencePercent(0.02 * DopplerShiftModel.C_KM_S);
      expect(divergence).toBeCloseTo(1.01, 2);
    });

    it("divergence at 0.1c is about 5.25%", () => {
      const divergence = DopplerShiftModel.formulaDivergencePercent(0.1 * DopplerShiftModel.C_KM_S);
      expect(divergence).toBeCloseTo(5.25, 2);
    });

    it("negative velocity gives negative z and opposite-sign shifts", () => {
      const velocityKmS = -1000;
      const z = DopplerShiftModel.redshiftFromVelocity({ velocityKmS, relativistic: false });
      const lambdaObsNm = DopplerShiftModel.shiftedWavelengthNm({
        lambdaRestNm: 656.281,
        velocityKmS,
        relativistic: false,
      });
      const nuRestTHz = DopplerShiftModel.wavelengthNmToFrequencyTHz(656.281);
      const nuObsTHz = DopplerShiftModel.shiftedFrequencyTHz({ nuRestTHz, velocityKmS, relativistic: false });

      expect(z).toBeLessThan(0);
      expect(lambdaObsNm).toBeLessThan(656.281);
      expect(nuObsTHz).toBeGreaterThan(nuRestTHz);
    });

    it("velocity at or beyond light speed is invalid for relativistic transforms", () => {
      const zAtC = DopplerShiftModel.redshiftFromVelocity({
        velocityKmS: DopplerShiftModel.C_KM_S,
        relativistic: true,
      });
      const zBeyondC = DopplerShiftModel.redshiftFromVelocity({
        velocityKmS: DopplerShiftModel.C_KM_S * 1.01,
        relativistic: true,
      });

      expect(zAtC).toBeNaN();
      expect(zBeyondC).toBeNaN();
    });

    it("frequency-wavelength round trip is consistent", () => {
      const lambdaIn = 486.133;
      const nu = DopplerShiftModel.wavelengthNmToFrequencyTHz(lambdaIn);
      const lambdaOut = DopplerShiftModel.frequencyTHzToWavelengthNm(nu);
      expect(lambdaOut).toBeCloseTo(lambdaIn, 9);
    });
  });

  describe("limiting-case checks", () => {
    it("non-relativistic and relativistic redshift agree at low speed", () => {
      const velocityKmS = 100;
      const zNonRel = DopplerShiftModel.redshiftFromVelocity({ velocityKmS, relativistic: false });
      const zRel = DopplerShiftModel.redshiftFromVelocity({ velocityKmS, relativistic: true });
      expect(Math.abs(zRel - zNonRel)).toBeLessThan(1e-6);
    });

    it("regime labels track velocity thresholds", () => {
      expect(DopplerShiftModel.regime(5000).label).toBe("non-relativistic");
      expect(DopplerShiftModel.regime(10_000).label).toBe("mildly-relativistic");
      expect(DopplerShiftModel.regime(40_000).label).toBe("relativistic");
    });
  });

  describe("sanity invariants", () => {
    it("shiftLines preserves labels and computes deltas consistently", () => {
      const shifted = DopplerShiftModel.shiftLines({
        lines: [
          { label: "H-alpha", wavelengthNm: 656.281 },
          { label: "H-beta", wavelengthNm: 486.133 },
        ],
        velocityKmS: 300,
        relativistic: false,
      });

      expect(shifted).toHaveLength(2);
      expect(shifted[0].label).toBe("H-alpha");
      expect(shifted[0].shiftedNm - shifted[0].wavelengthNm).toBeCloseTo(shifted[0].deltaLambdaNm, 10);
      expect(shifted[0].shiftedFrequencyTHz - DopplerShiftModel.wavelengthNmToFrequencyTHz(shifted[0].wavelengthNm)).toBeCloseTo(
        shifted[0].deltaFrequencyTHz,
        10,
      );
    });

    it("invalid inputs return NaN", () => {
      expect(DopplerShiftModel.wavelengthNmToFrequencyTHz(0)).toBeNaN();
      expect(DopplerShiftModel.frequencyTHzToWavelengthNm(0)).toBeNaN();
      expect(DopplerShiftModel.velocityFromRedshift({ z: -1, relativistic: true })).toBeNaN();
      expect(DopplerShiftModel.shiftedWavelengthNm({ lambdaRestNm: NaN, velocityKmS: 100 })).toBeNaN();
    });
  });
});
