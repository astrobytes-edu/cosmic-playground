import { describe, expect, test } from "vitest";
import { solveEccentricAnomalyRadDeterministic } from "./keplerSolver";

describe("solveEccentricAnomalyRadDeterministic", () => {
  test("satisfies Kepler equation residual across a small grid (including wrapped M)", () => {
    const eValues = [0, 0.3, 0.8, 0.95] as const;
    const mValues = [
      -10.2,
      -0.1,
      0,
      0.2,
      1.234,
      3.0,
      5.8,
      2 * Math.PI + 0.4,
      20 * Math.PI + 0.01
    ] as const;

    for (const e of eValues) {
      for (const M of mValues) {
        const E = solveEccentricAnomalyRadDeterministic({
          meanAnomalyRad: M,
          eccentricity: e,
          maxIterations: 15
        });
        expect(Number.isFinite(E), `E should be finite for e=${e}, M=${M}`).toBe(true);
        const resid = E - e * Math.sin(E) - M;
        expect(Math.abs(resid), `residual too large for e=${e}, M=${M}`).toBeLessThan(1e-10);
      }
    }
  });
});

