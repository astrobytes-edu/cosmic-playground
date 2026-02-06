import { describe, it, expect } from "vitest";
import {
  clamp,
  wavelengthToPositionPercent,
  positionPercentToWavelengthCm,
  formatWavelength,
  formatFrequency,
  formatEnergyFromErg,
  bandFromWavelengthCm,
  bandCenterCm,
  BANDS,
  LAMBDA_MIN_LOG,
  LAMBDA_MAX_LOG,
  spectrumGradientCSS,
  SCALE_OBJECTS,
  drawSpectrumWave
} from "./logic";

describe("EM Spectrum -- Logic", () => {
  // --- clamp ---

  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it("clamps to min when below", () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });
    it("clamps to max when above", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
    it("handles equal min and max", () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
    it("returns min when value equals min", () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });
    it("returns max when value equals max", () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  // --- wavelengthToPositionPercent ---

  describe("wavelengthToPositionPercent", () => {
    it("returns ~0% for very long wavelengths (radio end)", () => {
      const pos = wavelengthToPositionPercent(1e6); // 10 km
      expect(pos).toBeCloseTo(0, 0);
    });
    it("returns ~100% for very short wavelengths (gamma end)", () => {
      const pos = wavelengthToPositionPercent(1e-12); // 10 fm
      expect(pos).toBeCloseTo(100, 0);
    });
    it("returns 50% for geometric midpoint", () => {
      // Midpoint: 10^((log10(1e-12) + log10(1e6))/2) = 10^(-3) = 0.001 cm = 10 um
      const pos = wavelengthToPositionPercent(1e-3);
      expect(pos).toBeCloseTo(50, 0);
    });
    it("is monotonically decreasing (shorter wavelength = larger position)", () => {
      const p1 = wavelengthToPositionPercent(1e-5); // 100 nm
      const p2 = wavelengthToPositionPercent(1e-3); // 10 um
      const p3 = wavelengthToPositionPercent(1e0); // 1 cm
      expect(p1).toBeGreaterThan(p2);
      expect(p2).toBeGreaterThan(p3);
    });
    it("handles wavelength beyond LAMBDA_MAX (clamped to 1e7)", () => {
      // 1e7 cm is beyond the 1e6 display range but within the clamp
      const p1 = wavelengthToPositionPercent(1e7);
      // log10(1e7) = 7, so pos = 100 - ((7 - (-12)) / 18) * 100 = 100 - 105.56 = -5.56
      expect(p1).toBeLessThan(0);
    });
    it("handles wavelength beyond LAMBDA_MIN (clamped to 1e-13)", () => {
      // 1e-14 is clamped to 1e-13
      const p1 = wavelengthToPositionPercent(1e-14);
      const p2 = wavelengthToPositionPercent(1e-13);
      expect(p1).toBeCloseTo(p2, 5);
    });
  });

  // --- positionPercentToWavelengthCm ---

  describe("positionPercentToWavelengthCm", () => {
    it("returns longest wavelength at position 0%", () => {
      const lambda = positionPercentToWavelengthCm(0);
      expect(lambda).toBeCloseTo(1e6, -3);
    });
    it("returns shortest wavelength at position 100%", () => {
      const lambda = positionPercentToWavelengthCm(100);
      expect(lambda).toBeCloseTo(1e-12, 15);
    });
    it("returns midpoint wavelength at position 50%", () => {
      const lambda = positionPercentToWavelengthCm(50);
      expect(lambda).toBeCloseTo(1e-3, 6);
    });
    it("clamps position to 0-100 range", () => {
      expect(positionPercentToWavelengthCm(-10)).toBe(positionPercentToWavelengthCm(0));
      expect(positionPercentToWavelengthCm(110)).toBe(positionPercentToWavelengthCm(100));
    });
    it("round-trips with wavelengthToPositionPercent for visible light", () => {
      const lambdaCm = 5.5e-5; // 550 nm
      const pos = wavelengthToPositionPercent(lambdaCm);
      const roundTripped = positionPercentToWavelengthCm(pos);
      expect(roundTripped).toBeCloseTo(lambdaCm, 8);
    });
    it("round-trips with wavelengthToPositionPercent for radio", () => {
      const lambdaCm = 21; // 21 cm HI line
      const pos = wavelengthToPositionPercent(lambdaCm);
      const roundTripped = positionPercentToWavelengthCm(pos);
      expect(roundTripped).toBeCloseTo(lambdaCm, 5);
    });
    it("round-trips with wavelengthToPositionPercent for X-ray", () => {
      const lambdaCm = 1e-8; // 0.1 nm
      const pos = wavelengthToPositionPercent(lambdaCm);
      const roundTripped = positionPercentToWavelengthCm(pos);
      expect(roundTripped).toBeCloseTo(lambdaCm, 12);
    });
  });

  // --- formatWavelength ---

  describe("formatWavelength", () => {
    it("returns em-dash for NaN", () => {
      expect(formatWavelength(NaN).value).toBe("\u2014");
      expect(formatWavelength(NaN).unit).toBe("");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatWavelength(Infinity).value).toBe("\u2014");
    });
    it("returns em-dash for zero", () => {
      expect(formatWavelength(0).value).toBe("\u2014");
    });
    it("returns em-dash for negative", () => {
      expect(formatWavelength(-1).value).toBe("\u2014");
    });
    it("returns km for very long wavelengths", () => {
      const r = formatWavelength(1e6); // 10 km in cm
      expect(r.unit).toBe("km");
      expect(parseFloat(r.value)).toBeCloseTo(10, 0);
    });
    it("returns m for meter wavelengths", () => {
      const r = formatWavelength(300); // 3 m in cm
      expect(r.unit).toBe("m");
      expect(parseFloat(r.value)).toBeCloseTo(3, 0);
    });
    it("returns mm for millimeter wavelengths", () => {
      const r = formatWavelength(0.13); // 1.3 mm in cm
      expect(r.unit).toBe("mm");
      expect(parseFloat(r.value)).toBeCloseTo(1.3, 0);
    });
    it("returns um for near-IR wavelengths", () => {
      const r = formatWavelength(2.2e-4); // 2.2 um in cm
      expect(r.unit).toBe("um");
      expect(parseFloat(r.value)).toBeCloseTo(2.2, 0);
    });
    it("returns nm for optical wavelengths", () => {
      const r = formatWavelength(5.5e-5); // 550 nm in cm
      expect(r.unit).toBe("nm");
      expect(parseFloat(r.value)).toBeCloseTo(550, -1);
    });
    it("returns pm for X-ray wavelengths", () => {
      const r = formatWavelength(1e-8); // 100 pm in cm
      expect(r.unit).toBe("pm");
      expect(parseFloat(r.value)).toBeCloseTo(100, -1);
    });
    it("returns fm for gamma-ray wavelengths", () => {
      const r = formatWavelength(1e-12); // 10 fm in cm
      expect(r.unit).toBe("fm");
      expect(parseFloat(r.value)).toBeCloseTo(10, 0);
    });
    it("21 cm line displays as millimeters", () => {
      // 21 cm >= 0.1 triggers the mm branch: 21 * 10 = 210 mm
      const r = formatWavelength(21);
      expect(r.unit).toBe("mm");
      expect(parseFloat(r.value)).toBeCloseTo(210, 0);
    });

    // Boundary tests: verify correct unit at exact thresholds
    it("uses km at exactly 1e5 cm", () => {
      expect(formatWavelength(1e5).unit).toBe("km");
    });
    it("uses m at exactly 100 cm", () => {
      expect(formatWavelength(100).unit).toBe("m");
    });
    it("uses mm at exactly 0.1 cm", () => {
      expect(formatWavelength(0.1).unit).toBe("mm");
    });
    it("uses um at exactly 1e-4 cm", () => {
      expect(formatWavelength(1e-4).unit).toBe("um");
    });
    it("uses nm at exactly 1e-7 cm", () => {
      expect(formatWavelength(1e-7).unit).toBe("nm");
    });
    it("uses pm at exactly 1e-10 cm", () => {
      expect(formatWavelength(1e-10).unit).toBe("pm");
    });

    // toPrecision(3) formatting
    it("uses toPrecision(3) for value formatting", () => {
      // 5.555e-5 cm = 555.5 nm -> toPrecision(3) = "556" (rounds)
      const r = formatWavelength(5.555e-5);
      expect(r.value).toBe("556");
      expect(r.unit).toBe("nm");
    });
  });

  // --- formatFrequency ---

  describe("formatFrequency", () => {
    it("returns em-dash for NaN", () => {
      expect(formatFrequency(NaN).value).toBe("\u2014");
      expect(formatFrequency(NaN).unit).toBe("");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatFrequency(Infinity).value).toBe("\u2014");
    });
    it("returns em-dash for zero", () => {
      expect(formatFrequency(0).value).toBe("\u2014");
    });
    it("returns em-dash for negative", () => {
      expect(formatFrequency(-1).value).toBe("\u2014");
    });
    it("returns Hz for very low frequencies", () => {
      const r = formatFrequency(500);
      expect(r.unit).toBe("Hz");
      expect(parseFloat(r.value)).toBeCloseTo(500, 0);
    });
    it("returns kHz for kHz-range frequencies", () => {
      const r = formatFrequency(5e3);
      expect(r.unit).toBe("kHz");
      expect(parseFloat(r.value)).toBeCloseTo(5, 0);
    });
    it("returns MHz for MHz-range frequencies", () => {
      const r = formatFrequency(100e6);
      expect(r.unit).toBe("MHz");
      expect(parseFloat(r.value)).toBeCloseTo(100, 0);
    });
    it("returns GHz for GHz-range frequencies", () => {
      const r = formatFrequency(5.0e9);
      expect(r.unit).toBe("GHz");
      expect(parseFloat(r.value)).toBeCloseTo(5, 0);
    });
    it("returns THz for visible-light frequencies", () => {
      const r = formatFrequency(4.3e14); // ~430 THz
      expect(r.unit).toBe("THz");
      expect(parseFloat(r.value)).toBeCloseTo(430, 0);
    });
    it("returns PHz for PHz-range frequencies", () => {
      const r = formatFrequency(1e16);
      expect(r.unit).toBe("PHz");
      expect(parseFloat(r.value)).toBeCloseTo(10, 0);
    });
    it("returns EHz for EHz-range frequencies", () => {
      const r = formatFrequency(1e20);
      expect(r.unit).toBe("EHz");
      expect(parseFloat(r.value)).toBeCloseTo(100, 0);
    });

    // Boundary tests
    it("uses kHz at exactly 1e3 Hz", () => {
      expect(formatFrequency(1e3).unit).toBe("kHz");
    });
    it("uses MHz at exactly 1e6 Hz", () => {
      expect(formatFrequency(1e6).unit).toBe("MHz");
    });
    it("uses GHz at exactly 1e9 Hz", () => {
      expect(formatFrequency(1e9).unit).toBe("GHz");
    });
    it("uses THz at exactly 1e12 Hz", () => {
      expect(formatFrequency(1e12).unit).toBe("THz");
    });
    it("uses PHz at exactly 1e15 Hz", () => {
      expect(formatFrequency(1e15).unit).toBe("PHz");
    });
    it("uses EHz at exactly 1e18 Hz", () => {
      expect(formatFrequency(1e18).unit).toBe("EHz");
    });

    // toPrecision(3) formatting
    it("uses toPrecision(3) for value formatting", () => {
      // 1.234e9 Hz = 1.234 GHz -> toPrecision(3) = "1.23"
      const r = formatFrequency(1.234e9);
      expect(r.value).toBe("1.23");
      expect(r.unit).toBe("GHz");
    });
  });

  // --- formatEnergyFromErg ---

  describe("formatEnergyFromErg", () => {
    // Simple converter for testing (matches AstroUnits.ergToEv)
    const ergToEv = (erg: number) => erg / 1.602176634e-12;

    it("returns em-dash for NaN", () => {
      expect(formatEnergyFromErg(NaN, ergToEv).value).toBe("\u2014");
      expect(formatEnergyFromErg(NaN, ergToEv).unit).toBe("");
    });
    it("returns em-dash for Infinity", () => {
      expect(formatEnergyFromErg(Infinity, ergToEv).value).toBe("\u2014");
    });
    it("returns em-dash for zero", () => {
      expect(formatEnergyFromErg(0, ergToEv).value).toBe("\u2014");
    });
    it("returns em-dash for negative", () => {
      expect(formatEnergyFromErg(-1, ergToEv).value).toBe("\u2014");
    });
    it("returns eV for optical photon energies", () => {
      // ~2.25 eV photon (550 nm): E_erg ~ 3.6e-12
      const r = formatEnergyFromErg(3.6e-12, ergToEv);
      expect(r.unit).toBe("eV");
      expect(parseFloat(r.value)).toBeGreaterThan(1);
      expect(parseFloat(r.value)).toBeLessThan(5);
    });
    it("returns keV for X-ray photon energies", () => {
      // ~10 keV: E_erg ~ 1.6e-8
      const r = formatEnergyFromErg(1.6e-8, ergToEv);
      expect(r.unit).toBe("keV");
    });
    it("returns MeV for gamma-ray photon energies", () => {
      // ~10 MeV: E_erg ~ 1.6e-5
      const r = formatEnergyFromErg(1.6e-5, ergToEv);
      expect(r.unit).toBe("MeV");
    });
    it("returns erg for very low energies below meV", () => {
      // Need ergToEv(erg) < 1e-3 => erg < 1.6e-15
      const r = formatEnergyFromErg(1e-16, ergToEv);
      expect(r.unit).toBe("erg");
    });
    it("uses the DI callback for conversion", () => {
      // Custom converter that always returns 5.0 eV
      const customConverter = (_erg: number) => 5.0;
      const r = formatEnergyFromErg(1e-10, customConverter);
      expect(r.unit).toBe("eV");
      expect(parseFloat(r.value)).toBeCloseTo(5.0, 0);
    });
    it("returns keV at the eV/keV boundary", () => {
      // Exactly 1000 eV = 1 keV
      const energyErg = 1000 * 1.602176634e-12;
      const r = formatEnergyFromErg(energyErg, ergToEv);
      expect(r.unit).toBe("keV");
    });
    it("returns MeV at the keV/MeV boundary", () => {
      // Exactly 1e6 eV = 1 MeV
      const energyErg = 1e6 * 1.602176634e-12;
      const r = formatEnergyFromErg(energyErg, ergToEv);
      expect(r.unit).toBe("MeV");
    });
  });

  // --- bandFromWavelengthCm ---

  describe("bandFromWavelengthCm", () => {
    it("returns visible for 550 nm", () => {
      expect(bandFromWavelengthCm(5.5e-5)).toBe("visible");
    });
    it("returns radio for 21 cm", () => {
      expect(bandFromWavelengthCm(21)).toBe("radio");
    });
    it("returns infrared for 2.2 um", () => {
      expect(bandFromWavelengthCm(2.2e-4)).toBe("infrared");
    });
    it("returns microwave for 3 mm", () => {
      expect(bandFromWavelengthCm(0.03)).toBe("microwave");
    });
    it("returns ultraviolet for 100 nm", () => {
      expect(bandFromWavelengthCm(1e-5)).toBe("ultraviolet");
    });
    it("returns xray for 1 nm", () => {
      expect(bandFromWavelengthCm(1e-7)).toBe("xray");
    });
    it("returns gamma for 0.001 nm", () => {
      expect(bandFromWavelengthCm(1e-10)).toBe("gamma");
    });
    it("returns radio for very long wavelengths beyond range", () => {
      expect(bandFromWavelengthCm(1e8)).toBe("radio");
    });
    it("returns gamma for very short wavelengths beyond range", () => {
      expect(bandFromWavelengthCm(1e-15)).toBe("gamma");
    });
    it("returns correct band at band boundaries", () => {
      // At the visible/infrared boundary (700 nm = 7e-5 cm)
      // This should be in visible (lambdaMaxCm) OR infrared (lambdaMinCm)
      // Both include the boundary value -- whichever is iterated first wins
      const band = bandFromWavelengthCm(7e-5);
      expect(["visible", "infrared"]).toContain(band);
    });
    it("returns correct band at the visible/UV boundary", () => {
      // 380 nm = 3.8e-5 cm
      const band = bandFromWavelengthCm(3.8e-5);
      expect(["visible", "ultraviolet"]).toContain(band);
    });
  });

  // --- bandCenterCm ---

  describe("bandCenterCm", () => {
    it("returns geometric mean of band limits", () => {
      const center = bandCenterCm("visible");
      const expected = Math.sqrt(3.8e-5 * 7e-5);
      expect(center).toBeCloseTo(expected, 10);
    });
    it("center falls within band boundaries for all bands", () => {
      for (const key of Object.keys(BANDS) as Array<keyof typeof BANDS>) {
        const center = bandCenterCm(key);
        expect(center).toBeGreaterThanOrEqual(BANDS[key].lambdaMinCm);
        expect(center).toBeLessThanOrEqual(BANDS[key].lambdaMaxCm);
      }
    });
    it("returns different centers for different bands", () => {
      const centers = (Object.keys(BANDS) as Array<keyof typeof BANDS>).map(bandCenterCm);
      const unique = new Set(centers);
      expect(unique.size).toBe(7);
    });
    it("radio center is the longest wavelength center", () => {
      const radioCenter = bandCenterCm("radio");
      for (const key of Object.keys(BANDS) as Array<keyof typeof BANDS>) {
        if (key !== "radio") {
          expect(radioCenter).toBeGreaterThan(bandCenterCm(key));
        }
      }
    });
    it("gamma center is the shortest wavelength center", () => {
      const gammaCenter = bandCenterCm("gamma");
      for (const key of Object.keys(BANDS) as Array<keyof typeof BANDS>) {
        if (key !== "gamma") {
          expect(gammaCenter).toBeLessThan(bandCenterCm(key));
        }
      }
    });
  });

  // --- BANDS data integrity ---

  describe("BANDS data integrity", () => {
    it("all 7 EM bands are defined", () => {
      expect(Object.keys(BANDS).length).toBe(7);
    });
    it("all bands have positive wavelength limits", () => {
      for (const band of Object.values(BANDS)) {
        expect(band.lambdaMinCm).toBeGreaterThan(0);
        expect(band.lambdaMaxCm).toBeGreaterThan(band.lambdaMinCm);
      }
    });
    it("all bands have non-empty description, examples, and detection", () => {
      for (const band of Object.values(BANDS)) {
        expect(band.description.length).toBeGreaterThan(10);
        expect(band.examples.length).toBeGreaterThan(5);
        expect(band.detection.length).toBeGreaterThan(5);
      }
    });
    it("all bands have key matching their object key", () => {
      for (const [key, band] of Object.entries(BANDS)) {
        expect(band.key).toBe(key);
      }
    });
    it("all bands have non-empty name", () => {
      for (const band of Object.values(BANDS)) {
        expect(band.name.length).toBeGreaterThan(0);
      }
    });
    it("adjacent bands have matching boundaries", () => {
      // radio.min == microwave.max
      expect(BANDS.radio.lambdaMinCm).toBe(BANDS.microwave.lambdaMaxCm);
      // microwave.min == infrared.max
      expect(BANDS.microwave.lambdaMinCm).toBe(BANDS.infrared.lambdaMaxCm);
      // infrared.min == visible.max
      expect(BANDS.infrared.lambdaMinCm).toBe(BANDS.visible.lambdaMaxCm);
      // visible.min == ultraviolet.max
      expect(BANDS.visible.lambdaMinCm).toBe(BANDS.ultraviolet.lambdaMaxCm);
      // ultraviolet.min == xray.max
      expect(BANDS.ultraviolet.lambdaMinCm).toBe(BANDS.xray.lambdaMaxCm);
      // xray.min == gamma.max
      expect(BANDS.xray.lambdaMinCm).toBe(BANDS.gamma.lambdaMaxCm);
    });
    it("bands are ordered from longest to shortest wavelength", () => {
      const keys = Object.keys(BANDS) as Array<keyof typeof BANDS>;
      for (let i = 0; i < keys.length - 1; i++) {
        expect(BANDS[keys[i]].lambdaMaxCm).toBeGreaterThanOrEqual(
          BANDS[keys[i + 1]].lambdaMaxCm
        );
      }
    });
  });

  // --- Spectrum range constants ---

  describe("spectrum range constants", () => {
    it("LAMBDA_MIN_LOG corresponds to 10 fm", () => {
      expect(LAMBDA_MIN_LOG).toBeCloseTo(Math.log10(1e-12), 10);
    });
    it("LAMBDA_MAX_LOG corresponds to 10 km", () => {
      expect(LAMBDA_MAX_LOG).toBeCloseTo(Math.log10(1e6), 10);
    });
    it("range spans 18 orders of magnitude", () => {
      expect(LAMBDA_MAX_LOG - LAMBDA_MIN_LOG).toBeCloseTo(18, 10);
    });
    it("LAMBDA_MIN_LOG is -12", () => {
      expect(LAMBDA_MIN_LOG).toBe(-12);
    });
    it("LAMBDA_MAX_LOG is 6", () => {
      expect(LAMBDA_MAX_LOG).toBe(6);
    });
  });

  // --- spectrumGradientCSS ---

  describe("spectrumGradientCSS", () => {
    it("returns a linear-gradient CSS string", () => {
      const result = spectrumGradientCSS();
      expect(result).toMatch(/^linear-gradient\(to right,/);
    });

    it("contains at least 15 color stops", () => {
      const result = spectrumGradientCSS();
      const stops = result.match(/#[0-9a-fA-F]{6}/g) || [];
      expect(stops.length).toBeGreaterThanOrEqual(15);
    });

    it("starts at 0% and ends at 100%", () => {
      const result = spectrumGradientCSS();
      expect(result).toContain("0%");
      expect(result).toContain("100%");
    });

    it("contains visible spectrum colors", () => {
      const result = spectrumGradientCSS();
      expect(result).toContain("#ff0000"); // red
      expect(result).toContain("#00ff00"); // green
      expect(result).toContain("#0000ff"); // blue
    });
  });

  // --- SCALE_OBJECTS ---

  describe("SCALE_OBJECTS", () => {
    it("has 7 scale comparison objects", () => {
      expect(SCALE_OBJECTS).toHaveLength(7);
    });

    it("objects are ordered from largest to smallest wavelength", () => {
      for (let i = 1; i < SCALE_OBJECTS.length; i++) {
        expect(SCALE_OBJECTS[i].lambdaCm).toBeLessThan(SCALE_OBJECTS[i - 1].lambdaCm);
      }
    });

    it("each object has a label and positive wavelength", () => {
      for (const obj of SCALE_OBJECTS) {
        expect(obj.label.length).toBeGreaterThan(0);
        expect(obj.lambdaCm).toBeGreaterThan(0);
      }
    });
  });

  // --- drawSpectrumWave ---

  describe("drawSpectrumWave", () => {
    it("is a function that accepts ctx, width, height", () => {
      expect(typeof drawSpectrumWave).toBe("function");
      expect(drawSpectrumWave.length).toBe(3);
    });
  });
});
