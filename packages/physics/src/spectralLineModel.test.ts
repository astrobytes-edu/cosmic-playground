import { describe, it, expect } from "vitest";
import { SpectralLineModel } from "./spectralLineModel";

describe("SpectralLineModel", () => {
  // ── Benchmark tests ──────────────────────────────────────

  describe("hydrogen energy levels", () => {
    it("ground state E₁ = -13.6 eV", () => {
      const e1 = SpectralLineModel.hydrogenEnergyEv({ n: 1 });
      expect(e1).toBeCloseTo(-13.606, 1);
    });

    it("E₂ = -3.40 eV", () => {
      const e2 = SpectralLineModel.hydrogenEnergyEv({ n: 2 });
      expect(e2).toBeCloseTo(-3.401, 1);
    });

    it("E₃ = -1.51 eV", () => {
      const e3 = SpectralLineModel.hydrogenEnergyEv({ n: 3 });
      expect(e3).toBeCloseTo(-1.512, 1);
    });
  });

  describe("benchmark wavelengths", () => {
    it("Hα (n=3→2) = 656.3 nm ± 0.5", () => {
      const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: 3, nLower: 2 });
      expect(lambda).toBeCloseTo(656.3, 0);
    });

    it("Hβ (n=4→2) = 486.1 nm ± 0.5", () => {
      const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: 4, nLower: 2 });
      expect(lambda).toBeCloseTo(486.1, 0);
    });

    it("Hγ (n=5→2) = 434.0 nm ± 0.5", () => {
      const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: 5, nLower: 2 });
      expect(lambda).toBeCloseTo(434.0, 0);
    });

    it("Lyα (n=2→1) = 121.6 nm ± 0.5", () => {
      const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: 2, nLower: 1 });
      expect(lambda).toBeCloseTo(121.6, 0);
    });

    it("Balmer limit (series limit for n_lower=2) = 364.6 nm ± 0.5", () => {
      const lambda = SpectralLineModel.seriesLimitNm({ nLower: 2 });
      expect(lambda).toBeCloseTo(364.6, 0);
    });

    it("Paα (n=4→3) = 1875 nm ± 2", () => {
      const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: 4, nLower: 3 });
      expect(Math.abs(lambda - 1875)).toBeLessThan(2);
    });
  });

  describe("Bohr radius", () => {
    it("a₀ = 0.0529 nm ± 0.0001", () => {
      const r1 = SpectralLineModel.bohrRadiusNm({ n: 1 });
      expect(r1).toBeCloseTo(0.0529, 3);
    });

    it("r₂ = 4 × a₀", () => {
      const r1 = SpectralLineModel.bohrRadiusNm({ n: 1 });
      const r2 = SpectralLineModel.bohrRadiusNm({ n: 2 });
      expect(r2 / r1).toBeCloseTo(4, 5);
    });
  });

  // ── Limiting-case tests ──────────────────────────────────

  describe("limiting cases", () => {
    it("very high n approaches ionization (E → 0)", () => {
      const e100 = SpectralLineModel.hydrogenEnergyEv({ n: 100 });
      expect(Math.abs(e100)).toBeLessThan(0.002);
    });

    it("n = Infinity is the ionization limit (E = 0)", () => {
      const eInf = SpectralLineModel.hydrogenEnergyEv({ n: Number.POSITIVE_INFINITY });
      expect(eInf).toBe(0);
    });

    it("transition energy for very high n_upper → 1 approaches 13.6 eV", () => {
      const dE = SpectralLineModel.transitionEnergyEv({ nUpper: 1000, nLower: 1 });
      expect(dE).toBeCloseTo(13.606, 1);
    });

    it("Boltzmann ratio at T=0 (effectively) returns 0 for n>1", () => {
      const ratio = SpectralLineModel.boltzmannPopulationRatio({ n: 2, temperatureK: 1 });
      // At 1 K, essentially zero (exp(-157,000))
      expect(ratio).toBe(0);
    });
  });

  // ── Sanity invariants ────────────────────────────────────

  describe("sanity invariants", () => {
    it("transition wavelengths are always positive", () => {
      for (let nU = 2; nU <= 8; nU++) {
        for (let nL = 1; nL < nU; nL++) {
          const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: nU, nLower: nL });
          expect(lambda).toBeGreaterThan(0);
        }
      }
    });

    it("higher series transitions yield longer wavelengths for same Δn", () => {
      // For Δn=1: Lyman (2→1) < Balmer (3→2) < Paschen (4→3)
      const lyman = SpectralLineModel.transitionWavelengthNm({ nUpper: 2, nLower: 1 });
      const balmer = SpectralLineModel.transitionWavelengthNm({ nUpper: 3, nLower: 2 });
      const paschen = SpectralLineModel.transitionWavelengthNm({ nUpper: 4, nLower: 3 });
      expect(balmer).toBeGreaterThan(lyman);
      expect(paschen).toBeGreaterThan(balmer);
    });

    it("series limit < all transition wavelengths in that series", () => {
      for (let nLow = 1; nLow <= 4; nLow++) {
        const limit = SpectralLineModel.seriesLimitNm({ nLower: nLow });
        const transitions = SpectralLineModel.seriesTransitions({ nLower: nLow, nMax: 20 });
        for (const t of transitions) {
          expect(t.wavelengthNm).toBeGreaterThan(limit);
        }
      }
    });

    it("transitionEnergy and transitionWavelength are self-consistent via hc", () => {
      const nU = 4, nL = 2;
      const eV = SpectralLineModel.transitionEnergyEv({ nUpper: nU, nLower: nL });
      const nm = SpectralLineModel.transitionWavelengthNm({ nUpper: nU, nLower: nL });
      const hc = SpectralLineModel.BOHR.HC_EV_NM;
      expect(eV * nm).toBeCloseTo(hc, 0);
    });

    it("all element catalogs have valid wavelengths and intensities", () => {
      for (const key of SpectralLineModel.availableElements()) {
        const data = SpectralLineModel.elementLines({ element: key });
        expect(data.symbol).toBeTruthy();
        expect(data.name).toBeTruthy();
        for (const line of data.lines) {
          expect(line.wavelengthNm).toBeGreaterThan(0);
          expect(line.relativeIntensity).toBeGreaterThanOrEqual(0);
          expect(line.relativeIntensity).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  // ── Monotonicity tests ───────────────────────────────────

  describe("monotonicity", () => {
    it("E_n is strictly increasing (less negative) with n", () => {
      let prev = SpectralLineModel.hydrogenEnergyEv({ n: 1 });
      for (let n = 2; n <= 10; n++) {
        const curr = SpectralLineModel.hydrogenEnergyEv({ n });
        expect(curr).toBeGreaterThan(prev);
        prev = curr;
      }
    });

    it("λ within Balmer series is strictly decreasing with n_upper", () => {
      let prev = Infinity;
      for (let nU = 3; nU <= 10; nU++) {
        const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: nU, nLower: 2 });
        expect(lambda).toBeLessThan(prev);
        prev = lambda;
      }
    });

    it("Boltzmann ratio for n=2 increases with T", () => {
      let prev = 0;
      for (const t of [1000, 5000, 10000, 50000]) {
        const ratio = SpectralLineModel.boltzmannPopulationRatio({ n: 2, temperatureK: t });
        expect(ratio).toBeGreaterThan(prev);
        prev = ratio;
      }
    });

    it("Boltzmann ratio decreases monotonically with n at low T", () => {
      // At low T the exponential decay dominates the n^2 degeneracy factor
      const T = 1000;
      let prev = SpectralLineModel.boltzmannPopulationRatio({ n: 2, temperatureK: T });
      for (let n = 3; n <= 8; n++) {
        const curr = SpectralLineModel.boltzmannPopulationRatio({ n, temperatureK: T });
        expect(curr).toBeLessThan(prev);
        prev = curr;
      }
    });
  });

  // ── Series classification ────────────────────────────────

  describe("series classification", () => {
    it("nLower=1 is Lyman", () => {
      expect(SpectralLineModel.seriesName({ nLower: 1 })).toBe("Lyman");
    });
    it("nLower=2 is Balmer", () => {
      expect(SpectralLineModel.seriesName({ nLower: 2 })).toBe("Balmer");
    });
    it("nLower=3 is Paschen", () => {
      expect(SpectralLineModel.seriesName({ nLower: 3 })).toBe("Paschen");
    });
    it("nLower=4 is Brackett", () => {
      expect(SpectralLineModel.seriesName({ nLower: 4 })).toBe("Brackett");
    });
  });

  // ── Edge cases ───────────────────────────────────────────

  describe("edge cases", () => {
    it("invalid n returns NaN", () => {
      expect(SpectralLineModel.hydrogenEnergyEv({ n: 0 })).toBeNaN();
      expect(SpectralLineModel.hydrogenEnergyEv({ n: -1 })).toBeNaN();
      expect(SpectralLineModel.hydrogenEnergyEv({ n: 1.5 })).toBeNaN();
      expect(SpectralLineModel.hydrogenEnergyEv({ n: NaN })).toBeNaN();
    });

    it("nUpper <= nLower returns NaN", () => {
      expect(SpectralLineModel.transitionEnergyEv({ nUpper: 2, nLower: 2 })).toBeNaN();
      expect(SpectralLineModel.transitionEnergyEv({ nUpper: 1, nLower: 2 })).toBeNaN();
    });

    it("unknown element returns empty lines", () => {
      const data = SpectralLineModel.elementLines({ element: "Zz" });
      expect(data.lines).toHaveLength(0);
    });

    it("wavelengthBand classifies correctly", () => {
      expect(SpectralLineModel.wavelengthBand({ wavelengthNm: 121.6 })).toBe("UV");
      expect(SpectralLineModel.wavelengthBand({ wavelengthNm: 500 })).toBe("Visible (green)");
      expect(SpectralLineModel.wavelengthBand({ wavelengthNm: 656 })).toBe("Visible (red)");
      expect(SpectralLineModel.wavelengthBand({ wavelengthNm: 1875 })).toBe("IR");
    });
  });

  // ── Frequency tests ──────────────────────────────────────

  describe("frequencies", () => {
    it("Hα frequency ≈ 4.57 × 10¹⁴ Hz", () => {
      const freq = SpectralLineModel.transitionFrequencyHz({ nUpper: 3, nLower: 2 });
      expect(freq / 1e14).toBeCloseTo(4.57, 1);
    });

    it("frequency and wavelength are consistent: c = λν", () => {
      const lambda = SpectralLineModel.transitionWavelengthNm({ nUpper: 3, nLower: 2 });
      const freq = SpectralLineModel.transitionFrequencyHz({ nUpper: 3, nLower: 2 });
      const c = lambda * 1e-7 * freq; // nm → cm, then cm * Hz = cm/s
      expect(c).toBeCloseTo(SpectralLineModel.BOHR.C_CM_PER_S, -4); // within ~0.01%
    });
  });
});
