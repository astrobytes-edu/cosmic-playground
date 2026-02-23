import { describe, expect, it } from "vitest";
import { DopplerShiftModel } from "@cosmic/physics";
import {
  DEFAULT_SPECTRUM_DOMAIN,
  REDSHIFT_SLIDER_MIN,
  VELOCITY_SLIDER_MAX_KM_S,
  buildChallengeEvidenceText,
  buildDopplerExportPayload,
  buildRepresentativeLineRuleText,
  centerDomainOnLines,
  computeRegimeThresholdMarkers,
  createSeededRandom,
  isMysteryCopyLocked,
  pickChallengeTarget,
  redshiftSliderStep,
  selectDisplayLines,
  selectRepresentativeLine,
  syncPhysicalFromRedshift,
  syncPhysicalFromVelocity,
  velocitySliderIsClamped,
  type ChallengeTarget,
  type SpectrumLine,
} from "./logic";

describe("Doppler Shift demo logic", () => {
  describe("coupled velocity/z state", () => {
    it("computes relativistic z from velocity", () => {
      const synced = syncPhysicalFromVelocity(300);
      expect(synced.velocityKmS).toBeCloseTo(300, 6);
      expect(synced.z).toBeGreaterThan(0);
      expect(synced.z).toBeCloseTo(0.001001, 4);
    });

    it("recovers velocity from relativistic z", () => {
      const synced = syncPhysicalFromRedshift(0.158);
      expect(synced.z).toBeCloseTo(0.158, 6);
      expect(synced.velocityKmS).toBeCloseTo(43_665, 0);
    });

    it("flags velocity slider clamp beyond +/-100000 km/s", () => {
      const highZ = syncPhysicalFromRedshift(2);
      expect(Math.abs(highZ.velocityKmS)).toBeGreaterThan(VELOCITY_SLIDER_MAX_KM_S);
      expect(velocitySliderIsClamped(highZ.velocityKmS)).toBe(true);
    });

    it("clamps redshift to slider bounds", () => {
      const synced = syncPhysicalFromRedshift(-0.95);
      expect(synced.z).toBeCloseTo(REDSHIFT_SLIDER_MIN, 6);
    });
  });

  describe("redshift slider steps", () => {
    it("uses fine step for |z| < 0.5", () => {
      expect(redshiftSliderStep(0.3)).toBe(0.001);
    });

    it("uses medium step for 0.5 <= |z| < 3", () => {
      expect(redshiftSliderStep(1.2)).toBe(0.01);
    });

    it("uses coarse step for |z| >= 3", () => {
      expect(redshiftSliderStep(5)).toBe(0.1);
    });
  });

  describe("regime marker boundaries", () => {
    it("solves asymmetric 5% divergence boundaries in redshift space", () => {
      const markers = computeRegimeThresholdMarkers({ thresholdPercent: 5 });
      expect(markers.thresholdPercent).toBe(5);
      expect(markers.blueZ).toBeLessThan(0);
      expect(markers.redZ).toBeGreaterThan(0);
      expect(markers.blueVelocityKmS).toBeLessThan(0);
      expect(markers.redVelocityKmS).toBeGreaterThan(0);

      const blueDivergence = DopplerShiftModel.formulaDivergencePercent(markers.blueVelocityKmS);
      const redDivergence = DopplerShiftModel.formulaDivergencePercent(markers.redVelocityKmS);
      expect(Math.abs(blueDivergence - 5)).toBeLessThan(0.1);
      expect(Math.abs(redDivergence - 5)).toBeLessThan(0.1);
    });
  });

  describe("line selection", () => {
    const lines: SpectrumLine[] = [
      { wavelengthNm: 440.5, relativeIntensity: 0.55, label: "A" },
      { wavelengthNm: 438.4, relativeIntensity: 0.7, label: "B" },
      { wavelengthNm: 516.7, relativeIntensity: 0.65, label: "C" },
      { wavelengthNm: 527.0, relativeIntensity: 0.6, label: "D" },
      { wavelengthNm: 532.8, relativeIntensity: 0.75, label: "E" },
      { wavelengthNm: 595.7, relativeIntensity: 0.29, label: "F" },
      { wavelengthNm: 613.7, relativeIntensity: 0.27, label: "G" },
      { wavelengthNm: 621.9, relativeIntensity: 0.24, label: "H" },
      { wavelengthNm: 649.5, relativeIntensity: 0.2, label: "I" },
      { wavelengthNm: 667.8, relativeIntensity: 0.18, label: "J" },
    ];

    it("selects strongest line with wavelength tie-break", () => {
      const representative = selectRepresentativeLine([
        { wavelengthNm: 589.6, relativeIntensity: 1, label: "Na D1" },
        { wavelengthNm: 589.0, relativeIntensity: 1, label: "Na D2" },
      ]);
      expect(representative?.label).toBe("Na D2");
    });

    it("can prefer strongest visible line over stronger UV line", () => {
      const representative = selectRepresentativeLine(
        [
          { wavelengthNm: 121.6, relativeIntensity: 1.0, label: "Ly-alpha" },
          { wavelengthNm: 656.3, relativeIntensity: 0.95, label: "H-alpha" },
        ],
        { preferVisible: true },
      );
      expect(representative?.label).toBe("H-alpha");
    });

    it("keeps strongest 8 by default", () => {
      const display = selectDisplayLines({ lines, densityMode: "strongest-8" });
      expect(display).toHaveLength(8);
      expect(display.some((line) => line.label === "E")).toBe(true);
      expect(display.some((line) => line.label === "J")).toBe(false);
    });

    it("returns all lines when density mode is all", () => {
      const display = selectDisplayLines({ lines, densityMode: "all" });
      expect(display).toHaveLength(lines.length);
    });
  });

  describe("domain helpers", () => {
    it("centers domain around lines with padding and clamping", () => {
      const centered = centerDomainOnLines({
        linesNm: [640, 656.3, 668.5],
        currentDomain: { ...DEFAULT_SPECTRUM_DOMAIN },
      });
      expect(centered.minNm).toBeGreaterThanOrEqual(DEFAULT_SPECTRUM_DOMAIN.minNm);
      expect(centered.maxNm).toBeLessThanOrEqual(DEFAULT_SPECTRUM_DOMAIN.maxNm);
      expect(centered.maxNm - centered.minNm).toBeCloseTo(
        DEFAULT_SPECTRUM_DOMAIN.maxNm - DEFAULT_SPECTRUM_DOMAIN.minNm,
        6,
      );
    });
  });

  describe("challenge helpers", () => {
    it("seeded random is deterministic", () => {
      const a = createSeededRandom("doppler-seed");
      const b = createSeededRandom("doppler-seed");
      expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it("pickChallengeTarget avoids immediate repeat", () => {
      const targets: ChallengeTarget[] = [
        { element: "H", mode: "emission", velocityKmS: 300, z: 0.001 },
        { element: "Na", mode: "absorption", velocityKmS: -300, z: -0.001 },
      ];
      const random = () => 0;
      const picked = pickChallengeTarget({
        targets,
        random,
        previous: targets[0],
      });
      expect(picked).toEqual(targets[1]);
    });
  });

  describe("mystery copy lock", () => {
    it("locks copy when mystery is active and unrevealed", () => {
      expect(isMysteryCopyLocked({ mysteryActive: true, mysteryRevealed: false })).toBe(true);
      expect(isMysteryCopyLocked({ mysteryActive: false, mysteryRevealed: false })).toBe(false);
      expect(isMysteryCopyLocked({ mysteryActive: true, mysteryRevealed: true })).toBe(false);
    });
  });

  describe("representative-line helper", () => {
    it("explains visible-first anchoring when visible lines exist", () => {
      const text = buildRepresentativeLineRuleText({ hasVisibleRepresentative: true });
      expect(text).toContain("strongest visible rest line (380-750 nm)");
      expect(text).toContain("all selected lines still shift");
    });

    it("explains fallback behavior when no visible lines exist", () => {
      const text = buildRepresentativeLineRuleText({ hasVisibleRepresentative: false });
      expect(text).toContain("no lines fall in the visible window");
      expect(text).toContain("strongest overall rest line");
    });
  });

  describe("challenge evidence copy text", () => {
    it("includes guess/target/outcome and debrief readouts", () => {
      const text = buildChallengeEvidenceText({
        checkedAtIso: "2026-02-23T12:00:00.000Z",
        guessedElement: "Na",
        guessedMode: "absorption",
        targetElement: "H",
        targetMode: "emission",
        correct: false,
        formulaMode: "relativistic",
        radialVelocityKmS: 43_665,
        redshift: 0.158,
        representativeLineLabel: "H-alpha 656.3",
        lambdaObsNm: 760.0,
        deltaLambdaNm: 103.7,
        regimeLabel: "relativistic",
        divergencePercent: 11.3,
      });

      expect(text).toContain("Outcome: Incorrect");
      expect(text).toContain("Guess: Na (Absorption)");
      expect(text).toContain("Target: H (Emission)");
      expect(text).toContain("Formula applied: Relativistic");
      expect(text).toContain("Representative line: H-alpha 656.3");
      expect(text).toContain("NR divergence (%):");
      expect(text).toContain("Claim + evidence + why formula choice");
    });
  });

  describe("export payload", () => {
    it("includes required context fields and model notes", () => {
      const payload = buildDopplerExportPayload({
        timestampIso: "2026-02-23T00:00:00.000Z",
        radialVelocityKmS: 300,
        redshift: 0.001,
        element: "H",
        formulaMode: "relativistic",
        spectrumMode: "emission",
        lineDensityMode: "strongest-8",
        lambdaRestNm: 656.281,
        lambdaObsNm: 656.938,
        deltaLambdaNm: 0.657,
        nuRestTHz: 456.805,
        nuObsTHz: 456.348,
        deltaNuTHz: -0.457,
        regimeLabel: "non-relativistic",
        divergencePercent: 0.01,
        zNonRel: 0.001,
        zRel: 0.001001,
        representativeLineLabel: "H-alpha 656.3",
        wavelengthBand: "Visible (red)",
        domainMinNm: 80,
        domainMaxNm: 2200,
        challengeState: "inactive",
      });

      expect(payload.version).toBe(1);
      expect(payload.parameters.map((row) => row.name)).toContain("Radial velocity (km/s)");
      expect(payload.parameters.map((row) => row.name)).toContain("Formula");
      expect(payload.readouts.map((row) => row.name)).toContain("Observed wavelength (nm)");
      expect(payload.readouts.map((row) => row.name)).toContain("NR divergence (%)");
      expect(payload.notes.some((note) => note.includes("Non-relativistic"))).toBe(true);
      expect(payload.notes.some((note) => note.includes("Relativistic"))).toBe(true);
    });
  });
});
