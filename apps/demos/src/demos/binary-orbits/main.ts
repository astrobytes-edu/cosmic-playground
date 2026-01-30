import { createInstrumentRuntime } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { TwoBodyAnalytic } from "@cosmic/physics";

const massRatioInputEl = document.querySelector<HTMLInputElement>("#massRatio");
const massRatioValueEl =
  document.querySelector<HTMLSpanElement>("#massRatioValue");
const separationInputEl = document.querySelector<HTMLInputElement>("#separation");
const separationValueEl =
  document.querySelector<HTMLSpanElement>("#separationValue");
const baryOffsetValueEl =
  document.querySelector<HTMLSpanElement>("#baryOffsetValue");
const periodValueEl = document.querySelector<HTMLSpanElement>("#periodValue");
const canvasEl = document.querySelector<HTMLCanvasElement>("#orbitCanvas");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

if (
  !massRatioInputEl ||
  !massRatioValueEl ||
  !separationInputEl ||
  !separationValueEl ||
  !baryOffsetValueEl ||
  !periodValueEl ||
  !canvasEl ||
  !copyResultsEl ||
  !statusEl
) {
  throw new Error("Missing required DOM elements for binary-orbits demo.");
}

const ctxEl = canvasEl.getContext("2d");
if (!ctxEl) {
  throw new Error("Canvas 2D context unavailable.");
}

const massRatioInput = massRatioInputEl;
const massRatioValue = massRatioValueEl;
const separationInput = separationInputEl;
const separationValue = separationValueEl;
const baryOffsetValue = baryOffsetValueEl;
const periodValue = periodValueEl;
const canvas = canvasEl;
const ctx = ctxEl;
const copyResults = copyResultsEl;
const status = statusEl;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cssVar(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value.length > 0 ? value : fallback;
}

const canvasTheme = {
  glow: cssVar("--cp-glow-blue", "rgba(96, 165, 250, 0.12)"),
  border: cssVar("--cp-border", "rgba(255, 255, 255, 0.10)"),
  text: cssVar("--cp-text", "#EAF2FF"),
  body1: cssVar("--cp-accent3", "#60A5FA"),
  body2: cssVar("--cp-accent2", "#F97316")
};

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const yearsPerSecond = 0.06; // mapping from real seconds -> model years (teaching speed)

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function getModel() {
  const massRatio = clamp(Number(massRatioInput.value), 0.2, 5);
  const separation = clamp(Number(separationInput.value), 1, 8);

  const m1 = 1;
  const m2 = massRatio;
  const total = m1 + m2;

  // Teaching units (AU / yr / M☉): with G = 4π², Kepler normalization gives:
  // P² = a³ / (M1 + M2), with P in years, a in AU.
  const periodYr = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({
    aAu: separation,
    massSolar: total
  });
  const omegaRadPerYr = Number.isFinite(periodYr) ? (2 * Math.PI) / periodYr : 0;

  // Distances from barycenter
  const r1 = separation * (m2 / total);
  const r2 = separation * (m1 / total);

  return {
    massRatio,
    separation,
    m1,
    m2,
    total,
    periodYr,
    omegaRadPerYr,
    r1,
    r2
  };
}

function draw(model: ReturnType<typeof getModel>, phaseRad: number) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Soft background glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  glow.addColorStop(0, canvasTheme.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const maxR = Math.max(model.r1, model.r2);
  const pixelsPerUnit = maxR > 0 ? (Math.min(w, h) * 0.38) / maxR : 1;

  const r1px = model.r1 * pixelsPerUnit;
  const r2px = model.r2 * pixelsPerUnit;

  // Orbit guides
  ctx.strokeStyle = canvasTheme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r1px, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r2px, 0, Math.PI * 2);
  ctx.stroke();

  const cos = Math.cos(phaseRad);
  const sin = Math.sin(phaseRad);
  const x1 = cx - r1px * cos;
  const y1 = cy - r1px * sin;
  const x2 = cx + r2px * cos;
  const y2 = cy + r2px * sin;

  // Connection line
  ctx.strokeStyle = canvasTheme.border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Barycenter marker
  ctx.fillStyle = canvasTheme.text;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Body sizes (visual cue only)
  const base = Math.min(w, h) * 0.018;
  const radius1 = base * (1 + 0.25 * Math.log10(model.m1 + 1));
  const radius2 = base * (1 + 0.25 * Math.log10(model.m2 + 1));

  ctx.fillStyle = canvasTheme.body1;
  ctx.beginPath();
  ctx.arc(x1, y1, radius1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = canvasTheme.body2;
  ctx.beginPath();
  ctx.arc(x2, y2, radius2, 0, Math.PI * 2);
  ctx.fill();
}

function renderAtPhase(phaseRad: number) {
  const model = getModel();

  massRatioValue.textContent = `${formatNumber(model.massRatio, 1)}`;
  separationValue.textContent = `${formatNumber(model.separation, 1)}`;

  baryOffsetValue.textContent = `${formatNumber(model.r1, 3)} AU`;
  periodValue.textContent = `${formatNumber(model.periodYr, 3)} years`;

  draw(model, phaseRad);
}

function renderStatic() {
  renderAtPhase(0);
}

massRatioInput.addEventListener("input", () => {
  renderStatic();
});
separationInput.addEventListener("input", () => {
  renderStatic();
});

if (prefersReducedMotion) {
  renderStatic();
} else {
  const start = performance.now();
  function frame(now: number) {
    const model = getModel();
    const elapsed = (now - start) / 1000;
    const elapsedYears = elapsed * yearsPerSecond;
    const phase = model.omegaRadPerYr * elapsedYears;
    renderAtPhase(phase);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:binary-orbits:mode",
  url: new URL(window.location.href)
});

function exportResults(): ExportPayloadV1 {
  const model = getModel();
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mass ratio (m₂/m₁)", value: formatNumber(model.massRatio, 2) },
      { name: "Separation (a, AU)", value: `${formatNumber(model.separation, 2)} AU` }
    ],
    readouts: [
      {
        name: "Barycenter offset from m₁",
        value: `${formatNumber(model.r1, 3)} AU`
      },
      { name: "Orbital period", value: `${formatNumber(model.periodYr, 3)} years` }
    ],
    notes: [
      "Assumes perfectly circular, coplanar two-body motion with point masses.",
      "Uses AU/yr/M☉ teaching units where G = 4π², so P² = a³/(M₁+M₂)."
    ]
  };
}

(window as any).__cp = {
  slug: "binary-orbits",
  mode: runtime.mode,
  exportResults
};

copyResults.addEventListener("click", () => {
  status.textContent = "Copying…";
  void runtime
    .copyResults(exportResults())
    .then(() => {
      status.textContent = "Copied results to clipboard.";
    })
    .catch((err) => {
      status.textContent =
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.";
    });
});
