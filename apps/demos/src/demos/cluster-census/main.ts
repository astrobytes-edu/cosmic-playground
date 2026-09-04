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
  HYDROGEN_BURNING_MIN_MSUN,
  IMF_MAX_MSUN,
  buildKroupaSegments,
  kroupaMassFraction,
  maschbergerMassFraction,
  sampleStarCluster
} from "@cosmic/physics";
import type { StarCluster } from "@cosmic/physics";
import { requiredContext2d } from "../../shared/dom";
import {
  ageMyrToSlider,
  buildLogMassBins,
  censusAnnouncement,
  countIntoBins,
  expectedCounts,
  formatAge,
  formatCount,
  formatMassMsun,
  formatRadiusPc,
  massToDotRadiusPx,
  projectToPixels,
  radiusEnclosingFractionPc,
  rgbToCss,
  sliderToAgeMyr,
  sliderToStarCount,
  starCountToSlider,
  temperatureToRgb,
  turnoffMassMsun
} from "./logic";
import type { ImfLaw, ProfileKind } from "./logic";

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
const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("button.preset[data-preset]")
);

const mostMassiveEl = document.querySelector<HTMLSpanElement>("#mostMassive");
const turnoffEl = document.querySelector<HTMLSpanElement>("#turnoff");
const totalMassEl = document.querySelector<HTMLSpanElement>("#totalMass");
const halfRadiusEl = document.querySelector<HTMLSpanElement>("#halfRadius");
const shiningCountEl = document.querySelector<HTMLSpanElement>("#shiningCount");
const remnantCountEl = document.querySelector<HTMLSpanElement>("#remnantCount");
const outsideCountEl = document.querySelector<HTMLSpanElement>("#outsideCount");
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
  !outsideCountEl ||
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
const outsideCount = outsideCountEl;
const extrapolatedCount = extrapolatedCountEl;
const stationMode = stationModeEl;
const help = helpEl;
const copyResults = copyResultsEl;
const reset = resetEl;
const status = statusEl;
const clusterCanvas = clusterCanvasEl;
const hrCanvas = hrCanvasEl;
const imfCanvas = imfCanvasEl;

const clusterCtx = requiredContext2d(clusterCanvas, "#clusterCanvas");
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
}

const DEFAULTS: DemoState = {
  law: "maschberger",
  starCount: 800,
  alphaHigh: 2.3,
  ageMyr: 0,
  profile: "plummer",
  seed: 1
};

const state: DemoState = { ...DEFAULTS };

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
  profile: { kind: state.profile, scaleRadiusPc: SCALE_RADIUS_PC, gamma: EFF_GAMMA }
});

function resample(): void {
  cluster = sampleStarCluster({
    seed: state.seed,
    starCount: state.starCount,
    imf: state.law,
    alphaHigh: state.alphaHigh,
    ageMyr: state.ageMyr,
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

const AXIS_FONT = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
const LABEL_FONT = "12px system-ui, -apple-system, Segoe UI, sans-serif";

/* ── Panel 1: the cluster in space ───────────────────────────────────────────*/

function drawCluster(palette: Palette): void {
  const { width, height } = sizeCanvas(clusterCanvas, clusterCtx);
  const ctx = clusterCtx;
  const centreX = width / 2;
  const centreY = height / 2;

  // Frame the view on the stars that are actually there, with a floor so a tiny
  // cluster does not fill the frame with three dots.
  const radii = cluster.stars.map((s) => Math.hypot(s.positionPc.x, s.positionPc.y));
  radii.sort((a, b) => a - b);
  const outer =
    radii.length === 0
      ? SCALE_RADIUS_PC * 3
      : Math.max(SCALE_RADIUS_PC, radii[Math.floor(radii.length * 0.97)] || SCALE_RADIUS_PC);
  const pixelsPerPc = (Math.min(width, height) * 0.45) / outer;

  // Heaviest last, so a rare massive star is never hidden under a crowd of dwarfs.
  const ordered = [...cluster.stars].sort((a, b) => a.massMsun - b.massMsun);
  for (const star of ordered) {
    const x = centreX + star.positionPc.x * pixelsPerPc;
    const y = centreY + star.positionPc.y * pixelsPerPc;
    if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;
    const radiusPx = massToDotRadiusPx(star.massMsun, 0.85);

    if (star.phase === "remnant") {
      ctx.fillStyle = rgbToCss([150, 158, 176], 0.55);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, radiusPx * 0.55), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (star.phase === "outside-model-range") {
      // Drawn, because the star is there; hollow, because the model cannot describe it.
      ctx.strokeStyle = rgbToCss([150, 158, 176], 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, radiusPx * 0.6), 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }

    const rgb = temperatureToRgb(star.temperatureK);
    if (star.massMsun > 8) {
      ctx.fillStyle = rgbToCss(rgb, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, radiusPx * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = rgbToCss(rgb, 0.92);
    ctx.beginPath();
    ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scale bar: without it the panel has no size, and every cluster looks the same.
  const barPc = niceScaleLength(outer);
  const barPx = barPc * pixelsPerPc;
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
  ctx.fillStyle = palette.muted;
  ctx.font = AXIS_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${barPc} pc`, barX, barY - 6);
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

/* ── Panel 2: the HR diagram ─────────────────────────────────────────────────*/

const HR_TEMPERATURE_RANGE = { min: Math.log10(2500), max: Math.log10(50000) };
const HR_LUMINOSITY_RANGE = { min: -4, max: 6.5 };

function drawHrDiagram(palette: Palette): void {
  const { width, height } = sizeCanvas(hrCanvas, hrCtx);
  const ctx = hrCtx;
  // Left padding has to clear the tick labels AND the rotated axis title beside them.
  const pad = { left: 62, right: 12, top: 12, bottom: 30 };
  const plotLeft = pad.left;
  const plotRight = width - pad.right;
  const plotTop = pad.top;
  const plotBottom = height - pad.bottom;

  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotLeft, plotTop, plotRight - plotLeft, plotBottom - plotTop);

  ctx.font = AXIS_FONT;
  ctx.fillStyle = palette.muted;

  // Temperature axis runs hot to cool, left to right: the HR convention.
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const temperatureK of [40000, 20000, 10000, 5000, 3000]) {
    const x = projectToPixels(
      Math.log10(temperatureK),
      HR_TEMPERATURE_RANGE,
      plotLeft,
      plotRight,
      true
    );
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(x, plotTop);
    ctx.lineTo(x, plotBottom);
    ctx.strokeStyle = palette.axis;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(temperatureK >= 10000 ? `${temperatureK / 1000}k` : String(temperatureK), x, plotBottom + 5);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let logL = -4; logL <= 6; logL += 2) {
    const y = projectToPixels(logL, HR_LUMINOSITY_RANGE, plotBottom, plotTop);
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(plotLeft, y);
    ctx.lineTo(plotRight, y);
    ctx.strokeStyle = palette.axis;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(`10^${logL}`, plotLeft - 6, y);
  }

  ctx.fillStyle = palette.muted;
  ctx.font = LABEL_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("effective temperature [K], hot to cool", (plotLeft + plotRight) / 2, height - 4);
  ctx.save();
  ctx.translate(10, (plotTop + plotBottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "top";
  ctx.fillText("luminosity [Lsun]", 0, 0);
  ctx.restore();

  let plotted = 0;
  for (const star of cluster.stars) {
    if (star.phase !== "main-sequence") continue;
    if (star.luminosityLsun <= 0 || star.temperatureK <= 0) continue;
    plotted += 1;
    const x = projectToPixels(
      Math.log10(star.temperatureK),
      HR_TEMPERATURE_RANGE,
      plotLeft,
      plotRight,
      true
    );
    const y = projectToPixels(
      Math.log10(star.luminosityLsun),
      HR_LUMINOSITY_RANGE,
      plotBottom,
      plotTop
    );
    const rgb = temperatureToRgb(star.temperatureK);
    const dotRadius = Math.max(1.1, massToDotRadiusPx(star.massMsun, 0.42));
    ctx.fillStyle = rgbToCss(rgb, 0.85);
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
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

  // The turnoff is the point of the age control, so mark it rather than leaving the
  // reader to find the topmost dot.
  const turnoff = turnoffMassMsun(cluster.stars);
  if (turnoff !== null && state.ageMyr > 0) {
    const marker = cluster.stars.find(
      (s) => s.phase === "main-sequence" && s.massMsun === turnoff
    );
    if (marker) {
      const x = projectToPixels(
        Math.log10(marker.temperatureK),
        HR_TEMPERATURE_RANGE,
        plotLeft,
        plotRight,
        true
      );
      const y = projectToPixels(
        Math.log10(marker.luminosityLsun),
        HR_LUMINOSITY_RANGE,
        plotBottom,
        plotTop
      );
      ctx.strokeStyle = palette.amber;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = palette.amber;
      ctx.font = AXIS_FONT;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("turnoff", Math.min(x + 13, plotRight - 44), y);
    }
  }

  if (plotted === 0) {
    ctx.fillStyle = palette.muted;
    ctx.font = LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "No stars left on the main sequence.",
      (plotLeft + plotRight) / 2,
      (plotTop + plotBottom) / 2
    );
  }
}

/* ── Panel 3: the mass histogram ─────────────────────────────────────────────*/

function drawHistogram(palette: Palette): void {
  const { width, height } = sizeCanvas(imfCanvas, imfCtx);
  const ctx = imfCtx;
  const pad = { left: 62, right: 12, top: 12, bottom: 32 };
  const plotLeft = pad.left;
  const plotRight = width - pad.right;
  const plotTop = pad.top;
  const plotBottom = height - pad.bottom;

  const { edgesMsun, centresMsun } = buildLogMassBins(
    HYDROGEN_BURNING_MIN_MSUN,
    IMF_MAX_MSUN,
    HISTOGRAM_BINS
  );
  const masses = cluster.stars.map((s) => s.massMsun);
  const counts = countIntoBins(masses, edgesMsun);

  const fraction =
    state.law === "kroupa"
      ? (() => {
          const segments = buildKroupaSegments(
            HYDROGEN_BURNING_MIN_MSUN,
            IMF_MAX_MSUN,
            state.alphaHigh
          );
          return (lo: number, hi: number) => kroupaMassFraction(lo, hi, segments);
        })()
      : (lo: number, hi: number) =>
          maschbergerMassFraction(lo, hi, {
            minMassMsun: HYDROGEN_BURNING_MIN_MSUN,
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

  ctx.font = AXIS_FONT;
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
    ctx.fillText(`10^${power}`, plotLeft - 6, y);
  }

  ctx.font = LABEL_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("stellar mass [Msun]", (plotLeft + plotRight) / 2, height - 4);
  ctx.save();
  ctx.translate(10, (plotTop + plotBottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("stars per bin", 0, 0);
  ctx.restore();

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
  ctx.strokeStyle = palette.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] <= 0) continue;
    const x = projectToPixels(Math.log10(centresMsun[i]), massRange, plotLeft, plotRight);
    const y = barToY(expected[i]);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.font = AXIS_FONT;
  ctx.fillStyle = palette.amber;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("the law", plotRight - 8, plotTop + 4);
  ctx.fillStyle = palette.muted;
  ctx.fillText("bars: what you drew", plotRight - 8, plotTop + 18);
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
  turnoffReadout.textContent = turnoff === null ? "none" : formatMassMsun(turnoff);
  totalMass.textContent = formatCount(cluster.totalMassMsun);
  halfRadius.textContent = formatRadiusPc(radiusEnclosingFractionPc(cluster.stars, 0.5));
  shiningCount.textContent = formatCount(cluster.mainSequenceCount);
  remnantCount.textContent = formatCount(cluster.remnantCount);
  outsideCount.textContent = formatCount(cluster.outsideModelCount);
  extrapolatedCount.textContent = formatCount(cluster.extrapolatedCount);

  const age = formatAge(state.ageMyr);
  countValue.textContent = formatCount(state.starCount);
  slopeValue.textContent = state.alphaHigh.toFixed(2);
  ageValue.textContent = `${age.value} ${age.unit}`;

  setLiveRegionText(
    status,
    censusAnnouncement({
      starCount: cluster.stars.length,
      law: state.law,
      ageMyr: state.ageMyr,
      mostMassiveMsun: cluster.mostMassiveMsun,
      turnoffMsun: turnoff,
      remnantCount: cluster.remnantCount
    })
  );
}

function syncChips(): void {
  lawMaschberger.setAttribute("aria-pressed", String(state.law === "maschberger"));
  lawKroupa.setAttribute("aria-pressed", String(state.law === "kroupa"));
  profilePlummer.setAttribute("aria-pressed", String(state.profile === "plummer"));
  profileEff.setAttribute("aria-pressed", String(state.profile === "eff"));
  countSlider.setAttribute("aria-valuetext", `${formatCount(state.starCount)} stars`);
  slopeSlider.setAttribute("aria-valuetext", `alpha ${state.alphaHigh.toFixed(2)}`);
  const age = formatAge(state.ageMyr);
  ageSlider.setAttribute("aria-valuetext", `${age.value} ${age.unit}`);
}

/* ── Redraw ──────────────────────────────────────────────────────────────────*/

let redrawHandle = 0;

function draw(): void {
  const palette = readPalette();
  drawCluster(palette);
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
  if (resampleNeeded) resample();
  syncChips();
  renderReadouts();
  scheduleRedraw();
}

/* ── Controls ────────────────────────────────────────────────────────────────*/

function setSlidersFromState(): void {
  countSlider.value = String(starCountToSlider(state.starCount));
  slopeSlider.value = String(Math.round(state.alphaHigh * 100));
  ageSlider.value = String(ageMyrToSlider(state.ageMyr));
}

countSlider.addEventListener("input", () => {
  state.starCount = sliderToStarCount(Number(countSlider.value));
  update();
});

slopeSlider.addEventListener("input", () => {
  state.alphaHigh = Number(slopeSlider.value) / 100;
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
update({ resampleNeeded: false });
