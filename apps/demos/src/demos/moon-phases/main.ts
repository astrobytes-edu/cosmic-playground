import { createInstrumentRuntime, initMath } from "@cosmic/runtime";
import { ChallengeEngine, createDemoModes } from "@cosmic/runtime";

const angleInputEl = document.querySelector<HTMLInputElement>("#angle");
const angleValueEl = document.querySelector<HTMLSpanElement>("#angleValue");
const illumValueEl = document.querySelector<HTMLSpanElement>("#illumValue");
const canvasEl = document.querySelector<HTMLCanvasElement>("#moonCanvas");
const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const challengeModeEl =
  document.querySelector<HTMLButtonElement>("#challengeMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

if (
  !angleInputEl ||
  !angleValueEl ||
  !illumValueEl ||
  !canvasEl ||
  !stationModeEl ||
  !challengeModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl
) {
  throw new Error("Missing required DOM elements for moon-phases demo.");
}

const ctxEl = canvasEl.getContext("2d");
if (!ctxEl) {
  throw new Error("Canvas 2D context unavailable.");
}

const angleInput = angleInputEl;
const angleValue = angleValueEl;
const illumValue = illumValueEl;
const canvas = canvasEl;
const ctx = ctxEl;
const stationModeButton = stationModeEl;
const challengeModeButton = challengeModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngleDeg(angleDeg: number): number {
  const a = angleDeg % 360;
  return a < 0 ? a + 360 : a;
}

function cssVar(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value.length > 0 ? value : fallback;
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
  glow: cssVar("--cp-glow-blue", "rgba(96, 165, 250, 0.12)"),
  disk: cssVar("--cp-bg1", "#0B1020"),
  lit: cssVar("--cp-text", "#EAF2FF"),
  border: cssVar("--cp-border", "rgba(255, 255, 255, 0.10)")
};

// Illuminated fraction of a sphere as seen from Earth, approximated by:
// f = (1 + cos(phaseAngle)) / 2 where phaseAngle is in radians.
function illuminatedFraction(phaseAngleDeg: number) {
  const radians = (phaseAngleDeg * Math.PI) / 180;
  return (1 + Math.cos(radians)) / 2;
}

function formatFraction(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(3);
}

function phaseName(angleDeg: number): string {
  const a = normalizeAngleDeg(angleDeg);

  // Teaching convention used here:
  // - 0° = Full, 180° = New
  // - 270° is First Quarter (waxing), 90° is Third Quarter (waning)
  //
  // We label the 8 principal phases by splitting the circle into 45° bins.
  const bin = Math.round(a / 45) % 8;
  switch (bin) {
    case 0:
      return "Full";
    case 1:
      return "Waning gibbous";
    case 2:
      return "Third quarter";
    case 3:
      return "Waning crescent";
    case 4:
      return "New";
    case 5:
      return "Waxing crescent";
    case 6:
      return "First quarter";
    case 7:
      return "Waxing gibbous";
    default:
      return "—";
  }
}

function drawMoon(phaseAngleDeg: number) {
  const { width: w, height: h } = resizeCanvasToCssPixels(canvas, ctx);
  const r = Math.min(w, h) * 0.34;
  const cx = w / 2;
  const cy = h / 2;

  const frac = illuminatedFraction(phaseAngleDeg);
  const terminatorX = (1 - 2 * frac) * r;

  ctx.clearRect(0, 0, w, h);

  // Soft background glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, canvasTheme.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Moon disk base (dark)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = canvasTheme.disk;
  ctx.fill();

  // Lit portion: draw as intersection of two circles to hint at a terminator.
  // This is a visualization aid, not a full 3D ray-trace.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.beginPath();
  ctx.arc(cx + terminatorX, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = canvasTheme.lit;
  ctx.fill();

  ctx.restore();

  // Rim
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = canvasTheme.border;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function render() {
  const angleDeg = clamp(Number(angleInput.value), 0, 360);
  const frac = illuminatedFraction(angleDeg);

  angleValue.textContent = String(Math.round(angleDeg));
  illumValue.textContent = String(Math.round(frac * 100));

  drawMoon(angleDeg);
}

angleInput.addEventListener("input", render);
render();
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    render();
  }).observe(canvas);
} else {
  window.addEventListener("resize", () => {
    render();
  });
}

// -------------------------
// Station Mode + Help
// -------------------------

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
          "Angle $\\alpha$ is the Sun–Moon–Earth phase angle in this model: $0^\\circ$ = Full, $180^\\circ$ = New.",
          "Illuminated fraction is $f = \\frac{1 + \\cos\\alpha}{2}$."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Moon Phases",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Move the slider to a phase.",
      "Click “Add row (snapshot)” to record angle, phase name, and illuminated fraction.",
      "Use the key-phase button for New → First Quarter → Full → Third Quarter, then sanity-check your results."
    ],
    columns: [
      { key: "angleDeg", label: "Angle $\\alpha$ ($^\\circ$)" },
      { key: "phase", label: "Phase (name)" },
      { key: "f", label: "Illuminated fraction $f$" },
      { key: "percent", label: "Illuminated (%)" }
    ],
    getSnapshotRow() {
      const angleDeg = clamp(Number(angleInput.value), 0, 360);
      const frac = illuminatedFraction(angleDeg);
      return {
        angleDeg: String(Math.round(angleDeg)),
        phase: phaseName(angleDeg),
        f: formatFraction(frac),
        percent: String(Math.round(frac * 100))
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add key phases",
        getRows() {
          const keyAngles = [
            { label: "New", angleDeg: 180 },
            { label: "First quarter", angleDeg: 270 },
            { label: "Full", angleDeg: 0 },
            { label: "Third quarter", angleDeg: 90 }
          ];
          return keyAngles.map((k) => {
            const f = illuminatedFraction(k.angleDeg);
            return {
              angleDeg: String(k.angleDeg),
              phase: k.label,
              f: formatFraction(f),
              percent: String(Math.round(f * 100))
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> In one sentence, explain why phases are about <em>geometry</em> (illumination) rather than Earth’s shadow.</p>"
  }
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

// -------------------------
// Challenge Mode
// -------------------------

const controlsBody =
  document.querySelector<HTMLElement>(".cp-demo__controls .cp-panel-body");
if (!controlsBody) {
  throw new Error("Missing controls container for challenge mode.");
}

function getState() {
  const angleDeg = clamp(Number(angleInput.value), 0, 360);
  const frac = illuminatedFraction(angleDeg);
  return { angleDeg, frac };
}

function setState(next: unknown) {
  const angleDeg =
    typeof next === "object" && next !== null && "angleDeg" in next
      ? (next as any).angleDeg
      : null;
  if (typeof angleDeg === "number" && Number.isFinite(angleDeg)) {
    angleInput.value = String(clamp(angleDeg, 0, 360));
    render();
  }
}

const challengeEngine = new ChallengeEngine(
  [
    {
      prompt: "Set $\\alpha$ so the Moon is about half illuminated.",
      hints: [
        "Half illumination happens at quarter phases.",
        "Try $\\alpha$ near $90^\\circ$ or $270^\\circ$."
      ],
      initialState: { angleDeg: 100 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const frac = Number(state?.frac);
        if (![angleDeg, frac].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        const diff = Math.abs(frac - 0.5);
        if (diff <= 0.03) {
          return { correct: true, close: false, message: `$f \\approx ${formatFraction(frac)}$.` };
        }
        if (diff <= 0.08) {
          return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(frac)}$.` };
        }
        return { correct: false, close: false, message: "Try moving toward 50% ($f=0.5$)." };
      }
    },
    {
      prompt: "Set $\\alpha$ so the Moon is near New (almost dark).",
      hints: ["New happens near $\\alpha = 180^\\circ$.", "Look for $f$ near 0."],
      initialState: { angleDeg: 150 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const frac = Number(state?.frac);
        if (![angleDeg, frac].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        if (frac <= 0.05) return { correct: true, close: false, message: `$f \\approx ${formatFraction(frac)}$.` };
        if (frac <= 0.12) return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(frac)}$.` };
        return { correct: false, close: false, message: `Too bright: $f \\approx ${formatFraction(frac)}$.` };
      }
    },
    {
      prompt: "Set $\\alpha$ so the Moon is near Full (almost fully lit).",
      hints: ["Full happens near $\\alpha = 0^\\circ$ (or $360^\\circ$).", "Look for $f$ near 1."],
      initialState: { angleDeg: 30 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const frac = Number(state?.frac);
        if (![angleDeg, frac].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        if (frac >= 0.95) return { correct: true, close: false, message: `$f \\approx ${formatFraction(frac)}$.` };
        if (frac >= 0.88) return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(frac)}$.` };
        return { correct: false, close: false, message: `Too dim: $f \\approx ${formatFraction(frac)}$.` };
      }
    }
  ],
  { container: controlsBody, getState, setState, showUI: true }
);

challengeModeButton.addEventListener("click", () => {
  if (challengeEngine.isActive()) {
    challengeEngine.stop();
  } else {
    challengeEngine.start();
  }
});

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:moon-phases:mode",
  url: new URL(window.location.href)
});

async function handleCopyResults() {
  status.textContent = "Copying…";
  try {
    const angleDeg = clamp(Number(angleInput.value), 0, 360);
    const frac = illuminatedFraction(angleDeg);

    await runtime.copyResults({
      version: 1,
      timestamp: new Date().toISOString(),
      parameters: [
        {
          name: "Phase angle (deg)",
          value: `${Math.round(angleDeg)}°`
        }
      ],
      readouts: [
        {
          name: "Illuminated (%)",
          value: `${Math.round(frac * 100)}%`
        }
      ],
      notes: ["This pilot uses a simplified 2D terminator visualization."]
    });

    status.textContent = "Copied results to clipboard.";
  } catch (err) {
    status.textContent =
      err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.";
  }
}

copyResults.addEventListener("click", () => {
  void handleCopyResults();
});

initMath(document);
