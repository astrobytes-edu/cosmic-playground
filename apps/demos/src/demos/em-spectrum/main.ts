import {
  createInstrumentRuntime,
  initMath,
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

type BandKey =
  | "radio"
  | "microwave"
  | "infrared"
  | "visible"
  | "ultraviolet"
  | "xray"
  | "gamma";

type BandInfo = {
  key: BandKey;
  name: string;
  lambdaMinCm: number;
  lambdaMaxCm: number;
  description: string;
  examples: string;
  detection: string;
};

const BANDS: Record<BandKey, BandInfo> = {
  radio: {
    key: "radio",
    name: "Radio",
    lambdaMinCm: 1e-1, // 1 mm
    lambdaMaxCm: 1e6, // 10 km
    description:
      "The longest wavelengths in the EM spectrum. Radio waves pass through clouds, dust, and even buildings.",
    examples:
      "AM/FM radio, WiFi, pulsars, the cosmic microwave background, radio galaxies",
    detection: "Large dish antennas and interferometers (VLA, ALMA, FAST)"
  },
  microwave: {
    key: "microwave",
    name: "Microwave",
    lambdaMinCm: 1e-2, // 0.1 mm
    lambdaMaxCm: 1e-1, // 1 mm
    description:
      "Between radio and infrared. Microwaves reveal the cosmic microwave background and cold molecular gas.",
    examples: "Microwave ovens, CMB, molecular clouds, radar",
    detection: "Microwave receivers and bolometers (Planck, WMAP)"
  },
  infrared: {
    key: "infrared",
    name: "Infrared",
    lambdaMinCm: 7e-5, // 700 nm
    lambdaMaxCm: 1e-2, // 0.1 mm
    description:
      "Emitted by warm objects. Infrared can penetrate dust clouds to reveal star-forming regions.",
    examples: "Thermal emission, brown dwarfs, dust-enshrouded star formation",
    detection: "Cooled IR detectors (JWST, Spitzer, Herschel)"
  },
  visible: {
    key: "visible",
    name: "Visible",
    lambdaMinCm: 3.8e-5, // 380 nm
    lambdaMaxCm: 7e-5, // 700 nm
    description:
      "The narrow band our eyes can see. Stars, galaxies, and nebulae shine brightly in visible light.",
    examples: "Sunlight, starlight, nebulae, galaxies",
    detection: "Human eyes, CCDs, ground optical telescopes, Hubble"
  },
  ultraviolet: {
    key: "ultraviolet",
    name: "Ultraviolet",
    lambdaMinCm: 1e-6, // 10 nm
    lambdaMaxCm: 3.8e-5, // 380 nm
    description:
      "Higher energy than visible light. UV reveals hot young stars and active galactic nuclei.",
    examples: "Sunburns, massive stars, accretion disks",
    detection: "UV-sensitive detectors, mostly space-based (HST, GALEX)"
  },
  xray: {
    key: "xray",
    name: "X-ray",
    lambdaMinCm: 1e-9, // 0.01 nm
    lambdaMaxCm: 1e-6, // 10 nm
    description:
      "Very high energy photons from extremely hot gas and violent events.",
    examples: "X-ray binaries, supernova remnants, hot cluster gas",
    detection: "Space telescopes with grazing-incidence optics (Chandra, XMM)"
  },
  gamma: {
    key: "gamma",
    name: "Gamma-ray",
    lambdaMinCm: 1e-13, // ~1 fm
    lambdaMaxCm: 1e-9, // 0.01 nm
    description:
      "The highest energy photons. Gamma rays come from the most extreme events in the universe.",
    examples: "Gamma-ray bursts, nuclear reactions, pulsars",
    detection: "Space detectors (Fermi) and ground Cherenkov telescopes (VERITAS)"
  }
};

const LAMBDA_MIN_LOG = Math.log10(1e-12); // 10 fm
const LAMBDA_MAX_LOG = Math.log10(1e6); // 10 km

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wavelengthToPositionPercent(lambdaCm: number): number {
  const lambdaLog = Math.log10(Math.max(1e-13, Math.min(1e7, lambdaCm)));
  return 100 - ((lambdaLog - LAMBDA_MIN_LOG) / (LAMBDA_MAX_LOG - LAMBDA_MIN_LOG)) * 100;
}

function positionPercentToWavelengthCm(positionPercent: number): number {
  const pos = clamp(positionPercent, 0, 100);
  const lambdaLog = LAMBDA_MAX_LOG - (pos / 100) * (LAMBDA_MAX_LOG - LAMBDA_MIN_LOG);
  return Math.pow(10, lambdaLog);
}

function formatWavelength(lambdaCm: number): { value: string; unit: string } {
  if (!Number.isFinite(lambdaCm) || lambdaCm <= 0) return { value: "—", unit: "" };
  if (lambdaCm >= 1e5) return { value: (lambdaCm / 1e5).toPrecision(3), unit: "km" };
  if (lambdaCm >= 100) return { value: (lambdaCm / 100).toPrecision(3), unit: "m" };
  if (lambdaCm >= 0.1) return { value: (lambdaCm * 10).toPrecision(3), unit: "mm" };
  if (lambdaCm >= 1e-4) return { value: (lambdaCm / 1e-4).toPrecision(3), unit: "um" };
  if (lambdaCm >= 1e-7) return { value: (lambdaCm / 1e-7).toPrecision(3), unit: "nm" };
  if (lambdaCm >= 1e-10) return { value: (lambdaCm / 1e-10).toPrecision(3), unit: "pm" };
  return { value: (lambdaCm / 1e-13).toPrecision(3), unit: "fm" };
}

function formatFrequency(nuHz: number): { value: string; unit: string } {
  if (!Number.isFinite(nuHz) || nuHz <= 0) return { value: "—", unit: "" };
  if (nuHz >= 1e18) return { value: (nuHz / 1e18).toPrecision(3), unit: "EHz" };
  if (nuHz >= 1e15) return { value: (nuHz / 1e15).toPrecision(3), unit: "PHz" };
  if (nuHz >= 1e12) return { value: (nuHz / 1e12).toPrecision(3), unit: "THz" };
  if (nuHz >= 1e9) return { value: (nuHz / 1e9).toPrecision(3), unit: "GHz" };
  if (nuHz >= 1e6) return { value: (nuHz / 1e6).toPrecision(3), unit: "MHz" };
  if (nuHz >= 1e3) return { value: (nuHz / 1e3).toPrecision(3), unit: "kHz" };
  return { value: nuHz.toPrecision(3), unit: "Hz" };
}

function formatEnergyFromErg(energyErg: number): { value: string; unit: string } {
  if (!Number.isFinite(energyErg) || energyErg <= 0) return { value: "—", unit: "" };
  const energyEv = AstroUnits.ergToEv(energyErg);
  if (energyEv >= 1e6) return { value: (energyEv / 1e6).toPrecision(3), unit: "MeV" };
  if (energyEv >= 1e3) return { value: (energyEv / 1e3).toPrecision(3), unit: "keV" };
  if (energyEv >= 1e-3) return { value: energyEv.toPrecision(3), unit: "eV" };
  return { value: energyErg.toPrecision(3), unit: "erg" };
}

function bandFromWavelengthCm(lambdaCm: number): BandKey {
  for (const key of Object.keys(BANDS) as BandKey[]) {
    const band = BANDS[key];
    if (lambdaCm >= band.lambdaMinCm && lambdaCm <= band.lambdaMaxCm) return key;
  }
  if (lambdaCm > BANDS.radio.lambdaMaxCm) return "radio";
  if (lambdaCm < BANDS.gamma.lambdaMinCm) return "gamma";
  return "visible";
}

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
const copyResults = copyResultsEl;
const status = statusEl;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:em-spectrum:mode",
  url: new URL(window.location.href)
});

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
  const e = formatEnergyFromErg(energyErg);

  readoutWavelength.textContent = `${w.value} ${w.unit}`.trim();
  readoutFrequency.textContent = `${f.value} ${f.unit}`.trim();
  readoutEnergy.textContent = `${e.value} ${e.unit}`.trim();
  wavelengthValue.textContent = `${w.value} ${w.unit}`.trim();
}

function renderLists(lambdaCm: number) {
  telescopeListEl.innerHTML = "";
  for (const scope of emSpectrumTelescopes) {
    const active = lambdaCm >= scope.wavelengthMinCm && lambdaCm <= scope.wavelengthMaxCm;
    const rangeMin = formatWavelength(scope.wavelengthMinCm);
    const rangeMax = formatWavelength(scope.wavelengthMaxCm);
    const li = document.createElement("li");
    const prefix = active ? "Now: " : "";
    li.textContent = `${prefix}${scope.name} — ${scope.band} (${rangeMax.value} ${rangeMax.unit} to ${rangeMin.value} ${rangeMin.unit}) — ${scope.location}`;
    telescopeListEl.appendChild(li);
  }

  objectListEl.innerHTML = "";
  for (const obj of emSpectrumObjects) {
    const li = document.createElement("li");
    li.textContent = `${obj.name} — ${obj.why}`;
    objectListEl.appendChild(li);
  }

  lineListEl.innerHTML = "";
  for (const line of atomicLines) {
    const nm = AstroUnits.cmToNm(line.wavelengthCm);
    const li = document.createElement("li");
    li.textContent = `${line.label} (${line.species}) — ${nm.toFixed(3)} nm`;
    lineListEl.appendChild(li);
  }
  for (const band of molecularBands) {
    const um = band.centerWavelengthCm / 1e-4;
    const li = document.createElement("li");
    li.textContent = `${band.label} — ${um.toPrecision(3)} um`;
    lineListEl.appendChild(li);
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
  const band = BANDS[key];
  const lambdaCenter = Math.sqrt(band.lambdaMinCm * band.lambdaMaxCm);
  setWavelengthCm(lambdaCenter);
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
    convertWavelengthNmEl.value = Number.isFinite(args.wavelengthNm) ? String(args.wavelengthNm) : "";
  }
  if (typeof args.frequencyHz === "number") {
    convertFrequencyHzEl.value = Number.isFinite(args.frequencyHz) ? String(args.frequencyHz) : "";
  }
  if (typeof args.energyEv === "number") {
    convertEnergyEvEl.value = Number.isFinite(args.energyEv) ? String(args.energyEv) : "";
  }
}

function initConvertPanel() {
  convertWavelengthNmEl.addEventListener("input", () => {
    if (convertLock) return;
    convertLock = "wavelength";
    const wavelengthNm = Number(convertWavelengthNmEl.value);
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

  convertFrequencyHzEl.addEventListener("input", () => {
    if (convertLock) return;
    convertLock = "frequency";
    const frequencyHz = Number(convertFrequencyHzEl.value);
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

  convertEnergyEvEl.addEventListener("input", () => {
    if (convertLock) return;
    convertLock = "energy";
    const energyEv = Number(convertEnergyEvEl.value);
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
