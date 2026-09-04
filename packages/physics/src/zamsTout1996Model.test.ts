import { describe, expect, it } from "vitest";

import { ZamsTout1996Model } from "./zamsTout1996Model";

describe("ZamsTout1996Model", () => {
  it("validates nominal solar-like inputs", () => {
    const v = ZamsTout1996Model.validity({ massMsun: 1, metallicityZ: 0.02 });
    expect(v.valid).toBe(true);
    expect(v.warnings).toEqual([]);
  });

  it("flags out-of-range inputs", () => {
    const v = ZamsTout1996Model.validity({ massMsun: 0.05, metallicityZ: 0.05 });
    expect(v.valid).toBe(false);
    expect(v.massInRange).toBe(false);
    expect(v.metallicityInRange).toBe(false);
    expect(v.warnings.length).toBeGreaterThan(0);
  });

  it("computes positive luminosity and radius in-range", () => {
    const luminosityLsun = ZamsTout1996Model.luminosityLsunFromMassMetallicity({ massMsun: 5, metallicityZ: 0.02 });
    const radiusRsun = ZamsTout1996Model.radiusRsunFromMassMetallicity({ massMsun: 5, metallicityZ: 0.02 });
    expect(luminosityLsun).toBeGreaterThan(0);
    expect(radiusRsun).toBeGreaterThan(0);
  });

  it("matches known Tout-1996-derived benchmark values near solar metallicity", () => {
    const l1 = ZamsTout1996Model.luminosityLsunFromMassMetallicity({ massMsun: 1, metallicityZ: 0.02 });
    const r1 = ZamsTout1996Model.radiusRsunFromMassMetallicity({ massMsun: 1, metallicityZ: 0.02 });
    const t1 = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({ massMsun: 1, metallicityZ: 0.02 });

    expect(l1).toBeCloseTo(0.6977, 3);
    expect(r1).toBeCloseTo(0.8882, 3);
    expect(t1).toBeCloseTo(5597, -1);
  });

  it("produces monotonic Teff over ZAMS mass domain at solar metallicity", () => {
    const masses = [0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60, 100];
    const temps = masses.map((massMsun) =>
      ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({ massMsun, metallicityZ: 0.02 })
    );
    for (let i = 1; i < temps.length; i += 1) {
      expect(temps[i]).toBeGreaterThan(temps[i - 1]);
    }
  });

  it("produces monotonic Teff over ZAMS mass domain at metallicity boundaries", () => {
    const masses = [0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60, 100];
    const boundaryMetallicities = [
      ZamsTout1996Model.CONSTANTS.metallicityMin,
      ZamsTout1996Model.CONSTANTS.metallicityMax
    ];
    for (const metallicityZ of boundaryMetallicities) {
      const temps = masses.map((massMsun) =>
        ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({ massMsun, metallicityZ })
      );
      for (let i = 1; i < temps.length; i += 1) {
        expect(temps[i]).toBeGreaterThan(temps[i - 1]);
      }
    }
  });

  it("inverts Teff to mass with small relative error", () => {
    const masses = [0.2, 0.5, 1, 2, 5, 10, 30, 60, 100];
    for (const massMsun of masses) {
      const temperatureK = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({ massMsun, metallicityZ: 0.02 });
      const recoveredMassMsun = ZamsTout1996Model.massFromTemperatureMetallicity({ temperatureK, metallicityZ: 0.02 });
      const relativeError = Math.abs(recoveredMassMsun - massMsun) / massMsun;
      expect(relativeError).toBeLessThan(2e-3);
    }
  });

  it("inverts Teff to mass with bounded error at metallicity boundaries", () => {
    const masses = [0.2, 0.5, 1, 2, 5, 10, 30, 60, 100];
    const boundaryMetallicities = [
      ZamsTout1996Model.CONSTANTS.metallicityMin,
      ZamsTout1996Model.CONSTANTS.metallicityMax
    ];
    for (const metallicityZ of boundaryMetallicities) {
      for (const massMsun of masses) {
        const temperatureK = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({
          massMsun,
          metallicityZ
        });
        const recoveredMassMsun = ZamsTout1996Model.massFromTemperatureMetallicity({
          temperatureK,
          metallicityZ
        });
        const relativeError = Math.abs(recoveredMassMsun - massMsun) / massMsun;
        expect(relativeError).toBeLessThan(4e-3);
      }
    }
  });

  it("returns NaN when inputs are out of model domain", () => {
    expect(
      ZamsTout1996Model.luminosityLsunFromMassMetallicity({ massMsun: 0.01, metallicityZ: 0.02 })
    ).toBeNaN();
    expect(
      ZamsTout1996Model.radiusRsunFromMassMetallicity({ massMsun: 1, metallicityZ: 0.2 })
    ).toBeNaN();
    expect(
      ZamsTout1996Model.massFromTemperatureMetallicity({ temperatureK: 1000, metallicityZ: 0.02 })
    ).toBeNaN();
  });
});

describe("opt-in high-mass extrapolation", () => {
  const Z = 0.02;

  it("refuses masses above the ceiling by default", () => {
    const args = { massMsun: 150, metallicityZ: Z };
    expect(ZamsTout1996Model.validity(args).valid).toBe(false);
    expect(Number.isNaN(ZamsTout1996Model.luminosityLsunFromMassMetallicity(args))).toBe(true);
  });

  it("evaluates above the ceiling when explicitly asked", () => {
    const args = { massMsun: 150, metallicityZ: Z, extrapolateAboveMassCeiling: true };
    expect(ZamsTout1996Model.validity(args).valid).toBe(true);
    expect(ZamsTout1996Model.luminosityLsunFromMassMetallicity(args)).toBeCloseTo(2.4803e6, -3);
    expect(ZamsTout1996Model.radiusRsunFromMassMetallicity(args)).toBeCloseTo(22.861, 2);
  });

  it("still reports the mass as outside the fit's own domain", () => {
    // `valid` gates evaluation; `massInRange` reports the published domain. A consumer
    // needs both, so it can plot the star AND label it as extrapolated.
    const v = ZamsTout1996Model.validity({
      massMsun: 150,
      metallicityZ: Z,
      extrapolateAboveMassCeiling: true
    });
    expect(v.valid).toBe(true);
    expect(v.massInRange).toBe(false);
    expect(v.warnings.join(" ")).toContain("extrapolated");
  });

  it("never extrapolates downward, even with the flag set", () => {
    // Below 0.1 Msun the interior physics changes; a main-sequence fit has nothing to say.
    const args = { massMsun: 0.05, metallicityZ: Z, extrapolateAboveMassCeiling: true };
    expect(ZamsTout1996Model.validity(args).valid).toBe(false);
    expect(Number.isNaN(ZamsTout1996Model.luminosityLsunFromMassMetallicity(args))).toBe(true);
  });

  it("stays monotone and physical through the ceiling", () => {
    let previousL = 0;
    let previousR = 0;
    let previousT = 0;
    for (const massMsun of [80, 100, 120, 150, 200, 300]) {
      const args = { massMsun, metallicityZ: Z, extrapolateAboveMassCeiling: true };
      const L = ZamsTout1996Model.luminosityLsunFromMassMetallicity(args);
      const R = ZamsTout1996Model.radiusRsunFromMassMetallicity(args);
      const T = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity(args);
      expect(L).toBeGreaterThan(previousL);
      expect(R).toBeGreaterThan(previousR);
      expect(T).toBeGreaterThan(previousT);
      previousL = L;
      previousR = R;
      previousT = T;
    }
  });

  it("lands in the observed range for the most massive stars known", () => {
    // R136a1-class, around 200 Msun: L of a few times 1e6 Lsun and Teff around 46000 to
    // 53000 K. This is the check that makes the extrapolation defensible rather than
    // merely smooth.
    const args = { massMsun: 200, metallicityZ: Z, extrapolateAboveMassCeiling: true };
    const L = ZamsTout1996Model.luminosityLsunFromMassMetallicity(args);
    const T = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity(args);
    expect(L).toBeGreaterThan(1e6);
    expect(L).toBeLessThan(1e7);
    expect(T).toBeGreaterThan(40_000);
    expect(T).toBeLessThan(60_000);
  });

  it("still respects the metallicity limits", () => {
    const args = { massMsun: 150, metallicityZ: 0.5, extrapolateAboveMassCeiling: true };
    expect(ZamsTout1996Model.validity(args).valid).toBe(false);
  });
});
