import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { Challenge } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AngularSizeModel, AstroConstants, AstroUnits } from "@cosmic/physics";

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
const angleArcEl = document.querySelector<SVGPathElement>("#angleArc");
const sizeLineEl = document.querySelector<SVGLineElement>("#sizeLine");
const sizeStageLabelEl =
  document.querySelector<SVGTextElement>("#sizeStageLabel");
const distanceStageLabelEl =
  document.querySelector<SVGTextElement>("#distanceStageLabel");
const objectLabelEl = document.querySelector<SVGTextElement>("#objectLabel");
const angleLabelEl = document.querySelector<SVGTextElement>("#angleLabel");

const thetaDisplayEl = document.querySelector<HTMLSpanElement>("#thetaDisplay");
const thetaDisplayUnitEl = document.querySelector<HTMLSpanElement>("#thetaDisplayUnit");
const thetaDegEl = document.querySelector<HTMLSpanElement>("#thetaDeg");
const diameterKmEl = document.querySelector<HTMLSpanElement>("#diameterKm");
const distanceKmEl = document.querySelector<HTMLSpanElement>("#distanceKm");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const challengeModeEl =
  document.querySelector<HTMLButtonElement>("#challengeMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");

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
  !angleArcEl ||
  !sizeLineEl ||
  !sizeStageLabelEl ||
  !distanceStageLabelEl ||
  !objectLabelEl ||
  !angleLabelEl ||
  !thetaDisplayEl ||
  !thetaDisplayUnitEl ||
  !thetaDegEl ||
  !diameterKmEl ||
  !distanceKmEl ||
  !stationModeEl ||
  !challengeModeEl ||
  !helpEl ||
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
const angleArc = angleArcEl;
const sizeLine = sizeLineEl;
const sizeStageLabel = sizeStageLabelEl;
const distanceStageLabel = distanceStageLabelEl;
const objectLabel = objectLabelEl;
const angleLabel = angleLabelEl;

const thetaDisplay = thetaDisplayEl;
const thetaDisplayUnit = thetaDisplayUnitEl;
const thetaDeg = thetaDegEl;
const diameterKm = diameterKmEl;
const distanceKm = distanceKmEl;

const stationMode = stationModeEl;
const challengeMode = challengeModeEl;
const help = helpEl;

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

// Moon orbit distances (cached from physics model)
const moonOrbit = AngularSizeModel.moonOrbitPeigeeApogeeKm();

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
  if (abs >= 1) return { text: thetaDegValue.toFixed(2), unit: "deg" };
  if (abs >= 1 / 60) return { text: AstroUnits.degToArcmin(thetaDegValue).toFixed(1), unit: "arcmin" };
  return { text: AstroUnits.degToArcsec(thetaDegValue).toFixed(0), unit: "arcsec" };
}

function describeMoonOrbitAngle(angleDeg: number): string {
  const normalized = ((angleDeg % 360) + 360) % 360;
  if (Math.abs(normalized - 0) <= 1 || Math.abs(normalized - 360) <= 1) return "Perigee";
  if (Math.abs(normalized - 180) <= 1) return "Apogee";
  return `${Math.round(normalized)} deg`;
}

function describeMoonRecessionTime(timeMyr: number): string {
  const t = Math.round(timeMyr);
  if (t === 0) return "Today";
  if (t < 0) return `${Math.abs(t)} Myr ago`;
  return `+${t} Myr`;
}

function setMoonTimeMode(next: MoonTimeMode) {
  state.moonTimeMode = next;
  moonModeOrbit.checked = next === "orbit";
  moonModeRecession.checked = next === "recession";

  if (next === "orbit") {
    moonOrbitRow.hidden = false;
    moonRecessionRow.hidden = true;
    state.moonOrbitAngleDeg = AngularSizeModel.orbitAngleDegFromMoonDistance(state.distanceKm);
    moonOrbitAngle.value = String(Math.round(state.moonOrbitAngleDeg));
  } else {
    moonOrbitRow.hidden = true;
    moonRecessionRow.hidden = false;
    state.moonRecessionTimeMyr = AngularSizeModel.moonTimeMyrFromDistanceKm(state.distanceKm);
    moonRecessionTime.value = String(Math.round(state.moonRecessionTimeMyr / 10) * 10);
    state.moonRecessionTimeMyr = Number(moonRecessionTime.value);
  }
}

function applyMoonControlsToDistance() {
  if (state.presetId !== "moon") return;

  if (state.moonTimeMode === "orbit") {
    const angleDeg = clamp(Number(moonOrbitAngle.value), 0, 360);
    state.moonOrbitAngleDeg = angleDeg;
    state.distanceKm = AngularSizeModel.moonDistanceAtOrbitAngleDeg(angleDeg);
    return;
  }

  const timeMyr = clamp(Number(moonRecessionTime.value), -1000, 1000);
  state.moonRecessionTimeMyr = timeMyr;
  state.distanceKm = AngularSizeModel.moonDistanceKmFromRecession({
    distanceTodayKm: AstroConstants.MOON.DISTANCE_TODAY_KM,
    recessionCmPerYr: AstroConstants.MOON.MEAN_RECESSION_CM_PER_YEAR,
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
    state.distanceKm = AngularSizeModel.moonDistanceAtOrbitAngleDeg(0);
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

  // Angle arc near the observer (purely visual).
  if (Number.isFinite(thetaDegValue) && thetaDegValue > 0 && radius > 0) {
    const arcR = 56;
    const topDx = objectX - observerX;
    const topDy = yTop - centerY;
    const botDx = objectX - observerX;
    const botDy = yBottom - centerY;
    const topLen = Math.hypot(topDx, topDy);
    const botLen = Math.hypot(botDx, botDy);

    if (topLen > 0 && botLen > 0) {
      const ax1 = observerX + (arcR * topDx) / topLen;
      const ay1 = centerY + (arcR * topDy) / topLen;
      const ax2 = observerX + (arcR * botDx) / botLen;
      const ay2 = centerY + (arcR * botDy) / botLen;
      angleArc.setAttribute(
        "d",
        `M ${formatNumber(ax1, 3)} ${formatNumber(ay1, 3)} A ${arcR} ${arcR} 0 0 1 ${formatNumber(ax2, 3)} ${formatNumber(ay2, 3)}`
      );
    } else {
      angleArc.setAttribute("d", "");
    }
  } else {
    angleArc.setAttribute("d", "");
  }

  objectCircle.setAttribute("cx", String(objectX));
  objectCircle.setAttribute("cy", String(centerY));
  objectCircle.setAttribute("r", String(Math.max(6, radius)));

  sizeLine.setAttribute("x1", String(objectX));
  sizeLine.setAttribute("x2", String(objectX));
  sizeLine.setAttribute("y1", String(yTop));
  sizeLine.setAttribute("y2", String(yBottom));

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
  notes.push("Units: D (diameter) and d (distance) in km; theta in degrees (display may switch deg / arcmin / arcsec).");

  const parameters: ExportPayloadV1["parameters"] = [
    { name: "Preset", value: presetMeta.name },
    { name: "Diameter D (km)", value: formatNumber(state.diameterKm, 4) },
    { name: "Distance d (km)", value: formatNumber(state.distanceKm, 4) }
  ];

  if (state.presetId === "moon") {
    const moonModeLabel =
      state.moonTimeMode === "orbit" ? "Orbit (perigee ↔ apogee)" : "Recession (Myr from today)";
    const moonSettingLabel =
      state.moonTimeMode === "orbit"
        ? describeMoonOrbitAngle(state.moonOrbitAngleDeg)
        : describeMoonRecessionTime(state.moonRecessionTimeMyr);

    parameters.push({ name: "Moon time mode", value: moonModeLabel });
    parameters.push({ name: "Moon setting", value: moonSettingLabel });

    if (state.moonTimeMode === "recession") {
      notes.push(
        `Toy model: linear distance change using a constant recession rate of ${AstroConstants.MOON.MEAN_RECESSION_CM_PER_YEAR} cm/yr.`
      );
    }
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters,
    readouts: [
      { name: "Angular diameter theta (display)", value: `${display.text} ${display.unit}`.trim() },
      { name: "Angular diameter theta (deg)", value: formatNumber(thetaDegValue, 6) }
    ],
    notes
  };
}

function buildStationRow(args: {
  label: string;
  diameterKm: number;
  distanceKm: number;
  moonMode?: string;
  moonSetting?: string;
}) {
  const thetaDegValue = AngularSizeModel.angularDiameterDeg({
    diameterKm: args.diameterKm,
    distanceKm: args.distanceKm
  });
  const display = formatAngleDisplay(thetaDegValue);

  return {
    case: args.label,
    diameterKm: formatNumber(args.diameterKm, 6),
    distanceKm: formatNumber(args.distanceKm, 6),
    thetaDisplay: `${display.text} ${display.unit}`.trim(),
    thetaDeg: formatNumber(thetaDegValue, 6),
    moonMode: args.moonMode ?? "",
    moonSetting: args.moonSetting ?? ""
  };
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
          "For eclipses: total vs annular depends on whether the Moon’s angular size is larger or smaller than the Sun’s."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Angular Size",
    subtitle: "Record size, distance, and angular size (in multiple units)",
    steps: [
      "Add rows for Sun and Moon (today). Compare their angular sizes.",
      "Switch to Moon orbit mode and add perigee/apogee rows.",
      "Optional: try recession time (+500 Myr, +1000 Myr) and see when total eclipses become impossible."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "diameterKm", label: "Diameter $D$ (km)" },
      { key: "distanceKm", label: "Distance $d$ (km)" },
      { key: "thetaDisplay", label: "$\\theta$ (display)" },
      { key: "thetaDeg", label: "$\\theta$ (deg)" },
      { key: "moonMode", label: "Moon mode" },
      { key: "moonSetting", label: "Moon setting" }
    ],
    snapshotLabel: "Add row (snapshot)",
    getSnapshotRow: () => {
      const p = AngularSizeModel.presets[state.presetId];
      const label = p?.name ?? "Custom";

      let moonModeValue = "";
      let moonSettingValue = "";
      if (state.presetId === "moon") {
        moonModeValue = state.moonTimeMode === "recession" ? "Recession time" : "Orbit angle";
        moonSettingValue =
          state.moonTimeMode === "recession"
            ? describeMoonRecessionTime(state.moonRecessionTimeMyr)
            : describeMoonOrbitAngle(state.moonOrbitAngleDeg);
      }

      return buildStationRow({
        label,
        diameterKm: state.diameterKm,
        distanceKm: state.distanceKm,
        moonMode: moonModeValue,
        moonSetting: moonSettingValue
      });
    },
    rowSets: [
      {
        label: "Add Sun + Moon (today)",
        getRows: () => [
          buildStationRow({
            label: "Sun (1 AU)",
            diameterKm: AngularSizeModel.presets.sun.diameter,
            distanceKm: AngularSizeModel.presets.sun.distance
          }),
          buildStationRow({
            label: "Moon (today)",
            diameterKm: AngularSizeModel.presets.moon.diameter,
            distanceKm: AngularSizeModel.presets.moon.distance,
            moonMode: "Orbit",
            moonSetting: "Today"
          })
        ]
      },
      {
        label: "Add Moon perigee/apogee",
        getRows: () => [
          buildStationRow({
            label: "Moon (perigee)",
            diameterKm: AngularSizeModel.presets.moon.diameter,
            distanceKm: moonOrbit.perigeeKm,
            moonMode: "Orbit",
            moonSetting: "Perigee"
          }),
          buildStationRow({
            label: "Moon (apogee)",
            diameterKm: AngularSizeModel.presets.moon.diameter,
            distanceKm: moonOrbit.apogeeKm,
            moonMode: "Orbit",
            moonSetting: "Apogee"
          })
        ]
      },
      {
        label: "Add Moon future (+500/+1000 Myr)",
        getRows: () => {
          const distanceAtMyr = (t: number) =>
            AngularSizeModel.moonDistanceKmFromRecession({
              distanceTodayKm: AstroConstants.MOON.DISTANCE_TODAY_KM,
              recessionCmPerYr: AstroConstants.MOON.MEAN_RECESSION_CM_PER_YEAR,
              timeMyr: t
            });

          return [
            buildStationRow({
              label: "Moon (+500 Myr)",
              diameterKm: AngularSizeModel.presets.moon.diameter,
              distanceKm: distanceAtMyr(500),
              moonMode: "Recession time",
              moonSetting: "+500 Myr"
            }),
            buildStationRow({
              label: "Moon (+1000 Myr)",
              diameterKm: AngularSizeModel.presets.moon.diameter,
              distanceKm: distanceAtMyr(1000),
              moonMode: "Recession time",
              moonSetting: "+1000 Myr"
            })
          ];
        }
      }
    ],
    synthesisPrompt: `
      <p><strong>Explain:</strong> Angular size depends on <em>both</em> size and distance.</p>
      <p><strong>Use your table:</strong> Compare the Sun and Moon today, then explain why perigee vs apogee changes whether a solar eclipse can be total or annular.</p>
    `
  }
});

demoModes.bindButtons({
  helpButton: help,
  stationButton: stationMode
});

type AngularSizeDemoState = {
  presetKey: keyof typeof AngularSizeModel.presets | "Custom";
  diameterKm: number;
  distanceKm: number;
  moonTimeMode?: MoonTimeMode;
  moonOrbitAngleDeg?: number;
  moonRecessionTimeMyr?: number;
  thetaDeg: number;
};

function getState(): AngularSizeDemoState {
  const thetaDegValue = AngularSizeModel.angularDiameterDeg({
    diameterKm: state.diameterKm,
    distanceKm: state.distanceKm
  });

  const out: AngularSizeDemoState = {
    presetKey: state.presetId,
    diameterKm: state.diameterKm,
    distanceKm: state.distanceKm,
    thetaDeg: thetaDegValue
  };

  if (state.presetId === "moon") {
    out.moonTimeMode = state.moonTimeMode;
    out.moonOrbitAngleDeg = state.moonOrbitAngleDeg;
    out.moonRecessionTimeMyr = state.moonRecessionTimeMyr;
  }

  return out;
}

function setState(next: unknown): void {
  if (!next || typeof next !== "object") return;
  const obj = next as Partial<AngularSizeDemoState>;

  const presetKey = obj.presetKey;
  if (
    presetKey &&
    presetKey !== "Custom" &&
    Object.prototype.hasOwnProperty.call(AngularSizeModel.presets, presetKey)
  ) {
    setFromPreset(presetKey as keyof typeof AngularSizeModel.presets);
  }

  if (Number.isFinite(obj.diameterKm) && (obj.diameterKm as number) > 0) {
    state.diameterKm = obj.diameterKm as number;
  }

  if (Number.isFinite(obj.distanceKm) && (obj.distanceKm as number) > 0) {
    state.distanceKm = obj.distanceKm as number;
  }

  if (state.presetId === "moon") {
    if (obj.moonTimeMode === "orbit" || obj.moonTimeMode === "recession") {
      state.moonTimeMode = obj.moonTimeMode;
      setMoonTimeMode(obj.moonTimeMode);
    }

    if (state.moonTimeMode === "orbit" && Number.isFinite(obj.moonOrbitAngleDeg)) {
      state.moonOrbitAngleDeg = clamp(obj.moonOrbitAngleDeg as number, 0, 360);
      moonOrbitAngle.value = String(Math.round(state.moonOrbitAngleDeg));
      state.distanceKm = AngularSizeModel.moonDistanceAtOrbitAngleDeg(state.moonOrbitAngleDeg);
    }

    if (state.moonTimeMode === "recession" && Number.isFinite(obj.moonRecessionTimeMyr)) {
      state.moonRecessionTimeMyr = clamp(obj.moonRecessionTimeMyr as number, -1000, 1000);
      moonRecessionTime.value = String(Math.round(state.moonRecessionTimeMyr / 10) * 10);
      state.moonRecessionTimeMyr = Number(moonRecessionTime.value);
      state.distanceKm = AngularSizeModel.moonDistanceKmFromRecession({
        distanceTodayKm: AstroConstants.MOON.DISTANCE_TODAY_KM,
        recessionCmPerYr: AstroConstants.MOON.MEAN_RECESSION_CM_PER_YEAR,
        timeMyr: state.moonRecessionTimeMyr
      });
    }
  }

  updateMoonControlsVisibility();
  render();
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
    moonOrbitValue.textContent = `${Math.round(state.moonOrbitAngleDeg)} deg`;
    moonRecessionValue.textContent = describeMoonRecessionTime(state.moonRecessionTimeMyr);
  } else {
    moonOrbitValue.textContent = "—";
    moonRecessionValue.textContent = "—";
  }

  thetaDisplay.textContent = display.text;
  thetaDisplayUnit.textContent = display.unit;
  thetaDeg.textContent = formatNumber(thetaDegValue, 6);
  diameterKm.textContent = formatNumber(state.diameterKm, 6);
  distanceKm.textContent = formatNumber(state.distanceKm, 6);

  angleLabel.textContent = `Angular diameter: ${`${display.text} ${display.unit}`.trim()}`;
  sizeStageLabel.textContent = `D ~ ${formatNumber(state.diameterKm, 3)} km`;
  distanceStageLabel.textContent = `d ~ ${formatNumber(state.distanceKm, 3)} km`;

  const presetMeta = AngularSizeModel.presets[state.presetId];
  objectLabel.textContent = presetMeta.name;

  const gradientId =
    presetMeta.color === "sun"
      ? "sunGlow"
      : presetMeta.color === "moon"
        ? "moonGlow"
        : presetMeta.color === "planet"
          ? "planetGlow"
          : presetMeta.color === "mars"
            ? "marsGlow"
            : presetMeta.color === "galaxy"
              ? "galaxyGlow"
              : "objectGlow";
  objectCircle.setAttribute("fill", `url(#${gradientId})`);

  renderStage(thetaDegValue);

  (window as any).__cp = {
    slug: "angular-size",
    mode: runtime.mode,
    exportResults: () => exportResults(thetaDegValue)
  };
}

function getControlsBody(): HTMLElement {
  const el = document.querySelector<HTMLElement>(".cp-demo__controls .cp-panel-body");
  if (!el) throw new Error("Missing controls container for challenge mode.");
  return el;
}

const baselineBasketball = (() => {
  const diameterKm0 = AngularSizeModel.presets.basketball.diameter;
  const distanceKm0 = 0.02; // 20 m in km
  const theta0 = AngularSizeModel.angularDiameterDeg({ diameterKm: diameterKm0, distanceKm: distanceKm0 });
  return { diameterKm0, distanceKm0, theta0 };
})();

const challenges: Challenge[] = [
  {
    type: "custom" as const,
    prompt: "Set the Sun to about $0.53^\\circ$.",
    initialState: {
      presetKey: "sun",
      diameterKm: AngularSizeModel.presets.sun.diameter,
      distanceKm: 2 * AngularSizeModel.presets.sun.distance
    },
    hints: ["Try changing the distance back toward 1 AU (Sun preset)."],
    check: (s: unknown) => {
      const st = s as Partial<AngularSizeDemoState>;
      if (st.presetKey !== "sun") {
        return { correct: false, close: false, message: "Use the Sun preset for this challenge." };
      }
      const theta = Number(st.thetaDeg);
      const target = 0.53313;
      const tol = 0.02;
      const err = Math.abs(theta - target);
      if (!Number.isFinite(theta)) return { correct: false, close: false, message: "Angle is not finite." };
      if (err <= tol) {
        return {
          correct: true,
          close: true,
          message: `Nice: $\\theta \\approx ${theta.toFixed(3)}^\\circ$`
        };
      }
      return {
        correct: false,
        close: err <= 2 * tol,
        message: `Not yet: $\\theta = ${theta.toFixed(3)}^\\circ$ (target $${target.toFixed(3)}^\\circ \\pm ${tol.toFixed(2)}^\\circ$)`
      };
    }
  },
  {
    type: "custom" as const,
    prompt: "Find a distance where the Moon looks about $0.50^\\circ$.",
    initialState: {
      presetKey: "moon",
      moonTimeMode: "orbit",
      moonOrbitAngleDeg: 0
    },
    hints: ["Start at perigee ($0^\\\\circ$) then move toward apogee ($180^\\\\circ$) to make the Moon look smaller."],
    check: (s: unknown) => {
      const st = s as Partial<AngularSizeDemoState>;
      if (st.presetKey !== "moon") {
        return { correct: false, close: false, message: "Use the Moon preset for this challenge." };
      }
      const theta = Number(st.thetaDeg);
      const target = 0.5;
      const tol = 0.02;
      const err = Math.abs(theta - target);
      if (!Number.isFinite(theta)) return { correct: false, close: false, message: "Angle is not finite." };
      if (err <= tol) {
        return {
          correct: true,
          close: true,
          message: `Nice: $\\theta \\approx ${theta.toFixed(3)}^\\circ$`
        };
      }
      return {
        correct: false,
        close: err <= 2 * tol,
        message: `Not yet: $\\theta = ${theta.toFixed(3)}^\\circ$ (target $${target.toFixed(2)}^\\circ \\pm ${tol.toFixed(2)}^\\circ$)`
      };
    }
  },
  {
    type: "custom" as const,
    prompt: "Double distance halves $\\theta$ (small-angle sanity).",
    initialState: {
      presetKey: "basketball",
      diameterKm: baselineBasketball.diameterKm0,
      distanceKm: baselineBasketball.distanceKm0
    },
    hints: ["Keep the diameter fixed; increase the distance to about 0.04 km (40 m)."],
    check: (s: unknown) => {
      const st = s as Partial<AngularSizeDemoState>;
      if (st.presetKey !== "basketball") {
        return { correct: false, close: false, message: "Use the Basketball preset for this sanity check." };
      }

      const d = Number(st.distanceKm);
      const D = Number(st.diameterKm);
      const theta = Number(st.thetaDeg);
      if (![d, D, theta].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      const expectedDistance = 2 * baselineBasketball.distanceKm0;
      const distanceOk = Math.abs(d - expectedDistance) / expectedDistance <= 0.05;
      const diameterOk = Math.abs(D - baselineBasketball.diameterKm0) / baselineBasketball.diameterKm0 <= 0.01;
      const ratio = theta / baselineBasketball.theta0;
      const ratioOk = Math.abs(ratio - 0.5) <= 0.05;

      if (distanceOk && diameterOk && ratioOk) {
        return {
          correct: true,
          close: true,
          message: `Nice: $\\theta$ ratio $\\approx ${ratio.toFixed(2)}$ (expected $0.50$)`
        };
      }

      const close = distanceOk || ratioOk;
      const parts: string[] = [];
      if (!distanceOk) parts.push("distance");
      if (!diameterOk) parts.push("diameter");
      if (!ratioOk) parts.push("$\\\\theta$ ratio");
      return {
        correct: false,
        close,
        message: `Not yet: adjust ${parts.join(", ")} ($\\\\theta$ ratio $\\\\approx ${ratio.toFixed(2)}$)`
      };
    }
  }
];

const challengeEngine = new ChallengeEngine(challenges, {
  container: getControlsBody(),
  showUI: true,
  getState,
  setState
});

challengeMode.disabled = false;
challengeMode.addEventListener("click", () => {
  if (challengeEngine.isActive()) {
    challengeEngine.stop();
  } else {
    challengeEngine.start();
  }
});

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
      state.moonOrbitAngleDeg = AngularSizeModel.orbitAngleDegFromMoonDistance(state.distanceKm);
      moonOrbitAngle.value = String(Math.round(state.moonOrbitAngleDeg));
    } else {
      state.moonRecessionTimeMyr = AngularSizeModel.moonTimeMyrFromDistanceKm(state.distanceKm);
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
  state.distanceKm = AngularSizeModel.moonDistanceAtOrbitAngleDeg(state.moonOrbitAngleDeg);
  render();
});

moonRecessionTime.addEventListener("input", () => {
  if (state.presetId !== "moon") return;
  state.moonRecessionTimeMyr = clamp(Number(moonRecessionTime.value), -1000, 1000);
  state.distanceKm = AngularSizeModel.moonDistanceKmFromRecession({
    distanceTodayKm: AstroConstants.MOON.DISTANCE_TODAY_KM,
    recessionCmPerYr: AstroConstants.MOON.MEAN_RECESSION_CM_PER_YEAR,
    timeMyr: state.moonRecessionTimeMyr
  });
  render();
});

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");

  const thetaDegValue = AngularSizeModel.angularDiameterDeg({
    diameterKm: state.diameterKm,
    distanceKm: state.distanceKm
  });

  void runtime
    .copyResults(exportResults(thetaDegValue))
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      );
    });
});

initMath(document);

const starfieldCanvas = document.querySelector<HTMLCanvasElement>('.cp-starfield');
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
