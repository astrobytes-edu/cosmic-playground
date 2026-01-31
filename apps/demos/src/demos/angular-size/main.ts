import { createInstrumentRuntime } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AngularSizeModel, AstroUnits } from "@cosmic/physics";

const presetEl = document.querySelector<HTMLSelectElement>("#preset");
const distanceSliderEl = document.querySelector<HTMLInputElement>("#distanceSlider");
const distanceValueEl = document.querySelector<HTMLSpanElement>("#distanceValue");
const diameterSliderEl = document.querySelector<HTMLInputElement>("#diameterSlider");
const diameterValueEl = document.querySelector<HTMLSpanElement>("#diameterValue");

const moonControlsEl = document.querySelector<HTMLElement>("#moonControls");
const moonModeOrbitEl = document.querySelector<HTMLInputElement>("#moonModeOrbit");
const moonModeRecessionEl =
  document.querySelector<HTMLInputElement>("#moonModeRecession");
const moonOrbitRowEl = document.querySelector<HTMLElement>("#moonOrbitRow");
const moonOrbitAngleEl =
  document.querySelector<HTMLInputElement>("#moonOrbitAngle");
const moonOrbitValueEl = document.querySelector<HTMLSpanElement>("#moonOrbitValue");
const moonRecessionRowEl =
  document.querySelector<HTMLElement>("#moonRecessionRow");
const moonRecessionTimeEl =
  document.querySelector<HTMLInputElement>("#moonRecessionTime");
const moonRecessionValueEl =
  document.querySelector<HTMLSpanElement>("#moonRecessionValue");

const stageSvgEl = document.querySelector<SVGSVGElement>("#stageSvg");
const rayTopEl = document.querySelector<SVGLineElement>("#rayTop");
const rayBottomEl = document.querySelector<SVGLineElement>("#rayBottom");
const objectCircleEl = document.querySelector<SVGCircleElement>("#objectCircle");
const angleLabelEl = document.querySelector<SVGTextElement>("#angleLabel");

const thetaDisplayEl = document.querySelector<HTMLSpanElement>("#thetaDisplay");
const thetaDegEl = document.querySelector<HTMLSpanElement>("#thetaDeg");
const diameterKmEl = document.querySelector<HTMLSpanElement>("#diameterKm");
const distanceKmEl = document.querySelector<HTMLSpanElement>("#distanceKm");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

if (
  !presetEl ||
  !distanceSliderEl ||
  !distanceValueEl ||
  !diameterSliderEl ||
  !diameterValueEl ||
  !moonControlsEl ||
  !moonModeOrbitEl ||
  !moonModeRecessionEl ||
  !moonOrbitRowEl ||
  !moonOrbitAngleEl ||
  !moonOrbitValueEl ||
  !moonRecessionRowEl ||
  !moonRecessionTimeEl ||
  !moonRecessionValueEl ||
  !stageSvgEl ||
  !rayTopEl ||
  !rayBottomEl ||
  !objectCircleEl ||
  !angleLabelEl ||
  !thetaDisplayEl ||
  !thetaDegEl ||
  !diameterKmEl ||
  !distanceKmEl ||
  !copyResultsEl ||
  !statusEl
) {
  throw new Error("Missing required DOM elements for angular-size demo.");
}

const preset = presetEl;
const distanceSlider = distanceSliderEl;
const distanceValue = distanceValueEl;
const diameterSlider = diameterSliderEl;
const diameterValue = diameterValueEl;

const moonControls = moonControlsEl;
const moonModeOrbit = moonModeOrbitEl;
const moonModeRecession = moonModeRecessionEl;
const moonOrbitRow = moonOrbitRowEl;
const moonOrbitAngle = moonOrbitAngleEl;
const moonOrbitValue = moonOrbitValueEl;
const moonRecessionRow = moonRecessionRowEl;
const moonRecessionTime = moonRecessionTimeEl;
const moonRecessionValue = moonRecessionValueEl;

const stageSvg = stageSvgEl;
const rayTop = rayTopEl;
const rayBottom = rayBottomEl;
const objectCircle = objectCircleEl;
const angleLabel = angleLabelEl;

const thetaDisplay = thetaDisplayEl;
const thetaDeg = thetaDegEl;
const diameterKm = diameterKmEl;
const distanceKm = distanceKmEl;

const copyResults = copyResultsEl;
const status = statusEl;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:angular-size:mode",
  url: new URL(window.location.href)
});

// Slider ranges (logarithmic), matching legacy defaults.
const DISTANCE_MIN_KM = 0.0001; // 0.1 m
const DISTANCE_MAX_KM = 1e20; // ~10 million ly
const DIAMETER_MIN_KM = 0.00001; // 1 cm
const DIAMETER_MAX_KM = 1e19; // large galaxy scale

// Moon model controls (teaching defaults)
const MOON_ORBIT_MIN_ANGULAR_SIZE_DEG = 0.49;
const MOON_ORBIT_MAX_ANGULAR_SIZE_DEG = 0.56;
const MOON_RECESSION_CM_PER_YEAR = 3.8; // mean present-day value; varies with time
const MOON_DISTANCE_TODAY_KM = AngularSizeModel.presets.moon.distance;
const MOON_DIAMETER_KM = AngularSizeModel.presets.moon.diameter;

const moonOrbit = (() => {
  const perigeeKm = AngularSizeModel.distanceForAngularDiameterDeg({
    diameterKm: MOON_DIAMETER_KM,
    angularDiameterDeg: MOON_ORBIT_MAX_ANGULAR_SIZE_DEG
  });
  const apogeeKm = AngularSizeModel.distanceForAngularDiameterDeg({
    diameterKm: MOON_DIAMETER_KM,
    angularDiameterDeg: MOON_ORBIT_MIN_ANGULAR_SIZE_DEG
  });
  return { perigeeKm, apogeeKm };
})();

type MoonTimeMode = "orbit" | "recession";

const state: {
  presetId: keyof typeof AngularSizeModel.presets;
  diameterKm: number;
  distanceKm: number;
  moonTimeMode: MoonTimeMode;
  moonOrbitAngleDeg: number;
  moonRecessionTimeMyr: number;
} = {
  presetId: "sun",
  diameterKm: AngularSizeModel.presets.sun.diameter,
  distanceKm: AngularSizeModel.presets.sun.distance,
  moonTimeMode: "orbit",
  moonOrbitAngleDeg: 0,
  moonRecessionTimeMyr: 0
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function logSliderToValue(sliderVal: number, minVal: number, maxVal: number) {
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const fraction = sliderVal / 1000;
  const logVal = minLog + fraction * (maxLog - minLog);
  return Math.pow(10, logVal);
}

function valueToLogSlider(value: number, minVal: number, maxVal: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const minLog = Math.log10(minVal);
  const maxLog = Math.log10(maxVal);
  const logVal = Math.log10(value);
  const frac = (logVal - minLog) / (maxLog - minLog);
  return clamp(Math.round(frac * 1000), 0, 1000);
}

function formatNumber(value: number, digits = 3) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(digits - 1);
  return value.toFixed(digits);
}

function formatAngleDisplay(thetaDegValue: number): { text: string; unit: string } {
  if (!Number.isFinite(thetaDegValue)) return { text: "—", unit: "" };

  const abs = Math.abs(thetaDegValue);
  if (abs >= 1) return { text: thetaDegValue.toFixed(2), unit: "°" };
  if (abs >= 1 / 60) return { text: AstroUnits.degToArcmin(thetaDegValue).toFixed(1), unit: "′" };
  return { text: AstroUnits.degToArcsec(thetaDegValue).toFixed(0), unit: "″" };
}

function getMoonDistanceAtOrbitAngle(angleDeg: number): number {
  const phaseRad = AstroUnits.degToRad(angleDeg);
  const w = (Math.cos(phaseRad) + 1) / 2; // 1 at 0° (perigee), 0 at 180° (apogee)
  return moonOrbit.apogeeKm + w * (moonOrbit.perigeeKm - moonOrbit.apogeeKm);
}

function orbitAngleFromMoonDistance(distanceKmValue: number): number {
  const denom = moonOrbit.perigeeKm - moonOrbit.apogeeKm;
  if (!(denom > 0)) return 0;
  const w = (distanceKmValue - moonOrbit.apogeeKm) / denom;
  const clampedW = clamp(w, 0, 1);
  const cos = 2 * clampedW - 1;
  const angleRad = Math.acos(clamp(cos, -1, 1));
  return AstroUnits.radToDeg(angleRad);
}

function moonTimeMyrFromDistance(distanceKmValue: number): number {
  const kmPerMyr = MOON_RECESSION_CM_PER_YEAR * 10;
  if (kmPerMyr === 0) return 0;
  return (distanceKmValue - MOON_DISTANCE_TODAY_KM) / kmPerMyr;
}

function setMoonTimeMode(next: MoonTimeMode) {
  state.moonTimeMode = next;
  moonModeOrbit.checked = next === "orbit";
  moonModeRecession.checked = next === "recession";

  if (next === "orbit") {
    moonOrbitRow.hidden = false;
    moonRecessionRow.hidden = true;
    state.moonOrbitAngleDeg = orbitAngleFromMoonDistance(state.distanceKm);
    moonOrbitAngle.value = String(Math.round(state.moonOrbitAngleDeg));
  } else {
    moonOrbitRow.hidden = true;
    moonRecessionRow.hidden = false;
    state.moonRecessionTimeMyr = moonTimeMyrFromDistance(state.distanceKm);
    moonRecessionTime.value = String(Math.round(state.moonRecessionTimeMyr / 10) * 10);
    state.moonRecessionTimeMyr = Number(moonRecessionTime.value);
  }
}

function applyMoonControlsToDistance() {
  if (state.presetId !== "moon") return;

  if (state.moonTimeMode === "orbit") {
    const angleDeg = clamp(Number(moonOrbitAngle.value), 0, 360);
    state.moonOrbitAngleDeg = angleDeg;
    state.distanceKm = getMoonDistanceAtOrbitAngle(angleDeg);
    return;
  }

  const timeMyr = clamp(Number(moonRecessionTime.value), -1000, 1000);
  state.moonRecessionTimeMyr = timeMyr;
  state.distanceKm = AngularSizeModel.moonDistanceKmFromRecession({
    distanceTodayKm: MOON_DISTANCE_TODAY_KM,
    recessionCmPerYr: MOON_RECESSION_CM_PER_YEAR,
    timeMyr
  });
}

function updateMoonControlsVisibility() {
  const isMoon = state.presetId === "moon";
  moonControls.hidden = !isMoon;
  if (!isMoon) return;

  setMoonTimeMode(state.moonTimeMode);
}

function populatePresets() {
  preset.innerHTML = "";

  const astroGroup = document.createElement("optgroup");
  astroGroup.label = "Astronomical";

  const everydayGroup = document.createElement("optgroup");
  everydayGroup.label = "Everyday";

  (Object.keys(AngularSizeModel.presets) as Array<keyof typeof AngularSizeModel.presets>).forEach(
    (key) => {
      const p = AngularSizeModel.presets[key];
      const option = document.createElement("option");
      option.value = String(key);
      option.textContent = p.name;
      if (p.category === "astronomical") astroGroup.append(option);
      else everydayGroup.append(option);
    }
  );

  preset.append(astroGroup, everydayGroup);
  preset.value = state.presetId;
}

function setFromPreset(presetId: keyof typeof AngularSizeModel.presets) {
  const p = AngularSizeModel.presets[presetId];
  state.presetId = presetId;
  state.diameterKm = p.diameter;
  state.distanceKm = p.distance;

  if (presetId === "moon") {
    state.moonTimeMode = "orbit";
    state.moonOrbitAngleDeg = 0;
    state.moonRecessionTimeMyr = 0;
    state.distanceKm = getMoonDistanceAtOrbitAngle(0);
  }
}

function renderStage(thetaDegValue: number) {
  // Stage coordinates in viewBox space
  const observerX = 90;
  const centerY = 180;
  const objectX = 520;
  const maxRadius = 130;

  const thetaRad = AstroUnits.degToRad(thetaDegValue);
  const halfRad = thetaRad / 2;

  let radius = Math.tan(halfRad) * (objectX - observerX);
  if (!Number.isFinite(radius) || radius < 0) radius = 0;
  radius = Math.min(maxRadius, radius);

  const yTop = centerY - radius;
  const yBottom = centerY + radius;

  rayTop.setAttribute("x1", String(observerX));
  rayTop.setAttribute("y1", String(centerY));
  rayTop.setAttribute("x2", String(objectX));
  rayTop.setAttribute("y2", String(yTop));

  rayBottom.setAttribute("x1", String(observerX));
  rayBottom.setAttribute("y1", String(centerY));
  rayBottom.setAttribute("x2", String(objectX));
  rayBottom.setAttribute("y2", String(yBottom));

  objectCircle.setAttribute("cx", String(objectX));
  objectCircle.setAttribute("cy", String(centerY));
  objectCircle.setAttribute("r", String(Math.max(6, radius)));

  // Keep label inside the SVG even if angle is extreme.
  if (Number.isFinite(thetaDegValue) && thetaDegValue > 90) {
    stageSvg.classList.add("stage__svg--wide");
  } else {
    stageSvg.classList.remove("stage__svg--wide");
  }
}

function exportResults(thetaDegValue: number): ExportPayloadV1 {
  const display = formatAngleDisplay(thetaDegValue);
  const presetMeta = AngularSizeModel.presets[state.presetId];

  const notes: string[] = [];
  notes.push("Units: diameter and distance in km; angles in degrees (display may switch ° / ′ / ″).");
  if (state.presetId === "moon") {
    notes.push(
      `Moon time mode: ${state.moonTimeMode === "orbit" ? "Orbit (perigee ↔ apogee)" : "Recession (Myr from today)"}`
    );
    if (state.moonTimeMode === "recession") {
      notes.push(
        `Toy model: linear distance change using a constant recession rate of ${MOON_RECESSION_CM_PER_YEAR} cm/yr.`
      );
    }
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: presetMeta.name },
      { name: "Diameter (km)", value: formatNumber(state.diameterKm, 4) },
      { name: "Distance (km)", value: formatNumber(state.distanceKm, 4) }
    ],
    readouts: [
      { name: "Angular diameter (display)", value: `${display.text}${display.unit}` },
      { name: "Angular diameter (deg)", value: formatNumber(thetaDegValue, 6) }
    ],
    notes
  };
}

function render() {
  // Keep Moon distance consistent with Moon controls.
  applyMoonControlsToDistance();

  const thetaDegValue = AngularSizeModel.angularDiameterDeg({
    diameterKm: state.diameterKm,
    distanceKm: state.distanceKm
  });

  const display = formatAngleDisplay(thetaDegValue);

  preset.value = state.presetId;
  distanceSlider.value = String(valueToLogSlider(state.distanceKm, DISTANCE_MIN_KM, DISTANCE_MAX_KM));
  diameterSlider.value = String(valueToLogSlider(state.diameterKm, DIAMETER_MIN_KM, DIAMETER_MAX_KM));

  distanceValue.textContent = `${formatNumber(state.distanceKm, 4)} km`;
  diameterValue.textContent = `${formatNumber(state.diameterKm, 4)} km`;

  if (state.presetId === "moon") {
    moonOrbitValue.textContent = `${Math.round(state.moonOrbitAngleDeg)}°`;
    const t = Math.round(state.moonRecessionTimeMyr);
    if (t < 0) moonRecessionValue.textContent = `${Math.abs(t)} Myr ago`;
    else if (t > 0) moonRecessionValue.textContent = `+${t} Myr`;
    else moonRecessionValue.textContent = "Today";
  } else {
    moonOrbitValue.textContent = "—";
    moonRecessionValue.textContent = "—";
  }

  thetaDisplay.textContent = `${display.text}${display.unit}`;
  thetaDeg.textContent = `${formatNumber(thetaDegValue, 6)}°`;
  diameterKm.textContent = formatNumber(state.diameterKm, 6);
  distanceKm.textContent = formatNumber(state.distanceKm, 6);

  angleLabel.textContent = `Angular diameter: ${display.text}${display.unit}`;
  renderStage(thetaDegValue);

  (window as any).__cp = {
    slug: "angular-size",
    mode: runtime.mode,
    exportResults: () => exportResults(thetaDegValue)
  };
}

populatePresets();
updateMoonControlsVisibility();
render();

preset.addEventListener("change", () => {
  const next = preset.value as keyof typeof AngularSizeModel.presets;
  setFromPreset(next);
  updateMoonControlsVisibility();
  render();
});

distanceSlider.addEventListener("input", () => {
  state.distanceKm = logSliderToValue(Number(distanceSlider.value), DISTANCE_MIN_KM, DISTANCE_MAX_KM);
  if (state.presetId === "moon") {
    if (state.moonTimeMode === "orbit") {
      state.moonOrbitAngleDeg = orbitAngleFromMoonDistance(state.distanceKm);
      moonOrbitAngle.value = String(Math.round(state.moonOrbitAngleDeg));
    } else {
      state.moonRecessionTimeMyr = moonTimeMyrFromDistance(state.distanceKm);
      moonRecessionTime.value = String(Math.round(state.moonRecessionTimeMyr / 10) * 10);
      state.moonRecessionTimeMyr = Number(moonRecessionTime.value);
    }
  }
  render();
});

diameterSlider.addEventListener("input", () => {
  state.diameterKm = logSliderToValue(Number(diameterSlider.value), DIAMETER_MIN_KM, DIAMETER_MAX_KM);
  render();
});

moonModeOrbit.addEventListener("change", () => {
  if (moonModeOrbit.checked) setMoonTimeMode("orbit");
  render();
});

moonModeRecession.addEventListener("change", () => {
  if (moonModeRecession.checked) setMoonTimeMode("recession");
  render();
});

moonOrbitAngle.addEventListener("input", () => {
  if (state.presetId !== "moon") return;
  state.moonOrbitAngleDeg = clamp(Number(moonOrbitAngle.value), 0, 360);
  state.distanceKm = getMoonDistanceAtOrbitAngle(state.moonOrbitAngleDeg);
  render();
});

moonRecessionTime.addEventListener("input", () => {
  if (state.presetId !== "moon") return;
  state.moonRecessionTimeMyr = clamp(Number(moonRecessionTime.value), -1000, 1000);
  state.distanceKm = AngularSizeModel.moonDistanceKmFromRecession({
    distanceTodayKm: MOON_DISTANCE_TODAY_KM,
    recessionCmPerYr: MOON_RECESSION_CM_PER_YEAR,
    timeMyr: state.moonRecessionTimeMyr
  });
  render();
});

copyResults.addEventListener("click", () => {
  status.textContent = "Copying…";

  const thetaDegValue = AngularSizeModel.angularDiameterDeg({
    diameterKm: state.diameterKm,
    distanceKm: state.distanceKm
  });

  void runtime
    .copyResults(exportResults(thetaDegValue))
    .then(() => {
      status.textContent = "Copied results to clipboard.";
    })
    .catch((err) => {
      status.textContent =
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.";
    });
});
