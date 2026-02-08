/**
 * regimeWorker.ts — Web Worker for regime grid evaluation.
 *
 * Moves the O(N*M) brute-force grid computation off the main thread,
 * eliminating jank during composition slider interaction.
 *
 * Message protocol:
 *   IN:  { logTMin, logTMax, logRhoMin, logRhoMax, cols, rows, X, Y, Z, eta, seq }
 *   OUT: { grid: Uint8Array, cols, rows, elapsed, seq }
 *
 * Channel encoding: 0=gas, 1=radiation, 2=degeneracy, 3=mixed.
 * The Uint8Array buffer is transferred (zero-copy) via postMessage.
 */

import { StellarEosModel } from "@cosmic/physics";

export type RegimeWorkerRequest = {
  logTMin: number;
  logTMax: number;
  logRhoMin: number;
  logRhoMax: number;
  cols: number;
  rows: number;
  X: number;
  Y: number;
  Z: number;
  eta: number;
  /** Sequence number for request deduplication */
  seq: number;
};

export type RegimeWorkerResponse = {
  grid: Uint8Array;
  cols: number;
  rows: number;
  elapsed: number;
  seq: number;
};

self.onmessage = (e: MessageEvent<RegimeWorkerRequest>) => {
  const { logTMin, logTMax, logRhoMin, logRhoMax, cols, rows, X, Y, Z, eta, seq } = e.data;
  const t0 = performance.now();

  const grid = new Uint8Array(cols * rows);
  const dT = (logTMax - logTMin) / Math.max(1, cols - 1);
  const dRho = (logRhoMax - logRhoMin) / Math.max(1, rows - 1);

  const composition = {
    hydrogenMassFractionX: X,
    heliumMassFractionY: Y,
    metalMassFractionZ: Z,
  };

  for (let j = 0; j < rows; j++) {
    const logRho = logRhoMin + j * dRho;
    for (let i = 0; i < cols; i++) {
      const logT = logTMin + i * dT;
      const state = StellarEosModel.evaluateStateCgs({
        input: {
          temperatureK: Math.pow(10, logT),
          densityGPerCm3: Math.pow(10, logRho),
          composition,
          radiationDepartureEta: eta,
        },
      });
      const dom = state.dominantPressureChannel;
      let code = 3; // mixed
      if (dom === "gas") code = 0;
      else if (dom === "radiation") code = 1;
      else if (dom === "degeneracy") code = 2;
      grid[j * cols + i] = code;
    }
  }

  const elapsed = performance.now() - t0;
  const response: RegimeWorkerResponse = { grid, cols, rows, elapsed, seq };
  (self as unknown as Worker).postMessage(response, [grid.buffer]);
};
