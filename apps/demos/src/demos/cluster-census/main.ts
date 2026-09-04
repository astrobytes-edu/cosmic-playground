import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
  setLiveRegionText
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import {
  CANONICAL_HIGH_MASS_SLOPE,
  IMF_MAX_MSUN,
  buildKroupaSegments,
  highMassSlopeFromEnvironment,
  kroupaMassFraction,
  maschbergerMassFraction,
  sampleStarCluster
} from "@cosmic/physics";
import type { ClusterStar, StarCluster } from "@cosmic/physics";
import { requiredContext2d } from "../../shared/dom";
import { createClusterScene } from "./clusterScene";
import type { ClusterViewMode, SceneStar } from "./clusterScene";
import {
  LSUN_SYMBOL,
  MSUN_SYMBOL,
  ageMyrToSlider,
  axisFontPx,
  buildLogMassBins,
  censusAnnouncement,
  countIntoBins,
  expectedCounts,
  formatAge,
  formatCount,
  formatLogLuminosity,
  formatMassMsun,
  formatRadiusPc,
  formatStellarRadius,
  fehToSlider,
  logClusterMassToSlider,
  massToDotRadiusPx,
  pickNearest,
  powerOfTenLabel,
  projectToPixels,
  slopeVerdict,
  sliderToFeH,
  sliderToLogClusterMass,
  radiusEnclosingFractionPc,
  rgbToCss,
  sliderToAgeMyr,
  sliderToStarCount,
  starCountToSlider,
  temperatureTickLabel,
  temperatureToRgb,
  turnoffMassMsun
} from "./logic";
import type { ImfLaw, PickCandidate, ProfileKind } from "./logic";

const lawMaschbergerEl = document.querySelector<HTMLButtonElement>("#lawMaschberger");
const lawKroupaEl = document.querySelector<HTMLButtonElement>("#lawKroupa");
const countSliderEl = document.querySelector<HTMLInputElement>("#countSlider");
const countValueEl = document.querySelector<HTMLSpanElement>("#countValue");
const slopeSliderEl = document.querySelector<HTMLInputElement>("#slopeSlider");
const slopeValueEl = document.querySelector<HTMLSpanElement>("#slopeValue");
const ageSliderEl = document.querySelector<HTMLInputElement>("#ageSlider");
const ageValueEl = document.querySelector<HTMLSpanElement>("#ageValue");
const profilePlummerEl = document.querySelector<HTMLButtonElement>("#profilePlummer");
const profileEffEl = document.querySelector<HTMLButtonElement>("#profileEff");
const reseedEl = document.querySelector<HTMLButtonElement>("#reseed");
const clusterOverlayEl = document.querySelector<HTMLCanvasElement>("#clusterOverlay");
const view2dEl = document.querySelector<HTMLButtonElement>("#view2d");
const view3dEl = document.querySelector<HTMLButtonElement>("#view3d");
const resetViewEl = document.querySelector<HTMLButtonElement>("#resetView");
const deriveToggleEl = document.querySelector<HTMLButtonElement>("#deriveToggle");
const derivePanelEl = document.querySelector<HTMLElement>("#derivePanel");
const fehSliderEl = document.querySelector<HTMLInputElement>("#fehSlider");
const fehValueEl = document.querySelector<HTMLSpanElement>("#fehValue");
const meclSliderEl = document.querySelector<HTMLInputElement>("#meclSlider");
const meclValueEl = document.querySelector<HTMLSpanElement>("#meclValue");
const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("button.preset[data-preset]")
);

const mostMassiveEl = document.querySelector<HTMLSpanElement>("#mostMassive");
const turnoffEl = document.querySelector<HTMLSpanElement>("#turnoff");
const turnoffUnitEl = document.querySelector<HTMLSpanElement>("#turnoffUnit");
const totalMassEl = document.querySelector<HTMLSpanElement>("#totalMass");
const halfRadiusEl = document.querySelector<HTMLSpanElement>("#halfRadius");
const shiningCountEl = document.querySelector<HTMLSpanElement>("#shiningCount");
const remnantCountEl = document.querySelector<HTMLSpanElement>("#remnantCount");
const giantCountEl = document.querySelector<HTMLSpanElement>("#giantCount");
const extrapolatedCountEl = document.querySelector<HTMLSpanElement>("#extrapolatedCount");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const resetEl = document.querySelector<HTMLButtonElement>("#reset");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const clusterCanvasEl = document.querySelector<HTMLCanvasElement>("#clusterCanvas");
const hrCanvasEl = document.querySelector<HTMLCanvasElement>("#hrCanvas");
const imfCanvasEl = document.querySelector<HTMLCanvasElement>("#imfCanvas");

if (
  !lawMaschbergerEl ||
  !lawKroupaEl ||
  !countSliderEl ||
  !countValueEl ||
  !slopeSliderEl ||
  !slopeValueEl ||
  !ageSliderEl ||
  !ageValueEl ||
  !profilePlummerEl ||
  !profileEffEl ||
  !reseedEl ||
  !mostMassiveEl ||
  !turnoffEl ||
  !totalMassEl ||
  !halfRadiusEl ||
  !shiningCountEl ||
  !remnantCountEl ||
  !giantCountEl ||
  !turnoffUnitEl ||
  !clusterOverlayEl ||
  !view2dEl ||
  !view3dEl ||
  !resetViewEl ||
  !deriveToggleEl ||
  !derivePanelEl ||
  !fehSliderEl ||
  !fehValueEl ||
  !meclSliderEl ||
  !meclValueEl ||
  !extrapolatedCountEl ||
  !stationModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !resetEl ||
  !statusEl ||
  !clusterCanvasEl ||
  !hrCanvasEl ||
  !imfCanvasEl
) {
  throw new Error("cluster-census: required DOM nodes are missing");
}

// Re-aliased so the narrowing above survives into the handlers below, which is the
// convention the other demos in this repo use.
const lawMaschberger = lawMaschbergerEl;
const lawKroupa = lawKroupaEl;
const countSlider = countSliderEl;
const countValue = countValueEl;
const slopeSlider = slopeSliderEl;
const slopeValue = slopeValueEl;
const ageSlider = ageSliderEl;
const ageValue = ageValueEl;
const profilePlummer = profilePlummerEl;
const profileEff = profileEffEl;
const reseed = reseedEl;
const mostMassive = mostMassiveEl;
const turnoffReadout = turnoffEl;
const totalMass = totalMassEl;
const halfRadius = halfRadiusEl;
const shiningCount = shiningCountEl;
const remnantCount = remnantCountEl;
const giantCount = giantCountEl;
const turnoffUnit = turnoffUnitEl;
const clusterOverlay = clusterOverlayEl;
const clusterOverlayCtx = requiredContext2d(clusterOverlay);
const view2d = view2dEl;
const view3d = view3dEl;
const resetView = resetViewEl;
const deriveToggle = deriveToggleEl;
const derivePanel = derivePanelEl;
const fehSlider = fehSliderEl;
const fehValue = fehValueEl;
const meclSlider = meclSliderEl;
const meclValue = meclValueEl;
const extrapolatedCount = extrapolatedCountEl;
const stationMode = stationModeEl;
const help = helpEl;
const copyResults = copyResultsEl;
const reset = resetEl;
const status = statusEl;
const clusterCanvas = clusterCanvasEl;
const hrCanvas = hrCanvasEl;
const imfCanvas = imfCanvasEl;

// No 2-D context on #clusterCanvas: it is the WebGL surface now, and asking a canvas for
// a 2-D context permanently forecloses getting a WebGL one from it ("Canvas has an
// existing context of a different type"). The scale bar and rings go on #clusterOverlay.
const hrCtx = requiredContext2d(hrCanvas, "#hrCanvas");
const imfCtx = requiredContext2d(imfCanvas, "#imfCanvas");

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:cluster-census:mode",
  url: new URL(window.location.href)
});

interface DemoState {
  law: ImfLaw;
  starCount: number;
  alphaHigh: number;
  ageMyr: number;
  profile: ProfileKind;
  seed: number;
  /** When true, `alphaHigh` is computed from the two environment controls, not dragged. */
  deriveSlope: boolean;
  metallicityFeH: number;
  logClusterMassMsun: number;
}

const DEFAULTS: DemoState = {
  law: "maschberger",
  starCount: 800,
  alphaHigh: 2.3,
  deriveSlope: false,
  metallicityFeH: 0,
  logClusterMassMsun: 4,
  ageMyr: 0,
  profile: "plummer",
  seed: 1
};

const state: DemoState = { ...DEFAULTS };

/**
 * Lowest mass drawn [Msun].
 *
 * The hydrogen-burning limit is 0.08, and `HYDROGEN_BURNING_MIN_MSUN` says so, but the
 * Tout ZAMS fits start at 0.1 -- so a star drawn below 0.1 has no luminosity, no
 * temperature, and no place on the HR diagram. Because the mass function is so steep,
 * that sliver holds about a tenth of every draw: at the old floor a 2000-star cluster
 * put 235 stars on screen that the model could not describe.
 *
 * Sampling from the model's own floor is the honest fix. Clamping them up to 0.1 would
 * fabricate a spike at the boundary, which is the defect this project already found in
 * stars-zams-hr; drawing them as blanks teaches nothing. The missing sliver is stated in
 * the Understand tab rather than drawn as 235 empty rings.
 */
const CENSUS_MIN_MASS_MSUN = 0.1;

/** EFF density slope used for the "young cluster" profile. */
const EFF_GAMMA = 3;
/** Scale radius, fixed. The demo is about the mass function, not cluster size. */
const SCALE_RADIUS_PC = 1.2;
const HISTOGRAM_BINS = 26;

let cluster: StarCluster = sampleStarCluster({
  seed: state.seed,
  starCount: state.starCount,
  imf: state.law,
  alphaHigh: state.alphaHigh,
  ageMyr: state.ageMyr,
  minMassMsun: CENSUS_MIN_MASS_MSUN,
  profile: { kind: state.profile, scaleRadiusPc: SCALE_RADIUS_PC, gamma: EFF_GAMMA }
});

function resample(): void {
  cluster = sampleStarCluster({
    seed: state.seed,
    starCount: state.starCount,
    imf: state.law,
    alphaHigh: state.alphaHigh,
    ageMyr: state.ageMyr,
    minMassMsun: CENSUS_MIN_MASS_MSUN,
    profile: { kind: state.profile, scaleRadiusPc: SCALE_RADIUS_PC, gamma: EFF_GAMMA }
  });
}

/* ── Canvas plumbing ─────────────────────────────────────────────────────────*/

interface Surface {
  width: number;
  height: number;
}

function sizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Surface {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { width, height };
}

/**
 * Theme colours, read once per frame.
 *
 * `getComputedStyle` forces style resolution, so calling it inside a 20,000-star loop is
 * the difference between a redraw and a stall.
 */
interface Palette {
  axis: string;
  text: string;
  muted: string;
  accent: string;
  amber: string;
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const value = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    axis: value("--cp-border", "#3a4358"),
    text: value("--cp-text", "#e8edf7"),
    muted: value("--cp-muted", "#93a0b8"),
    accent: value("--cp-accent-ice", "#7fd4e8"),
    amber: value("--cp-accent-amber", "#f2b544")
  };
}

/*
 * Sizes are computed per panel by `axisFontPx`, not baked in: a fixed 11px is legible in
 * a 500px panel and unreadable from the back of a lecture hall on a 1200px one.
 */
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS_STACK = "system-ui, -apple-system, Segoe UI, sans-serif";

/**
 * Left padding wide enough for the widest tick label AND the rotated axis title beside it.
 *
 * Guessing a multiple of the font size put "luminosity" through the middle of the tick
 * labels once the labels grew a superscript minus. Measuring costs one pass over at most
 * a dozen short strings, and cannot drift.
 */
function measuredAxisPadLeft(
  ctx: CanvasRenderingContext2D,
  tickFont: string,
  labels: readonly string[],
  titleHeightPx: number
): number {
  const previous = ctx.font;
  ctx.font = tickFont;
  let widest = 0;
  for (const label of labels) widest = Math.max(widest, ctx.measureText(label).width);
  ctx.font = previous;
  return Math.ceil(titleHeightPx + 8 + widest + 8);
}

/* ── Selection ───────────────────────────────────────────────────────────────
 * One star id, shared by both panels. Hovering is transient; clicking pins, and clicking
 * empty sky clears. The two panels show the same population in different spaces, so
 * lighting the same star in both is what turns two plots into one instrument.
 */

let hoverId: number | null = null;
let pinnedId: number | null = null;

/**
 * Screen positions from the LAST draw, so picking and drawing can never disagree.
 *
 * The HR panel records these while painting. The cluster panel cannot: it is a WebGL
 * scene whose camera the reader can move between frames, so its picks are projected on
 * demand from the current camera instead.
 */
const hrPicks: PickCandidate[] = [];

function highlightedId(): number | null {
  return hoverId ?? pinnedId;
}

/** A ring around the selected star, drawn in whichever panel is being painted. */
function drawSelectionRing(
  ctx: CanvasRenderingContext2D,
  pick: PickCandidate | undefined,
  palette: Palette,
  pinned: boolean
): void {
  if (!pick) return;
  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = pinned ? 2 : 1.25;
  if (!pinned) ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(pick.x, pick.y, pick.radiusPx + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ── Panel 1: the cluster in space (WebGL) ───────────────────────────────────
 * The stars live in a three.js scene so they can be orbited, zoomed and panned, and so
 * every one of them gets an additive glow instead of only the bright few. See
 * clusterScene.ts for why that matters. Everything that needs text -- the scale bar --
 * plus the selection ring is drawn on a 2-D canvas stacked over it. */

const clusterScene = createClusterScene(clusterCanvas);

if (!clusterScene) {
  // One panel down, not the whole instrument. The HR diagram and the histogram carry the
  // same population, so the demo still teaches what it is for.
  const stage = clusterCanvas.closest(".census-stage");
  if (stage) {
    stage.classList.add("census-stage--unavailable");
    const note = document.createElement("p");
    note.className = "census-stage__unavailable";
    note.textContent =
      "This view needs WebGL, which this browser has not made available. The HR diagram and the mass histogram below show the same stars.";
    stage.append(note);
  }
}

/** Dot size in px for a star: cube root of mass, so one heavy star cannot swamp a frame. */
function sceneSizePx(star: ClusterStar): number {
  const base = massToDotRadiusPx(star.massMsun, 0.85);
  // A giant is hundreds of times its own main-sequence radius. Drawing that to scale
  // would swallow the panel, so it gets a bump rather than the truth.
  return star.phase === "post-main-sequence" ? Math.max(base * 1.5, 2.2) : base;
}

function buildSceneStars(): SceneStar[] {
  const out: SceneStar[] = [];
  for (const star of cluster.stars) {
    const remnant = star.phase === "remnant" || star.phase === "outside-model-range";
    out.push({
      id: star.id,
      x: star.positionPc.x,
      y: star.positionPc.y,
      z: star.positionPc.z,
      sizePx: remnant ? Math.max(0.7, sceneSizePx(star) * 0.5) : sceneSizePx(star),
      // A remnant emits nothing. It stays on screen because the star is still there, but
      // it is drawn grey and dim rather than given a colour it does not have.
      rgb: remnant ? [150, 158, 176] : temperatureToRgb(star.temperatureK),
      alpha: remnant ? 0.32 : 0.95
    });
  }
  return out;
}

/**
 * Plot radius [pc] used to frame the camera.
 *
 * A multiple of the HALF-NUMBER radius, not a high percentile of the outermost stars. A
 * Plummer sphere has a long tail: at the 95th percentile of the 3-D radius the frame is
 * about four times the half-number radius across, so the part of the cluster you can
 * actually see sits in the middle fifth of the panel with empty sky around it. Framing on
 * the median and standing back a little shows the cluster and still admits the stragglers.
 */
const FRAME_HALF_NUMBER_RADII = 2.6;

function clusterPlotRadiusPc(): number {
  const radii = cluster.stars.map((s) => Math.hypot(s.positionPc.x, s.positionPc.y, s.positionPc.z));
  if (radii.length === 0) return SCALE_RADIUS_PC * 3;
  radii.sort((a, b) => a - b);
  const halfNumberRadiusPc = radii[Math.floor(radii.length / 2)] ?? SCALE_RADIUS_PC;
  return Math.max(SCALE_RADIUS_PC * 0.8, halfNumberRadiusPc * FRAME_HALF_NUMBER_RADII);
}

function pushClusterToScene(): void {
  clusterScene?.setStars(buildSceneStars(), clusterPlotRadiusPc());
}

/** A round number of parsecs that spans roughly a third of the view. */
function niceScaleLength(outerPc: number): number {
  const target = outerPc * 0.6;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= target) return step * magnitude;
  }
  return 10 * magnitude;
}

/** Scale bar and selection ring, over the WebGL layer. */
function drawClusterOverlay(palette: Palette): void {
  const { width, height } = sizeCanvas(clusterOverlay, clusterOverlayCtx);
  const ctx = clusterOverlayCtx;

  // Scale bar: without it the panel has no size, and every cluster looks the same. It has
  // to follow the camera, because the camera is now the reader's to move.
  if (!clusterScene) return;
  const pcPerPixel = clusterScene.parsecsPerPixel();
  // Published on the overlay so a test can assert that the bar actually tracks the
  // camera. Reading it off the rendered pixels is not possible: the WebGL buffer is not
  // preserved, and forcing it to be would cost every frame to serve the tests.
  clusterOverlay.dataset.viewMode = clusterScene.getMode();
  clusterOverlay.dataset.pcPerPixel = pcPerPixel.toPrecision(6);
  if (Number.isFinite(pcPerPixel) && pcPerPixel > 0) {
    const barPc = niceScaleLength(pcPerPixel * width * 0.5);
    const barPx = barPc / pcPerPixel;
    if (barPx > 8 && barPx < width * 0.8) {
      const barY = height - 18;
      const barX = 16;
      ctx.strokeStyle = palette.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + barPx, barY);
      ctx.moveTo(barX, barY - 4);
      ctx.lineTo(barX, barY + 4);
      ctx.moveTo(barX + barPx, barY - 4);
      ctx.lineTo(barX + barPx, barY + 4);
      ctx.stroke();

      const fontPx = axisFontPx(width);
      ctx.font = `${fontPx}px ${MONO_STACK}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      // A plate under the label: at 20,000 stars the core reaches the corner and the bare
      // text was being read through a crowd of dots.
      const barLabel = `${barPc} pc`;
      ctx.fillStyle = "rgba(10, 14, 24, 0.65)";
      ctx.fillRect(barX - 4, barY - 8 - fontPx, ctx.measureText(barLabel).width + 8, fontPx + 4);
      ctx.fillStyle = palette.muted;
      ctx.fillText(barLabel, barX, barY - 6);
    }
  }

  const selected = highlightedId();
  if (selected === null) return;
  const pick = clusterScene.projectAll().find((entry) => entry.id === selected);
  drawSelectionRing(ctx, pick, palette, hoverId === null);
}

/* ── Panel 2: the HR diagram ─────────────────────────────────────────────────*/

/**
 * Axis bounds, fitted to the draw.
 *
 * Fixed bounds wide enough for a 150 Msun supergiant leave an 800-star open cluster as a
 * short streak in the corner of a mostly empty box. Snapping to whole decades around the
 * data keeps the plot full without the axes twitching on every reseed.
 */
function hrRanges(): { temperature: Range; luminosity: Range } {
  let minLogL = Infinity;
  let maxLogL = -Infinity;
  let minLogT = Infinity;
  let maxLogT = -Infinity;
  for (const star of cluster.stars) {
    if (!isPlottable(star)) continue;
    const logL = Math.log10(star.luminosityLsun);
    const logT = Math.log10(star.temperatureK);
    if (logL < minLogL) minLogL = logL;
    if (logL > maxLogL) maxLogL = logL;
    if (logT < minLogT) minLogT = logT;
    if (logT > maxLogT) maxLogT = logT;
  }
  if (!Number.isFinite(minLogL)) {
    return {
      temperature: { min: Math.log10(3000), max: Math.log10(30000) },
      luminosity: { min: -2, max: 4 }
    };
  }
  return {
    // At least four decades of luminosity, so a young cluster whose stars span two does
    // not get magnified into a scatter of noise.
    luminosity: padRange(minLogL, maxLogL, 0.35, 4),
    temperature: padRange(minLogT, maxLogT, 0.06, 0.6)
  };
}

interface Range {
  min: number;
  max: number;
}

function padRange(min: number, max: number, pad: number, minimumSpan: number): Range {
  let lo = min - pad;
  let hi = max + pad;
  const shortfall = minimumSpan - (hi - lo);
  if (shortfall > 0) {
    lo -= shortfall / 2;
    hi += shortfall / 2;
  }
  return { min: lo, max: hi };
}

function isPlottable(star: ClusterStar): boolean {
  return (
    (star.phase === "main-sequence" || star.phase === "post-main-sequence") &&
    star.luminosityLsun > 0 &&
    star.temperatureK > 0
  );
}

/** Decade ticks inside a log range, thinned so labels never collide. */
function decadeTicks(range: Range): number[] {
  const first = Math.ceil(range.min);
  const last = Math.floor(range.max);
  const all: number[] = [];
  for (let p = first; p <= last; p += 1) all.push(p);
  const step = all.length > 7 ? 2 : 1;
  return all.filter((_, i) => i % step === 0);
}

/** Round temperatures that fall inside the visible range, hot to cool. */
const HR_TEMPERATURE_TICKS = [50000, 30000, 20000, 10000, 7000, 5000, 4000, 3000, 2500];

function drawHrDiagram(palette: Palette): void {
  const { width, height } = sizeCanvas(hrCanvas, hrCtx);
  const ctx = hrCtx;
  const fontPx = axisFontPx(width);
  const axisFont = `${fontPx}px ${MONO_STACK}`;
  const labelFont = `${fontPx + 1}px ${SANS_STACK}`;
  // Left padding has to clear the tick labels AND the rotated axis title beside them.
  const { temperature: temperatureRange, luminosity: luminosityRange } = hrRanges();
  const luminosityTicks = decadeTicks(luminosityRange);
  const pad = {
    // No rotated title to clear any more: the axis titles are KaTeX in the HTML beside
    // the canvas, so the padding only has to fit the tick labels.
    left: measuredAxisPadLeft(ctx, axisFont, luminosityTicks.map(powerOfTenLabel), 0),
    right: 12,
    top: 12,
    bottom: Math.round(fontPx * 1.7)
  };
  const plotLeft = pad.left;
  const plotRight = width - pad.right;
  const plotTop = pad.top;
  const plotBottom = height - pad.bottom;

  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotLeft, plotTop, plotRight - plotLeft, plotBottom - plotTop);

  ctx.font = axisFont;
  ctx.fillStyle = palette.muted;

  // Temperature axis runs hot to cool, left to right: the HR convention.
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  // A fitted axis can squeeze 5k, 4k, 3k and 2.5k into forty pixels. Keep a tick only if
  // its label clears the last one drawn.
  let lastTickX = -Infinity;
  const minimumTickGapPx = fontPx * 3;
  for (const temperatureK of HR_TEMPERATURE_TICKS) {
    const logT = Math.log10(temperatureK);
    if (logT < temperatureRange.min || logT > temperatureRange.max) continue;
    const x = projectToPixels(logT, temperatureRange, plotLeft, plotRight, true);
    if (x - lastTickX < minimumTickGapPx) continue;
    lastTickX = x;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(x, plotTop);
    ctx.lineTo(x, plotBottom);
    ctx.strokeStyle = palette.axis;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(temperatureTickLabel(temperatureK), x, plotBottom + 5);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const logL of luminosityTicks) {
    const y = projectToPixels(logL, luminosityRange, plotBottom, plotTop);
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(plotLeft, y);
    ctx.lineTo(plotRight, y);
    ctx.strokeStyle = palette.axis;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(powerOfTenLabel(logL), plotLeft - 6, y);
  }

  const toX = (temperatureK: number) =>
    projectToPixels(Math.log10(temperatureK), temperatureRange, plotLeft, plotRight, true);
  const toY = (luminosityLsun: number) =>
    projectToPixels(Math.log10(luminosityLsun), luminosityRange, plotBottom, plotTop);

  // Main sequence first, giants over the top: there are a hundred times more of the
  // former, and the giant branch is the feature the reader is looking for.
  hrPicks.length = 0;
  let plotted = 0;
  let giants = 0;
  for (const pass of ["main-sequence", "post-main-sequence"] as const) {
    for (const star of cluster.stars) {
      if (star.phase !== pass || !isPlottable(star)) continue;
      plotted += 1;
      const x = toX(star.temperatureK);
      const y = toY(star.luminosityLsun);
      const rgb = temperatureToRgb(star.temperatureK);
      const isGiant = pass === "post-main-sequence";
      if (isGiant) giants += 1;
      const dotRadius = isGiant
        ? Math.max(2.6, massToDotRadiusPx(star.massMsun, 0.55))
        : Math.max(1.1, massToDotRadiusPx(star.massMsun, 0.42));
      if (isGiant) {
        // A giant is rare and enormous; a halo makes it findable without inflating the
        // dot until it lies about where the star sits.
        ctx.fillStyle = rgbToCss(rgb, 0.22);
        ctx.beginPath();
        ctx.arc(x, y, dotRadius * 2.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = rgbToCss(rgb, isGiant ? 0.95 : 0.85);
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      hrPicks.push({ id: star.id, x, y, radiusPx: dotRadius });
      if (star.zamsExtrapolated) {
        // Above the Tout ceiling. The ring says so on the point itself, so the claim
        // travels with the data rather than living only in the tally.
        ctx.strokeStyle = palette.amber;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  const selectedHr = highlightedId();
  if (selectedHr !== null) {
    drawSelectionRing(ctx, hrPicks.find((p) => p.id === selectedHr), palette, hoverId === null);
  }

  // The turnoff is the point of the age control, so mark it rather than leaving the
  // reader to find the topmost dot. At age zero there is nothing to mark: no star has
  // left the main sequence, and the heaviest one is just the heaviest one.
  const turnoff = turnoffMassMsun(cluster.stars);
  if (turnoff !== null && state.ageMyr > 0 && cluster.remnantCount + giants > 0) {
    const marker = cluster.stars.find(
      (s) => s.phase === "main-sequence" && s.massMsun === turnoff
    );
    if (marker) {
      const x = toX(marker.temperatureK);
      const y = toY(marker.luminosityLsun);
      ctx.strokeStyle = palette.amber;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = palette.amber;
      ctx.font = axisFont;
      const room = plotRight - x > 70;
      ctx.textAlign = room ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText("turnoff", room ? x + 13 : x - 13, y);
    }
  }

  // Legend goes bottom-left: hot and faint is the one corner of an HR diagram that
  // nothing ever occupies. Top-right is where the giants are.
  ctx.font = axisFont;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  if (giants > 0) {
    ctx.fillStyle = palette.muted;
    ctx.fillText(
      `${formatCount(plotted - giants)} on the main sequence`,
      plotLeft + 8,
      plotBottom - 10 - fontPx
    );
    ctx.fillStyle = palette.text;
    ctx.fillText(
      `${formatCount(giants)} giant${giants === 1 ? "" : "s"}`,
      plotLeft + 8,
      plotBottom - 8
    );
  } else {
    ctx.fillStyle = palette.muted;
    ctx.fillText(`${formatCount(plotted)} stars, none evolved yet`, plotLeft + 8, plotBottom - 8);
  }

  if (plotted === 0) {
    ctx.fillStyle = palette.muted;
    ctx.font = labelFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Every star has burned out.",
      (plotLeft + plotRight) / 2,
      (plotTop + plotBottom) / 2
    );
  }
}

/* ── Panel 3: the mass histogram ─────────────────────────────────────────────*/

function drawHistogram(palette: Palette): void {
  const { width, height } = sizeCanvas(imfCanvas, imfCtx);
  const ctx = imfCtx;
  const fontPx = axisFontPx(width);
  const axisFont = `${fontPx}px ${MONO_STACK}`;
  const labelFont = `${fontPx + 1}px ${SANS_STACK}`;
  const pad = {
    left: measuredAxisPadLeft(ctx, axisFont, ["10", powerOfTenLabel(4)], 0),
    right: 12,
    top: 12,
    bottom: Math.round(fontPx * 1.7)
  };
  const plotLeft = pad.left;
  const plotRight = width - pad.right;
  const plotTop = pad.top;
  const plotBottom = height - pad.bottom;

  const { edgesMsun, centresMsun } = buildLogMassBins(
    CENSUS_MIN_MASS_MSUN,
    IMF_MAX_MSUN,
    HISTOGRAM_BINS
  );
  const masses = cluster.stars.map((s) => s.massMsun);
  const counts = countIntoBins(masses, edgesMsun);

  const fraction =
    state.law === "kroupa"
      ? (() => {
          const segments = buildKroupaSegments(
            CENSUS_MIN_MASS_MSUN,
            IMF_MAX_MSUN,
            state.alphaHigh
          );
          return (lo: number, hi: number) => kroupaMassFraction(lo, hi, segments);
        })()
      : (lo: number, hi: number) =>
          maschbergerMassFraction(lo, hi, {
            minMassMsun: CENSUS_MIN_MASS_MSUN,
            maxMassMsun: IMF_MAX_MSUN,
            alphaHigh: state.alphaHigh
          });
  const expected = expectedCounts(edgesMsun, cluster.stars.length, fraction);

  // Counts span decades, so the vertical axis is logarithmic; a linear one shows the
  // first bin and nothing else.
  const peak = Math.max(1, ...counts, ...expected);
  const logRange = { min: 0, max: Math.log10(peak) + 0.25 };
  const massRange = { min: Math.log10(edgesMsun[0]), max: Math.log10(edgesMsun[edgesMsun.length - 1]) };

  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotLeft, plotTop, plotRight - plotLeft, plotBottom - plotTop);

  ctx.font = axisFont;
  ctx.fillStyle = palette.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const massMsun of [0.1, 1, 10, 100]) {
    const x = projectToPixels(Math.log10(massMsun), massRange, plotLeft, plotRight);
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(x, plotTop);
    ctx.lineTo(x, plotBottom);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(String(massMsun), x, plotBottom + 5);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let power = 0; power <= Math.ceil(logRange.max); power += 1) {
    const y = projectToPixels(power, logRange, plotBottom, plotTop);
    if (y < plotTop) continue;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(plotLeft, y);
    ctx.lineTo(plotRight, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(powerOfTenLabel(power), plotLeft - 6, y);
  }

  // Sampled bars.
  const barToY = (count: number) =>
    count <= 0 ? plotBottom : projectToPixels(Math.log10(count), logRange, plotBottom, plotTop);
  for (let i = 0; i < counts.length; i += 1) {
    const x0 = projectToPixels(Math.log10(edgesMsun[i]), massRange, plotLeft, plotRight);
    const x1 = projectToPixels(Math.log10(edgesMsun[i + 1]), massRange, plotLeft, plotRight);
    const y = barToY(counts[i]);
    if (counts[i] <= 0) continue;
    ctx.fillStyle = rgbToCss(temperatureToRgb(massToApproxTemperatureK(centresMsun[i])), 0.55);
    ctx.fillRect(x0 + 0.5, y, Math.max(1, x1 - x0 - 1), plotBottom - y);
  }

  // The analytic law, over the top.
  //
  // The pen lifts wherever the prediction falls below one star per bin. Clamping it to
  // the axis instead drew a flat orange line all the way out to 100 Msun, which reads as
  // "the law predicts a steady trickle of very massive stars" when what it predicts is a
  // hundredth of one.
  ctx.strokeStyle = palette.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let penDown = false;
  for (let i = 0; i < expected.length; i += 1) {
    const visible = expected[i] > 0 && Math.log10(expected[i]) >= logRange.min;
    if (!visible) {
      penDown = false;
      continue;
    }
    const x = projectToPixels(Math.log10(centresMsun[i]), massRange, plotLeft, plotRight);
    const y = barToY(expected[i]);
    if (penDown) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    penDown = true;
  }
  ctx.stroke();

  /*
   * No legend on the canvas.
   *
   * It sat top-right until the panel got short enough for the first bins to reach it,
   * then bottom-right until a 20,000-star draw filled the tail out to 100 Msun. There is
   * no corner of this plot that is reliably empty, because which corners are empty is
   * exactly what the reader is changing. The panel's own subtitle already says "bars are
   * your draw; the line is the law", in HTML, where nothing can collide with it and a
   * screen reader can read it.
   */
}

/**
 * A rough temperature for a bin centre, used only to tint the histogram bars so the
 * mass axis and the HR diagram share a colour language. Not a physical claim.
 */
function massToApproxTemperatureK(massMsun: number): number {
  return 5772 * massMsun ** 0.55;
}

/* ── Readouts ────────────────────────────────────────────────────────────────*/

function renderReadouts(): void {
  const turnoff = turnoffMassMsun(cluster.stars);
  mostMassive.textContent = formatMassMsun(cluster.mostMassiveMsun);
  // At age zero every star is still on the main sequence, so the "turnoff" would just be
  // the heaviest star restated -- two readouts showing the same number for no reason.
  const turnoffHasHappened =
    state.ageMyr > 0 && cluster.remnantCount + cluster.postMainSequenceCount > 0;
  turnoffReadout.textContent =
    turnoff === null ? "none left" : turnoffHasHappened ? formatMassMsun(turnoff) : "not yet";
  // "not yet Msun" is not a quantity. The unit belongs to the number, so it goes with it.
  turnoffUnit.hidden = !(turnoff !== null && turnoffHasHappened);
  totalMass.textContent = formatCount(cluster.totalMassMsun);
  halfRadius.textContent = formatRadiusPc(radiusEnclosingFractionPc(cluster.stars, 0.5));
  shiningCount.textContent = formatCount(cluster.mainSequenceCount);
  remnantCount.textContent = formatCount(cluster.remnantCount);
  giantCount.textContent = formatCount(cluster.postMainSequenceCount);
  extrapolatedCount.textContent = formatCount(cluster.extrapolatedCount);
  // Nothing above the Tout ceiling is the normal case; a permanent "0" is just noise.
  extrapolatedCount.parentElement?.setAttribute(
    "data-empty",
    String(cluster.extrapolatedCount === 0)
  );

  const age = formatAge(state.ageMyr);
  countValue.textContent = formatCount(state.starCount);
  slopeValue.textContent = state.deriveSlope
    ? `${state.alphaHigh.toFixed(2)} - ${slopeVerdict(state.alphaHigh, CANONICAL_HIGH_MASS_SLOPE)}`
    : state.alphaHigh.toFixed(2);
  fehValue.textContent = state.metallicityFeH.toFixed(2);
  meclValue.textContent = `${state.logClusterMassMsun.toFixed(2)} (${formatCount(
    10 ** state.logClusterMassMsun
  )} solar masses)`;
  // The derived slope moves the slider, so the slider has to be re-read from state.
  if (state.deriveSlope) slopeSlider.value = String(Math.round(state.alphaHigh * 100));
  ageValue.textContent = `${age.value} ${age.unit}`;

  setLiveRegionText(
    status,
    censusAnnouncement({
      starCount: cluster.stars.length,
      law: state.law,
      ageMyr: state.ageMyr,
      mostMassiveMsun: cluster.mostMassiveMsun,
      turnoffMsun: turnoff,
      remnantCount: cluster.remnantCount,
      giantCount: cluster.postMainSequenceCount
    })
  );
}

function syncChips(): void {
  deriveToggle.setAttribute("aria-pressed", String(state.deriveSlope));
  derivePanel.hidden = !state.deriveSlope;
  slopeSlider.closest(".control")?.classList.toggle("control--derived", state.deriveSlope);
  // Read-only rather than disabled: a disabled slider stops announcing its value, and
  // watching the slope move IS the lesson here.
  slopeSlider.setAttribute("aria-readonly", String(state.deriveSlope));
  lawMaschberger.setAttribute("aria-pressed", String(state.law === "maschberger"));
  lawKroupa.setAttribute("aria-pressed", String(state.law === "kroupa"));
  profilePlummer.setAttribute("aria-pressed", String(state.profile === "plummer"));
  profileEff.setAttribute("aria-pressed", String(state.profile === "eff"));
  countSlider.setAttribute("aria-valuetext", `${formatCount(state.starCount)} stars`);
  slopeSlider.setAttribute("aria-valuetext", `alpha ${state.alphaHigh.toFixed(2)}`);
  const age = formatAge(state.ageMyr);
  ageSlider.setAttribute("aria-valuetext", `${age.value} ${age.unit}`);
  // Both carry hundredths of a dex, so the raw value ("-200") is meaningless read aloud.
  fehSlider.setAttribute("aria-valuetext", `${state.metallicityFeH.toFixed(2)} dex`);
  meclSlider.setAttribute(
    "aria-valuetext",
    `${formatCount(10 ** state.logClusterMassMsun)} solar masses`
  );
}

/* ── Star inspector ──────────────────────────────────────────────────────────*/

const starCardEl = document.querySelector<HTMLElement>("#starCard");
const starSwatchEl = document.querySelector<HTMLElement>("#starSwatch");

function setCardField(key: string, value: string): void {
  const el = starCardEl?.querySelector<HTMLElement>(`[data-star="${key}"]`);
  if (el) el.textContent = value;
}

/**
 * What to call this star.
 *
 * The physics model leaves `spectralType` empty off the main sequence on purpose: its
 * classifier is built on the main-sequence temperature sequence and appends luminosity
 * class V, which a giant is not. Rather than print a dash, name the thing by colour and
 * class -- "red giant" is a real description, an invented MK type is not.
 */
function starTypeLabel(star: ClusterStar): string {
  if (star.phase === "main-sequence") return star.spectralType || "--";
  if (star.phase === "remnant") return star.remnant ?? "remnant";
  if (star.phase !== "post-main-sequence") return "--";
  const size = star.massMsun >= 8 ? "supergiant" : "giant";
  const colour =
    star.temperatureK < 4000
      ? "red"
      : star.temperatureK < 5500
        ? "orange"
        : star.temperatureK < 7500
          ? "yellow"
          : "hot";
  return `${colour} ${size}`;
}

function phaseLabel(star: ClusterStar): string {
  if (star.phase === "remnant") return star.remnant ?? "remnant";
  if (star.phase === "post-main-sequence") {
    return star.postMainSequenceStage === "giant" ? "giant" : "crossing the gap";
  }
  if (star.phase === "outside-model-range") return "outside the model";
  return "main sequence";
}

function updateStarCard(): void {
  if (!starCardEl) return;
  const id = highlightedId();
  const star = id === null ? undefined : cluster.stars.find((s) => s.id === id);
  if (!star) {
    // The card keeps its footprint when empty. Collapsing it made the whole stage jump
    // every time the pointer crossed a gap between two stars.
    starCardEl.dataset.empty = "true";
    return;
  }
  starCardEl.dataset.empty = "false";
  if (starSwatchEl) {
    // A remnant emits nothing, so it gets the muted swatch rather than a fake colour.
    const colour =
      star.temperatureK > 0
        ? rgbToCss(temperatureToRgb(star.temperatureK), 1)
        : "rgba(150, 158, 176, 0.7)";
    starSwatchEl.style.background = colour;
    starSwatchEl.style.color = colour;
  }
  setCardField("mass", formatMassMsun(star.massMsun));
  setCardField("type", starTypeLabel(star));
  setCardField("teff", star.temperatureK > 0 ? formatCount(star.temperatureK) : "--");
  setCardField("logl", formatLogLuminosity(star.luminosityLsun));
  setCardField("radius", formatStellarRadius(star.stellarRadiusRsun));
  setCardField("phase", phaseLabel(star));
}

/**
 * Pointer wiring for one panel.
 *
 * A pointerup that moved more than a few pixels was a drag, not a click, so it must not
 * change the pin -- otherwise every attempt to sweep across the panel reassigns it.
 */
function bindPicking(
  canvas: HTMLCanvasElement,
  picksOf: () => readonly PickCandidate[]
): void {
  const idAt = (event: PointerEvent): number | null => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return null;
    // No scaling: `sizeCanvas` lays the panel out in getBoundingClientRect pixels, so the
    // pointer is already in the same frame the picks were recorded in. Correcting by
    // clientWidth instead shifts every pick by the 1px border on each side.
    return pickNearest(picksOf(), event.clientX - rect.left, event.clientY - rect.top);
  };
  const setHover = (id: number | null) => {
    if (id === hoverId) return;
    hoverId = id;
    canvas.style.cursor = id === null ? "" : "pointer";
    updateStarCard();
    scheduleRedraw();
  };
  let downX = 0;
  let downY = 0;
  canvas.addEventListener("pointermove", (event) => {
    if (event.buttons !== 0) return;
    setHover(idAt(event));
  });
  canvas.addEventListener("pointerleave", () => setHover(null));
  canvas.addEventListener("pointerdown", (event) => {
    downX = event.clientX;
    downY = event.clientY;
  });
  canvas.addEventListener("pointerup", (event) => {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
    pinnedId = idAt(event);
    updateStarCard();
    scheduleRedraw();
  });
}

/**
 * Keyboard access to the same selection.
 *
 * Hover-to-inspect is a pointer gesture, and shipping it alone would put the per-star
 * detail out of reach of anyone navigating by keyboard. Stepping through the stars in
 * mass order is not a consolation prize either: it sweeps the main sequence end to end,
 * which is a good way to read the diagram whatever you are using.
 */
function bindKeyboardSelection(canvas: HTMLCanvasElement): void {
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hoverId = null;
      pinnedId = null;
      updateStarCard();
      scheduleRedraw();
      return;
    }
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    const byMass = cluster.stars
      .filter((s) => s.phase === "main-sequence" || s.phase === "post-main-sequence")
      .sort((a, b) => a.massMsun - b.massMsun);
    if (byMass.length === 0) return;
    const current = highlightedId();
    const index = byMass.findIndex((s) => s.id === current);
    // A whole-percent step, so a 20,000-star cluster does not need 20,000 keypresses to
    // cross. Shift takes single steps for when the reader wants one specific star.
    const stride = event.shiftKey ? 1 : Math.max(1, Math.round(byMass.length / 100));
    const next =
      index === -1
        ? direction > 0
          ? 0
          : byMass.length - 1
        : Math.min(byMass.length - 1, Math.max(0, index + direction * stride));
    hoverId = null;
    pinnedId = byMass[next].id;
    updateStarCard();
    scheduleRedraw();
  });
}

bindPicking(clusterCanvas, () => clusterScene?.projectAll() ?? []);
bindPicking(hrCanvas, () => hrPicks);

/* ── Cluster view controls ───────────────────────────────────────────────────*/

function setClusterView(next: ClusterViewMode): void {
  clusterScene?.setMode(next);
  view2d.setAttribute("aria-pressed", String(next === "2D"));
  view3d.setAttribute("aria-pressed", String(next === "3D"));
  scheduleRedraw();
}

view2d.addEventListener("click", () => setClusterView("2D"));
view3d.addEventListener("click", () => setClusterView("3D"));
resetView.addEventListener("click", () => {
  clusterScene?.resetView();
  scheduleRedraw();
});

// The scale bar and the selection ring live on a 2-D canvas over the scene, so they have
// to be repainted whenever the camera moves -- otherwise a "5 pc" bar keeps its label
// while the reader zooms straight past it.
clusterScene?.onChange(() => scheduleRedraw());
window.addEventListener("resize", () => {
  clusterScene?.resize();
  scheduleRedraw();
});
bindKeyboardSelection(clusterCanvas);
bindKeyboardSelection(hrCanvas);

/* ── Redraw ──────────────────────────────────────────────────────────────────*/

let redrawHandle = 0;

function draw(): void {
  const palette = readPalette();
  drawClusterOverlay(palette);
  drawHrDiagram(palette);
  drawHistogram(palette);
}

/** Coalesce redraws to one per frame so dragging a slider stays responsive. */
function scheduleRedraw(): void {
  if (redrawHandle !== 0) return;
  redrawHandle = window.requestAnimationFrame(() => {
    redrawHandle = 0;
    draw();
  });
}

function update({ resampleNeeded = true } = {}): void {
  if (resampleNeeded) {
    resample();
    pushClusterToScene();
    // Ids are positions in a freshly drawn array, so keeping a pin across a resample
    // would silently point the card at a different star.
    hoverId = null;
    pinnedId = null;
    updateStarCard();
  }
  syncChips();
  renderReadouts();
  scheduleRedraw();
}

/* ── Controls ────────────────────────────────────────────────────────────────*/

function setSlidersFromState(): void {
  countSlider.value = String(starCountToSlider(state.starCount));
  slopeSlider.value = String(Math.round(state.alphaHigh * 100));
  ageSlider.value = String(ageMyrToSlider(state.ageMyr));
  fehSlider.value = String(fehToSlider(state.metallicityFeH));
  meclSlider.value = String(logClusterMassToSlider(state.logClusterMassMsun));
}

countSlider.addEventListener("input", () => {
  state.starCount = sliderToStarCount(Number(countSlider.value));
  update();
});

slopeSlider.addEventListener("input", () => {
  if (state.deriveSlope) {
    // The slider is a readout while the slope is derived, so put it back where the
    // environment says it belongs. Returning early is not enough: `pointer-events: none`
    // stops a drag but not the arrow keys on a focused range input, so a keyboard user
    // could otherwise leave the thumb somewhere the model never put it.
    slopeSlider.value = String(Math.round(state.alphaHigh * 100));
    return;
  }
  state.alphaHigh = Number(slopeSlider.value) / 100;
  update();
});

/**
 * Recompute the slope from the environment.
 *
 * Jerabkova et al. (2018): a dense, metal-poor cluster forms a top-heavy population. This
 * is the one control in the demo where the mass function stops being a dial and becomes a
 * consequence -- which is the point worth making, since students meet the IMF as if it
 * were a constant of nature.
 */
function applyDerivedSlope(): void {
  if (!state.deriveSlope) return;
  state.alphaHigh = highMassSlopeFromEnvironment(
    state.metallicityFeH,
    10 ** state.logClusterMassMsun
  );
}

deriveToggle.addEventListener("click", () => {
  state.deriveSlope = !state.deriveSlope;
  applyDerivedSlope();
  update();
});

fehSlider.addEventListener("input", () => {
  state.metallicityFeH = sliderToFeH(Number(fehSlider.value));
  applyDerivedSlope();
  update();
});

meclSlider.addEventListener("input", () => {
  state.logClusterMassMsun = sliderToLogClusterMass(Number(meclSlider.value));
  applyDerivedSlope();
  update();
});

ageSlider.addEventListener("input", () => {
  state.ageMyr = sliderToAgeMyr(Number(ageSlider.value));
  update();
});

lawMaschberger.addEventListener("click", () => {
  state.law = "maschberger";
  update();
});

lawKroupa.addEventListener("click", () => {
  state.law = "kroupa";
  update();
});

profilePlummer.addEventListener("click", () => {
  state.profile = "plummer";
  update();
});

profileEff.addEventListener("click", () => {
  state.profile = "eff";
  update();
});

reseed.addEventListener("click", () => {
  state.seed += 1;
  update();
});

interface Preset {
  starCount: number;
  ageMyr: number;
  alphaHigh: number;
  profile: ProfileKind;
}

const PRESETS: Record<string, Preset> = {
  // The Pleiades-like case: a few hundred stars, old enough that the O stars have gone.
  open: { starCount: 600, ageMyr: 120, alphaHigh: 2.3, profile: "plummer" },
  // Still embedded, everything still shining, the top of the mass function intact.
  young: { starCount: 4000, ageMyr: 3, alphaHigh: 2.3, profile: "eff" },
  // Enough stars that the tail is well sampled, old enough to have lost most of it.
  globular: { starCount: 20_000, ageMyr: 12_000, alphaHigh: 2.3, profile: "plummer" }
};

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const preset = PRESETS[button.dataset.preset ?? ""];
    if (!preset) return;
    state.starCount = preset.starCount;
    state.ageMyr = preset.ageMyr;
    state.alphaHigh = preset.alphaHigh;
    state.profile = preset.profile;
    setSlidersFromState();
    for (const other of presetButtons) {
      other.setAttribute("aria-pressed", String(other === button));
    }
    update();
  });
}

reset.addEventListener("click", () => {
  Object.assign(state, DEFAULTS);
  setSlidersFromState();
  for (const button of presetButtons) button.setAttribute("aria-pressed", "false");
  update();
});

window.addEventListener("resize", scheduleRedraw);

/* ── Export, modes, runtime ──────────────────────────────────────────────────*/

function exportResults(): ExportPayloadV1 {
  const turnoff = turnoffMassMsun(cluster.stars);
  const age = formatAge(state.ageMyr);
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mode", value: runtime.mode },
      { name: "Mass function", value: state.law },
      { name: "High-mass slope alpha", value: state.alphaHigh.toFixed(2) },
      { name: "Stars requested N", value: String(state.starCount) },
      { name: "Cluster age", value: `${age.value} ${age.unit}` },
      { name: "Spatial profile", value: state.profile },
      { name: "Seed", value: String(state.seed) }
    ],
    readouts: [
      { name: "Heaviest star (Msun)", value: formatMassMsun(cluster.mostMassiveMsun) },
      {
        name: "Main-sequence turnoff (Msun)",
        value: turnoff === null ? "none" : formatMassMsun(turnoff)
      },
      { name: "Total mass (Msun)", value: formatCount(cluster.totalMassMsun) },
      {
        name: "Half-number radius (pc)",
        value: formatRadiusPc(radiusEnclosingFractionPc(cluster.stars, 0.5))
      },
      { name: "Stars on the main sequence", value: formatCount(cluster.mainSequenceCount) },
      { name: "Giants", value: formatCount(cluster.postMainSequenceCount) },
      { name: "Remnants", value: formatCount(cluster.remnantCount) },
      { name: "Below the ZAMS model range", value: formatCount(cluster.outsideModelCount) },
      { name: "Extrapolated above 100 Msun", value: formatCount(cluster.extrapolatedCount) }
    ],
    notes: [
      "Masses drawn from Maschberger (2013) or Kroupa (2001); positions from a Plummer (1911) or truncated EFF (1987) profile.",
      "Zero-age luminosity, radius and temperature from Tout et al. (1996); main-sequence lifetimes from Hurley, Pols & Tout (2000).",
      "Above the Tout ceiling of 100 Msun the ZAMS fits are extrapolated; those stars are plotted, ringed and counted separately.",
      "Below 0.1 Msun the fits are not used at all, so those stars are counted but carry no HR point, rather than being clamped onto one.",
      "No post-main-sequence evolution: a star sits at its zero-age point until its lifetime elapses, then becomes a remnant.",
      "The same seed and the same controls always reproduce this cluster exactly."
    ]
  };
}

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Keyboard shortcuts work when focus is not in an input field.",
    sections: [
      {
        heading: "Shortcuts",
        type: "shortcuts",
        items: [
          { key: "?", action: "Toggle help" },
          { key: "g", action: "Toggle station mode" },
          { key: "r", action: "Draw a new cluster" }
        ]
      },
      {
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Press 'Draw a new cluster' several times at a few hundred stars and watch the heaviest star jump around.",
          "Raise the number of stars and press it again: the same readout settles down, because the tail is better sampled.",
          "Push the age up and watch the HR diagram lose its top-left corner as the massive stars die first.",
          "Compare the bars against the smooth curve: they are the draw and the law, computed separately."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Cluster Census",
    subtitle: "Draw clusters, record the heaviest star, then copy the CSV or print.",
    steps: [
      "Set N to about 300 and add five rows, pressing 'Draw a new cluster' between each.",
      "Set N to 20,000 and add five more. Compare how much the heaviest star moves.",
      "Return to the open-cluster preset and raise the age, watching the turnoff fall."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "law", label: "Mass function" },
      { key: "n", label: "N" },
      { key: "age", label: "Age" },
      { key: "heaviest", label: "Heaviest (Msun)" },
      { key: "turnoff", label: "Turnoff (Msun)" },
      { key: "remnants", label: "Remnants" }
    ],
    getSnapshotRow() {
      const turnoffMass = turnoffMassMsun(cluster.stars);
      const age = formatAge(state.ageMyr);
      return {
        case: "Snapshot",
        law: state.law,
        n: String(cluster.stars.length),
        age: `${age.value} ${age.unit}`,
        heaviest: formatMassMsun(cluster.mostMassiveMsun),
        turnoff: turnoffMass === null ? "none" : formatMassMsun(turnoffMass),
        giants: String(cluster.postMainSequenceCount),
        remnants: String(cluster.remnantCount)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    synthesisPrompt:
      "Across your rows, which readout was least reproducible, and what does that tell you about how many massive stars a cluster actually contains?"
  }
});

demoModes.bindButtons({ helpButton: help, stationButton: stationMode });

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying...");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((error) => {
      setLiveRegionText(
        status,
        error instanceof Error ? `Copy failed: ${error.message}` : "Copy failed."
      );
    });
});


document.addEventListener("keydown", (event) => {
  const target = event.target as HTMLElement | null;
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
  if (event.key === "r" || event.key === "R") {
    state.seed += 1;
    update();
  }
});

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}

initMath();
setSlidersFromState();
// The first draw needs stars in the scene, and `update({ resampleNeeded: false })` by
// definition will not put them there.
pushClusterToScene();
update({ resampleNeeded: false });
