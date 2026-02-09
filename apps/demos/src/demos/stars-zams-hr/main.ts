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
import { BlackbodyRadiationModel, ZamsTout1996Model } from "@cosmic/physics";
import {
  HR_AXIS_LIMITS,
  clamp,
  decadeTicks,
  formatMetallicity,
  formatNumber,
  hrDiagramCoordinates,
  logSliderToValue,
  logTickPowersOfTenLabel,
  luminosityLsunFromRadiusTemperature,
  minorLogTicks,
  valueToLogSlider
} from "./logic";

type PresetMode = "zams" | "override";
type SourceMode = "zams" | "stefan";
type PresetState = "inferred" | "override";

type DemoState = {
  sourceMode: SourceMode;
  massMsun: number;
  metallicityZ: number;
  stefanTeffK: number;
  stefanRadiusRsun: number;
  showRadiusGuides: boolean;
  presetState: PresetState;
  selectedPresetId: string | null;
};

type StarReadouts = {
  sourceMode: SourceMode;
  massMsun: number;
  metallicityZ: number;
  luminosityLsun: number;
  radiusRsun: number;
  teffK: number;
  surfaceFluxCgs: number;
  surfaceFluxRatio: number;
  validityText: string;
  modeAssumptionText: string;
  presetState: PresetState;
};

const MASS_MIN_MSUN = ZamsTout1996Model.CONSTANTS.massMinMsun;
const MASS_MAX_MSUN = ZamsTout1996Model.CONSTANTS.massMaxMsun;
const METALLICITY_MIN = ZamsTout1996Model.CONSTANTS.metallicityMin;
const METALLICITY_MAX = ZamsTout1996Model.CONSTANTS.metallicityMax;
const TSUN_K = ZamsTout1996Model.CONSTANTS.tSunK;

const TEFF_MIN_K = 2000;
const TEFF_MAX_K = 100_000;
const RADIUS_MIN_RSUN = 0.01;
const RADIUS_MAX_RSUN = 1000;

const FSUN_CGS = BlackbodyRadiationModel.stefanBoltzmannFluxCgs({ temperatureK: TSUN_K });
const RADIUS_GUIDES_RSUN = [0.01, 0.1, 1, 10, 100, 1000] as const;

const X_MAJOR_TICKS_K = decadeTicks(Math.log10(HR_AXIS_LIMITS.teffMinK), Math.log10(HR_AXIS_LIMITS.teffMaxK));
const X_MINOR_TICKS_K = minorLogTicks(Math.log10(HR_AXIS_LIMITS.teffMinK), Math.log10(HR_AXIS_LIMITS.teffMaxK));
const Y_MAJOR_TICKS_LSUN = decadeTicks(HR_AXIS_LIMITS.logLumMin, HR_AXIS_LIMITS.logLumMax);
const Y_MINOR_TICKS_LSUN = minorLogTicks(HR_AXIS_LIMITS.logLumMin, HR_AXIS_LIMITS.logLumMax);

const FONT_TICK_MAJOR = "600 14px 'Source Sans 3', 'Inter', ui-sans-serif, sans-serif";
const FONT_TICK_MINOR = "500 12px 'Source Sans 3', 'Inter', ui-sans-serif, sans-serif";
const FONT_GUIDE_LABEL = "500 12px 'Source Sans 3', 'Inter', ui-sans-serif, sans-serif";

const massSliderEl = document.querySelector<HTMLInputElement>("#massSlider");
const massValueEl = document.querySelector<HTMLSpanElement>("#massValue");
const metallicitySliderEl = document.querySelector<HTMLInputElement>("#metallicitySlider");
const metallicityValueEl = document.querySelector<HTMLSpanElement>("#metallicityValue");
const teffSliderEl = document.querySelector<HTMLInputElement>("#teffSlider");
const teffSliderValueEl = document.querySelector<HTMLSpanElement>("#teffSliderValue");
const radiusSliderEl = document.querySelector<HTMLInputElement>("#radiusSlider");
const radiusSliderValueEl = document.querySelector<HTMLSpanElement>("#radiusSliderValue");
const modeZamsEl = document.querySelector<HTMLButtonElement>("#modeZams");
const modeStefanEl = document.querySelector<HTMLButtonElement>("#modeStefan");
const showRadiusGuidesEl = document.querySelector<HTMLInputElement>("#showRadiusGuides");

const massReadoutEl = document.querySelector<HTMLSpanElement>("#massReadout");
const teffValueEl = document.querySelector<HTMLSpanElement>("#teffValue");
const luminosityValueEl = document.querySelector<HTMLSpanElement>("#luminosityValue");
const radiusValueEl = document.querySelector<HTMLSpanElement>("#radiusValue");
const fluxRatioValueEl = document.querySelector<HTMLSpanElement>("#fluxRatioValue");
const validityBadgeEl = document.querySelector<HTMLParagraphElement>("#validityBadge");
const modeAssumptionTextEl = document.querySelector<HTMLParagraphElement>("#modeAssumptionText");
const overrideModeHintEl = document.querySelector<HTMLParagraphElement>("#overrideModeHint");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");
const hrCanvasEl = document.querySelector<HTMLCanvasElement>("#hrCanvas");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const tabExploreEl = document.querySelector<HTMLButtonElement>("#tab-explore");

const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button.preset[data-preset-id]')
);
const presetModeById = new Map<string, PresetMode>();
for (const button of presetButtons) {
  const presetId = button.dataset.presetId;
  if (!presetId) continue;
  const presetMode = (button.dataset.mode as PresetMode | undefined) ?? "zams";
  presetModeById.set(presetId, presetMode);
}

if (
  !massSliderEl ||
  !massValueEl ||
  !metallicitySliderEl ||
  !metallicityValueEl ||
  !teffSliderEl ||
  !teffSliderValueEl ||
  !radiusSliderEl ||
  !radiusSliderValueEl ||
  !modeZamsEl ||
  !modeStefanEl ||
  !showRadiusGuidesEl ||
  !massReadoutEl ||
  !teffValueEl ||
  !luminosityValueEl ||
  !radiusValueEl ||
  !fluxRatioValueEl ||
  !validityBadgeEl ||
  !modeAssumptionTextEl ||
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
const teffSlider = teffSliderEl;
const teffSliderValue = teffSliderValueEl;
const radiusSlider = radiusSliderEl;
const radiusSliderValue = radiusSliderValueEl;
const modeZams = modeZamsEl;
const modeStefan = modeStefanEl;
const showRadiusGuides = showRadiusGuidesEl;
const massReadout = massReadoutEl;
const teffValue = teffValueEl;
const luminosityValue = luminosityValueEl;
const radiusValue = radiusValueEl;
const fluxRatioValue = fluxRatioValueEl;
const validityBadge = validityBadgeEl;
const modeAssumptionText = modeAssumptionTextEl;
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
  sourceMode: "zams",
  massMsun: 1,
  metallicityZ: 0.02,
  stefanTeffK: TSUN_K,
  stefanRadiusRsun: 1,
  showRadiusGuides: false,
  presetState: "inferred",
  selectedPresetId: "sun"
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

function formatWithoutENotation(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e4 || abs < 1e-3) {
    const exponent = Math.floor(Math.log10(abs));
    const coefficient = value / 10 ** exponent;
    if (Math.abs(Math.abs(coefficient) - 1) < 1e-10) {
      return `${value < 0 ? "-" : ""}10^${exponent}`;
    }
    return `${coefficient.toFixed(2)}x10^${exponent}`;
  }
  return value.toFixed(digits);
}

function formatIntegerWithCommas(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return Math.round(value).toLocaleString("en-US");
}

function sliderStepValue(event: KeyboardEvent): number {
  return event.shiftKey ? 20 : 1;
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

function setModeButtons(nextMode: SourceMode): void {
  modeZams.setAttribute("aria-pressed", nextMode === "zams" ? "true" : "false");
  modeStefan.setAttribute("aria-pressed", nextMode === "stefan" ? "true" : "false");
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
    state.sourceMode = "stefan";
    state.presetState = "override";
    state.stefanTeffK = clamp(teffK, TEFF_MIN_K, TEFF_MAX_K);
    state.stefanRadiusRsun = clamp(radiusRsun, RADIUS_MIN_RSUN, RADIUS_MAX_RSUN);
    return;
  }

  state.sourceMode = "zams";
  state.presetState = "inferred";
}

function computeReadouts(): StarReadouts {
  if (state.sourceMode === "zams") {
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
    const surfaceFluxCgs = BlackbodyRadiationModel.stefanBoltzmannFluxCgs({ temperatureK: teffK });

    return {
      sourceMode: "zams",
      massMsun: state.massMsun,
      metallicityZ: state.metallicityZ,
      luminosityLsun,
      radiusRsun,
      teffK,
      surfaceFluxCgs,
      surfaceFluxRatio: surfaceFluxCgs / FSUN_CGS,
      validityText: zamsValidity.valid
        ? "ZAMS inferred state from Tout et al. (1996)."
        : zamsValidity.warnings.join(" "),
      modeAssumptionText:
        "ZAMS mode: luminosity and radius come from Tout et al. (1996), and effective temperature is derived by Stefan-Boltzmann closure.",
      presetState: "inferred"
    };
  }

  const teffK = clamp(state.stefanTeffK, TEFF_MIN_K, TEFF_MAX_K);
  const radiusRsun = clamp(state.stefanRadiusRsun, RADIUS_MIN_RSUN, RADIUS_MAX_RSUN);
  const luminosityLsun = luminosityLsunFromRadiusTemperature({
    radiusRsun,
    teffK,
    tSunK: TSUN_K
  });
  const surfaceFluxCgs = BlackbodyRadiationModel.stefanBoltzmannFluxCgs({ temperatureK: teffK });

  return {
    sourceMode: "stefan",
    massMsun: state.massMsun,
    metallicityZ: state.metallicityZ,
    luminosityLsun,
    radiusRsun,
    teffK,
    surfaceFluxCgs,
    surfaceFluxRatio: surfaceFluxCgs / FSUN_CGS,
    validityText:
      state.presetState === "override"
        ? "Override preset: non-ZAMS state. Metallicity is shown but not applied in Stefan mode."
        : "Stefan mode: luminosity is computed directly from radius and effective temperature.",
    modeAssumptionText:
      state.presetState === "override"
        ? "Override preset in Stefan mode: luminosity is set by radius and effective temperature, not by ZAMS fits."
        : "Stefan mode: luminosity is set by radius and effective temperature.",
    presetState: state.presetState
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

  const mL = 122;
  const mR = 28;
  const mT = 30;
  const mB = 120;
  const plotW = Math.max(1, w - mL - mR);
  const plotH = Math.max(1, h - mT - mB);

  const teffMinK = HR_AXIS_LIMITS.teffMinK;
  const teffMaxK = HR_AXIS_LIMITS.teffMaxK;
  const logTeffMin = Math.log10(teffMinK);
  const logTeffMax = Math.log10(teffMaxK);
  const logLumMin = HR_AXIS_LIMITS.logLumMin;
  const logLumMax = HR_AXIS_LIMITS.logLumMax;

  const bg = resolveCssColor(cssVar("--cp-bg0"));
  const plotBg = resolveCssColor(cssVar("--cp-bg1"));
  const frame = resolveCssColor(cssVar("--cp-text"));
  const text = resolveCssColor(cssVar("--cp-text"));
  const mutedText = resolveCssColor(cssVar("--cp-text2"));
  const minorGrid = resolveCssColor(cssVar("--cp-border-subtle"));
  const majorGrid = resolveCssColor(cssVar("--cp-border"));
  const track = resolveCssColor(cssVar("--cp-chart-1"));
  const guideColor = resolveCssColor(cssVar("--cp-chart-3"));
  const overrideMarker = resolveCssColor(cssVar("--cp-chart-2"));

  const xFromTeffK = (teffK: number) => {
    const logTeff = Math.log10(teffK);
    const xNorm = (logTeffMax - logTeff) / (logTeffMax - logTeffMin);
    return mL + clamp(xNorm, 0, 1) * plotW;
  };

  const yFromLum = (luminosityLsun: number) => {
    const logLum = Math.log10(luminosityLsun);
    const yNorm = (logLum - logLumMin) / (logLumMax - logLumMin);
    return mT + (1 - clamp(yNorm, 0, 1)) * plotH;
  };

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = plotBg;
  ctx.fillRect(mL, mT, plotW, plotH);

  ctx.save();
  ctx.strokeStyle = minorGrid;
  ctx.globalAlpha = 0.44;
  ctx.lineWidth = 0.95;
  for (const teffTickK of X_MINOR_TICKS_K) {
    const x = xFromTeffK(teffTickK);
    ctx.beginPath();
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT + plotH);
    ctx.stroke();
  }
  for (const lumTick of Y_MINOR_TICKS_LSUN) {
    const y = yFromLum(lumTick);
    ctx.beginPath();
    ctx.moveTo(mL, y);
    ctx.lineTo(mL + plotW, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = majorGrid;
  ctx.globalAlpha = 0.92;
  ctx.lineWidth = 1.45;
  for (const teffTickK of X_MAJOR_TICKS_K) {
    const x = xFromTeffK(teffTickK);
    ctx.beginPath();
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT + plotH);
    ctx.stroke();
  }
  for (const lumTick of Y_MAJOR_TICKS_LSUN) {
    const y = yFromLum(lumTick);
    ctx.beginPath();
    ctx.moveTo(mL, y);
    ctx.lineTo(mL + plotW, y);
    ctx.stroke();
  }
  ctx.restore();

  if (state.showRadiusGuides) {
    ctx.save();
    ctx.strokeStyle = guideColor;
    ctx.lineWidth = 1.35;
    ctx.setLineDash([7, 5]);
    for (const radiusRsun of RADIUS_GUIDES_RSUN) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 140; i += 1) {
        const frac = i / 140;
        const teffK = teffMinK * (teffMaxK / teffMinK) ** frac;
        const luminosityLsun = luminosityLsunFromRadiusTemperature({
          radiusRsun,
          teffK,
          tSunK: TSUN_K
        });
        if (!Number.isFinite(luminosityLsun) || luminosityLsun <= 0) continue;
        const logLum = Math.log10(luminosityLsun);
        if (logLum < logLumMin || logLum > logLumMax) {
          if (started) {
            ctx.stroke();
            ctx.beginPath();
            started = false;
          }
          continue;
        }
        const x = xFromTeffK(teffK);
        const y = yFromLum(luminosityLsun);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      const labelTeffK = 3_000;
      const labelLum = luminosityLsunFromRadiusTemperature({
        radiusRsun,
        teffK: labelTeffK,
        tSunK: TSUN_K
      });
      if (Number.isFinite(labelLum) && labelLum > 0) {
        const logLum = Math.log10(labelLum);
        if (logLum >= logLumMin && logLum <= logLumMax) {
          const labelX = xFromTeffK(labelTeffK) + 7;
          const labelY = yFromLum(labelLum) - 4;
          const exponent = Math.round(Math.log10(radiusRsun));
          const radiusLabel = Math.abs(radiusRsun - 10 ** exponent) < 1e-12
            ? `R/R_{\\odot} = ${logTickPowersOfTenLabel(10 ** exponent)}`
            : `R/R_{\\odot} = ${formatWithoutENotation(radiusRsun, 2)}`;
          ctx.fillStyle = guideColor;
          ctx.font = FONT_GUIDE_LABEL;
          ctx.fillText(radiusLabel, labelX, labelY);
        }
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = track;
  ctx.lineWidth = 2.35;
  ctx.beginPath();
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
    const point = hrDiagramCoordinates({ teffK, luminosityLsun });
    const x = xFromTeffK(teffK);
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
  ctx.fillStyle = markerColor;
  ctx.beginPath();
  ctx.arc(markerX, markerY, 6.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = resolveCssColor(cssVar("--cp-bg1"));
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = frame;
  ctx.globalAlpha = 0.94;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mL, mT, plotW, plotH);
  ctx.restore();

  const majorTickLength = 9;
  const minorTickLength = 5;

  ctx.save();
  ctx.strokeStyle = mutedText;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 1;
  for (const teffTickK of X_MINOR_TICKS_K) {
    const x = xFromTeffK(teffTickK);
    ctx.beginPath();
    ctx.moveTo(x, mT + plotH);
    ctx.lineTo(x, mT + plotH + minorTickLength);
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT - minorTickLength);
    ctx.stroke();
  }
  for (const lumTick of Y_MINOR_TICKS_LSUN) {
    const y = yFromLum(lumTick);
    ctx.beginPath();
    ctx.moveTo(mL - minorTickLength, y);
    ctx.lineTo(mL, y);
    ctx.moveTo(mL + plotW, y);
    ctx.lineTo(mL + plotW + minorTickLength, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = text;
  ctx.strokeStyle = text;
  ctx.font = FONT_TICK_MAJOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const teffTickK of X_MAJOR_TICKS_K) {
    const x = xFromTeffK(teffTickK);
    ctx.beginPath();
    ctx.moveTo(x, mT + plotH);
    ctx.lineTo(x, mT + plotH + majorTickLength);
    ctx.moveTo(x, mT);
    ctx.lineTo(x, mT - majorTickLength);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillText(logTickPowersOfTenLabel(teffTickK), x, mT + plotH + 11);
    ctx.fillStyle = mutedText;
    ctx.font = FONT_TICK_MINOR;
    ctx.fillText(`${formatIntegerWithCommas(teffTickK)} K`, x, mT + plotH + 30);
    ctx.fillStyle = text;
    ctx.font = FONT_TICK_MAJOR;
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const lumTick of Y_MAJOR_TICKS_LSUN) {
    const y = yFromLum(lumTick);
    ctx.beginPath();
    ctx.moveTo(mL - majorTickLength, y);
    ctx.lineTo(mL, y);
    ctx.moveTo(mL + plotW, y);
    ctx.lineTo(mL + plotW + majorTickLength, y);
    ctx.strokeStyle = text;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = text;
    ctx.fillText(logTickPowersOfTenLabel(lumTick), mL - 12, y);
  }

  ctx.font = FONT_TICK_MINOR;
  ctx.fillStyle = mutedText;
  ctx.textAlign = "left";
  ctx.fillText("hotter <-", mL, h - 28);
  ctx.textAlign = "right";
  ctx.fillText("-> cooler", mL + plotW, h - 28);
  ctx.restore();
}

function syncSlidersFromReadouts(readouts: StarReadouts): void {
  if (state.sourceMode === "zams") {
    state.stefanTeffK = readouts.teffK;
    state.stefanRadiusRsun = readouts.radiusRsun;
  }
}

function renderReadouts(readouts: StarReadouts): void {
  syncSlidersFromReadouts(readouts);

  massSlider.value = String(valueToLogSlider(state.massMsun, MASS_MIN_MSUN, MASS_MAX_MSUN));
  metallicitySlider.value = String(valueToLogSlider(state.metallicityZ, METALLICITY_MIN, METALLICITY_MAX));
  teffSlider.value = String(valueToLogSlider(state.stefanTeffK, TEFF_MIN_K, TEFF_MAX_K));
  radiusSlider.value = String(valueToLogSlider(state.stefanRadiusRsun, RADIUS_MIN_RSUN, RADIUS_MAX_RSUN));
  showRadiusGuides.checked = state.showRadiusGuides;

  massSlider.setAttribute("aria-valuetext", `${formatNumber(state.massMsun, 3)} solar masses`);
  metallicitySlider.setAttribute("aria-valuetext", `metallicity ${formatMetallicity(state.metallicityZ)}`);
  teffSlider.setAttribute("aria-valuetext", `${formatIntegerWithCommas(state.stefanTeffK)} kelvin`);
  radiusSlider.setAttribute("aria-valuetext", `${formatWithoutENotation(state.stefanRadiusRsun, 3)} solar radii`);

  massValue.textContent = formatWithoutENotation(state.massMsun, 3);
  metallicityValue.textContent = formatMetallicity(state.metallicityZ);
  teffSliderValue.textContent = formatIntegerWithCommas(state.stefanTeffK);
  radiusSliderValue.textContent = formatWithoutENotation(state.stefanRadiusRsun, 3);

  massReadout.textContent = formatWithoutENotation(readouts.massMsun, 3);
  teffValue.textContent = formatIntegerWithCommas(readouts.teffK);
  luminosityValue.textContent = formatWithoutENotation(readouts.luminosityLsun, 4);
  radiusValue.textContent = formatWithoutENotation(readouts.radiusRsun, 4);
  fluxRatioValue.textContent = formatWithoutENotation(readouts.surfaceFluxRatio, 4);

  validityBadge.textContent = readouts.validityText;
  modeAssumptionText.textContent = readouts.modeAssumptionText;

  const isZamsMode = readouts.sourceMode === "zams";
  massSlider.disabled = !isZamsMode;
  metallicitySlider.disabled = !isZamsMode;
  teffSlider.disabled = isZamsMode;
  radiusSlider.disabled = isZamsMode;
  metallicitySlider.title = isZamsMode
    ? ""
    : "Metallicity is not applied in override mode.";

  modeZams.setAttribute("aria-disabled", "false");
  modeStefan.setAttribute("aria-disabled", "false");

  setModeButtons(readouts.sourceMode);
  setPresetButtons(state.selectedPresetId);

  overrideModeHint.hidden = !(readouts.sourceMode === "stefan" && readouts.presetState === "override");
}

function render(): void {
  const readouts = computeReadouts();
  renderReadouts(readouts);
  drawHrDiagram(readouts);
}

function exportResults(readouts: StarReadouts): ExportPayloadV1 {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Source mode", value: readouts.sourceMode },
      { name: "Mass M (M/M_{\\odot})", value: formatWithoutENotation(readouts.massMsun, 6) },
      { name: "Metallicity Z", value: formatMetallicity(readouts.metallicityZ) },
      { name: "Show constant-R guides", value: state.showRadiusGuides ? "yes" : "no" }
    ],
    readouts: [
      { name: "Effective temperature T_eff (K)", value: formatIntegerWithCommas(readouts.teffK) },
      { name: "Luminosity L/L_{\\odot}", value: formatWithoutENotation(readouts.luminosityLsun, 6) },
      { name: "Radius R/R_{\\odot}", value: formatWithoutENotation(readouts.radiusRsun, 6) },
      { name: "Surface flux ratio F/F_{\\odot}", value: formatWithoutENotation(readouts.surfaceFluxRatio, 6) }
    ],
    notes: [
      "H-R plot uses base-10 logarithmic axes with T_eff in K and luminosity in L/L_{\\odot}.",
      "ZAMS mode uses Tout et al. (1996) over 0.1 <= M/M_{\\odot} <= 100 and 1e-4 <= Z <= 0.03.",
      "Stefan mode computes luminosity from radius and effective temperature: L/L_{\\odot} = (R/R_{\\odot})^2 (T/T_{\\odot})^4.",
      readouts.presetState === "override"
        ? "Override presets intentionally bypass ZAMS constraints."
        : "Current state follows the selected source-mode assumptions."
    ]
  };
}

modeZams.addEventListener("click", () => {
  state.sourceMode = "zams";
  state.presetState = "inferred";
  if (state.selectedPresetId && presetModeById.get(state.selectedPresetId) === "override") {
    state.selectedPresetId = null;
  }
  render();
});

modeStefan.addEventListener("click", () => {
  const snapshot = computeReadouts();
  state.stefanTeffK = snapshot.teffK;
  state.stefanRadiusRsun = snapshot.radiusRsun;
  state.sourceMode = "stefan";
  state.presetState = "inferred";
  state.selectedPresetId = null;
  render();
});

massSlider.addEventListener("input", () => {
  state.massMsun = logSliderToValue(Number(massSlider.value), MASS_MIN_MSUN, MASS_MAX_MSUN);
  state.sourceMode = "zams";
  state.presetState = "inferred";
  state.selectedPresetId = null;
  render();
});

metallicitySlider.addEventListener("input", () => {
  state.metallicityZ = logSliderToValue(
    Number(metallicitySlider.value),
    METALLICITY_MIN,
    METALLICITY_MAX
  );
  state.sourceMode = "zams";
  state.presetState = "inferred";
  state.selectedPresetId = null;
  render();
});

teffSlider.addEventListener("input", () => {
  state.stefanTeffK = logSliderToValue(Number(teffSlider.value), TEFF_MIN_K, TEFF_MAX_K);
  state.sourceMode = "stefan";
  state.presetState = "inferred";
  state.selectedPresetId = null;
  render();
});

radiusSlider.addEventListener("input", () => {
  state.stefanRadiusRsun = logSliderToValue(Number(radiusSlider.value), RADIUS_MIN_RSUN, RADIUS_MAX_RSUN);
  state.sourceMode = "stefan";
  state.presetState = "inferred";
  state.selectedPresetId = null;
  render();
});

showRadiusGuides.addEventListener("change", () => {
  state.showRadiusGuides = showRadiusGuides.checked;
  render();
});

massSlider.addEventListener("keydown", (event) => updateSliderKeyboardNudge(event, massSlider));
metallicitySlider.addEventListener("keydown", (event) => updateSliderKeyboardNudge(event, metallicitySlider));
teffSlider.addEventListener("keydown", (event) => updateSliderKeyboardNudge(event, teffSlider));
radiusSlider.addEventListener("keydown", (event) => updateSliderKeyboardNudge(event, radiusSlider));

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    setStateFromPreset(button);
    render();
  });
}

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying...");
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
          "Use ZAMS mode to explore how mass and metallicity set Teff, radius, and luminosity on the Tout track.",
          "Switch to Stefan mode to control radius and temperature directly and watch luminosity respond via L = 4piR^2sigmaT^4.",
          "Toggle constant-R guides to see how stellar families align in log-log H-R space."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Stars ZAMS and H-R",
    subtitle: "Capture snapshots, compare assumptions, then copy CSV or print.",
    steps: [
      "Record one ZAMS state and one Stefan-mode state at the same Teff but different radius.",
      "Turn on constant-R guides and identify which line each case lies nearest to.",
      "Explain the difference between surface flux and luminosity using your two rows."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "source", label: "Source" },
      { key: "mMsun", label: "M (M/M_{\\odot})" },
      { key: "z", label: "Z" },
      { key: "teffK", label: "T_eff (K)" },
      { key: "lumLsun", label: "L/L_{\\odot}" },
      { key: "radiusRsun", label: "R/R_{\\odot}" },
      { key: "fluxRatio", label: "F/F_{\\odot}" }
    ],
    getSnapshotRow() {
      const readouts = computeReadouts();
      return {
        case: state.selectedPresetId ? state.selectedPresetId : "Snapshot",
        source: readouts.sourceMode,
        mMsun: formatWithoutENotation(readouts.massMsun, 4),
        z: formatMetallicity(readouts.metallicityZ),
        teffK: formatIntegerWithCommas(readouts.teffK),
        lumLsun: formatWithoutENotation(readouts.luminosityLsun, 6),
        radiusRsun: formatWithoutENotation(readouts.radiusRsun, 6),
        fluxRatio: formatWithoutENotation(readouts.surfaceFluxRatio, 6)
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
tabExploreEl?.addEventListener("click", () => {
  window.requestAnimationFrame(() => render());
});

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
