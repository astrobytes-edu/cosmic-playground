import { describe, expect, it } from "vitest";
import { AstroConstants } from "./astroConstants";

describe("AstroConstants", () => {
  it("uses Kepler teaching normalization G = 4π²", () => {
    expect(AstroConstants.GRAV.G_AU3_YR2_PER_SOLAR_MASS).toBeCloseTo(
      4 * Math.PI * Math.PI,
      12
    );
  });

  it("derives AU conversions", () => {
    expect(AstroConstants.LENGTH.M_PER_AU).toBeCloseTo(149597870.7 * 1000, 6);
    expect(AstroConstants.LENGTH.CM_PER_AU).toBeCloseTo(
      149597870.7 * 1000 * 100,
      3
    );
  });

  it("derives draconic month from sidereal month and nodal regression", () => {
    const sid = AstroConstants.TIME.MEAN_SIDEREAL_MONTH_DAYS;
    const node = AstroConstants.TIME.MEAN_NODE_REGRESSION_DAYS;
    const expected = 1 / (1 / sid + 1 / node);
    expect(AstroConstants.TIME.MEAN_DRACONIC_MONTH_DAYS).toBeCloseTo(expected, 12);
  });
});

