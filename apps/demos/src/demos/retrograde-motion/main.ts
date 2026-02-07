import { createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { RetrogradeMotionModel } from "@cosmic/physics";
import {
  formatNumber,
  clamp,
  computeDisplayState,
  findPrevNextStationary,
  nearestRetrogradeInterval,
  orbitEllipsePoints,
  buildOrbitPath,
  type RetroModelCallbacks,
} from "./logic";

// ── DOM queries ──────────────────────────────────────────────

const presetEl = document.querySelector<HTMLSelectElement>("#preset");
const observerEl = document.querySelector<HTMLSelectElement>("#observer");
const targetEl = document.querySelector<HTMLSelectElement>("#target");
const windowMonthsEl = document.querySelector<HTMLInputElement>("#windowMonths");
const windowMonthsValueEl = document.querySelector<HTMLSpanElement>("#windowMonthsValue");
const plotStepDayEl = document.querySelector<HTMLSelectElement>("#plotStepDay");
const cursorDayEl = document.querySelector<HTMLInputElement>("#cursorDay");
const cursorDayValueEl = document.querySelector<HTMLSpanElement>("#cursorDayValue");
const prevStationaryEl = document.querySelector<HTMLButtonElement>("#prevStationary");
const nextStationaryEl = document.querySelector<HTMLButtonElement>("#nextStationary");
const centerRetrogradeEl = document.querySelector<HTMLButtonElement>("#centerRetrograde");
const showOtherPlanetsEl = document.querySelector<HTMLInputElement>("#showOtherPlanets");

const plotFocusEl = document.querySelector<HTMLDivElement>("#plotFocus");
const plotSvg = document.querySelector<SVGSVGElement>("#plotSvg");
const orbitSvg = document.querySelector<SVGSVGElement>("#orbitSvg");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const readoutDayEl = document.querySelector<HTMLSpanElement>("#readoutDay");
const readoutLambdaEl = document.querySelector<HTMLSpanElement>("#readoutLambda");
const readoutSlopeEl = document.querySelector<HTMLSpanElement>("#readoutSlope");
const readoutStateEl = document.querySelector<HTMLSpanElement>("#readoutState");
const geometryHintEl = document.querySelector<HTMLDivElement>("#geometryHint");
const readoutPrevStationaryEl = document.querySelector<HTMLSpanElement>("#readoutPrevStationary");
const readoutNextStationaryEl = document.querySelector<HTMLSpanElement>("#readoutNextStationary");
const readoutRetroBoundsEl = document.querySelector<HTMLSpanElement>("#readoutRetroBounds");
const readoutRetroDurationEl = document.querySelector<HTMLSpanElement>("#readoutRetroDuration");

if (
  !presetEl ||
  !observerEl ||
  !targetEl ||
  !windowMonthsEl ||
  !windowMonthsValueEl ||
  !plotStepDayEl ||
  !cursorDayEl ||
  !cursorDayValueEl ||
  !prevStationaryEl ||
  !nextStationaryEl ||
  !centerRetrogradeEl ||
  !showOtherPlanetsEl ||
  !plotFocusEl ||
  !plotSvg ||
  !orbitSvg ||
  !copyResultsEl ||
  !statusEl ||
  !readoutDayEl ||
  !readoutLambdaEl ||
  !readoutSlopeEl ||
  !readoutStateEl ||
  !geometryHintEl ||
  !readoutPrevStationaryEl ||
  !readoutNextStationaryEl ||
  !readoutRetroBoundsEl ||
  !readoutRetroDurationEl
) {
  throw new Error("Missing required DOM elements for retrograde-motion demo.");
}

const preset = presetEl;
const observer = observerEl;
const target = targetEl;
const windowMonths = windowMonthsEl;
const windowMonthsValue = windowMonthsValueEl;
const plotStepDay = plotStepDayEl;
const cursorDay = cursorDayEl;
const cursorDayValue = cursorDayValueEl;
const prevStationary = prevStationaryEl;
const nextStationary = nextStationaryEl;
const centerRetrograde = centerRetrogradeEl;
const showOtherPlanets = showOtherPlanetsEl;
const plotFocus = plotFocusEl;
const plotSvgEl = plotSvg;
const orbitSvgEl = orbitSvg;
const copyResults = copyResultsEl;
const status = statusEl;
const readoutDay = readoutDayEl;
const readoutLambda = readoutLambdaEl;
const readoutSlope = readoutSlopeEl;
const readoutState = readoutStateEl;
const geometryHint = geometryHintEl;
const readoutPrevStationary = readoutPrevStationaryEl;
const readoutNextStationary = readoutNextStationaryEl;
const readoutRetroBounds = readoutRetroBoundsEl;
const readoutRetroDuration = readoutRetroDurationEl;

// ── Starfield ────────────────────────────────────────────────

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

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
};

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:retrograde-motion:mode",
  url: new URL(window.location.href)
});

const state: State = {
  observer: "Earth",
  target: "Mars",
  windowStartDay: 0,
  windowMonths: Number(windowMonths.value),
  plotStepDay: Number(plotStepDay.value),
  cursorDay: Number(cursorDay.value),
  showOtherPlanets: Boolean(showOtherPlanets.checked)
};

let series: Series | null = null;

const modelCallbacks: RetroModelCallbacks = {
  planetElements: (key: string) => RetrogradeMotionModel.planetElements(key as PlanetKey),
};

// ── Helpers ──────────────────────────────────────────────────

function setPreset(value: string) {
  if (value === "earth-mars") {
    state.observer = "Earth";
    state.target = "Mars";
  } else if (value === "earth-venus") {
    state.observer = "Earth";
    state.target = "Venus";
  }
}

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
  cursorDay.value = String(state.cursorDay);
  cursorDayValue.textContent = formatNumber(state.cursorDay, 2);
  render();
}

// ── Compute ──────────────────────────────────────────────────

function recomputeSeries() {
  series = RetrogradeMotionModel.computeSeries({
    observer: state.observer,
    target: state.target,
    windowStartDay: state.windowStartDay,
    windowMonths: state.windowMonths
  });

  cursorDay.min = String(series.windowStartDay);
  cursorDay.max = String(series.windowEndDay);
  cursorDay.step = String(series.dtInternalDay);
  setCursorDay(state.cursorDay);
}

// ── Readouts ─────────────────────────────────────────────────

function renderReadouts() {
  if (!series) return;

  const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);

  readoutDay.textContent = formatNumber(ds.cursorDay, 2);
  readoutLambda.textContent = formatNumber(ds.lambdaDeg, 2);
  readoutSlope.textContent = formatNumber(ds.dLambdaDt, 3);
  readoutState.textContent = ds.stateLabel;
  geometryHint.textContent = ds.geometryHint;

  readoutPrevStationary.textContent = Number.isNaN(ds.prevStationary)
    ? "\u2014"
    : formatNumber(ds.prevStationary, 3);
  readoutNextStationary.textContent = Number.isNaN(ds.nextStationary)
    ? "\u2014"
    : formatNumber(ds.nextStationary, 3);

  if (!ds.retroInterval) {
    readoutRetroBounds.textContent = "\u2014";
    readoutRetroDuration.textContent = "\u2014";
  } else {
    readoutRetroBounds.textContent = `${formatNumber(ds.retroInterval.startDay, 3)} to ${formatNumber(
      ds.retroInterval.endDay,
      3
    )} day`;
    readoutRetroDuration.textContent = `Duration: ${formatNumber(
      ds.retroInterval.endDay - ds.retroInterval.startDay,
      2
    )} day`;
  }
}

// ── SVG helpers ──────────────────────────────────────────────

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

// ── Plot ─────────────────────────────────────────────────────

function renderPlot() {
  if (!series) return;
  clear(plotSvgEl);

  const W = 1000;
  const H = 360;
  const margin = { left: 64, right: 20, top: 18, bottom: 70 };
  const stripH = 50;
  const mainTop = margin.top;
  const mainH = H - margin.top - margin.bottom - stripH;
  const mainBottom = mainTop + mainH;
  const stripTop = mainBottom + 16;

  const x0 = margin.left;
  const x1 = W - margin.right;

  const t0 = series.windowStartDay;
  const t1 = series.windowEndDay;
  const xScale = (t: number) => x0 + ((t - t0) / (t1 - t0)) * (x1 - x0);

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

  const yScale = (y: number) => mainTop + (1 - (y - yMin) / (yMax - yMin)) * mainH;

  const defs = svgEl("defs");
  const pattern = svgEl("pattern");
  pattern.setAttribute("id", "retroHatch");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", "10");
  pattern.setAttribute("height", "10");
  pattern.setAttribute("patternTransform", "rotate(45)");
  const rect = svgEl("rect");
  rect.setAttribute("width", "10");
  rect.setAttribute("height", "10");
  rect.setAttribute("fill", "transparent");
  const line = svgEl("line");
  line.setAttribute("x1", "0");
  line.setAttribute("y1", "0");
  line.setAttribute("x2", "0");
  line.setAttribute("y2", "10");
  line.setAttribute("stroke", "var(--cp-pink)");
  line.setAttribute("stroke-opacity", "0.35");
  line.setAttribute("stroke-width", "4");
  pattern.appendChild(rect);
  pattern.appendChild(line);
  defs.appendChild(pattern);
  plotSvgEl.appendChild(defs);

  // Retrograde bands.
  for (const interval of series.retrogradeIntervals) {
    const base = svgEl("rect");
    base.setAttribute("x", String(xScale(interval.startDay)));
    base.setAttribute("y", String(mainTop));
    base.setAttribute("width", String(xScale(interval.endDay) - xScale(interval.startDay)));
    base.setAttribute("height", String(mainH));
    base.setAttribute("fill", "var(--cp-pink)");
    base.setAttribute("fill-opacity", "0.12");
    plotSvgEl.appendChild(base);

    const band = svgEl("rect");
    band.setAttribute("x", String(xScale(interval.startDay)));
    band.setAttribute("y", String(mainTop));
    band.setAttribute("width", String(xScale(interval.endDay) - xScale(interval.startDay)));
    band.setAttribute("height", String(mainH));
    band.setAttribute("fill", "url(#retroHatch)");
    band.setAttribute("opacity", "0.95");
    plotSvgEl.appendChild(band);

    const label = svgEl("text");
    label.textContent = "retrograde";
    label.setAttribute("x", String(xScale(0.5 * (interval.startDay + interval.endDay))));
    label.setAttribute("y", String(mainTop + 16));
    label.setAttribute("fill", "var(--cp-muted)");
    label.setAttribute("font-size", "12");
    label.setAttribute("text-anchor", "middle");
    plotSvgEl.appendChild(label);
  }

  // Main curve.
  let d = "";
  let moved = false;
  for (let i = 0; i < series.timesDay.length; i += stride) {
    const t = series.timesDay[i];
    const y = unwrapped[i];
    if (!Number.isFinite(t) || !Number.isFinite(y)) continue;
    const x = xScale(t);
    const py = yScale(y);
    d += `${moved ? "L" : "M"} ${x.toFixed(2)} ${py.toFixed(2)} `;
    moved = true;
  }
  const path = svgEl("path");
  path.setAttribute("d", d.trim());
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "var(--cp-accent)");
  path.setAttribute("stroke-width", "3");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  plotSvgEl.appendChild(path);

  // Stationary markers.
  for (const tStat of series.stationaryDays) {
    const x = xScale(tStat);
    const idx = Math.round((tStat - series.windowStartDay) / series.dtInternalDay);
    const yi = clamp(idx, 0, series.lambdaUnwrappedDeg.length - 1);
    const y = yScale(series.lambdaUnwrappedDeg[yi]);

    const c = svgEl("circle");
    c.setAttribute("cx", String(x));
    c.setAttribute("cy", String(y));
    c.setAttribute("r", "5");
    c.setAttribute("fill", "var(--cp-pink)");
    c.setAttribute("stroke", "var(--cp-bg0)");
    c.setAttribute("stroke-width", "2");
    c.setAttribute("aria-label", `stationary at t=${formatNumber(tStat, 3)} day`);
    plotSvgEl.appendChild(c);
  }

  // Cursor.
  const xCur = xScale(state.cursorDay);
  const cursorLine = svgEl("line");
  cursorLine.setAttribute("x1", String(xCur));
  cursorLine.setAttribute("x2", String(xCur));
  cursorLine.setAttribute("y1", String(mainTop));
  cursorLine.setAttribute("y2", String(mainBottom));
  cursorLine.setAttribute("stroke", "var(--cp-text)");
  cursorLine.setAttribute("stroke-opacity", "0.6");
  cursorLine.setAttribute("stroke-width", "2");
  plotSvgEl.appendChild(cursorLine);

  // Wrapped strip.
  const stripRect = svgEl("rect");
  stripRect.setAttribute("x", String(x0));
  stripRect.setAttribute("y", String(stripTop));
  stripRect.setAttribute("width", String(x1 - x0));
  stripRect.setAttribute("height", String(stripH));
  stripRect.setAttribute("fill", "color-mix(in srgb, var(--cp-bg2) 75%, transparent)");
  stripRect.setAttribute("stroke", "var(--cp-border)");
  plotSvgEl.appendChild(stripRect);

  const stripScale = (deg: number) => stripTop + (1 - deg / 360) * stripH;
  let dStrip = "";
  moved = false;
  for (let i = 0; i < series.timesDay.length; i += stride) {
    const t = series.timesDay[i];
    const w = series.lambdaWrappedDeg[i];
    if (!Number.isFinite(t) || !Number.isFinite(w)) continue;
    const x = xScale(t);
    const y = stripScale(wrap360(w));
    dStrip += `${moved ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)} `;
    moved = true;
  }
  const stripPath = svgEl("path");
  stripPath.setAttribute("d", dStrip.trim());
  stripPath.setAttribute("fill", "none");
  stripPath.setAttribute("stroke", "var(--cp-accent)");
  stripPath.setAttribute("stroke-width", "2");
  plotSvgEl.appendChild(stripPath);

  const stripCursor = svgEl("line");
  stripCursor.setAttribute("x1", String(xCur));
  stripCursor.setAttribute("x2", String(xCur));
  stripCursor.setAttribute("y1", String(stripTop));
  stripCursor.setAttribute("y2", String(stripTop + stripH));
  stripCursor.setAttribute("stroke", "var(--cp-text)");
  stripCursor.setAttribute("stroke-opacity", "0.6");
  stripCursor.setAttribute("stroke-width", "2");
  plotSvgEl.appendChild(stripCursor);
}

// ── Orbit view ───────────────────────────────────────────────

function renderOrbit() {
  if (!series) return;
  clear(orbitSvgEl);

  const W = 420;
  const H = 420;
  const pad = 22;

  const keys: PlanetKey[] = state.showOtherPlanets
    ? ["Venus", "Earth", "Mars", "Jupiter", "Saturn"]
    : [state.observer, state.target];

  let extent = 0;
  for (const key of keys) {
    const el = RetrogradeMotionModel.planetElements(key);
    extent = Math.max(extent, el.aAu * (1 + el.e));
  }
  extent *= 1.12;

  const scale = (Math.min(W, H) / 2 - pad) / extent;
  const cx = W / 2;
  const cy = H / 2;

  const toPx = (xAu: number, yAu: number) => ({
    x: cx + xAu * scale,
    y: cy - yAu * scale
  });

  // Inertial +x axis reference ray with "0 deg" tick.
  const axis = svgEl("line");
  axis.setAttribute("x1", String(cx));
  axis.setAttribute("y1", String(cy));
  axis.setAttribute("x2", String(cx + extent * scale));
  axis.setAttribute("y2", String(cy));
  axis.setAttribute("stroke", "var(--cp-faint)");
  axis.setAttribute("stroke-width", "2");
  axis.setAttribute("stroke-dasharray", "6 6");
  orbitSvgEl.appendChild(axis);

  const axisLabel = svgEl("text");
  axisLabel.textContent = "0^\\circ";
  axisLabel.setAttribute("x", String(cx + extent * scale - 4));
  axisLabel.setAttribute("y", String(cy - 6));
  axisLabel.setAttribute("fill", "var(--cp-muted)");
  axisLabel.setAttribute("font-size", "12");
  axisLabel.setAttribute("text-anchor", "end");
  orbitSvgEl.appendChild(axisLabel);

  // Sun (celestial token).
  const sun = svgEl("circle");
  sun.setAttribute("cx", String(cx));
  sun.setAttribute("cy", String(cy));
  sun.setAttribute("r", "7");
  sun.setAttribute("fill", "var(--cp-celestial-sun-core)");
  orbitSvgEl.appendChild(sun);

  // Orbit ellipses using logic.ts helpers.
  for (const key of keys) {
    const el = RetrogradeMotionModel.planetElements(key);
    const pts = orbitEllipsePoints(el.aAu, el.e, el.varpiDeg, 240);
    const pxPts = pts.map((pt) => toPx(pt.x, pt.y));
    const pathD = buildOrbitPath(pxPts);

    const p = svgEl("path");
    p.setAttribute("d", pathD);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "var(--cp-celestial-orbit)");
    p.setAttribute("stroke-opacity", key === state.observer || key === state.target ? "0.9" : "0.4");
    p.setAttribute("stroke-width", key === state.observer || key === state.target ? "2.5" : "2");
    orbitSvgEl.appendChild(p);
  }

  // Observer & target positions at cursor day.
  const o = RetrogradeMotionModel.orbitStateAtModelDay({
    elements: RetrogradeMotionModel.planetElements(state.observer),
    tDay: state.cursorDay,
    t0Day: series.t0Day
  });
  const t = RetrogradeMotionModel.orbitStateAtModelDay({
    elements: RetrogradeMotionModel.planetElements(state.target),
    tDay: state.cursorDay,
    t0Day: series.t0Day
  });

  const oPx = toPx(o.xAu, o.yAu);
  const tPx = toPx(t.xAu, t.yAu);

  // Line of sight.
  const los = svgEl("line");
  los.setAttribute("x1", String(oPx.x));
  los.setAttribute("y1", String(oPx.y));
  los.setAttribute("x2", String(tPx.x));
  los.setAttribute("y2", String(tPx.y));
  los.setAttribute("stroke", "var(--cp-accent)");
  los.setAttribute("stroke-width", "2");
  los.setAttribute("stroke-opacity", "0.75");
  orbitSvgEl.appendChild(los);

  // Observer dot (uses dynamic planet color).
  const obs = svgEl("circle");
  obs.setAttribute("cx", String(oPx.x));
  obs.setAttribute("cy", String(oPx.y));
  obs.setAttribute("r", "6");
  obs.setAttribute("fill", resolvePlanetColor(state.observer));
  orbitSvgEl.appendChild(obs);

  // Target dot (uses dynamic planet color).
  const tgt = svgEl("circle");
  tgt.setAttribute("cx", String(tPx.x));
  tgt.setAttribute("cy", String(tPx.y));
  tgt.setAttribute("r", "6");
  tgt.setAttribute("fill", resolvePlanetColor(state.target));
  orbitSvgEl.appendChild(tgt);
}

// ── Render ───────────────────────────────────────────────────

function render() {
  renderReadouts();
  renderPlot();
  renderOrbit();
}

// ── Export ────────────────────────────────────────────────────

function exportResults(): ExportPayloadV1 {
  if (!series) {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      parameters: [],
      readouts: [],
      notes: ["No results yet."]
    };
  }

  const ds = computeDisplayState(series, state.cursorDay, modelCallbacks);

  const nearest = ds.retroInterval;
  const retroBounds =
    nearest == null
      ? "\u2014"
      : `${formatNumber(nearest.startDay, 3)} to ${formatNumber(nearest.endDay, 3)}`;
  const retroDuration =
    nearest == null ? "\u2014" : formatNumber(nearest.endDay - nearest.startDay, 2);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Observer", value: String(state.observer) },
      { name: "Target", value: String(state.target) },
      { name: "Window start day (day)", value: formatNumber(series.windowStartDay, 2) },
      { name: "Window end day (day)", value: formatNumber(series.windowEndDay, 2) },
      { name: "Plot step (day)", value: formatNumber(state.plotStepDay, 2) },
      { name: "Internal step (day)", value: formatNumber(series.dtInternalDay, 2) },
      { name: "Model type", value: "Keplerian 2D (coplanar)" }
    ],
    readouts: [
      { name: "Current day (day)", value: formatNumber(ds.cursorDay, 2) },
      { name: "Apparent (sky) longitude lambda_app (deg)", value: formatNumber(ds.lambdaDeg, 2) },
      { name: "d(lambda_tilde)/dt (deg/day)", value: formatNumber(ds.dLambdaDt, 3) },
      { name: "State", value: ds.stateLabel },
      {
        name: "Previous stationary day (day)",
        value: Number.isNaN(ds.prevStationary) ? "\u2014" : formatNumber(ds.prevStationary, 3)
      },
      {
        name: "Next stationary day (day)",
        value: Number.isNaN(ds.nextStationary) ? "\u2014" : formatNumber(ds.nextStationary, 3)
      },
      { name: "Nearest retrograde bounds (day)", value: retroBounds },
      { name: "Nearest retrograde duration (day)", value: retroDuration }
    ],
    notes: [
      "Retrograde here is apparent: the planet never reverses its orbit; the sign flip comes from relative motion and viewing geometry.",
      "Model time uses model day only (no calendar-date claims).",
      "Orbits are coplanar Keplerian ellipses around the Sun with a fixed inertial +x axis as 0 deg."
    ]
  };
}

// ── Event handlers ───────────────────────────────────────────

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying\u2026");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) => {
      const message = err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.";
      setLiveRegionText(status, message);
    });
});

preset.addEventListener("change", () => {
  setPreset(preset.value);
  observer.value = state.observer;
  target.value = state.target;
  recomputeSeries();
});

observer.addEventListener("change", () => {
  state.observer = observer.value as PlanetKey;
  recomputeSeries();
});

target.addEventListener("change", () => {
  state.target = target.value as PlanetKey;
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

cursorDay.addEventListener("input", () => {
  setCursorDay(Number(cursorDay.value));
});

showOtherPlanets.addEventListener("change", () => {
  state.showOtherPlanets = Boolean(showOtherPlanets.checked);
  renderOrbit();
});

prevStationary.addEventListener("click", () => {
  if (!series) return;
  const { prev } = findPrevNextStationary(series.stationaryDays, state.cursorDay);
  if (!Number.isNaN(prev)) setCursorDay(prev);
});

nextStationary.addEventListener("click", () => {
  if (!series) return;
  const { next } = findPrevNextStationary(series.stationaryDays, state.cursorDay);
  if (!Number.isNaN(next)) setCursorDay(next);
});

centerRetrograde.addEventListener("click", () => {
  if (!series) return;
  const nearest = nearestRetrogradeInterval(series.retrogradeIntervals, state.cursorDay);
  if (!nearest) return;
  setCursorDay(0.5 * (nearest.startDay + nearest.endDay));
});

function stepCursor(deltaDay: number) {
  setCursorDay(state.cursorDay + deltaDay);
}

plotFocus.addEventListener("keydown", (e) => {
  if (!series) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    stepCursor(e.shiftKey ? -series.dtInternalDay : -1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    stepCursor(e.shiftKey ? series.dtInternalDay : 1);
  }
});

function handlePointerToDay(clientX: number) {
  if (!series) return;
  const rect = plotSvgEl.getBoundingClientRect();
  const x = clamp(clientX - rect.left, 0, rect.width);
  const t = series.windowStartDay + (x / rect.width) * (series.windowEndDay - series.windowStartDay);
  setCursorDay(t);
}

let isDragging = false;
plotSvgEl.addEventListener("pointerdown", (e) => {
  isDragging = true;
  plotSvgEl.setPointerCapture?.(e.pointerId);
  handlePointerToDay(e.clientX);
});
plotSvgEl.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  handlePointerToDay(e.clientX);
});
plotSvgEl.addEventListener("pointerup", () => {
  isDragging = false;
});
plotSvgEl.addEventListener("pointercancel", () => {
  isDragging = false;
});

// ── Boot ─────────────────────────────────────────────────────

initMath(document);
recomputeSeries();
