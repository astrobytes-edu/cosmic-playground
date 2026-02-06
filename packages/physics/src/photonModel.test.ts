import { describe, expect, it } from "vitest";

import { AstroUnits } from "./units";
import { PhotonModel } from "./photonModel";

describe("PhotonModel", () => {
  it("converts 500 nm to ~6.0e14 Hz (sanity)", () => {
    const frequencyHz = PhotonModel.frequencyHzFromWavelengthNm(500);
    expect(frequencyHz).toBeGreaterThan(5.0e14);
    expect(frequencyHz).toBeLessThan(7.0e14);
  });

  it("converts 500 nm to ~2.48 eV (sanity)", () => {
    const energyEv = PhotonModel.photonEnergyEvFromWavelengthNm(500);
    expect(energyEv).toBeGreaterThan(2.0);
    expect(energyEv).toBeLessThan(3.0);
  });

  it("round-trips wavelength -> frequency -> wavelength", () => {
    const wavelengthNm = 21_000_000; // 21 cm (HI line), in nm
    const frequencyHz = PhotonModel.frequencyHzFromWavelengthNm(wavelengthNm);
    const backWavelengthNm = PhotonModel.wavelengthNmFromFrequencyHz(frequencyHz);
    expect(Math.abs(backWavelengthNm - wavelengthNm) / wavelengthNm).toBeLessThan(1e-12);
  });

  it("round-trips wavelength -> energy -> wavelength", () => {
    const wavelengthNm = 656.281;
    const energyEv = PhotonModel.photonEnergyEvFromWavelengthNm(wavelengthNm);
    const backWavelengthNm = PhotonModel.wavelengthNmFromPhotonEnergyEv(energyEv);
    expect(Math.abs(backWavelengthNm - wavelengthNm) / wavelengthNm).toBeLessThan(1e-12);
  });

  it("is consistent between cm and nm helpers", () => {
    const wavelengthNm = 500;
    const wavelengthCm = AstroUnits.nmToCm(wavelengthNm);
    expect(PhotonModel.frequencyHzFromWavelengthCm(wavelengthCm)).toBeCloseTo(
      PhotonModel.frequencyHzFromWavelengthNm(wavelengthNm),
      12
    );
  });

  // --- Edge cases ---

  it("returns NaN for zero wavelength", () => {
    expect(PhotonModel.frequencyHzFromWavelengthNm(0)).toBeNaN();
    expect(PhotonModel.photonEnergyEvFromWavelengthNm(0)).toBeNaN();
  });

  it("returns NaN for negative wavelength", () => {
    expect(PhotonModel.frequencyHzFromWavelengthNm(-500)).toBeNaN();
    expect(PhotonModel.photonEnergyEvFromWavelengthNm(-500)).toBeNaN();
  });

  it("returns NaN for NaN input", () => {
    expect(PhotonModel.frequencyHzFromWavelengthNm(NaN)).toBeNaN();
    expect(PhotonModel.photonEnergyEvFromWavelengthNm(NaN)).toBeNaN();
  });

  it("handles extreme radio wavelengths (10 km = 2.1e14 nm)", () => {
    const nuHz = PhotonModel.frequencyHzFromWavelengthNm(2.1e14);
    expect(nuHz).toBeGreaterThan(0);
    expect(nuHz).toBeLessThan(1e5); // should be ~1.4 kHz
  });

  it("handles extreme gamma-ray wavelengths (10 fm = 1e-5 nm)", () => {
    const energyEv = PhotonModel.photonEnergyEvFromWavelengthNm(1e-5);
    expect(energyEv).toBeGreaterThan(1e8); // >100 MeV
  });

  it("round-trips frequency -> energy -> frequency", () => {
    const freqHz = 5e14; // visible light
    const energyEv = PhotonModel.photonEnergyEvFromFrequencyHz(freqHz);
    const backFreqHz = PhotonModel.frequencyHzFromPhotonEnergyEv(energyEv);
    expect(Math.abs(backFreqHz - freqHz) / freqHz).toBeLessThan(1e-12);
  });
});
