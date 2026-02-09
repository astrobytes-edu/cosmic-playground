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
import { ParallaxDistanceModel } from "@cosmic/physics";
import { nearbyStars } from "@cosmic/data-astr101";
import {
  clamp,
  describeMeasurability,
  detectorOffsetsMas,
  errorRadiusPx,
  formatNumber,
  normalizePhaseDeg,
  oppositePhaseDeg,
  offsetPx,
  parallaxArcsecFromMas,
  signalToNoise
} from "./logic";

function requireEl<T extends Element>(element: T | null, name: string): T {
  if (!element) {
    throw new Error(`Missing required element: ${name}`);
  }
  return element;
}

type DetectorMode = "overlay" | "difference";

type DemoState = {
  distancePc: number;
  phaseDeg: number;
  sigmaMas: number;
  exaggeration: number;
  showBaseline: boolean;
  detectorMode: DetectorMode;
  blinkMode: boolean;
};

type ModelSnapshot = {
  parallaxMas: number;
  parallaxArcsec: number;
  separationMas: number;
  separationArcsec: number;
  inferredDistancePc: number;
  inferredDistanceLy: number;
  snr: number;
  quality: string;
  epochAName: string;
  epochBName: string;
  epochA: { xMas: number; yMas: number };
  epochB: { xMas: number; yMas: number };
};

const DISTANCE_PC_MIN = 1;
const DISTANCE_PC_MAX = 5000;
const SIGMA_MAS_MIN = 0.1;
const SIGMA_MAS_MAX = 20;
const EXAGGERATION_MIN = 1;
const EXAGGERATION_MAX = 40;

const ORBIT_CENTER = { x: 280, y: 220 };
const ORBIT_RADIUS = 138;
const TARGET_STAR_POS = { x: 280, y: 58 };
const DETECTOR_CENTER = { x: 280, y: 210 };
const DETECTOR_RANGE_PX = 182;
const DETECTOR_PX_PER_MAS = 0.012;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const SCATTER_TEMPLATES: Array<{ angleDeg: number; radiusScale: number }> = [
  { angleDeg: 18, radiusScale: 0.35 },
  { angleDeg: 56, radiusScale: 0.62 },
  { angleDeg: 102, radiusScale: 0.78 },
  { angleDeg: 148, radiusScale: 0.94 },
  { angleDeg: 206, radiusScale: 0.58 },
  { angleDeg: 252, radiusScale: 0.86 },
  { angleDeg: 298, radiusScale: 0.44 },
  { angleDeg: 332, radiusScale: 0.72 }
];

const SVG_NS = "http://www.w3.org/2000/svg";

const state: DemoState = {
  distancePc: 10,
  phaseDeg: 0,
  sigmaMas: 1,
  exaggeration: 15,
  showBaseline: true,
  detectorMode: "overlay",
  blinkMode: false
};

let blinkTimer: number | null = null;
let blinkShowEpochA = true;

function prefersReducedMotionEnabled(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const starPreset = requireEl(
  document.querySelector<HTMLSelectElement>("#starPreset"),
  "#starPreset"
);
const distancePcInput = requireEl(
  document.querySelector<HTMLInputElement>("#distancePcInput"),
  "#distancePcInput"
);
const distanceLyInput = requireEl(
  document.querySelector<HTMLInputElement>("#distanceLyInput"),
  "#distanceLyInput"
);
const distancePcRange = requireEl(
  document.querySelector<HTMLInputElement>("#distancePcRange"),
  "#distancePcRange"
);
const distancePcValue = requireEl(
  document.querySelector<HTMLElement>("#distancePcValue"),
  "#distancePcValue"
);

const phaseDeg = requireEl(
  document.querySelector<HTMLInputElement>("#phaseDeg"),
  "#phaseDeg"
);
const phaseDegValue = requireEl(
  document.querySelector<HTMLElement>("#phaseDegValue"),
  "#phaseDegValue"
);
const phasePresetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".phase-preset")
);

const showBaseline = requireEl(
  document.querySelector<HTMLInputElement>("#showBaseline"),
  "#showBaseline"
);

const detectorModeOverlay = requireEl(
  document.querySelector<HTMLButtonElement>("#detectorModeOverlay"),
  "#detectorModeOverlay"
);
const detectorModeDifference = requireEl(
  document.querySelector<HTMLButtonElement>("#detectorModeDifference"),
  "#detectorModeDifference"
);
const blinkMode = requireEl(
  document.querySelector<HTMLInputElement>("#blinkMode"),
  "#blinkMode"
);

const sigmaMas = requireEl(
  document.querySelector<HTMLInputElement>("#sigmaMas"),
  "#sigmaMas"
);
const sigmaMasValue = requireEl(
  document.querySelector<HTMLElement>("#sigmaMasValue"),
  "#sigmaMasValue"
);

const exaggeration = requireEl(
  document.querySelector<HTMLInputElement>("#exaggeration"),
  "#exaggeration"
);
const exaggerationValue = requireEl(
  document.querySelector<HTMLElement>("#exaggerationValue"),
  "#exaggerationValue"
);

const stationModeButton = requireEl(
  document.querySelector<HTMLButtonElement>("#stationMode"),
  "#stationMode"
);
const helpButton = requireEl(
  document.querySelector<HTMLButtonElement>("#help"),
  "#help"
);
const copyResults = requireEl(
  document.querySelector<HTMLButtonElement>("#copyResults"),
  "#copyResults"
);
const status = requireEl(
  document.querySelector<HTMLParagraphElement>("#status"),
  "#status"
);

const orbitSvg = requireEl(
  document.querySelector<SVGSVGElement>("#orbitSvg"),
  "#orbitSvg"
);
const baseline = requireEl(
  document.querySelector<SVGLineElement>("#baseline"),
  "#baseline"
);
const baselineLabel = requireEl(
  document.querySelector<SVGTextElement>("#baselineLabel"),
  "#baselineLabel"
);
const rayEpochA = requireEl(
  document.querySelector<SVGLineElement>("#rayEpochA"),
  "#rayEpochA"
);
const rayEpochB = requireEl(
  document.querySelector<SVGLineElement>("#rayEpochB"),
  "#rayEpochB"
);
const earthEpochAGroup = requireEl(
  document.querySelector<SVGGElement>("#earthEpochAGroup"),
  "#earthEpochAGroup"
);
const earthEpochA = requireEl(
  document.querySelector<SVGCircleElement>("#earthEpochA"),
  "#earthEpochA"
);
const earthEpochB = requireEl(
  document.querySelector<SVGCircleElement>("#earthEpochB"),
  "#earthEpochB"
);
const earthEpochALabel = requireEl(
  document.querySelector<SVGTextElement>("#earthEpochALabel"),
  "#earthEpochALabel"
);
const earthEpochBLabel = requireEl(
  document.querySelector<SVGTextElement>("#earthEpochBLabel"),
  "#earthEpochBLabel"
);

const detectorPanel = requireEl(
  document.querySelector<HTMLElement>("#detectorPanel"),
  "#detectorPanel"
);
const detectorMarkerEpochA = requireEl(
  document.querySelector<SVGCircleElement>("#detectorMarkerEpochA"),
  "#detectorMarkerEpochA"
);
const detectorMarkerEpochB = requireEl(
  document.querySelector<SVGCircleElement>("#detectorMarkerEpochB"),
  "#detectorMarkerEpochB"
);
const detectorEpochALabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorEpochALabel"),
  "#detectorEpochALabel"
);
const detectorEpochBLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorEpochBLabel"),
  "#detectorEpochBLabel"
);
const differenceVector = requireEl(
  document.querySelector<SVGLineElement>("#differenceVector"),
  "#differenceVector"
);
const errorCircleEpochA = requireEl(
  document.querySelector<SVGCircleElement>("#errorCircleEpochA"),
  "#errorCircleEpochA"
);
const errorCircleEpochB = requireEl(
  document.querySelector<SVGCircleElement>("#errorCircleEpochB"),
  "#errorCircleEpochB"
);
const scatterEpochA = requireEl(
  document.querySelector<SVGGElement>("#scatterEpochA"),
  "#scatterEpochA"
);
const scatterEpochB = requireEl(
  document.querySelector<SVGGElement>("#scatterEpochB"),
  "#scatterEpochB"
);
const detectorModeLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorModeLabel"),
  "#detectorModeLabel"
);
const detectorSeparationLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorSeparationLabel"),
  "#detectorSeparationLabel"
);

const separationArcsecValue = requireEl(
  document.querySelector<HTMLElement>("#separationArcsec"),
  "#separationArcsec"
);
const separationMasValue = requireEl(
  document.querySelector<HTMLElement>("#separationMas"),
  "#separationMas"
);
const parallaxArcsecValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxArcsec"),
  "#parallaxArcsec"
);
const parallaxMasValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxMas"),
  "#parallaxMas"
);
const distancePcReadout = requireEl(
  document.querySelector<HTMLElement>("#distancePc"),
  "#distancePc"
);
const distanceLyReadout = requireEl(
  document.querySelector<HTMLElement>("#distanceLy"),
  "#distanceLy"
);
const snrValue = requireEl(document.querySelector<HTMLElement>("#snr"), "#snr");
const snrQualityValue = requireEl(
  document.querySelector<HTMLElement>("#snrQuality"),
  "#snrQuality"
);

function monthLabelFromPhaseDeg(phaseValueDeg: number): string {
  const normalized = normalizePhaseDeg(phaseValueDeg);
  const monthIndex = Math.round(normalized / 30) % 12;
  return MONTH_LABELS[monthIndex] ?? "Jan";
}

function setChipPressed(button: HTMLButtonElement, pressed: boolean) {
  button.classList.toggle("is-active", pressed);
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function formatDistance(valuePc: number): string {
  if (!Number.isFinite(valuePc)) return "Infinity";
  return valuePc >= 100 ? formatNumber(valuePc, 1) : formatNumber(valuePc, 2);
}

function modelSnapshot(): ModelSnapshot {
  const parallaxMas = ParallaxDistanceModel.parallaxMasFromDistanceParsec(state.distancePc);
  const parallaxArcsec = parallaxArcsecFromMas(parallaxMas);

  const offsets = detectorOffsetsMas(parallaxMas, state.phaseDeg);
  const separationMas = offsets.separationMas;
  const separationArcsec = parallaxArcsecFromMas(separationMas);

  const inferredParallaxMas = separationMas / 2;
  const inferredDistancePc = ParallaxDistanceModel.distanceParsecFromParallaxMas(inferredParallaxMas);
  const inferredDistanceLy = ParallaxDistanceModel.distanceLyFromParsec(inferredDistancePc);

  const snr = signalToNoise(inferredParallaxMas, state.sigmaMas);

  return {
    parallaxMas,
    parallaxArcsec,
    separationMas,
    separationArcsec,
    inferredDistancePc,
    inferredDistanceLy,
    snr,
    quality: describeMeasurability(snr),
    epochAName: monthLabelFromPhaseDeg(state.phaseDeg),
    epochBName: monthLabelFromPhaseDeg(oppositePhaseDeg(state.phaseDeg)),
    epochA: offsets.epochA,
    epochB: offsets.epochB
  };
}

function orbitPosition(phaseDegValue: number): { x: number; y: number } {
  const theta = (normalizePhaseDeg(phaseDegValue) * Math.PI) / 180 + Math.PI;
  return {
    x: ORBIT_CENTER.x + ORBIT_RADIUS * Math.cos(theta),
    y: ORBIT_CENTER.y + ORBIT_RADIUS * Math.sin(theta)
  };
}

function setLine(line: SVGLineElement, x1: number, y1: number, x2: number, y2: number) {
  line.setAttribute("x1", x1.toFixed(2));
  line.setAttribute("y1", y1.toFixed(2));
  line.setAttribute("x2", x2.toFixed(2));
  line.setAttribute("y2", y2.toFixed(2));
}

function setVisibility(element: Element, visible: boolean) {
  element.setAttribute("visibility", visible ? "visible" : "hidden");
}

function renderScatter(group: SVGGElement, centerX: number, centerY: number, radius: number) {
  group.replaceChildren();

  for (const template of SCATTER_TEMPLATES) {
    const angleRad = (template.angleDeg * Math.PI) / 180;
    const x = centerX + Math.cos(angleRad) * radius * template.radiusScale;
    const y = centerY + Math.sin(angleRad) * radius * template.radiusScale;
    const point = document.createElementNS(SVG_NS, "circle");
    point.setAttribute("cx", x.toFixed(2));
    point.setAttribute("cy", y.toFixed(2));
    point.setAttribute("r", "1.8");
    group.appendChild(point);
  }
}

function syncDistanceControls() {
  const distanceLy = ParallaxDistanceModel.distanceLyFromParsec(state.distancePc);
  distancePcRange.value = formatNumber(state.distancePc, 1);
  distancePcInput.value = formatNumber(state.distancePc, 2);
  distanceLyInput.value = formatNumber(distanceLy, 2);
  distancePcValue.textContent = `${formatDistance(state.distancePc)} pc`;
}

function renderControls(snapshot: ModelSnapshot) {
  syncDistanceControls();

  phaseDeg.value = String(Math.round(normalizePhaseDeg(state.phaseDeg)));
  phaseDegValue.textContent = `${Math.round(normalizePhaseDeg(state.phaseDeg))}\u00b0 (${snapshot.epochAName} reference)`;

  sigmaMas.value = formatNumber(state.sigmaMas, 1);
  sigmaMasValue.textContent = `${formatNumber(state.sigmaMas, 1)} mas`;

  exaggeration.value = formatNumber(state.exaggeration, 1);
  exaggerationValue.textContent = `${formatNumber(state.exaggeration, 1)}\u00d7`;

  showBaseline.checked = state.showBaseline;
  blinkMode.checked = state.blinkMode;

  setChipPressed(detectorModeOverlay, state.detectorMode === "overlay");
  setChipPressed(detectorModeDifference, state.detectorMode === "difference");

  const normalized = normalizePhaseDeg(state.phaseDeg);
  for (const button of phasePresetButtons) {
    const target = Number(button.dataset.phase);
    const active = Number.isFinite(target) && Math.abs(normalized - target) < 0.5;
    setChipPressed(button, active);
  }
}

function renderOrbit(snapshot: ModelSnapshot) {
  const epochAPos = orbitPosition(state.phaseDeg);
  const epochBPos = orbitPosition(oppositePhaseDeg(state.phaseDeg));

  earthEpochA.setAttribute("cx", epochAPos.x.toFixed(2));
  earthEpochA.setAttribute("cy", epochAPos.y.toFixed(2));
  earthEpochB.setAttribute("cx", epochBPos.x.toFixed(2));
  earthEpochB.setAttribute("cy", epochBPos.y.toFixed(2));

  earthEpochALabel.setAttribute("x", epochAPos.x.toFixed(2));
  earthEpochALabel.setAttribute("y", (epochAPos.y + 28).toFixed(2));
  earthEpochALabel.textContent = snapshot.epochAName;

  earthEpochBLabel.setAttribute("x", epochBPos.x.toFixed(2));
  earthEpochBLabel.setAttribute("y", (epochBPos.y + 28).toFixed(2));
  earthEpochBLabel.textContent = snapshot.epochBName;

  setLine(rayEpochA, epochAPos.x, epochAPos.y, TARGET_STAR_POS.x, TARGET_STAR_POS.y);
  setLine(rayEpochB, epochBPos.x, epochBPos.y, TARGET_STAR_POS.x, TARGET_STAR_POS.y);

  setLine(baseline, epochAPos.x, epochAPos.y, epochBPos.x, epochBPos.y);
  baselineLabel.textContent = `Baseline ${snapshot.epochAName}\u2013${snapshot.epochBName} \u2248 2 AU (schematic)`;

  setVisibility(baseline, state.showBaseline);
  setVisibility(baselineLabel, state.showBaseline);

  earthEpochAGroup.setAttribute("aria-valuenow", String(Math.round(normalizePhaseDeg(state.phaseDeg))));
  earthEpochAGroup.setAttribute(
    "aria-valuetext",
    `${snapshot.epochAName} reference, ${snapshot.epochBName} comparison`
  );
}

function renderDetector(snapshot: ModelSnapshot) {
  const xA = clamp(
    offsetPx(snapshot.epochA.xMas, state.exaggeration, DETECTOR_PX_PER_MAS),
    -DETECTOR_RANGE_PX,
    DETECTOR_RANGE_PX
  );
  const yA = clamp(
    offsetPx(snapshot.epochA.yMas, state.exaggeration, DETECTOR_PX_PER_MAS),
    -DETECTOR_RANGE_PX,
    DETECTOR_RANGE_PX
  );
  const xB = clamp(
    offsetPx(snapshot.epochB.xMas, state.exaggeration, DETECTOR_PX_PER_MAS),
    -DETECTOR_RANGE_PX,
    DETECTOR_RANGE_PX
  );
  const yB = clamp(
    offsetPx(snapshot.epochB.yMas, state.exaggeration, DETECTOR_PX_PER_MAS),
    -DETECTOR_RANGE_PX,
    DETECTOR_RANGE_PX
  );

  const epochAX = DETECTOR_CENTER.x + xA;
  const epochAY = DETECTOR_CENTER.y + yA;
  const epochBX = DETECTOR_CENTER.x + xB;
  const epochBY = DETECTOR_CENTER.y + yB;

  detectorMarkerEpochA.setAttribute("cx", epochAX.toFixed(2));
  detectorMarkerEpochA.setAttribute("cy", epochAY.toFixed(2));
  detectorMarkerEpochB.setAttribute("cx", epochBX.toFixed(2));
  detectorMarkerEpochB.setAttribute("cy", epochBY.toFixed(2));

  detectorEpochALabel.setAttribute("x", epochAX.toFixed(2));
  detectorEpochALabel.setAttribute("y", (epochAY + 24).toFixed(2));
  detectorEpochALabel.textContent = snapshot.epochAName;

  detectorEpochBLabel.setAttribute("x", epochBX.toFixed(2));
  detectorEpochBLabel.setAttribute("y", (epochBY + 24).toFixed(2));
  detectorEpochBLabel.textContent = snapshot.epochBName;

  setLine(differenceVector, epochAX, epochAY, epochBX, epochBY);

  const uncertaintyRadius = errorRadiusPx(
    state.sigmaMas,
    state.exaggeration,
    DETECTOR_PX_PER_MAS,
    3,
    46
  );

  errorCircleEpochA.setAttribute("cx", epochAX.toFixed(2));
  errorCircleEpochA.setAttribute("cy", epochAY.toFixed(2));
  errorCircleEpochA.setAttribute("r", uncertaintyRadius.toFixed(2));

  errorCircleEpochB.setAttribute("cx", epochBX.toFixed(2));
  errorCircleEpochB.setAttribute("cy", epochBY.toFixed(2));
  errorCircleEpochB.setAttribute("r", uncertaintyRadius.toFixed(2));

  renderScatter(scatterEpochA, epochAX, epochAY, uncertaintyRadius);
  renderScatter(scatterEpochB, epochBX, epochBY, uncertaintyRadius);

  detectorPanel.dataset.detectorMode = state.detectorMode;
  detectorPanel.dataset.blink = state.blinkMode ? "on" : "off";

  if (state.detectorMode === "difference") {
    detectorModeLabel.textContent = "Difference mode: compare the Jan\u2013Jul vector directly.";
  } else {
    detectorModeLabel.textContent = "Overlay mode: compare both epochs directly.";
  }

  detectorSeparationLabel.textContent = `Measured separation 2p = ${formatNumber(
    snapshot.separationMas,
    2
  )} mas`;

  const showEpochA = !state.blinkMode || blinkShowEpochA;
  const showEpochB = !state.blinkMode || !blinkShowEpochA;

  setVisibility(detectorMarkerEpochA, showEpochA);
  setVisibility(detectorEpochALabel, showEpochA);
  setVisibility(errorCircleEpochA, showEpochA);
  setVisibility(scatterEpochA, showEpochA);

  setVisibility(detectorMarkerEpochB, showEpochB);
  setVisibility(detectorEpochBLabel, showEpochB);
  setVisibility(errorCircleEpochB, showEpochB);
  setVisibility(scatterEpochB, showEpochB);
}

function renderReadouts(snapshot: ModelSnapshot) {
  separationArcsecValue.textContent = formatNumber(snapshot.separationArcsec, 6);
  separationMasValue.textContent = formatNumber(snapshot.separationMas, 2);

  parallaxArcsecValue.textContent = formatNumber(snapshot.parallaxArcsec, 6);
  parallaxMasValue.textContent = formatNumber(snapshot.parallaxMas, 2);

  distancePcReadout.textContent = formatDistance(snapshot.inferredDistancePc);
  distanceLyReadout.textContent = formatDistance(snapshot.inferredDistanceLy);

  snrValue.textContent = Number.isFinite(snapshot.snr) ? formatNumber(snapshot.snr, 2) : "\u2014";
  snrQualityValue.textContent = snapshot.quality;
}

function render() {
  const snapshot = modelSnapshot();
  renderControls(snapshot);
  renderOrbit(snapshot);
  renderDetector(snapshot);
  renderReadouts(snapshot);
}

function setDistancePc(nextDistancePc: number, source: "preset" | "manual" = "manual") {
  if (!Number.isFinite(nextDistancePc)) return;
  state.distancePc = clamp(nextDistancePc, DISTANCE_PC_MIN, DISTANCE_PC_MAX);
  if (source === "manual" && starPreset.value !== "") {
    starPreset.value = "";
  }
  render();
}

function setPhaseDeg(nextPhaseDeg: number) {
  if (!Number.isFinite(nextPhaseDeg)) return;
  state.phaseDeg = normalizePhaseDeg(nextPhaseDeg);
  render();
}

function populatePresetSelect() {
  starPreset.innerHTML = "";

  const custom = document.createElement("option");
  custom.value = "";
  custom.textContent = "Custom distance";
  starPreset.appendChild(custom);

  for (const star of nearbyStars) {
    const option = document.createElement("option");
    const distancePc = ParallaxDistanceModel.distanceParsecFromParallaxMas(star.parallaxMas);
    option.value = star.name;
    option.dataset.distancePc = formatNumber(distancePc, 6);
    option.textContent = `${star.name} (${formatNumber(distancePc, 2)} pc)`;
    starPreset.appendChild(option);
  }

  starPreset.value = "";
}

function currentPresetLabel(): string {
  const selected = starPreset.selectedOptions[0];
  return selected ? selected.textContent?.trim() || "Custom distance" : "Custom distance";
}

function updateBlinkTimer() {
  const shouldAnimate = state.blinkMode && !prefersReducedMotionEnabled();

  if (shouldAnimate && blinkTimer === null) {
    blinkTimer = window.setInterval(() => {
      blinkShowEpochA = !blinkShowEpochA;
      render();
    }, 420);
  }

  if (!shouldAnimate && blinkTimer !== null) {
    window.clearInterval(blinkTimer);
    blinkTimer = null;
    blinkShowEpochA = true;
  }
}

function phaseFromPointerEvent(event: MouseEvent | TouchEvent): number {
  const point = orbitSvg.createSVGPoint();
  const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
  const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;

  point.x = clientX;
  point.y = clientY;
  const svgPoint = point.matrixTransform(orbitSvg.getScreenCTM()!.inverse());

  const theta = Math.atan2(svgPoint.y - ORBIT_CENTER.y, svgPoint.x - ORBIT_CENTER.x);
  return normalizePhaseDeg((theta - Math.PI) * (180 / Math.PI));
}

function setupOrbitDrag() {
  let dragging = false;

  const onMove = (event: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    setPhaseDeg(phaseFromPointerEvent(event));
    event.preventDefault();
  };

  earthEpochAGroup.addEventListener("mousedown", (event) => {
    dragging = true;
    event.preventDefault();
  });

  earthEpochAGroup.addEventListener("touchstart", (event) => {
    dragging = true;
    event.preventDefault();
  });

  document.addEventListener("mousemove", onMove);
  document.addEventListener("touchmove", onMove, { passive: false });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
  document.addEventListener("touchend", () => {
    dragging = false;
  });

  earthEpochAGroup.addEventListener("keydown", (event) => {
    let delta = 0;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        delta = event.shiftKey ? -1 : -5;
        break;
      case "ArrowRight":
      case "ArrowUp":
        delta = event.shiftKey ? 1 : 5;
        break;
      case "Home":
        setPhaseDeg(0);
        event.preventDefault();
        return;
      case "End":
        setPhaseDeg(180);
        event.preventDefault();
        return;
      default:
        return;
    }

    event.preventDefault();
    setPhaseDeg(state.phaseDeg + delta);
  });
}

function exportResults(): ExportPayloadV1 {
  const snapshot = modelSnapshot();

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: currentPresetLabel() },
      { name: "Distance input d (pc)", value: formatNumber(state.distancePc, 4) },
      { name: "Reference phase A (deg)", value: String(Math.round(normalizePhaseDeg(state.phaseDeg))) },
      {
        name: "Comparison phase B (deg)",
        value: String(Math.round(oppositePhaseDeg(state.phaseDeg)))
      },
      { name: "Uncertainty sigma_p (mas)", value: formatNumber(state.sigmaMas, 3) },
      { name: "Exaggeration (visual only)", value: formatNumber(state.exaggeration, 2) },
      { name: "Detector mode", value: state.detectorMode }
    ],
    readouts: [
      { name: "Angular separation 2p (mas)", value: formatNumber(snapshot.separationMas, 6) },
      { name: "Angular separation 2p (arcsec)", value: formatNumber(snapshot.separationArcsec, 8) },
      { name: "Parallax p (mas)", value: formatNumber(snapshot.parallaxMas, 6) },
      { name: "Parallax p (arcsec)", value: formatNumber(snapshot.parallaxArcsec, 8) },
      { name: "Inferred distance d (pc)", value: formatNumber(snapshot.inferredDistancePc, 6) },
      { name: "Inferred distance d (ly)", value: formatNumber(snapshot.inferredDistanceLy, 6) },
      { name: "Signal-to-noise p/sigma_p", value: Number.isFinite(snapshot.snr) ? formatNumber(snapshot.snr, 6) : "\u2014" },
      { name: "Measurement quality", value: snapshot.quality }
    ],
    notes: [
      "Small-angle relation: d(pc) = 1 / p(arcsec).",
      "Parallax is inferred from detector separation between two epochs (2p).",
      "Exaggeration affects visualization only, not computed p or d."
    ]
  };
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:parallax-distance:mode",
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
          { key: "g", action: "Toggle station mode" },
          { key: "Arrow keys", action: "Move Earth along orbit when orbit marker is focused" }
        ]
      },
      {
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Set distance first, then drag Earth (or use phase controls).",
          "Watch the detector target move relative to fixed background stars.",
          "Measure 2p, infer p, then compute d; increase sigma_p to test measurability."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Parallax Distance",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Set a distance d and choose observation phase A.",
      "Read measured 2p and inferred p.",
      "Increase sigma_p and compare p/sigma_p and confidence."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "preset", label: "Preset" },
      { key: "distancePc", label: "Distance input d (pc)" },
      { key: "phases", label: "Phases (A/B deg)" },
      { key: "pMas", label: "Measured p (mas)" },
      { key: "sigmaMas", label: "sigma_p (mas)" },
      { key: "inferredPc", label: "Inferred d (pc)" },
      { key: "inferredLy", label: "Inferred d (ly)" },
      { key: "snr", label: "p/sigma_p" }
    ],
    getSnapshotRow() {
      const snapshot = modelSnapshot();
      return {
        case: "Snapshot",
        preset: currentPresetLabel(),
        distancePc: formatNumber(state.distancePc, 3),
        phases: `${Math.round(normalizePhaseDeg(state.phaseDeg))}/${Math.round(oppositePhaseDeg(state.phaseDeg))}`,
        pMas: formatNumber(snapshot.parallaxMas, 3),
        sigmaMas: formatNumber(state.sigmaMas, 3),
        inferredPc: formatNumber(snapshot.inferredDistancePc, 3),
        inferredLy: formatNumber(snapshot.inferredDistanceLy, 3),
        snr: Number.isFinite(snapshot.snr) ? formatNumber(snapshot.snr, 2) : "\u2014"
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add nearby-star examples at current phase",
        getRows() {
          const sigma = state.sigmaMas;
          const phaseA = Math.round(normalizePhaseDeg(state.phaseDeg));
          const phaseB = Math.round(oppositePhaseDeg(state.phaseDeg));

          return nearbyStars.map((star) => {
            const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(star.parallaxMas);
            const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
            const snr = signalToNoise(star.parallaxMas, sigma);
            return {
              case: "Preset",
              preset: star.name,
              distancePc: formatNumber(dPc, 3),
              phases: `${phaseA}/${phaseB}`,
              pMas: formatNumber(star.parallaxMas, 3),
              sigmaMas: formatNumber(sigma, 3),
              inferredPc: formatNumber(dPc, 3),
              inferredLy: formatNumber(dLy, 3),
              snr: Number.isFinite(snr) ? formatNumber(snr, 2) : "\u2014"
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> Explain why increasing sigma_p makes parallax-based distance inference harder for distant stars.</p>"
  }
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

populatePresetSelect();
setupOrbitDrag();

starPreset.addEventListener("change", () => {
  const selected = starPreset.selectedOptions[0];
  const distanceText = selected?.dataset.distancePc;
  if (distanceText) {
    setDistancePc(Number(distanceText), "preset");
  }
});

distancePcRange.addEventListener("input", () => {
  setDistancePc(Number(distancePcRange.value));
});

distancePcInput.addEventListener("input", () => {
  if (distancePcInput.value.trim() === "") return;
  setDistancePc(Number(distancePcInput.value));
});

distanceLyInput.addEventListener("input", () => {
  if (distanceLyInput.value.trim() === "") return;
  const valueLy = Number(distanceLyInput.value);
  if (!Number.isFinite(valueLy)) return;
  setDistancePc(ParallaxDistanceModel.distanceParsecFromLy(valueLy));
});

for (const button of phasePresetButtons) {
  button.addEventListener("click", () => {
    const phase = Number(button.dataset.phase);
    if (!Number.isFinite(phase)) return;
    setPhaseDeg(phase);
  });
}

phaseDeg.addEventListener("input", () => {
  setPhaseDeg(Number(phaseDeg.value));
});

showBaseline.addEventListener("change", () => {
  state.showBaseline = showBaseline.checked;
  render();
});

detectorModeOverlay.addEventListener("click", () => {
  state.detectorMode = "overlay";
  render();
});

detectorModeDifference.addEventListener("click", () => {
  state.detectorMode = "difference";
  render();
});

blinkMode.addEventListener("change", () => {
  state.blinkMode = blinkMode.checked;
  updateBlinkTimer();
  render();
});

sigmaMas.addEventListener("input", () => {
  state.sigmaMas = clamp(Number(sigmaMas.value), SIGMA_MAS_MIN, SIGMA_MAS_MAX);
  render();
});

exaggeration.addEventListener("input", () => {
  state.exaggeration = clamp(Number(exaggeration.value), EXAGGERATION_MIN, EXAGGERATION_MAX);
  render();
});

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying...");
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

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

if (typeof window.matchMedia === "function") {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => {
    updateBlinkTimer();
    render();
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(onChange);
  }
}

render();
updateBlinkTimer();
