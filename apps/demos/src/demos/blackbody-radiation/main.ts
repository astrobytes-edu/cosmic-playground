import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, initTabs, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { BlackbodyRadiationModel } from "@cosmic/physics";
import { clamp, logSliderToValue, valueToLogSlider, formatNumber, wavelengthDomainNm, sampleLogSpace, wavelengthToApproxRgb, formatWavelengthLabel, wavelengthToLogFraction, formatWavelengthReadout } from "./logic";

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
const peakUnitEl = peakNmEl?.parentElement?.querySelector<HTMLSpanElement>(".cp-readout__unit");
const lumRatioEl = document.querySelector<HTMLSpanElement>("#lumRatio");
const tabExploreEl = document.querySelector<HTMLButtonElement>("#tab-explore");

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

/** Tick wavelengths for X-axis (log-scale divisions). */
const X_TICKS_NM = [10, 100, 1000, 10000, 100000, 1000000];
const FONT_LABEL = "bold 13px system-ui, -apple-system, sans-serif";
const FONT_TICK = "11px system-ui, -apple-system, sans-serif";
const FONT_PEAK = "bold 12px system-ui, -apple-system, sans-serif";
const EM_BAND_HEIGHT = 16;

function drawSpectrum() {
  const { width: w, height: h } = resizeCanvasToCssPixels(canvas, ctx);
  ctx.clearRect(0, 0, w, h);

  // Background fill
  ctx.save();
  ctx.fillStyle = canvasTheme.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Margins — extra room for axis labels, tick labels, and EM band bar
  const mL = 62, mR = 16, mT = 24, mB = 64;
  const plotW = Math.max(1, w - mL - mR);
  const plotH = Math.max(1, h - mT - mB);

  const { minNm, maxNm } = wavelengthDomainNm();
  const logMin = Math.log10(minNm);
  const logMax = Math.log10(maxNm);
  const wavelengthsNm = sampleLogSpace(minNm, maxNm, 500);
  const radiance = wavelengthsNm.map((nm) =>
    BlackbodyRadiationModel.planckSpectralRadianceCgs({
      wavelengthCm: nm * BlackbodyRadiationModel.CONSTANTS.nmToCm,
      temperatureK: state.temperatureK
    })
  );

  const maxB = Math.max(...radiance);
  const peakNm = BlackbodyRadiationModel.wienPeakNm(state.temperatureK);

  // Helper: wavelength nm -> x pixel
  const nmToX = (nm: number) => mL + wavelengthToLogFraction(nm, minNm, maxNm) * plotW;

  // --- Visible band highlight ---
  if (showVisibleBand.checked) {
    const vMin = 380, vMax = 750;
    const x0 = nmToX(vMin), x1 = nmToX(vMax);
    ctx.save();
    ctx.fillStyle = canvasTheme.highlight;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(x0, mT, x1 - x0, plotH);
    ctx.globalAlpha = 1;
    // "VISIBLE" label centered in band
    ctx.fillStyle = canvasTheme.text;
    ctx.globalAlpha = 0.5;
    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VISIBLE", (x0 + x1) / 2, mT + 14);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // --- Grid lines at X tick positions ---
  ctx.save();
  ctx.strokeStyle = canvasTheme.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (const tickNm of X_TICKS_NM) {
    const x = nmToX(tickNm);
    ctx.beginPath();
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT + plotH);
    ctx.stroke();
  }
  // Horizontal grid lines (6 divisions)
  for (let i = 0; i <= 6; i++) {
    const y = mT + (i / 6) * plotH;
    ctx.beginPath();
    ctx.moveTo(mL, y);
    ctx.lineTo(mL + plotW, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- Spectral gradient fill under curve ---
  // Build curve y-values first (shared with curve drawing)
  const curvePoints: { x: number; y: number; valid: boolean }[] = [];
  const logB = radiance.map((b) => (b > 0 ? Math.log10(b) : -Infinity));
  const maxLog = Math.max(...logB);
  const minLog = maxLog - 6;

  for (let i = 0; i < wavelengthsNm.length; i++) {
    const t = i / (wavelengthsNm.length - 1);
    const x = mL + t * plotW;
    let y: number;
    let valid: boolean;

    if (state.intensityScale === "linear") {
      const yNorm = maxB > 0 ? radiance[i] / maxB : 0;
      y = mT + plotH * (1 - clamp(yNorm, 0, 1));
      valid = true;
    } else {
      const v = logB[i];
      valid = v > -Infinity && v >= minLog;
      const yNorm = valid ? (v - minLog) / (maxLog - minLog) : 0;
      y = mT + plotH * (1 - clamp(yNorm, 0, 1));
    }
    curvePoints.push({ x, y, valid });
  }

  // Draw spectral gradient fill (visible portion gets rainbow, rest gets subtle glow)
  ctx.save();
  const grad = ctx.createLinearGradient(mL, 0, mL + plotW, 0);
  // UV region: dim violet
  grad.addColorStop(0, "rgba(20, 0, 40, 0.12)");
  // Visible spectrum stops
  const specStops: [number, string][] = [
    [380, "rgba(100, 0, 180, 0.3)"],
    [420, "rgba(80, 0, 255, 0.3)"],
    [460, "rgba(0, 80, 255, 0.3)"],
    [490, "rgba(0, 200, 255, 0.28)"],
    [520, "rgba(0, 220, 0, 0.25)"],
    [560, "rgba(200, 220, 0, 0.25)"],
    [590, "rgba(255, 180, 0, 0.28)"],
    [620, "rgba(255, 80, 0, 0.3)"],
    [680, "rgba(200, 0, 0, 0.25)"],
    [750, "rgba(100, 0, 0, 0.15)"]
  ];
  for (const [nm, color] of specStops) {
    const frac = wavelengthToLogFraction(nm, minNm, maxNm);
    grad.addColorStop(clamp(frac, 0.001, 0.999), color);
  }
  // IR region: dim red
  grad.addColorStop(1, "rgba(15, 0, 0, 0.06)");

  // Build filled path under the curve
  ctx.beginPath();
  let fillStarted = false;
  for (const pt of curvePoints) {
    if (!pt.valid && state.intensityScale !== "linear") continue;
    if (!fillStarted) {
      ctx.moveTo(pt.x, mT + plotH); // bottom
      ctx.lineTo(pt.x, pt.y);
      fillStarted = true;
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  }
  // Close path back to bottom
  if (fillStarted) {
    const lastValid = [...curvePoints].reverse().find(p => p.valid || state.intensityScale === "linear");
    if (lastValid) {
      ctx.lineTo(lastValid.x, mT + plotH);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();

  // --- Draw the Planck curve ---
  ctx.save();
  ctx.strokeStyle = canvasTheme.curve;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let started = false;
  for (const pt of curvePoints) {
    if (!pt.valid && state.intensityScale !== "linear") {
      if (started) { ctx.stroke(); ctx.beginPath(); started = false; }
      continue;
    }
    if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.restore();

  // --- Peak marker ---
  if (showPeakMarker.checked && Number.isFinite(peakNm)) {
    const x = nmToX(peakNm);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = canvasTheme.peak;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Peak label above plot (adjust alignment near edges)
    ctx.fillStyle = canvasTheme.peak;
    ctx.font = FONT_PEAK;
    const peakFrac = (x - mL) / plotW;
    ctx.textAlign = peakFrac < 0.08 ? "left" : peakFrac > 0.92 ? "right" : "center";
    ctx.fillText(formatWavelengthLabel(peakNm), x, mT - 6);
    ctx.restore();
  }

  // --- Plot border ---
  ctx.save();
  ctx.strokeStyle = canvasTheme.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(mL, mT, plotW, plotH);
  ctx.restore();

  // --- X-axis tick labels ---
  ctx.save();
  ctx.fillStyle = canvasTheme.text;
  ctx.font = FONT_TICK;
  ctx.textAlign = "center";
  for (const tickNm of X_TICKS_NM) {
    const x = nmToX(tickNm);
    // Tick mark
    ctx.beginPath();
    ctx.strokeStyle = canvasTheme.text;
    ctx.lineWidth = 1;
    ctx.moveTo(x, mT + plotH);
    ctx.lineTo(x, mT + plotH + 5);
    ctx.stroke();
    // Label
    ctx.fillText(formatWavelengthLabel(tickNm), x, mT + plotH + 16);
  }
  ctx.restore();

  // --- EM spectrum band bar (below tick labels) ---
  const bandTop = mT + plotH + 24;
  const bandH = EM_BAND_HEIGHT;
  ctx.save();
  // Draw the spectral band using many thin vertical strips
  const bandSteps = 200;
  for (let i = 0; i < bandSteps; i++) {
    const frac0 = i / bandSteps;
    const frac1 = (i + 1) / bandSteps;
    const x0 = mL + frac0 * plotW;
    const x1 = mL + frac1 * plotW;
    const nm = Math.pow(10, logMin + frac0 * (logMax - logMin));
    const rgb = wavelengthToApproxRgb(nm);
    if (rgb.r === 0 && rgb.g === 0 && rgb.b === 0) {
      // Non-visible: dark strip
      ctx.fillStyle = "rgba(20, 10, 20, 0.6)";
    } else {
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    ctx.fillRect(x0, bandTop, x1 - x0 + 0.5, bandH);
  }
  // Band border
  ctx.strokeStyle = canvasTheme.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(mL, bandTop, plotW, bandH);

  // Peak marker on EM band
  if (showPeakMarker.checked && Number.isFinite(peakNm)) {
    const px = nmToX(peakNm);
    ctx.fillStyle = canvasTheme.peak;
    // Triangle marker above band
    ctx.beginPath();
    ctx.moveTo(px, bandTop - 3);
    ctx.lineTo(px - 4, bandTop - 9);
    ctx.lineTo(px + 4, bandTop - 9);
    ctx.closePath();
    ctx.fill();
    // Vertical line through band
    ctx.strokeStyle = canvasTheme.peak;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, bandTop);
    ctx.lineTo(px, bandTop + bandH);
    ctx.stroke();
  }
  ctx.restore();

  // --- Y-axis label (rotated) ---
  ctx.save();
  ctx.fillStyle = canvasTheme.text;
  ctx.font = FONT_LABEL;
  ctx.textAlign = "center";
  ctx.translate(14, mT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(state.intensityScale === "log" ? "log Relative Intensity" : "Relative Intensity", 0, 0);
  ctx.restore();

  // --- X-axis label ---
  ctx.save();
  ctx.fillStyle = canvasTheme.text;
  ctx.font = FONT_LABEL;
  ctx.textAlign = "center";
  ctx.fillText("Wavelength", mL + plotW / 2, h - 4);
  ctx.restore();

  // --- Y-axis tick labels ---
  ctx.save();
  ctx.fillStyle = canvasTheme.text;
  ctx.font = FONT_TICK;
  ctx.textAlign = "right";
  if (state.intensityScale === "log") {
    // Show decade labels: 0, -1, -2, ..., -6 (relative to peak)
    for (let i = 0; i <= 6; i++) {
      const y = mT + (i / 6) * plotH;
      const label = i === 0 ? "peak" : `${-i}`;
      ctx.fillText(label, mL - 6, y + 4);
    }
  } else {
    // Linear: show 0 to 1
    for (let i = 0; i <= 5; i++) {
      const y = mT + ((5 - i) / 5) * plotH;
      ctx.fillText((i / 5).toFixed(1), mL - 6, y + 4);
    }
  }
  ctx.restore();
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

  const peakReadout = formatWavelengthReadout(peakNm);
  peakNmValue.textContent = peakReadout.value;
  if (peakUnitEl) peakUnitEl.textContent = peakReadout.unit;
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
      { name: "Peak wavelength lambda_peak (nm)", value: Number.isFinite(peakNm) ? String(Math.round(peakNm)) : "—" },
      { name: "Luminosity ratio L/Lsun (same radius)", value: formatNumber(lumRatio, 6) },
      { name: "Color name (approx)", value: name },
      { name: "Spectral class (approx)", value: classLetter }
    ],
    notes: [
      "Curve generated from Planck’s law and plotted in relative (normalized) intensity.",
      "Units: wavelength lambda is cm internally (displayed in nm); temperature T is K.",
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
tabExploreEl?.addEventListener("click", () => {
  window.requestAnimationFrame(() => render());
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
          "Move the temperature slider and watch the peak shift left/right.",
          "Turn on the visible-band highlight and notice when the peak is in/near the visible range.",
          "Compare two temperatures: doubling T halves lambda_peak and increases total emission strongly (scales as T^4)."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Blackbody Radiation",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Record a snapshot for the Sun (5772 K).",
      "Record a cooler star and a hotter star; compare lambda_peak and luminosity ratio.",
      "Describe what 'color' means in astronomy using the peak and the visible-band region."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "tK", label: "T (K)" },
      { key: "peakNm", label: "lambda_peak (nm)" },
      { key: "lumRatio", label: "L/Lsun (same R)" },
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

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}
