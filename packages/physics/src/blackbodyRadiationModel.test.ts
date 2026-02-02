import { describe, expect, it } from "vitest";

import { BlackbodyRadiationModel } from "./blackbodyRadiationModel";

describe("BlackbodyRadiationModel", () => {
  it("matches Sun peak wavelength (~502 nm, Wien)", () => {
    const peakNm = BlackbodyRadiationModel.wienPeakNm(BlackbodyRadiationModel.CONSTANTS.TSunK);
    expect(Math.abs(peakNm - 502)).toBeLessThanOrEqual(2);
  });

  it("scales luminosity ratio as (T/TSun)^4", () => {
    const ratio = BlackbodyRadiationModel.luminosityRatioSameRadius({
      temperatureK: 2 * BlackbodyRadiationModel.CONSTANTS.TSunK
    });
    expect(Math.abs(ratio - 16)).toBeLessThan(1e-12);
  });

  it("returns zero/NaN-safe values for invalid inputs", () => {
    expect(BlackbodyRadiationModel.wienPeakCm(-1)).toBeNaN();
    expect(BlackbodyRadiationModel.planckSpectralRadianceCgs({ wavelengthCm: -1, temperatureK: 5000 })).toBe(0);
    expect(BlackbodyRadiationModel.planckSpectralRadianceCgs({ wavelengthCm: 1e-4, temperatureK: -1 })).toBe(0);
    expect(BlackbodyRadiationModel.stefanBoltzmannFluxCgs({ temperatureK: -1 })).toBe(0);
  });

  it("clips Planck exponent overflow to 0 (stability)", () => {
    // Very small wavelength yields huge exponent -> clipped to 0.
    const b = BlackbodyRadiationModel.planckSpectralRadianceCgs({ wavelengthCm: 1e-12, temperatureK: 10 });
    expect(b).toBe(0);
  });

  it("produces bounded RGB values for reasonable temperatures", () => {
    const rgb = BlackbodyRadiationModel.temperatureToRgbApprox({ temperatureK: 5778 });
    expect(rgb.r).toBeGreaterThanOrEqual(0);
    expect(rgb.r).toBeLessThanOrEqual(255);
    expect(rgb.g).toBeGreaterThanOrEqual(0);
    expect(rgb.g).toBeLessThanOrEqual(255);
    expect(rgb.b).toBeGreaterThanOrEqual(0);
    expect(rgb.b).toBeLessThanOrEqual(255);
  });
});

