import { describe, expect, it } from "vitest";
import {
  mainSequenceLifetimeMyr,
  remnantFateFromInitialMass,
  spectralTypeFromTemperature
} from "./stellarLifetimeModel";
import { ZamsTout1996Model } from "./zamsTout1996Model";

describe("main-sequence lifetime (Hurley+2000)", () => {
  it("gives the Sun about 11 Gyr", () => {
    expect(mainSequenceLifetimeMyr(1)).toBeCloseTo(11002.9, 0);
  });

  it("reproduces known lifetimes across the mass range", () => {
    // Computed from Hurley eqs (4)-(7) and checked against the literature values these
    // relations are known for: tens of Myr at 10 Msun, a few Myr for the most massive.
    const cases: Array<[number, number]> = [
      [0.5, 128_763],
      [2, 1164.2],
      [5, 104.02],
      [10, 24.288],
      [25, 6.8371],
      [100, 3.3515]
    ];
    for (const [massMsun, expectedMyr] of cases) {
      expect(mainSequenceLifetimeMyr(massMsun) / expectedMyr).toBeCloseTo(1, 3);
    }
  });

  it("is monotonically decreasing with mass", () => {
    let previous = Infinity;
    for (let m = 0.1; m <= 150; m *= 1.1) {
      const life = mainSequenceLifetimeMyr(m);
      expect(life).toBeLessThan(previous);
      previous = life;
    }
  });

  it("keeps low-mass stars on the main sequence longer than the age of the universe", () => {
    // ~13.8 Gyr. Anything below about 0.9 Msun has not had time to leave.
    expect(mainSequenceLifetimeMyr(0.8)).toBeGreaterThan(13_800);
  });

  it("approaches a floor of a few Myr rather than falling to zero", () => {
    // The most massive stars do not live arbitrarily briefly; t_MS flattens near 3 Myr.
    expect(mainSequenceLifetimeMyr(150)).toBeGreaterThan(3);
    expect(mainSequenceLifetimeMyr(150)).toBeLessThan(4);
  });

  it("diverges sharply from the 10 Gyr * M^-2.5 classroom shortcut at both ends", () => {
    // This is the reason to carry the real relation. The shortcut is tuned near 1 Msun
    // and fails badly away from it.
    const shortcut = (m: number) => 1e4 * m ** -2.5;
    expect(mainSequenceLifetimeMyr(1) / shortcut(1)).toBeCloseTo(1.1, 1);
    expect(mainSequenceLifetimeMyr(100) / shortcut(100)).toBeGreaterThan(30);
    expect(mainSequenceLifetimeMyr(0.1) / shortcut(0.1)).toBeGreaterThan(1.1);
  });
});

describe("spectral type", () => {
  it("classifies the Sun as G2V", () => {
    expect(spectralTypeFromTemperature(5772)).toBe("G2V");
  });

  it("classifies a zero-age Sun one subclass later, because it was cooler", () => {
    const zamsSunK = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({
      massMsun: 1,
      metallicityZ: 0.02
    });
    expect(zamsSunK).toBeLessThan(5772);
    expect(spectralTypeFromTemperature(zamsSunK)).toBe("G5V");
  });

  it("orders the sequence from hot to cool", () => {
    expect(spectralTypeFromTemperature(45000)).toBe("O5V");
    expect(spectralTypeFromTemperature(30000)).toBe("B0V");
    expect(spectralTypeFromTemperature(9800)).toBe("A0V");
    expect(spectralTypeFromTemperature(6500)).toBe("F5V");
    expect(spectralTypeFromTemperature(4400)).toBe("K5V");
    expect(spectralTypeFromTemperature(3000)).toBe("M5V");
  });

  it("saturates rather than extrapolating past the table", () => {
    expect(spectralTypeFromTemperature(1e6)).toBe("O5V");
    expect(spectralTypeFromTemperature(100)).toBe("M8V");
  });
});

describe("remnant fate (Heger+2003 thresholds)", () => {
  it("maps initial mass to the conventional remnant", () => {
    expect(remnantFateFromInitialMass(1)).toBe("white dwarf");
    expect(remnantFateFromInitialMass(7.9)).toBe("white dwarf");
    expect(remnantFateFromInitialMass(8)).toBe("neutron star");
    expect(remnantFateFromInitialMass(24.9)).toBe("neutron star");
    expect(remnantFateFromInitialMass(25)).toBe("black hole");
    expect(remnantFateFromInitialMass(120)).toBe("black hole");
  });
});
