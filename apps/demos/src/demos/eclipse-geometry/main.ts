import { EclipseGeometryModel } from "@cosmic/physics";

const setNewMoonEl = document.querySelector<HTMLButtonElement>("#setNewMoon");
const setFullMoonEl = document.querySelector<HTMLButtonElement>("#setFullMoon");

const moonLonEl = document.querySelector<HTMLInputElement>("#moonLon");
const moonLonValueEl = document.querySelector<HTMLSpanElement>("#moonLonValue");
const nodeLonEl = document.querySelector<HTMLInputElement>("#nodeLon");
const nodeLonValueEl = document.querySelector<HTMLSpanElement>("#nodeLonValue");
const tiltEl = document.querySelector<HTMLInputElement>("#tilt");
const tiltValueEl = document.querySelector<HTMLSpanElement>("#tiltValue");
const distancePresetEl =
  document.querySelector<HTMLSelectElement>("#distancePreset");
const distanceValueEl =
  document.querySelector<HTMLSpanElement>("#distanceValue");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const challengeModeEl =
  document.querySelector<HTMLButtonElement>("#challengeMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const phaseLabelEl = document.querySelector<HTMLSpanElement>("#phaseLabel");
const phaseAngleEl = document.querySelector<HTMLSpanElement>("#phaseAngle");
const absBetaEl = document.querySelector<HTMLSpanElement>("#absBeta");
const nearestNodeEl = document.querySelector<HTMLSpanElement>("#nearestNode");
const solarOutcomeEl = document.querySelector<HTMLSpanElement>("#solarOutcome");
const lunarOutcomeEl = document.querySelector<HTMLSpanElement>("#lunarOutcome");

const moonDotEl = document.querySelector<SVGCircleElement>("#moonDot");
const betaLineEl = document.querySelector<SVGLineElement>("#betaLine");
const ascNodeDotEl = document.querySelector<SVGCircleElement>("#ascNodeDot");
const descNodeDotEl = document.querySelector<SVGCircleElement>("#descNodeDot");
const ascNodeLabelEl = document.querySelector<SVGTextElement>("#ascNodeLabel");
const descNodeLabelEl =
  document.querySelector<SVGTextElement>("#descNodeLabel");
const betaMarkerEl = document.querySelector<SVGCircleElement>("#betaMarker");
const betaLabelEl = document.querySelector<SVGTextElement>("#betaLabel");

if (
  !setNewMoonEl ||
  !setFullMoonEl ||
  !moonLonEl ||
  !moonLonValueEl ||
  !nodeLonEl ||
  !nodeLonValueEl ||
  !tiltEl ||
  !tiltValueEl ||
  !distancePresetEl ||
  !distanceValueEl ||
  !stationModeEl ||
  !challengeModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !phaseLabelEl ||
  !phaseAngleEl ||
  !absBetaEl ||
  !nearestNodeEl ||
  !solarOutcomeEl ||
  !lunarOutcomeEl ||
  !moonDotEl ||
  !betaLineEl ||
  !ascNodeDotEl ||
  !descNodeDotEl ||
  !ascNodeLabelEl ||
  !descNodeLabelEl ||
  !betaMarkerEl ||
  !betaLabelEl
) {
  throw new Error("Missing required DOM elements for eclipse-geometry demo.");
}

const setNewMoon = setNewMoonEl;
const setFullMoon = setFullMoonEl;
const moonLon = moonLonEl;
const moonLonValue = moonLonValueEl;
const nodeLon = nodeLonEl;
const nodeLonValue = nodeLonValueEl;
const tilt = tiltEl;
const tiltValue = tiltValueEl;
const distancePreset = distancePresetEl;
const distanceValue = distanceValueEl;

const stationMode = stationModeEl;
const challengeMode = challengeModeEl;
const help = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

const phaseLabel = phaseLabelEl;
const phaseAngle = phaseAngleEl;
const absBeta = absBetaEl;
const nearestNode = nearestNodeEl;
const solarOutcome = solarOutcomeEl;
const lunarOutcome = lunarOutcomeEl;

const moonDot = moonDotEl;
const betaLine = betaLineEl;
const ascNodeDot = ascNodeDotEl;
const descNodeDot = descNodeDotEl;
const ascNodeLabel = ascNodeLabelEl;
const descNodeLabel = descNodeLabelEl;
const betaMarker = betaMarkerEl;
const betaLabel = betaLabelEl;

stationMode.disabled = true;
challengeMode.disabled = true;
help.disabled = true;
copyResults.disabled = true;

const SYZYGY_TOLERANCE_DEG = 5;

const DISTANCE_PRESETS_KM = {
  perigee: 363300,
  mean: 384400,
  apogee: 405500
} as const;

type DistancePresetKey = keyof typeof DISTANCE_PRESETS_KM;

type State = {
  sunLonDeg: number;
  moonLonDeg: number;
  nodeLonDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  distancePresetKey: DistancePresetKey;
};

const state: State = {
  sunLonDeg: 0,
  moonLonDeg: 180,
  nodeLonDeg: 210,
  orbitalTiltDeg: 5.145,
  earthMoonDistanceKm: DISTANCE_PRESETS_KM.mean,
  distancePresetKey: "mean"
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number, digits: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function phaseInfo(phaseAngleDeg: number): {
  label: string;
  isNew: boolean;
  isFull: boolean;
} {
  const dNew = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 0);
  const dFull = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 180);
  const dFirst = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 90);
  const dThird = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 270);

  if (dNew <= 10) return { label: "New Moon", isNew: true, isFull: false };
  if (dFull <= 10) return { label: "Full Moon", isNew: false, isFull: true };
  if (dFirst <= 10) return { label: "First quarter", isNew: false, isFull: false };
  if (dThird <= 10) return { label: "Third quarter", isNew: false, isFull: false };

  const norm = EclipseGeometryModel.normalizeAngleDeg(phaseAngleDeg);
  if (norm > 0 && norm < 180) {
    return {
      label: norm < 90 ? "Waxing crescent" : "Waxing gibbous",
      isNew: false,
      isFull: false
    };
  }
  return {
    label: norm > 180 && norm < 270 ? "Waning gibbous" : "Waning crescent",
    isNew: false,
    isFull: false
  };
}

function outcomeLabel(type: string): string {
  if (type === "none") return "None";
  if (type === "partial-solar") return "Partial solar";
  if (type === "annular-solar") return "Annular solar";
  if (type === "total-solar") return "Total solar";
  if (type === "penumbral-lunar") return "Penumbral lunar";
  if (type === "partial-lunar") return "Partial lunar";
  if (type === "total-lunar") return "Total lunar";
  return type;
}

function populateDistancePresets() {
  distancePreset.innerHTML = "";
  const entries: Array<{ key: DistancePresetKey; label: string; valueKm: number }> = [
    { key: "perigee", label: "Perigee", valueKm: DISTANCE_PRESETS_KM.perigee },
    { key: "mean", label: "Mean", valueKm: DISTANCE_PRESETS_KM.mean },
    { key: "apogee", label: "Apogee", valueKm: DISTANCE_PRESETS_KM.apogee }
  ];
  for (const entry of entries) {
    const opt = document.createElement("option");
    opt.value = entry.key;
    opt.textContent = `${entry.label} (${entry.valueKm.toLocaleString()} km)`;
    distancePreset.appendChild(opt);
  }
  distancePreset.value = state.distancePresetKey;
}

function renderStage(args: {
  moonLonDeg: number;
  nodeLonDeg: number;
  betaDeg: number;
}) {
  // Orbit geometry in local panel coords (see index.html transform translate(220,180)).
  const cx = 0;
  const cy = 0;
  const r = 140;

  const moonAngle = (Math.PI / 180) * args.moonLonDeg;
  const mx = cx + r * Math.cos(moonAngle);
  const my = cy + r * Math.sin(moonAngle);
  moonDot.setAttribute("cx", formatNumber(mx, 2));
  moonDot.setAttribute("cy", formatNumber(my, 2));

  // Node markers
  const ascAngle = (Math.PI / 180) * args.nodeLonDeg;
  const dx = cx + r * Math.cos(ascAngle);
  const dy = cy + r * Math.sin(ascAngle);
  ascNodeDot.setAttribute("cx", formatNumber(dx, 2));
  ascNodeDot.setAttribute("cy", formatNumber(dy, 2));

  const descAngle = (Math.PI / 180) * (args.nodeLonDeg + 180);
  const ex = cx + r * Math.cos(descAngle);
  const ey = cy + r * Math.sin(descAngle);
  descNodeDot.setAttribute("cx", formatNumber(ex, 2));
  descNodeDot.setAttribute("cy", formatNumber(ey, 2));

  ascNodeLabel.textContent = `Ω ≈ ${Math.round(EclipseGeometryModel.normalizeAngleDeg(args.nodeLonDeg))}°`;
  descNodeLabel.textContent = `Ω+180 ≈ ${Math.round(EclipseGeometryModel.normalizeAngleDeg(args.nodeLonDeg + 180))}°`;

  // β indicator: draw a short line "out of plane" near the Moon point.
  const betaScalePxPerDeg = 10;
  const by = my - clamp(args.betaDeg, -10, 10) * betaScalePxPerDeg;
  betaLine.setAttribute("x1", formatNumber(mx, 2));
  betaLine.setAttribute("y1", formatNumber(my, 2));
  betaLine.setAttribute("x2", formatNumber(mx, 2));
  betaLine.setAttribute("y2", formatNumber(by, 2));

  // β panel marker: y = -beta
  const betaPanelScale = 12;
  const y = clamp(-args.betaDeg * betaPanelScale, -140, 140);
  betaMarker.setAttribute("cy", formatNumber(y, 2));
  betaLabel.textContent = `β ≈ ${formatNumber(args.betaDeg, 2)}°`;
}

function render() {
  const moonLonDeg = clamp(Number(moonLon.value), 0, 360);
  const nodeLonDeg = clamp(Number(nodeLon.value), 0, 360);
  const orbitalTiltDeg = clamp(Number(tilt.value), 0, 10);
  const presetKey = distancePreset.value as DistancePresetKey;

  state.moonLonDeg = moonLonDeg;
  state.nodeLonDeg = nodeLonDeg;
  state.orbitalTiltDeg = orbitalTiltDeg;
  state.distancePresetKey = presetKey;
  state.earthMoonDistanceKm = DISTANCE_PRESETS_KM[presetKey] ?? DISTANCE_PRESETS_KM.mean;

  const phaseAngleDegValue = EclipseGeometryModel.phaseAngleDeg({
    moonLonDeg: state.moonLonDeg,
    sunLonDeg: state.sunLonDeg
  });

  const betaDeg = EclipseGeometryModel.eclipticLatitudeDeg({
    tiltDeg: state.orbitalTiltDeg,
    moonLonDeg: state.moonLonDeg,
    nodeLonDeg: state.nodeLonDeg
  });

  const absBetaDeg = Math.abs(betaDeg);
  const nearestNodeDeg = EclipseGeometryModel.nearestNodeDistanceDeg({
    moonLonDeg: state.moonLonDeg,
    nodeLonDeg: state.nodeLonDeg
  });

  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm
  });

  const phase = phaseInfo(phaseAngleDegValue);

  const isNewSyzygy =
    EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 0) <=
    SYZYGY_TOLERANCE_DEG;
  const isFullSyzygy =
    EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 180) <=
    SYZYGY_TOLERANCE_DEG;

  const solarType = isNewSyzygy
    ? EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
        betaDeg,
        earthMoonDistanceKm: state.earthMoonDistanceKm
      }).type
    : "none";

  const lunarType = isFullSyzygy
    ? EclipseGeometryModel.lunarEclipseTypeFromBetaDeg({
        betaDeg,
        earthMoonDistanceKm: state.earthMoonDistanceKm
      }).type
    : "none";

  moonLonValue.textContent = `${Math.round(moonLonDeg)}°`;
  nodeLonValue.textContent = `${Math.round(nodeLonDeg)}°`;
  tiltValue.textContent = `${formatNumber(orbitalTiltDeg, 3)}°`;
  distanceValue.textContent = `${state.earthMoonDistanceKm.toLocaleString()} km`;

  phaseLabel.textContent = phase.label;
  phaseAngle.textContent = `${formatNumber(phaseAngleDegValue, 1)}°`;
  absBeta.textContent = `${formatNumber(absBetaDeg, 3)}°`;
  nearestNode.textContent = `${formatNumber(nearestNodeDeg, 2)}°`;

  solarOutcome.textContent = outcomeLabel(solarType);
  lunarOutcome.textContent = outcomeLabel(lunarType);

  renderStage({ moonLonDeg, nodeLonDeg, betaDeg });

  status.textContent = `Thresholds (mean-distance example): solar partial ≈ ${formatNumber(thresholds.solarPartialDeg, 2)}°, solar central ≈ ${formatNumber(thresholds.solarCentralDeg, 2)}°`;
}

populateDistancePresets();

setNewMoon.addEventListener("click", () => {
  moonLon.value = String(state.sunLonDeg);
  render();
});

setFullMoon.addEventListener("click", () => {
  moonLon.value = String(EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + 180));
  render();
});

moonLon.addEventListener("input", render);
nodeLon.addEventListener("input", render);
tilt.addEventListener("input", render);
distancePreset.addEventListener("change", render);

render();
