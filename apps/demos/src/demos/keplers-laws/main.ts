import { createDemoModes, createInstrumentRuntime, initMath, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AstroUnits, KeplersLawsModel, TwoBodyAnalytic } from "@cosmic/physics";

const aAuEl = document.querySelector<HTMLInputElement>("#aAu");
const aAuValueEl = document.querySelector<HTMLSpanElement>("#aAuValue");
const eccEl = document.querySelector<HTMLInputElement>("#ecc");
const eccValueEl = document.querySelector<HTMLSpanElement>("#eccValue");
const newtonModeEl = document.querySelector<HTMLInputElement>("#newtonMode");
const centralMassEl = document.querySelector<HTMLInputElement>("#centralMassSolar");
const centralMassValueEl = document.querySelector<HTMLSpanElement>("#centralMassValue");
const meanAnomalyEl = document.querySelector<HTMLInputElement>("#meanAnomalyDeg");
const meanAnomalyValueEl = document.querySelector<HTMLSpanElement>("#meanAnomalyValue");

const showApsidesEl = document.querySelector<HTMLInputElement>("#showApsides");
const showEqualAreasEl = document.querySelector<HTMLInputElement>("#showEqualAreas");
const showVelocityEl = document.querySelector<HTMLInputElement>("#showVelocity");

const animateEl = document.querySelector<HTMLButtonElement>("#animate");
const motionNoteEl = document.querySelector<HTMLParagraphElement>("#motionNote");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const canvasEl = document.querySelector<HTMLCanvasElement>("#orbitCanvas");

const periodYrEl = document.querySelector<HTMLSpanElement>("#periodYr");
const perihelionAuEl = document.querySelector<HTMLSpanElement>("#perihelionAu");
const aphelionAuEl = document.querySelector<HTMLSpanElement>("#aphelionAu");
const rAuEl = document.querySelector<HTMLSpanElement>("#rAu");
const speedKmSEl = document.querySelector<HTMLSpanElement>("#speedKmS");

if (
  !aAuEl ||
  !aAuValueEl ||
  !eccEl ||
  !eccValueEl ||
  !newtonModeEl ||
  !centralMassEl ||
  !centralMassValueEl ||
  !meanAnomalyEl ||
  !meanAnomalyValueEl ||
  !showApsidesEl ||
  !showEqualAreasEl ||
  !showVelocityEl ||
  !animateEl ||
  !motionNoteEl ||
  !stationModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !canvasEl ||
  !periodYrEl ||
  !perihelionAuEl ||
  !aphelionAuEl ||
  !rAuEl ||
  !speedKmSEl
) {
  throw new Error("Missing required DOM elements for keplers-laws demo.");
}

const ctxEl = canvasEl.getContext("2d");
if (!ctxEl) throw new Error("Canvas 2D context unavailable.");

const aAu = aAuEl;
const aAuValue = aAuValueEl;
const ecc = eccEl;
const eccValue = eccValueEl;
const newtonMode = newtonModeEl;
const centralMassSolar = centralMassEl;
const centralMassValue = centralMassValueEl;
const meanAnomalyDeg = meanAnomalyEl;
const meanAnomalyValue = meanAnomalyValueEl;
const showApsides = showApsidesEl;
const showEqualAreas = showEqualAreasEl;
const showVelocity = showVelocityEl;
const animateButton = animateEl;
const motionNote = motionNoteEl;
const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;
const canvas = canvasEl;
const ctx = ctxEl;
const periodYrValue = periodYrEl;
const perihelionAuValue = perihelionAuEl;
const aphelionAuValue = aphelionAuEl;
const rAuValue = rAuEl;
const speedKmSValue = speedKmSEl;

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function cssVar(name: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (value.length === 0) throw new Error(`Missing required CSS variable: ${name}`);
  return value;
}

const canvasTheme = {
  orbit: cssVar("--cp-border"),
  axes: cssVar("--cp-border-subtle"),
  text: cssVar("--cp-text"),
  muted: cssVar("--cp-muted"),
  sun: cssVar("--cp-warning"),
  planet: cssVar("--cp-chart-1"),
  area: cssVar("--cp-glow-violet"),
  vector: cssVar("--cp-chart-2")
};

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

function currentInputs(): { aAu: number; e: number; centralMassSolar: number; meanAnomalyDeg: number } {
  const a = clamp(Number(aAu.value), 0.3, 12);
  const e = KeplersLawsModel.clampEccentricity(Number(ecc.value));
  const m = newtonMode.checked ? clamp(Number(centralMassSolar.value), 0.2, 4) : 1;
  const Mdeg = clamp(Number(meanAnomalyDeg.value), 0, 360);
  return { aAu: a, e, centralMassSolar: m, meanAnomalyDeg: Mdeg };
}

function orbitViewBounds(inputs: { aAu: number; e: number }) {
  const { aAu: a, e } = inputs;
  const { perihelionAu: rp, aphelionAu: ra } = KeplersLawsModel.orbitExtremaAu({ aAu: a, e });
  const b = a * Math.sqrt(1 - e * e);
  const pad = 0.2 * a;
  return {
    xMin: -ra - pad,
    xMax: rp + pad,
    yMax: b + pad
  };
}

function drawArrow(args: { x: number; y: number; dx: number; dy: number; color: string }) {
  const { x, y, dx, dy, color } = args;
  const len = Math.hypot(dx, dy);
  if (!(len > 0)) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();

  const ux = dx / len;
  const uy = dy / len;
  const head = 10;
  const wing = 6;
  const hx = x + dx;
  const hy = y + dy;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - head * ux + wing * -uy, hy - head * uy + wing * ux);
  ctx.lineTo(hx - head * ux - wing * -uy, hy - head * uy - wing * ux);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render() {
  const inputs = currentInputs();
  const meanAnomalyRad = AstroUnits.degToRad(inputs.meanAnomalyDeg);
  const state = KeplersLawsModel.stateAtMeanAnomalyRad({
    aAu: inputs.aAu,
    e: inputs.e,
    centralMassSolar: inputs.centralMassSolar,
    meanAnomalyRad
  });

  const periodYr = KeplersLawsModel.orbitalPeriodYr({
    aAu: inputs.aAu,
    centralMassSolar: inputs.centralMassSolar
  });
  const extrema = KeplersLawsModel.orbitExtremaAu({ aAu: inputs.aAu, e: inputs.e });
  const speedKmS = AstroUnits.auPerYrToKmPerS(state.speedAuPerYr);

  aAuValue.textContent = `${formatNumber(inputs.aAu, 2)} AU`;
  eccValue.textContent = formatNumber(inputs.e, 2);
  centralMassValue.textContent = `${formatNumber(inputs.centralMassSolar, 2)} M☉`;
  meanAnomalyValue.textContent = `${Math.round(inputs.meanAnomalyDeg)}°`;

  periodYrValue.textContent = formatNumber(periodYr, 3);
  perihelionAuValue.textContent = formatNumber(extrema.perihelionAu, 3);
  aphelionAuValue.textContent = formatNumber(extrema.aphelionAu, 3);
  rAuValue.textContent = formatNumber(state.rAu, 3);
  speedKmSValue.textContent = formatNumber(speedKmS, 2);

  const { width: w, height: h } = resizeCanvasToCssPixels(canvas, ctx);
  ctx.clearRect(0, 0, w, h);

  const bounds = orbitViewBounds(inputs);
  const margin = 36;
  const plotW = Math.max(1, w - 2 * margin);
  const plotH = Math.max(1, h - 2 * margin);
  const scale = Math.min(plotW / (bounds.xMax - bounds.xMin), plotH / (2 * bounds.yMax));

  const cx = margin + (-bounds.xMin) * scale;
  const cy = h / 2;
  function toCanvas(xAu: number, yAu: number) {
    return { x: cx + xAu * scale, y: cy - yAu * scale };
  }

  // Axes (schematic).
  ctx.save();
  ctx.strokeStyle = canvasTheme.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, cy);
  ctx.lineTo(w - margin, cy);
  ctx.stroke();
  ctx.restore();

  // Equal-area slices: draw N triangles using equal mean-anomaly steps.
  if (showEqualAreas.checked) {
    const slices = 8;
    ctx.save();
    ctx.fillStyle = canvasTheme.area;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < slices; i++) {
      const m0 = (i * 2 * Math.PI) / slices;
      const m1 = ((i + 1) * 2 * Math.PI) / slices;
      const s0 = KeplersLawsModel.stateAtMeanAnomalyRad({
        aAu: inputs.aAu,
        e: inputs.e,
        centralMassSolar: inputs.centralMassSolar,
        meanAnomalyRad: m0
      });
      const s1 = KeplersLawsModel.stateAtMeanAnomalyRad({
        aAu: inputs.aAu,
        e: inputs.e,
        centralMassSolar: inputs.centralMassSolar,
        meanAnomalyRad: m1
      });
      const p0 = toCanvas(0, 0);
      const p1 = toCanvas(s0.xAu, s0.yAu);
      const p2 = toCanvas(s1.xAu, s1.yAu);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Orbit path (sampled).
  ctx.save();
  ctx.strokeStyle = canvasTheme.orbit;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const samples = 360;
  for (let i = 0; i <= samples; i++) {
    const theta = (i * 2 * Math.PI) / samples;
    const r = KeplersLawsModel.stateAtMeanAnomalyRad({
      aAu: inputs.aAu,
      e: inputs.e,
      centralMassSolar: inputs.centralMassSolar,
      meanAnomalyRad: TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad: theta, e: inputs.e })
    });
    const pt = toCanvas(r.xAu, r.yAu);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.restore();

  // Sun at focus (origin).
  const sun = toCanvas(0, 0);
  ctx.save();
  ctx.fillStyle = canvasTheme.sun;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Foci + apsides overlay.
  if (showApsides.checked) {
    const focus2XAu = -2 * inputs.aAu * inputs.e;
    const f2 = toCanvas(focus2XAu, 0);
    const rp = toCanvas(extrema.perihelionAu, 0);
    const ra = toCanvas(-extrema.aphelionAu, 0);

    ctx.save();
    ctx.strokeStyle = canvasTheme.axes;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(ra.x, ra.y);
    ctx.lineTo(rp.x, rp.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = canvasTheme.muted;
    ctx.globalAlpha = 0.9;
    for (const p of [f2, rp, ra]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Planet marker.
  const planet = toCanvas(state.xAu, state.yAu);
  ctx.save();
  ctx.fillStyle = canvasTheme.planet;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Velocity vector.
  if (showVelocity.checked) {
    const peri = KeplersLawsModel.stateAtMeanAnomalyRad({
      aAu: inputs.aAu,
      e: inputs.e,
      centralMassSolar: inputs.centralMassSolar,
      meanAnomalyRad: 0
    });
    const aph = KeplersLawsModel.stateAtMeanAnomalyRad({
      aAu: inputs.aAu,
      e: inputs.e,
      centralMassSolar: inputs.centralMassSolar,
      meanAnomalyRad: Math.PI
    });
    const maxSpeed = Math.max(peri.speedAuPerYr, aph.speedAuPerYr, state.speedAuPerYr);
    const vScaleAuToPx =
      maxSpeed > 0 ? (0.22 * Math.min(plotW, plotH)) / maxSpeed : 0;
    drawArrow({
      x: planet.x,
      y: planet.y,
      dx: state.vxAuPerYr * vScaleAuToPx,
      dy: -state.vyAuPerYr * vScaleAuToPx,
      color: canvasTheme.vector
    });
  }

  // Labels.
  ctx.save();
  ctx.fillStyle = canvasTheme.text;
  ctx.font = `600 14px ${cssVar("--cp-font-sans")}`;
  ctx.fillText("Sun (focus)", sun.x + 12, sun.y - 10);
  ctx.restore();
}

function syncNewtonModeUI() {
  if (newtonMode.checked) {
    centralMassSolar.disabled = false;
    centralMassSolar.setAttribute("aria-disabled", "false");
  } else {
    centralMassSolar.disabled = true;
    centralMassSolar.setAttribute("aria-disabled", "true");
    centralMassSolar.value = "1";
  }
}

let isAnimating = false;
let rafId = 0;
let lastT = 0;
const meanAnomalyDegPerSecond = 36;

function stopAnimation() {
  if (!isAnimating) return;
  isAnimating = false;
  animateButton.textContent = "Animate";
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  lastT = 0;
}

function startAnimation() {
  if (prefersReducedMotion) return;
  if (isAnimating) return;
  isAnimating = true;
  animateButton.textContent = "Stop";

  const tick = (t: number) => {
    if (!isAnimating) return;
    if (!lastT) lastT = t;
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;

    const next = (Number(meanAnomalyDeg.value) + meanAnomalyDegPerSecond * dt) % 360;
    meanAnomalyDeg.value = String(next);
    render();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function exportResults(): ExportPayloadV1 {
  const inputs = currentInputs();
  const meanAnomalyRad = AstroUnits.degToRad(inputs.meanAnomalyDeg);
  const state = KeplersLawsModel.stateAtMeanAnomalyRad({
    aAu: inputs.aAu,
    e: inputs.e,
    centralMassSolar: inputs.centralMassSolar,
    meanAnomalyRad
  });

  const periodYr = KeplersLawsModel.orbitalPeriodYr({
    aAu: inputs.aAu,
    centralMassSolar: inputs.centralMassSolar
  });
  const extrema = KeplersLawsModel.orbitExtremaAu({ aAu: inputs.aAu, e: inputs.e });
  const speedKmS = AstroUnits.auPerYrToKmPerS(state.speedAuPerYr);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Semi-major axis a (AU)", value: formatNumber(inputs.aAu, 3) },
      { name: "Eccentricity e", value: formatNumber(inputs.e, 3) },
      { name: "Central mass M (M☉)", value: formatNumber(inputs.centralMassSolar, 3) },
      { name: "Mean anomaly M (deg)", value: String(Math.round(inputs.meanAnomalyDeg)) }
    ],
    readouts: [
      { name: "Orbital period P (yr)", value: formatNumber(periodYr, 6) },
      { name: "Perihelion r_p (AU)", value: formatNumber(extrema.perihelionAu, 6) },
      { name: "Aphelion r_a (AU)", value: formatNumber(extrema.aphelionAu, 6) },
      { name: "Current distance r (AU)", value: formatNumber(state.rAu, 6) },
      { name: "Speed v (km/s)", value: formatNumber(speedKmS, 6) }
    ],
    notes: [
      "Teaching units: AU / yr / M☉ with G = 4π² AU³/(yr²·M☉).",
      "Kepler 3: P² = a³/M in these units.",
      "The time slider advances mean anomaly uniformly (a time proxy), producing varying speed around an ellipse."
    ]
  };
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:keplers-laws:mode",
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
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Increase eccentricity e and compare the speed near perihelion vs aphelion.",
          "Turn on “equal-area slices” and notice the areas look similar even though the arc lengths differ.",
          "Change a to see period scaling: P grows quickly with orbit size (P ∝ a^(3/2) when M is fixed)."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Kepler’s Laws",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Pick an orbit (a, e).",
      "Record a snapshot at two different times (mean anomaly) and compare r and v.",
      "Double a (same M) and record how P changes."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "aAu", label: "a (AU)" },
      { key: "e", label: "e" },
      { key: "mSolar", label: "M (M☉)" },
      { key: "meanAnomalyDeg", label: "M (deg)" },
      { key: "periodYr", label: "P (yr)" },
      { key: "rAu", label: "r (AU)" },
      { key: "vKmS", label: "v (km/s)" }
    ],
    getSnapshotRow() {
      const inputs = currentInputs();
      const meanAnomalyRad = AstroUnits.degToRad(inputs.meanAnomalyDeg);
      const st = KeplersLawsModel.stateAtMeanAnomalyRad({
        aAu: inputs.aAu,
        e: inputs.e,
        centralMassSolar: inputs.centralMassSolar,
        meanAnomalyRad
      });
      const periodYr = KeplersLawsModel.orbitalPeriodYr({
        aAu: inputs.aAu,
        centralMassSolar: inputs.centralMassSolar
      });
      const vKmS = AstroUnits.auPerYrToKmPerS(st.speedAuPerYr);
      return {
        case: "Snapshot",
        aAu: formatNumber(inputs.aAu, 3),
        e: formatNumber(inputs.e, 3),
        mSolar: formatNumber(inputs.centralMassSolar, 3),
        meanAnomalyDeg: String(Math.round(inputs.meanAnomalyDeg)),
        periodYr: formatNumber(periodYr, 3),
        rAu: formatNumber(st.rAu, 3),
        vKmS: formatNumber(vKmS, 2)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add solar-system examples (M=1)",
        getRows() {
          const cases = [
            { label: "Earth", aAu: 1.0, e: 0.017 },
            { label: "Mars", aAu: 1.524, e: 0.093 },
            { label: "Jupiter", aAu: 5.204, e: 0.049 }
          ];
          return cases.map((c) => {
            const periodYr = KeplersLawsModel.orbitalPeriodYr({ aAu: c.aAu, centralMassSolar: 1 });
            const st = KeplersLawsModel.stateAtMeanAnomalyRad({
              aAu: c.aAu,
              e: c.e,
              centralMassSolar: 1,
              meanAnomalyRad: 0
            });
            const vKmS = AstroUnits.auPerYrToKmPerS(st.speedAuPerYr);
            return {
              case: c.label,
              aAu: formatNumber(c.aAu, 3),
              e: formatNumber(c.e, 3),
              mSolar: "1.000",
              meanAnomalyDeg: "0",
              periodYr: formatNumber(periodYr, 3),
              rAu: formatNumber(st.rAu, 3),
              vKmS: formatNumber(vKmS, 2)
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> In one sentence, explain why equal areas in equal times implies faster motion near perihelion.</p>"
  }
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

syncNewtonModeUI();
render();

newtonMode.addEventListener("change", () => {
  stopAnimation();
  syncNewtonModeUI();
  render();
});

aAu.addEventListener("input", () => {
  stopAnimation();
  render();
});
ecc.addEventListener("input", () => {
  stopAnimation();
  render();
});
centralMassSolar.addEventListener("input", () => {
  stopAnimation();
  render();
});
meanAnomalyDeg.addEventListener("input", () => {
  stopAnimation();
  render();
});
showApsides.addEventListener("change", render);
showEqualAreas.addEventListener("change", render);
showVelocity.addEventListener("change", render);

if (prefersReducedMotion) {
  animateButton.disabled = true;
  motionNote.hidden = false;
  motionNote.textContent = "Reduced motion: animation is disabled (use the time slider).";
} else {
  animateButton.addEventListener("click", () => {
    if (isAnimating) stopAnimation();
    else startAnimation();
  });
}

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => render()).observe(canvas);
} else {
  window.addEventListener("resize", () => render());
}

copyResults.addEventListener("click", () => {
  stopAnimation();
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) =>
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      )
    );
});

initMath(document);
