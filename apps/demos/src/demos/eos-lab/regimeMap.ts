/**
 * regimeMap.ts — Canvas 2D regime map with dual rendering modes.
 *
 * Two modes:
 *   "exact"      — Brute-force grid evaluation via full EOS model.  Accurate,
 *                   captures NR->UR transition, finite-T effects, mixed regions.
 *   "analytical"  — O(N) boundary curves using NR-limit closed forms.  Fast
 *                   but approximate at high x_F.
 *
 * Default is "exact" with analytical boundary overlay (dashed lines).
 * The exact grid is cached by composition key and only recomputed when
 * composition or eta changes — NOT on every T/rho slider move.
 */
import type { StellarCompositionFractions } from "@cosmic/physics";
import {
  gasRadBoundaryLogRho,
  gasDegBoundaryLogRho,
  radDegBoundaryLogRho,
  boundaryPolyline,
  meanMolecularWeight,
  meanMolecularWeightPerElectron,
  evaluateRegimeGrid,
  superscript,
} from "./logic";
import type { RegimeChannel, RegimeGridResult } from "./logic";
import { resolveCssColor } from "./uplotHelpers";

/* ──────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────── */

export type RegimeMapState = {
  composition: StellarCompositionFractions;
  radiationDepartureEta: number;
  /** Current state marker: log10(T) */
  currentLogT: number;
  /** Current state marker: log10(rho) */
  currentLogRho: number;
  /** Preset dots: { id, logT, logRho }[] */
  presets: Array<{ id: string; logT: number; logRho: number }>;
  /** If true, skip grid rebuild (use cached). Used during slider drag. */
  deferGridRebuild?: boolean;
};

export type RegimeMapConfig = {
  logTMin: number;
  logTMax: number;
  logRhoMin: number;
  logRhoMax: number;
  /** Grid cells in x direction for exact mode. Default 100. */
  xCells?: number;
  /** Grid cells in y direction for exact mode. Default 80. */
  yCells?: number;
  /** Show analytical boundary curves as dashed overlay. Default true. */
  showAnalyticalOverlay?: boolean;
};

const DEFAULT_CONFIG: RegimeMapConfig = {
  logTMin: 3,
  logTMax: 9,
  logRhoMin: -10,
  logRhoMax: 10,
  xCells: 100,
  yCells: 80,
  showAnalyticalOverlay: true,
};

/* ──────────────────────────────────────────────────
 * DPI helpers
 * ────────────────────────────────────────────────── */

function resizeCanvasToCssPixels(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { width: number; height: number } {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1;
  const nextWidth = Math.max(1, Math.round(width * dpr));
  const nextHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

/* ──────────────────────────────────────────────────
 * Coordinate mapping: log-space → pixel-space
 *
 * X axis: log10(T)   → left to right
 * Y axis: log10(rho) → bottom to top  (canvas y is inverted)
 * ────────────────────────────────────────────────── */

const PADDING = { top: 28, right: 16, bottom: 40, left: 58 };

function plotArea(w: number, h: number) {
  return {
    x: PADDING.left,
    y: PADDING.top,
    w: w - PADDING.left - PADDING.right,
    h: h - PADDING.top - PADDING.bottom,
  };
}

function logTToX(logT: number, pa: ReturnType<typeof plotArea>, cfg: RegimeMapConfig): number {
  const frac = (logT - cfg.logTMin) / (cfg.logTMax - cfg.logTMin);
  return pa.x + frac * pa.w;
}

function logRhoToY(logRho: number, pa: ReturnType<typeof plotArea>, cfg: RegimeMapConfig): number {
  const frac = (logRho - cfg.logRhoMin) / (cfg.logRhoMax - cfg.logRhoMin);
  return pa.y + (1 - frac) * pa.h;
}

/* ──────────────────────────────────────────────────
 * Regime colors (resolved from CSS tokens at first render)
 * ────────────────────────────────────────────────── */

let cachedColors: {
  gas: string;
  radiation: string;
  degeneracy: string;
  mixed: string;
  boundary: string;
  text: string;
  grid: string;
  bg: string;
  marker: string;
  preset: string;
} | null = null;

function resolveColors() {
  if (cachedColors) return cachedColors;
  cachedColors = {
    gas: resolveCssColor("--cp-success") || "#4ade80",
    radiation: resolveCssColor("--cp-accent") || "#38bdf8",
    degeneracy: resolveCssColor("--cp-warn") || "#facc15",
    mixed: resolveCssColor("--cp-muted") || "#888",
    boundary: resolveCssColor("--cp-text1") || "#e0e0e0",
    text: resolveCssColor("--cp-text2") || "#aaa",
    grid: resolveCssColor("--cp-border") || "#333",
    bg: resolveCssColor("--cp-bg0") || "#0e1117",
    marker: resolveCssColor("--cp-accent-ice") || "#6dd5ed",
    preset: "#ffffff",
  };
  return cachedColors;
}

/* ──────────────────────────────────────────────────
 * Grid cache (only recomputes when composition/eta changes)
 * ────────────────────────────────────────────────── */

function compositionKey(comp: StellarCompositionFractions, eta: number): string {
  return [
    comp.hydrogenMassFractionX.toFixed(6),
    comp.heliumMassFractionY.toFixed(6),
    comp.metalMassFractionZ.toFixed(6),
    eta.toFixed(6),
  ].join("|");
}

let gridCache: { key: string; result: RegimeGridResult } | null = null;

/* ──────────────────────────────────────────────────
 * Exact grid rendering (brute-force, colored cells)
 * ────────────────────────────────────────────────── */

function channelColor(ch: RegimeChannel): string {
  const colors = resolveColors();
  switch (ch) {
    case "gas": return colors.gas;
    case "radiation": return colors.radiation;
    case "degeneracy": return colors.degeneracy;
    case "mixed": return colors.mixed;
  }
}

function drawExactGrid(
  ctx: CanvasRenderingContext2D,
  pa: ReturnType<typeof plotArea>,
  _cfg: RegimeMapConfig,
  grid: RegimeGridResult
) {
  const cellW = pa.w / grid.xCells;
  const cellH = pa.h / grid.yCells;

  ctx.save();
  ctx.beginPath();
  ctx.rect(pa.x, pa.y, pa.w, pa.h);
  ctx.clip();

  for (let j = 0; j < grid.yCells; j++) {
    // j=0 is logRhoMin (bottom of plot), but canvas y=0 is top
    const y = pa.y + (grid.yCells - 1 - j) * cellH;
    for (let i = 0; i < grid.xCells; i++) {
      const x = pa.x + i * cellW;
      ctx.fillStyle = channelColor(grid.grid[j][i]) + "44";
      ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
    }
  }

  ctx.restore();
}

/* ──────────────────────────────────────────────────
 * Analytical boundary overlay (NR-limit boundary curves)
 * ────────────────────────────────────────────────── */

function drawAnalyticalOverlay(
  ctx: CanvasRenderingContext2D,
  pa: ReturnType<typeof plotArea>,
  cfg: RegimeMapConfig,
  mu: number,
  muE: number
) {
  const colors = resolveColors();

  const gasRadPoly = boundaryPolyline({
    boundaryFn: (logT) => gasRadBoundaryLogRho(logT, mu),
    ...cfg,
    samples: 120,
  });
  const gasDegPoly = boundaryPolyline({
    boundaryFn: (logT) => gasDegBoundaryLogRho(logT, mu, muE),
    ...cfg,
    samples: 120,
  });
  const radDegPoly = boundaryPolyline({
    boundaryFn: (logT) => radDegBoundaryLogRho(logT, muE),
    ...cfg,
    samples: 120,
  });

  drawBoundary(ctx, pa, cfg, gasRadPoly, colors.gas, [6, 3]);
  drawBoundary(ctx, pa, cfg, gasDegPoly, colors.degeneracy, [6, 3]);
  drawBoundary(ctx, pa, cfg, radDegPoly, colors.radiation, [6, 3]);

  // Labels
  ctx.font = "bold 11px var(--cp-font-mono, monospace)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = colors.gas + "bb";
  ctx.fillText("GAS", logTToX(5.5, pa, cfg), logRhoToY(6, pa, cfg));

  ctx.fillStyle = colors.radiation + "bb";
  ctx.fillText("RAD", logTToX(8, pa, cfg), logRhoToY(-6, pa, cfg));

  ctx.fillStyle = colors.degeneracy + "bb";
  ctx.fillText("DEG", logTToX(4.5, pa, cfg), logRhoToY(4, pa, cfg));
}

/* ──────────────────────────────────────────────────
 * Draw helpers
 * ────────────────────────────────────────────────── */

function drawGrid(
  ctx: CanvasRenderingContext2D,
  pa: ReturnType<typeof plotArea>,
  cfg: RegimeMapConfig
) {
  const colors = resolveColors();
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 0.5;
  ctx.font = "10px var(--cp-font-mono, monospace)";
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let logT = Math.ceil(cfg.logTMin); logT <= cfg.logTMax; logT++) {
    const x = logTToX(logT, pa, cfg);
    ctx.beginPath();
    ctx.moveTo(x, pa.y);
    ctx.lineTo(x, pa.y + pa.h);
    ctx.stroke();
    ctx.fillText(`10${superscript(logT)}`, x, pa.y + pa.h + 4);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let logRho = Math.ceil(cfg.logRhoMin); logRho <= cfg.logRhoMax; logRho += 2) {
    const y = logRhoToY(logRho, pa, cfg);
    ctx.beginPath();
    ctx.moveTo(pa.x, y);
    ctx.lineTo(pa.x + pa.w, y);
    ctx.stroke();
    ctx.fillText(`10${superscript(logRho)}`, pa.x - 4, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "11px var(--cp-font-mono, monospace)";
  ctx.fillText("log T (K)", pa.x + pa.w / 2, pa.y + pa.h + 22);

  ctx.save();
  ctx.translate(14, pa.y + pa.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "middle";
  ctx.fillText("log rho (g/cm3)", 0, 0);
  ctx.restore();
}

function drawBoundary(
  ctx: CanvasRenderingContext2D,
  pa: ReturnType<typeof plotArea>,
  cfg: RegimeMapConfig,
  polyline: { logT: number[]; logRho: number[] },
  color: string,
  dash: number[] = []
) {
  if (polyline.logT.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pa.x, pa.y, pa.w, pa.h);
  ctx.clip();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dash);
  ctx.beginPath();
  for (let i = 0; i < polyline.logT.length; i++) {
    const x = logTToX(polyline.logT[i], pa, cfg);
    const y = logRhoToY(polyline.logRho[i], pa, cfg);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  pa: ReturnType<typeof plotArea>,
  cfg: RegimeMapConfig,
  logT: number,
  logRho: number,
  opts: { color: string; size: number; shape: "diamond" | "circle" }
) {
  const x = logTToX(logT, pa, cfg);
  const y = logRhoToY(logRho, pa, cfg);
  if (x < pa.x || x > pa.x + pa.w || y < pa.y || y > pa.y + pa.h) return;

  ctx.fillStyle = opts.color;
  ctx.strokeStyle = opts.color;
  ctx.lineWidth = 1.5;

  if (opts.shape === "diamond") {
    const s = opts.size;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, opts.size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawCrosshairs(
  ctx: CanvasRenderingContext2D,
  pa: ReturnType<typeof plotArea>,
  cfg: RegimeMapConfig,
  logT: number,
  logRho: number,
  color: string
) {
  const x = logTToX(logT, pa, cfg);
  const y = logRhoToY(logRho, pa, cfg);

  ctx.save();
  ctx.beginPath();
  ctx.rect(pa.x, pa.y, pa.w, pa.h);
  ctx.clip();

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(x, pa.y);
  ctx.lineTo(x, pa.y + pa.h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pa.x, y);
  ctx.lineTo(pa.x + pa.w, y);
  ctx.stroke();

  ctx.restore();
}

/* ──────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────── */

/**
 * Render the regime map using the full EOS model (exact grid) with
 * analytical NR-limit boundary curves as a dashed overlay.
 *
 * Returns the grid evaluation time in ms (for performance comparison UI).
 */
export function renderRegimeMap(
  canvas: HTMLCanvasElement,
  state: RegimeMapState,
  config: RegimeMapConfig = DEFAULT_CONFIG
): { gridElapsedMs: number } {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { gridElapsedMs: 0 };

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { width, height } = resizeCanvasToCssPixels(canvas, ctx);
  const pa = plotArea(width, height);
  const colors = resolveColors();
  const mu = meanMolecularWeight(state.composition);
  const muE = meanMolecularWeightPerElectron(state.composition);

  // --- Grid cache check ---
  const key = compositionKey(state.composition, state.radiationDepartureEta);
  const xCells = cfg.xCells ?? 100;
  const yCells = cfg.yCells ?? 80;

  if (!state.deferGridRebuild && (!gridCache || gridCache.key !== key)) {
    gridCache = {
      key,
      result: evaluateRegimeGrid({
        logTMin: cfg.logTMin,
        logTMax: cfg.logTMax,
        logRhoMin: cfg.logRhoMin,
        logRhoMax: cfg.logRhoMax,
        xCells,
        yCells,
        composition: state.composition,
        radiationDepartureEta: state.radiationDepartureEta,
      }),
    };
  }

  // --- Clear ---
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // --- Plot area border ---
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(pa.x, pa.y, pa.w, pa.h);

  // --- Grid + labels ---
  drawGrid(ctx, pa, cfg);

  // --- Exact grid fill ---
  if (gridCache) {
    drawExactGrid(ctx, pa, cfg, gridCache.result);
  }

  // --- Analytical boundary overlay (dashed lines) ---
  if (cfg.showAnalyticalOverlay !== false) {
    drawAnalyticalOverlay(ctx, pa, cfg, mu, muE);
  }

  // --- Crosshairs for current state ---
  drawCrosshairs(ctx, pa, cfg, state.currentLogT, state.currentLogRho, colors.marker);

  // --- Preset dots ---
  for (const preset of state.presets) {
    drawMarker(ctx, pa, cfg, preset.logT, preset.logRho, {
      color: colors.preset,
      size: 3,
      shape: "circle",
    });
  }

  // --- Current state diamond ---
  drawMarker(ctx, pa, cfg, state.currentLogT, state.currentLogRho, {
    color: colors.marker,
    size: 6,
    shape: "diamond",
  });

  // --- Performance badge ---
  if (gridCache) {
    ctx.font = "9px var(--cp-font-mono, monospace)";
    ctx.fillStyle = colors.text + "88";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(
      `${xCells}\u00D7${yCells} grid: ${gridCache.result.elapsedMs.toFixed(0)} ms`,
      width - 4,
      2
    );
  }

  return { gridElapsedMs: gridCache?.result.elapsedMs ?? 0 };
}

/**
 * Force the next render to rebuild the grid (e.g., on composition change).
 */
export function invalidateRegimeGrid(): void {
  gridCache = null;
}

/**
 * Invalidate cached token colors (call on theme change).
 */
export function invalidateRegimeMapColors(): void {
  cachedColors = null;
}
