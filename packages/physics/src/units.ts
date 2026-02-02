/**
 * AstroUnits
 *
 * Unit conversion helpers built on AstroConstants (single source of truth).
 *
 * Rule: "dumb math" only (no DOM, no state).
 */

import { AstroConstants } from "./astroConstants";

export const AstroUnits = {
  nmToCm(nm: number): number {
    return nm * AstroConstants.PHOTON.CM_PER_NM;
  },

  cmToNm(cm: number): number {
    return cm * AstroConstants.PHOTON.NM_PER_CM;
  },

  ergToEv(erg: number): number {
    return erg * AstroConstants.PHOTON.EV_PER_ERG;
  },

  evToErg(ev: number): number {
    return ev * AstroConstants.PHOTON.ERG_PER_EV;
  },

  daysToSeconds(days: number): number {
    return days * AstroConstants.TIME.DAY_S;
  },

  secondsToDays(seconds: number): number {
    return seconds / AstroConstants.TIME.DAY_S;
  },

  yearsToSeconds(years: number): number {
    return years * AstroConstants.TIME.YEAR_S;
  },

  secondsToYears(seconds: number): number {
    return seconds / AstroConstants.TIME.YEAR_S;
  },

  auToCm(au: number): number {
    return au * AstroConstants.LENGTH.CM_PER_AU;
  },

  cmToAu(cm: number): number {
    return cm / AstroConstants.LENGTH.CM_PER_AU;
  },

  auToKm(au: number): number {
    return au * AstroConstants.LENGTH.KM_PER_AU;
  },

  kmToAu(km: number): number {
    return km / AstroConstants.LENGTH.KM_PER_AU;
  },

  auPerYrToKmPerS(auPerYr: number): number {
    return (auPerYr * AstroConstants.LENGTH.KM_PER_AU) / AstroConstants.TIME.YEAR_S;
  },

  kmPerSToAuPerYr(kmPerS: number): number {
    return (kmPerS * AstroConstants.TIME.YEAR_S) / AstroConstants.LENGTH.KM_PER_AU;
  },

  auPerYrToCmPerS(auPerYr: number): number {
    return (auPerYr * AstroConstants.LENGTH.CM_PER_AU) / AstroConstants.TIME.YEAR_S;
  },

  cmPerSToAuPerYr(cmPerS: number): number {
    return (cmPerS * AstroConstants.TIME.YEAR_S) / AstroConstants.LENGTH.CM_PER_AU;
  },

  auPerYr2ToMPerS2(auPerYr2: number): number {
    // 1 AU/yr² = AU_m / yr_s²
    return (
      (auPerYr2 * AstroConstants.LENGTH.M_PER_AU) /
      (AstroConstants.TIME.YEAR_S * AstroConstants.TIME.YEAR_S)
    );
  },

  mPerS2ToAuPerYr2(mPerS2: number): number {
    return (
      (mPerS2 * AstroConstants.TIME.YEAR_S * AstroConstants.TIME.YEAR_S) /
      AstroConstants.LENGTH.M_PER_AU
    );
  },

  auPerYr2ToCmPerS2(auPerYr2: number): number {
    return (
      (auPerYr2 * AstroConstants.LENGTH.CM_PER_AU) /
      (AstroConstants.TIME.YEAR_S * AstroConstants.TIME.YEAR_S)
    );
  },

  cmPerS2ToAuPerYr2(cmPerS2: number): number {
    return (
      (cmPerS2 * AstroConstants.TIME.YEAR_S * AstroConstants.TIME.YEAR_S) /
      AstroConstants.LENGTH.CM_PER_AU
    );
  },

  au3PerYr2ToCm3PerS2(au3PerYr2: number): number {
    // Convert μ from AU^3/yr^2 to cm^3/s^2.
    return (
      au3PerYr2 *
      Math.pow(AstroConstants.LENGTH.CM_PER_AU, 3) /
      Math.pow(AstroConstants.TIME.YEAR_S, 2)
    );
  },

  cm3PerS2ToAu3PerYr2(cm3PerS2: number): number {
    return (
      cm3PerS2 *
      Math.pow(AstroConstants.TIME.YEAR_S, 2) /
      Math.pow(AstroConstants.LENGTH.CM_PER_AU, 3)
    );
  },

  degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  },

  radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  },

  arcsecToRad(arcsec: number): number {
    return this.degToRad(arcsec / 3600);
  },

  radToArcsec(rad: number): number {
    return this.degToArcsec(this.radToDeg(rad));
  },

  degToArcmin(deg: number): number {
    return deg * 60;
  },

  degToArcsec(deg: number): number {
    return deg * 3600;
  },

  arcminToDeg(arcmin: number): number {
    return arcmin / 60;
  },

  arcsecToDeg(arcsec: number): number {
    return arcsec / 3600;
  }
} as const;
