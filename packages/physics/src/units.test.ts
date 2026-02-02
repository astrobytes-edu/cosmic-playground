import { describe, expect, it } from "vitest";
import { AstroConstants } from "./astroConstants";
import { AstroUnits } from "./units";

describe("AstroUnits", () => {
  it("converts AU/yr to km/s using Julian year", () => {
    // 1 AU / yr in km/s
    const expected = AstroConstants.LENGTH.KM_PER_AU / AstroConstants.TIME.YEAR_S;
    expect(AstroUnits.auPerYrToKmPerS(1)).toBeCloseTo(expected, 12);
    expect(AstroUnits.kmPerSToAuPerYr(expected)).toBeCloseTo(1, 12);
  });

  it("converts degrees and radians", () => {
    expect(AstroUnits.degToRad(180)).toBeCloseTo(Math.PI, 12);
    expect(AstroUnits.radToDeg(Math.PI)).toBeCloseTo(180, 12);
  });

  it("converts degrees to arcminutes/arcseconds", () => {
    expect(AstroUnits.degToArcmin(1)).toBe(60);
    expect(AstroUnits.degToArcsec(1)).toBe(3600);
  });

  it("converts arcminutes/arcseconds to degrees", () => {
    expect(AstroUnits.arcminToDeg(60)).toBe(1);
    expect(AstroUnits.arcsecToDeg(3600)).toBe(1);
  });

  it("converts nm <-> cm", () => {
    expect(AstroUnits.cmToNm(1)).toBeCloseTo(1e7, 12);
    expect(AstroUnits.nmToCm(1e7)).toBeCloseTo(1, 12);
  });

  it("converts eV <-> erg", () => {
    expect(AstroUnits.evToErg(1)).toBeCloseTo(AstroConstants.PHOTON.ERG_PER_EV, 20);
    expect(AstroUnits.ergToEv(AstroConstants.PHOTON.ERG_PER_EV)).toBeCloseTo(1, 12);
  });
});
