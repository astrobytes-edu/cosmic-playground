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
