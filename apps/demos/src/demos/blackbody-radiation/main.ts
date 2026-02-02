import { createDemoModes, createInstrumentRuntime, initMath, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { BlackbodyRadiationModel } from "@cosmic/physics";

const tempSliderEl = document.querySelector<HTMLInputElement>("#tempSlider");
const tempValueEl = document.querySelector<HTMLSpanElement>("#tempValue");
const scaleLogEl = document.querySelector<HTMLButtonElement>("#scaleLog");
const scaleLinearEl = document.querySelector<HTMLButtonElement>("#scaleLinear");
const showVisibleBandEl = document.querySelector<HTMLInputElement>("#showVisibleBand");
const showPeakMarkerEl = document.querySelector<HTMLInputElement>("#showPeakMarker");
const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button.preset[data-temp-k]')
);

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const canvasEl = document.querySelector<HTMLCanvasElement>("#spectrumCanvas");
const starCircleEl = document.querySelector<HTMLDivElement>("#starCircle");
const spectralClassEl = document.querySelector<HTMLSpanElement>("#spectralClass");
const colorNameEl = document.querySelector<HTMLSpanElement>("#colorName");
const peakNmEl = document.querySelector<HTMLSpanElement>("#peakNm");
const lumRatioEl = document.querySelector<HTMLSpanElement>("#lumRatio");

if (
  !tempSliderEl ||
  !tempValueEl ||
  !scaleLogEl ||
  !scaleLinearEl ||
  !showVisibleBandEl ||
  !showPeakMarkerEl ||
  !stationModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !canvasEl ||
  !starCircleEl ||
  !spectralClassEl ||
  !colorNameEl ||
  !peakNmEl ||
  !lumRatioEl
) {
  throw new Error("Missing required DOM elements for blackbody-radiation demo.");
}

const ctxEl = canvasEl.getContext("2d");
if (!ctxEl) throw new Error("Canvas 2D context unavailable.");

const tempSlider = tempSliderEl;
const tempValue = tempValueEl;
const scaleLog = scaleLogEl;
const scaleLinear = scaleLinearEl;
const showVisibleBand = showVisibleBandEl;
const showPeakMarker = showPeakMarkerEl;
const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;
const canvas = canvasEl;
const ctx = ctxEl;
const starCircle = starCircleEl;
const spectralClass = spectralClassEl;
const colorName = colorNameEl;
const peakNmValue = peakNmEl;
const lumRatioValue = lumRatioEl;

type IntensityScale = "log" | "linear";

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:blackbody-radiation:mode",
  url: new URL(window.location.href)
});

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TEMPERATURE_MIN_K = 2.725;
const TEMPERATURE_MAX_K = 1e6;

const state: {
  temperatureK: number;
  intensityScale: IntensityScale;
} = {
  temperatureK: 5778,
  intensityScale: "log"
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function logSliderToValue(sliderVal: number, minVal: number, maxVal: number): number {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

function valueToLogSlider(value: number, minVal: number, maxVal: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const frac = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(frac * 1000), 0, 1000);
}

function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

function resizeCanvasToCssPixels(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function cssVar(name: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (value.length === 0) throw new Error(`Missing required CSS variable: ${name}`);
  return value;
}

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

const canvasTheme = {
  bg: resolveCssColor(cssVar("--cp-bg0")),
  grid: resolveCssColor(cssVar("--cp-border-subtle")),
  curve: resolveCssColor(cssVar("--cp-chart-1")),
  highlight: resolveCssColor(cssVar("--cp-glow-teal")),
  peak: resolveCssColor(cssVar("--cp-chart-2")),
  text: resolveCssColor(cssVar("--cp-text2"))
};

function wavelengthDomainNm() {
  // Keep a wide domain so very cool and very hot objects still place their peak somewhere sensible.
  return { minNm: 10, maxNm: 1e6 };
}

function sampleLogSpace(min: number, max: number, n: number): number[] {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push(Math.pow(10, minLog + t * (maxLog - minLog)));
  }
  return out;
}

function drawSpectrum() {
  const { width: w, height: h } = resizeCanvasToCssPixels(canvas, ctx);
  ctx.clearRect(0, 0, w, h);

  // Background fill (canvas CSS background is not guaranteed after resizing).
  ctx.save();
  ctx.fillStyle = canvasTheme.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const margin = 44;
  const plotW = Math.max(1, w - 2 * margin);
  const plotH = Math.max(1, h - 2 * margin);

  const { minNm, maxNm } = wavelengthDomainNm();
  const wavelengthsNm = sampleLogSpace(minNm, maxNm, 480);
  const radiance = wavelengthsNm.map((nm) =>
    BlackbodyRadiationModel.planckSpectralRadianceCgs({
      wavelengthCm: nm * BlackbodyRadiationModel.CONSTANTS.nmToCm,
      temperatureK: state.temperatureK
    })
  );

  const maxB = Math.max(...radiance);
  const peakNm = BlackbodyRadiationModel.wienPeakNm(state.temperatureK);

  // Visible band (approx) — emphasize as a region, not as a rainbow.
  if (showVisibleBand.checked) {
    const vMin = 380;
    const vMax = 750;
    const x0 = margin + (Math.log10(vMin) - Math.log10(minNm)) / (Math.log10(maxNm) - Math.log10(minNm)) * plotW;
    const x1 = margin + (Math.log10(vMax) - Math.log10(minNm)) / (Math.log10(maxNm) - Math.log10(minNm)) * plotW;
    ctx.save();
    ctx.fillStyle = canvasTheme.highlight;
    ctx.fillRect(x0, margin, x1 - x0, plotH);
    ctx.restore();
  }

  // Grid lines.
  ctx.save();
  ctx.strokeStyle = canvasTheme.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const x = margin + (i / 8) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, margin);
    ctx.lineTo(x, margin + plotH);
    ctx.stroke();
  }
  for (let i = 0; i <= 6; i++) {
    const y = margin + (i / 6) * plotH;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(margin + plotW, y);
    ctx.stroke();
  }
  ctx.restore();

  // Curve.
  ctx.save();
  ctx.strokeStyle = canvasTheme.curve;
  ctx.lineWidth = 2;
  ctx.beginPath();

  if (state.intensityScale === "linear") {
    for (let i = 0; i < wavelengthsNm.length; i++) {
      const t = i / (wavelengthsNm.length - 1);
      const x = margin + t * plotW;
      const yNorm = maxB > 0 ? radiance[i] / maxB : 0;
      const y = margin + plotH * (1 - clamp(yNorm, 0, 1));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else {
    const logB = radiance.map((b) => (b > 0 ? Math.log10(b) : -Infinity));
    const maxLog = Math.max(...logB);
    const minLog = maxLog - 6;
    let started = false;
    for (let i = 0; i < wavelengthsNm.length; i++) {
      const t = i / (wavelengthsNm.length - 1);
      const x = margin + t * plotW;
      const v = logB[i];
      if (!(v > -Infinity) || v < minLog) {
        if (started) {
          ctx.stroke();
          ctx.beginPath();
          started = false;
        }
        continue;
      }
      const yNorm = (v - minLog) / (maxLog - minLog);
      const y = margin + plotH * (1 - clamp(yNorm, 0, 1));
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
  }

  ctx.stroke();
  ctx.restore();

  // Peak marker.
  if (showPeakMarker.checked && Number.isFinite(peakNm)) {
    const x =
      margin +
      ((Math.log10(peakNm) - Math.log10(minNm)) / (Math.log10(maxNm) - Math.log10(minNm))) * plotW;
    ctx.save();
    ctx.strokeStyle = canvasTheme.peak;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, margin);
    ctx.lineTo(x, margin + plotH);
    ctx.stroke();

    ctx.fillStyle = canvasTheme.text;
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(peakNm)} nm`, x, margin - 10);
    ctx.restore();
  }
}

function render() {
  const tempK = clamp(state.temperatureK, TEMPERATURE_MIN_K, TEMPERATURE_MAX_K);
  state.temperatureK = tempK;

  const sliderVal = valueToLogSlider(tempK, TEMPERATURE_MIN_K, TEMPERATURE_MAX_K);
  if (Number(tempSlider.value) !== sliderVal) tempSlider.value = String(sliderVal);

  tempSlider.setAttribute("aria-valuemin", String(TEMPERATURE_MIN_K));
  tempSlider.setAttribute("aria-valuemax", String(TEMPERATURE_MAX_K));
  tempSlider.setAttribute("aria-valuenow", formatNumber(tempK, 0));

  tempValue.textContent = `${formatNumber(tempK, 0)} K`;

  const peakNm = BlackbodyRadiationModel.wienPeakNm(tempK);
  const lumRatio = BlackbodyRadiationModel.luminosityRatioSameRadius({ temperatureK: tempK });
  const rgb = BlackbodyRadiationModel.temperatureToRgbApprox({ temperatureK: tempK });
  const classLetter = BlackbodyRadiationModel.spectralClassLetter({ temperatureK: tempK });
  const name = BlackbodyRadiationModel.colorName({ temperatureK: tempK });

  peakNmValue.textContent = Number.isFinite(peakNm) ? String(Math.round(peakNm)) : "—";
  lumRatioValue.textContent = formatNumber(lumRatio, 3);
  spectralClass.textContent = classLetter;
  colorName.textContent = name;
  starCircle.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  drawSpectrum();
}

function exportResults(): ExportPayloadV1 {
  const peakNm = BlackbodyRadiationModel.wienPeakNm(state.temperatureK);
  const lumRatio = BlackbodyRadiationModel.luminosityRatioSameRadius({ temperatureK: state.temperatureK });
  const classLetter = BlackbodyRadiationModel.spectralClassLetter({ temperatureK: state.temperatureK });
  const name = BlackbodyRadiationModel.colorName({ temperatureK: state.temperatureK });

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mode", value: runtime.mode },
      { name: "Temperature T (K)", value: formatNumber(state.temperatureK, 0) },
      { name: "Intensity scale", value: state.intensityScale }
    ],
    readouts: [
      { name: "Peak wavelength λ_peak (nm)", value: Number.isFinite(peakNm) ? String(Math.round(peakNm)) : "—" },
      { name: "Luminosity ratio L/L☉ (same radius)", value: formatNumber(lumRatio, 6) },
      { name: "Color name (approx)", value: name },
      { name: "Spectral class (approx)", value: classLetter }
    ],
    notes: [
      "Curve generated from Planck’s law and plotted in relative (normalized) intensity.",
      "Units: wavelength λ is cm internally (displayed in nm); temperature T is K.",
      "Star color preview is a perceptual approximation (not full colorimetry)."
    ]
  };
}

function setIntensityScale(next: IntensityScale) {
  state.intensityScale = next;
  scaleLog.setAttribute("aria-pressed", String(next === "log"));
  scaleLinear.setAttribute("aria-pressed", String(next === "linear"));
}

setIntensityScale(state.intensityScale);

scaleLog.addEventListener("click", () => {
  setIntensityScale("log");
  render();
});

scaleLinear.addEventListener("click", () => {
  setIntensityScale("linear");
  render();
});

tempSlider.addEventListener("input", () => {
  const value = clamp(Number(tempSlider.value), 0, 1000);
  state.temperatureK = logSliderToValue(value, TEMPERATURE_MIN_K, TEMPERATURE_MAX_K);
  render();
});

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const raw = button.getAttribute("data-temp-k");
    const next = raw ? Number(raw) : NaN;
    if (!Number.isFinite(next)) return;
    state.temperatureK = next;
    render();
  });
}

window.addEventListener("resize", () => render());

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
          "Move the temperature slider and watch the peak shift left/right.",
          "Turn on the visible-band highlight and notice when the peak is in/near the visible range.",
          "Compare two temperatures: doubling T halves λ_peak and increases total emission strongly (∝ T^4)."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Blackbody Radiation",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Record a snapshot for the Sun (5772 K).",
      "Record a cooler star and a hotter star; compare λ_peak and luminosity ratio.",
      "Describe what 'color' means in astronomy using the peak and the visible-band region."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "tK", label: "T (K)" },
      { key: "peakNm", label: "λ_peak (nm)" },
      { key: "lumRatio", label: "L/L☉ (same R)" },
      { key: "class", label: "Class" },
      { key: "color", label: "Color (approx)" }
    ],
    getSnapshotRow() {
      const peakNm = BlackbodyRadiationModel.wienPeakNm(state.temperatureK);
      const lumRatio = BlackbodyRadiationModel.luminosityRatioSameRadius({ temperatureK: state.temperatureK });
      return {
        case: "Snapshot",
        tK: formatNumber(state.temperatureK, 0),
        peakNm: Number.isFinite(peakNm) ? String(Math.round(peakNm)) : "—",
        lumRatio: formatNumber(lumRatio, 3),
        class: BlackbodyRadiationModel.spectralClassLetter({ temperatureK: state.temperatureK }),
        color: BlackbodyRadiationModel.colorName({ temperatureK: state.temperatureK })
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add sequence examples",
        getRows() {
          const cases = [
            { label: "M dwarf", temperatureK: 3000 },
            { label: "Sun", temperatureK: 5772 },
            { label: "A/B star", temperatureK: 10000 },
            { label: "CMB", temperatureK: 2.725 }
          ];
          return cases.map((c) => {
            const peakNm = BlackbodyRadiationModel.wienPeakNm(c.temperatureK);
            const lumRatio = BlackbodyRadiationModel.luminosityRatioSameRadius({ temperatureK: c.temperatureK });
            return {
              case: c.label,
              tK: formatNumber(c.temperatureK, 0),
              peakNm: Number.isFinite(peakNm) ? String(Math.round(peakNm)) : "—",
              lumRatio: formatNumber(lumRatio, 3),
              class: BlackbodyRadiationModel.spectralClassLetter({ temperatureK: c.temperatureK }),
              color: BlackbodyRadiationModel.colorName({ temperatureK: c.temperatureK })
            };
          });
        }
      }
    ]
  }
});

demoModes.bindButtons({ helpButton, stationButton: stationModeButton });

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(status, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.");
    });
});

if (prefersReducedMotion) {
  setLiveRegionText(status, "Reduced motion is enabled; the spectrum updates without animation.");
}

render();
initMath(document);
