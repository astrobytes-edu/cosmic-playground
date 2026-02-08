import { describe, expect, it, test } from "vitest";
import {
  buildExportPayload,
  buildReadouts,
  logSliderToValue,
  meanAnomalyRadFromTime,
  timeFromMeanAnomalyRad,
  valueToLogSlider,
} from "./logic";

const TAU = 2 * Math.PI;
const EPS = 1e-6;

// ---------------------------------------------------------------------------
// logSliderToValue / valueToLogSlider
// ---------------------------------------------------------------------------

describe("logSliderToValue / valueToLogSlider", () => {
  const MIN = 0.3;
  const MAX = 40;

  it("round-trips slider=0 to min value", () => {
    const value = logSliderToValue(0, MIN, MAX);
    expect(value).toBeCloseTo(MIN, 3);
  });

  it("round-trips slider=1000 to max value", () => {
    const value = logSliderToValue(1000, MIN, MAX);
    expect(value).toBeCloseTo(MAX, 3);
  });

  it("round-trips a=1 AU through both conversions", () => {
    const slider = valueToLogSlider(1, MIN, MAX);
    const value = logSliderToValue(slider, MIN, MAX);
    expect(value).toBeCloseTo(1, 2);
  });

  it("round-trips a=5.2 AU (Jupiter)", () => {
    const slider = valueToLogSlider(5.2, MIN, MAX);
    const value = logSliderToValue(slider, MIN, MAX);
    expect(value).toBeCloseTo(5.2, 1);
  });

  it("midpoint slider maps to geometric mean", () => {
    const value = logSliderToValue(500, MIN, MAX);
    const geometricMean = Math.sqrt(MIN * MAX);
    expect(value).toBeCloseTo(geometricMean, 2);
  });
});

// ---------------------------------------------------------------------------
// meanAnomalyRadFromTime / timeFromMeanAnomalyRad
// ---------------------------------------------------------------------------

describe("meanAnomalyRadFromTime / timeFromMeanAnomalyRad", () => {
  it("t=0 gives M=0", () => {
    expect(meanAnomalyRadFromTime(0, 1)).toBeCloseTo(0, 10);
  });

  it("half period gives M=pi", () => {
    expect(meanAnomalyRadFromTime(0.5, 1)).toBeCloseTo(Math.PI, 6);
  });

  it("full period wraps to M=0", () => {
    expect(meanAnomalyRadFromTime(1, 1)).toBeCloseTo(0, 6);
  });

  it("round-trips M=pi/2 with P=2.5 yr", () => {
    const P = 2.5;
    const M = Math.PI / 2;
    const t = timeFromMeanAnomalyRad(M, P);
    const M2 = meanAnomalyRadFromTime(t, P);
    expect(M2).toBeCloseTo(M, 6);
  });

  it("timeFromMeanAnomalyRad wraps negative angles", () => {
    const t = timeFromMeanAnomalyRad(-Math.PI / 2, 1);
    // -pi/2 wraps to 3pi/2, so t = (3pi/2) / (2pi) * 1 = 3/4
    expect(t).toBeCloseTo(0.75, 6);
  });
});

// ---------------------------------------------------------------------------
// buildReadouts
// ---------------------------------------------------------------------------

describe("buildReadouts", () => {
  // Earth-like circular orbit: v = 2pi AU/yr, a = 4pi^2 AU/yr^2
  const earthArgs = {
    rAu: 1,
    speedAuPerYr: TAU,
    accelAuPerYr2: TAU * TAU,
    periodYr: 1,
    specificEnergyAu2Yr2: -2 * Math.PI * Math.PI,
    specificAngularMomentumAu2Yr: TAU,
    arealVelocityAu2Yr: Math.PI,
  };

  it("101 units: velocity in km/s, acceleration in mm/s^2", () => {
    const r = buildReadouts({ ...earthArgs, units: "101" });
    expect(r.velocity.unit).toBe("km/s");
    expect(r.acceleration.unit).toBe("mm/s^2");
  });

  it("201 units: velocity in cm/s, acceleration in cm/s^2", () => {
    const r = buildReadouts({ ...earthArgs, units: "201" });
    expect(r.velocity.unit).toBe("cm/s");
    expect(r.acceleration.unit).toBe("cm/s^2");
  });

  it("distance and period are unit-independent", () => {
    const r101 = buildReadouts({ ...earthArgs, units: "101" });
    const r201 = buildReadouts({ ...earthArgs, units: "201" });
    expect(r101.distance).toEqual({ value: 1, unit: "AU" });
    expect(r201.distance).toEqual({ value: 1, unit: "AU" });
    expect(r101.period).toEqual({ value: 1, unit: "yr" });
  });

  it("kinetic + potential = total energy (101)", () => {
    const r = buildReadouts({ ...earthArgs, units: "101" });
    const sum = r.conservation.kinetic.value + r.conservation.potential.value;
    expect(sum).toBeCloseTo(r.conservation.total.value, 6);
  });

  it("kinetic + potential = total energy (201)", () => {
    const r = buildReadouts({ ...earthArgs, units: "201" });
    const sum = r.conservation.kinetic.value + r.conservation.potential.value;
    expect(sum).toBeCloseTo(r.conservation.total.value, 4);
  });

  it("201 conservation units are CGS", () => {
    const r = buildReadouts({ ...earthArgs, units: "201" });
    expect(r.conservation.kinetic.unit).toBe("cm^2/s^2");
    expect(r.conservation.h.unit).toBe("cm^2/s");
    expect(r.conservation.areal.unit).toBe("cm^2/s");
  });

  it("101 conservation units are AU-based", () => {
    const r = buildReadouts({ ...earthArgs, units: "101" });
    expect(r.conservation.kinetic.unit).toBe("AU^2/yr^2");
    expect(r.conservation.h.unit).toBe("AU^2/yr");
  });

  it("source is preserved for re-use", () => {
    const r = buildReadouts({ ...earthArgs, units: "101" });
    expect(r.source.rAu).toBe(1);
    expect(r.source.units).toBe("101");
  });
});

// ---------------------------------------------------------------------------
// buildExportPayload
// ---------------------------------------------------------------------------

describe("buildExportPayload", () => {
  const baseArgs = {
    mode: "kepler" as const,
    units: "101" as const,
    speed: 1,
    aAu: 1,
    e: 0.017,
    centralMassSolar: 1,
    meanAnomalyDeg: 0,
    rAu: 1,
    speedKmS: 29.78,
    accelMs2: 0.00593,
    periodYr: 1,
    specificEnergy: -39.478,
    specificAngularMomentum: 6.283,
    arealVelocity: 3.1416,
  };

  it("parameters list has 7 entries in correct order", () => {
    const p = buildExportPayload(baseArgs);
    expect(p.parameters).toHaveLength(7);
    expect(p.parameters.map((r) => r.name)).toEqual([
      "Semi-major axis a (AU)",
      "Eccentricity e",
      "Central mass M_star (M_sun)",
      "Mode",
      "Unit system",
      "Speed (yr/s)",
      "Mean anomaly M (deg)",
    ]);
  });

  it("readouts list has 9 entries", () => {
    const p = buildExportPayload(baseArgs);
    expect(p.readouts).toHaveLength(9);
  });

  it("101 units show km/s and AU^2/yr^2", () => {
    const p = buildExportPayload(baseArgs);
    const speedRow = p.readouts.find((r) => r.name.startsWith("Speed"));
    expect(speedRow!.name).toContain("km/s");
    const kineticRow = p.readouts.find((r) => r.name.startsWith("Kinetic"));
    expect(kineticRow!.name).toContain("AU^2/yr^2");
  });

  it("201 units show cm/s and cm^2/s^2", () => {
    const p = buildExportPayload({ ...baseArgs, units: "201" });
    const speedRow = p.readouts.find((r) => r.name.startsWith("Speed"));
    expect(speedRow!.name).toContain("cm/s");
    const kineticRow = p.readouts.find((r) => r.name.startsWith("Kinetic"));
    expect(kineticRow!.name).toContain("cm^2/s^2");
  });

  it("201 velocity converts km/s to cm/s (x 100000)", () => {
    const p = buildExportPayload({ ...baseArgs, units: "201", speedKmS: 1 });
    const speedRow = p.readouts.find((r) => r.name.startsWith("Speed"));
    expect(Number(speedRow!.value)).toBeCloseTo(100000, 0);
  });

  it("mode label is Newton when mode=newton", () => {
    const p = buildExportPayload({ ...baseArgs, mode: "newton" });
    const modeParam = p.parameters.find((r) => r.name === "Mode");
    expect(modeParam!.value).toBe("Newton");
  });

  it("version is 1 and has timestamp", () => {
    const p = buildExportPayload(baseArgs);
    expect(p.version).toBe(1);
    expect(p.timestamp).toBeTruthy();
  });
});
