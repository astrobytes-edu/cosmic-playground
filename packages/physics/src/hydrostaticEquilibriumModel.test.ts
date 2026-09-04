import { describe, expect, it } from "vitest";

import { HydrostaticEquilibriumModel } from "./hydrostaticEquilibriumModel";

function expectRelativeClose(actual: number, expected: number, relativeTolerance: number): void {
  const scale = Math.max(Math.abs(expected), 1);
  expect(Math.abs(actual - expected) / scale).toBeLessThanOrEqual(relativeTolerance);
}

describe("HydrostaticEquilibriumModel", () => {
  const solarMassG = 1.98847e33;
  const solarRadiusCm = 6.957e10;

  it("computes mean density for a 1 Msun, 1 Rsun star", () => {
    const rhoMean = HydrostaticEquilibriumModel.meanDensityGPerCm3({
      massG: solarMassG,
      radiusCm: solarRadiusCm
    });

    expect(rhoMean).toBeGreaterThan(1.3);
    expect(rhoMean).toBeLessThan(1.5);
  });

  it("matches the exact uniform-density central pressure and boundary condition", () => {
    const pressureCenter = HydrostaticEquilibriumModel.pressureProfileUniformDynePerCm2({
      radiusCm: 0,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });
    const pressureSurface = HydrostaticEquilibriumModel.pressureProfileUniformDynePerCm2({
      radiusCm: solarRadiusCm,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });
    const expectedCenter =
      (3 * HydrostaticEquilibriumModel.constants.gravitationalConstantCgs * solarMassG * solarMassG) /
      (8 * Math.PI * Math.pow(solarRadiusCm, 4));

    expectRelativeClose(pressureCenter, expectedCenter, 1e-12);
    expect(pressureSurface).toBeCloseTo(0, 8);
  });

  it("keeps the uniform-density pressure gradient zero at the center and negative away from it", () => {
    const centerGradient = HydrostaticEquilibriumModel.pressureGradientUniformDynePerCm3({
      radiusCm: 0,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });
    const midGradient = HydrostaticEquilibriumModel.pressureGradientUniformDynePerCm3({
      radiusCm: 0.5 * solarRadiusCm,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });

    expect(centerGradient).toBeCloseTo(0, 12);
    expect(midGradient).toBeLessThan(0);
  });

  it("normalizes the centrally concentrated toy profile to the requested total mass", () => {
    const pressureCenter = HydrostaticEquilibriumModel.pressureProfileCentralToyDynePerCm2({
      radiusCm: 0,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });
    const enclosedAtSurface = HydrostaticEquilibriumModel.enclosedMassCentralToyG({
      radiusCm: solarRadiusCm,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });
    const rhoCenter = HydrostaticEquilibriumModel.densityCentralToyGPerCm3({
      radiusCm: 0,
      totalRadiusCm: solarRadiusCm,
      totalMassG: solarMassG
    });
    const rhoMean = HydrostaticEquilibriumModel.meanDensityGPerCm3({
      massG: solarMassG,
      radiusCm: solarRadiusCm
    });

    expectRelativeClose(enclosedAtSurface, solarMassG, 1e-12);
    expectRelativeClose(rhoCenter / rhoMean, 2.5, 1e-12);
    expect(pressureCenter).toBeGreaterThan(
      HydrostaticEquilibriumModel.pressureProfileUniformDynePerCm2({
        radiusCm: 0,
        totalRadiusCm: solarRadiusCm,
        totalMassG: solarMassG
      })
    );
  });

  it("recovers the usual core-temperature scale for a solar-like star", () => {
    const temperatureK = HydrostaticEquilibriumModel.coreTemperatureScaleK({
      massG: solarMassG,
      radiusCm: solarRadiusCm,
      meanMolecularWeightMu: 0.62
    });

    expect(temperatureK).toBeGreaterThan(1.0e7);
    expect(temperatureK).toBeLessThan(2.0e7);
  });

  it("samples monotonic radial profiles for both toy density models", () => {
    const uniform = HydrostaticEquilibriumModel.sampleRadialProfile({
      densityModel: "uniform",
      totalMassG: solarMassG,
      totalRadiusCm: solarRadiusCm,
      sampleCount: 64
    });
    const central = HydrostaticEquilibriumModel.sampleRadialProfile({
      densityModel: "central-toy",
      totalMassG: solarMassG,
      totalRadiusCm: solarRadiusCm,
      sampleCount: 64
    });

    expect(uniform.length).toBe(64);
    expect(central.length).toBe(64);

    for (let i = 1; i < uniform.length; i += 1) {
      expect(uniform[i].radiusFraction).toBeGreaterThan(uniform[i - 1].radiusFraction);
      expect(uniform[i].enclosedMassG).toBeGreaterThanOrEqual(uniform[i - 1].enclosedMassG);
      expect(uniform[i].pressureDynePerCm2).toBeLessThanOrEqual(uniform[i - 1].pressureDynePerCm2);
    }

    for (let i = 1; i < central.length; i += 1) {
      expect(central[i].densityGPerCm3).toBeLessThanOrEqual(central[i - 1].densityGPerCm3);
      expect(central[i].pressureDynePerCm2).toBeLessThanOrEqual(central[i - 1].pressureDynePerCm2);
    }
  });
});
