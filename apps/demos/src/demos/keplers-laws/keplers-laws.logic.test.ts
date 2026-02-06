import { describe, expect, test } from "vitest";
import {
  buildExportPayload,
  buildReadouts,
  logSliderToValue,
  meanAnomalyRadFromTime,
  timeFromMeanAnomalyRad,
  valueToLogSlider
} from "./keplers-laws-logic";

const EPS = 1e-6;

test("log slider mapping round-trips for a (0.3-40 AU)", () => {
  const slider = valueToLogSlider(1, 0.3, 40);
  const value = logSliderToValue(slider, 0.3, 40);
  expect(Math.abs(value - 1)).toBeLessThan(1e-3);
});

test("time/anomaly conversions are consistent", () => {
  const P = 2.5;
  const M = Math.PI / 2;
  const t = timeFromMeanAnomalyRad(M, P);
  const M2 = meanAnomalyRadFromTime(t, P);
  expect(Math.abs(M2 - M)).toBeLessThan(EPS);
});

test("readouts match unit toggles (101 vs 201)", () => {
  const base = buildReadouts({
    rAu: 1,
    speedAuPerYr: 2 * Math.PI,
    accelAuPerYr2: 4 * Math.PI * Math.PI,
    periodYr: 1,
    specificEnergyAu2Yr2: -2 * Math.PI * Math.PI,
    specificAngularMomentumAu2Yr: 2 * Math.PI,
    arealVelocityAu2Yr: Math.PI,
    units: "101"
  });
  expect(base.velocity.unit).toBe("km/s");
  expect(base.acceleration.unit).toBe("mm/s^2");

  const cgs = buildReadouts({
    ...base.source,
    units: "201"
  });
  expect(cgs.velocity.unit).toBe("cm/s");
  expect(cgs.acceleration.unit).toBe("cm/s^2");
});

test("export payload order matches UI controls/readouts", () => {
  const payload = buildExportPayload({
    mode: "kepler",
    units: "101",
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
    arealVelocity: 3.1416
  });

  expect(payload.parameters.map((r) => r.name)).toEqual([
    "Semi-major axis a (AU)",
    "Eccentricity e",
    "Central mass M_star (M_sun)",
    "Mode",
    "Unit system",
    "Speed (yr/s)",
    "Mean anomaly M (deg)"
  ]);

  expect(payload.readouts.map((r) => r.name).slice(0, 4)).toEqual([
    "Distance r (AU)",
    "Velocity v (km/s)",
    "Acceleration (mm/s^2)",
    "Period P (yr)"
  ]);
});

test("export payload converts velocity to cm/s in 201 units", () => {
  const payload = buildExportPayload({
    mode: "kepler",
    units: "201",
    speed: 1,
    aAu: 1,
    e: 0.017,
    centralMassSolar: 1,
    meanAnomalyDeg: 0,
    rAu: 1,
    speedKmS: 1,
    accelMs2: 0.00593,
    periodYr: 1,
    specificEnergy: -39.478,
    specificAngularMomentum: 6.283,
    arealVelocity: 3.1416
  });

  const velocityRow = payload.readouts.find((row) => row.name.startsWith("Velocity v"));
  expect(velocityRow).toBeTruthy();
  expect(Number(velocityRow!.value)).toBeCloseTo(100000, 2);
});

test("export payload converts velocity to cm/s in 201 units", () => {
  const payload = buildExportPayload({
    mode: "kepler",
    units: "201",
    speed: 1,
    aAu: 1,
    e: 0.017,
    centralMassSolar: 1,
    meanAnomalyDeg: 0,
    rAu: 1,
    speedKmS: 1,
    accelMs2: 0.00593,
    periodYr: 1,
    specificEnergy: -39.478,
    specificAngularMomentum: 6.283,
    arealVelocity: 3.1416
  });

  const velocityRow = payload.readouts.find((row) => row.name.startsWith("Velocity v"));
  expect(velocityRow).toBeTruthy();
  expect(Number(velocityRow!.value)).toBeCloseTo(100000, 2);
});
