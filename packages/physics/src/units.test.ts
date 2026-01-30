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
});

