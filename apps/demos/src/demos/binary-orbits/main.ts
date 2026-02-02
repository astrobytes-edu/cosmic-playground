import { createDemoModes, createInstrumentRuntime, initMath, setLiveRegionText } from "@cosmic/runtime";
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
  !periodValueEl ||
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
const periodValue = periodValueEl;
const canvas = canvasEl;
const ctx = ctxEl;
const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

const yearsPerSecond = 0.06; // mapping from real seconds -> model years (teaching speed)

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function computeModel(args: { massRatio: number; separation: number }) {
  const massRatio = clamp(args.massRatio, 0.2, 5);
  const separation = clamp(args.separation, 1, 8);

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

function getModel() {
  return computeModel({
    massRatio: Number(massRatioInput.value),
    separation: Number(separationInput.value)
  });
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
          "We hold $m_1 = 1\\,M_{\\odot}$ fixed and set $m_2$ via the mass-ratio slider.",
          "Period uses the Kepler teaching normalization: $P^2 = \\frac{a^3}{M_1 + M_2}$."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Binary Orbits",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Set a mass ratio and separation.",
      "Record the barycenter offset and orbital period.",
      "Compare an equal-mass system to an unequal-mass system."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "massRatio", label: "$m_2/m_1$" },
      { key: "separationAu", label: "Separation $a$ (AU)" },
      { key: "baryOffsetAu", label: "Barycenter offset from $m_1$ (AU)" },
      { key: "periodYr", label: "Period $P$ (yr)" }
    ],
    getSnapshotRow() {
      const model = getModel();
      return {
        case: "Snapshot",
        massRatio: formatNumber(model.massRatio, 2),
        separationAu: formatNumber(model.separation, 2),
        baryOffsetAu: formatNumber(model.r1, 3),
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
            { label: "Unequal masses", massRatio: 5, separation: 4 }
          ];
          return cases.map((c) => {
            const model = computeModel(c);
            return {
              case: c.label,
              massRatio: formatNumber(model.massRatio, 2),
              separationAu: formatNumber(model.separation, 2),
              baryOffsetAu: formatNumber(model.r1, 3),
              periodYr: formatNumber(model.periodYr, 3)
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> In one sentence, explain why the heavier body’s orbit is smaller, even though both bodies move.</p>"
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
      { name: "Mass ratio (m₂/m₁)", value: formatNumber(model.massRatio, 2) },
      { name: "Separation a (AU)", value: formatNumber(model.separation, 2) }
    ],
    readouts: [
      {
        name: "Barycenter offset from m₁ (AU)",
        value: formatNumber(model.r1, 3)
      },
      { name: "Orbital period P (yr)", value: formatNumber(model.periodYr, 3) }
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
  setLiveRegionText(status, "Copying…");
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
