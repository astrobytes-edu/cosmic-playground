import { describe, expect, it } from "vitest";
import { StellarEosModel } from "@cosmic/physics";

import {
  clamp,
  compositionFromXY,
  formatScientific,
  formatScientificLatex,
  formatScientificMath,
  logSliderToValue,
  percent,
  pressureBarPercent,
  pressureTone,
  regimeMapCoordinates,
  valueToLogSlider,
  meanMolecularWeight,
  meanMolecularWeightPerElectron,
  pressureCurveData,
  gasRadBoundaryLogRho,
  gasDegBoundaryLogRho,
  radDegBoundaryLogRho,
  boundaryPolyline,
  dominantChannelAt,
  gasDeepDiveData,
  radDeepDiveData,
  degDeepDiveData,
  latexScientific,
  gasEquationLatex,
  radEquationLatex,
  degEquationLatex,
  adiabaticIndex,
  gasEquationSymbolic,
  radEquationSymbolic,
  degEquationSymbolic,
  solarProfileData,
  getContextualSuggestion,
  type ContextualSuggestionInput,
  SCALING_CHALLENGES,
  checkScalingAnswer,
  LOG_AXIS_FLOOR,
  logSafe
} from "./logic";

const SOLAR_COMPOSITION = {
  hydrogenMassFractionX: 0.7,
  heliumMassFractionY: 0.28,
  metalMassFractionZ: 0.02,
};

/* ──────────────────────────────────────────────────
 * Original tests (preserved)
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- UI Logic", () => {
  it("clamps values to bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("round-trips log slider conversions", () => {
    const valueMin = 1e3;
    const valueMax = 1e9;
    const slider = valueToLogSlider({
      value: 1e6,
      sliderMin: 0,
      sliderMax: 1000,
      valueMin,
      valueMax,
    });
    const value = logSliderToValue({
      sliderValue: slider,
      sliderMin: 0,
      sliderMax: 1000,
      valueMin,
      valueMax,
    });
    expect(value).toBeCloseTo(1e6, 8);
  });

  it("formats one number for plain-text, LaTeX-body and delimited-math sinks", () => {
    // [value, digits, formatScientific, formatScientificLatex, formatScientificMath]
    const cases: Array<[number, number, string, string, string]> = [
      // Exponent notation: ASCII for canvas/exports, \times for KaTeX.
      [1.2e7, 3, "1.20x10^7", "1.20 \\times 10^{7}", "$1.20 \\times 10^{7}$"],
      [3.4e-5, 3, "3.40x10^-5", "3.40 \\times 10^{-5}", "$3.40 \\times 10^{-5}$"],
      [-2.5e9, 3, "-2.50x10^9", "-2.50 \\times 10^{9}", "$-2.50 \\times 10^{9}$"],
      // Switch points: 1e5 and above, and below 1e-3, take the exponent; just inside do not.
      [1e5, 3, "1.00x10^5", "1.00 \\times 10^{5}", "$1.00 \\times 10^{5}$"],
      [99999, 3, "99999.000", "99999.000", "99999.000"],
      [9.99e-4, 3, "9.99x10^-4", "9.99 \\times 10^{-4}", "$9.99 \\times 10^{-4}$"],
      [1e-3, 3, "0.001", "0.001", "0.001"],
      // Zero is exact; a failed solve is marked unavailable, never zero.
      [0, 3, "0", "0", "0"],
      [Number.NaN, 3, "\u2014", "\\text{--}", "\u2014"],
    ];
    for (const [value, digits, plain, latexBody, math] of cases) {
      expect(formatScientific(value, digits), `formatScientific(${value})`).toBe(plain);
      expect(formatScientificLatex(value, digits), `formatScientificLatex(${value})`).toBe(latexBody);
      expect(formatScientificMath(value, digits), `formatScientificMath(${value})`).toBe(math);
    }
  });

  it("formats percentages", () => {
    expect(percent(0.5)).toBe("50.0");
    expect(percent(Number.NaN)).toBe("\u2014");
  });

  it("computes bounded pressure bars", () => {
    expect(
      pressureBarPercent({ pressureDynePerCm2: 5, maxPressureDynePerCm2: 10 })
    ).toBe(50);
    expect(
      pressureBarPercent({ pressureDynePerCm2: 20, maxPressureDynePerCm2: 10 })
    ).toBe(100);
    expect(
      pressureBarPercent({ pressureDynePerCm2: 1, maxPressureDynePerCm2: 0 })
    ).toBe(0);
  });

  it("classifies tone by relative dominance", () => {
    expect(
      pressureTone({ pressureDynePerCm2: 9, dominantPressureDynePerCm2: 10 })
    ).toBe("dominant");
    expect(
      pressureTone({ pressureDynePerCm2: 4, dominantPressureDynePerCm2: 10 })
    ).toBe("secondary");
    expect(
      pressureTone({ pressureDynePerCm2: 1, dominantPressureDynePerCm2: 10 })
    ).toBe("minor");
  });

  it("builds composition with X + Y + Z = 1", () => {
    const composition = compositionFromXY({
      hydrogenMassFractionX: 0.7,
      heliumMassFractionY: 0.28,
    });
    expect(composition.hydrogenMassFractionX).toBeCloseTo(0.7, 8);
    expect(composition.heliumMassFractionY).toBeCloseTo(0.28, 8);
    expect(composition.metalMassFractionZ).toBeCloseTo(0.02, 8);
  });

  it("clamps Y when X + Y would exceed unity", () => {
    const composition = compositionFromXY({
      hydrogenMassFractionX: 0.9,
      heliumMassFractionY: 0.6,
    });
    expect(composition.hydrogenMassFractionX).toBeCloseTo(0.9, 8);
    expect(composition.heliumMassFractionY).toBeCloseTo(0.1, 8);
    expect(composition.metalMassFractionZ).toBeCloseTo(0, 8);
  });

  it("maps regime-map corners into expected plot bounds", () => {
    const minPoint = regimeMapCoordinates({
      temperatureK: 1e3,
      densityGPerCm3: 1e-10,
      temperatureMinK: 1e3,
      temperatureMaxK: 1e9,
      densityMinGPerCm3: 1e-10,
      densityMaxGPerCm3: 1e10,
    });
    expect(minPoint.xPct).toBeCloseTo(0, 8);
    expect(minPoint.yPct).toBeCloseTo(100, 8);

    const maxPoint = regimeMapCoordinates({
      temperatureK: 1e9,
      densityGPerCm3: 1e10,
      temperatureMinK: 1e3,
      temperatureMaxK: 1e9,
      densityMinGPerCm3: 1e-10,
      densityMaxGPerCm3: 1e10,
    });
    expect(maxPoint.xPct).toBeCloseTo(100, 8);
    expect(maxPoint.yPct).toBeCloseTo(0, 8);
  });

  it("clamps regime-map coordinates outside domain", () => {
    const point = regimeMapCoordinates({
      temperatureK: 1e12,
      densityGPerCm3: 1e-20,
      temperatureMinK: 1e3,
      temperatureMaxK: 1e9,
      densityMinGPerCm3: 1e-10,
      densityMaxGPerCm3: 1e10,
    });
    expect(point.xPct).toBeCloseTo(100, 8);
    expect(point.yPct).toBeCloseTo(100, 8);
  });
});

/* ──────────────────────────────────────────────────
 * Mean molecular weight
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- Mean molecular weight", () => {
  it("solar composition gives mu ~ 0.617", () => {
    const mu = meanMolecularWeight(SOLAR_COMPOSITION);
    expect(mu).toBeCloseTo(0.617, 2);
  });

  it("pure hydrogen gives mu = 0.5", () => {
    const mu = meanMolecularWeight({
      hydrogenMassFractionX: 1,
      heliumMassFractionY: 0,
      metalMassFractionZ: 0,
    });
    expect(mu).toBeCloseTo(0.5, 8);
  });

  it("solar composition gives mu_e ~ 1.17", () => {
    const muE = meanMolecularWeightPerElectron(SOLAR_COMPOSITION);
    expect(muE).toBeCloseTo(1.17, 1);
  });

  it("pure hydrogen gives mu_e = 1", () => {
    const muE = meanMolecularWeightPerElectron({
      hydrogenMassFractionX: 1,
      heliumMassFractionY: 0,
      metalMassFractionZ: 0,
    });
    expect(muE).toBeCloseTo(1, 8);
  });
});

/* ──────────────────────────────────────────────────
 * Pressure curve data
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- Pressure curve data", () => {
  it("returns arrays of the requested length", () => {
    const data = pressureCurveData({
      temperatureK: 1.57e7,
      composition: SOLAR_COMPOSITION,
      radiationDepartureEta: 1,
      samples: 50,
    });
    expect(data.densities.length).toBe(50);
    expect(data.pGas.length).toBe(50);
    expect(data.pRad.length).toBe(50);
    expect(data.pDeg.length).toBe(50);
    expect(data.pTotal.length).toBe(50);
  });

  it("all pressure values are positive (log-safe)", () => {
    const data = pressureCurveData({
      temperatureK: 1.57e7,
      composition: SOLAR_COMPOSITION,
      radiationDepartureEta: 1,
      samples: 30,
    });
    for (let i = 0; i < data.densities.length; i++) {
      expect(data.pGas[i]).toBeGreaterThan(0);
      expect(data.pRad[i]).toBeGreaterThan(0);
      expect(data.pDeg[i]).toBeGreaterThan(0);
      expect(data.pTotal[i]).toBeGreaterThan(0);
    }
  });

  it("P_total >= P_gas + P_rad at each point (deg adds to total)", () => {
    const data = pressureCurveData({
      temperatureK: 1e7,
      composition: SOLAR_COMPOSITION,
      radiationDepartureEta: 1,
      samples: 20,
    });
    for (let i = 0; i < data.densities.length; i++) {
      // Allow for 1e-30 floor effects; total should be >= sum of gas+rad
      expect(data.pTotal[i]).toBeGreaterThanOrEqual(
        Math.max(data.pGas[i], data.pRad[i]) * 0.99
      );
    }
  });

  it("P_gas is monotonically increasing in density", () => {
    const data = pressureCurveData({
      temperatureK: 1e7,
      composition: SOLAR_COMPOSITION,
      radiationDepartureEta: 1,
      samples: 30,
    });
    for (let i = 1; i < data.densities.length; i++) {
      expect(data.pGas[i]).toBeGreaterThanOrEqual(data.pGas[i - 1]);
    }
  });
});

/* ──────────────────────────────────────────────────
 * Regime map boundaries
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- Boundary curves", () => {
  const mu = meanMolecularWeight(SOLAR_COMPOSITION);
  const muE = meanMolecularWeightPerElectron(SOLAR_COMPOSITION);

  it("gas-rad boundary has slope 3 in log-log", () => {
    const logRho1 = gasRadBoundaryLogRho(6, mu);
    const logRho2 = gasRadBoundaryLogRho(7, mu);
    const slope = (logRho2 - logRho1) / (7 - 6);
    expect(slope).toBeCloseTo(3, 6);
  });

  it("gas-deg boundary has slope 3/2 in log-log (NR limit)", () => {
    const logRho1 = gasDegBoundaryLogRho(6, mu, muE);
    const logRho2 = gasDegBoundaryLogRho(7, mu, muE);
    const slope = (logRho2 - logRho1) / (7 - 6);
    expect(slope).toBeCloseTo(1.5, 6);
  });

  it("rad-deg boundary has slope 12/5 in log-log", () => {
    const logRho1 = radDegBoundaryLogRho(6, muE);
    const logRho2 = radDegBoundaryLogRho(7, muE);
    const slope = (logRho2 - logRho1) / (7 - 6);
    expect(slope).toBeCloseTo(2.4, 6);
  });

  it("gas-rad and gas-deg boundaries intersect at the triple point", () => {
    // At the triple point, all three pressures are equal.
    // Gas=Rad and Gas=Deg should give the same logRho at some logT.
    // Solve: 3*logT + C1 = 1.5*logT + C2  =>  logT = (C2 - C1) / 1.5
    const c1 = gasRadBoundaryLogRho(0, mu);
    const c2 = gasDegBoundaryLogRho(0, mu, muE);
    const logTTriple = (c2 - c1) / (3 - 1.5);

    const rhoFromGasRad = gasRadBoundaryLogRho(logTTriple, mu);
    const rhoFromGasDeg = gasDegBoundaryLogRho(logTTriple, mu, muE);
    expect(rhoFromGasRad).toBeCloseTo(rhoFromGasDeg, 4);
  });

  it("boundaryPolyline returns finite points within domain", () => {
    const poly = boundaryPolyline({
      boundaryFn: (logT) => gasRadBoundaryLogRho(logT, mu),
      logTMin: 3,
      logTMax: 9,
      logRhoMin: -10,
      logRhoMax: 10,
      samples: 50,
    });
    expect(poly.logT.length).toBeGreaterThan(0);
    expect(poly.logT.length).toBe(poly.logRho.length);
    for (let i = 0; i < poly.logRho.length; i++) {
      expect(poly.logRho[i]).toBeGreaterThanOrEqual(-10);
      expect(poly.logRho[i]).toBeLessThanOrEqual(10);
    }
  });

  it("boundaryPolyline clips points outside rho domain", () => {
    // Gas-rad boundary at very low T will give very low rho — should be clipped
    const poly = boundaryPolyline({
      boundaryFn: (logT) => gasRadBoundaryLogRho(logT, mu),
      logTMin: 3,
      logTMax: 9,
      logRhoMin: -5,
      logRhoMax: 5,
      samples: 50,
    });
    // Fewer points than requested since many are clipped
    expect(poly.logT.length).toBeLessThan(50);
  });
});

/* ──────────────────────────────────────────────────
 * Dominant channel classification
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- Dominant channel", () => {
  it("solar core: gas-dominated", () => {
    const ch = dominantChannelAt({
      temperatureK: 1.57e7,
      densityGPerCm3: 150,
      composition: SOLAR_COMPOSITION,
      radiationDepartureEta: 1,
    });
    expect(ch).toBe("gas");
  });

  it("white dwarf core: degeneracy-dominated", () => {
    const ch = dominantChannelAt({
      temperatureK: 1e7,
      densityGPerCm3: 1e6,
      composition: { hydrogenMassFractionX: 0, heliumMassFractionY: 0, metalMassFractionZ: 1 },
      radiationDepartureEta: 1,
    });
    expect(ch).toBe("degeneracy");
  });

  it("hot rarefied plasma: radiation-dominated", () => {
    const ch = dominantChannelAt({
      temperatureK: 1e9,
      densityGPerCm3: 1e-8,
      composition: SOLAR_COMPOSITION,
      radiationDepartureEta: 1,
    });
    expect(ch).toBe("radiation");
  });
});

/* ──────────────────────────────────────────────────
 * Deep-dive data
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- Deep-dive data", () => {
  it("gasDeepDiveData returns monotonically increasing P_gas", () => {
    const data = gasDeepDiveData({
      temperatureK: 1e7,
      composition: SOLAR_COMPOSITION,
      samples: 30,
    });
    expect(data.densities.length).toBe(30);
    for (let i = 1; i < data.pGas.length; i++) {
      expect(data.pGas[i]).toBeGreaterThanOrEqual(data.pGas[i - 1]);
    }
  });

  it("radDeepDiveData: P_rad grows much faster than P_gas with T", () => {
    const data = radDeepDiveData({
      rhoForComparison: 1,
      composition: SOLAR_COMPOSITION,
      samples: 30,
    });
    // At high T, P_rad >> P_gas (T^4 vs T^1)
    const last = data.pRad.length - 1;
    expect(data.pRad[last] / data.pGas[last]).toBeGreaterThan(100);
  });

  it("degDeepDiveData: P_deg grows with density", () => {
    const data = degDeepDiveData({
      temperatureK: 1e6,
      composition: SOLAR_COMPOSITION,
      samples: 30,
    });
    // Compare first and last few points
    const first = data.pDeg[2];
    const last = data.pDeg[data.pDeg.length - 1];
    expect(last).toBeGreaterThan(first);
  });
});

/* ──────────────────────────────────────────────────
 * LaTeX formatters
 * ────────────────────────────────────────────────── */

describe("EOS Lab -- LaTeX formatters", () => {
  it("latexScientific formats 1.38e-16 correctly", () => {
    const result = latexScientific(1.38e-16, 3);
    expect(result).toContain("\\times 10^{-16}");
    expect(result).toMatch(/^1\.\d+ \\times/);
  });

  it("latexScientific returns '0' for zero", () => {
    expect(latexScientific(0)).toBe("0");
  });

  it("latexScientific marks NaN as unavailable rather than reporting it as zero", () => {
    // This previously asserted "0", locking in a defect: a failed EOS solve rendered as
    // a confident P = 0 in the deep-dive equations.
    expect(latexScientific(Number.NaN)).toBe("\\text{--}");
  });

  it("gasEquationLatex produces valid LaTeX with P_{\\rm gas}", () => {
    const latex = gasEquationLatex({ rho: 150, T: 1.57e7, mu: 0.617, pGas: 3.17e17 });
    expect(latex).toContain("P_{\\rm gas}");
    expect(latex).toContain("k_B");
    expect(latex).toContain("m_u");
    expect(latex).toContain("\\text{dyne cm}^{-2}");
  });

  it("radEquationLatex produces valid LaTeX with T^4", () => {
    const latex = radEquationLatex({ T: 1e7, pRad: 2.52e15 });
    expect(latex).toContain("P_{\\rm rad}");
    expect(latex).toContain("^4");
  });

  it("degEquationLatex shows NR regime for low x_F", () => {
    const latex = degEquationLatex({ rho: 1e6, muE: 2, xF: 0.1, pDeg: 1e20 });
    expect(latex).toContain("\\text{NR}");
  });

  it("degEquationLatex shows UR regime for high x_F", () => {
    const latex = degEquationLatex({ rho: 1e10, muE: 2, xF: 5, pDeg: 1e28 });
    expect(latex).toContain("\\text{UR}");
  });

  it("degEquationLatex shows trans-rel for intermediate x_F", () => {
    const latex = degEquationLatex({ rho: 1e8, muE: 2, xF: 0.7, pDeg: 1e24 });
    expect(latex).toContain("\\text{trans-rel}");
  });
});

/* ──────────────────────────────────────────────────
 * Adiabatic index tests
 * ────────────────────────────────────────────────── */

describe("adiabaticIndex", () => {
  it("returns ~5/3 for gas-dominated conditions", () => {
    const gamma = adiabaticIndex({
      pGas: 1e15, pRad: 1e5, pDeg: 1e5, pTotal: 1e15 + 2e5, xF: 0.01,
    });
    expect(gamma).toBeCloseTo(5 / 3, 2);
  });

  it("returns ~4/3 for radiation-dominated conditions", () => {
    const gamma = adiabaticIndex({
      pGas: 1e5, pRad: 1e20, pDeg: 1e5, pTotal: 1e20 + 2e5, xF: 0.01,
    });
    expect(gamma).toBeCloseTo(4 / 3, 2);
  });

  it("returns ~5/3 for NR-degenerate conditions (xF << 1)", () => {
    const gamma = adiabaticIndex({
      pGas: 1e5, pRad: 1e5, pDeg: 1e22, pTotal: 1e22 + 2e5, xF: 0.1,
    });
    expect(gamma).toBeCloseTo(5 / 3, 2);
  });

  it("returns ~4/3 for UR-degenerate conditions (xF >> 1)", () => {
    const gamma = adiabaticIndex({
      pGas: 1e5, pRad: 1e5, pDeg: 1e22, pTotal: 1e22 + 2e5, xF: 1.5,
    });
    expect(gamma).toBeCloseTo(4 / 3, 2);
  });

  it("blends between channels proportionally", () => {
    // Equal gas and radiation -> midpoint of 5/3 and 4/3 = 3/2
    const gamma = adiabaticIndex({
      pGas: 1e15, pRad: 1e15, pDeg: 0, pTotal: 2e15, xF: 0.01,
    });
    expect(gamma).toBeCloseTo((5 / 3 + 4 / 3) / 2, 2);
  });

  it("returns NaN for zero total pressure", () => {
    const gamma = adiabaticIndex({
      pGas: 0, pRad: 0, pDeg: 0, pTotal: 0, xF: 0,
    });
    expect(gamma).toBeNaN();
  });

  it("integrates with real physics model", () => {
    // Use StellarEosModel to compute pressures, then verify gamma makes sense
    const comp = compositionFromXY({ hydrogenMassFractionX: 0.7, heliumMassFractionY: 0.28 });
    const state = StellarEosModel.evaluateStateCgs({
      input: {
        temperatureK: 5800,
        densityGPerCm3: 1e-7,
        composition: comp,
        radiationDepartureEta: 1.0,
      },
    });
    const gamma = adiabaticIndex({
      pGas: state.gasPressureDynePerCm2,
      pRad: state.radiationPressureDynePerCm2,
      pDeg: state.electronDegeneracyPressureDynePerCm2,
      pTotal: state.totalPressureDynePerCm2,
      xF: state.fermiRelativityX,
    });
    // Solar envelope is gas-dominated -> gamma near 5/3
    expect(gamma).toBeGreaterThan(1.5);
    expect(gamma).toBeLessThanOrEqual(5 / 3 + 0.01);
  });
});

/* ──────────────────────────────────────────────────
 * Symbolic equation formatters
 * ────────────────────────────────────────────────── */

describe("symbolic equation formatters", () => {
  it("gasEquationSymbolic returns symbolic LaTeX without values", () => {
    const latex = gasEquationSymbolic();
    expect(latex).toContain("P_{\\rm gas}");
    expect(latex).toContain("\\rho");
    expect(latex).toContain("\\mu");
    expect(latex).not.toMatch(/\d\.\d+/);
  });

  it("radEquationSymbolic returns symbolic LaTeX without values", () => {
    const latex = radEquationSymbolic();
    expect(latex).toContain("P_{\\rm rad}");
    expect(latex).toContain("T^4");
    expect(latex).not.toMatch(/\d\.\d+/);
  });

  it("degEquationSymbolic returns symbolic LaTeX without values", () => {
    const latex = degEquationSymbolic();
    expect(latex).toContain("P_{\\rm deg}");
    expect(latex).not.toMatch(/\d\.\d+/);
  });
});

/* ──────────────────────────────────────────────────
 * Solar profile data
 * ────────────────────────────────────────────────── */

describe("solarProfileData", () => {
  it("returns an array of {logT, logRho} points from core to surface", () => {
    const profile = solarProfileData();
    expect(profile.length).toBeGreaterThan(5);
    // Core should be hot and dense
    expect(profile[0].logT).toBeGreaterThan(7);
    expect(profile[0].logRho).toBeGreaterThan(1);
    // Surface should be cool and sparse
    const last = profile[profile.length - 1];
    expect(last.logT).toBeLessThan(4);
    expect(last.logRho).toBeLessThan(-5);
  });

  it("has monotonically decreasing temperature from core to surface", () => {
    const profile = solarProfileData();
    for (let i = 1; i < profile.length; i++) {
      expect(profile[i].logT).toBeLessThan(profile[i - 1].logT);
    }
  });

  it("includes labeled key points", () => {
    const profile = solarProfileData();
    const labels = profile.filter(p => p.label).map(p => p.label);
    expect(labels).toContain("Core");
    expect(labels).toContain("Photosphere");
  });
});

/* ──────────────────────────────────────────────────
 * Contextual suggestions
 * ────────────────────────────────────────────────── */

describe("getContextualSuggestion", () => {
  const base: ContextualSuggestionInput = {
    dominantChannel: "gas",
    radiationToGas: 0.001,
    degeneracyToTotal: 0.001,
    chiDegeneracy: 100,
    gammaEff: 5 / 3,
    lteTag: "lte-like",
  };

  it("warns about instability when gamma_eff < 4/3 + 0.05", () => {
    const s = getContextualSuggestion({ ...base, gammaEff: 1.3 });
    expect(s).toContain("4/3");
    expect(s).toContain("unstable");
  });

  it("warns about LTE closure when tag is not lte-like", () => {
    const s = getContextualSuggestion({ ...base, lteTag: "optically-thin", gammaEff: 1.7 });
    expect(s).toContain("LTE");
    expect(s).toContain("warning");
  });

  it("does not warn LTE when degeneracy dominates (LTE irrelevant)", () => {
    const s = getContextualSuggestion({
      ...base, dominantChannel: "degeneracy", lteTag: "optically-thin",
      gammaEff: 5 / 3, chiDegeneracy: 0.01,
    });
    expect(s).not.toContain("LTE");
    expect(s).toContain("degeneracy");
  });

  it("suggests raising T when gas dominates and radiation is negligible", () => {
    const s = getContextualSuggestion({ ...base, radiationToGas: 0.001 });
    expect(s).toContain("raising $T$");
  });

  it("mentions Eddington regime when gas dominates but radiation is noticeable", () => {
    const s = getContextualSuggestion({ ...base, radiationToGas: 0.1 });
    expect(s).toContain("Eddington");
  });

  it("suggests increasing density when radiation dominates", () => {
    const s = getContextualSuggestion({ ...base, dominantChannel: "radiation" });
    expect(s).toContain("density");
    expect(s).toContain("degeneracy");
  });

  it("mentions T/T_F for strongly degenerate conditions", () => {
    const s = getContextualSuggestion({
      ...base, dominantChannel: "degeneracy", chiDegeneracy: 0.01,
    });
    expect(s).toContain("T/T_F");
  });

  it("suggests composition change for moderately degenerate", () => {
    const s = getContextualSuggestion({
      ...base, dominantChannel: "degeneracy", chiDegeneracy: 0.5,
    });
    expect(s).toContain("composition");
  });

  it("returns validity guidance for invalid dominant-channel states", () => {
    const s = getContextualSuggestion({ ...base, dominantChannel: "invalid" });
    expect(s).toContain("outside model validity");
  });

  it("highlights transition at mixed dominance", () => {
    const s = getContextualSuggestion({ ...base, dominantChannel: "mixed" });
    expect(s).toContain("transition");
    expect(s).toContain("crossover");
  });

  it("returns a non-empty string for any valid input", () => {
    const s = getContextualSuggestion({ ...base, dominantChannel: "extension" });
    expect(s.length).toBeGreaterThan(10);
  });

  describe("log-axis safety (regression)", () => {
    it("logSafe floors non-finite values instead of propagating them", () => {
      // Math.max(1e-30, NaN) === NaN. That is how a failed EOS solve reached a uPlot
      // log axis, where the split lookup throws RangeError.
      expect(Math.max(LOG_AXIS_FLOOR, Number.NaN)).toBeNaN();
      expect(logSafe(Number.NaN)).toBe(LOG_AXIS_FLOOR);
      expect(logSafe(Number.POSITIVE_INFINITY)).toBe(LOG_AXIS_FLOOR);
      expect(logSafe(Number.NEGATIVE_INFINITY)).toBe(LOG_AXIS_FLOOR);
    });

    it("logSafe floors values below the uPlot lookup range but preserves real ones", () => {
      expect(logSafe(0)).toBe(LOG_AXIS_FLOOR);
      expect(logSafe(-5)).toBe(LOG_AXIS_FLOOR);
      expect(logSafe(1e20)).toBe(1e20);
    });

    it("latexScientific does not report a failed solve as zero", () => {
      expect(latexScientific(Number.NaN)).not.toBe("0");
      expect(latexScientific(0)).toBe("0");
      expect(latexScientific(1.5e16)).toContain("10^{16}");
    });
  });

  describe("Scaling Law Detective challenges", () => {
    // Doubling the driver multiplies the pressure by 2^n: P_gas ~ T^1, P_rad ~ T^4,
    // P_deg ~ rho^(5/3).
    const EXPONENT: Record<string, number> = { "gas-T": 1, "rad-T": 4, "deg-rho": 5 / 3 };

    it("each correct factor is 2^n for the law it teaches, and exactly one option is accepted", () => {
      expect(SCALING_CHALLENGES.map((c) => c.id).sort()).toEqual(Object.keys(EXPONENT).sort());
      for (const ch of SCALING_CHALLENGES) {
        expect(Math.abs(ch.correctFactor - 2 ** EXPONENT[ch.id])).toBeLessThan(0.01);
        const accepted = ch.options.filter((o) => checkScalingAnswer(o.factor, ch.correctFactor));
        expect(accepted).toHaveLength(1);
      }
    });

    it("reader-visible strings carry no literal backslash-u escape", () => {
      // A doubled backslash in source survives the build as backslash + "u2014" and is
      // shown to the reader verbatim. The math-formatting gate cannot see it because
      // it decodes only odd backslash runs.
      for (const ch of SCALING_CHALLENGES) {
        for (const text of [ch.question, ch.insight, ...ch.options.map((o) => o.label)]) {
          expect(text).not.toMatch(/\\u[0-9A-Fa-f]{4}/);
        }
      }
    });
  });
});
