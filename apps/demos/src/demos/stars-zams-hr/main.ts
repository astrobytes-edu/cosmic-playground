import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  setLiveRegionText
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { BlackbodyRadiationModel, ZamsTout1996Model } from "@cosmic/physics";
import {
  clamp,
  formatMetallicity,
  formatNumber,
  hrDiagramCoordinates,
  logSliderToValue,
  valueToLogSlider
} from "./logic";

type PresetMode = "zams" | "override";
type PresetState = "inferred" | "override";

type DemoState = {
  massMsun: number;
  metallicityZ: number;
  presetState: PresetState;
  selectedPresetId: string | null;
  override: {
    teffK: number;
    radiusRsun: number;
  } | null;
};

type StarReadouts = {
  massMsun: number;
  metallicityZ: number;
  luminosityLsun: number;
  radiusRsun: number;
  teffK: number;
  validityText: string;
  presetState: PresetState;
};

const MASS_MIN_MSUN = ZamsTout1996Model.CONSTANTS.massMinMsun;
const MASS_MAX_MSUN = ZamsTout1996Model.CONSTANTS.massMaxMsun;
const METALLICITY_MIN = ZamsTout1996Model.CONSTANTS.metallicityMin;
const METALLICITY_MAX = ZamsTout1996Model.CONSTANTS.metallicityMax;
const TSUN_K = ZamsTout1996Model.CONSTANTS.tSunK;

const massSliderEl = document.querySelector<HTMLInputElement>("#massSlider");
const massValueEl = document.querySelector<HTMLSpanElement>("#massValue");
const metallicitySliderEl = document.querySelector<HTMLInputElement>("#metallicitySlider");
const metallicityValueEl = document.querySelector<HTMLSpanElement>("#metallicityValue");
const massReadoutEl = document.querySelector<HTMLSpanElement>("#massReadout");
const teffValueEl = document.querySelector<HTMLSpanElement>("#teffValue");
const luminosityValueEl = document.querySelector<HTMLSpanElement>("#luminosityValue");
const radiusValueEl = document.querySelector<HTMLSpanElement>("#radiusValue");
const validityBadgeEl = document.querySelector<HTMLParagraphElement>("#validityBadge");
const overrideModeHintEl = document.querySelector<HTMLParagraphElement>("#overrideModeHint");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");
const hrCanvasEl = document.querySelector<HTMLCanvasElement>("#hrCanvas");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");

const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button.preset[data-preset-id]')
);

if (
  !massSliderEl ||
  !massValueEl ||
  !metallicitySliderEl ||
  !metallicityValueEl ||
  !massReadoutEl ||
  !teffValueEl ||
  !luminosityValueEl ||
  !radiusValueEl ||
  !validityBadgeEl ||
  !overrideModeHintEl ||
  !statusEl ||
  !hrCanvasEl ||
  !copyResultsEl ||
  !stationModeEl ||
  !helpEl ||
  presetButtons.length === 0
) {
  throw new Error("Missing required DOM elements for stars-zams-hr demo.");
}

const massSlider = massSliderEl;
const massValue = massValueEl;
const metallicitySlider = metallicitySliderEl;
const metallicityValue = metallicityValueEl;
const massReadout = massReadoutEl;
const teffValue = teffValueEl;
const luminosityValue = luminosityValueEl;
const radiusValue = radiusValueEl;
const validityBadge = validityBadgeEl;
const overrideModeHint = overrideModeHintEl;
const status = statusEl;
const hrCanvas = hrCanvasEl;
const copyResults = copyResultsEl;
const stationMode = stationModeEl;
const help = helpEl;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:stars-zams-hr:mode",
  url: new URL(window.location.href)
});

const state: DemoState = {
  massMsun: 1,
  metallicityZ: 0.02,
  presetState: "inferred",
  selectedPresetId: "sun",
  override: null
};

function requireCanvas2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable for stars-zams-hr.");
  return context;
}

const ctx = requireCanvas2dContext(hrCanvas);

const colorProbe = document.createElement("span");
colorProbe.style.position = "absolute";
colorProbe.style.left = "-9999px";
colorProbe.style.top = "-9999px";
colorProbe.style.visibility = "hidden";
document.body.appendChild(colorProbe);

function resolveCssColor(raw: string): string {
  colorProbe.style.color = raw;
  return getComputedStyle(colorProbe).color;
}

function cssVar(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) throw new Error(`Missing required CSS variable: ${name}`);
  return value;
}

function sliderStepValue(event: KeyboardEvent): number {
  if (event.shiftKey) return 20;
  return 1;
}

function updateSliderKeyboardNudge(event: KeyboardEvent, slider: HTMLInputElement) {
  const key = event.key;
  if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") {
    return;
  }
  event.preventDefault();
  const step = sliderStepValue(event);
  const direction = key === "ArrowRight" || key === "ArrowUp" ? 1 : -1;
  const next = clamp(Number(slider.value) + direction * step, 0, 1000);
  slider.value = String(Math.round(next));
  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function setPresetButtons(activeId: string | null): void {
  for (const button of presetButtons) {
    const pressed = button.dataset.presetId === activeId;
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
  }
}

function setStateFromPreset(button: HTMLButtonElement): void {
  const presetId = button.dataset.presetId ?? null;
  const mode = (button.dataset.mode as PresetMode | undefined) ?? "zams";
  const massMsun = Number(button.dataset.massMsun ?? Number.NaN);
  const metallicityZ = Number(button.dataset.metallicityZ ?? Number.NaN);
  if (!Number.isFinite(massMsun) || !Number.isFinite(metallicityZ)) return;

  state.massMsun = clamp(massMsun, MASS_MIN_MSUN, MASS_MAX_MSUN);
  state.metallicityZ = clamp(metallicityZ, METALLICITY_MIN, METALLICITY_MAX);
  state.selectedPresetId = presetId;

  if (mode === "override") {
    const teffK = Number(button.dataset.teffK ?? Number.NaN);
    const radiusRsun = Number(button.dataset.radiusRsun ?? Number.NaN);
    if (!Number.isFinite(teffK) || !Number.isFinite(radiusRsun) || radiusRsun <= 0) return;
    state.override = { teffK, radiusRsun };
    state.presetState = "override";
  } else {
    state.override = null;
    state.presetState = "inferred";
  }
}

function luminosityFromRadiusAndTemperature(args: {
  radiusRsun: number;
  teffK: number;
}): number {
  const { radiusRsun, teffK } = args;
  if (!Number.isFinite(radiusRsun) || radiusRsun <= 0) return Number.NaN;
  if (!Number.isFinite(teffK) || teffK <= 0) return Number.NaN;
  const tempRatio = teffK / TSUN_K;
  return radiusRsun * radiusRsun * tempRatio ** 4;
}

function computeReadouts(): StarReadouts {
  if (state.presetState === "override" && state.override) {
    const teffK = state.override.teffK;
    const radiusRsun = state.override.radiusRsun;
    const luminosityLsun = luminosityFromRadiusAndTemperature({ radiusRsun, teffK });
    return {
      massMsun: state.massMsun,
      metallicityZ: state.metallicityZ,
      teffK,
      radiusRsun,
      luminosityLsun,
      validityText:
        "Override preset: this object is intentionally not constrained to a ZAMS state. Metallicity is not applied in override mode.",
      presetState: "override"
    };
  }

  const zamsValidity = ZamsTout1996Model.validity({
    massMsun: state.massMsun,
    metallicityZ: state.metallicityZ
  });
  const luminosityLsun = ZamsTout1996Model.luminosityLsunFromMassMetallicity({
    massMsun: state.massMsun,
    metallicityZ: state.metallicityZ
  });
  const radiusRsun = ZamsTout1996Model.radiusRsunFromMassMetallicity({
    massMsun: state.massMsun,
    metallicityZ: state.metallicityZ
  });
  const teffK = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({
    massMsun: state.massMsun,
    metallicityZ: state.metallicityZ
  });

  return {
    massMsun: state.massMsun,
    metallicityZ: state.metallicityZ,
    teffK,
    radiusRsun,
    luminosityLsun,
    validityText: zamsValidity.valid
      ? "ZAMS inferred state from Tout et al. (1996)."
      : zamsValidity.warnings.join(" "),
    presetState: "inferred"
  };
}

function resizeCanvasToCssPixels(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1;
  const nextWidth = Math.max(1, Math.round(width * dpr));
  const nextHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function drawHrDiagram(readouts: StarReadouts): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(hrCanvas, ctx);
  const mL = 58;
  const mR = 16;
  const mT = 16;
  const mB = 44;
  const plotW = Math.max(1, w - mL - mR);
  const plotH = Math.max(1, h - mT - mB);

  const bg = resolveCssColor(cssVar("--cp-bg0"));
  const border = resolveCssColor(cssVar("--cp-border-subtle"));
  const text = resolveCssColor(cssVar("--cp-text2"));
  const track = resolveCssColor(cssVar("--cp-chart-1"));
  const markerFallback = resolveCssColor(cssVar("--cp-accent"));
  const overrideMarker = resolveCssColor(cssVar("--cp-chart-2"));

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i <= 6; i += 1) {
    const y = mT + (i / 6) * plotH;
    ctx.beginPath();
    ctx.moveTo(mL, y);
    ctx.lineTo(mL + plotW, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 6; i += 1) {
    const x = mL + (i / 6) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT + plotH);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = track;
  ctx.lineWidth = 2;
  const samples = 180;
  for (let i = 0; i < samples; i += 1) {
    const frac = i / (samples - 1);
    const massMsun = MASS_MIN_MSUN * (MASS_MAX_MSUN / MASS_MIN_MSUN) ** frac;
    const luminosityLsun = ZamsTout1996Model.luminosityLsunFromMassMetallicity({
      massMsun,
      metallicityZ: state.metallicityZ
    });
    const teffK = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({
      massMsun,
      metallicityZ: state.metallicityZ
    });
    if (!Number.isFinite(luminosityLsun) || !Number.isFinite(teffK)) continue;
    const point = hrDiagramCoordinates({
      teffK,
      luminosityLsun
    });
    const x = mL + point.xNorm * plotW;
    const y = mT + (1 - point.yNorm) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  const markerPoint = hrDiagramCoordinates({
    teffK: readouts.teffK,
    luminosityLsun: readouts.luminosityLsun
  });
  const markerX = mL + markerPoint.xNorm * plotW;
  const markerY = mT + (1 - markerPoint.yNorm) * plotH;

  const tempRgb = BlackbodyRadiationModel.temperatureToRgbApprox({
    temperatureK: readouts.teffK
  });
  const markerColor = readouts.presetState === "override"
    ? overrideMarker
    : `rgb(${tempRgb.r}, ${tempRgb.g}, ${tempRgb.b})`;

  ctx.save();
  ctx.fillStyle = markerColor || markerFallback;
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = resolveCssColor(cssVar("--cp-bg0"));
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = text;
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Hotter ←", mL, h - 12);
  ctx.textAlign = "center";
  ctx.fillText("Teff", mL + plotW * 0.5, h - 12);
  ctx.textAlign = "right";
  ctx.fillText("Cooler →", mL + plotW, h - 12);
  ctx.textAlign = "left";
  ctx.fillText("log L/Lsun ↑", 8, mT + 10);
  ctx.restore();
}

function renderReadouts(readouts: StarReadouts): void {
  massSlider.value = String(valueToLogSlider(readouts.massMsun, MASS_MIN_MSUN, MASS_MAX_MSUN));
  metallicitySlider.value = String(
    valueToLogSlider(readouts.metallicityZ, METALLICITY_MIN, METALLICITY_MAX)
  );
  massSlider.setAttribute("aria-valuetext", `${formatNumber(readouts.massMsun, 3)} solar masses`);
  metallicitySlider.setAttribute("aria-valuetext", `metallicity ${formatMetallicity(readouts.metallicityZ)}`);

  massValue.textContent = formatNumber(readouts.massMsun, 3);
  metallicityValue.textContent = formatMetallicity(readouts.metallicityZ);
  massReadout.textContent = formatNumber(readouts.massMsun, 3);
  teffValue.textContent = formatNumber(readouts.teffK, 0);
  luminosityValue.textContent = formatNumber(readouts.luminosityLsun, 4);
  radiusValue.textContent = formatNumber(readouts.radiusRsun, 4);
  validityBadge.textContent = readouts.validityText;

  const isOverride = readouts.presetState === "override";
  metallicitySlider.disabled = isOverride;
  metallicitySlider.setAttribute("aria-disabled", isOverride ? "true" : "false");
  metallicitySlider.title = isOverride
    ? "Metallicity is not applied while an override preset is active."
    : "";
  overrideModeHint.hidden = !isOverride;
}

function render(): void {
  const readouts = computeReadouts();
  renderReadouts(readouts);
  setPresetButtons(state.selectedPresetId);
  drawHrDiagram(readouts);
}

function exportResults(readouts: StarReadouts): ExportPayloadV1 {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mode", value: readouts.presetState === "override" ? "Override preset" : "ZAMS inferred" },
      { name: "Mass M (Msun)", value: formatNumber(readouts.massMsun, 6) },
      { name: "Metallicity Z", value: formatMetallicity(readouts.metallicityZ) }
    ],
    readouts: [
      { name: "Effective temperature Teff (K)", value: formatNumber(readouts.teffK, 6) },
      { name: "Luminosity L/Lsun", value: formatNumber(readouts.luminosityLsun, 6) },
      { name: "Radius R/Rsun", value: formatNumber(readouts.radiusRsun, 6) }
    ],
    notes: [
      "ZAMS inference uses Tout et al. (1996) over 0.1 <= M/Msun <= 100 and 1e-4 <= Z <= 0.03.",
      "Teff is derived from Stefan-Boltzmann closure: Teff = Tsun * [(L/Lsun)/(R/Rsun)^2]^(1/4).",
      readouts.presetState === "override"
        ? "Override presets intentionally bypass ZAMS fit to represent evolved or compact stars."
        : "Current state is on the ZAMS fit for the chosen mass and metallicity."
    ]
  };
}

massSlider.addEventListener("input", () => {
  state.massMsun = logSliderToValue(Number(massSlider.value), MASS_MIN_MSUN, MASS_MAX_MSUN);
  state.presetState = "inferred";
  state.override = null;
  state.selectedPresetId = null;
  render();
});

metallicitySlider.addEventListener("input", () => {
  state.metallicityZ = logSliderToValue(
    Number(metallicitySlider.value),
    METALLICITY_MIN,
    METALLICITY_MAX
  );
  if (state.presetState !== "override") {
    state.selectedPresetId = null;
  }
  render();
});

massSlider.addEventListener("keydown", (event) => updateSliderKeyboardNudge(event, massSlider));
metallicitySlider.addEventListener("keydown", (event) =>
  updateSliderKeyboardNudge(event, metallicitySlider)
);

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    setStateFromPreset(button);
    render();
  });
}

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
  const readouts = computeReadouts();
  void runtime
    .copyResults(exportResults(readouts))
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(status, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.");
    });
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
          { key: "g", action: "Toggle station mode" },
          { key: "Arrow keys", action: "Nudge focused slider" },
          { key: "Shift + Arrow", action: "Larger slider nudge" }
        ]
      },
      {
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Set mass and metallicity to move a star along the ZAMS track and read Teff, L/Lsun, and R/Rsun.",
          "Use metallicity changes at fixed mass to see how composition alters ZAMS radius and luminosity.",
          "Use override presets to compare evolved stars against the ZAMS reference curve."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Stars ZAMS and H-R",
    subtitle: "Capture snapshots, compare models, then copy CSV or print.",
    steps: [
      "Record Sun, a low-mass dwarf, and a high-mass star at the same metallicity.",
      "At fixed mass, change metallicity and record Teff, L/Lsun, and R/Rsun.",
      "Add one override preset and explain why it is flagged as non-ZAMS."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "mode", label: "Mode" },
      { key: "mMsun", label: "M (Msun)" },
      { key: "z", label: "Z" },
      { key: "teffK", label: "Teff (K)" },
      { key: "lumLsun", label: "L/Lsun" },
      { key: "radiusRsun", label: "R/Rsun" }
    ],
    getSnapshotRow() {
      const readouts = computeReadouts();
      return {
        case: state.selectedPresetId ? state.selectedPresetId : "Snapshot",
        mode: readouts.presetState === "override" ? "Override" : "ZAMS",
        mMsun: formatNumber(readouts.massMsun, 4),
        z: formatMetallicity(readouts.metallicityZ),
        teffK: formatNumber(readouts.teffK, 0),
        lumLsun: formatNumber(readouts.luminosityLsun, 6),
        radiusRsun: formatNumber(readouts.radiusRsun, 6)
      };
    },
    snapshotLabel: "Add row (snapshot)"
  }
});

demoModes.bindButtons({
  helpButton: help,
  stationButton: stationMode
});

window.addEventListener("resize", () => render());

render();
initMath(document);

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
}
