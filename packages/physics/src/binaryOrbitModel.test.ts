import { describe, expect, it } from "vitest";
import { BinaryOrbitModel } from "./binaryOrbitModel";

describe("BinaryOrbitModel", () => {
  it("uses a single projection helper for inclination in degrees", () => {
    expect(BinaryOrbitModel.projectionFactorFromInclinationDeg(0)).toBeCloseTo(0, 12);
    expect(BinaryOrbitModel.projectionFactorFromInclinationDeg(30)).toBeCloseTo(0.5, 12);
    expect(BinaryOrbitModel.projectionFactorFromInclinationDeg(90)).toBeCloseTo(1, 12);
    expect(BinaryOrbitModel.projectionFactorFromInclinationDeg(120)).toBeCloseTo(1, 12);
  });

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
    expect(state.sinInclination).toBeCloseTo(0, 12);
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
    expect(state.sinInclination).toBeCloseTo(1, 12);
  });

  it("rescales only projected observables with sin(i)", () => {
    const edgeOn = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.5,
      separationAu: 1,
      inclinationDeg: 90,
    });
    const tilted = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.5,
      separationAu: 1,
      inclinationDeg: 30,
    });

    expect(tilted.a1Au).toBeCloseTo(edgeOn.a1Au, 12);
    expect(tilted.a2Au).toBeCloseTo(edgeOn.a2Au, 12);
    expect(tilted.v1AuPerYr).toBeCloseTo(edgeOn.v1AuPerYr, 12);
    expect(tilted.v2AuPerYr).toBeCloseTo(edgeOn.v2AuPerYr, 12);
    expect(tilted.periodYr).toBeCloseTo(edgeOn.periodYr, 12);
    expect(tilted.omegaRadPerYr).toBeCloseTo(edgeOn.omegaRadPerYr, 12);
    expect(tilted.k1AuPerYr / edgeOn.k1AuPerYr).toBeCloseTo(0.5, 12);
    expect(tilted.k2AuPerYr / edgeOn.k2AuPerYr).toBeCloseTo(0.5, 12);
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

  it("computes the SB1 mass function from observables", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.2,
      separationAu: 4,
      inclinationDeg: 60,
    });

    const massFunction = BinaryOrbitModel.massFunctionSolar({
      k1KmPerS: state.k1KmPerS,
      periodYr: state.periodYr,
    });

    const sinI = Math.sin((state.inclinationDeg * Math.PI) / 180);
    const expected = (Math.pow(state.secondaryMassSolar * sinI, 3))
      / Math.pow(state.totalMassSolar, 2);
    expect(massFunction).toBeCloseTo(expected, 12);
  });

  it("computes SB2 minimum masses from observables", () => {
    const state = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.5,
      separationAu: 4,
      inclinationDeg: 30,
    });

    const masses = BinaryOrbitModel.minimumMassesSolar({
      k1KmPerS: state.k1KmPerS,
      k2KmPerS: state.k2KmPerS,
      periodYr: state.periodYr,
    });

    const sinICubed = Math.pow(Math.sin((state.inclinationDeg * Math.PI) / 180), 3);
    expect(masses.primaryMinimumMassSolar).toBeCloseTo(state.primaryMassSolar * sinICubed, 12);
    expect(masses.secondaryMinimumMassSolar).toBeCloseTo(state.secondaryMassSolar * sinICubed, 12);
  });

  it("preserves inclination scaling in the mass function and minimum masses", () => {
    const edgeOn = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.2,
      separationAu: 4,
      inclinationDeg: 90,
    });
    const tilted = BinaryOrbitModel.circularState({
      primaryMassSolar: 1,
      secondaryMassSolar: 0.2,
      separationAu: 4,
      inclinationDeg: 30,
    });

    const edgeOnMassFunction = BinaryOrbitModel.massFunctionSolar({
      k1KmPerS: edgeOn.k1KmPerS,
      periodYr: edgeOn.periodYr,
    });
    const tiltedMassFunction = BinaryOrbitModel.massFunctionSolar({
      k1KmPerS: tilted.k1KmPerS,
      periodYr: tilted.periodYr,
    });
    expect(tiltedMassFunction / edgeOnMassFunction).toBeCloseTo(Math.pow(Math.sin(Math.PI / 6), 3), 12);

    const edgeOnMinimumMasses = BinaryOrbitModel.minimumMassesSolar({
      k1KmPerS: edgeOn.k1KmPerS,
      k2KmPerS: edgeOn.k2KmPerS,
      periodYr: edgeOn.periodYr,
    });
    const tiltedMinimumMasses = BinaryOrbitModel.minimumMassesSolar({
      k1KmPerS: tilted.k1KmPerS,
      k2KmPerS: tilted.k2KmPerS,
      periodYr: tilted.periodYr,
    });
    expect(
      tiltedMinimumMasses.secondaryMinimumMassSolar / edgeOnMinimumMasses.secondaryMinimumMassSolar,
    ).toBeCloseTo(Math.pow(Math.sin(Math.PI / 6), 3), 12);
  });
});
