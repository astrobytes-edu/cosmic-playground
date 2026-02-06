import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AstroUnits } from "@cosmic/physics";

const TAU = 2 * Math.PI;

export function logSliderToValue(slider: number, min: number, max: number): number {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const fraction = slider / 1000;
  return Math.pow(10, minLog + fraction * (maxLog - minLog));
}

export function valueToLogSlider(value: number, min: number, max: number): number {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const logVal = Math.log10(value);
  return Math.round(((logVal - minLog) / (maxLog - minLog)) * 1000);
}

export function meanAnomalyRadFromTime(tYr: number, periodYr: number): number {
  return (TAU * (tYr / periodYr)) % TAU;
}

export function timeFromMeanAnomalyRad(meanAnomalyRad: number, periodYr: number): number {
  const wrapped = ((meanAnomalyRad % TAU) + TAU) % TAU;
  return (wrapped / TAU) * periodYr;
}

function au2PerYr2ToCm2PerS2(valueAu2Yr2: number): number {
  const cmPerAu = AstroUnits.auToCm(1);
  const secPerYr = AstroUnits.yearsToSeconds(1);
  return (valueAu2Yr2 * cmPerAu * cmPerAu) / (secPerYr * secPerYr);
}

function au2PerYrToCm2PerS(valueAu2Yr: number): number {
  const cmPerAu = AstroUnits.auToCm(1);
  const secPerYr = AstroUnits.yearsToSeconds(1);
  return (valueAu2Yr * cmPerAu * cmPerAu) / secPerYr;
}

export function buildReadouts(args: {
  rAu: number;
  speedAuPerYr: number;
  accelAuPerYr2: number;
  periodYr: number;
  specificEnergyAu2Yr2: number;
  specificAngularMomentumAu2Yr: number;
  arealVelocityAu2Yr: number;
  units: "101" | "201";
}) {
  const { units } = args;

  const velocity =
    units === "201"
      ? { value: AstroUnits.auPerYrToCmPerS(args.speedAuPerYr), unit: "cm/s" }
      : { value: AstroUnits.auPerYrToKmPerS(args.speedAuPerYr), unit: "km/s" };

  const acceleration =
    units === "201"
      ? { value: AstroUnits.auPerYr2ToCmPerS2(args.accelAuPerYr2), unit: "cm/s^2" }
      : { value: AstroUnits.auPerYr2ToMPerS2(args.accelAuPerYr2) * 1000, unit: "mm/s^2" };

  const kineticAu2Yr2 = 0.5 * args.speedAuPerYr * args.speedAuPerYr;
  const potentialAu2Yr2 = args.specificEnergyAu2Yr2 - kineticAu2Yr2;

  const conservation =
    units === "201"
      ? {
          kinetic: { value: au2PerYr2ToCm2PerS2(kineticAu2Yr2), unit: "cm^2/s^2" },
          potential: { value: au2PerYr2ToCm2PerS2(potentialAu2Yr2), unit: "cm^2/s^2" },
          total: { value: au2PerYr2ToCm2PerS2(args.specificEnergyAu2Yr2), unit: "cm^2/s^2" },
          h: { value: au2PerYrToCm2PerS(args.specificAngularMomentumAu2Yr), unit: "cm^2/s" },
          areal: { value: au2PerYrToCm2PerS(args.arealVelocityAu2Yr), unit: "cm^2/s" }
        }
      : {
          kinetic: { value: kineticAu2Yr2, unit: "AU^2/yr^2" },
          potential: { value: potentialAu2Yr2, unit: "AU^2/yr^2" },
          total: { value: args.specificEnergyAu2Yr2, unit: "AU^2/yr^2" },
          h: { value: args.specificAngularMomentumAu2Yr, unit: "AU^2/yr" },
          areal: { value: args.arealVelocityAu2Yr, unit: "AU^2/yr" }
        };

  return {
    source: args,
    velocity,
    acceleration,
    period: { value: args.periodYr, unit: "yr" },
    distance: { value: args.rAu, unit: "AU" },
    conservation
  };
}

export function buildExportPayload(args: {
  mode: "kepler" | "newton";
  units: "101" | "201";
  speed: number;
  aAu: number;
  e: number;
  centralMassSolar: number;
  meanAnomalyDeg: number;
  rAu: number;
  speedKmS: number;
  accelMs2: number;
  periodYr: number;
  specificEnergy: number;
  specificAngularMomentum: number;
  arealVelocity: number;
}): ExportPayloadV1 {
  const accelUnit = args.units === "201" ? "cm/s^2" : "mm/s^2";
  const velocityUnit = args.units === "201" ? "cm/s" : "km/s";
  const energyUnit = args.units === "201" ? "cm^2/s^2" : "AU^2/yr^2";
  const angMomUnit = args.units === "201" ? "cm^2/s" : "AU^2/yr";

  const speedAuPerYr = AstroUnits.kmPerSToAuPerYr(args.speedKmS);
  const speedValue = args.units === "201" ? args.speedKmS * 100000 : args.speedKmS;
  const kineticAu2Yr2 = 0.5 * speedAuPerYr * speedAuPerYr;
  const potentialAu2Yr2 = args.specificEnergy - kineticAu2Yr2;

  const kinetic = args.units === "201" ? au2PerYr2ToCm2PerS2(kineticAu2Yr2) : kineticAu2Yr2;
  const potential = args.units === "201" ? au2PerYr2ToCm2PerS2(potentialAu2Yr2) : potentialAu2Yr2;
  const total = args.units === "201" ? au2PerYr2ToCm2PerS2(args.specificEnergy) : args.specificEnergy;
  const h = args.units === "201" ? au2PerYrToCm2PerS(args.specificAngularMomentum) : args.specificAngularMomentum;
  const areal = args.units === "201" ? au2PerYrToCm2PerS(args.arealVelocity) : args.arealVelocity;

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Semi-major axis a (AU)", value: args.aAu.toFixed(3) },
      { name: "Eccentricity e", value: args.e.toFixed(3) },
      { name: "Central mass M_star (M_sun)", value: args.centralMassSolar.toFixed(3) },
      { name: "Mode", value: args.mode === "newton" ? "Newton" : "Kepler" },
      { name: "Unit system", value: args.units === "201" ? "201 (CGS)" : "101 (AU/yr)" },
      { name: "Speed (yr/s)", value: args.speed.toFixed(2) },
      { name: "Mean anomaly M (deg)", value: String(Math.round(args.meanAnomalyDeg)) }
    ],
    readouts: [
      { name: "Distance r (AU)", value: args.rAu.toFixed(3) },
      { name: `Velocity v (${velocityUnit})`, value: speedValue.toFixed(2) },
      { name: `Acceleration (${accelUnit})`, value: args.accelMs2.toFixed(3) },
      { name: "Period P (yr)", value: args.periodYr.toFixed(3) },
      { name: `Kinetic (v^2/2) (${energyUnit})`, value: kinetic.toFixed(4) },
      { name: `Potential (-mu/r) (${energyUnit})`, value: potential.toFixed(4) },
      { name: `Total eps (${energyUnit})`, value: total.toFixed(4) },
      { name: `Angular momentum h (${angMomUnit})`, value: h.toFixed(4) },
      { name: `Areal velocity (dA/dt) (${angMomUnit})`, value: areal.toFixed(4) }
    ],
    notes: [
      "Units and labels match the UI controls/readouts.",
      "Teaching normalization: G = 4pi^2 AU^3/(yr^2*M_sun).",
      "Time slider advances mean anomaly uniformly; position is computed via Kepler's equation."
    ]
  };
}
