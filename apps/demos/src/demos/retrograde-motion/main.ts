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
  nearestRetrogradeInterval,
  orbitEllipsePoints,
  plotXFromDay,
  plotYFromDeg,
  presetToConfig,
  projectToSkyView,
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

const modelCallbacks: RetroModelCallbacks = {
  planetElements: (key: string) => RetrogradeMotionModel.planetElements(key as PlanetKey),
};

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

// ── Readouts ─────────────────────────────────────────────────

function renderReadouts() {
  if (!series) return;

  const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);

  readoutDay.textContent = formatNumber(ds.cursorDay, 1);
  readoutLambda.textContent = formatNumber(ds.lambdaDeg, 1);
  readoutSlope.textContent = formatNumber(ds.dLambdaDt, 3);
  readoutState.textContent = ds.stateLabel;
  readoutRetroDuration.textContent = ds.retroDuration;

  // State badge
  stateBadge.classList.remove("retro__state-badge--retrograde", "retro__state-badge--stationary");
  if (ds.stateLabel === "Retrograde") {
    stateBadge.textContent = "\u2190 Retrograde";
    stateBadge.classList.add("retro__state-badge--retrograde");
  } else if (ds.stateLabel === "Stationary") {
    stateBadge.textContent = "\u25CF Stationary";
    stateBadge.classList.add("retro__state-badge--stationary");
  } else {
    stateBadge.textContent = "\u2192 Direct";
  }

  // First-retrograde annotation
  if (ds.stateLabel === "Retrograde" && !hasShownRetroAnnotation && state.playing) {
    hasShownRetroAnnotation = true;
    retroAnnotation.hidden = false;
  }
}

// ── Plot rendering ───────────────────────────────────────────

function renderPlot() {
  if (!series) return;
  clear(plotSvgEl);

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

  // ── Defs: hatch pattern ──
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
  plotSvgEl.appendChild(defs);

  // ── Gridlines ──
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
    plotSvgEl.appendChild(gl);

    const label = svgEl("text");
    label.textContent = String(Math.round(v));
    label.setAttribute("x", String(x0 - 8));
    label.setAttribute("y", String(py + 4));
    label.setAttribute("fill", "var(--cp-muted)");
    label.setAttribute("font-size", "11");
    label.setAttribute("text-anchor", "end");
    plotSvgEl.appendChild(label);
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
    plotSvgEl.appendChild(gl);

    const label = svgEl("text");
    label.textContent = String(Math.round(v));
    label.setAttribute("x", String(px));
    label.setAttribute("y", String(mainBottom + 16));
    label.setAttribute("fill", "var(--cp-muted)");
    label.setAttribute("font-size", "11");
    label.setAttribute("text-anchor", "middle");
    plotSvgEl.appendChild(label);
  }

  // ── Axis labels ──
  const xAxisLabel = svgEl("text");
  xAxisLabel.textContent = "Model Day t";
  xAxisLabel.setAttribute("x", String((x0 + x1) / 2));
  xAxisLabel.setAttribute("y", String(H - 8));
  xAxisLabel.setAttribute("fill", "var(--cp-text2)");
  xAxisLabel.setAttribute("font-size", "13");
  xAxisLabel.setAttribute("text-anchor", "middle");
  plotSvgEl.appendChild(xAxisLabel);

  const yAxisLabel = svgEl("text");
  yAxisLabel.textContent = "Unwrapped longitude (deg)";
  yAxisLabel.setAttribute("x", String(14));
  yAxisLabel.setAttribute("y", String((mainTop + mainBottom) / 2));
  yAxisLabel.setAttribute("fill", "var(--cp-text2)");
  yAxisLabel.setAttribute("font-size", "13");
  yAxisLabel.setAttribute("text-anchor", "middle");
  yAxisLabel.setAttribute("transform", `rotate(-90 14 ${(mainTop + mainBottom) / 2})`);
  plotSvgEl.appendChild(yAxisLabel);

  // ── Retrograde bands ──
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
    plotSvgEl.appendChild(base);

    const band = svgEl("rect");
    band.setAttribute("x", String(bx));
    band.setAttribute("y", String(mainTop));
    band.setAttribute("width", String(bw));
    band.setAttribute("height", String(mainH));
    band.setAttribute("fill", "url(#retroHatch)");
    band.setAttribute("opacity", "0.95");
    plotSvgEl.appendChild(band);

    const bandLabel = svgEl("text");
    bandLabel.textContent = "retrograde";
    bandLabel.setAttribute("x", String(bx + bw / 2));
    bandLabel.setAttribute("y", String(mainTop + 16));
    bandLabel.setAttribute("fill", "var(--cp-muted)");
    bandLabel.setAttribute("font-size", "11");
    bandLabel.setAttribute("text-anchor", "middle");
    bandLabel.setAttribute("opacity", "0.6");
    plotSvgEl.appendChild(bandLabel);
  }

  // ── Main curve ──
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
  plotSvgEl.appendChild(mainPath);

  // ── Stationary markers ──
  for (const tStat of series.stationaryDays) {
    const px = xScale(tStat);
    const idx = seriesIndexAtDay(tStat, series.windowStartDay, series.dtInternalDay);
    const yi = clamp(idx, 0, unwrapped.length - 1);
    const py = yScale(unwrapped[yi]);

    const c = svgEl("circle");
    c.setAttribute("cx", String(px));
    c.setAttribute("cy", String(py));
    c.setAttribute("r", "5");
    c.setAttribute("fill", "var(--cp-accent-ice)");
    c.setAttribute("stroke", "var(--cp-bg0)");
    c.setAttribute("stroke-width", "2");
    c.setAttribute("aria-label", `stationary at t=${formatNumber(tStat, 1)} day`);
    plotSvgEl.appendChild(c);
  }

  // ── Cursor ──
  const xCur = xScale(state.cursorDay);
  const cursorLine = svgEl("line");
  cursorLine.setAttribute("x1", String(xCur));
  cursorLine.setAttribute("x2", String(xCur));
  cursorLine.setAttribute("y1", String(mainTop));
  cursorLine.setAttribute("y2", String(mainBottom));
  cursorLine.setAttribute("stroke", "var(--cp-accent-ice)");
  cursorLine.setAttribute("stroke-opacity", "0.7");
  cursorLine.setAttribute("stroke-width", "2");
  plotSvgEl.appendChild(cursorLine);

  // Cursor dot on curve
  const curIdx = seriesIndexAtDay(state.cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeCurIdx = clamp(curIdx, 0, unwrapped.length - 1);
  const curY = unwrapped[safeCurIdx];
  if (Number.isFinite(curY)) {
    const dot = svgEl("circle");
    dot.setAttribute("cx", String(xCur));
    dot.setAttribute("cy", String(yScale(curY)));
    dot.setAttribute("r", "5");
    dot.setAttribute("fill", "var(--cp-accent-ice)");
    plotSvgEl.appendChild(dot);
  }

  // ── Axes border ──
  const axisPath = svgEl("path");
  axisPath.setAttribute("d", `M${x0},${mainTop}V${mainBottom}H${x1}`);
  axisPath.setAttribute("fill", "none");
  axisPath.setAttribute("stroke", "var(--cp-border)");
  axisPath.setAttribute("stroke-width", "1");
  plotSvgEl.appendChild(axisPath);
}

// ── Orbit view ───────────────────────────────────────────────

function renderOrbit() {
  if (!series) return;
  clear(orbitSvgEl);

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

  const scale = (Math.min(W, H) / 2 - padOrbit) / extent;
  const cx = W / 2;
  const cy = H / 2;

  const toPx = (xAu: number, yAu: number) => ({
    x: cx + xAu * scale,
    y: cy - yAu * scale,
  });

  // Cache resolved planet colors for this frame
  const colorCache: Record<string, string> = {};
  const cachedColor = (key: string) =>
    (colorCache[key] ??= resolvePlanetColor(key));

  // ── Zodiac ring ──
  if (state.showZodiac) {
    const zodiacRadius = Math.min(W, H) / 2 - 6;
    const labels = zodiacLabelPositions(zodiacRadius, cx, cy);
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
      orbitSvgEl.appendChild(label);
    }
  }

  // ── Sun ──
  const sun = svgEl("circle");
  sun.setAttribute("cx", String(cx));
  sun.setAttribute("cy", String(cy));
  sun.setAttribute("r", "7");
  sun.setAttribute("fill", "var(--cp-celestial-sun-core)");
  sun.setAttribute("filter", "drop-shadow(var(--cp-glow-sun))");
  orbitSvgEl.appendChild(sun);

  // ── Orbit ellipses ──
  for (const key of keys) {
    const el = RetrogradeMotionModel.planetElements(key);
    const pts = orbitEllipsePoints(el.aAu, el.e, el.varpiDeg, 240);
    const pxPts = pts.map((pt) => toPx(pt.x, pt.y));
    const pathD = buildOrbitPath(pxPts);
    const isActive = key === state.observer || key === state.target;

    const p = svgEl("path");
    p.setAttribute("d", pathD);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "var(--cp-celestial-orbit)");
    p.setAttribute("stroke-opacity", isActive ? "0.9" : "0.3");
    p.setAttribute("stroke-width", isActive ? "2" : "1.5");
    orbitSvgEl.appendChild(p);
  }

  // ── Planet positions ──
  const oState = RetrogradeMotionModel.orbitStateAtModelDay({
    elements: RetrogradeMotionModel.planetElements(state.observer),
    tDay: state.cursorDay,
    t0Day: series.t0Day,
  });
  const tState = RetrogradeMotionModel.orbitStateAtModelDay({
    elements: RetrogradeMotionModel.planetElements(state.target),
    tDay: state.cursorDay,
    t0Day: series.t0Day,
  });

  const oPx = toPx(oState.xAu, oState.yAu);
  const tPx = toPx(tState.xAu, tState.yAu);

  // ── Target trail ──
  const trailLen = 60;
  const curIdx = seriesIndexAtDay(state.cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeIdx = clamp(curIdx, 0, series.timesDay.length - 1);
  const trailStartIdx = Math.max(0, safeIdx - trailLen);
  const trailCount = safeIdx - trailStartIdx;
  if (trailCount > 1) {
    const targetElem = RetrogradeMotionModel.planetElements(state.target);
    for (let i = trailStartIdx; i <= safeIdx; i++) {
      const tDay = series.timesDay[i];
      const ts = RetrogradeMotionModel.orbitStateAtModelDay({
        elements: targetElem,
        tDay,
        t0Day: series.t0Day,
      });
      const frac = (i - trailStartIdx) / trailCount;
      const opacity = 0.05 + frac * 0.7;
      if (i > trailStartIdx) {
        const prevDay = series.timesDay[i - 1];
        const prevTs = RetrogradeMotionModel.orbitStateAtModelDay({
          elements: targetElem,
          tDay: prevDay,
          t0Day: series.t0Day,
        });
        const p1 = toPx(prevTs.xAu, prevTs.yAu);
        const p2 = toPx(ts.xAu, ts.yAu);
        const seg = svgEl("line");
        seg.setAttribute("x1", String(p1.x));
        seg.setAttribute("y1", String(p1.y));
        seg.setAttribute("x2", String(p2.x));
        seg.setAttribute("y2", String(p2.y));
        seg.setAttribute("stroke", cachedColor(state.target));
        seg.setAttribute("stroke-opacity", String(opacity));
        seg.setAttribute("stroke-width", String(1 + opacity * 2));
        seg.setAttribute("stroke-linecap", "round");
        orbitSvgEl.appendChild(seg);
      }
    }
  }

  // ── Line of sight ──
  const dx = tPx.x - oPx.x;
  const dy = tPx.y - oPx.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0.01) {
    const extendFactor = Math.max(W, H) / dist;
    const los = svgEl("line");
    los.setAttribute("x1", String(oPx.x));
    los.setAttribute("y1", String(oPx.y));
    los.setAttribute("x2", String(oPx.x + dx * extendFactor));
    los.setAttribute("y2", String(oPx.y + dy * extendFactor));
    los.setAttribute("stroke", "var(--cp-accent-amber)");
    los.setAttribute("stroke-width", "1.5");
    los.setAttribute("stroke-opacity", "0.4");
    los.setAttribute("stroke-dasharray", "6 4");
    orbitSvgEl.appendChild(los);
  }

  // ── Observer dot ──
  const obs = svgEl("circle");
  obs.setAttribute("cx", String(oPx.x));
  obs.setAttribute("cy", String(oPx.y));
  obs.setAttribute("r", "6");
  obs.setAttribute("fill", cachedColor(state.observer));
  obs.setAttribute("filter", "drop-shadow(var(--cp-glow-planet))");
  orbitSvgEl.appendChild(obs);

  // ── Target dot ──
  const tgt = svgEl("circle");
  tgt.setAttribute("cx", String(tPx.x));
  tgt.setAttribute("cy", String(tPx.y));
  tgt.setAttribute("r", "6");
  tgt.setAttribute("fill", cachedColor(state.target));
  tgt.setAttribute("filter", "drop-shadow(var(--cp-glow-planet))");
  orbitSvgEl.appendChild(tgt);

  // ── Labels ──
  const obsLabel = svgEl("text");
  obsLabel.textContent = state.observer;
  obsLabel.setAttribute("x", String(oPx.x));
  obsLabel.setAttribute("y", String(oPx.y - 10));
  obsLabel.setAttribute("fill", "var(--cp-text2)");
  obsLabel.setAttribute("font-size", "10");
  obsLabel.setAttribute("text-anchor", "middle");
  orbitSvgEl.appendChild(obsLabel);

  const tgtLabel = svgEl("text");
  tgtLabel.textContent = state.target;
  tgtLabel.setAttribute("x", String(tPx.x));
  tgtLabel.setAttribute("y", String(tPx.y - 10));
  tgtLabel.setAttribute("fill", "var(--cp-text2)");
  tgtLabel.setAttribute("font-size", "10");
  tgtLabel.setAttribute("text-anchor", "middle");
  orbitSvgEl.appendChild(tgtLabel);
}

// ── Sky-view strip ───────────────────────────────────────────

function renderSkyView() {
  if (!series) return;
  clear(skySvgEl);

  const W = 400;
  const H = 60;

  // Background gradient (dark sky)
  const bg = svgEl("rect");
  bg.setAttribute("width", String(W));
  bg.setAttribute("height", String(H));
  bg.setAttribute("fill", "var(--cp-bg0)");
  bg.setAttribute("rx", "4");
  skySvgEl.appendChild(bg);

  // Faint background star markers
  const starSeeds = [20, 55, 88, 120, 158, 195, 230, 265, 300, 340, 370];
  for (const sx of starSeeds) {
    const star = svgEl("circle");
    star.setAttribute("cx", String(sx));
    star.setAttribute("cy", String(12 + (sx * 37) % 30));
    star.setAttribute("r", "1");
    star.setAttribute("fill", "var(--cp-celestial-star)");
    star.setAttribute("opacity", "0.3");
    skySvgEl.appendChild(star);
  }

  // Current target position in sky
  const curIdx = seriesIndexAtDay(state.cursorDay, series.windowStartDay, series.dtInternalDay);
  const safeIdx = clamp(curIdx, 0, series.lambdaWrappedDeg.length - 1);
  const lambdaDeg = series.lambdaWrappedDeg[safeIdx];
  if (Number.isFinite(lambdaDeg)) {
    const px = projectToSkyView(wrap360(lambdaDeg), W);

    // Glow
    const glow = svgEl("circle");
    glow.setAttribute("cx", String(px));
    glow.setAttribute("cy", String(H / 2));
    glow.setAttribute("r", "8");
    glow.setAttribute("fill", resolvePlanetColor(state.target));
    glow.setAttribute("opacity", "0.15");
    skySvgEl.appendChild(glow);

    // Dot
    const dot = svgEl("circle");
    dot.setAttribute("cx", String(px));
    dot.setAttribute("cy", String(H / 2));
    dot.setAttribute("r", "4");
    dot.setAttribute("fill", resolvePlanetColor(state.target));
    dot.setAttribute("filter", "drop-shadow(var(--cp-glow-planet))");
    skySvgEl.appendChild(dot);

    // Label
    const label = svgEl("text");
    label.textContent = `${formatNumber(wrap360(lambdaDeg), 0)}\u00B0`;
    label.setAttribute("x", String(px));
    label.setAttribute("y", String(H / 2 + 16));
    label.setAttribute("fill", "var(--cp-text2)");
    label.setAttribute("font-size", "10");
    label.setAttribute("text-anchor", "middle");
    skySvgEl.appendChild(label);
  }
}

// ── Render all ───────────────────────────────────────────────

function render() {
  renderReadouts();
  renderPlot();
  renderOrbit();
  renderSkyView();
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
  state.observer = config.observer as PlanetKey;
  state.target = config.target as PlanetKey;
  observer.value = state.observer;
  target.value = state.target;
  state.cursorDay = 0;
  recomputeSeries();
});

observer.addEventListener("change", () => {
  stopAnimation();
  state.observer = observer.value as PlanetKey;
  state.cursorDay = 0;
  recomputeSeries();
});

target.addEventListener("change", () => {
  stopAnimation();
  state.target = target.value as PlanetKey;
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
  render();
});

showOtherPlanets.addEventListener("change", () => {
  state.showOtherPlanets = Boolean(showOtherPlanets.checked);
  renderOrbit();
});

showZodiac.addEventListener("change", () => {
  state.showZodiac = Boolean(showZodiac.checked);
  renderOrbit();
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
  retroAnnotation.hidden = true;
});

// ── Challenges ───────────────────────────────────────────────

function setupChallenges() {
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
        "Select the Earth-Venus preset from the sidebar.",
        "Look at the retrograde duration readout.",
      ],
      initialState: { preset: "earth-mars", cursorDay: 0 },
      check(s: any) {
        const tgt = String(s?.target ?? "");
        if (tgt === "Venus")
          return { correct: true, close: false, message: "Venus retrograde is shorter (~40 days vs Mars ~70 days). The higher angular velocity difference at inferior conjunction makes the reversal quicker." };
        return { correct: false, close: false, message: "Switch to the Venus preset to compare." };
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
          state.observer = config.observer as PlanetKey;
          state.target = config.target as PlanetKey;
          observer.value = state.observer;
          target.value = state.target;
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
        "Run the Earth\u2013Mars preset and find the first retrograde interval.",
        "Record the start day, end day, and duration of the interval.",
        "Switch to Earth\u2013Venus and compare the retrograde duration.",
        "Use your data to explain why inner planets have shorter retrograde arcs.",
      ],
      columns: [
        { key: "observer", label: "Observer" },
        { key: "target", label: "Target" },
        { key: "cursorDay", label: "Day t" },
        { key: "lambdaDeg", label: "Lambda (deg)" },
        { key: "state", label: "State" },
        { key: "retroDuration", label: "Retro dur (days)" },
      ],
      snapshotLabel: "Add row (current state)",
      getSnapshotRow() {
        if (!series) {
          return { observer: state.observer, target: state.target, cursorDay: "\u2014", lambdaDeg: "\u2014", state: "\u2014", retroDuration: "\u2014" };
        }
        const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);
        return {
          observer: state.observer,
          target: state.target,
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
