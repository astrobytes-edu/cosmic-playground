import {
  ChallengeEngine,
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
  setLiveRegionText,
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { RetrogradeMotionModel } from "@cosmic/physics";
import {
  advanceCursor,
  buildOrbitPath,
  clamp,
  computeDisplayState,
  dayFromPlotX,
  findPrevNextStationary,
  formatNumber,
  isRetrogradeDurationComparisonComplete,
  nearestRetrogradeInterval,
  orbitEllipsePoints,
  plotXFromDay,
  plotYFromDeg,
  presetToConfig,
  projectToSkyView,
  retrogradeDurationIfActiveAtCursor,
  resolveDistinctPair,
  seriesIndexAtDay,
  zodiacLabelPositions,
  type RetroModelCallbacks,
} from "./logic";

// ── Utility ──────────────────────────────────────────────────

function requireEl<T extends Element>(el: T | null, name: string): T {
  if (!el) throw new Error(`Missing required element: ${name}`);
  return el;
}

function svgEl(tag: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function wrap360(deg: number): number {
  const w = ((deg % 360) + 360) % 360;
  return w === 360 ? 0 : w;
}

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// ── DOM queries ──────────────────────────────────────────────

const preset = requireEl(document.querySelector<HTMLSelectElement>("#preset"), "#preset");
const observer = requireEl(document.querySelector<HTMLSelectElement>("#observer"), "#observer");
const target = requireEl(document.querySelector<HTMLSelectElement>("#target"), "#target");
const windowMonths = requireEl(document.querySelector<HTMLInputElement>("#windowMonths"), "#windowMonths");
const windowMonthsValue = requireEl(document.querySelector<HTMLSpanElement>("#windowMonthsValue"), "#windowMonthsValue");
const plotStepDay = requireEl(document.querySelector<HTMLSelectElement>("#plotStepDay"), "#plotStepDay");
const showOtherPlanets = requireEl(document.querySelector<HTMLInputElement>("#showOtherPlanets"), "#showOtherPlanets");
const showZodiac = requireEl(document.querySelector<HTMLInputElement>("#showZodiac"), "#showZodiac");

const plotFocus = requireEl(document.querySelector<HTMLDivElement>("#plotFocus"), "#plotFocus");
const plotSvgEl = requireEl(document.querySelector<SVGSVGElement>("#plotSvg"), "#plotSvg");
const orbitSvgEl = requireEl(document.querySelector<SVGSVGElement>("#orbitSvg"), "#orbitSvg");
const skySvgEl = requireEl(document.querySelector<SVGSVGElement>("#skySvg"), "#skySvg");

const stateBadge = requireEl(document.querySelector<HTMLSpanElement>("#stateBadge"), "#stateBadge");
const retroAnnotation = requireEl(document.querySelector<HTMLDivElement>("#retroAnnotation"), "#retroAnnotation");
const retroAnnotationClose = requireEl(document.querySelector<HTMLButtonElement>("#retroAnnotationClose"), "#retroAnnotationClose");

const playBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-play"), "#btn-play");
const pauseBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-pause"), "#btn-pause");
const stepBackBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-step-back"), "#btn-step-back");
const stepForwardBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-step-forward"), "#btn-step-forward");
const resetBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-reset"), "#btn-reset");
const speedSelect = requireEl(document.querySelector<HTMLSelectElement>("#speed-select"), "#speed-select");
const scrubSlider = requireEl(document.querySelector<HTMLInputElement>("#scrubSlider"), "#scrubSlider");
const playbarDayEl = requireEl(document.querySelector<HTMLSpanElement>("#playbar-day"), "#playbar-day");

const prevStationaryBtn = requireEl(document.querySelector<HTMLButtonElement>("#prevStationary"), "#prevStationary");
const nextStationaryBtn = requireEl(document.querySelector<HTMLButtonElement>("#nextStationary"), "#nextStationary");
const centerRetrogradeBtn = requireEl(document.querySelector<HTMLButtonElement>("#centerRetrograde"), "#centerRetrograde");

const readoutDay = requireEl(document.querySelector<HTMLSpanElement>("#readoutDay"), "#readoutDay");
const readoutLambda = requireEl(document.querySelector<HTMLSpanElement>("#readoutLambda"), "#readoutLambda");
const readoutSlope = requireEl(document.querySelector<HTMLSpanElement>("#readoutSlope"), "#readoutSlope");
const readoutState = requireEl(document.querySelector<HTMLSpanElement>("#readoutState"), "#readoutState");
const readoutGeometryHint = requireEl(
  document.querySelector<HTMLSpanElement>("#readoutGeometryHint"),
  "#readoutGeometryHint",
);
const readoutRetroDuration = requireEl(document.querySelector<HTMLSpanElement>("#readoutRetroDuration"), "#readoutRetroDuration");

const copyResults = requireEl(document.querySelector<HTMLButtonElement>("#copyResults"), "#copyResults");
const statusEl = requireEl(document.querySelector<HTMLParagraphElement>("#status"), "#status");

const stationBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-station-mode"), "#btn-station-mode");
const helpBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-help"), "#btn-help");
const challengeBtn = requireEl(document.querySelector<HTMLButtonElement>("#btn-challenges"), "#btn-challenges");
const challengeContainer = requireEl(document.querySelector<HTMLDivElement>("#challenge-container"), "#challenge-container");

// ── Starfield ────────────────────────────────────────────────

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

// ── Plot geometry constants ───────────────────────────────────

const PLOT_W = 1000;
const PLOT_H = 400;
const PLOT_MARGIN = { left: 70, right: 24, top: 22, bottom: 60 };
const PLOT_X0 = PLOT_MARGIN.left;
const PLOT_X1 = PLOT_W - PLOT_MARGIN.right;

// ── Planet token map (dynamic color resolution) ──────────────

const PLANET_TOKEN: Record<string, string> = {
  Venus: "--cp-celestial-venus",
  Earth: "--cp-celestial-earth",
  Mars: "--cp-celestial-mars",
  Jupiter: "--cp-celestial-jupiter",
  Saturn: "--cp-celestial-saturn",
};

function resolvePlanetColor(key: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(PLANET_TOKEN[key] ?? "--cp-text")
    .trim();
}

// ── Types & state ────────────────────────────────────────────

type PlanetKey = Parameters<typeof RetrogradeMotionModel.planetElements>[0];
type Series = ReturnType<typeof RetrogradeMotionModel.computeSeries>;

type State = {
  observer: PlanetKey;
  target: PlanetKey;
  windowStartDay: number;
  windowMonths: number;
  plotStepDay: number;
  cursorDay: number;
  showOtherPlanets: boolean;
  showZodiac: boolean;
  playing: boolean;
  speed: number;
};

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:retrograde-motion:mode",
  url: new URL(window.location.href),
});

const state: State = {
  observer: "Earth",
  target: "Mars",
  windowStartDay: 0,
  windowMonths: Number(windowMonths.value),
  plotStepDay: Number(plotStepDay.value),
  cursorDay: 0,
  showOtherPlanets: Boolean(showOtherPlanets.checked),
  showZodiac: Boolean(showZodiac.checked),
  playing: false,
  speed: Number(speedSelect.value) || 5,
};

let series: Series | null = null;
let animationId: number | null = null;
let lastTimestamp = 0;
let hasShownRetroAnnotation = false;

type PlotRenderContext = {
  staticLayer: SVGGElement;
  dynamicLayer: SVGGElement;
  t0: number;
  t1: number;
  x0: number;
  x1: number;
  mainTop: number;
  mainBottom: number;
  unwrapped: number[];
  yMin: number;
  yMax: number;
};

type OrbitRenderContext = {
  staticLayer: SVGGElement;
  dynamicLayer: SVGGElement;
  centerX: number;
  centerY: number;
  scale: number;
};

type SkyRenderContext = {
  staticLayer: SVGGElement;
  dynamicLayer: SVGGElement;
  width: number;
  height: number;
};

let plotRenderContext: PlotRenderContext | null = null;
let orbitRenderContext: OrbitRenderContext | null = null;
let skyRenderContext: SkyRenderContext | null = null;

function createLayerGroup(layer: "static" | "dynamic"): SVGGElement {
  const group = svgEl("g") as SVGGElement;
  group.setAttribute("data-layer", layer);
  return group;
}

const modelCallbacks: RetroModelCallbacks = {
  planetElements: (key: string) => RetrogradeMotionModel.planetElements(key as PlanetKey),
};

function applyObserverTargetPair(
  nextObserver: PlanetKey,
  nextTarget: PlanetKey,
  announceAdjustment = false,
) {
  const resolved = resolveDistinctPair(nextObserver, nextTarget);
  state.observer = resolved.observer as PlanetKey;
  state.target = resolved.target as PlanetKey;
  observer.value = state.observer;
  target.value = state.target;

  if (announceAdjustment && resolved.adjusted) {
    setLiveRegionText(
      statusEl,
      `Observer and target must be different. Target reset to ${state.target}.`,
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────

function snapToInternalGrid(tDay: number): number {
  if (!series) return tDay;
  const dt = series.dtInternalDay;
  const idx = Math.round((tDay - series.windowStartDay) / dt);
  return series.windowStartDay + idx * dt;
}

function setCursorDay(next: number) {
  if (!series) return;
  const clamped = clamp(next, series.windowStartDay, series.windowEndDay);
  state.cursorDay = snapToInternalGrid(clamped);
  scrubSlider.value = String(state.cursorDay);
  const endDay = series.windowEndDay;
  playbarDayEl.textContent = `Day ${formatNumber(state.cursorDay, 1)} of ${formatNumber(endDay, 0)}`;
  render();
}

// ── Compute ──────────────────────────────────────────────────

function recomputeSeries() {
  series = RetrogradeMotionModel.computeSeries({
    observer: state.observer,
    target: state.target,
    windowStartDay: state.windowStartDay,
    windowMonths: state.windowMonths,
  });

  scrubSlider.min = String(series.windowStartDay);
  scrubSlider.max = String(series.windowEndDay);
  scrubSlider.step = String(series.dtInternalDay);
  hasShownRetroAnnotation = false;
  buildPlotLayers();
  buildOrbitLayers();
  buildSkyLayers();
  setCursorDay(state.cursorDay);
}

// ── Animation system ─────────────────────────────────────────

function updateAnimationButtons() {
  playBtn.disabled = state.playing || PREFERS_REDUCED_MOTION;
  pauseBtn.disabled = !state.playing;
}

function startAnimation() {
  if (PREFERS_REDUCED_MOTION) {
    setLiveRegionText(statusEl, "Animation is disabled in reduced-motion mode.");
    return;
  }
  if (state.playing || !series) return;

  state.playing = true;
  lastTimestamp = 0;
  updateAnimationButtons();

  const step = (now: number) => {
    if (!state.playing || !series) return;
    if (lastTimestamp === 0) lastTimestamp = now;
    const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
    lastTimestamp = now;

    const next = advanceCursor(state.cursorDay, dt, state.speed, series.windowEndDay);
    if (next >= series.windowEndDay) {
      state.cursorDay = series.windowEndDay;
      stopAnimation();
      setCursorDay(state.cursorDay);
      return;
    }

    state.cursorDay = next;
    scrubSlider.value = String(state.cursorDay);
    playbarDayEl.textContent = `Day ${formatNumber(state.cursorDay, 1)} of ${formatNumber(series.windowEndDay, 0)}`;
    render();

    animationId = requestAnimationFrame(step);
  };

  animationId = requestAnimationFrame(step);
}

function stopAnimation() {
  state.playing = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  updateAnimationButtons();
}

function stepForward() {
  if (!series) return;
  stopAnimation();
  setCursorDay(state.cursorDay + series.dtInternalDay * 10);
}

function stepBackward() {
  if (!series) return;
  stopAnimation();
  setCursorDay(state.cursorDay - series.dtInternalDay * 10);
}

function resetToStart() {
  stopAnimation();
  hasShownRetroAnnotation = false;
  setCursorDay(0);
}

function dismissRetroAnnotation() {
  retroAnnotation.hidden = true;
}

// ── Readouts ─────────────────────────────────────────────────

function renderReadouts() {
  if (!series) return;

  const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);

  readoutDay.textContent = formatNumber(ds.cursorDay, 1);
  readoutLambda.textContent = formatNumber(ds.lambdaDeg, 1);
  readoutSlope.textContent = formatNumber(ds.dLambdaDt, 3);
  readoutState.textContent = ds.stateLabel;
  readoutGeometryHint.textContent = ds.geometryHint || "\u2014";
  readoutRetroDuration.textContent = ds.retroDuration;

  // State badge
  stateBadge.classList.remove("retro__state-badge--retrograde", "retro__state-badge--stationary");
  if (ds.stateLabel === "Retrograde") {
    stateBadge.textContent = "Retrograde";
    stateBadge.classList.add("retro__state-badge--retrograde");
  } else if (ds.stateLabel === "Stationary") {
    stateBadge.textContent = "Stationary";
    stateBadge.classList.add("retro__state-badge--stationary");
  } else {
    stateBadge.textContent = "Direct";
  }

  // First-retrograde annotation
  if (ds.stateLabel === "Retrograde" && !hasShownRetroAnnotation && state.playing) {
    hasShownRetroAnnotation = true;
    retroAnnotation.hidden = false;
  }
}

// ── Plot rendering ───────────────────────────────────────────

function buildPlotLayers() {
  if (!series) return;
  clear(plotSvgEl);

  const staticLayer = createLayerGroup("static");
  const dynamicLayer = createLayerGroup("dynamic");
  plotSvgEl.appendChild(staticLayer);
  plotSvgEl.appendChild(dynamicLayer);

  const W = PLOT_W;
  const H = PLOT_H;
  const margin = PLOT_MARGIN;
  const mainTop = margin.top;
  const mainH = H - margin.top - margin.bottom;
  const mainBottom = mainTop + mainH;
  const x0 = PLOT_X0;
  const x1 = PLOT_X1;
  const t0 = series.windowStartDay;
  const t1 = series.windowEndDay;
  const xScale = (t: number) => plotXFromDay(t, t0, t1, x0, x1);

  const stride = Math.max(1, Math.round(state.plotStepDay / series.dtInternalDay));
  const unwrapped = series.lambdaUnwrappedDeg;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < unwrapped.length; i += stride) {
    const y = unwrapped[i];
    if (!Number.isFinite(y)) continue;
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = 0;
    yMax = 1;
  }
  const pad = 0.05 * (yMax - yMin);
  yMin -= pad;
  yMax += pad;

  const yScale = (y: number) => plotYFromDeg(y, yMin, yMax, mainTop, mainBottom);

  const defs = svgEl("defs");
  const pattern = svgEl("pattern");
  pattern.setAttribute("id", "retroHatch");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", "10");
  pattern.setAttribute("height", "10");
  pattern.setAttribute("patternTransform", "rotate(45)");
  const hatchRect = svgEl("rect");
  hatchRect.setAttribute("width", "10");
  hatchRect.setAttribute("height", "10");
  hatchRect.setAttribute("fill", "transparent");
  const hatchLine = svgEl("line");
  hatchLine.setAttribute("x1", "0");
  hatchLine.setAttribute("y1", "0");
  hatchLine.setAttribute("x2", "0");
  hatchLine.setAttribute("y2", "10");
  hatchLine.setAttribute("stroke", "var(--cp-pink)");
  hatchLine.setAttribute("stroke-opacity", "0.35");
  hatchLine.setAttribute("stroke-width", "4");
  pattern.appendChild(hatchRect);
  pattern.appendChild(hatchLine);
  defs.appendChild(pattern);
  plotSvgEl.insertBefore(defs, staticLayer);

  const yRange = yMax - yMin;
  const yStep = yRange > 200 ? 60 : yRange > 100 ? 30 : yRange > 40 ? 10 : 5;
  const yGridStart = Math.ceil(yMin / yStep) * yStep;
  for (let v = yGridStart; v <= yMax; v += yStep) {
    const py = yScale(v);
    const gl = svgEl("line");
    gl.setAttribute("x1", String(x0));
    gl.setAttribute("x2", String(x1));
    gl.setAttribute("y1", String(py));
    gl.setAttribute("y2", String(py));
    gl.setAttribute("stroke", "var(--cp-faint)");
    gl.setAttribute("stroke-opacity", "0.15");
    gl.setAttribute("stroke-dasharray", "4 4");
    staticLayer.appendChild(gl);

    const label = svgEl("text");
    label.textContent = String(Math.round(v));
    label.setAttribute("x", String(x0 - 8));
    label.setAttribute("y", String(py + 4));
    label.setAttribute("fill", "var(--cp-muted)");
    label.setAttribute("font-size", "11");
    label.setAttribute("text-anchor", "end");
    staticLayer.appendChild(label);
  }

  const tRange = t1 - t0;
  const tStep = tRange > 600 ? 100 : tRange > 300 ? 50 : 30;
  const tGridStart = Math.ceil(t0 / tStep) * tStep;
  for (let v = tGridStart; v <= t1; v += tStep) {
    const px = xScale(v);
    const gl = svgEl("line");
    gl.setAttribute("x1", String(px));
    gl.setAttribute("x2", String(px));
    gl.setAttribute("y1", String(mainTop));
    gl.setAttribute("y2", String(mainBottom));
    gl.setAttribute("stroke", "var(--cp-faint)");
    gl.setAttribute("stroke-opacity", "0.15");
    gl.setAttribute("stroke-dasharray", "4 4");
    staticLayer.appendChild(gl);

    const label = svgEl("text");
    label.textContent = String(Math.round(v));
    label.setAttribute("x", String(px));
    label.setAttribute("y", String(mainBottom + 16));
    label.setAttribute("fill", "var(--cp-muted)");
    label.setAttribute("font-size", "11");
    label.setAttribute("text-anchor", "middle");
    staticLayer.appendChild(label);
  }

  const xAxisLabel = svgEl("text");
  xAxisLabel.textContent = "Model Day t";
  xAxisLabel.setAttribute("x", String((x0 + x1) / 2));
  xAxisLabel.setAttribute("y", String(H - 8));
  xAxisLabel.setAttribute("fill", "var(--cp-text2)");
  xAxisLabel.setAttribute("font-size", "13");
  xAxisLabel.setAttribute("text-anchor", "middle");
  staticLayer.appendChild(xAxisLabel);

  const yAxisLabel = svgEl("text");
  yAxisLabel.textContent = "Unwrapped longitude (deg)";
  yAxisLabel.setAttribute("x", String(14));
  yAxisLabel.setAttribute("y", String((mainTop + mainBottom) / 2));
  yAxisLabel.setAttribute("fill", "var(--cp-text2)");
  yAxisLabel.setAttribute("font-size", "13");
  yAxisLabel.setAttribute("text-anchor", "middle");
  yAxisLabel.setAttribute("transform", `rotate(-90 14 ${(mainTop + mainBottom) / 2})`);
  staticLayer.appendChild(yAxisLabel);

  for (const interval of series.retrogradeIntervals) {
    const bx = xScale(interval.startDay);
    const bw = xScale(interval.endDay) - bx;

    const base = svgEl("rect");
    base.setAttribute("x", String(bx));
    base.setAttribute("y", String(mainTop));
    base.setAttribute("width", String(bw));
    base.setAttribute("height", String(mainH));
    base.setAttribute("fill", "var(--cp-pink)");
    base.setAttribute("fill-opacity", "0.10");
    staticLayer.appendChild(base);

    const band = svgEl("rect");
    band.setAttribute("x", String(bx));
    band.setAttribute("y", String(mainTop));
    band.setAttribute("width", String(bw));
    band.setAttribute("height", String(mainH));
    band.setAttribute("fill", "url(#retroHatch)");
    band.setAttribute("opacity", "0.95");
    staticLayer.appendChild(band);

    const bandLabel = svgEl("text");
    bandLabel.textContent = "retrograde";
    bandLabel.setAttribute("x", String(bx + bw / 2));
    bandLabel.setAttribute("y", String(mainTop + 16));
    bandLabel.setAttribute("fill", "var(--cp-muted)");
    bandLabel.setAttribute("font-size", "11");
    bandLabel.setAttribute("text-anchor", "middle");
    bandLabel.setAttribute("opacity", "0.6");
    staticLayer.appendChild(bandLabel);
  }

  let d = "";
  let moved = false;
  for (let i = 0; i < series.timesDay.length; i += stride) {
    const t = series.timesDay[i];
    const y = unwrapped[i];
    if (!Number.isFinite(t) || !Number.isFinite(y)) continue;
    const px = xScale(t);
    const py = yScale(y);
    d += `${moved ? "L" : "M"}${px.toFixed(2)},${py.toFixed(2)} `;
    moved = true;
  }
  const mainPath = svgEl("path");
  mainPath.setAttribute("d", d.trim());
  mainPath.setAttribute("fill", "none");
  mainPath.setAttribute("stroke", "var(--cp-accent)");
  mainPath.setAttribute("stroke-width", "2.5");
  mainPath.setAttribute("stroke-linecap", "round");
  mainPath.setAttribute("stroke-linejoin", "round");
  staticLayer.appendChild(mainPath);

  for (const tStat of series.stationaryDays) {
    const px = xScale(tStat);
    const idx = seriesIndexAtDay(tStat, series.windowStartDay, series.dtInternalDay);
    const yi = clamp(idx, 0, unwrapped.length - 1);
    const py = yScale(unwrapped[yi]);

    const marker = svgEl("circle");
    marker.setAttribute("cx", String(px));
    marker.setAttribute("cy", String(py));
    marker.setAttribute("r", "5");
    marker.setAttribute("fill", "var(--cp-accent-ice)");
    marker.setAttribute("stroke", "var(--cp-bg0)");
    marker.setAttribute("stroke-width", "2");
    marker.setAttribute("aria-label", `stationary at t=${formatNumber(tStat, 1)} day`);
    staticLayer.appendChild(marker);
  }

  const axisPath = svgEl("path");
  axisPath.setAttribute("d", `M${x0},${mainTop}V${mainBottom}H${x1}`);
  axisPath.setAttribute("fill", "none");
  axisPath.setAttribute("stroke", "var(--cp-border)");
  axisPath.setAttribute("stroke-width", "1");
  staticLayer.appendChild(axisPath);

  plotRenderContext = {
    staticLayer,
    dynamicLayer,
    t0,
    t1,
    x0,
    x1,
    mainTop,
    mainBottom,
    unwrapped,
    yMin,
    yMax,
  };
}

function renderPlotDynamic() {
  if (!series || !plotRenderContext) return;
  const ctx = plotRenderContext;
  clear(ctx.dynamicLayer);

  const xCur = plotXFromDay(state.cursorDay, ctx.t0, ctx.t1, ctx.x0, ctx.x1);
  const cursorLine = svgEl("line");
  cursorLine.setAttribute("x1", String(xCur));
  cursorLine.setAttribute("x2", String(xCur));
  cursorLine.setAttribute("y1", String(ctx.mainTop));
  cursorLine.setAttribute("y2", String(ctx.mainBottom));
  cursorLine.setAttribute("stroke", "var(--cp-accent-ice)");
  cursorLine.setAttribute("stroke-opacity", "0.7");
  cursorLine.setAttribute("stroke-width", "2");
  ctx.dynamicLayer.appendChild(cursorLine);

  const curIdx = seriesIndexAtDay(state.cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeCurIdx = clamp(curIdx, 0, ctx.unwrapped.length - 1);
  const curY = ctx.unwrapped[safeCurIdx];
  if (Number.isFinite(curY)) {
    const dot = svgEl("circle");
    dot.setAttribute("cx", String(xCur));
    dot.setAttribute(
      "cy",
      String(plotYFromDeg(curY, ctx.yMin, ctx.yMax, ctx.mainTop, ctx.mainBottom)),
    );
    dot.setAttribute("r", "5");
    dot.setAttribute("fill", "var(--cp-accent-ice)");
    ctx.dynamicLayer.appendChild(dot);
  }
}

// ── Orbit view ───────────────────────────────────────────────

function orbitToPx(context: OrbitRenderContext, xAu: number, yAu: number) {
  return {
    x: context.centerX + xAu * context.scale,
    y: context.centerY - yAu * context.scale,
  };
}

function buildOrbitLayers() {
  if (!series) return;
  clear(orbitSvgEl);

  const staticLayer = createLayerGroup("static");
  const dynamicLayer = createLayerGroup("dynamic");
  orbitSvgEl.appendChild(staticLayer);
  orbitSvgEl.appendChild(dynamicLayer);

  const W = 420;
  const H = 420;
  const padOrbit = 22;
  const keys: PlanetKey[] = state.showOtherPlanets
    ? ["Venus", "Earth", "Mars", "Jupiter", "Saturn"]
    : [state.observer, state.target];

  let extent = 0;
  for (const key of keys) {
    const el = RetrogradeMotionModel.planetElements(key);
    extent = Math.max(extent, el.aAu * (1 + el.e));
  }
  extent *= 1.12;

  const context: OrbitRenderContext = {
    staticLayer,
    dynamicLayer,
    centerX: W / 2,
    centerY: H / 2,
    scale: (Math.min(W, H) / 2 - padOrbit) / extent,
  };
  orbitRenderContext = context;

  if (state.showZodiac) {
    const zodiacRadius = Math.min(W, H) / 2 - 6;
    const labels = zodiacLabelPositions(zodiacRadius, context.centerX, context.centerY);
    for (const z of labels) {
      const label = svgEl("text");
      label.textContent = z.label;
      label.setAttribute("x", String(z.x));
      label.setAttribute("y", String(z.y));
      label.setAttribute("fill", "var(--cp-muted)");
      label.setAttribute("font-size", "10");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("opacity", "0.35");
      staticLayer.appendChild(label);
    }
  }

  const sun = svgEl("circle");
  sun.setAttribute("cx", String(context.centerX));
  sun.setAttribute("cy", String(context.centerY));
  sun.setAttribute("r", "7");
  sun.setAttribute("fill", "var(--cp-celestial-sun-core)");
  sun.setAttribute("filter", "drop-shadow(var(--cp-glow-sun))");
  staticLayer.appendChild(sun);

  for (const key of keys) {
    const el = RetrogradeMotionModel.planetElements(key);
    const pts = orbitEllipsePoints(el.aAu, el.e, el.varpiDeg, 240);
    const pxPts = pts.map((pt) => orbitToPx(context, pt.x, pt.y));
    const pathD = buildOrbitPath(pxPts);
    const isActive = key === state.observer || key === state.target;

    const orbitPath = svgEl("path");
    orbitPath.setAttribute("d", pathD);
    orbitPath.setAttribute("fill", "none");
    orbitPath.setAttribute("stroke", "var(--cp-celestial-orbit)");
    orbitPath.setAttribute("stroke-opacity", isActive ? "0.9" : "0.3");
    orbitPath.setAttribute("stroke-width", isActive ? "2" : "1.5");
    staticLayer.appendChild(orbitPath);
  }
}

function renderOrbitDynamic() {
  if (!series || !orbitRenderContext) return;
  const ctx = orbitRenderContext;
  clear(ctx.dynamicLayer);

  const colorCache: Record<string, string> = {};
  const cachedColor = (key: string) => (colorCache[key] ??= resolvePlanetColor(key));

  const observerState = RetrogradeMotionModel.orbitStateAtModelDay({
    elements: RetrogradeMotionModel.planetElements(state.observer),
    tDay: state.cursorDay,
    t0Day: series.t0Day,
  });
  const targetState = RetrogradeMotionModel.orbitStateAtModelDay({
    elements: RetrogradeMotionModel.planetElements(state.target),
    tDay: state.cursorDay,
    t0Day: series.t0Day,
  });

  const observerPx = orbitToPx(ctx, observerState.xAu, observerState.yAu);
  const targetPx = orbitToPx(ctx, targetState.xAu, targetState.yAu);

  const trailLength = 60;
  const curIdx = seriesIndexAtDay(state.cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeIdx = clamp(curIdx, 0, series.timesDay.length - 1);
  const trailStartIdx = Math.max(0, safeIdx - trailLength);
  const trailCount = safeIdx - trailStartIdx;
  if (trailCount > 1) {
    const targetElements = RetrogradeMotionModel.planetElements(state.target);
    for (let i = trailStartIdx; i <= safeIdx; i++) {
      const tDay = series.timesDay[i];
      const trailState = RetrogradeMotionModel.orbitStateAtModelDay({
        elements: targetElements,
        tDay,
        t0Day: series.t0Day,
      });
      const frac = (i - trailStartIdx) / trailCount;
      const opacity = 0.05 + frac * 0.7;
      if (i > trailStartIdx) {
        const prevDay = series.timesDay[i - 1];
        const prevTrailState = RetrogradeMotionModel.orbitStateAtModelDay({
          elements: targetElements,
          tDay: prevDay,
          t0Day: series.t0Day,
        });
        const p1 = orbitToPx(ctx, prevTrailState.xAu, prevTrailState.yAu);
        const p2 = orbitToPx(ctx, trailState.xAu, trailState.yAu);
        const seg = svgEl("line");
        seg.setAttribute("x1", String(p1.x));
        seg.setAttribute("y1", String(p1.y));
        seg.setAttribute("x2", String(p2.x));
        seg.setAttribute("y2", String(p2.y));
        seg.setAttribute("stroke", cachedColor(state.target));
        seg.setAttribute("stroke-opacity", String(opacity));
        seg.setAttribute("stroke-width", String(1 + opacity * 2));
        seg.setAttribute("stroke-linecap", "round");
        ctx.dynamicLayer.appendChild(seg);
      }
    }
  }

  const dx = targetPx.x - observerPx.x;
  const dy = targetPx.y - observerPx.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0.01) {
    const extendFactor = 420 / dist;
    const los = svgEl("line");
    los.setAttribute("x1", String(observerPx.x));
    los.setAttribute("y1", String(observerPx.y));
    los.setAttribute("x2", String(observerPx.x + dx * extendFactor));
    los.setAttribute("y2", String(observerPx.y + dy * extendFactor));
    los.setAttribute("stroke", "var(--cp-accent-amber)");
    los.setAttribute("stroke-width", "1.5");
    los.setAttribute("stroke-opacity", "0.4");
    los.setAttribute("stroke-dasharray", "6 4");
    ctx.dynamicLayer.appendChild(los);
  }

  const observerDot = svgEl("circle");
  observerDot.setAttribute("cx", String(observerPx.x));
  observerDot.setAttribute("cy", String(observerPx.y));
  observerDot.setAttribute("r", "6");
  observerDot.setAttribute("fill", cachedColor(state.observer));
  observerDot.setAttribute("filter", "drop-shadow(var(--cp-glow-planet))");
  ctx.dynamicLayer.appendChild(observerDot);

  const targetDot = svgEl("circle");
  targetDot.setAttribute("cx", String(targetPx.x));
  targetDot.setAttribute("cy", String(targetPx.y));
  targetDot.setAttribute("r", "6");
  targetDot.setAttribute("fill", cachedColor(state.target));
  targetDot.setAttribute("filter", "drop-shadow(var(--cp-glow-planet))");
  ctx.dynamicLayer.appendChild(targetDot);

  const observerLabel = svgEl("text");
  observerLabel.textContent = state.observer;
  observerLabel.setAttribute("x", String(observerPx.x));
  observerLabel.setAttribute("y", String(observerPx.y - 10));
  observerLabel.setAttribute("fill", "var(--cp-text2)");
  observerLabel.setAttribute("font-size", "10");
  observerLabel.setAttribute("text-anchor", "middle");
  ctx.dynamicLayer.appendChild(observerLabel);

  const targetLabel = svgEl("text");
  targetLabel.textContent = state.target;
  targetLabel.setAttribute("x", String(targetPx.x));
  targetLabel.setAttribute("y", String(targetPx.y - 10));
  targetLabel.setAttribute("fill", "var(--cp-text2)");
  targetLabel.setAttribute("font-size", "10");
  targetLabel.setAttribute("text-anchor", "middle");
  ctx.dynamicLayer.appendChild(targetLabel);
}

// ── Sky-view strip ───────────────────────────────────────────

function buildSkyLayers() {
  if (!series) return;
  clear(skySvgEl);

  const staticLayer = createLayerGroup("static");
  const dynamicLayer = createLayerGroup("dynamic");
  skySvgEl.appendChild(staticLayer);
  skySvgEl.appendChild(dynamicLayer);

  const context: SkyRenderContext = {
    staticLayer,
    dynamicLayer,
    width: 400,
    height: 60,
  };
  skyRenderContext = context;

  const bg = svgEl("rect");
  bg.setAttribute("width", String(context.width));
  bg.setAttribute("height", String(context.height));
  bg.setAttribute("fill", "var(--cp-bg0)");
  bg.setAttribute("rx", "4");
  staticLayer.appendChild(bg);

  const starSeeds = [20, 55, 88, 120, 158, 195, 230, 265, 300, 340, 370];
  for (const sx of starSeeds) {
    const star = svgEl("circle");
    star.setAttribute("cx", String(sx));
    star.setAttribute("cy", String(12 + (sx * 37) % 30));
    star.setAttribute("r", "1");
    star.setAttribute("fill", "var(--cp-celestial-star)");
    star.setAttribute("opacity", "0.3");
    staticLayer.appendChild(star);
  }
}

function renderSkyDynamic() {
  if (!series || !skyRenderContext) return;
  const ctx = skyRenderContext;
  clear(ctx.dynamicLayer);

  const curIdx = seriesIndexAtDay(state.cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeIdx = clamp(curIdx, 0, series.lambdaWrappedDeg.length - 1);
  const lambdaDeg = series.lambdaWrappedDeg[safeIdx];
  if (!Number.isFinite(lambdaDeg)) return;

  const px = projectToSkyView(wrap360(lambdaDeg), ctx.width);

  const glow = svgEl("circle");
  glow.setAttribute("cx", String(px));
  glow.setAttribute("cy", String(ctx.height / 2));
  glow.setAttribute("r", "8");
  glow.setAttribute("fill", resolvePlanetColor(state.target));
  glow.setAttribute("opacity", "0.15");
  ctx.dynamicLayer.appendChild(glow);

  const dot = svgEl("circle");
  dot.setAttribute("cx", String(px));
  dot.setAttribute("cy", String(ctx.height / 2));
  dot.setAttribute("r", "4");
  dot.setAttribute("fill", resolvePlanetColor(state.target));
  dot.setAttribute("filter", "drop-shadow(var(--cp-glow-planet))");
  ctx.dynamicLayer.appendChild(dot);

  const label = svgEl("text");
  label.textContent = `${formatNumber(wrap360(lambdaDeg), 0)} deg`;
  label.setAttribute("x", String(px));
  label.setAttribute("y", String(ctx.height / 2 + 16));
  label.setAttribute("fill", "var(--cp-text2)");
  label.setAttribute("font-size", "10");
  label.setAttribute("text-anchor", "middle");
  ctx.dynamicLayer.appendChild(label);
}

// ── Render all ───────────────────────────────────────────────

function render() {
  renderReadouts();
  renderPlotDynamic();
  renderOrbitDynamic();
  renderSkyDynamic();
}

// ── Export ────────────────────────────────────────────────────

function exportResults(): ExportPayloadV1 {
  if (!series) {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      parameters: [],
      readouts: [],
      notes: ["No results yet."],
    };
  }

  const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);

  const nearest = ds.retroInterval;
  const retroBounds =
    nearest == null
      ? "\u2014"
      : `${formatNumber(nearest.startDay, 1)} to ${formatNumber(nearest.endDay, 1)}`;

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Observer", value: String(state.observer) },
      { name: "Target", value: String(state.target) },
      { name: "Window start day (day)", value: formatNumber(series.windowStartDay, 1) },
      { name: "Window end day (day)", value: formatNumber(series.windowEndDay, 1) },
      { name: "Plot step (day)", value: formatNumber(state.plotStepDay, 2) },
      { name: "Internal step (day)", value: formatNumber(series.dtInternalDay, 2) },
      { name: "Model type", value: "Keplerian 2D (coplanar)" },
    ],
    readouts: [
      { name: "Current day (day)", value: formatNumber(ds.cursorDay, 1) },
      { name: "Apparent longitude (deg)", value: formatNumber(ds.lambdaDeg, 1) },
      { name: "d(lambda)/dt (deg/day)", value: formatNumber(ds.dLambdaDt, 3) },
      { name: "State", value: ds.stateLabel },
      {
        name: "Previous stationary day (day)",
        value: Number.isNaN(ds.prevStationary) ? "\u2014" : formatNumber(ds.prevStationary, 1),
      },
      {
        name: "Next stationary day (day)",
        value: Number.isNaN(ds.nextStationary) ? "\u2014" : formatNumber(ds.nextStationary, 1),
      },
      { name: "Nearest retrograde bounds (day)", value: retroBounds },
      { name: "Nearest retrograde duration (day)", value: ds.retroDuration },
    ],
    notes: [
      "Retrograde is apparent: the planet never reverses orbit. The sign flip comes from relative motion and viewing geometry.",
      "Model time uses model day only (no calendar-date claims).",
      "Orbits are coplanar Keplerian ellipses around the Sun with a fixed inertial +x axis as 0 deg.",
    ],
  };
}

// ── Pointer interaction on plot ──────────────────────────────

function handlePointerToDay(clientX: number) {
  if (!series) return;
  const rect = plotSvgEl.getBoundingClientRect();
  const xFrac = clamp((clientX - rect.left) / rect.width, 0, 1);
  const svgX = xFrac * PLOT_W;
  const t = dayFromPlotX(svgX, series.windowStartDay, series.windowEndDay, PLOT_X0, PLOT_X1);
  setCursorDay(t);
}

let isDragging = false;

plotSvgEl.addEventListener("pointerdown", (e) => {
  stopAnimation();
  isDragging = true;
  plotSvgEl.setPointerCapture?.(e.pointerId);
  handlePointerToDay(e.clientX);
});
plotSvgEl.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  handlePointerToDay(e.clientX);
});
plotSvgEl.addEventListener("pointerup", () => { isDragging = false; });
plotSvgEl.addEventListener("pointercancel", () => { isDragging = false; });

// ── Event handlers ───────────────────────────────────────────

preset.addEventListener("change", () => {
  const config = presetToConfig(preset.value);
  if (!config) return;
  stopAnimation();
  applyObserverTargetPair(config.observer as PlanetKey, config.target as PlanetKey);
  state.cursorDay = 0;
  recomputeSeries();
});

observer.addEventListener("change", () => {
  stopAnimation();
  applyObserverTargetPair(observer.value as PlanetKey, target.value as PlanetKey, true);
  state.cursorDay = 0;
  recomputeSeries();
});

target.addEventListener("change", () => {
  stopAnimation();
  applyObserverTargetPair(observer.value as PlanetKey, target.value as PlanetKey, true);
  state.cursorDay = 0;
  recomputeSeries();
});

windowMonths.addEventListener("input", () => {
  state.windowMonths = Number(windowMonths.value);
  windowMonthsValue.textContent = String(state.windowMonths);
  recomputeSeries();
});

plotStepDay.addEventListener("change", () => {
  state.plotStepDay = Number(plotStepDay.value);
  buildPlotLayers();
  render();
});

showOtherPlanets.addEventListener("change", () => {
  state.showOtherPlanets = Boolean(showOtherPlanets.checked);
  buildOrbitLayers();
  render();
});

showZodiac.addEventListener("change", () => {
  state.showZodiac = Boolean(showZodiac.checked);
  buildOrbitLayers();
  render();
});

// Playbar controls
playBtn.addEventListener("click", startAnimation);
pauseBtn.addEventListener("click", stopAnimation);
stepBackBtn.addEventListener("click", stepBackward);
stepForwardBtn.addEventListener("click", stepForward);
resetBtn.addEventListener("click", resetToStart);
speedSelect.addEventListener("change", () => {
  state.speed = Number(speedSelect.value) || 5;
});

scrubSlider.addEventListener("input", () => {
  stopAnimation();
  setCursorDay(Number(scrubSlider.value));
});

// Nav buttons
prevStationaryBtn.addEventListener("click", () => {
  if (!series) return;
  stopAnimation();
  const { prev } = findPrevNextStationary(series.stationaryDays, state.cursorDay);
  if (!Number.isNaN(prev)) setCursorDay(prev);
});

nextStationaryBtn.addEventListener("click", () => {
  if (!series) return;
  stopAnimation();
  const { next } = findPrevNextStationary(series.stationaryDays, state.cursorDay);
  if (!Number.isNaN(next)) setCursorDay(next);
});

centerRetrogradeBtn.addEventListener("click", () => {
  if (!series) return;
  stopAnimation();
  const nearest = nearestRetrogradeInterval(series.retrogradeIntervals, state.cursorDay);
  if (!nearest) return;
  setCursorDay(0.5 * (nearest.startDay + nearest.endDay));
});

// Keyboard on plot
plotFocus.addEventListener("keydown", (e) => {
  if (!series) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    stopAnimation();
    setCursorDay(state.cursorDay - (e.shiftKey ? series.dtInternalDay : 1));
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    stopAnimation();
    setCursorDay(state.cursorDay + (e.shiftKey ? series.dtInternalDay : 1));
  } else if (e.key === " ") {
    e.preventDefault();
    if (state.playing) stopAnimation();
    else startAnimation();
  }
});

// Copy results
copyResults.addEventListener("click", () => {
  setLiveRegionText(statusEl, "Copying\u2026");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(statusEl, "Copied results to clipboard."))
    .catch((err) => {
      const message = err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.";
      setLiveRegionText(statusEl, message);
    });
});

// Annotation dismiss
retroAnnotationClose.addEventListener("click", () => {
  dismissRetroAnnotation();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || retroAnnotation.hidden) return;
  dismissRetroAnnotation();
  e.preventDefault();
});

// ── Challenges ───────────────────────────────────────────────

function setupChallenges() {
  const comparisonDurations: Partial<Record<"Mars" | "Venus", number>> = {};

  const challenges = [
    {
      prompt: "Find Mars during a retrograde interval. What happens to its apparent longitude?",
      hints: [
        "Use the play button or scrub slider to advance time.",
        "Watch the pink-shaded bands in the longitude plot.",
      ],
      initialState: { preset: "earth-mars", cursorDay: 0 },
      check(s: any) {
        const curDay = Number(s?.cursorDay);
        if (!series || !Number.isFinite(curDay))
          return { correct: false, close: false, message: "Advance time to begin." };
        const idx = seriesIndexAtDay(curDay, series.windowStartDay, series.dtInternalDay);
        const safeI = clamp(idx, 0, series.dLambdaDtDegPerDay.length - 1);
        const slope = series.dLambdaDtDegPerDay[safeI];
        if (slope < 0)
          return { correct: true, close: false, message: "You found retrograde! The longitude is decreasing." };
        return { correct: false, close: false, message: "Not in retrograde yet. Keep advancing." };
      },
    },
    {
      prompt: "Compare Mars and Venus retrograde durations. Which is shorter?",
      hints: [
        "Measure and remember a duration for Mars and a duration for Venus.",
        "Use the Retrograde readout while each target is selected.",
      ],
      initialState: { preset: "earth-mars", cursorDay: 0 },
      check(s: any) {
        if (!series)
          return { correct: false, close: false, message: "Load a valid target pair first." };

        if (isRetrogradeDurationComparisonComplete(comparisonDurations)) {
          const marsDays = comparisonDurations.Mars!;
          const venusDays = comparisonDurations.Venus!;
          const shorter = venusDays < marsDays ? "Venus" : "Mars";
          return {
            correct: true,
            close: false,
            message:
              `${shorter} is shorter (Mars ${formatNumber(marsDays, 1)} d, ` +
              `Venus ${formatNumber(venusDays, 1)} d).`,
          };
        }

        const targetKey =
          String(s?.target ?? "") === "Mars" || String(s?.target ?? "") === "Venus"
            ? (String(s?.target) as "Mars" | "Venus")
            : null;
        const cursorDay = Number(s?.cursorDay);
        const safeCursorDay = Number.isFinite(cursorDay) ? cursorDay : state.cursorDay;

        if (!targetKey) {
          return { correct: false, close: false, message: "Use Mars and Venus as targets to compare." };
        }

        const retroDuration = retrogradeDurationIfActiveAtCursor(
          series.retrogradeIntervals,
          safeCursorDay,
        );
        if (retroDuration == null || !Number.isFinite(retroDuration)) {
          return {
            correct: false,
            close: false,
            message: `Move into a shaded retrograde interval for ${targetKey} before recording duration.`,
          };
        }
        comparisonDurations[targetKey] = retroDuration;

        if (isRetrogradeDurationComparisonComplete(comparisonDurations)) {
          const marsDays = comparisonDurations.Mars!;
          const venusDays = comparisonDurations.Venus!;
          const shorter = venusDays < marsDays ? "Venus" : "Mars";
          return {
            correct: true,
            close: false,
            message:
              `${shorter} is shorter (Mars ${formatNumber(marsDays, 1)} d, ` +
              `Venus ${formatNumber(venusDays, 1)} d).`,
          };
        }

        if (targetKey === "Mars") {
          return {
            correct: false,
            close: true,
            message: "Mars captured. Switch target to Venus and record its duration.",
          };
        }
        if (targetKey === "Venus") {
          return {
            correct: false,
            close: true,
            message: "Venus captured. Switch target to Mars and record its duration.",
          };
        }
        return { correct: false, close: false, message: "Use Mars and Venus as targets to compare." };
      },
    },
    {
      prompt: "Find a stationary point where the planet pauses before reversing.",
      hints: [
        "Use the navigation buttons below the scrub bar.",
        "Watch for the ice-blue dots on the longitude curve.",
      ],
      initialState: { preset: "earth-mars", cursorDay: 0 },
      check(s: any) {
        const curDay = Number(s?.cursorDay);
        if (!series || !Number.isFinite(curDay))
          return { correct: false, close: false, message: "Advance time to begin." };
        const idx = seriesIndexAtDay(curDay, series.windowStartDay, series.dtInternalDay);
        const safeI = clamp(idx, 0, series.dLambdaDtDegPerDay.length - 1);
        const slope = Math.abs(series.dLambdaDtDegPerDay[safeI]);
        if (slope < 0.02)
          return { correct: true, close: false, message: "Found it! The planet appears momentarily stationary." };
        if (slope < 0.05)
          return { correct: false, close: true, message: "Very close to stationary. Fine-tune your position." };
        return { correct: false, close: false, message: "Not at a stationary point yet." };
      },
    },
  ];

  const engine = new ChallengeEngine(challenges, {
    container: challengeContainer,
    showUI: true,
    getState: () => ({
      cursorDay: state.cursorDay,
      observer: state.observer,
      target: state.target,
      preset: preset.value,
    }),
    setState: (next: any) => {
      if (typeof next !== "object" || next === null) return;
      if ("preset" in next) {
        preset.value = String(next.preset);
        const config = presetToConfig(String(next.preset));
        if (config) {
          applyObserverTargetPair(
            config.observer as PlanetKey,
            config.target as PlanetKey,
          );
        }
      }
      if ("cursorDay" in next && Number.isFinite(Number(next.cursorDay))) {
        state.cursorDay = Number(next.cursorDay);
      }
      recomputeSeries();
    },
  });

  challengeBtn.addEventListener("click", () => {
    if (engine.isActive()) {
      engine.stop();
      challengeBtn.classList.remove("active");
    } else {
      delete comparisonDurations.Mars;
      delete comparisonDurations.Venus;
      engine.start();
      challengeBtn.classList.add("active");
    }
  });
}

// ── Station mode & help ──────────────────────────────────────

function setupModes() {
  const demoModes = createDemoModes({
    help: {
      title: "Help / Keys",
      subtitle: "Shortcuts work when the plot has focus.",
      sections: [
        {
          heading: "Global",
          type: "shortcuts",
          items: [
            { key: "?", action: "Toggle help" },
            { key: "g", action: "Toggle station mode" },
          ],
        },
        {
          heading: "Plot (when focused)",
          type: "shortcuts",
          items: [
            { key: "Left / Right", action: "Step cursor by 1 day" },
            { key: "Shift + arrow", action: "Step by internal dt" },
            { key: "Space", action: "Play / pause animation" },
          ],
        },
        {
          heading: "Model",
          type: "bullets",
          items: [
            "Planets follow coplanar Keplerian ellipses with JPL Table 1 elements.",
            "Apparent longitude $\\lambda_{\\mathrm{app}}(t) = \\operatorname{atan2}(y_t - y_o,\\, x_t - x_o)$.",
            "Retrograde defined by $d\\tilde{\\lambda}/dt < 0$.",
          ],
        },
      ],
    },
    station: {
      title: "Station Mode: Retrograde Motion",
      subtitle: "Collect evidence that retrograde is a viewing-geometry effect.",
      steps: [
        "Run the Earth -> Mars preset and find the first retrograde interval.",
        "Use sidebar transport controls; use the timeline row near the stage for scrub and stationary jumps.",
        "Record model day t at the start, end, and midpoint of retrograde.",
        "Switch to Earth -> Venus and compare the retrograde duration.",
        "Use your data to explain why inner planets have shorter retrograde arcs.",
      ],
      columns: [
        { key: "observer", label: "Observer" },
        { key: "target", label: "Target" },
        { key: "geometry", label: "Geometry" },
        { key: "cursorDay", label: "Day t" },
        { key: "lambdaDeg", label: "Lambda (deg)" },
        { key: "state", label: "State" },
        { key: "retroDuration", label: "Retro dur (days)" },
      ],
      snapshotLabel: "Add row (current state)",
      getSnapshotRow() {
        if (!series) {
          return {
            observer: state.observer,
            target: state.target,
            geometry: "\u2014",
            cursorDay: "\u2014",
            lambdaDeg: "\u2014",
            state: "\u2014",
            retroDuration: "\u2014",
          };
        }
        const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);
        return {
          observer: state.observer,
          target: state.target,
          geometry: ds.geometryHint || "\u2014",
          cursorDay: formatNumber(ds.cursorDay, 1),
          lambdaDeg: formatNumber(ds.lambdaDeg, 1),
          state: ds.stateLabel,
          retroDuration: ds.retroDuration,
        };
      },
      synthesisPrompt: `
        <p><strong>Key idea:</strong> No planet reverses its orbit. Retrograde motion is an apparent effect caused by the difference in orbital speeds.</p>
        <p><strong>Use your table:</strong> Compare retrograde durations for different targets. Inner-planet retrogrades are shorter because the relative angular velocity at conjunction is larger.</p>
      `,
    },
    keys: { help: "?", station: "g" },
  });

  demoModes.bindButtons({ helpButton: helpBtn, stationButton: stationBtn });
}

// ── Boot ─────────────────────────────────────────────────────

setupChallenges();
setupModes();
updateAnimationButtons();
recomputeSeries();
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}
