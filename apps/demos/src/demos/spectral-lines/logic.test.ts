import { describe, it, expect } from "vitest";
import {
  clamp,
  formatNumber,
  formatFrequencyReadout,
  formatWavelengthReadout,
  wavelengthToRgbString,
  isVisible,
  compressedOrbitRadius,
  energyLevelY,
  SPECTRUM_DOMAIN,
  wavelengthToFraction,
  transitionLabel,
  shouldRenderEmission,
  filterHydrogenTransitionsBySeries,
  nextSequenceIndex,
  spectrumDomainForSeries,
  selectRepresentativeElementLine,
  classifyInverseMatchQuality,
  inferHydrogenTransitionFromObservedWavelength,
  computeSeriesPileupDensity,
  computeLargeNSpacingApproximation,
  transitionAnnouncement,
  buildSpectralExportPayload,
  createSeededRandom,
  pickMysteryTarget,
  isMysteryCopyLocked,
  isMysteryReflectionReady,
  isHydrogenInferenceContext,
} from "./logic";

describe("Spectral Lines -- UI Logic", () => {
  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max", () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });
  });

  describe("formatNumber", () => {
    it("returns em-dash for NaN", () => {
      expect(formatNumber(NaN)).toBe("\u2014");
    });
    it("returns '0' for zero", () => {
      expect(formatNumber(0)).toBe("0");
    });
    it("uses fixed-point for normal numbers", () => {
      expect(formatNumber(3.14159, 2)).toBe("3.14");
    });
    it("uses scientific notation for very large numbers", () => {
      expect(formatNumber(1.5e7, 3)).toBe("1.50e+7");
    });
    it("uses scientific notation for very small numbers", () => {
      expect(formatNumber(0.00005, 3)).toBe("5.00e-5");
    });
  });

  describe("formatFrequencyReadout", () => {
    it("returns PHz for very high frequencies", () => {
      const r = formatFrequencyReadout(2.47e15);
      expect(r.unit).toBe("PHz");
      expect(Number(r.value)).toBeCloseTo(2.47, 1);
    });
    it("returns x10^14 Hz for Balmer-range frequencies", () => {
      const r = formatFrequencyReadout(4.57e14);
      expect(r.unit).toContain("10");
      expect(r.unit).toContain("Hz");
    });
    it("returns THz for THz range", () => {
      const r = formatFrequencyReadout(5e12);
      expect(r.unit).toBe("THz");
    });
    it("returns em-dash for NaN", () => {
      const r = formatFrequencyReadout(NaN);
      expect(r.value).toBe("\u2014");
    });
  });

  describe("formatWavelengthReadout", () => {
    it("returns nm for visible range", () => {
      const r = formatWavelengthReadout(656.3);
      expect(r.value).toBe("656.3");
      expect(r.unit).toBe("nm");
    });
    it("returns um for near-IR", () => {
      const r = formatWavelengthReadout(1875);
      expect(r.value).toBe("1.9");
      expect(r.unit).toBe("um");
    });
    it("returns em-dash for non-finite", () => {
      expect(formatWavelengthReadout(NaN).value).toBe("\u2014");
    });
  });

  describe("wavelengthToRgbString", () => {
    it("returns reddish for H-alpha (~656 nm)", () => {
      const rgb = wavelengthToRgbString(656);
      expect(rgb).toContain("rgb(255");
    });
    it("returns bluish for ~450 nm", () => {
      const rgb = wavelengthToRgbString(450);
      expect(rgb).toContain("255)");
    });
    it("returns dim violet for UV", () => {
      const rgb = wavelengthToRgbString(100);
      expect(rgb).toContain("120");
    });
    it("returns dim red for IR", () => {
      const rgb = wavelengthToRgbString(2000);
      expect(rgb).toContain("100");
    });
  });

  describe("isVisible", () => {
    it("true for H-alpha (656 nm)", () => {
      expect(isVisible(656)).toBe(true);
    });
    it("false for Ly-alpha (121 nm)", () => {
      expect(isVisible(121)).toBe(false);
    });
    it("false for Pa-alpha (1875 nm)", () => {
      expect(isVisible(1875)).toBe(false);
    });
    it("true at boundaries", () => {
      expect(isVisible(380)).toBe(true);
      expect(isVisible(750)).toBe(true);
    });
  });

  describe("compressedOrbitRadius", () => {
    it("returns minRadius for n=1", () => {
      const r = compressedOrbitRadius({ n: 1, viewSize: 400, nMax: 8 });
      expect(r).toBe(30);
    });
    it("returns maxRadius for n=nMax", () => {
      const r = compressedOrbitRadius({ n: 8, viewSize: 400, nMax: 8 });
      expect(r).toBeCloseTo(140, 0); // (400/2 - 60) = 140
    });
    it("increases monotonically", () => {
      const radii = [1, 2, 3, 4, 5].map(n =>
        compressedOrbitRadius({ n, viewSize: 400, nMax: 5 })
      );
      for (let i = 1; i < radii.length; i++) {
        expect(radii[i]).toBeGreaterThan(radii[i - 1]);
      }
    });
  });

  describe("energyLevelY", () => {
    it("ground state (most negative) is near the bottom", () => {
      const y1 = energyLevelY({ energyEv: -13.6, svgHeight: 400 });
      const y2 = energyLevelY({ energyEv: -3.4, svgHeight: 400 });
      expect(y1).toBeGreaterThan(y2); // lower energy = higher y (further down)
    });
    it("energy near zero is near the top", () => {
      const y = energyLevelY({ energyEv: -0.01, svgHeight: 400 });
      expect(y).toBeLessThan(50); // should be near topPad
    });
  });

  describe("wavelengthToFraction", () => {
    it("returns 0 for minimum wavelength", () => {
      expect(wavelengthToFraction(SPECTRUM_DOMAIN.minNm)).toBeCloseTo(0, 5);
    });
    it("returns 1 for maximum wavelength", () => {
      expect(wavelengthToFraction(SPECTRUM_DOMAIN.maxNm)).toBeCloseTo(1, 5);
    });
    it("clamps below min to 0", () => {
      expect(wavelengthToFraction(10)).toBe(0);
    });
    it("clamps above max to 1", () => {
      expect(wavelengthToFraction(5000)).toBe(1);
    });
    it("H-alpha is roughly in the right fractional position", () => {
      const frac = wavelengthToFraction(656.3);
      expect(frac).toBeGreaterThan(0.1);
      expect(frac).toBeLessThan(0.2);
    });
  });

  describe("transitionLabel", () => {
    it("formats correctly", () => {
      expect(transitionLabel(3, 2)).toBe("n = 3 \u2192 n = 2");
    });
  });

  describe("shared mode behavior", () => {
    it("renders emission for hydrogen when mode is emission", () => {
      expect(shouldRenderEmission({ mode: "emission", viewTab: "hydrogen" })).toBe(true);
    });

    it("renders absorption for elements when mode is absorption", () => {
      expect(shouldRenderEmission({ mode: "absorption", viewTab: "elements" })).toBe(false);
    });

    it("mode behavior is independent of tab", () => {
      expect(shouldRenderEmission({ mode: "emission", viewTab: "elements" })).toBe(true);
      expect(shouldRenderEmission({ mode: "absorption", viewTab: "hydrogen" })).toBe(false);
    });
  });

  describe("series filtering", () => {
    const transitions = [
      { nUpper: 2, nLower: 1 },
      { nUpper: 3, nLower: 2 },
      { nUpper: 4, nLower: 2 },
      { nUpper: 4, nLower: 3 },
    ];

    it("keeps all transitions for 'all' filter", () => {
      const filtered = filterHydrogenTransitionsBySeries({
        seriesFilter: "all",
        transitions,
      });
      expect(filtered).toHaveLength(4);
    });

    it("keeps only Balmer transitions for series=2", () => {
      const filtered = filterHydrogenTransitionsBySeries({
        seriesFilter: 2,
        transitions,
      });
      expect(filtered).toEqual([
        { nUpper: 3, nLower: 2 },
        { nUpper: 4, nLower: 2 },
      ]);
    });

    it("returns expected Balmer domain range", () => {
      const domain = spectrumDomainForSeries(2);
      expect(domain.minNm).toBe(350);
      expect(domain.maxNm).toBe(700);
      expect(domain.ticksNm).toContain(656);
    });

    it("returns expected all-series domain range", () => {
      const domain = spectrumDomainForSeries("all");
      expect(domain.minNm).toBe(50);
      expect(domain.maxNm).toBe(5000);
      expect(domain.ticksNm).toContain(2000);
    });
  });

  describe("inverse inference helpers", () => {
    it("classifies residual quality thresholds", () => {
      expect(classifyInverseMatchQuality(0.3)).toBe("exact");
      expect(classifyInverseMatchQuality(1.2)).toBe("near");
      expect(classifyInverseMatchQuality(3.1)).toBe("low-confidence");
    });

    it("finds nearest transition candidate", () => {
      const result = inferHydrogenTransitionFromObservedWavelength({
        observedWavelengthNm: 656,
        candidates: [
          { nUpper: 4, nLower: 2, wavelengthNm: 486.1, energyEv: 2.55, seriesName: "Balmer" },
          { nUpper: 3, nLower: 2, wavelengthNm: 656.3, energyEv: 1.89, seriesName: "Balmer" },
          { nUpper: 2, nLower: 1, wavelengthNm: 121.6, energyEv: 10.2, seriesName: "Lyman" },
        ],
      });
      expect(result).not.toBeNull();
      expect(result?.nUpper).toBe(3);
      expect(result?.nLower).toBe(2);
      expect(result?.quality).toBe("exact");
    });

    it("computes pile-up density bins", () => {
      const bins = computeSeriesPileupDensity({
        wavelengthsNm: [364.8, 365.2, 366.0, 380],
        minNm: 364.6,
        maxNm: 384.6,
        bins: 4,
      });
      expect(bins).toHaveLength(4);
      expect(bins.some((bin) => bin.count > 0)).toBe(true);
      expect(bins.every((bin) => bin.density >= 0 && bin.density <= 1)).toBe(true);
    });

    it("large-n spacing approximation falls as 1/n^3", () => {
      const d10 = computeLargeNSpacingApproximation({ nUpper: 10 });
      const d20 = computeLargeNSpacingApproximation({ nUpper: 20 });
      expect(d20).toBeLessThan(d10);
      expect(d10 / d20).toBeGreaterThan(7);
    });
  });

  describe("sequence helpers", () => {
    it("wraps sequence index forward and backward", () => {
      expect(nextSequenceIndex({ currentIndex: 5, length: 6, direction: 1 })).toBe(0);
      expect(nextSequenceIndex({ currentIndex: 0, length: 6, direction: -1 })).toBe(5);
    });
  });

  describe("live-region announcements", () => {
    it("builds emission transition announcement", () => {
      const text = transitionAnnouncement({
        mode: "emission",
        viewTab: "hydrogen",
        selectedElement: "H",
        nUpper: 3,
        nLower: 2,
        wavelengthNm: 656.28,
        seriesName: "Balmer",
      });
      expect(text).toContain("Emission");
      expect(text).toContain("656.3 nm");
      expect(text).toContain("Balmer");
      expect(text).toContain("n = 3");
    });

    it("builds element absorption announcement", () => {
      const text = transitionAnnouncement({
        mode: "absorption",
        viewTab: "elements",
        selectedElement: "Na",
        nUpper: 3,
        nLower: 2,
        wavelengthNm: 589.0,
        seriesName: "Balmer",
        representativeLineLabel: "Na D2 589.0",
      });
      expect(text).toContain("Absorption");
      expect(text).toContain("Element Na");
      expect(text).toContain("Representative line");
      expect(text).not.toContain("n = 3");
    });
  });

  describe("representative element line", () => {
    it("selects highest-intensity line", () => {
      const line = selectRepresentativeElementLine([
        { wavelengthNm: 486.1, relativeIntensity: 0.7, label: "A" },
        { wavelengthNm: 589.0, relativeIntensity: 1.0, label: "B" },
        { wavelengthNm: 393.4, relativeIntensity: 0.8, label: "C" },
      ]);
      expect(line?.label).toBe("B");
    });

    it("breaks intensity ties by lower wavelength", () => {
      const line = selectRepresentativeElementLine([
        { wavelengthNm: 589.6, relativeIntensity: 1.0, label: "Na D1" },
        { wavelengthNm: 589.0, relativeIntensity: 1.0, label: "Na D2" },
      ]);
      expect(line?.label).toBe("Na D2");
      expect(line?.wavelengthNm).toBe(589.0);
    });
  });

  describe("export payload contract", () => {
    it("includes required mode/tab/element/filter context fields", () => {
      const payload = buildSpectralExportPayload({
        timestampIso: "2026-02-22T00:00:00.000Z",
        mode: "emission",
        viewTab: "elements",
        selectedElement: "Fe",
        nUpper: 3,
        nLower: 2,
        seriesFilter: 2,
        wavelengthNm: 656.3,
        energyEv: 1.889,
        frequencyHz: 4.57e14,
        seriesName: "Balmer",
        band: "Visible (red)",
        representativeLineLabel: "Fe I 438.4",
      });

      const names = payload.parameters.map((item) => item.name);
      expect(names).toContain("Mode");
      expect(names).toContain("Tab");
      expect(names).toContain("Element");
      expect(names).toContain("Series filter");
      expect(names).toContain("Representative line");

      const readoutNames = payload.readouts.map((item) => item.name);
      expect(readoutNames).toContain("Wavelength lambda (nm)");
      expect(readoutNames).toContain("Energy E_gamma (eV)");
      expect(readoutNames).toContain("Frequency nu (Hz)");
      expect(readoutNames).toContain("Series");
      expect(readoutNames).toContain("Representative line");
    });

    it("includes optional inverse and reflection fields when provided", () => {
      const payload = buildSpectralExportPayload({
        timestampIso: "2026-02-24T00:00:00.000Z",
        mode: "emission",
        viewTab: "hydrogen",
        selectedElement: "H",
        nUpper: 3,
        nLower: 2,
        seriesFilter: 2,
        wavelengthNm: 656.3,
        energyEv: 1.889,
        frequencyHz: 4.57e14,
        seriesName: "Balmer",
        band: "Visible (red)",
        inferenceMode: "inverse",
        observedWavelengthNm: 656,
        inferredTransitionLabel: "n = 3 → n = 2",
        inverseResidualNm: 0.3,
        includeHydrogenInferenceFields: true,
        mysteryReflectionEvidence: "spacing-pattern",
      });

      const parameterNames = payload.parameters.map((item) => item.name);
      expect(parameterNames).toContain("Inference mode");
      expect(parameterNames).toContain("Observed wavelength input (nm)");
      expect(parameterNames).toContain("Mystery evidence choice");

      const readoutNames = payload.readouts.map((item) => item.name);
      expect(readoutNames).toContain("Inferred transition");
      expect(readoutNames).toContain("Inverse residual (nm)");
    });

    it("omits inverse export rows outside hydrogen inverse context", () => {
      const payload = buildSpectralExportPayload({
        timestampIso: "2026-02-24T00:00:00.000Z",
        mode: "absorption",
        viewTab: "elements",
        selectedElement: "Fe",
        nUpper: 3,
        nLower: 2,
        seriesFilter: 2,
        wavelengthNm: 438.4,
        energyEv: 2.828,
        frequencyHz: 6.84e14,
        seriesName: "Element catalog",
        band: "Visible (blue)",
        inferenceMode: "inverse",
        observedWavelengthNm: 656,
        inferredTransitionLabel: "n = 3 -> n = 2",
        inverseResidualNm: 0.3,
      });

      const parameterNames = payload.parameters.map((item) => item.name);
      expect(parameterNames).not.toContain("Inference mode");
      expect(parameterNames).not.toContain("Observed wavelength input (nm)");

      const readoutNames = payload.readouts.map((item) => item.name);
      expect(readoutNames).not.toContain("Inferred transition");
      expect(readoutNames).not.toContain("Inverse residual (nm)");
    });
  });

  describe("mystery challenge helpers", () => {
    it("seeded random returns deterministic sequence for same seed", () => {
      const a = createSeededRandom("spectral-seed");
      const b = createSeededRandom("spectral-seed");
      const seqA = [a(), a(), a(), a()];
      const seqB = [b(), b(), b(), b()];
      expect(seqA).toEqual(seqB);
    });

    it("pickMysteryTarget avoids immediate repeats when alternatives exist", () => {
      const targets = [
        { element: "H", mode: "emission" as const },
        { element: "He", mode: "absorption" as const },
      ];
      const picked = pickMysteryTarget({
        targets,
        random: () => 0, // would pick first again without no-repeat guard
        previous: targets[0],
      });
      expect(picked).toEqual(targets[1]);
    });

    it("copy is locked only for unrevealed active mystery in Elements tab", () => {
      expect(isMysteryCopyLocked({
        viewTab: "elements",
        mysteryActive: true,
        mysteryRevealed: false,
      })).toBe(true);
      expect(isMysteryCopyLocked({
        viewTab: "elements",
        mysteryActive: true,
        mysteryRevealed: true,
      })).toBe(false);
      expect(isMysteryCopyLocked({
        viewTab: "hydrogen",
        mysteryActive: true,
        mysteryRevealed: false,
      })).toBe(false);
    });

    it("reflection must be selected before mystery check", () => {
      expect(isMysteryReflectionReady({
        mysteryActive: true,
        selectedEvidence: null,
      })).toBe(false);
      expect(isMysteryReflectionReady({
        mysteryActive: true,
        selectedEvidence: "line-strengths",
      })).toBe(true);
    });

    it("hydrogen inference context helper requires hydrogen tab + inverse mode + solved inference", () => {
      expect(isHydrogenInferenceContext({
        viewTab: "hydrogen",
        inferenceMode: "inverse",
        hasInference: true,
      })).toBe(true);
      expect(isHydrogenInferenceContext({
        viewTab: "elements",
        inferenceMode: "inverse",
        hasInference: true,
      })).toBe(false);
      expect(isHydrogenInferenceContext({
        viewTab: "hydrogen",
        inferenceMode: "forward",
        hasInference: true,
      })).toBe(false);
      expect(isHydrogenInferenceContext({
        viewTab: "hydrogen",
        inferenceMode: "inverse",
        hasInference: false,
      })).toBe(false);
    });
  });
});
