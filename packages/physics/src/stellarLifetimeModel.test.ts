import { describe, expect, it } from "vitest";
import {
  bMinusVFromTemperatureK,
  mainSequenceLifetimeMyr,
  postMainSequenceTrack,
  remnantFateFromInitialMass,
  spectralTypeFromTemperature,
  totalLifetimeMyr,
  whiteDwarfMassMsun
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

/* ── Post-main-sequence track ────────────────────────────────────────────────
 * The track is schematic, so these are shape and sanity checks against published
 * numbers, not a fit. What they defend is that raising a cluster's age produces a giant
 * branch of roughly the right size in roughly the right place -- the thing a bare
 * zero-age main sequence cannot show. */

const zams = (massMsun: number) => {
  const input = { massMsun, metallicityZ: 0.02, extrapolateAboveMassCeiling: true };
  return {
    zamsLuminosityLsun: ZamsTout1996Model.luminosityLsunFromMassMetallicity(input),
    zamsTemperatureK: ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity(input)
  };
};

const atFraction = (massMsun: number, fraction: number) => {
  const start = mainSequenceLifetimeMyr(massMsun);
  const end = totalLifetimeMyr(massMsun);
  return postMainSequenceTrack({
    massMsun,
    ageMyr: start + fraction * (end - start),
    ...zams(massMsun)
  });
};

describe("total lifetime", () => {
  it("is longer than the main-sequence lifetime, but not by much", () => {
    for (const massMsun of [0.5, 1, 3, 10, 40]) {
      const ms = mainSequenceLifetimeMyr(massMsun);
      const total = totalLifetimeMyr(massMsun);
      expect(total).toBeGreaterThan(ms);
      // Post-main-sequence phases are a modest fraction of a star's life, not a doubling.
      expect(total / ms).toBeLessThan(1.3);
    }
  });

  it("puts the Sun's total life near 12 Gyr", () => {
    const gyr = totalLifetimeMyr(1) / 1000;
    expect(gyr).toBeGreaterThan(10);
    expect(gyr).toBeLessThan(15);
  });
});

describe("post-main-sequence track", () => {
  it("returns null on the main sequence", () => {
    expect(postMainSequenceTrack({ massMsun: 1, ageMyr: 100, ...zams(1) })).toBeNull();
  });

  it("leaves a white dwarf below the 8 Msun line and nothing above it", () => {
    // A low-mass star does not vanish when it stops burning: it becomes a white dwarf and
    // cools for the rest of the age of the universe. Above 8 Msun the remnant is a
    // neutron star or a black hole, which has no photosphere to place on an HR diagram.
    const lowMass = postMainSequenceTrack({ massMsun: 1, ageMyr: 1e9, ...zams(1) });
    expect(lowMass?.stage).toBe("white-dwarf");
    expect(postMainSequenceTrack({ massMsun: 20, ageMyr: 1e9, ...zams(20) })).toBeNull();
  });

  it("crosses the Hertzsprung gap before reaching the giant branch", () => {
    // The gap is bounded by two Hurley quantities, t_MS and t_BGB, so it is narrow --
    // which is why a real HR diagram shows almost nothing between the two.
    const start = postMainSequenceTrack({
      massMsun: 1,
      ageMyr: mainSequenceLifetimeMyr(1) * 1.0001,
      ...zams(1)
    });
    expect(start?.stage).toBe("hertzsprung-gap");
    expect(atFraction(1, 0.9)?.stage).toBe("giant");
  });

  it("cools and swells monotonically along the branch", () => {
    let previousTemperature = Infinity;
    let previousRadius = 0;
    for (const fraction of [0.2, 0.4, 0.6, 0.8, 0.99]) {
      const point = atFraction(1, fraction);
      expect(point).not.toBeNull();
      expect(point!.temperatureK).toBeLessThan(previousTemperature);
      expect(point!.radiusRsun).toBeGreaterThan(previousRadius);
      previousTemperature = point!.temperatureK;
      previousRadius = point!.radiusRsun;
    }
  });

  it("puts the tip of a solar-mass red giant branch near the observed values", () => {
    // Observed: L ~ 2500 Lsun, Teff ~ 3100 K, R ~ 170 Rsun at the RGB tip. The tip
    // luminosity is nearly mass-independent below 2 Msun because it is set by the
    // degenerate helium core mass at the flash, which is why it works as a distance
    // indicator -- so it is worth pinning rather than leaving to drift.
    const tip = atFraction(1, 0.999);
    expect(tip!.luminosityLsun).toBeGreaterThan(1500);
    expect(tip!.luminosityLsun).toBeLessThan(4000);
    expect(tip!.temperatureK).toBeGreaterThan(2900);
    expect(tip!.temperatureK).toBeLessThan(3600);
    expect(tip!.radiusRsun).toBeGreaterThan(110);
    expect(tip!.radiusRsun).toBeLessThan(230);
  });

  it("gives the tip a nearly mass-independent luminosity below 2 Msun", () => {
    const light = atFraction(0.9, 0.999)!.luminosityLsun;
    const heavy = atFraction(1.8, 0.999)!.luminosityLsun;
    expect(Math.abs(Math.log10(heavy / light))).toBeLessThan(0.2);
  });

  it("makes a 20 Msun star a red supergiant, not a brighter blue one", () => {
    const point = atFraction(20, 0.6)!;
    expect(point.temperatureK).toBeLessThan(4000);
    // Betelgeuse, about this mass: R ~ 900 Rsun, L ~ 1e5 Lsun.
    expect(point.radiusRsun).toBeGreaterThan(300);
    expect(point.luminosityLsun).toBeGreaterThan(5e4);
  });

  it("keeps luminosity, radius and temperature consistent with Stefan-Boltzmann", () => {
    for (const massMsun of [0.9, 2.5, 15]) {
      const point = atFraction(massMsun, 0.5)!;
      const implied = point.radiusRsun ** 2 * (point.temperatureK / 5772) ** 4;
      expect(implied).toBeCloseTo(point.luminosityLsun, -Math.log10(point.luminosityLsun) + 2);
    }
  });

  it("refuses to place a star it has no zero-age point for", () => {
    expect(
      postMainSequenceTrack({
        massMsun: 1,
        ageMyr: 1.2e4,
        zamsLuminosityLsun: Number.NaN,
        zamsTemperatureK: Number.NaN
      })
    ).toBeNull();
  });
});

describe("white dwarfs", () => {
  const wdAt = (initialMassMsun: number, coolingMyr: number) =>
    postMainSequenceTrack({
      massMsun: initialMassMsun,
      ageMyr: totalLifetimeMyr(initialMassMsun) + coolingMyr,
      ...zams(initialMassMsun)
    });

  it("follows the Cummings (2018) initial-final mass relation", () => {
    // Their three linear segments, spot-checked against the published fits.
    expect(whiteDwarfMassMsun(1)).toBeCloseTo(0.569, 3);
    expect(whiteDwarfMassMsun(3)).toBeCloseTo(0.745, 3);
    expect(whiteDwarfMassMsun(5)).toBeCloseTo(1.006, 3);
    // Nothing lighter than a helium white dwarf, nothing above Chandrasekhar.
    expect(whiteDwarfMassMsun(0.5)).toBeGreaterThanOrEqual(0.5);
    expect(whiteDwarfMassMsun(50)).toBeLessThanOrEqual(1.38);
  });

  it("cools along a sequence rather than sitting at one temperature", () => {
    // The defect this replaced: the previous implementation clamped its cooling phase to
    // exactly 1, so EVERY white dwarf came out at 15,400 K -- a cooling sequence that was
    // a single point, in a demo that asks the reader to identify it as a structure.
    const temperatures = [1, 10, 100, 1000, 5000].map((t) => wdAt(1, t)!.temperatureK);
    for (let i = 1; i < temperatures.length; i += 1) {
      expect(temperatures[i]).toBeLessThan(temperatures[i - 1]);
    }
    expect(temperatures[0]).toBeGreaterThan(40_000);
    expect(temperatures[temperatures.length - 1]).toBeLessThan(6000);
  });

  it("holds its radius while it cools, which is what makes it a sequence", () => {
    // Degeneracy pressure does not depend on temperature, so the star does not contract.
    const radii = [1, 100, 5000].map((t) => wdAt(1, t)!.radiusRsun);
    for (const r of radii) expect(r).toBeCloseTo(radii[0], 12);
    // A 0.57 Msun white dwarf is about an Earth radius: 0.0125 Rsun is 1.4 Earth radii.
    expect(radii[0]).toBeGreaterThan(0.008);
    expect(radii[0]).toBeLessThan(0.02);
  });

  it("stops at the observed luminosity-function cutoff, not at absolute zero", () => {
    // The galactic disk is only about 10 Gyr old, so nothing has cooled below ~3,900 K.
    const ancient = wdAt(1, 200_000)!;
    expect(ancient.temperatureK).toBeGreaterThanOrEqual(3900);
    expect(ancient.temperatureK).toBeLessThan(4100);
  });

  it("keeps L, R and T consistent so a reader can infer the radius back", () => {
    for (const cooling of [10, 1000, 20_000]) {
      const wd = wdAt(1, cooling)!;
      const implied = wd.radiusRsun ** 2 * (wd.temperatureK / 5772) ** 4;
      expect(implied / wd.luminosityLsun).toBeCloseTo(1, 6);
    }
  });

  it("leaves no white dwarf above the 8 Msun line", () => {
    for (const massMsun of [8, 12, 25, 60]) {
      expect(wdAt(massMsun, 1000)).toBeNull();
    }
    expect(wdAt(7.9, 1000)?.stage).toBe("white-dwarf");
  });
});

describe("supergiants", () => {
  it("names a post-main-sequence star above 8 Msun a supergiant", () => {
    const at = (massMsun: number) =>
      postMainSequenceTrack({
        massMsun,
        ageMyr: totalLifetimeMyr(massMsun) * 0.98,
        ...zams(massMsun)
      })?.stage;
    expect(at(5)).toBe("giant");
    expect(at(10)).toBe("supergiant");
    expect(at(25)).toBe("supergiant");
  });
});

describe("colour", () => {
  it("reproduces the anchors it is built from", () => {
    // Pecaut & Mamajek's dwarf sequence, spot-checked at both ends and at the Sun.
    expect(bMinusVFromTemperatureK(5770)).toBeCloseTo(0.65, 3);
    expect(bMinusVFromTemperatureK(9800)).toBeCloseTo(0.0, 3);
    expect(bMinusVFromTemperatureK(3850)).toBeCloseTo(1.42, 3);
    expect(bMinusVFromTemperatureK(42000)).toBeCloseTo(-0.33, 3);
  });

  it("gets the Sun right, which is the one value everyone checks", () => {
    // B-V = 0.65 for the Sun is the number an instructor will look for first.
    expect(bMinusVFromTemperatureK(5772)).toBeGreaterThan(0.64);
    expect(bMinusVFromTemperatureK(5772)).toBeLessThan(0.66);
  });

  it("reddens monotonically as a star cools", () => {
    let previous = -Infinity;
    for (const t of [42000, 20000, 10000, 7000, 5772, 4500, 3500, 2500]) {
      const bv = bMinusVFromTemperatureK(t);
      expect(bv).toBeGreaterThan(previous);
      previous = bv;
    }
  });

  it("keeps cool dwarfs off the red edge, where Ballesteros extrapolated them", () => {
    // The 0.1 Msun ZAMS floor is 2,812 K. Inverting Ballesteros put it at B-V = 2.37;
    // no real M dwarf is redder than about 2.2, and the empirical sequence says 1.91.
    const coolest = bMinusVFromTemperatureK(2812);
    expect(coolest).toBeGreaterThan(1.8);
    expect(coolest).toBeLessThan(2.0);
  });

  it("never returns a colour bluer than a real O star", () => {
    // Ballesteros could not reach past 21,707 K and returned its bracket endpoint of
    // -0.4, which is bluer than anything on the main sequence.
    for (const t of [22000, 30000, 42000, 100000]) {
      expect(bMinusVFromTemperatureK(t)).toBeGreaterThanOrEqual(-0.33);
    }
  });

  it("stays inside the tabulated range at both ends", () => {
    expect(bMinusVFromTemperatureK(1000)).toBeCloseTo(2.15, 3);
    expect(bMinusVFromTemperatureK(1e6)).toBeCloseTo(-0.33, 3);
    expect(Number.isNaN(bMinusVFromTemperatureK(0))).toBe(true);
  });
});
