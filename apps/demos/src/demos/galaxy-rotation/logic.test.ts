import { describe, expect, it } from "vitest";
import {
  RADIAL_PROFILE_SAMPLE_KPC,
  advanceRadiusSweep,
  buildChallengeEvidenceText,
  buildGalaxyRotationExportPayload,
  classifyOuterCurveBehavior,
  createSeededRandom,
  findDarkDominanceRadiusKpc,
  isChallengeCopyLocked,
  pickChallengeTarget,
  type ChallengeTarget,
  type RotationSample,
} from "./logic";

describe("Galaxy Rotation demo logic", () => {
  it("provides the required radial profile sample radii", () => {
    expect(RADIAL_PROFILE_SAMPLE_KPC).toEqual([2, 5, 10, 15, 20, 30, 40, 50]);
  });

  it("detects dark-matter dominance crossing radius", () => {
    const points: RotationSample[] = [
      { radiusKpc: 2, vTotalKmS: 150, vKeplerianKmS: 140, mVisible10: 3.2, mDark10: 0.4, mTotal10: 3.6 },
      { radiusKpc: 5, vTotalKmS: 190, vKeplerianKmS: 165, mVisible10: 4.8, mDark10: 2.1, mTotal10: 6.9 },
      { radiusKpc: 10, vTotalKmS: 218, vKeplerianKmS: 162, mVisible10: 5.1, mDark10: 5.3, mTotal10: 10.4 },
      { radiusKpc: 20, vTotalKmS: 223, vKeplerianKmS: 136, mVisible10: 5.5, mDark10: 14.3, mTotal10: 19.8 },
    ];
    expect(findDarkDominanceRadiusKpc(points)).toBe(10);
  });

  it("classifies outer behavior as flat for halo-dominated profile", () => {
    const points: RotationSample[] = [
      { radiusKpc: 30, vTotalKmS: 214, vKeplerianKmS: 106, mVisible10: 5.7, mDark10: 24.4, mTotal10: 30.1 },
      { radiusKpc: 50, vTotalKmS: 209, vKeplerianKmS: 83, mVisible10: 5.8, mDark10: 41.2, mTotal10: 47.0 },
    ];
    expect(classifyOuterCurveBehavior(points)).toBe("flat");
  });

  it("classifies outer behavior as Keplerian without halo", () => {
    const points: RotationSample[] = [
      { radiusKpc: 30, vTotalKmS: 92, vKeplerianKmS: 92, mVisible10: 5.6, mDark10: 0, mTotal10: 5.6 },
      { radiusKpc: 50, vTotalKmS: 71, vKeplerianKmS: 71, mVisible10: 5.8, mDark10: 0, mTotal10: 5.8 },
    ];
    expect(classifyOuterCurveBehavior(points)).toBe("keplerian");
  });

  it("seeded challenge random generator is deterministic", () => {
    const a = createSeededRandom("galaxy-seed");
    const b = createSeededRandom("galaxy-seed");
    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
  });

  it("pickChallengeTarget avoids immediate repeats", () => {
    const targets: ChallengeTarget[] = [
      { presetId: "milky-way-like", outerBehavior: "flat" },
      { presetId: "no-dark-matter", outerBehavior: "keplerian" },
    ];
    const picked = pickChallengeTarget({
      targets,
      random: () => 0,
      previous: targets[0],
    });
    expect(picked).toEqual(targets[1]);
  });

  it("locks copy while challenge is active and unrevealed", () => {
    expect(isChallengeCopyLocked({ challengeActive: true, challengeRevealed: false })).toBe(true);
    expect(isChallengeCopyLocked({ challengeActive: true, challengeRevealed: true })).toBe(false);
    expect(isChallengeCopyLocked({ challengeActive: false, challengeRevealed: false })).toBe(false);
  });

  it("advances radius sweep and flips direction at bounds", () => {
    const high = advanceRadiusSweep({
      radiusKpc: 49.8,
      minKpc: 0.5,
      maxKpc: 50,
      direction: 1,
      deltaKpc: 0.6,
    });
    expect(high.radiusKpc).toBe(50);
    expect(high.direction).toBe(-1);

    const low = advanceRadiusSweep({
      radiusKpc: 0.7,
      minKpc: 0.5,
      maxKpc: 50,
      direction: -1,
      deltaKpc: 0.4,
    });
    expect(low.radiusKpc).toBe(0.5);
    expect(low.direction).toBe(1);
  });

  it("builds challenge evidence text with debrief context", () => {
    const text = buildChallengeEvidenceText({
      checkedAtIso: "2026-02-23T12:00:00.000Z",
      guessedPresetLabel: "No dark matter",
      guessedOuterBehavior: "keplerian",
      targetPresetLabel: "Milky Way-like",
      targetOuterBehavior: "flat",
      correct: false,
      radiusKpc: 30,
      vTotalKmS: 214,
      vKeplerianKmS: 106,
      darkVisibleRatio: 4.2,
      baryonFraction: 0.19,
      deltaLambda21mm: 0.151,
    });

    expect(text).toContain("Galaxy Rotation — Challenge Evidence");
    expect(text).toContain("Outcome: Incorrect");
    expect(text).toContain("Guess preset: No dark matter");
    expect(text).toContain("Target preset: Milky Way-like");
    expect(text).toContain("Claim + evidence + mechanism");
  });

  it("builds export payload with required parameters, readouts, and notes", () => {
    const payload = buildGalaxyRotationExportPayload({
      timestampIso: "2026-02-23T00:00:00.000Z",
      presetLabel: "Milky Way-like",
      plotMode: "velocity",
      radiusKpc: 10,
      params: {
        bulgeMass10: 0.8,
        bulgeScaleKpc: 0.3,
        diskMass10: 4.3,
        diskScaleLengthKpc: 2.6,
        haloMass10: 110,
        haloScaleRadiusKpc: 21.5,
      },
      derived: {
        concentration: 10.16,
        rVirKpc: 218.4,
      },
      readouts: {
        vTotalKmS: 219.3,
        vKeplerianKmS: 153.2,
        vMondKmS: 179.8,
        mTotal10: 11.2,
        mVisible10: 5.4,
        mDark10: 5.8,
        darkVisRatio: 1.07,
        baryonFraction: 0.48,
        deltaLambda21mm: 0.154,
      },
      challengeState: "inactive",
    });

    expect(payload.version).toBe(1);
    expect(payload.parameters.map((row) => row.name)).toContain("Galaxy model");
    expect(payload.parameters.map((row) => row.name)).toContain("Dark halo mass (10^10 Msun)");
    expect(payload.readouts.map((row) => row.name)).toContain("V_total (km/s)");
    expect(payload.readouts.map((row) => row.name)).toContain("Delta-lambda 21cm (mm)");
    expect(payload.notes.some((note) => note.includes("exact exponential disk"))).toBe(true);
    expect(payload.notes.some((note) => note.includes("MOND"))).toBe(true);
  });
});
