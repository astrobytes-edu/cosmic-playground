import {
  createInstrumentRuntime,
  initMath,
  initStarfield,
  setLiveRegionText
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AstroUnits, PhotonModel } from "@cosmic/physics";
import {
  atomicLines,
  emSpectrumObjects,
  emSpectrumTelescopes,
  molecularBands
} from "@cosmic/data-spectra";
import {
  type BandKey,
  BANDS,
  clamp,
  wavelengthToPositionPercent,
  positionPercentToWavelengthCm,
  formatWavelength,
  formatFrequency,
  formatEnergyFromErg,
  bandFromWavelengthCm,
  bandCenterCm,
  spectrumGradientCSS,
  drawSpectrumWave,
  SCALE_OBJECTS
} from "./logic";

const wavelengthSliderEl = document.querySelector<HTMLInputElement>("#wavelengthSlider");
const wavelengthValueEl = document.querySelector<HTMLSpanElement>("#wavelengthValue");
const bandButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".band"));

const bandBadgeEl = document.querySelector<HTMLSpanElement>("#bandBadge");
const bandRangeEl = document.querySelector<HTMLSpanElement>("#bandRange");

const bandHighlightEl = document.querySelector<HTMLDivElement>("#bandHighlight");
const markerEl = document.querySelector<HTMLDivElement>("#marker");
const markerLabelEl = document.querySelector<HTMLDivElement>("#markerLabel");

const bandNameEl = document.querySelector<HTMLDivElement>("#bandName");
const bandDescriptionEl = document.querySelector<HTMLDivElement>("#bandDescription");
const bandExamplesEl = document.querySelector<HTMLDivElement>("#bandExamples");
const bandDetectionEl = document.querySelector<HTMLDivElement>("#bandDetection");

const readoutWavelengthEl = document.querySelector<HTMLSpanElement>("#readoutWavelength");
const readoutFrequencyEl = document.querySelector<HTMLSpanElement>("#readoutFrequency");
const readoutEnergyEl = document.querySelector<HTMLSpanElement>("#readoutEnergy");
const readoutWavelengthUnitEl = document.querySelector<HTMLSpanElement>("#readoutWavelengthUnit");
const readoutFrequencyUnitEl = document.querySelector<HTMLSpanElement>("#readoutFrequencyUnit");
const readoutEnergyUnitEl = document.querySelector<HTMLSpanElement>("#readoutEnergyUnit");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const tabConvertEl = document.querySelector<HTMLButtonElement>("#tabConvert");
const tabTelescopesEl = document.querySelector<HTMLButtonElement>("#tabTelescopes");
const tabObjectsEl = document.querySelector<HTMLButtonElement>("#tabObjects");
const tabLinesEl = document.querySelector<HTMLButtonElement>("#tabLines");

const panelConvertEl = document.querySelector<HTMLElement>("#panelConvert");
const panelTelescopesEl = document.querySelector<HTMLElement>("#panelTelescopes");
const panelObjectsEl = document.querySelector<HTMLElement>("#panelObjects");
const panelLinesEl = document.querySelector<HTMLElement>("#panelLines");

const convertWavelengthNmEl = document.querySelector<HTMLInputElement>("#convertWavelengthNm");
const convertFrequencyHzEl = document.querySelector<HTMLInputElement>("#convertFrequencyHz");
const convertEnergyEvEl = document.querySelector<HTMLInputElement>("#convertEnergyEv");

const telescopeListEl = document.querySelector<HTMLUListElement>("#telescopeList");
const objectListEl = document.querySelector<HTMLUListElement>("#objectList");
const lineListEl = document.querySelector<HTMLUListElement>("#lineList");

const spectrumBarEl = document.querySelector<HTMLDivElement>(".spectrum__bar");
const spectrumWaveCanvasEl = document.querySelector<HTMLCanvasElement>("#spectrumWaveCanvas");
const spectrumScaleEl = document.querySelector<HTMLDivElement>("#spectrumScale");

if (
  !wavelengthSliderEl ||
  !wavelengthValueEl ||
  bandButtons.length === 0 ||
  !bandBadgeEl ||
  !bandRangeEl ||
  !bandHighlightEl ||
  !markerEl ||
  !markerLabelEl ||
  !bandNameEl ||
  !bandDescriptionEl ||
  !bandExamplesEl ||
  !bandDetectionEl ||
  !readoutWavelengthEl ||
  !readoutFrequencyEl ||
  !readoutEnergyEl ||
  !readoutWavelengthUnitEl ||
  !readoutFrequencyUnitEl ||
  !readoutEnergyUnitEl ||
  !copyResultsEl ||
  !statusEl ||
  !tabConvertEl ||
  !tabTelescopesEl ||
  !tabObjectsEl ||
  !tabLinesEl ||
  !panelConvertEl ||
  !panelTelescopesEl ||
  !panelObjectsEl ||
  !panelLinesEl ||
  !convertWavelengthNmEl ||
  !convertFrequencyHzEl ||
  !convertEnergyEvEl ||
  !telescopeListEl ||
  !objectListEl ||
  !lineListEl
) {
  throw new Error("Missing required DOM elements for em-spectrum demo.");
}

const wavelengthSlider = wavelengthSliderEl;
const wavelengthValue = wavelengthValueEl;
const bandBadge = bandBadgeEl;
const bandRange = bandRangeEl;
const bandHighlight = bandHighlightEl;
const marker = markerEl;
const markerLabel = markerLabelEl;
const bandName = bandNameEl;
const bandDescription = bandDescriptionEl;
const bandExamples = bandExamplesEl;
const bandDetection = bandDetectionEl;
const readoutWavelength = readoutWavelengthEl;
const readoutFrequency = readoutFrequencyEl;
const readoutEnergy = readoutEnergyEl;
const readoutWavelengthUnit = readoutWavelengthUnitEl;
const readoutFrequencyUnit = readoutFrequencyUnitEl;
const readoutEnergyUnit = readoutEnergyUnitEl;
const copyResults = copyResultsEl;
const status = statusEl;

const convertWavelengthNm = convertWavelengthNmEl;
const convertFrequencyHz = convertFrequencyHzEl;
const convertEnergyEv = convertEnergyEvEl;

const telescopeList = telescopeListEl;
const objectList = objectListEl;
const lineList = lineListEl;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:em-spectrum:mode",
  url: new URL(window.location.href)
});

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

// Apply spectrum gradient
if (spectrumBarEl) {
  spectrumBarEl.style.background = spectrumGradientCSS();
}

// Draw chirp wave overlay
function renderWaveOverlay() {
  if (!spectrumWaveCanvasEl) return;
  const rect = spectrumWaveCanvasEl.parentElement?.getBoundingClientRect();
  if (!rect) return;
  const dpr = window.devicePixelRatio || 1;
  spectrumWaveCanvasEl.width = rect.width * dpr;
  spectrumWaveCanvasEl.height = rect.height * dpr;
  const ctx = spectrumWaveCanvasEl.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  drawSpectrumWave(ctx, rect.width, rect.height);
}
renderWaveOverlay();
window.addEventListener("resize", renderWaveOverlay);

// Render scale comparison objects
function renderScaleObjects() {
  if (!spectrumScaleEl) return;
  spectrumScaleEl.innerHTML = "";
  for (const obj of SCALE_OBJECTS) {
    const pos = clamp(wavelengthToPositionPercent(obj.lambdaCm), 3, 97);
    const span = document.createElement("span");
    span.className = "spectrum__scale-item";
    span.style.left = `${pos}%`;
    span.textContent = obj.label;
    spectrumScaleEl.appendChild(span);
  }
}
renderScaleObjects();

const state: { wavelengthCm: number; band: BandKey } = {
  wavelengthCm: AstroUnits.nmToCm(520),
  band: "visible"
};

function renderBandButtons(active: BandKey) {
  for (const btn of bandButtons) {
    const key = String(btn.dataset.band ?? "") as BandKey;
    const pressed = key === active;
    btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  }
}

function renderSpectrumMarker(lambdaCm: number) {
  const pos = clamp(wavelengthToPositionPercent(lambdaCm), 0, 100);
  marker.style.left = `${pos}%`;
  const w = formatWavelength(lambdaCm);
  markerLabel.textContent = `${w.value} ${w.unit}`.trim();
}

function renderBandHighlight(active: BandKey) {
  const band = BANDS[active];
  const left = clamp(wavelengthToPositionPercent(band.lambdaMaxCm), 0, 100);
  const right = clamp(wavelengthToPositionPercent(band.lambdaMinCm), 0, 100);
  const width = Math.max(0, right - left);
  bandHighlight.style.left = `${left}%`;
  bandHighlight.style.width = `${width}%`;
}

function renderBandCard(active: BandKey) {
  const band = BANDS[active];
  bandBadge.textContent = band.name;
  bandName.textContent = band.name;
  bandDescription.textContent = band.description;
  bandExamples.textContent = band.examples;
  bandDetection.textContent = band.detection;

  const min = formatWavelength(band.lambdaMinCm);
  const max = formatWavelength(band.lambdaMaxCm);
  bandRange.textContent = `${max.value} ${max.unit} to ${min.value} ${min.unit}`;
}

function renderReadouts(lambdaCm: number) {
  const nuHz = PhotonModel.frequencyHzFromWavelengthCm(lambdaCm);
  const energyErg = PhotonModel.photonEnergyErgFromWavelengthCm(lambdaCm);

  const w = formatWavelength(lambdaCm);
  const f = formatFrequency(nuHz);
  const e = formatEnergyFromErg(energyErg, AstroUnits.ergToEv);

  readoutWavelength.textContent = w.value;
  readoutWavelengthUnit.textContent = w.unit;
  readoutFrequency.textContent = f.value;
  readoutFrequencyUnit.textContent = f.unit;
  readoutEnergy.textContent = e.value;
  readoutEnergyUnit.textContent = e.unit;
  wavelengthValue.textContent = `${w.value} ${w.unit}`.trim();
}

function renderLists(lambdaCm: number) {
  telescopeList.innerHTML = "";
  for (const scope of emSpectrumTelescopes) {
    const active = lambdaCm >= scope.wavelengthMinCm && lambdaCm <= scope.wavelengthMaxCm;
    const rangeMin = formatWavelength(scope.wavelengthMinCm);
    const rangeMax = formatWavelength(scope.wavelengthMaxCm);
    const li = document.createElement("li");
    const prefix = active ? "Now: " : "";
    li.textContent = `${prefix}${scope.name} — ${scope.band} (${rangeMax.value} ${rangeMax.unit} to ${rangeMin.value} ${rangeMin.unit}) — ${scope.location}`;
    telescopeList.appendChild(li);
  }

  objectList.innerHTML = "";
  for (const obj of emSpectrumObjects) {
    const li = document.createElement("li");
    li.textContent = `${obj.name} — ${obj.why}`;
    objectList.appendChild(li);
  }

  lineList.innerHTML = "";
  for (const line of atomicLines) {
    const nm = AstroUnits.cmToNm(line.wavelengthCm);
    const li = document.createElement("li");
    li.textContent = `${line.label} (${line.species}) — ${nm.toFixed(3)} nm`;
    lineList.appendChild(li);
  }
  for (const band of molecularBands) {
    const um = band.centerWavelengthCm / 1e-4;
    const li = document.createElement("li");
    li.textContent = `${band.label} — ${um.toPrecision(3)} um`;
    lineList.appendChild(li);
  }
}

function exportResults(): ExportPayloadV1 {
  const lambdaCm = state.wavelengthCm;
  const nuHz = PhotonModel.frequencyHzFromWavelengthCm(lambdaCm);
  const energyErg = PhotonModel.photonEnergyErgFromWavelengthCm(lambdaCm);
  const wavelengthNm = AstroUnits.cmToNm(lambdaCm);
  const energyEv = AstroUnits.ergToEv(energyErg);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Wavelength lambda (nm)", value: wavelengthNm.toPrecision(6) },
      { name: "Band", value: BANDS[state.band].name }
    ],
    readouts: [
      { name: "Frequency nu (Hz)", value: nuHz.toPrecision(6) },
      { name: "Photon energy E (eV)", value: energyEv.toPrecision(6) }
    ],
    notes: [
      "Internal conversions use CGS: c in cm/s and h in erg*s.",
      "Relationships: c = lambda*nu and E = h*nu = hc/lambda."
    ]
  };
}

async function handleCopyResults() {
  try {
    await runtime.copyResults(exportResults());
    setLiveRegionText(status, "Copied results.");
  } catch {
    setLiveRegionText(status, "Copy failed.");
  }
}

type PanelKey = "convert" | "telescopes" | "objects" | "lines";

const tabs: Array<{ key: PanelKey; tab: HTMLButtonElement; panel: HTMLElement }> =
  [
    { key: "convert", tab: tabConvertEl, panel: panelConvertEl },
    { key: "telescopes", tab: tabTelescopesEl, panel: panelTelescopesEl },
    { key: "objects", tab: tabObjectsEl, panel: panelObjectsEl },
    { key: "lines", tab: tabLinesEl, panel: panelLinesEl }
  ];

let activePanel: PanelKey = "lines";

function setActivePanel(next: PanelKey) {
  activePanel = next;
  for (const item of tabs) {
    const selected = item.key === next;
    item.tab.setAttribute("aria-selected", selected ? "true" : "false");
    item.tab.tabIndex = selected ? 0 : -1;
    item.panel.hidden = !selected;
  }
}

function setWavelengthCm(lambdaCm: number) {
  state.wavelengthCm = lambdaCm;
  state.band = bandFromWavelengthCm(lambdaCm);

  const pos = wavelengthToPositionPercent(lambdaCm);
  wavelengthSlider.value = String(Math.round(clamp(pos, 0, 100) * 10));

  renderBandButtons(state.band);
  renderBandHighlight(state.band);
  renderSpectrumMarker(lambdaCm);
  renderBandCard(state.band);
  renderReadouts(lambdaCm);
  renderLists(lambdaCm);
}

function setBand(key: BandKey) {
  setWavelengthCm(bandCenterCm(key));
}

function initBandButtons() {
  for (const btn of bandButtons) {
    btn.addEventListener("click", () => {
      const key = String(btn.dataset.band ?? "") as BandKey;
      if (!(key in BANDS)) return;
      setBand(key);
    });
  }
}

function initSlider() {
  wavelengthSlider.addEventListener("input", () => {
    const pos = (Number(wavelengthSlider.value) / 1000) * 100;
    setWavelengthCm(positionPercentToWavelengthCm(pos));
  });
}

function initTabs() {
  for (const item of tabs) {
    item.tab.addEventListener("click", () => setActivePanel(item.key));
    item.tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const idx = tabs.findIndex((t) => t.key === activePanel);
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + delta + tabs.length) % tabs.length;
      setActivePanel(tabs[next].key);
      tabs[next].tab.focus();
    });
  }
}

let convertLock: "wavelength" | "frequency" | "energy" | null = null;

function setConvertInputs(args: { wavelengthNm?: number; frequencyHz?: number; energyEv?: number }) {
  if (typeof args.wavelengthNm === "number") {
    convertWavelengthNm.value = Number.isFinite(args.wavelengthNm) ? String(args.wavelengthNm) : "";
  }
  if (typeof args.frequencyHz === "number") {
    convertFrequencyHz.value = Number.isFinite(args.frequencyHz) ? String(args.frequencyHz) : "";
  }
  if (typeof args.energyEv === "number") {
    convertEnergyEv.value = Number.isFinite(args.energyEv) ? String(args.energyEv) : "";
  }
}

function initConvertPanel() {
  convertWavelengthNm.addEventListener("input", () => {
    if (convertLock) return;
    convertLock = "wavelength";
    const wavelengthNm = Number(convertWavelengthNm.value);
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
      setConvertInputs({ frequencyHz: NaN, energyEv: NaN });
      convertLock = null;
      return;
    }
    setConvertInputs({
      frequencyHz: PhotonModel.frequencyHzFromWavelengthNm(wavelengthNm),
      energyEv: PhotonModel.photonEnergyEvFromWavelengthNm(wavelengthNm)
    });
    convertLock = null;
  });

  convertFrequencyHz.addEventListener("input", () => {
    if (convertLock) return;
    convertLock = "frequency";
    const frequencyHz = Number(convertFrequencyHz.value);
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
      setConvertInputs({ wavelengthNm: NaN, energyEv: NaN });
      convertLock = null;
      return;
    }
    const wavelengthNm = PhotonModel.wavelengthNmFromFrequencyHz(frequencyHz);
    setConvertInputs({
      wavelengthNm,
      energyEv: PhotonModel.photonEnergyEvFromFrequencyHz(frequencyHz)
    });
    convertLock = null;
  });

  convertEnergyEv.addEventListener("input", () => {
    if (convertLock) return;
    convertLock = "energy";
    const energyEv = Number(convertEnergyEv.value);
    if (!Number.isFinite(energyEv) || energyEv <= 0) {
      setConvertInputs({ wavelengthNm: NaN, frequencyHz: NaN });
      convertLock = null;
      return;
    }
    const wavelengthNm = PhotonModel.wavelengthNmFromPhotonEnergyEv(energyEv);
    setConvertInputs({
      wavelengthNm,
      frequencyHz: PhotonModel.frequencyHzFromPhotonEnergyEv(energyEv)
    });
    convertLock = null;
  });
}

copyResults.addEventListener("click", () => void handleCopyResults());
initBandButtons();
initSlider();
initTabs();
initConvertPanel();
setActivePanel("lines");
setWavelengthCm(state.wavelengthCm);
initMath(document);
