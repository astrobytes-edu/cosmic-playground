import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { TwoBodyAnalytic } from "@cosmic/physics";
import {
  MASS_RATIO_MAX,
  MASS_RATIO_MIN,
  SEPARATION_MAX_AU,
  SEPARATION_MIN_AU,
  bodyPositions,
  bodyRadius,
  computeModel,
  formatNumber,
  logSliderToValue,
  pixelsPerUnit,
  valueToLogSlider,
} from "./logic";

const massRatioInputEl = document.querySelector<HTMLInputElement>("#massRatio");
const massRatioValueEl =
  document.querySelector<HTMLSpanElement>("#massRatioValue");
const separationInputEl = document.querySelector<HTMLInputElement>("#separation");
const separationValueEl =
  document.querySelector<HTMLSpanElement>("#separationValue");
const baryOffsetValueEl =
  document.querySelector<HTMLSpanElement>("#baryOffsetValue");
const baryOffsetSecondaryValueEl =
  document.querySelector<HTMLSpanElement>("#baryOffsetSecondaryValue");
const speedPrimaryValueEl = document.querySelector<HTMLSpanElement>("#speedPrimaryValue");
const speedSecondaryValueEl = document.querySelector<HTMLSpanElement>("#speedSecondaryValue");
const periodValueEl = document.querySelector<HTMLSpanElement>("#periodValue");
const periodSharedCueEl = document.querySelector<HTMLSpanElement>("#periodSharedCue");
const motionModeEl = document.querySelector<HTMLSelectElement>("#motionMode");
const canvasEl = document.querySelector<HTMLCanvasElement>("#orbitCanvas");
const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

if (
  !massRatioInputEl ||
  !massRatioValueEl ||
  !separationInputEl ||
  !separationValueEl ||
  !baryOffsetValueEl ||
  !baryOffsetSecondaryValueEl ||
  !speedPrimaryValueEl ||
  !speedSecondaryValueEl ||
  !periodValueEl ||
  !periodSharedCueEl ||
  !motionModeEl ||
  !canvasEl ||
  !stationModeEl ||
  !helpEl ||
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
const baryOffsetSecondaryValue = baryOffsetSecondaryValueEl;
const speedPrimaryValue = speedPrimaryValueEl;
const speedSecondaryValue = speedSecondaryValueEl;
const periodValue = periodValueEl;
const periodSharedCue = periodSharedCueEl;
const motionMode = motionModeEl;
const canvas = canvasEl;
const ctx = ctxEl;
const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

// Starfield initialization
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

function cssVar(name: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (value.length === 0) throw new Error(`Missing required CSS variable: ${name}`);
  return value;
}

function resizeCanvasToCssPixels(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { width: number; height: number } {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const dpr = window.devicePixelRatio || 1;

  const nextWidth = Math.max(1, Math.round(width * dpr));
  const nextHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

const canvasTheme = {
  glow: cssVar("--cp-glow-blue"),
  border: cssVar("--cp-border"),
  text: cssVar("--cp-text"),
  body1: cssVar("--cp-chart-1"),
  body2: cssVar("--cp-chart-2")
};

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type MotionMode = "normalized" | "physical";

const YEARS_PER_SECOND_PHYSICAL = 0.06;
const NORMALIZED_ORBIT_SECONDS = 20;
const DEFAULT_MASS_RATIO = 1;
const DEFAULT_SEPARATION_AU = 4;

/** Period callback wired to the physics package. */
const periodFn = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar;

function getMotionMode(): MotionMode {
  return motionMode.value === "physical" ? "physical" : "normalized";
}

function getSeparationAuFromSlider(): number {
  return logSliderToValue(
    Number(separationInput.value),
    SEPARATION_MIN_AU,
    SEPARATION_MAX_AU,
  );
}

function getModel() {
  return computeModel(
    Number(massRatioInput.value),
    getSeparationAuFromSlider(),
    periodFn
  );
}

massRatioInput.value = String(DEFAULT_MASS_RATIO);
separationInput.value = String(
  valueToLogSlider(DEFAULT_SEPARATION_AU, SEPARATION_MIN_AU, SEPARATION_MAX_AU),
);

function phaseFromElapsedSeconds(elapsedSec: number, model: ReturnType<typeof getModel>): number {
  if (getMotionMode() === "normalized") {
    return (elapsedSec / NORMALIZED_ORBIT_SECONDS) * (2 * Math.PI);
  }
  const elapsedYears = elapsedSec * YEARS_PER_SECOND_PHYSICAL;
  return model.omegaRadPerYr * elapsedYears;
}

function draw(model: ReturnType<typeof getModel>, phaseRad: number) {
  const { width: w, height: h } = resizeCanvasToCssPixels(canvas, ctx);
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Soft background glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  glow.addColorStop(0, canvasTheme.glow);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const ppu = pixelsPerUnit(model.r1, model.r2, w, h);
  const r1px = model.r1 * ppu;
  const r2px = model.r2 * ppu;

  // Orbit guides
  ctx.strokeStyle = canvasTheme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r1px, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r2px, 0, Math.PI * 2);
  ctx.stroke();

  const { x1, y1, x2, y2 } = bodyPositions(cx, cy, r1px, r2px, phaseRad);

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
  const radius1 = bodyRadius(model.m1, base);
  const radius2 = bodyRadius(model.m2, base);

  ctx.fillStyle = canvasTheme.body1;
  ctx.beginPath();
  ctx.arc(x1, y1, radius1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = canvasTheme.body2;
  ctx.beginPath();
  ctx.arc(x2, y2, radius2, 0, Math.PI * 2);
  ctx.fill();
}

function renderAtPhase(phaseRad: number, modelArg?: ReturnType<typeof getModel>) {
  const model = modelArg ?? getModel();

  massRatioValue.textContent = `${formatNumber(model.massRatio, 2)}`;
  separationValue.textContent = `${formatNumber(model.separation, 2)}`;

  // Units are in separate .cp-readout__unit spans in HTML.
  baryOffsetValue.textContent = formatNumber(model.r1, 3);
  baryOffsetSecondaryValue.textContent = formatNumber(model.r2, 3);
  speedPrimaryValue.textContent = formatNumber(model.v1AuPerYr, 3);
  speedSecondaryValue.textContent = formatNumber(model.v2AuPerYr, 3);
  periodValue.textContent = formatNumber(model.periodYr, 3);
  periodSharedCue.textContent = "P1 = P2 (shared period)";

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
motionMode.addEventListener("change", () => {
  renderStatic();
  const modeLabel = getMotionMode() === "normalized" ? "Normalized motion mode enabled." : "Physical Kepler motion mode enabled.";
  setLiveRegionText(status, modeLabel);
});

if (prefersReducedMotion) {
  renderStatic();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      renderStatic();
    }).observe(canvas);
  } else {
    window.addEventListener("resize", () => {
      renderStatic();
    });
  }
} else {
  const start = performance.now();
  function frame(now: number) {
    const model = getModel();
    const elapsed = (now - start) / 1000;
    const phase = phaseFromElapsedSeconds(elapsed, model);
    renderAtPhase(phase, model);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:binary-orbits:mode",
  url: new URL(window.location.href)
});

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
          { key: "g", action: "Toggle station mode" }
        ]
      },
      {
        heading: "Model",
        type: "bullets",
        items: [
          "This is a circular, two-body visualization in teaching units (AU / yr / $M_{\\odot}$).",
          "We hold $M_1 = 1\\,M_{\\odot}$ fixed and set $M_2$ with the secondary ratio slider ($M_2/M_1 \\le 1$).",
          "Both bodies always share one period ($P_1 = P_2$), but their orbit sizes and speeds differ.",
          "Period uses the Kepler teaching normalization: $P^2 = \\frac{a^3}{M_1 + M_2}$."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Binary Orbits",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Set a secondary ratio and separation.",
      "Record $a_1$, $a_2$, $v_1$, $v_2$, and period $P$.",
      "Compare equal masses to an unequal case and identify what changes versus what stays the same."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "massRatio", label: "$M_2/M_1$" },
      { key: "separationAu", label: "Separation $a$ (AU)" },
      { key: "a1Au", label: "$a_1$ from $M_1$ (AU)" },
      { key: "a2Au", label: "$a_2$ from $M_2$ (AU)" },
      { key: "v1AuPerYr", label: "$v_1$ (AU/yr)" },
      { key: "v2AuPerYr", label: "$v_2$ (AU/yr)" },
      { key: "periodYr", label: "Period $P$ (yr)" }
    ],
    getSnapshotRow() {
      const model = getModel();
      return {
        case: "Snapshot",
        massRatio: formatNumber(model.massRatio, 2),
        separationAu: formatNumber(model.separation, 2),
        a1Au: formatNumber(model.r1, 3),
        a2Au: formatNumber(model.r2, 3),
        v1AuPerYr: formatNumber(model.v1AuPerYr, 3),
        v2AuPerYr: formatNumber(model.v2AuPerYr, 3),
        periodYr: formatNumber(model.periodYr, 3)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add comparison set",
        getRows() {
          const cases = [
            { label: "Equal masses", massRatio: 1, separation: 4 },
            { label: "Unequal masses", massRatio: 0.2, separation: 4 }
          ];
          return cases.map((c) => {
            const model = computeModel(c.massRatio, c.separation, periodFn);
            return {
              case: c.label,
              massRatio: formatNumber(model.massRatio, 2),
              separationAu: formatNumber(model.separation, 2),
              a1Au: formatNumber(model.r1, 3),
              a2Au: formatNumber(model.r2, 3),
              v1AuPerYr: formatNumber(model.v1AuPerYr, 3),
              v2AuPerYr: formatNumber(model.v2AuPerYr, 3),
              periodYr: formatNumber(model.periodYr, 3)
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> In one sentence, explain why $P_1=P_2$ even though $a_1$, $a_2$, $v_1$, and $v_2$ are different.</p>"
  }
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

function exportResults(): ExportPayloadV1 {
  const model = getModel();
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Secondary mass ratio (M2/M1)", value: formatNumber(model.massRatio, 2) },
      { name: "Separation a (AU)", value: formatNumber(model.separation, 2) },
      { name: "Motion mode", value: getMotionMode() === "normalized" ? "normalized-20s-cycle" : "physical-kepler" }
    ],
    readouts: [
      {
        name: "Barycenter offset from M1 (a1, AU)",
        value: formatNumber(model.r1, 3)
      },
      { name: "Barycenter offset from M2 (a2, AU)", value: formatNumber(model.r2, 3) },
      { name: "Orbital speed of M1 (AU/yr)", value: formatNumber(model.v1AuPerYr, 3) },
      { name: "Orbital speed of M2 (AU/yr)", value: formatNumber(model.v2AuPerYr, 3) },
      { name: "Orbital period P (yr)", value: formatNumber(model.periodYr, 3) }
    ],
    notes: [
      "Assumes perfectly circular, coplanar two-body motion with point masses.",
      "Uses AU/yr/Msun teaching units where G = 4*pi^2, so P^2 = a^3/(M1+M2).",
      "Mass-ratio slider uses secondary-over-primary convention M2/M1 <= 1."
    ]
  };
}

(window as any).__cp = {
  slug: "binary-orbits",
  mode: runtime.mode,
  exportResults
};

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying\u2026");
  void runtime
    .copyResults(exportResults())
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      );
    });
});

initMath(document);

const demoRoot = document.querySelector<HTMLElement>("#cp-demo");
if (demoRoot) initPopovers(demoRoot);
