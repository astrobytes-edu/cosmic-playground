import { AstroConstants, EclipseGeometryModel } from "@cosmic/physics";
import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import {
  clamp,
  formatNumber,
  formatSignedBeta,
  phaseInfo,
  outcomeLabel,
  computeDerived,
  buildStationRow,
  formatSimSummary,
  formatSimTable,
  contextualMessage,
  SYZYGY_TOLERANCE_DEG,
  DISTANCE_PRESETS_KM,
  snapToNearestPreset,
  svgPointToAngleDeg,
  buildBetaCurvePath,
  sliderToYears,
  formatYearsLabel,
  checkWhyNotEveryMonth,
  checkEclipseStatistics,
  eclipseArcExtentDeg,
  buildArcPath,
  totalSolarPreset,
  lunarEclipsePreset,
  noEclipsePreset,
} from "./logic";
import type { EclipseModelCallbacks, EclipseDemoState, DistancePresetKey, SimulationCounts } from "./logic";

const setNewMoonEl = document.querySelector<HTMLButtonElement>("#setNewMoon");
const setFullMoonEl = document.querySelector<HTMLButtonElement>("#setFullMoon");

const presetsBtnEl = document.querySelector<HTMLButtonElement>("#presetsBtn");
const presetsPopoverEl = document.querySelector<HTMLDivElement>("#presetsPopover");
const presetTotalSolarEl = document.querySelector<HTMLButtonElement>("#presetTotalSolar");
const presetLunarEl = document.querySelector<HTMLButtonElement>("#presetLunar");
const presetNoEclipseEl = document.querySelector<HTMLButtonElement>("#presetNoEclipse");
const presetSeasonEl = document.querySelector<HTMLButtonElement>("#presetSeason");

const animateMonthEl =
  document.querySelector<HTMLButtonElement>("#animateMonth");
const animateYearEl = document.querySelector<HTMLButtonElement>("#animateYear");
const motionNoteEl = document.querySelector<HTMLParagraphElement>("#motionNote");

const simYearsEl = document.querySelector<HTMLInputElement>("#simYears");
const simYearsValueEl =
  document.querySelector<HTMLSpanElement>("#simYearsValue");
const simSpeedEl = document.querySelector<HTMLSelectElement>("#simSpeed");
const runSimulationEl =
  document.querySelector<HTMLButtonElement>("#runSimulation");
const stopSimulationEl =
  document.querySelector<HTMLButtonElement>("#stopSimulation");
const simOutputEl = document.querySelector<HTMLDivElement>("#simOutput");

const moonLonEl = document.querySelector<HTMLInputElement>("#moonLon");
const moonLonValueEl = document.querySelector<HTMLSpanElement>("#moonLonValue");
const tiltEl = document.querySelector<HTMLInputElement>("#tilt");
const tiltValueEl = document.querySelector<HTMLSpanElement>("#tiltValue");
const distancePresetEl =
  document.querySelector<HTMLSelectElement>("#distancePreset");
const distanceValueEl =
  document.querySelector<HTMLSpanElement>("#distanceValue");
const contextMessageEl = document.querySelector<HTMLParagraphElement>("#contextMessage");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const challengeModeEl =
  document.querySelector<HTMLButtonElement>("#challengeMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");
const controlsBodyEl = document.querySelector<HTMLElement>(
  ".cp-demo__sidebar .cp-panel-body"
);

const phaseLabelEl = document.querySelector<HTMLSpanElement>("#phaseLabel");
const phaseAngleEl = document.querySelector<HTMLSpanElement>("#phaseAngle");
const absBetaEl = document.querySelector<HTMLSpanElement>("#absBeta");
const nearestNodeEl = document.querySelector<HTMLSpanElement>("#nearestNode");
const solarOutcomeEl = document.querySelector<HTMLSpanElement>("#solarOutcome");
const lunarOutcomeEl = document.querySelector<HTMLSpanElement>("#lunarOutcome");
const solarReadoutEl = document.querySelector<HTMLDivElement>("#solarReadout");
const lunarReadoutEl = document.querySelector<HTMLDivElement>("#lunarReadout");

const eclipseSvgEl = document.querySelector<SVGSVGElement>("#eclipseStage");
const moonDotEl = document.querySelector<SVGCircleElement>("#moonDot");
const betaLineEl = document.querySelector<SVGLineElement>("#betaLine");
const ascNodeDotEl = document.querySelector<SVGCircleElement>("#ascNodeDot");
const descNodeDotEl = document.querySelector<SVGCircleElement>("#descNodeDot");
const ascNodeLabelEl = document.querySelector<SVGTextElement>("#ascNodeLabel");
const descNodeLabelEl =
  document.querySelector<SVGTextElement>("#descNodeLabel");
const betaCurveEl = document.querySelector<SVGPathElement>("#betaCurve");
const betaMarkerEl = document.querySelector<SVGCircleElement>("#betaMarker");
const betaLabelEl = document.querySelector<SVGTextElement>("#betaLabel");
const eclipseLabelEl = document.querySelector<SVGTextElement>("#eclipseLabel");

if (
  !eclipseSvgEl ||
  !setNewMoonEl ||
  !setFullMoonEl ||
  !animateMonthEl ||
  !animateYearEl ||
  !motionNoteEl ||
  !simYearsEl ||
  !simYearsValueEl ||
  !simSpeedEl ||
  !runSimulationEl ||
  !stopSimulationEl ||
  !simOutputEl ||
  !moonLonEl ||
  !moonLonValueEl ||
  !tiltEl ||
  !tiltValueEl ||
  !distancePresetEl ||
  !distanceValueEl ||
  !stationModeEl ||
  !challengeModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !controlsBodyEl ||
  !contextMessageEl ||
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
  !betaCurveEl ||
  !betaMarkerEl ||
  !betaLabelEl ||
  !presetsBtnEl ||
  !presetsPopoverEl ||
  !presetTotalSolarEl ||
  !presetLunarEl ||
  !presetNoEclipseEl ||
  !presetSeasonEl
) {
  throw new Error("Missing required DOM elements for eclipse-geometry demo.");
}

const presetsBtn = presetsBtnEl;
const presetsPopover = presetsPopoverEl;
const presetTotalSolar = presetTotalSolarEl;
const presetLunar = presetLunarEl;
const presetNoEclipse = presetNoEclipseEl;
const presetSeason = presetSeasonEl;

const setNewMoon = setNewMoonEl;
const setFullMoon = setFullMoonEl;
const animateMonth = animateMonthEl;
const animateYear = animateYearEl;
const motionNote = motionNoteEl;
const simYears = simYearsEl;
const simYearsValue = simYearsValueEl;
const simSpeed = simSpeedEl;
const runSimulation = runSimulationEl;
const stopSimulation = stopSimulationEl;
const simOutput = simOutputEl;

const moonLon = moonLonEl;
const moonLonValue = moonLonValueEl;
const tilt = tiltEl;
const tiltValue = tiltValueEl;
const distancePreset = distancePresetEl;
const distanceValue = distanceValueEl;
const contextMessage = contextMessageEl;

const stationMode = stationModeEl;
const challengeMode = challengeModeEl;
const help = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;
const controlsBody = controlsBodyEl;

const phaseLabel = phaseLabelEl;
const phaseAngle = phaseAngleEl;
const absBeta = absBetaEl;
const nearestNode = nearestNodeEl;
const solarOutcome = solarOutcomeEl;
const lunarOutcome = lunarOutcomeEl;

const eclipseSvg = eclipseSvgEl;
const moonDot = moonDotEl;
const betaLine = betaLineEl;
const ascNodeDot = ascNodeDotEl;
const descNodeDot = descNodeDotEl;
const ascNodeLabel = ascNodeLabelEl;
const descNodeLabel = descNodeLabelEl;
const betaCurve = betaCurveEl;
const betaMarker = betaMarkerEl;
const betaLabel = betaLabelEl;

stationMode.disabled = true;
challengeMode.disabled = true;
help.disabled = true;
copyResults.disabled = true;
stopSimulation.disabled = true;
simOutput.hidden = true;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:eclipse-geometry:mode",
  url: new URL(window.location.href)
});

copyResults.disabled = false;

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

let prevSolarType = "none";
let prevLunarType = "none";

simYearsValue.textContent = `${formatYearsLabel(sliderToYears(Number(simYears.value)))} yr`;

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  animateMonth.disabled = true;
  animateYear.disabled = true;
  runSimulation.disabled = true;
  stopSimulation.disabled = true;
  motionNote.hidden = false;
  motionNote.textContent = "Animation and simulation disabled due to reduced-motion preference.";
}

/** Wire real physics model into the DI interface */
const model: EclipseModelCallbacks = {
  phaseAngleDeg: EclipseGeometryModel.phaseAngleDeg,
  eclipticLatitudeDeg: EclipseGeometryModel.eclipticLatitudeDeg,
  nearestNodeDistanceDeg: EclipseGeometryModel.nearestNodeDistanceDeg,
  angularSeparationDeg: EclipseGeometryModel.angularSeparationDeg,
  solarEclipseType: EclipseGeometryModel.solarEclipseTypeFromBetaDeg,
  lunarEclipseType: EclipseGeometryModel.lunarEclipseTypeFromBetaDeg,
};

function populateDistancePresets() {
  distancePreset.innerHTML = "";
  const entries: Array<{ key: DistancePresetKey; label: string; valueKm: number }> = [
    { key: "perigee", label: "Perigee", valueKm: DISTANCE_PRESETS_KM.perigee },
    { key: "mean", label: "Mean", valueKm: DISTANCE_PRESETS_KM.mean },
    { key: "apogee", label: "Apogee", valueKm: DISTANCE_PRESETS_KM.apogee },
  ];
  for (const entry of entries) {
    const opt = document.createElement("option");
    opt.value = entry.key;
    opt.textContent = `${entry.label} (${entry.valueKm.toLocaleString()} km)`;
    distancePreset.appendChild(opt);
  }
  distancePreset.value = state.distancePresetKey;
}

/** Helpers using the real physics model */
function getPhaseInfo(phaseAngleDeg: number) {
  return phaseInfo(
    phaseAngleDeg,
    EclipseGeometryModel.angularSeparationDeg,
    EclipseGeometryModel.normalizeAngleDeg,
  );
}

function getDerived(args: Parameters<typeof computeDerived>[0]) {
  return computeDerived(args, model);
}

function showEclipseLabel(text: string, category: "solar" | "lunar") {
  if (!eclipseLabelEl) return;
  // Position near moon dot (uses moon's current cx/cy set by renderStage)
  const mx = Number(moonDot.getAttribute("cx") || 0);
  const my = Number(moonDot.getAttribute("cy") || 0);
  eclipseLabelEl.setAttribute("x", String(mx));
  eclipseLabelEl.setAttribute("y", String(my - 22));
  eclipseLabelEl.textContent = `${text}!`;
  eclipseLabelEl.classList.remove("stage__eclipse-label--solar", "stage__eclipse-label--lunar", "stage__eclipse-label--active");
  // Force reflow to restart animation
  void eclipseLabelEl.getBoundingClientRect();
  eclipseLabelEl.classList.add(`stage__eclipse-label--${category}`, "stage__eclipse-label--active");
}

function renderStage(args: {
  sunLonDeg: number;
  moonLonDeg: number;
  nodeLonDeg: number;
  betaDeg: number;
}) {
  // Orbit geometry in local panel coords (see index.html transform translate(220,180)).
  const cx = 0;
  const cy = 0;
  const r = 140;

  // Display in a Sun-fixed way: subtract lambda_sun for visualization only.
  const moonDisplayLonDeg = EclipseGeometryModel.normalizeAngleDeg(
    args.moonLonDeg - args.sunLonDeg
  );
  const nodeDisplayLonDeg = EclipseGeometryModel.normalizeAngleDeg(
    args.nodeLonDeg - args.sunLonDeg
  );

  const moonAngle = (Math.PI / 180) * moonDisplayLonDeg;
  const mx = cx + r * Math.cos(moonAngle);
  const my = cy + r * Math.sin(moonAngle);
  moonDot.setAttribute("cx", formatNumber(mx, 2));
  moonDot.setAttribute("cy", formatNumber(my, 2));

  // Node markers
  const ascAngle = (Math.PI / 180) * nodeDisplayLonDeg;
  const dx = cx + r * Math.cos(ascAngle);
  const dy = cy + r * Math.sin(ascAngle);
  ascNodeDot.setAttribute("cx", formatNumber(dx, 2));
  ascNodeDot.setAttribute("cy", formatNumber(dy, 2));

  const descAngle = (Math.PI / 180) * (nodeDisplayLonDeg + 180);
  const ex = cx + r * Math.cos(descAngle);
  const ey = cy + r * Math.sin(descAngle);
  descNodeDot.setAttribute("cx", formatNumber(ex, 2));
  descNodeDot.setAttribute("cy", formatNumber(ey, 2));

  ascNodeLabel.textContent = `node ~ ${Math.round(nodeDisplayLonDeg)} deg`;
  descNodeLabel.textContent = `node+180 ~ ${Math.round(EclipseGeometryModel.normalizeAngleDeg(nodeDisplayLonDeg + 180))} deg`;

  // beta indicator: draw a short line "out of plane" near the Moon point.
  const betaScalePxPerDeg = 10;
  const by = my - clamp(args.betaDeg, -10, 10) * betaScalePxPerDeg;
  betaLine.setAttribute("x1", formatNumber(mx, 2));
  betaLine.setAttribute("y1", formatNumber(my, 2));
  betaLine.setAttribute("x2", formatNumber(mx, 2));
  betaLine.setAttribute("y2", formatNumber(by, 2));

  // Beta curve: sinusoidal path across the full beta panel
  const BETA_PANEL_WIDTH = 300;
  const BETA_Y_SCALE = 20; // pixels per degree of latitude
  const betaCurvePath = buildBetaCurvePath({
    tiltDeg: state.orbitalTiltDeg,
    nodeLonDeg: args.nodeLonDeg,
    panelX: 0,
    panelWidth: BETA_PANEL_WIDTH,
    panelCenterY: 0,
    yScale: BETA_Y_SCALE,
    eclipticLatDeg: (moonLonDeg, tiltDeg, nodeLonDeg) =>
      EclipseGeometryModel.eclipticLatitudeDeg({ tiltDeg, moonLonDeg, nodeLonDeg }),
  });
  betaCurve.setAttribute("d", betaCurvePath);

  // Beta panel marker: positioned on the curve at Moon's orbital position
  const moonFraction = EclipseGeometryModel.normalizeAngleDeg(args.moonLonDeg) / 360;
  const markerX = moonFraction * BETA_PANEL_WIDTH;
  const markerY = clamp(-args.betaDeg * BETA_Y_SCALE, -140, 140);
  betaMarker.setAttribute("cx", formatNumber(markerX, 2));
  betaMarker.setAttribute("cy", formatNumber(markerY, 2));
  betaLabel.setAttribute("x", formatNumber(markerX, 2));
  betaLabel.setAttribute("y", formatNumber(markerY - 14, 2));
  betaLabel.textContent = `beta ~ ${formatNumber(args.betaDeg, 2)} deg`;

  // Eclipse window arcs
  renderArcs(cx, cy, r, nodeDisplayLonDeg);

  // Threshold shading bands on beta panel
  renderBands(BETA_PANEL_WIDTH, BETA_Y_SCALE);
}

function renderArcs(cx: number, cy: number, r: number, nodeDisplayLonDeg: number) {
  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });
  const dLambda = EclipseGeometryModel.deltaLambdaFromBetaDeg;
  const tiltDeg = state.orbitalTiltDeg;
  const descDisplayLonDeg = EclipseGeometryModel.normalizeAngleDeg(nodeDisplayLonDeg + 180);

  const arcs = [
    { id: "arc-solar-any-asc", beta: thresholds.solarPartialDeg, center: nodeDisplayLonDeg },
    { id: "arc-solar-central-asc", beta: thresholds.solarCentralDeg, center: nodeDisplayLonDeg },
    { id: "arc-lunar-any-asc", beta: thresholds.lunarPenumbralDeg, center: nodeDisplayLonDeg },
    { id: "arc-lunar-central-asc", beta: thresholds.lunarUmbralDeg, center: nodeDisplayLonDeg },
    { id: "arc-solar-any-desc", beta: thresholds.solarPartialDeg, center: descDisplayLonDeg },
    { id: "arc-solar-central-desc", beta: thresholds.solarCentralDeg, center: descDisplayLonDeg },
    { id: "arc-lunar-any-desc", beta: thresholds.lunarPenumbralDeg, center: descDisplayLonDeg },
    { id: "arc-lunar-central-desc", beta: thresholds.lunarUmbralDeg, center: descDisplayLonDeg },
  ];

  for (const arc of arcs) {
    const halfExtent = eclipseArcExtentDeg({
      tiltDeg,
      thresholdBetaDeg: arc.beta,
      deltaLambdaFromBetaDeg: dLambda,
    });
    const el = document.getElementById(arc.id) as SVGPathElement | null;
    if (el) {
      el.setAttribute("d", buildArcPath({ cx, cy, r, centerAngleDeg: arc.center, halfExtentDeg: halfExtent }));
    }
  }
}

function renderBands(panelWidth: number, yScale: number) {
  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });

  const setBand = (id: string, betaDeg: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    const h = betaDeg * yScale * 2;
    el.setAttribute("x", "0");
    el.setAttribute("y", String(-betaDeg * yScale));
    el.setAttribute("width", String(panelWidth));
    el.setAttribute("height", String(h));
  };

  setBand("band-solar-partial", thresholds.solarPartialDeg);
  setBand("band-solar-central", thresholds.solarCentralDeg);
  setBand("band-lunar-penumbral", thresholds.lunarPenumbralDeg);

  // Position labels at right edge of each band
  const setLabel = (id: string, betaDeg: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("x", String(panelWidth - 4));
    el.setAttribute("y", String(-betaDeg * yScale + 3));
  };
  setLabel("label-solar", thresholds.solarPartialDeg);
  setLabel("label-lunar", thresholds.lunarPenumbralDeg);
}

function render() {
  const isAnimating = runMode !== "idle";
  // During animation, use precise state values (sliders have step-snapping loss).
  // In idle mode, read from sliders (user is adjusting controls directly).
  const moonLonDeg = isAnimating ? state.moonLonDeg : clamp(Number(moonLon.value), 0, 360);
  // Node longitude comes from state (no slider — will be draggable nodes in Task 3)
  const nodeLonDeg = state.nodeLonDeg;
  const orbitalTiltDeg = clamp(Number(tilt.value), 0, 10);
  const presetKey = distancePreset.value as DistancePresetKey;

  state.moonLonDeg = moonLonDeg;
  state.nodeLonDeg = nodeLonDeg;
  state.orbitalTiltDeg = orbitalTiltDeg;
  state.distancePresetKey = presetKey;
  state.earthMoonDistanceKm = DISTANCE_PRESETS_KM[presetKey] ?? DISTANCE_PRESETS_KM.mean;

  const derived = getDerived({
    sunLonDeg: state.sunLonDeg,
    moonLonDeg: state.moonLonDeg,
    nodeLonDeg: state.nodeLonDeg,
    orbitalTiltDeg: state.orbitalTiltDeg,
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });

  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });

  const ctxMsg = contextualMessage(derived, {
    solarPartialDeg: thresholds.solarPartialDeg,
    lunarPenumbralDeg: thresholds.lunarPenumbralDeg,
  });
  contextMessage.textContent = ctxMsg;

  const phase = getPhaseInfo(derived.phaseAngleDeg);

  moonLonValue.textContent = `${Math.round(moonLonDeg)} deg`;
  tiltValue.textContent = `${formatNumber(orbitalTiltDeg, 3)} deg`;
  distanceValue.textContent = `${state.earthMoonDistanceKm.toLocaleString()} km`;

  phaseLabel.textContent = phase.label;
  phaseAngle.textContent = formatNumber(derived.phaseAngleDeg, 1);
  absBeta.textContent = formatSignedBeta(derived.betaDeg, 3);
  nearestNode.textContent = formatNumber(derived.nearestNodeDeg, 2);

  solarOutcome.textContent = outcomeLabel(derived.solarType);
  lunarOutcome.textContent = outcomeLabel(derived.lunarType);
  solarReadoutEl!.dataset.active = String(derived.solarType !== "none");
  lunarReadoutEl!.dataset.active = String(derived.lunarType !== "none");

  // Visual reward: floating label when eclipse state transitions none → active
  if (eclipseLabelEl) {
    const newSolar = derived.solarType !== "none";
    const newLunar = derived.lunarType !== "none";
    const wasSolar = prevSolarType !== "none";
    const wasLunar = prevLunarType !== "none";
    if (newSolar && !wasSolar) {
      showEclipseLabel(outcomeLabel(derived.solarType), "solar");
    } else if (newLunar && !wasLunar) {
      showEclipseLabel(outcomeLabel(derived.lunarType), "lunar");
    }
    prevSolarType = derived.solarType;
    prevLunarType = derived.lunarType;
  }

  renderStage({ sunLonDeg: state.sunLonDeg, moonLonDeg, nodeLonDeg, betaDeg: derived.betaDeg });

  setLiveRegionText(
    status,
    `Thresholds (mean-distance example): solar partial ~ ${formatNumber(thresholds.solarPartialDeg, 2)} deg, solar central ~ ${formatNumber(thresholds.solarCentralDeg, 2)} deg`
  );

  (window as any).__cp = {
    slug: "eclipse-geometry",
    mode: runtime.mode,
    exportResults: () => exportResults(getState())
  };
}

function getState(): EclipseDemoState {
  return getDerived({
    sunLonDeg: state.sunLonDeg,
    moonLonDeg: state.moonLonDeg,
    nodeLonDeg: state.nodeLonDeg,
    orbitalTiltDeg: state.orbitalTiltDeg,
    earthMoonDistanceKm: state.earthMoonDistanceKm,
  });
}

function setState(next: unknown): void {
  if (!next || typeof next !== "object") return;
  const obj = next as Partial<EclipseDemoState> & { distancePresetKey?: DistancePresetKey };

  if (Number.isFinite(obj.moonLonDeg)) moonLon.value = String(clamp(obj.moonLonDeg as number, 0, 360));
  if (Number.isFinite(obj.nodeLonDeg)) state.nodeLonDeg = clamp(obj.nodeLonDeg as number, 0, 360);
  if (Number.isFinite(obj.orbitalTiltDeg)) tilt.value = String(clamp(obj.orbitalTiltDeg as number, 0, 10));

  if (obj.distancePresetKey && obj.distancePresetKey in DISTANCE_PRESETS_KM) {
    distancePreset.value = obj.distancePresetKey;
  } else if (Number.isFinite(obj.earthMoonDistanceKm)) {
    distancePreset.value = snapToNearestPreset(obj.earthMoonDistanceKm as number);
  }

  render();
}

function exportResults(st: EclipseDemoState): ExportPayloadV1 {
  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: st.earthMoonDistanceKm
  });
  const phase = getPhaseInfo(st.phaseAngleDeg);

  const notes: string[] = [];
  notes.push("Units: angles in degrees (deg); distances in kilometers (km).");
  notes.push(
    `Interactive mode uses a pedagogical syzygy tolerance: outcomes only appear when Delta is within ${SYZYGY_TOLERANCE_DEG} deg of 0 deg (New) or 180 deg (Full).`
  );
  notes.push("This is a simplified geometric model; it is not an ephemeris-grade eclipse predictor.");
  if (prefersReducedMotion) {
    notes.push("Reduced motion: animation and simulation controls are disabled.");
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Moon longitude lambda_M (deg)", value: String(Math.round(st.moonLonDeg)) },
      { name: "Sun longitude lambda_sun (deg)", value: String(Math.round(st.sunLonDeg)) },
      { name: "Node longitude Omega (deg)", value: String(Math.round(st.nodeLonDeg)) },
      { name: "Orbital tilt i (deg)", value: formatNumber(st.orbitalTiltDeg, 3) },
      { name: "Earth–Moon distance (km)", value: Math.round(st.earthMoonDistanceKm).toLocaleString() }
    ],
    readouts: [
      { name: "Phase", value: phase.label },
      { name: "Phase angle Delta (deg)", value: formatNumber(st.phaseAngleDeg, 1) },
      { name: "abs(beta) (deg)", value: formatNumber(st.absBetaDeg, 3), note: "ecliptic latitude" },
      { name: "Nearest node distance (deg)", value: formatNumber(st.nearestNodeDeg, 2) },
      { name: "Solar outcome", value: outcomeLabel(st.solarType) },
      { name: "Lunar outcome", value: outcomeLabel(st.lunarType) },
      { name: "Solar partial threshold abs(beta) (deg)", value: formatNumber(thresholds.solarPartialDeg, 2) },
      { name: "Solar central threshold abs(beta) (deg)", value: formatNumber(thresholds.solarCentralDeg, 2) },
      { name: "Lunar penumbral threshold abs(beta) (deg)", value: formatNumber(thresholds.lunarPenumbralDeg, 2) }
    ],
    notes
  };
}

stationMode.disabled = false;
help.disabled = false;

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
        heading: "How to use",
        type: "bullets",
        items: [
          "Use New/Full buttons to set phase, then drag the nodes or adjust tilt $i$.",
          "Eclipses require syzygy (New/Full) and $|\\beta|$ small enough for the chosen Earth–Moon distance."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Eclipse Geometry",
    subtitle: "Record phase, node proximity, and eclipse outcomes",
    columns: [
      { key: "case", label: "Case" },
      { key: "phase", label: "Phase" },
      { key: "phaseAngleDeg", label: "$\\Delta$ ($^\\circ$)" },
      { key: "absBetaDeg", label: "$|\\beta|$ ($^\\circ$)" },
      { key: "nearestNodeDeg", label: "Nearest node (deg)" },
      { key: "tiltDeg", label: "Tilt $i$ ($^\\circ$)" },
      { key: "earthMoonDistanceKm", label: "Earth–Moon distance (km)" },
      { key: "outcome", label: "Outcome" }
    ],
    getSnapshotRow: () => {
      const derived = getDerived({
        sunLonDeg: state.sunLonDeg,
        moonLonDeg: state.moonLonDeg,
        nodeLonDeg: state.nodeLonDeg,
        orbitalTiltDeg: state.orbitalTiltDeg,
        earthMoonDistanceKm: state.earthMoonDistanceKm,
      });
      const phase = getPhaseInfo(derived.phaseAngleDeg);

      const outcome =
        derived.solarType !== "none"
          ? outcomeLabel(derived.solarType)
          : derived.lunarType !== "none"
            ? outcomeLabel(derived.lunarType)
            : "None";

      return buildStationRow({
        label: phase.label,
        phaseLabel: phase.label,
        phaseAngleDeg: derived.phaseAngleDeg,
        absBetaDeg: derived.absBetaDeg,
        nearestNodeDeg: derived.nearestNodeDeg,
        orbitalTiltDeg: state.orbitalTiltDeg,
        earthMoonDistanceKm: state.earthMoonDistanceKm,
        outcome,
      });
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add 4-case template (blank)",
        getRows: () => [
          {
            case: "New (far)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          },
          {
            case: "New (near)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          },
          {
            case: "Full (far)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          },
          {
            case: "Full (near)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          }
        ]
      }
    ]
  }
});

demoModes.bindButtons({
  helpButton: help,
  stationButton: stationMode
});

const challenges: Challenge[] = [
  {
    type: "custom",
    prompt: "Achieve a solar eclipse (New Moon and $|\\beta|$ small enough).",
    initialState: {
      moonLonDeg: 12,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Click “New Moon” (or get phase angle $\\Delta$ close to $0^\\circ$).",
      "Then adjust node longitude $\\Omega$ so the Moon is near a node ($|\\beta|$ decreases)."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const delta = Number(st.phaseAngleDeg);
      const absBetaDeg = Number(st.absBetaDeg);
      const distanceKm = Number(st.earthMoonDistanceKm);
      const solarType = st.solarType;

      if (![delta, absBetaDeg, distanceKm].every(Number.isFinite) || !solarType) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
        earthMoonDistanceKm: distanceKm
      });

      const isNewSyzygy =
        EclipseGeometryModel.angularSeparationDeg(delta, 0) <= SYZYGY_TOLERANCE_DEG;
      if (!isNewSyzygy) {
        return {
          correct: false,
          close: EclipseGeometryModel.angularSeparationDeg(delta, 0) <= 2 * SYZYGY_TOLERANCE_DEG,
          message: `Not yet: get New Moon ($\\Delta$ within $${SYZYGY_TOLERANCE_DEG}^\\circ$ of $0^\\circ$).`
        };
      }

      if (solarType !== "none") {
        return {
          correct: true,
          close: true,
          message: `Nice: ${outcomeLabel(solarType)} ($|\\beta|=${absBetaDeg.toFixed(3)}^\\circ$)`
        };
      }

      const target = thresholds.solarPartialDeg;
      return {
        correct: false,
        close: absBetaDeg <= target * 1.2,
        message: `Close, but no eclipse: try reducing $|\\beta|$ below about $${target.toFixed(2)}^\\circ$ (for this distance).`
      };
    }
  },
  {
    type: "custom",
    prompt: "Achieve a lunar eclipse (Full Moon and lunar outcome $\\ne$ none).",
    initialState: {
      moonLonDeg: 192,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Click “Full Moon” (or get phase angle $\\Delta$ close to $180^\\circ$).",
      "Then adjust $\\Omega$ so the Moon is near a node ($|\\beta|$ decreases)."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const delta = Number(st.phaseAngleDeg);
      const absBetaDeg = Number(st.absBetaDeg);
      const lunarType = st.lunarType;

      if (![delta, absBetaDeg].every(Number.isFinite) || !lunarType) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      const isFullSyzygy =
        EclipseGeometryModel.angularSeparationDeg(delta, 180) <= SYZYGY_TOLERANCE_DEG;
      if (!isFullSyzygy) {
        return {
          correct: false,
          close:
            EclipseGeometryModel.angularSeparationDeg(delta, 180) <= 2 * SYZYGY_TOLERANCE_DEG,
          message: `Not yet: get Full Moon ($\\Delta$ within $${SYZYGY_TOLERANCE_DEG}^\\circ$ of $180^\\circ$).`
        };
      }

      if (lunarType !== "none") {
        return {
          correct: true,
          close: true,
          message: `Nice: ${outcomeLabel(lunarType)} ($|\\beta|=${absBetaDeg.toFixed(3)}^\\circ$)`
        };
      }

      return {
        correct: false,
        close: absBetaDeg <= 1.5,
        message: "Close, but no eclipse: try bringing the Moon closer to a node (smaller $|\\beta|$)."
      };
    }
  },
  {
    type: "custom",
    prompt: "Show “monthly eclipses” if $i = 0^\\circ$: make tilt $0^\\circ$ so New and Full both produce eclipses.",
    initialState: {
      moonLonDeg: 180,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Set orbital tilt $i$ to $0^\\circ$.",
      "Then check New and Full: with $i=0^\\circ$, $\\beta$ stays at $0^\\circ$ so eclipses are always possible at syzygy."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const tiltDeg = Number(st.orbitalTiltDeg);
      const distanceKm = Number(st.earthMoonDistanceKm);
      if (![tiltDeg, distanceKm].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      if (tiltDeg > 0.1) {
        return {
          correct: false,
          close: tiltDeg <= 0.5,
          message: `Not yet: set $i$ very close to $0^\\circ$ (currently $${tiltDeg.toFixed(3)}^\\circ$).`
        };
      }

      const solar = EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
        betaDeg: 0,
        earthMoonDistanceKm: distanceKm
      }).type;
      const lunar = EclipseGeometryModel.lunarEclipseTypeFromBetaDeg({
        betaDeg: 0,
        earthMoonDistanceKm: distanceKm
      }).type;

      if (solar !== "none" && lunar !== "none") {
        return {
          correct: true,
          close: true,
          message: `Nice: at $i\\approx0^\\circ$, New $\\to$ ${outcomeLabel(solar)} and Full $\\to$ ${outcomeLabel(lunar)}`
        };
      }

      return { correct: false, close: false, message: "Unexpected: eclipse types were none at $\\beta=0^\\circ$." };
    }
  },
  {
    type: "custom",
    prompt: "Why not every month? Find a Full Moon that does NOT cause a lunar eclipse.",
    initialState: {
      moonLonDeg: 180,
      nodeLonDeg: 90,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Click \u201CFull Moon\u201D to get phase close to $180^\\circ$.",
      "Then move the node longitude far from the Moon (try $\\Omega$ near $90^\\circ$). With the Moon far from a node, $|\\beta|$ is too large for an eclipse."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const delta = Number(st.phaseAngleDeg);
      const lunarType = st.lunarType ?? "none";
      if (!Number.isFinite(delta)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      return checkWhyNotEveryMonth({
        phaseAngleDeg: delta,
        lunarType,
        angularSep: EclipseGeometryModel.angularSeparationDeg,
      });
    }
  },
  {
    type: "custom",
    prompt: "Eclipse statistics: Run a simulation of at least 10 years. Are total eclipses more common than partial?",
    initialState: {
      moonLonDeg: 180,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Set years to 10 or more on the log-scale slider, then click Run Simulation.",
      "When the simulation completes, compare total vs. partial counts in the output."
    ],
    check: () => {
      if (!lastCompletedSim) {
        return { correct: false, close: false, message: "Run a simulation first (use the simulation controls above)." };
      }
      const c = lastCompletedSim.counts;
      const totalEclipses =
        c.solar.partial + c.solar.annular + c.solar.total +
        c.lunar.penumbral + c.lunar.partial + c.lunar.total;
      return checkEclipseStatistics({
        yearsSimulated: lastCompletedSim.yearsSimulated,
        totalEclipses,
        counts: c,
      });
    }
  }
];

const challengeEngine = new ChallengeEngine(challenges, {
  container: controlsBody,
  showUI: true,
  getState,
  setState
});

challengeMode.disabled = false;
challengeMode.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) {
    challengeEngine.stop();
  } else {
    render();
    challengeEngine.start();
  }
});

type SimSpeedKey = "slow" | "medium" | "fast";
type RunMode = "idle" | "animate-month" | "animate-year" | "simulate";

const DAY_S = AstroConstants.TIME.DAY_S;
const JULIAN_YEAR_DAYS = AstroConstants.TIME.JULIAN_YEAR_S / DAY_S;
const TROPICAL_YEAR_DAYS = AstroConstants.TIME.MEAN_TROPICAL_YEAR_DAYS;
const SIDEREAL_MONTH_DAYS = AstroConstants.TIME.MEAN_SIDEREAL_MONTH_DAYS;
const SYNODIC_MONTH_DAYS = AstroConstants.TIME.MEAN_SYNODIC_MONTH_DAYS;
const NODE_REGRESSION_YEARS = AstroConstants.TIME.MEAN_NODE_REGRESSION_JULIAN_YEARS;

const SUN_RATE_DEG_PER_DAY = 360 / TROPICAL_YEAR_DAYS;
const MOON_RATE_DEG_PER_DAY = 360 / SIDEREAL_MONTH_DAYS;
const NODE_RATE_DEG_PER_DAY = -360 / (NODE_REGRESSION_YEARS * JULIAN_YEAR_DAYS);
const PHASE_RATE_DEG_PER_DAY = 360 / SYNODIC_MONTH_DAYS;

const ANIMATE_MONTH_DAYS_PER_SECOND = 25;
const ANIMATE_YEAR_DAYS_PER_SECOND = 220;

const SIM_SPEED_DAYS_PER_SECOND: Record<SimSpeedKey, number> = {
  slow: 200,
  medium: 2000,
  fast: 10000
};
const SIM_STEP_DAYS = 0.1;

let runMode: RunMode = "idle";
let rafId: number | null = null;
let lastT = 0;
let animateYearRemainingDays = 0;

type SyzygyWindowBest = { tDays: number; betaDeg: number; absBetaDeg: number; sepDeg: number };

type SimulationState = {
  tDays: number;
  totalDays: number;
  sunLonDeg: number;
  moonLonDeg: number;
  nodeLonDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  counts: SimulationCounts;
  sampleEvents: string[];
  inNewWindow: boolean;
  bestNew: SyzygyWindowBest | null;
  inFullWindow: boolean;
  bestFull: SyzygyWindowBest | null;
};

let simulation: SimulationState | null = null;
let lastCompletedSim: { yearsSimulated: number; counts: SimulationCounts } | null = null;

function stopLoop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  lastT = 0;
  runMode = "idle";
  animateYearRemainingDays = 0;
  simulation = null;
  stopSimulation.disabled = true;
  runSimulation.disabled = prefersReducedMotion;
  animateMonth.disabled = prefersReducedMotion;
  animateYear.disabled = prefersReducedMotion;
  animateMonth.textContent = "Animate month";
  animateYear.textContent = "Animate 1 year";
  runSimulation.textContent = "Run simulation";
}

function updateTimeButtonLabels() {
  animateMonth.textContent = runMode === "animate-month" ? "Stop (month)" : "Animate month";
  animateYear.textContent = runMode === "animate-year" ? "Stop (year)" : "Animate 1 year";
  runSimulation.textContent = runMode === "simulate" ? "Running…" : "Run simulation";
}

function getSimSummary(sim: SimulationState): string {
  return formatSimSummary(sim, TROPICAL_YEAR_DAYS);
}

function renderSimTable(sim: SimulationState): void {
  const data = formatSimTable(sim, TROPICAL_YEAR_DAYS);
  const { rows, summary } = data;

  const summaryHtml = `<div class="sim-summary">
    <span>Simulated <strong>${summary.years}</strong> yr</span>
    <span>Solar: <strong class="sim-summary__stat sim-summary__stat--solar">${summary.solarCount}</strong></span>
    <span>Lunar: <strong class="sim-summary__stat sim-summary__stat--lunar">${summary.lunarCount}</strong></span>
  </div>`;

  let tableHtml = "";
  if (rows.length > 0) {
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr data-category="${r.category}"><td>${r.year.toFixed(2)}</td><td>${r.type}</td><td>${r.details}</td></tr>`
      )
      .join("");
    tableHtml = `<table class="sim-table">
      <thead><tr><th>Year</th><th>Type</th><th>Details</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
  }

  simOutput.innerHTML = summaryHtml + tableHtml;
}

function recordSyzygyWindow(kind: "new" | "full") {
  if (!simulation) return;
  const best = kind === "new" ? simulation.bestNew : simulation.bestFull;
  if (!best) return;

  if (kind === "new") simulation.counts.newWindows += 1;
  else simulation.counts.fullWindows += 1;

  const distanceKm = simulation.earthMoonDistanceKm;
  if (kind === "new") {
    const solarType = EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
      betaDeg: best.betaDeg,
      earthMoonDistanceKm: distanceKm
    }).type;
    if (solarType === "partial-solar") simulation.counts.solar.partial += 1;
    if (solarType === "annular-solar") simulation.counts.solar.annular += 1;
    if (solarType === "total-solar") simulation.counts.solar.total += 1;

    if (solarType !== "none" && simulation.sampleEvents.length < 10) {
      const y = best.tDays / TROPICAL_YEAR_DAYS;
      simulation.sampleEvents.push(
        `Year ${y.toFixed(2)}: Solar ${outcomeLabel(solarType)} (abs(beta)=${best.absBetaDeg.toFixed(3)} deg, Delta~0 deg)`
      );
    }
  } else {
    const lunarType = EclipseGeometryModel.lunarEclipseTypeFromBetaDeg({
      betaDeg: best.betaDeg,
      earthMoonDistanceKm: distanceKm
    }).type;
    if (lunarType === "penumbral-lunar") simulation.counts.lunar.penumbral += 1;
    if (lunarType === "partial-lunar") simulation.counts.lunar.partial += 1;
    if (lunarType === "total-lunar") simulation.counts.lunar.total += 1;

    if (lunarType !== "none" && simulation.sampleEvents.length < 10) {
      const y = best.tDays / TROPICAL_YEAR_DAYS;
      simulation.sampleEvents.push(
        `Year ${y.toFixed(2)}: Lunar ${outcomeLabel(lunarType)} (abs(beta)=${best.absBetaDeg.toFixed(3)} deg, Delta~180 deg)`
      );
    }
  }
}

function stepSimulation(dtDays: number) {
  if (!simulation) return;
  const sim = simulation;

  sim.tDays += dtDays;
  sim.sunLonDeg = EclipseGeometryModel.normalizeAngleDeg(sim.sunLonDeg + SUN_RATE_DEG_PER_DAY * dtDays);
  sim.moonLonDeg = EclipseGeometryModel.normalizeAngleDeg(sim.moonLonDeg + MOON_RATE_DEG_PER_DAY * dtDays);
  sim.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(sim.nodeLonDeg + NODE_RATE_DEG_PER_DAY * dtDays);

  const phaseAngleDegValue = EclipseGeometryModel.phaseAngleDeg({
    moonLonDeg: sim.moonLonDeg,
    sunLonDeg: sim.sunLonDeg
  });
  const sepNew = EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 0);
  const sepFull = EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 180);

  const betaDeg = EclipseGeometryModel.eclipticLatitudeDeg({
    tiltDeg: sim.orbitalTiltDeg,
    moonLonDeg: sim.moonLonDeg,
    nodeLonDeg: sim.nodeLonDeg
  });
  const absBetaDegValue = Math.abs(betaDeg);

  const inNew = sepNew <= SYZYGY_TOLERANCE_DEG;
  if (inNew) {
    if (!sim.inNewWindow) {
      sim.inNewWindow = true;
      sim.bestNew = { tDays: sim.tDays, betaDeg, absBetaDeg: absBetaDegValue, sepDeg: sepNew };
    } else if (sim.bestNew && sepNew < sim.bestNew.sepDeg) {
      sim.bestNew = { tDays: sim.tDays, betaDeg, absBetaDeg: absBetaDegValue, sepDeg: sepNew };
    }
  } else if (sim.inNewWindow) {
    recordSyzygyWindow("new");
    sim.inNewWindow = false;
    sim.bestNew = null;
  }

  const inFull = sepFull <= SYZYGY_TOLERANCE_DEG;
  if (inFull) {
    if (!sim.inFullWindow) {
      sim.inFullWindow = true;
      sim.bestFull = { tDays: sim.tDays, betaDeg, absBetaDeg: absBetaDegValue, sepDeg: sepFull };
    } else if (sim.bestFull && sepFull < sim.bestFull.sepDeg) {
      sim.bestFull = { tDays: sim.tDays, betaDeg, absBetaDeg: absBetaDegValue, sepDeg: sepFull };
    }
  } else if (sim.inFullWindow) {
    recordSyzygyWindow("full");
    sim.inFullWindow = false;
    sim.bestFull = null;
  }
}

function tick(t: number) {
  if (runMode === "idle") return;

  const dtSec = lastT ? Math.max(0, (t - lastT) / 1000) : 0;
  lastT = t;

  if (runMode === "animate-month") {
    const dtDays = ANIMATE_MONTH_DAYS_PER_SECOND * dtSec;
    // Advance all three bodies in state (avoid slider step-snapping loss for slow rates)
    state.sunLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + SUN_RATE_DEG_PER_DAY * dtDays);
    state.moonLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.moonLonDeg + MOON_RATE_DEG_PER_DAY * dtDays);
    state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg + NODE_RATE_DEG_PER_DAY * dtDays);
    // Write rounded value back to moon slider for display (node has no slider)
    moonLon.value = String(Math.round(state.moonLonDeg));
    render();
    rafId = requestAnimationFrame(tick);
    return;
  }

  if (runMode === "animate-year") {
    const dtDays = Math.min(animateYearRemainingDays, ANIMATE_YEAR_DAYS_PER_SECOND * dtSec);
    animateYearRemainingDays = Math.max(0, animateYearRemainingDays - dtDays);

    // Advance all three bodies in state (avoid slider step-snapping loss for slow rates)
    state.sunLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + SUN_RATE_DEG_PER_DAY * dtDays);
    state.moonLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.moonLonDeg + MOON_RATE_DEG_PER_DAY * dtDays);
    state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg + NODE_RATE_DEG_PER_DAY * dtDays);
    // Write rounded value back to moon slider for display (node has no slider)
    moonLon.value = String(Math.round(state.moonLonDeg));
    render();

    if (animateYearRemainingDays <= 0) {
      stopLoop();
      updateTimeButtonLabels();
      setLiveRegionText(status, "Year animation complete.");
      return;
    }
    rafId = requestAnimationFrame(tick);
    return;
  }

  if (runMode === "simulate") {
    const speedKey = (simSpeed.value as SimSpeedKey) || "medium";
    const speed = SIM_SPEED_DAYS_PER_SECOND[speedKey] ?? SIM_SPEED_DAYS_PER_SECOND.medium;
    let remaining = speed * dtSec;

    while (remaining > 0) {
      const step = Math.min(SIM_STEP_DAYS, remaining);
      stepSimulation(step);
      remaining -= step;
      if (simulation && simulation.tDays >= simulation.totalDays) break;
    }

    if (!simulation) {
      stopLoop();
      updateTimeButtonLabels();
      return;
    }

    state.sunLonDeg = simulation.sunLonDeg;
    state.nodeLonDeg = simulation.nodeLonDeg;
    moonLon.value = String(simulation.moonLonDeg);
    render();

    const pct = Math.min(1, simulation.tDays / simulation.totalDays);
    simOutput.hidden = false;
    renderSimTable(simulation);
    // Append progress indicator during the run
    const progressEl = document.createElement("div");
    progressEl.className = "sim-summary";
    progressEl.textContent = `Progress: ${(pct * 100).toFixed(1)}%`;
    simOutput.appendChild(progressEl);

    if (simulation.tDays >= simulation.totalDays) {
      if (simulation.inNewWindow) recordSyzygyWindow("new");
      if (simulation.inFullWindow) recordSyzygyWindow("full");

      renderSimTable(simulation);
      lastCompletedSim = {
        yearsSimulated: simulation.tDays / TROPICAL_YEAR_DAYS,
        counts: { ...simulation.counts, solar: { ...simulation.counts.solar }, lunar: { ...simulation.counts.lunar } },
      };
      stopLoop();
      stopSimulation.disabled = true;
      runSimulation.disabled = prefersReducedMotion;
      updateTimeButtonLabels();
      setLiveRegionText(status, "Simulation complete.");
      return;
    }

    rafId = requestAnimationFrame(tick);
  }
}

function stopTimeActions() {
  const wasRunning = runMode !== "idle";
  if (!wasRunning) return;
  stopLoop();
  updateTimeButtonLabels();
  setLiveRegionText(status, "Stopped.");
}

populateDistancePresets();

function setPhasePressed(active: HTMLButtonElement | null) {
  setNewMoon.setAttribute("aria-pressed", active === setNewMoon ? "true" : "false");
  setFullMoon.setAttribute("aria-pressed", active === setFullMoon ? "true" : "false");
}

setNewMoon.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  moonLon.value = String(state.sunLonDeg);
  setPhasePressed(setNewMoon);
  render();
});

setFullMoon.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  moonLon.value = String(EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + 180));
  setPhasePressed(setFullMoon);
  render();
});

/* ------------------------------------------------------------------ */
/*  Eclipse preset handlers                                            */
/* ------------------------------------------------------------------ */

function closePresetsPopover() {
  presetsPopover.hidden = true;
  presetsBtn.setAttribute("aria-expanded", "false");
}

presetTotalSolar.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  const p = totalSolarPreset({ sunLonDeg: state.sunLonDeg });
  moonLon.value = String(Math.round(p.moonLonDeg));
  state.nodeLonDeg = p.nodeLonDeg;
  setPhasePressed(null);
  closePresetsPopover();
  render();
});

presetLunar.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  const p = lunarEclipsePreset({ sunLonDeg: state.sunLonDeg });
  moonLon.value = String(Math.round(p.moonLonDeg));
  state.nodeLonDeg = p.nodeLonDeg;
  setPhasePressed(null);
  closePresetsPopover();
  render();
});

presetNoEclipse.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  const p = noEclipsePreset({ sunLonDeg: state.sunLonDeg, nodeLonDeg: state.nodeLonDeg });
  moonLon.value = String(Math.round(p.moonLonDeg));
  setPhasePressed(null);
  closePresetsPopover();
  render();
});

presetSeason.addEventListener("click", () => {
  if (prefersReducedMotion) return;
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  // Place moon 30 deg before ascending node so it sweeps through the eclipse window
  state.moonLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg - 30);
  moonLon.value = String(Math.round(state.moonLonDeg));
  setPhasePressed(null);
  closePresetsPopover();
  render();
  // Trigger animate-month
  stopLoop();
  runMode = "animate-month";
  updateTimeButtonLabels();
  rafId = requestAnimationFrame(tick);
});

simYears.addEventListener("input", () => {
  simYearsValue.textContent = `${formatYearsLabel(sliderToYears(Number(simYears.value)))} yr`;
});

animateMonth.addEventListener("click", () => {
  if (prefersReducedMotion) return;
  if (challengeEngine.isActive()) challengeEngine.stop();

  if (runMode === "animate-month") {
    stopTimeActions();
    return;
  }

  stopLoop();
  setPhasePressed(null);
  runMode = "animate-month";
  updateTimeButtonLabels();
  rafId = requestAnimationFrame(tick);
});

animateYear.addEventListener("click", () => {
  if (prefersReducedMotion) return;
  if (challengeEngine.isActive()) challengeEngine.stop();

  if (runMode === "animate-year") {
    stopTimeActions();
    return;
  }

  stopLoop();
  setPhasePressed(null);
  runMode = "animate-year";
  animateYearRemainingDays = TROPICAL_YEAR_DAYS;
  updateTimeButtonLabels();
  rafId = requestAnimationFrame(tick);
});

runSimulation.addEventListener("click", () => {
  if (prefersReducedMotion) return;
  if (challengeEngine.isActive()) challengeEngine.stop();

  stopLoop();
  render(); // ensure state is synced with controls

  const years = clamp(sliderToYears(Number(simYears.value)), 1, 1000);
  const totalDays = years * TROPICAL_YEAR_DAYS;

  simulation = {
    tDays: 0,
    totalDays,
    sunLonDeg: state.sunLonDeg,
    moonLonDeg: EclipseGeometryModel.normalizeAngleDeg(Number(moonLon.value)),
    nodeLonDeg: EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg),
    orbitalTiltDeg: clamp(Number(tilt.value), 0, 10),
    earthMoonDistanceKm: state.earthMoonDistanceKm,
    counts: {
      solar: { partial: 0, annular: 0, total: 0 },
      lunar: { penumbral: 0, partial: 0, total: 0 },
      newWindows: 0,
      fullWindows: 0
    },
    sampleEvents: [],
    inNewWindow: false,
    bestNew: null,
    inFullWindow: false,
    bestFull: null
  };

  runMode = "simulate";
  runSimulation.disabled = true;
  stopSimulation.disabled = false;
  animateMonth.disabled = true;
  animateYear.disabled = true;
  simOutput.hidden = false;
  renderSimTable(simulation);
  updateTimeButtonLabels();
  setLiveRegionText(status, "Simulation running…");
  rafId = requestAnimationFrame(tick);
});

stopSimulation.addEventListener("click", () => {
  stopTimeActions();
});

copyResults.addEventListener("click", () => {
  stopTimeActions();
  if (challengeEngine.isActive()) challengeEngine.stop();
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults(getState()))
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err: unknown) => {
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      );
    });
});

moonLon.addEventListener("input", () => {
  stopTimeActions();
  setPhasePressed(null);
  render();
});
tilt.addEventListener("input", () => {
  stopTimeActions();
  render();
});
distancePreset.addEventListener("change", () => {
  stopTimeActions();
  render();
});

/* ------------------------------------------------------------------ */
/*  Moon drag interaction on orbit SVG                                 */
/* ------------------------------------------------------------------ */

let isDragging = false;

/** Convert client (screen) coords to SVG user-space coords. */
function clientToSvg(clientX: number, clientY: number): { x: number; y: number } | null {
  const ctm = eclipseSvg.getScreenCTM();
  if (!ctm) return null;
  const inv = ctm.inverse();
  return {
    x: inv.a * clientX + inv.c * clientY + inv.e,
    y: inv.b * clientX + inv.d * clientY + inv.f,
  };
}

// Orbit center in SVG coords: orbitPanel translate(40,40) + inner translate(220,180)
const ORBIT_CX_SVG = 40 + 220;
const ORBIT_CY_SVG = 40 + 180;

function handleDragStart(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  isDragging = true;
  moonDot.classList.add("stage__moon--dragging");
  stopTimeActions();
  setPhasePressed(null);
}

function handleDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging) return;
  if ("touches" in e && e.touches.length === 0) return;
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  const pt = clientToSvg(clientX, clientY);
  if (!pt) return;

  // Angle in SVG display coords (Sun-fixed frame)
  const displayAngleDeg = svgPointToAngleDeg(ORBIT_CX_SVG, ORBIT_CY_SVG, pt.x, pt.y);
  // Convert back to ecliptic longitude: moonLon = displayAngle + sunLon
  const newMoonLon = EclipseGeometryModel.normalizeAngleDeg(displayAngleDeg + state.sunLonDeg);

  moonLon.value = String(Math.round(newMoonLon));
  render();
}

function handleDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  moonDot.classList.remove("stage__moon--dragging");
}

/* ------------------------------------------------------------------ */
/*  Shelf tab switching                                                */
/* ------------------------------------------------------------------ */

const tabButtons = document.querySelectorAll<HTMLButtonElement>(".cp-tabs [role='tab']");

function switchTab(selectedBtn: HTMLButtonElement) {
  for (const btn of tabButtons) {
    const isSelected = btn === selectedBtn;
    btn.setAttribute("aria-selected", String(isSelected));
    btn.classList.toggle("cp-tab--active", isSelected);
    const panelId = btn.getAttribute("aria-controls");
    if (panelId) {
      const panel = document.getElementById(panelId);
      if (panel) panel.hidden = !isSelected;
    }
  }
}

for (const btn of tabButtons) {
  btn.addEventListener("click", () => switchTab(btn));
}

moonDot.addEventListener("mousedown", handleDragStart);
moonDot.addEventListener("touchstart", handleDragStart, { passive: false });
eclipseSvg.addEventListener("mousemove", handleDragMove);
eclipseSvg.addEventListener("touchmove", handleDragMove, { passive: false });
document.addEventListener("mouseup", handleDragEnd);
document.addEventListener("touchend", handleDragEnd);

/* ------------------------------------------------------------------ */
/*  Node drag interaction on orbit SVG                                 */
/* ------------------------------------------------------------------ */

function setupNodeDrag(nodeEl: SVGCircleElement, isAscending: boolean) {
  let dragging = false;

  const start = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    dragging = true;
    nodeEl.classList.add("stage__node--dragging");
    stopTimeActions();
    setPhasePressed(null);
  };

  const move = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    if ("touches" in e && e.touches.length === 0) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const pt = clientToSvg(clientX, clientY);
    if (!pt) return;

    // Angle in SVG display coords (Sun-fixed frame)
    const displayAngleDeg = svgPointToAngleDeg(ORBIT_CX_SVG, ORBIT_CY_SVG, pt.x, pt.y);
    // Convert back to ecliptic longitude: nodeLon = displayAngle + sunLon
    // For descending node, the ascending node is 180deg away
    if (isAscending) {
      state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(displayAngleDeg + state.sunLonDeg);
    } else {
      state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(displayAngleDeg + 180 + state.sunLonDeg);
    }
    render();
  };

  const end = () => {
    if (!dragging) return;
    dragging = false;
    nodeEl.classList.remove("stage__node--dragging");
  };

  nodeEl.addEventListener("mousedown", start);
  nodeEl.addEventListener("touchstart", start, { passive: false });
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move, { passive: false });
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

setupNodeDrag(ascNodeDot, true);
setupNodeDrag(descNodeDot, false);

/* ------------------------------------------------------------------ */
/*  Keyboard support for draggable nodes                               */
/* ------------------------------------------------------------------ */

[ascNodeDot, descNodeDot].forEach((el) => {
  el.addEventListener("keydown", (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg + step);
      render();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      state.nodeLonDeg = EclipseGeometryModel.normalizeAngleDeg(state.nodeLonDeg - step + 360);
      render();
      e.preventDefault();
    }
  });
});

render();

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);
