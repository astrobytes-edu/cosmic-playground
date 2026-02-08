import { telescopePresets, wavelengthBands, seeingConditions } from "@cosmic/data-telescopes";
import { AstroConstants, AstroUnits, TelescopeResolutionModel } from "@cosmic/physics";
import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";

import { requiredSelector } from "../../shared/dom";
import {
  clamp,
  logSliderToValue,
  valueToLogSlider,
  formatNumber,
  formatApertureM,
  formatWavelengthCm,
  describeStatus,
  toneToBadgeAttr,
  computeFovArcsec,
  zoomedFov
} from "./logic";

const presetEl = requiredSelector<HTMLSelectElement>("#preset");
const apertureEl = requiredSelector<HTMLInputElement>("#aperture");
const apertureValueEl = requiredSelector<HTMLSpanElement>("#apertureValue");

const bandsEl = requiredSelector<HTMLDivElement>("#bands");
const bandNotesEl = requiredSelector<HTMLDivElement>("#bandNotes");

const separationEl = requiredSelector<HTMLInputElement>("#separation");
const separationValueEl = requiredSelector<HTMLSpanElement>("#separationValue");

const binaryEnabledEl = requiredSelector<HTMLInputElement>("#binaryEnabled");
const zoomEl = requiredSelector<HTMLInputElement>("#zoom");
const zoomValueEl = requiredSelector<HTMLSpanElement>("#zoomValue");

const includeAtmosphereEl = requiredSelector<HTMLInputElement>("#includeAtmosphere");
const atmosphereControlsEl = requiredSelector<HTMLElement>("#atmosphereControls");
const seeingPresetEl = requiredSelector<HTMLSelectElement>("#seeingPreset");
const seeingEl = requiredSelector<HTMLInputElement>("#seeing");
const seeingValueEl = requiredSelector<HTMLSpanElement>("#seeingValue");
const aoEnabledEl = requiredSelector<HTMLInputElement>("#aoEnabled");

const canvasEl = requiredSelector<HTMLCanvasElement>("#canvas");
const fovLabelEl = requiredSelector<HTMLSpanElement>("#fovLabel");
const statusBadgeEl = requiredSelector<HTMLSpanElement>("#statusBadge");

const thetaDiffEl = requiredSelector<HTMLSpanElement>("#thetaDiff");
const thetaEffEl = requiredSelector<HTMLSpanElement>("#thetaEff");
const sepReadoutEl = requiredSelector<HTMLSpanElement>("#sepReadout");
const statusReadoutEl = requiredSelector<HTMLSpanElement>("#statusReadout");

const stationModeEl = requiredSelector<HTMLButtonElement>("#stationMode");
const challengeModeEl = requiredSelector<HTMLButtonElement>("#challengeMode");
const helpEl = requiredSelector<HTMLButtonElement>("#help");

const copyResultsEl = requiredSelector<HTMLButtonElement>("#copyResults");
const statusEl = requiredSelector<HTMLParagraphElement>("#status");

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:telescope-resolution:mode",
  url: new URL(window.location.href)
});

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

type PresetId = (typeof telescopePresets)[number]["id"] | "custom";
type BandId = (typeof wavelengthBands)[number]["id"];
type SeeingId = (typeof seeingConditions)[number]["id"];

const DEFAULT_PRESET_ID: PresetId = telescopePresets[0]?.id ?? "custom";
const DEFAULT_BAND_ID: BandId = (wavelengthBands.find((b) => b.id === "visible")?.id ??
  wavelengthBands[0]?.id) as BandId;
const DEFAULT_SEEING_ID: SeeingId = (seeingConditions.find((s) => s.id === "average")?.id ??
  seeingConditions[0]?.id) as SeeingId;

const state: {
  presetId: PresetId;
  apertureM: number;
  bandId: BandId;
  separationArcsec: number;
  binaryEnabled: boolean;
  zoom: number;
  includeAtmosphere: boolean;
  seeingId: SeeingId;
  seeingArcsec: number;
  aoEnabled: boolean;
} = {
  presetId: DEFAULT_PRESET_ID,
  apertureM: telescopePresets[0]?.apertureM ?? 1,
  bandId: DEFAULT_BAND_ID,
  separationArcsec: 1,
  binaryEnabled: true,
  zoom: 6,
  includeAtmosphere: false,
  seeingId: DEFAULT_SEEING_ID,
  seeingArcsec: seeingConditions.find((s) => s.id === DEFAULT_SEEING_ID)?.seeingArcsec ?? 1,
  aoEnabled: false
};

function getSelectedPreset() {
  if (state.presetId === "custom") return null;
  return telescopePresets.find((p) => p.id === state.presetId) ?? null;
}

function getSelectedBand() {
  return wavelengthBands.find((b) => b.id === state.bandId) ?? wavelengthBands[0];
}

function updateControlsFromState() {
  presetEl.value = state.presetId;
  apertureEl.value = String(valueToLogSlider(state.apertureM, 0.007, 1e7));
  separationEl.value = String(valueToLogSlider(state.separationArcsec, 1e-3, 1e3));
  binaryEnabledEl.checked = state.binaryEnabled;
  zoomEl.value = String(state.zoom);
  includeAtmosphereEl.checked = state.includeAtmosphere;

  atmosphereControlsEl.hidden = !state.includeAtmosphere;
  seeingPresetEl.value = state.seeingId;
  seeingEl.value = String(state.seeingArcsec);
  aoEnabledEl.checked = state.aoEnabled;
}

function populatePresets() {
  presetEl.innerHTML = "";

  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Custom";
  presetEl.appendChild(customOpt);

  for (const p of telescopePresets) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    presetEl.appendChild(opt);
  }
}

function populateBands() {
  bandsEl.innerHTML = "";
  for (const band of wavelengthBands) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cp-chip band";
    btn.dataset.bandId = band.id;
    btn.textContent = band.shortLabel;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      state.bandId = band.id as BandId;
      render();
    });
    bandsEl.appendChild(btn);
  }
}

function populateSeeingPresets() {
  seeingPresetEl.innerHTML = "";
  for (const s of seeingConditions) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.label} (${s.seeingArcsec.toFixed(1)} arcsec)`;
    seeingPresetEl.appendChild(opt);
  }
}

function setBandButtonStates() {
  const buttons = Array.from(bandsEl.querySelectorAll<HTMLButtonElement>("button.band"));
  for (const b of buttons) {
    const id = b.dataset.bandId;
    const active = id === state.bandId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function computeModel() {
  const band = getSelectedBand();
  const wavelengthCm = band.wavelengthCm;

  const apertureCm = state.apertureM * AstroConstants.LENGTH.CM_PER_M;
  const thetaDiffArcsec = TelescopeResolutionModel.diffractionLimitArcsecFromWavelengthCmAndApertureCm(
    wavelengthCm,
    apertureCm
  );
  const seeingArcsec = state.includeAtmosphere ? state.seeingArcsec : 0;
  const thetaEffArcsec = TelescopeResolutionModel.effectiveResolutionArcsec({
    diffractionLimitArcsec: thetaDiffArcsec,
    seeingArcsec,
    aoEnabled: state.includeAtmosphere && state.aoEnabled
  });
  const status = state.binaryEnabled
    ? TelescopeResolutionModel.resolutionStatusFromSeparationArcsec({
        separationArcsec: state.separationArcsec,
        effectiveResolutionArcsec: thetaEffArcsec
      })
    : null;

  return { band, wavelengthCm, apertureCm, thetaDiffArcsec, thetaEffArcsec, status };
}

function drawPsf(args: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fovArcsec: number;
  separationArcsec: number;
  apertureCm: number;
  wavelengthCm: number;
  useAtmosphereBlur: boolean;
  blurFwhmArcsec: number;
}) {
  const { ctx, width, height } = args;
  const halfFovArcsec = args.fovArcsec / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  const isBinary = args.separationArcsec > 0;
  const leftXArcsec = isBinary ? -args.separationArcsec / 2 : 0;
  const rightXArcsec = isBinary ? args.separationArcsec / 2 : 0;

  const image = ctx.createImageData(width, height);
  const data = image.data;

  const sigmaArcsec = args.blurFwhmArcsec > 0 ? args.blurFwhmArcsec / (2 * Math.sqrt(2 * Math.log(2))) : 0;

  for (let y = 0; y < height; y++) {
    const yArcsec = ((y - centerY) / height) * args.fovArcsec;
    for (let x = 0; x < width; x++) {
      const xArcsec = ((x - centerX) / width) * args.fovArcsec;

      const r1Arcsec = Math.hypot(xArcsec - leftXArcsec, yArcsec);
      const r2Arcsec = isBinary ? Math.hypot(xArcsec - rightXArcsec, yArcsec) : 0;

      let i1 = 0;
      let i2 = 0;

      if (args.useAtmosphereBlur && sigmaArcsec > 0) {
        i1 = Math.exp(-0.5 * (r1Arcsec / sigmaArcsec) * (r1Arcsec / sigmaArcsec));
        i2 = isBinary
          ? Math.exp(-0.5 * (r2Arcsec / sigmaArcsec) * (r2Arcsec / sigmaArcsec))
          : 0;
      } else {
        i1 = TelescopeResolutionModel.airyIntensityNormalizedFromThetaRad({
          thetaRad: AstroUnits.arcsecToRad(r1Arcsec),
          wavelengthCm: args.wavelengthCm,
          apertureCm: args.apertureCm
        });
        i2 = isBinary
          ? TelescopeResolutionModel.airyIntensityNormalizedFromThetaRad({
              thetaRad: AstroUnits.arcsecToRad(r2Arcsec),
              wavelengthCm: args.wavelengthCm,
              apertureCm: args.apertureCm
            })
          : 0;
      }

      const intensity = Math.min(1, (i1 + i2) / 1.4);
      const v = Math.max(0, Math.min(255, Math.round(Math.pow(intensity, 0.45) * 255)));

      const idx = (y * width + x) * 4;
      data[idx + 0] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();

  // Scale bar: 1/4 of the field of view.
  const barArcsec = halfFovArcsec / 2;
  const barPx = (barArcsec / args.fovArcsec) * width;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, height - 20);
  ctx.lineTo(18 + barPx, height - 20);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(`${formatNumber(barArcsec, 2)} arcsec`, 18, height - 26);
  ctx.restore();
}

function exportResults(model: ReturnType<typeof computeModel>): ExportPayloadV1 {
  const preset = getSelectedPreset();
  const band = model.band;
  const w = formatWavelengthCm(model.wavelengthCm, AstroUnits.cmToNm);

  const notes: string[] = [];
  notes.push("Units: wavelength is displayed in nm/um/mm/cm but computed in cm; aperture is displayed in m (or km) but computed in cm.");
  notes.push("Resolved/marginal/unresolved thresholds are didactic cutoffs; this is not a full instrument-performance model.");

  const parameters: ExportPayloadV1["parameters"] = [
    { name: "Telescope preset", value: preset ? preset.name : "Custom" },
    { name: "Wavelength band", value: band.name },
    { name: "Effective aperture D (m)", value: formatNumber(state.apertureM, 6) },
    { name: "Wavelength (cm)", value: formatNumber(model.wavelengthCm, 6) },
    { name: "Wavelength (display)", value: `${w.text} ${w.unit}`.trim() },
    { name: "Binary star mode", value: state.binaryEnabled ? "On" : "Off" },
    { name: "Magnification (zoom)", value: String(state.zoom) },
    {
      name: "Binary separation (arcsec)",
      value: state.binaryEnabled ? formatNumber(state.separationArcsec, 6) : "—"
    }
  ];

  if (state.includeAtmosphere) {
    parameters.push({ name: "Include atmosphere", value: "Yes" });
    parameters.push({ name: "Seeing (arcsec)", value: formatNumber(state.seeingArcsec, 3) });
    parameters.push({ name: "Adaptive optics (AO)", value: state.aoEnabled ? "On" : "Off" });
  } else {
    parameters.push({ name: "Include atmosphere", value: "No" });
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters,
    readouts: [
      { name: "Diffraction limit theta_diff (arcsec)", value: formatNumber(model.thetaDiffArcsec, 6) },
      { name: "Effective resolution theta_eff (arcsec)", value: formatNumber(model.thetaEffArcsec, 6) },
      { name: "Status", value: model.status ?? "single-star" }
    ],
    notes
  };
}

function render() {
  const preset = getSelectedPreset();
  const band = getSelectedBand();

  setBandButtonStates();
  bandNotesEl.textContent = band.notes;

  const apertureFmt = formatApertureM(state.apertureM);
  apertureValueEl.textContent = `${apertureFmt.text} ${apertureFmt.unit}`.trim();

  const sep = state.separationArcsec;
  separationValueEl.textContent = `${formatNumber(sep, 3)} arcsec`;
  separationEl.disabled = !state.binaryEnabled;

  zoomValueEl.textContent = `${state.zoom}x`;

  seeingValueEl.textContent = `${formatNumber(state.seeingArcsec, 2)} arcsec`;

  const model = computeModel();

  thetaDiffEl.textContent = formatNumber(model.thetaDiffArcsec, 4);
  thetaEffEl.textContent = formatNumber(model.thetaEffArcsec, 4);
  sepReadoutEl.textContent = state.binaryEnabled ? formatNumber(state.separationArcsec, 4) : "—";

  if (model.status) {
    const statusInfo = describeStatus(model.status);
    statusReadoutEl.textContent = statusInfo.label;
    statusBadgeEl.textContent = statusInfo.label;
    statusBadgeEl.dataset.tone = toneToBadgeAttr(statusInfo.tone);
  } else {
    statusReadoutEl.textContent = "Single star";
    statusBadgeEl.textContent = "Single";
    statusBadgeEl.dataset.tone = "neutral";
  }

  const fovArcsec = computeFovArcsec(model.thetaEffArcsec, sep);
  const zoomedFovArcsec = zoomedFov(fovArcsec, state.zoom);
  fovLabelEl.textContent = `FOV: ${formatNumber(zoomedFovArcsec, 2)} arcsec (${state.zoom}x)`;

  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  const useAtmosphereBlur = state.includeAtmosphere;
  drawPsf({
    ctx,
    width: canvasEl.width,
    height: canvasEl.height,
    fovArcsec: zoomedFovArcsec,
    separationArcsec: state.binaryEnabled ? sep : 0,
    apertureCm: model.apertureCm,
    wavelengthCm: model.wavelengthCm,
    useAtmosphereBlur,
    blurFwhmArcsec: model.thetaEffArcsec
  });

  // Disable AO controls when atmosphere is off.
  aoEnabledEl.disabled = !state.includeAtmosphere;

  // Keep the "include atmosphere" story honest for space presets.
  if (preset && preset.platform === "space" && state.includeAtmosphere) {
    setLiveRegionText(statusEl, "Note: space telescopes have no atmospheric seeing.");
  }
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
          { key: "g", action: "Toggle station mode" }
        ]
      },
      {
        heading: "Tip",
        type: "bullets",
        items: [
          "If two peaks blur into one, try decreasing wavelength or increasing aperture.",
          "Turn on atmosphere to see how seeing can dominate over diffraction."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Telescope Resolution",
    subtitle: "Record wavelength, aperture, and whether a close pair is resolved",
    steps: [
      "Pick a telescope preset and a wavelength band.",
      "Adjust the binary separation until the status is 'marginal'.",
      "Optional: turn on atmosphere and compare with/without AO."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "wavelength", label: "Wavelength" },
      { key: "aperture", label: "Aperture $D$" },
      { key: "thetaDiffArcsec", label: "$\\theta_\\mathrm{diff}$ (arcsec)" },
      { key: "thetaEffArcsec", label: "$\\theta_\\mathrm{eff}$ (arcsec)" },
      { key: "separationArcsec", label: "Separation (arcsec)" },
      { key: "status", label: "Status" },
      { key: "atmosphere", label: "Atmosphere" }
    ],
    snapshotLabel: "Add row (snapshot)",
    getSnapshotRow: () => {
      const preset = getSelectedPreset();
      const band = getSelectedBand();
      const model = computeModel();
      const a = formatApertureM(state.apertureM);
      const w = formatWavelengthCm(band.wavelengthCm, AstroUnits.cmToNm);

      return {
        case: preset ? preset.name : "Custom",
        wavelength: `${w.text} ${w.unit}`.trim(),
        aperture: `${a.text} ${a.unit}`.trim(),
        thetaDiffArcsec: formatNumber(model.thetaDiffArcsec, 4),
        thetaEffArcsec: formatNumber(model.thetaEffArcsec, 4),
        separationArcsec: state.binaryEnabled ? formatNumber(state.separationArcsec, 4) : "—",
        status: model.status ?? "single-star",
        atmosphere: state.includeAtmosphere
          ? `Seeing ${formatNumber(state.seeingArcsec, 2)}"${state.aoEnabled ? " + AO" : ""}`
          : "Off"
      };
    }
  }
});

demoModes.bindButtons({
  helpButton: helpEl,
  stationButton: stationModeEl
});

challengeModeEl.disabled = true;

populatePresets();
populateBands();
populateSeeingPresets();

updateControlsFromState();
render();

presetEl.addEventListener("change", () => {
  const next = presetEl.value as PresetId;
  state.presetId = next;
  const preset = getSelectedPreset();
  if (preset) {
    state.apertureM = preset.apertureM;
  }
  render();
});

apertureEl.addEventListener("input", () => {
  state.apertureM = logSliderToValue(Number(apertureEl.value), 0.007, 1e7);
  state.presetId = "custom";
  presetEl.value = "custom";
  render();
});

separationEl.addEventListener("input", () => {
  state.separationArcsec = logSliderToValue(Number(separationEl.value), 1e-3, 1e3);
  render();
});

binaryEnabledEl.addEventListener("change", () => {
  state.binaryEnabled = binaryEnabledEl.checked;
  render();
});

zoomEl.addEventListener("input", () => {
  state.zoom = clamp(Number(zoomEl.value), 1, 20);
  render();
});

includeAtmosphereEl.addEventListener("change", () => {
  state.includeAtmosphere = includeAtmosphereEl.checked;
  atmosphereControlsEl.hidden = !state.includeAtmosphere;
  render();
});

seeingPresetEl.addEventListener("change", () => {
  const nextId = seeingPresetEl.value as SeeingId;
  state.seeingId = nextId;
  const preset = seeingConditions.find((s) => s.id === nextId);
  if (preset) state.seeingArcsec = preset.seeingArcsec;
  seeingEl.value = String(state.seeingArcsec);
  render();
});

seeingEl.addEventListener("input", () => {
  state.seeingArcsec = clamp(Number(seeingEl.value), 0.2, 3.5);
  render();
});

aoEnabledEl.addEventListener("change", () => {
  state.aoEnabled = aoEnabledEl.checked;
  render();
});

copyResultsEl.addEventListener("click", () => {
  setLiveRegionText(statusEl, "Copying…");
  const model = computeModel();
  void runtime
    .copyResults(exportResults(model))
    .then(() => setLiveRegionText(statusEl, "Copied results to clipboard."))
    .catch((err) => {
      setLiveRegionText(statusEl, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.");
    });
});

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);

initMath(document);
