import { describe, expect, it } from "vitest";
import { BinaryOrbitModel } from "./binaryOrbitModel";

describe("BinaryOrbitModel", () => {
  it("enforces a1 + a2 = separation", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.3,
      separationAu: 6,
      inclinationDeg: 90,
    });
    expect(state.a1Au + state.a2Au).toBeCloseTo(6, 12);
  });

  it("enforces M1*a1 = M2*a2", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.3,
      separationAu: 6,
      inclinationDeg: 90,
    });
    expect(state.primaryMassSolar * state.a1Au).toBeCloseTo(
      state.secondaryMassSolar * state.a2Au,
      12,
    );
  });

  it("enforces M1*v1 = M2*v2 in barycentric frame", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.3,
      separationAu: 6,
      inclinationDeg: 90,
    });
    expect(state.p1SolarAuPerYr).toBeCloseTo(state.p2SolarAuPerYr, 12);
  });

  it("uses shared omega from period", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 1,
      separationAu: 4,
      inclinationDeg: 90,
    });
    expect(state.omegaRadPerYr).toBeCloseTo((2 * Math.PI) / state.periodYr, 12);
    expect(state.v1AuPerYr).toBeCloseTo(state.omegaRadPerYr * state.a1Au, 12);
    expect(state.v2AuPerYr).toBeCloseTo(state.omegaRadPerYr * state.a2Au, 12);
  });

  it("sets RV amplitudes to zero for face-on systems", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.2,
      separationAu: 4,
      inclinationDeg: 0,
    });
    expect(state.k1AuPerYr).toBeCloseTo(0, 12);
    expect(state.k2AuPerYr).toBeCloseTo(0, 12);
  });

  it("sets RV amplitudes equal to orbital speeds for edge-on systems", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.2,
      separationAu: 4,
      inclinationDeg: 90,
    });
    expect(state.k1AuPerYr).toBeCloseTo(state.v1AuPerYr, 12);
    expect(state.k2AuPerYr).toBeCloseTo(state.v2AuPerYr, 12);
  });

  it("planet limit produces tiny primary orbit", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.01,
      separationAu: 4,
      inclinationDeg: 90,
    });
    expect(state.a1Au).toBeLessThan(0.05);
    expect(state.a2Au).toBeGreaterThan(3.9);
  });

  it("returns RV samples over a full cycle", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.5,
      separationAu: 4,
      inclinationDeg: 60,
    });

    const curve = BinaryOrbitModel.sampleRadialVelocityCurve({ state, sampleCount: 120 });
    expect(curve.length).toBe(121);
    expect(curve[0]?.rv1AuPerYr).toBeCloseTo(0, 12);
    expect(curve[0]?.rv2AuPerYr).toBeCloseTo(0, 12);

    const quarter = curve[Math.floor(curve.length / 4)];
    expect(Math.abs(quarter.rv1AuPerYr)).toBeCloseTo(state.k1AuPerYr, 2);
    expect(Math.abs(quarter.rv2AuPerYr)).toBeCloseTo(state.k2AuPerYr, 2);
  });

  it("returns circular-orbit energy consistency in teaching units", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.5,
      separationAu: 4,
      inclinationDeg: 60,
    });

    expect(state.totalEnergySolarAu2PerYr2).toBeCloseTo(
      state.kineticTotalSolarAu2PerYr2 + state.potentialSolarAu2PerYr2,
      12,
    );

    const expectedCircularTotal = -(4 * Math.PI * Math.PI * state.primaryMassSolar * state.secondaryMassSolar)
      / (2 * state.separationAu);
    expect(state.totalEnergySolarAu2PerYr2).toBeCloseTo(expectedCircularTotal, 12);
    expect(state.virialResidualSolarAu2PerYr2).toBeCloseTo(0, 12);
  });

  it("infers mass ratio from exact RV amplitudes", () => {
    const inferred = BinaryOrbitModel.inferMassRatioFromRvAmplitudes({
      k1KmPerS: 3.5,
      k2KmPerS: 14,
    });

    expect(inferred.valid).toBe(true);
    expect(inferred.massRatioEstimate).toBeCloseTo(0.25, 12);
    expect(inferred.reason).toBeUndefined();
  });

  it("rejects invalid RV inversion amplitudes", () => {
    const badZero = BinaryOrbitModel.inferMassRatioFromRvAmplitudes({
      k1KmPerS: 0,
      k2KmPerS: 2,
    });
    expect(badZero.valid).toBe(false);
    expect(badZero.massRatioEstimate).toBeNaN();

    const badNan = BinaryOrbitModel.inferMassRatioFromRvAmplitudes({
      k1KmPerS: Number.NaN,
      k2KmPerS: 2,
    });
    expect(badNan.valid).toBe(false);
    expect(badNan.massRatioEstimate).toBeNaN();
  });
});
