import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

const PHOTON = AstroConstants.PHOTON;

export const PhotonModel = {
  /**
   * Convert wavelength (cm) to frequency (Hz) using c = lambda * nu.
   */
  frequencyHzFromWavelengthCm(wavelengthCm: number): number {
    if (!Number.isFinite(wavelengthCm) || wavelengthCm <= 0) return NaN;
    return PHOTON.C_CM_PER_S / wavelengthCm;
  },

  /**
   * Convert frequency (Hz) to wavelength (cm) using c = lambda * nu.
   */
  wavelengthCmFromFrequencyHz(frequencyHz: number): number {
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) return NaN;
    return PHOTON.C_CM_PER_S / frequencyHz;
  },

  /**
   * Convert wavelength (cm) to photon energy (erg) using E = hc/lambda.
   */
  photonEnergyErgFromWavelengthCm(wavelengthCm: number): number {
    if (!Number.isFinite(wavelengthCm) || wavelengthCm <= 0) return NaN;
    return (PHOTON.H_ERG_S * PHOTON.C_CM_PER_S) / wavelengthCm;
  },

  /**
   * Convert photon energy (erg) to wavelength (cm) using lambda = hc/E.
   */
  wavelengthCmFromPhotonEnergyErg(energyErg: number): number {
    if (!Number.isFinite(energyErg) || energyErg <= 0) return NaN;
    return (PHOTON.H_ERG_S * PHOTON.C_CM_PER_S) / energyErg;
  },

  /**
   * Convert frequency (Hz) to photon energy (erg) using E = h*nu.
   */
  photonEnergyErgFromFrequencyHz(frequencyHz: number): number {
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) return NaN;
    return PHOTON.H_ERG_S * frequencyHz;
  },

  /**
   * Convert photon energy (erg) to frequency (Hz) using nu = E/h.
   */
  frequencyHzFromPhotonEnergyErg(energyErg: number): number {
    if (!Number.isFinite(energyErg) || energyErg <= 0) return NaN;
    return energyErg / PHOTON.H_ERG_S;
  },

  /**
   * Convert wavelength (nm) to frequency (Hz) using c = lambda * nu.
   */
  frequencyHzFromWavelengthNm(wavelengthNm: number): number {
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) return NaN;
    return PhotonModel.frequencyHzFromWavelengthCm(AstroUnits.nmToCm(wavelengthNm));
  },

  /**
   * Convert frequency (Hz) to wavelength (nm) using c = lambda * nu.
   */
  wavelengthNmFromFrequencyHz(frequencyHz: number): number {
    const wavelengthCm = PhotonModel.wavelengthCmFromFrequencyHz(frequencyHz);
    if (!Number.isFinite(wavelengthCm)) return NaN;
    return AstroUnits.cmToNm(wavelengthCm);
  },

  /**
   * Convert wavelength (nm) to photon energy (eV) using E = hc/lambda.
   */
  photonEnergyEvFromWavelengthNm(wavelengthNm: number): number {
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) return NaN;
    const energyErg = PhotonModel.photonEnergyErgFromWavelengthCm(AstroUnits.nmToCm(wavelengthNm));
    if (!Number.isFinite(energyErg)) return NaN;
    return AstroUnits.ergToEv(energyErg);
  },

  /**
   * Convert photon energy (eV) to wavelength (nm) using lambda = hc/E.
   */
  wavelengthNmFromPhotonEnergyEv(energyEv: number): number {
    if (!Number.isFinite(energyEv) || energyEv <= 0) return NaN;
    const energyErg = AstroUnits.evToErg(energyEv);
    const wavelengthCm = PhotonModel.wavelengthCmFromPhotonEnergyErg(energyErg);
    if (!Number.isFinite(wavelengthCm)) return NaN;
    return AstroUnits.cmToNm(wavelengthCm);
  },

  /**
   * Convert frequency (Hz) to photon energy (eV) using E = h * nu.
   */
  photonEnergyEvFromFrequencyHz(frequencyHz: number): number {
    const energyErg = PhotonModel.photonEnergyErgFromFrequencyHz(frequencyHz);
    if (!Number.isFinite(energyErg)) return NaN;
    return AstroUnits.ergToEv(energyErg);
  },

  /**
   * Convert photon energy (eV) to frequency (Hz) using nu = E/h.
   */
  frequencyHzFromPhotonEnergyEv(energyEv: number): number {
    if (!Number.isFinite(energyEv) || energyEv <= 0) return NaN;
    const energyErg = AstroUnits.evToErg(energyEv);
    return PhotonModel.frequencyHzFromPhotonEnergyErg(energyErg);
  }
} as const;
