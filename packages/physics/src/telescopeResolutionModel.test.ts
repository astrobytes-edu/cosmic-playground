import { describe, expect, it } from "vitest";

import { AstroUnits } from "./units";
import { TelescopeResolutionModel } from "./telescopeResolutionModel";

describe("TelescopeResolutionModel", () => {
  it("benchmarks Hubble at 550 nm (~0.058 arcsec)", () => {
    const wavelengthCm = 5.5e-5;
    const apertureCm = 240;
    const thetaArcsec = TelescopeResolutionModel.diffractionLimitArcsecFromWavelengthCmAndApertureCm(
      wavelengthCm,
      apertureCm
    );
    expect(thetaArcsec).toBeGreaterThan(0.04);
    expect(thetaArcsec).toBeLessThan(0.08);
  });

  it("improves (smaller) with larger aperture", () => {
    const wavelengthCm = 5.5e-5;
    const small = TelescopeResolutionModel.diffractionLimitArcsecFromWavelengthCmAndApertureCm(
      wavelengthCm,
      10
    );
    const large = TelescopeResolutionModel.diffractionLimitArcsecFromWavelengthCmAndApertureCm(
      wavelengthCm,
      100
    );
    expect(large).toBeLessThan(small);
  });

  it("gets worse (larger) at longer wavelength", () => {
    const apertureCm = 100;
    const visible = TelescopeResolutionModel.diffractionLimitArcsecFromWavelengthCmAndApertureCm(
      5.5e-5,
      apertureCm
    );
    const radio = TelescopeResolutionModel.diffractionLimitArcsecFromWavelengthCmAndApertureCm(
      21,
      apertureCm
    );
    expect(radio).toBeGreaterThan(visible);
  });

  it("returns diffraction-limited in space (seeing=0)", () => {
    expect(
      TelescopeResolutionModel.effectiveResolutionArcsec({
        diffractionLimitArcsec: 0.1,
        seeingArcsec: 0,
        aoEnabled: false
      })
    ).toBe(0.1);
  });

  it("is seeing-limited without AO when seeing dominates", () => {
    expect(
      TelescopeResolutionModel.effectiveResolutionArcsec({
        diffractionLimitArcsec: 0.05,
        seeingArcsec: 1.0,
        aoEnabled: false
      })
    ).toBe(1.0);
  });

  it("reduces effective seeing with AO (quadrature with corrected seeing)", () => {
    const eff = TelescopeResolutionModel.effectiveResolutionArcsec({
      diffractionLimitArcsec: 0.05,
      seeingArcsec: 1.0,
      aoEnabled: true,
      aoStrehl: 0.6
    });
    expect(eff).toBeGreaterThan(0.35);
    expect(eff).toBeLessThan(0.6);
  });

  it("labels resolved/marginal/unresolved with ratio cutoffs", () => {
    expect(
      TelescopeResolutionModel.resolutionStatusFromSeparationArcsec({
        separationArcsec: 1.0,
        effectiveResolutionArcsec: 1.0
      })
    ).toBe("resolved");

    expect(
      TelescopeResolutionModel.resolutionStatusFromSeparationArcsec({
        separationArcsec: 0.85,
        effectiveResolutionArcsec: 1.0
      })
    ).toBe("marginal");

    expect(
      TelescopeResolutionModel.resolutionStatusFromSeparationArcsec({
        separationArcsec: 0.5,
        effectiveResolutionArcsec: 1.0
      })
    ).toBe("unresolved");
  });

  it("Airy intensity is normalized at x=0 and near a J1 zero it is small", () => {
    expect(TelescopeResolutionModel.airyIntensityNormalizedFromX(0)).toBe(1);

    // First zero of J1 is ~3.8317; Airy intensity should be close to 0 there.
    const nearZero = TelescopeResolutionModel.airyIntensityNormalizedFromX(3.8317);
    expect(nearZero).toBeLessThan(1e-2);
  });

  it("Airy intensity decreases from center (sanity)", () => {
    const wavelengthCm = 5.5e-5;
    const apertureCm = 240;
    const theta0 = 0;
    const theta1 = AstroUnits.arcsecToRad(0.05);
    const theta2 = AstroUnits.arcsecToRad(0.2);

    const i0 = TelescopeResolutionModel.airyIntensityNormalizedFromThetaRad({
      thetaRad: theta0,
      wavelengthCm,
      apertureCm
    });
    const i1 = TelescopeResolutionModel.airyIntensityNormalizedFromThetaRad({
      thetaRad: theta1,
      wavelengthCm,
      apertureCm
    });
    const i2 = TelescopeResolutionModel.airyIntensityNormalizedFromThetaRad({
      thetaRad: theta2,
      wavelengthCm,
      apertureCm
    });
    expect(i0).toBeGreaterThan(i1);
    expect(i1).toBeGreaterThan(i2);
  });
});

