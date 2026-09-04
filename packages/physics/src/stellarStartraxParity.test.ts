import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ZamsTout1996Model } from "./zamsTout1996Model";
import { mainSequenceLifetimeMyr } from "./stellarLifetimeModel";

/**
 * Parity against startrax.
 *
 * Everything else in this package checks itself: known-answer tests written from the same
 * papers the implementation was written from, round-trips, monotonicity. Those catch
 * typos. They cannot catch a shared misreading -- if the coefficient table was
 * transcribed wrong, the test written beside it is wrong in the same way.
 *
 * This file is the external gate. `__fixtures__/stellar-startrax.json` is a committed
 * dump of startrax's own Tout (1996) ZAMS and Hurley (2000) main-sequence lifetime at ten
 * masses from 0.1 to 100 Msun, solar metallicity. startrax is an independent
 * implementation in another language, so agreeing with it to a part in a thousand means
 * the two got there separately.
 *
 * The physics review for cluster-census named the absence of these fixtures as its single
 * largest gap: "porting physics without them discards most of the reason to trust it".
 * This closes that.
 *
 * The fixture is generated, not authored. Do not hand-edit it to make a test pass; a
 * disagreement here means one of the two implementations is wrong, and it is worth
 * finding out which before changing anything.
 */

interface StartraxRow {
  /** Mass [Msun]. */
  m: number;
  /** ZAMS luminosity [Lsun]. */
  L: number;
  /** ZAMS radius [Rsun]. */
  R: number;
  /** ZAMS effective temperature [K]. */
  Teff: number;
  /** Main-sequence lifetime [Myr]. */
  tMS_Myr: number;
}

const fixture = JSON.parse(
  readFileSync(path.resolve(__dirname, "__fixtures__/stellar-startrax.json"), "utf-8")
) as { _meta: { source: string; Z: number }; rows: StartraxRow[] };

/** Same tolerance the upstream harness uses: a part in a thousand, relative. */
const TOLERANCE = 1e-3;

const relativeError = (got: number, want: number) => Math.abs(got - want) / Math.abs(want);

describe("startrax parity", () => {
  const metallicityZ = fixture._meta.Z;

  it("uses the fixture as generated, at solar metallicity", () => {
    expect(fixture._meta.source).toMatch(/^startrax /);
    expect(metallicityZ).toBe(0.02);
    expect(fixture.rows).toHaveLength(10);
    expect(fixture.rows.map((r) => r.m)).toEqual([
      0.1, 0.3, 1, 2, 5, 10, 20, 40, 60, 100
    ]);
  });

  for (const row of fixture.rows) {
    describe(`${row.m} Msun`, () => {
      const input = { massMsun: row.m, metallicityZ };

      it("reproduces the ZAMS luminosity", () => {
        const got = ZamsTout1996Model.luminosityLsunFromMassMetallicity(input);
        expect(relativeError(got, row.L), `L: ${got} vs ${row.L}`).toBeLessThanOrEqual(
          TOLERANCE
        );
      });

      it("reproduces the ZAMS radius", () => {
        const got = ZamsTout1996Model.radiusRsunFromMassMetallicity(input);
        expect(relativeError(got, row.R), `R: ${got} vs ${row.R}`).toBeLessThanOrEqual(
          TOLERANCE
        );
      });

      it("reproduces the ZAMS effective temperature", () => {
        const got = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity(input);
        expect(
          relativeError(got, row.Teff),
          `Teff: ${got} vs ${row.Teff}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it("reproduces the main-sequence lifetime", () => {
        const got = mainSequenceLifetimeMyr(row.m);
        expect(
          relativeError(got, row.tMS_Myr),
          `tMS: ${got} vs ${row.tMS_Myr} Myr`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    });
  }

  it("agrees at both ends of the fitted range, not just the middle", () => {
    // The ends are where a transcription error in the high-order coefficients shows up,
    // and where a fit is most likely to have been extended past what it supports.
    for (const row of [fixture.rows[0], fixture.rows[fixture.rows.length - 1]]) {
      const input = { massMsun: row.m, metallicityZ };
      expect(
        relativeError(ZamsTout1996Model.luminosityLsunFromMassMetallicity(input), row.L)
      ).toBeLessThanOrEqual(TOLERANCE);
      expect(relativeError(mainSequenceLifetimeMyr(row.m), row.tMS_Myr)).toBeLessThanOrEqual(
        TOLERANCE
      );
    }
  });
});

/**
 * One source of truth.
 *
 * Both star demos have to agree about the physics they share. They did not: this package
 * carried the Hurley (2000) main-sequence lifetime AND a private `10 * M^-2.5` inside the
 * HR population model, and the two disagree by a factor of 33 at 100 Msun. A student
 * moving between cluster-census and stars-zams-hr would have been told two different
 * answers to "when does this star die".
 *
 * These tests make the shared ownership executable rather than a convention.
 */
describe("shared physics ownership", () => {
  it("routes every main-sequence lifetime through the Hurley relation", async () => {
    const source = readFileSync(
      path.resolve(__dirname, "hrInferencePopulationModel.ts"),
      "utf-8"
    );
    expect(source).toContain('from "./stellarLifetimeModel"');
    // The classroom shortcut must not reappear as a private copy.
    expect(source).not.toMatch(/10\s*\*\s*massMsun\s*\*\*\s*-2\.5/);
  });

  it("gives the same lifetime whichever model asks for it", async () => {
    const { generatePopulation } = await import("./hrInferencePopulationModel");
    const { sampleStarCluster } = await import("./starClusterModel");
    // A cluster old enough that the turnoff is well inside the fitted range.
    const cluster = sampleStarCluster({
      seed: "agreement",
      starCount: 400,
      imf: "maschberger",
      profile: { kind: "plummer", scaleRadiusPc: 1 },
      ageMyr: 11_000
    });
    const population = generatePopulation({
      N: 1,
      seed: "agreement",
      distancePc: 100,
      photErr: 0
    });
    expect(population).toHaveLength(1);

    // The cluster model stores the lifetime it used; it must be the Hurley value.
    for (const star of cluster.stars.slice(0, 40)) {
      expect(star.mainSequenceLifetimeMyr).toBeCloseTo(
        mainSequenceLifetimeMyr(star.massMsun),
        6
      );
    }
  });

  it("keeps the ZAMS fits in one place", () => {
    for (const file of ["starClusterModel.ts", "hrInferencePopulationModel.ts"]) {
      const source = readFileSync(path.resolve(__dirname, file), "utf-8");
      expect(source, file).toContain("ZamsTout1996Model");
      // No demo-side re-implementation of the Tout polynomials.
      expect(source, file).not.toMatch(/const\s+TOUT_[A-Z]|zamsCoefficients/);
    }
  });
});
