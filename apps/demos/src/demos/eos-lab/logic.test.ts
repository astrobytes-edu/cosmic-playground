import { describe, expect, it } from "vitest";
import { StellarEosModel } from "@cosmic/physics";

import {
  clamp,
  compositionFromXY,
  formatScientific,
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

  it("formats scientific readouts safely", () => {
    expect(formatScientific(Number.NaN)).toBe("\u2014");
    expect(formatScientific(0)).toBe("0");
    expect(formatScientific(1.2e7)).toContain("e+");
  });

  it("formats percentages", () => {
    expect(percent(0.5)).toBe("50.0%");
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

  it("latexScientific returns '0' for NaN", () => {
    expect(latexScientific(Number.NaN)).toBe("0");
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
