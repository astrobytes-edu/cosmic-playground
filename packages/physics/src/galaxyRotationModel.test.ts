import { describe, expect, it } from "vitest";
import { GalaxyRotationModel, type GalaxyParams } from "./galaxyRotationModel";

function expectCloseToRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

describe("GalaxyRotationModel", () => {
  const mw = GalaxyRotationModel.PRESETS["milky-way-like"];
  const dwarf = GalaxyRotationModel.PRESETS["dwarf-galaxy"];
  const massive = GalaxyRotationModel.PRESETS["massive-spiral"];
  const noHalo = GalaxyRotationModel.PRESETS["no-dark-matter"];

  describe("benchmark checks", () => {
    it("returns V_total = 0 at R = 0", () => {
      const vTotal = GalaxyRotationModel.vTotalKmS({ radiusKpc: 0, params: mw });
      expect(vTotal).toBe(0);
    });

    it("Milky Way-like solar circle velocity is ~216 km/s", () => {
      const vTotal = GalaxyRotationModel.vTotalKmS({ radiusKpc: 8.2, params: mw });
      expectCloseToRange(vTotal, 206, 226);
    });

    it("No-dark-matter preset gives Keplerian-like falloff at 30 kpc (~92 km/s)", () => {
      const vTotal = GalaxyRotationModel.vTotalKmS({ radiusKpc: 30, params: noHalo });
      expectCloseToRange(vTotal, 87, 97);
    });

    it("No-dark-matter slope follows R^-1/2 between 30 and 50 kpc", () => {
      const v30 = GalaxyRotationModel.vTotalKmS({ radiusKpc: 30, params: noHalo });
      const v50 = GalaxyRotationModel.vTotalKmS({ radiusKpc: 50, params: noHalo });
      const ratio = v50 / v30;
      expect(Math.abs(ratio - Math.sqrt(30 / 50))).toBeLessThan(0.015);
    });

    it("Milky Way-like outer curve is halo-dominated at 50 kpc", () => {
      const vHalo = GalaxyRotationModel.vHaloKmS({
        radiusKpc: 50,
        haloMass10: mw.haloMass10,
        haloScaleRadiusKpc: mw.haloScaleRadiusKpc,
      });
      const vTotal = GalaxyRotationModel.vTotalKmS({ radiusKpc: 50, params: mw });
      expect(vHalo / vTotal).toBeGreaterThan(0.9);
    });

    it("disk enclosed mass converges near total by 10 scale lengths", () => {
      const mDisk10 = GalaxyRotationModel.diskEnclosedMass10({
        radiusKpc: 10 * mw.diskScaleLengthKpc,
        diskMass10: mw.diskMass10,
        diskScaleLengthKpc: mw.diskScaleLengthKpc,
      });
      expect(mDisk10 / mw.diskMass10).toBeGreaterThan(0.99);
    });

    it("NFW enclosed mass fraction at r_s matches f(1)/f(c)", () => {
      const derived = GalaxyRotationModel.nfwDerived({
        haloMass10: mw.haloMass10,
        haloScaleRadiusKpc: mw.haloScaleRadiusKpc,
      });
      const enclosed = GalaxyRotationModel.haloEnclosedMass10({
        radiusKpc: mw.haloScaleRadiusKpc,
        haloMass10: mw.haloMass10,
        haloScaleRadiusKpc: mw.haloScaleRadiusKpc,
      });
      const f = (x: number) => Math.log(1 + x) - x / (1 + x);
      const expectedFraction = f(1) / f(derived.concentration);
      expect(enclosed / mw.haloMass10).toBeCloseTo(expectedFraction, 2);
    });

    it("Milky Way-like concentration and virial radius are in target ranges", () => {
      const derived = GalaxyRotationModel.nfwDerived({
        haloMass10: mw.haloMass10,
        haloScaleRadiusKpc: mw.haloScaleRadiusKpc,
      });
      expectCloseToRange(derived.concentration, 10.0, 10.8);
      expectCloseToRange(derived.rVirKpc, 214, 224);
    });

    it("Milky Way-like dark-to-visible ratio at 50 kpc is ~7.2", () => {
      const masses = GalaxyRotationModel.enclosedMass10({ radiusKpc: 50, params: mw });
      expectCloseToRange(masses.dark / masses.visible, 6.7, 7.7);
    });

    it("Milky Way-like baryon fraction at 50 kpc is ~0.12", () => {
      const fb = GalaxyRotationModel.baryonFraction({ radiusKpc: 50, params: mw });
      expectCloseToRange(fb, 0.1, 0.14);
    });

    it("MOND velocity at 30 kpc is near 187 km/s", () => {
      const vMond = GalaxyRotationModel.vMondKmS({ radiusKpc: 30, params: mw });
      expectCloseToRange(vMond, 175, 185);
      const vAsymptotic = GalaxyRotationModel.vMondDeepKmS({ radiusKpc: 30, params: mw });
      expectCloseToRange(vAsymptotic, 165, 180);
    });

    it("21-cm wavelength shift at 200 km/s is ~0.141 mm", () => {
      const deltaLambda21 = GalaxyRotationModel.deltaLambda21mm(200);
      expectCloseToRange(deltaLambda21, 0.136, 0.146);
    });

    it("mass-from-velocity inversion gives ~27.9e10 Msun for V=200 km/s at R=30 kpc", () => {
      const mTotal = GalaxyRotationModel.massFromVelocity10({
        velocityKmS: 200,
        radiusKpc: 30,
      });
      expectCloseToRange(mTotal, 27.4, 28.4);
    });

    it("dwarf galaxy is dark-matter dominated by 10 kpc", () => {
      const masses = GalaxyRotationModel.enclosedMass10({ radiusKpc: 10, params: dwarf });
      expectCloseToRange(masses.dark / masses.visible, 2.6, 3.2);
    });

    it("massive spiral reaches V_max ~252 km/s near ~20 kpc", () => {
      const curve = GalaxyRotationModel.rotationCurve({
        params: massive,
        rMinKpc: 0,
        rMaxKpc: 50,
        nPoints: 400,
      });
      const best = curve.reduce((current, row) => {
        return row.vTotalKmS > current.vTotalKmS ? row : current;
      }, curve[0]);
      expectCloseToRange(best.vTotalKmS, 242, 262);
      expectCloseToRange(best.radiusKpc, 12, 28);
    });
  });

  describe("limiting cases", () => {
    it("returns finite zero-centered values as R approaches 0", () => {
      const vBulge = GalaxyRotationModel.vBulgeKmS({
        radiusKpc: 1e-6,
        bulgeMass10: mw.bulgeMass10,
        bulgeScaleKpc: mw.bulgeScaleKpc,
      });
      const vDisk = GalaxyRotationModel.vDiskKmS({
        radiusKpc: 1e-6,
        diskMass10: mw.diskMass10,
        diskScaleLengthKpc: mw.diskScaleLengthKpc,
      });
      const vHalo = GalaxyRotationModel.vHaloKmS({
        radiusKpc: 1e-6,
        haloMass10: mw.haloMass10,
        haloScaleRadiusKpc: mw.haloScaleRadiusKpc,
      });
      expect(Number.isFinite(vBulge)).toBe(true);
      expect(Number.isFinite(vDisk)).toBe(true);
      expect(Number.isFinite(vHalo)).toBe(true);
      expect(vBulge).toBeGreaterThanOrEqual(0);
      expect(vDisk).toBeGreaterThanOrEqual(0);
      expect(vHalo).toBeGreaterThanOrEqual(0);
    });

    it("MOND full interpolation approaches deep-MOND asymptote at large radius", () => {
      const radiusKpc = 50;
      const vMond = GalaxyRotationModel.vMondKmS({ radiusKpc, params: mw });
      const vAsymptotic = GalaxyRotationModel.vMondDeepKmS({ radiusKpc, params: mw });
      expect(vMond / vAsymptotic).toBeGreaterThan(0.9);
      expect(vMond / vAsymptotic).toBeLessThan(1.15);
    });

    it("returns NaN for physically invalid inputs", () => {
      const invalidParams: GalaxyParams = {
        ...mw,
        diskScaleLengthKpc: -1,
      };
      expect(GalaxyRotationModel.vTotalKmS({ radiusKpc: 10, params: invalidParams })).toBeNaN();
      expect(GalaxyRotationModel.vHaloKmS({ radiusKpc: 10, haloMass10: NaN, haloScaleRadiusKpc: 20 })).toBeNaN();
      expect(GalaxyRotationModel.deltaLambda21mm(Number.NaN)).toBeNaN();
    });
  });

  describe("invariants", () => {
    it("enclosed masses are monotonic with radius", () => {
      const radii = [2, 5, 10, 15, 20, 30, 40, 50];
      let prev = GalaxyRotationModel.enclosedMass10({ radiusKpc: radii[0], params: mw });
      for (const radiusKpc of radii.slice(1)) {
        const current = GalaxyRotationModel.enclosedMass10({ radiusKpc, params: mw });
        expect(current.total).toBeGreaterThanOrEqual(prev.total);
        expect(current.visible).toBeGreaterThanOrEqual(prev.visible);
        expect(current.dark).toBeGreaterThanOrEqual(prev.dark);
        prev = current;
      }
    });

    it("velocity quadrature identity holds", () => {
      const radii = [1, 2, 5, 10, 20, 30, 50];
      for (const radiusKpc of radii) {
        const vBulge = GalaxyRotationModel.vBulgeKmS({
          radiusKpc,
          bulgeMass10: mw.bulgeMass10,
          bulgeScaleKpc: mw.bulgeScaleKpc,
        });
        const vDisk = GalaxyRotationModel.vDiskKmS({
          radiusKpc,
          diskMass10: mw.diskMass10,
          diskScaleLengthKpc: mw.diskScaleLengthKpc,
        });
        const vHalo = GalaxyRotationModel.vHaloKmS({
          radiusKpc,
          haloMass10: mw.haloMass10,
          haloScaleRadiusKpc: mw.haloScaleRadiusKpc,
        });
        const vTotal = GalaxyRotationModel.vTotalKmS({ radiusKpc, params: mw });
        expect(vTotal * vTotal).toBeCloseTo(vBulge * vBulge + vDisk * vDisk + vHalo * vHalo, 8);
      }
    });

    it("baryon fraction stays within [0, 1] for valid presets", () => {
      const presets = [mw, dwarf, massive, noHalo];
      for (const params of presets) {
        for (const radiusKpc of [2, 5, 10, 20, 30, 40, 50]) {
          const fb = GalaxyRotationModel.baryonFraction({ radiusKpc, params });
          expect(fb).toBeGreaterThanOrEqual(0);
          expect(fb).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});
