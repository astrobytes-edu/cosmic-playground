import { describe, expect, it } from "vitest";
import { HYDROGEN_BURNING_MIN_MSUN, IMF_MAX_MSUN } from "./initialMassFunctionModel";
import { MAX_CLUSTER_STARS, sampleStarCluster } from "./starClusterModel";
import type { StarClusterOptions } from "./starClusterModel";

const BASE: StarClusterOptions = {
  seed: "unit-test",
  starCount: 500,
  imf: "maschberger",
  profile: { kind: "plummer", scaleRadiusPc: 1 }
};

describe("sampleStarCluster", () => {
  it("returns the requested number of stars", () => {
    expect(sampleStarCluster(BASE).stars).toHaveLength(500);
  });

  it("is deterministic for the same seed", () => {
    const a = sampleStarCluster(BASE);
    const b = sampleStarCluster(BASE);
    expect(b.stars).toEqual(a.stars);
  });

  it("gives a different cluster for a different seed", () => {
    const a = sampleStarCluster(BASE);
    const b = sampleStarCluster({ ...BASE, seed: "another" });
    expect(b.stars[0].massMsun).not.toBe(a.stars[0].massMsun);
    expect(b.stars[0].positionPc).not.toEqual(a.stars[0].positionPc);
  });

  it("keeps every mass inside the requested limits", () => {
    const { stars } = sampleStarCluster({ ...BASE, starCount: 5000 });
    for (const star of stars) {
      expect(star.massMsun).toBeGreaterThanOrEqual(HYDROGEN_BURNING_MIN_MSUN);
      expect(star.massMsun).toBeLessThanOrEqual(IMF_MAX_MSUN);
    }
  });

  it("changing the IMF moves the masses but leaves the positions untouched", () => {
    // The reason masses and positions draw from separate named sub-streams. Without it,
    // switching law would silently rearrange the cluster in space too, and a student
    // comparing two laws would be looking at two different clusters.
    const maschberger = sampleStarCluster(BASE);
    const kroupa = sampleStarCluster({ ...BASE, imf: "kroupa" });

    expect(kroupa.stars.map((s) => s.positionPc)).toEqual(
      maschberger.stars.map((s) => s.positionPc)
    );
    expect(kroupa.stars.map((s) => s.massMsun)).not.toEqual(
      maschberger.stars.map((s) => s.massMsun)
    );
  });

  it("changing the profile moves the positions but leaves the masses untouched", () => {
    const plummer = sampleStarCluster(BASE);
    const eff = sampleStarCluster({
      ...BASE,
      profile: { kind: "eff", scaleRadiusPc: 1, gamma: 3 }
    });
    expect(eff.stars.map((s) => s.massMsun)).toEqual(plummer.stars.map((s) => s.massMsun));
    expect(eff.stars.map((s) => s.positionPc)).not.toEqual(
      plummer.stars.map((s) => s.positionPc)
    );
  });

  it("has no remnants at zero age", () => {
    const cluster = sampleStarCluster({ ...BASE, starCount: 2000, ageMyr: 0 });
    expect(cluster.remnantCount).toBe(0);
    for (const star of cluster.stars) expect(star.phase).not.toBe("remnant");
  });

  it("gives every in-domain star a finite luminosity and temperature", () => {
    const cluster = sampleStarCluster({ ...BASE, starCount: 5000, ageMyr: 0 });
    const plottable = cluster.stars.filter((s) => s.phase === "main-sequence");
    expect(plottable.length).toBe(cluster.mainSequenceCount);
    expect(plottable.length).toBeGreaterThan(0);
    for (const star of plottable) {
      expect(Number.isFinite(star.luminosityLsun)).toBe(true);
      expect(star.luminosityLsun).toBeGreaterThan(0);
      expect(star.temperatureK).toBeGreaterThan(0);
      expect(star.stellarRadiusRsun).toBeGreaterThan(0);
      expect(star.remnant).toBeNull();
    }
  });

  it("marks sub-0.1 Msun stars as outside the model range instead of clamping them", () => {
    // The Tout (1996) fits are valid on [0.1, 100] Msun; the IMF starts at the
    // hydrogen-burning limit of 0.08. Those stars are real and are counted, but they get
    // no HR point, because clamping them to 0.1 would build a spike out of a tenth of
    // the population and present it as data.
    const cluster = sampleStarCluster({ ...BASE, starCount: 5000, ageMyr: 0 });
    expect(cluster.outsideModelCount).toBeGreaterThan(0);

    const outside = cluster.stars.filter((s) => s.phase === "outside-model-range");
    expect(outside.length).toBe(cluster.outsideModelCount);
    for (const star of outside) {
      // Only the low end now: masses above the Tout ceiling are extrapolated, not dropped.
      expect(star.massMsun).toBeLessThan(0.1);
      expect(star.luminosityLsun).toBe(0);
      expect(star.temperatureK).toBe(0);
    }

    // They still have mass and a place in the cluster.
    for (const star of outside) {
      expect(star.massMsun).toBeGreaterThan(0);
      expect(Number.isFinite(star.radiusPc)).toBe(true);
    }
  });

  it("never emits a non-finite luminosity, temperature or radius", () => {
    // The guard for the failure this model was built through: two correct models with
    // different validity domains, composed without checking.
    for (const ageMyr of [0, 10, 1000, 12_000]) {
      const cluster = sampleStarCluster({ ...BASE, starCount: 5000, ageMyr });
      for (const star of cluster.stars) {
        expect(Number.isFinite(star.luminosityLsun)).toBe(true);
        expect(Number.isFinite(star.temperatureK)).toBe(true);
        expect(Number.isFinite(star.stellarRadiusRsun)).toBe(true);
        expect(Number.isFinite(star.massMsun)).toBe(true);
        expect(Number.isFinite(star.mainSequenceLifetimeMyr)).toBe(true);
      }
    }
  });

  it("accounts for every star in exactly one category", () => {
    for (const ageMyr of [0, 100, 5000]) {
      const cluster = sampleStarCluster({ ...BASE, starCount: 3000, ageMyr });
      expect(
        cluster.mainSequenceCount +
          cluster.postMainSequenceCount +
          cluster.remnantCount +
          cluster.outsideModelCount
      ).toBe(cluster.stars.length);
    }
  });

  it("burns the massive stars off first as the cluster ages", () => {
    // The turnoff, expressed as a monotone count.
    const young = sampleStarCluster({ ...BASE, starCount: 20_000, ageMyr: 10 });
    const middle = sampleStarCluster({ ...BASE, starCount: 20_000, ageMyr: 100 });
    const old = sampleStarCluster({ ...BASE, starCount: 20_000, ageMyr: 1000 });

    expect(young.remnantCount).toBeLessThan(middle.remnantCount);
    expect(middle.remnantCount).toBeLessThan(old.remnantCount);

    // Everything still shining must outlive the cluster; everything dead must not.
    for (const [cluster, age] of [[young, 10], [middle, 100], [old, 1000]] as const) {
      for (const star of cluster.stars) {
        if (star.phase === "main-sequence") {
          expect(star.mainSequenceLifetimeMyr).toBeGreaterThan(age);
        } else if (star.phase === "remnant") {
          expect(star.mainSequenceLifetimeMyr).toBeLessThanOrEqual(age);
          expect(star.remnant).not.toBeNull();
          expect(star.luminosityLsun).toBe(0);
        }
      }
    }
  });

  it("gives remnants of the right kind for their initial mass", () => {
    const { stars } = sampleStarCluster({ ...BASE, starCount: 20_000, ageMyr: 5000 });
    const remnants = stars.filter((s) => s.phase === "remnant");
    expect(remnants.length).toBeGreaterThan(0);
    for (const star of remnants) {
      if (star.massMsun < 8) expect(star.remnant).toBe("white dwarf");
      else if (star.massMsun < 25) expect(star.remnant).toBe("neutron star");
      else expect(star.remnant).toBe("black hole");
    }
  });

  it("reports a half-number radius near the Plummer half-mass radius", () => {
    const cluster = sampleStarCluster({
      ...BASE,
      starCount: 20_000,
      profile: { kind: "plummer", scaleRadiusPc: 2 }
    });
    // Half-NUMBER rather than half-mass, but with masses drawn independently of position
    // the two coincide in expectation: 1.305 * 2 pc.
    expect(cluster.halfNumberRadiusPc).toBeGreaterThan(2.3);
    expect(cluster.halfNumberRadiusPc).toBeLessThan(3.0);
  });

  it("makes the most massive star scatter wildly between seeds in a small cluster", () => {
    // The pedagogical payload. With only a few hundred stars, the top of the mass
    // function is one or two draws, so it is the least reproducible thing on the screen.
    const heaviest = ["a", "b", "c", "d", "e", "f", "g", "h"].map(
      (seed) => sampleStarCluster({ ...BASE, seed, starCount: 300 }).mostMassiveMsun
    );
    const spread = Math.max(...heaviest) / Math.min(...heaviest);
    expect(spread).toBeGreaterThan(1.5);
  });

  it("stabilises the most massive star as the cluster grows", () => {
    const heaviest = ["a", "b", "c", "d", "e", "f", "g", "h"].map(
      (seed) => sampleStarCluster({ ...BASE, seed, starCount: 50_000 }).mostMassiveMsun
    );
    const spread = Math.max(...heaviest) / Math.min(...heaviest);
    expect(spread).toBeLessThan(1.5);
  });

  it("totals the mass over every star including remnants", () => {
    const cluster = sampleStarCluster({ ...BASE, starCount: 1000, ageMyr: 500 });
    const summed = cluster.stars.reduce((acc, s) => acc + s.massMsun, 0);
    expect(cluster.totalMassMsun).toBeCloseTo(summed, 6);
    expect(cluster.remnantCount).toBeGreaterThan(0);
  });

  it("handles degenerate counts without throwing", () => {
    expect(sampleStarCluster({ ...BASE, starCount: 0 }).stars).toHaveLength(0);
    expect(sampleStarCluster({ ...BASE, starCount: 0 }).halfNumberRadiusPc).toBe(0);
    expect(sampleStarCluster({ ...BASE, starCount: -5 }).stars).toHaveLength(0);
    expect(sampleStarCluster({ ...BASE, starCount: 1 }).stars).toHaveLength(1);
  });

  it("caps the star count rather than locking up", () => {
    const cluster = sampleStarCluster({ ...BASE, starCount: MAX_CLUSTER_STARS + 1000 });
    expect(cluster.stars).toHaveLength(MAX_CLUSTER_STARS);
  });

  it("makes a top-heavy slope produce more massive stars", () => {
    const steep = sampleStarCluster({ ...BASE, starCount: 20_000, alphaHigh: 2.8 });
    const shallow = sampleStarCluster({ ...BASE, starCount: 20_000, alphaHigh: 1.8 });
    const above8 = (c: typeof steep) => c.stars.filter((s) => s.massMsun > 8).length;
    expect(above8(shallow)).toBeGreaterThan(above8(steep));
  });

  it("extrapolates above the Tout ceiling rather than dropping the heaviest stars", () => {
    // Cutting these would remove exactly the stars the top-left of the HR diagram is for.
    const cluster = sampleStarCluster({
      ...BASE,
      starCount: 60_000,
      alphaHigh: 1.7,
      ageMyr: 0
    });
    const heavy = cluster.stars.filter((s) => s.massMsun > 100);
    expect(heavy.length).toBeGreaterThan(0);
    for (const star of heavy) {
      expect(star.phase).toBe("main-sequence");
      expect(star.zamsExtrapolated).toBe(true);
      expect(star.luminosityLsun).toBeGreaterThan(1e6);
      expect(star.temperatureK).toBeGreaterThan(40_000);
    }
    expect(cluster.extrapolatedCount).toBe(heavy.length);
  });

  it("does not mark in-domain stars as extrapolated", () => {
    const cluster = sampleStarCluster({ ...BASE, starCount: 3000, ageMyr: 0 });
    for (const star of cluster.stars) {
      if (star.massMsun <= 100) expect(star.zamsExtrapolated).toBe(false);
    }
  });

  it("still refuses to extrapolate below the hydrogen-burning end", () => {
    const cluster = sampleStarCluster({ ...BASE, starCount: 5000, ageMyr: 0 });
    const low = cluster.stars.filter((s) => s.massMsun < 0.1);
    expect(low.length).toBeGreaterThan(0);
    for (const star of low) {
      expect(star.phase).toBe("outside-model-range");
      expect(star.zamsExtrapolated).toBe(false);
    }
  });
});

describe("post-main-sequence stars in a cluster", () => {
  const AGED = { ...BASE, starCount: 4000 };

  it("has none at age zero", () => {
    const cluster = sampleStarCluster({ ...AGED, ageMyr: 0 });
    expect(cluster.postMainSequenceCount).toBe(0);
    expect(cluster.remnantCount).toBe(0);
  });

  it("grows a giant branch as the cluster ages", () => {
    // The regression this guards: stars past the turnoff used to be marked "remnant" and
    // dropped, so ageing a cluster erased the top of the HR diagram instead of bending
    // it into a giant branch. An old cluster with zero giants is the bug coming back.
    for (const ageMyr of [200, 2000, 12000]) {
      const cluster = sampleStarCluster({ ...AGED, ageMyr });
      expect(cluster.postMainSequenceCount).toBeGreaterThan(0);
    }
  });

  it("places giants above and to the right of the turnoff", () => {
    const cluster = sampleStarCluster({ ...AGED, ageMyr: 12000 });
    const giants = cluster.stars.filter((s) => s.phase === "post-main-sequence");
    const mainSequence = cluster.stars.filter((s) => s.phase === "main-sequence");
    const turnoffLuminosity = Math.max(...mainSequence.map((s) => s.luminosityLsun));
    const turnoffTemperature = Math.max(
      ...mainSequence.filter((s) => s.luminosityLsun === turnoffLuminosity).map((s) => s.temperatureK)
    );
    const onTheBranch = giants.filter((s) => s.postMainSequenceStage === "giant");
    expect(onTheBranch.length).toBeGreaterThan(0);
    for (const giant of onTheBranch) {
      expect(giant.luminosityLsun).toBeGreaterThan(turnoffLuminosity);
      expect(giant.temperatureK).toBeLessThan(turnoffTemperature);
    }
  });

  it("gives every giant a stage and every other star none", () => {
    const cluster = sampleStarCluster({ ...AGED, ageMyr: 3000 });
    for (const star of cluster.stars) {
      if (star.phase === "post-main-sequence") {
        expect(star.postMainSequenceStage).not.toBeNull();
        expect(star.luminosityLsun).toBeGreaterThan(0);
        expect(star.temperatureK).toBeGreaterThan(0);
      } else {
        expect(star.postMainSequenceStage).toBeNull();
      }
    }
  });

  it("does not label a giant with a main-sequence spectral type", () => {
    // spectralTypeFromTemperature classifies against the main-sequence sequence and
    // appends luminosity class V. Calling a red giant "K5V" would be a real error.
    const cluster = sampleStarCluster({ ...AGED, ageMyr: 12000 });
    for (const star of cluster.stars) {
      if (star.phase === "post-main-sequence") expect(star.spectralType).toBe("");
    }
  });

  it("keeps ageing monotone: stars leave the main sequence and never return", () => {
    let previousMainSequence = Infinity;
    for (const ageMyr of [0, 50, 500, 5000, 13000]) {
      const cluster = sampleStarCluster({ ...AGED, ageMyr });
      expect(cluster.mainSequenceCount).toBeLessThanOrEqual(previousMainSequence);
      previousMainSequence = cluster.mainSequenceCount;
    }
  });
});
