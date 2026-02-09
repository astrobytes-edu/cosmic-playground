import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, initTabs, setLiveRegionText } from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import { SeasonsModel } from "@cosmic/physics";
import { clamp, formatNumber, formatDateFromDayOfYear, formatDayLength, formatLatitude, seasonFromPhaseNorth, oppositeSeason, orbitPosition, terminatorShiftX, latitudeBandEllipse, globeAxisEndpoints, animationProgress, easeInOutCubic, shortestDayDelta, orbitSeasonLabelPositions, polarisIndicatorEndpoints, seasonColorClass, contextualMessage, dayLengthArcGeometry } from "./logic";
import type { Season } from "./logic";

const dayOfYearEl = document.querySelector<HTMLInputElement>("#dayOfYear");
const dayOfYearValueEl = document.querySelector<HTMLSpanElement>("#dayOfYearValue");
const dateValueEl = document.querySelector<HTMLSpanElement>("#dateValue");

const tiltEl = document.querySelector<HTMLInputElement>("#tilt");
const tiltValueEl = document.querySelector<HTMLSpanElement>("#tiltValue");
const latitudeEl = document.querySelector<HTMLInputElement>("#latitude");
const latitudeValueEl =
  document.querySelector<HTMLSpanElement>("#latitudeValue");

const anchorMarEqxEl = document.querySelector<HTMLButtonElement>("#anchorMarEqx");
const anchorJunSolEl = document.querySelector<HTMLButtonElement>("#anchorJunSol");
const anchorSepEqxEl = document.querySelector<HTMLButtonElement>("#anchorSepEqx");
const anchorDecSolEl = document.querySelector<HTMLButtonElement>("#anchorDecSol");

const animateYearEl = document.querySelector<HTMLButtonElement>("#animateYear");
const motionNoteEl = document.querySelector<HTMLDivElement>("#motionNote");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const challengeModeEl =
  document.querySelector<HTMLButtonElement>("#challengeMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const declinationValueEl =
  document.querySelector<HTMLSpanElement>("#declinationValue");
const dayLengthValueEl = document.querySelector<HTMLSpanElement>("#dayLengthValue");
const noonAltitudeValueEl =
  document.querySelector<HTMLSpanElement>("#noonAltitudeValue");
const distanceAuValueEl =
  document.querySelector<HTMLSpanElement>("#distanceAuValue");
const seasonNorthValueEl =
  document.querySelector<HTMLSpanElement>("#seasonNorthValue");
const seasonSouthValueEl =
  document.querySelector<HTMLSpanElement>("#seasonSouthValue");

const earthOrbitDotEl = document.querySelector<SVGCircleElement>("#earthOrbitDot");
const orbitLabelEl = document.querySelector<SVGTextElement>("#orbitLabel");

// Globe elements
const terminatorEl = document.querySelector<SVGEllipseElement>("#terminator");
const equatorBandEl = document.querySelector<SVGEllipseElement>("#equator-band");
const tropicNEl = document.querySelector<SVGEllipseElement>("#tropic-n");
const tropicSEl = document.querySelector<SVGEllipseElement>("#tropic-s");
const arcticNEl = document.querySelector<SVGEllipseElement>("#arctic-n");
const arcticSEl = document.querySelector<SVGEllipseElement>("#arctic-s");
const globeAxisEl = document.querySelector<SVGLineElement>("#globe-axis");
const globeMarkerEl = document.querySelector<SVGCircleElement>("#globe-marker");
const latBandsGroupEl = document.querySelector<SVGGElement>("#latitude-bands-group");
const globeEclipticEl = document.querySelector<SVGLineElement>("#globe-ecliptic");
const globeEquatorEl = document.querySelector<SVGEllipseElement>("#globe-equator");

// New elements: distance line, Polaris, day-length arc, sunlight rays, hour grid, context message
const distanceLineEl = document.querySelector<SVGLineElement>("#distanceLine");
const polarisAxisEl = document.querySelector<SVGLineElement>("#polarisAxis");
const polarisLabelEl = document.querySelector<SVGTextElement>("#polarisLabel");
const dayArcEl = document.querySelector<SVGPathElement>("#dayArc");
const nightArcEl = document.querySelector<SVGPathElement>("#nightArc");
const sunlightRaysEl = document.querySelector<SVGGElement>("#sunlightRays");
const hourGridEl = document.querySelector<SVGGElement>("#hourGrid");
const contextMessageEl = document.querySelector<HTMLParagraphElement>("#contextMessage");

if (
  !dayOfYearEl ||
  !dayOfYearValueEl ||
  !dateValueEl ||
  !tiltEl ||
  !tiltValueEl ||
  !latitudeEl ||
  !latitudeValueEl ||
  !anchorMarEqxEl ||
  !anchorJunSolEl ||
  !anchorSepEqxEl ||
  !anchorDecSolEl ||
  !animateYearEl ||
  !motionNoteEl ||
  !stationModeEl ||
  !challengeModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !declinationValueEl ||
  !dayLengthValueEl ||
  !noonAltitudeValueEl ||
  !distanceAuValueEl ||
  !seasonNorthValueEl ||
  !seasonSouthValueEl ||
  !earthOrbitDotEl ||
  !orbitLabelEl ||
  !terminatorEl ||
  !equatorBandEl ||
  !tropicNEl ||
  !tropicSEl ||
  !arcticNEl ||
  !arcticSEl ||
  !globeAxisEl ||
  !globeMarkerEl ||
  !latBandsGroupEl ||
  !globeEclipticEl ||
  !globeEquatorEl ||
  !distanceLineEl ||
  !polarisAxisEl ||
  !polarisLabelEl ||
  !dayArcEl ||
  !nightArcEl ||
  !sunlightRaysEl ||
  !hourGridEl ||
  !contextMessageEl
) {
  throw new Error("Missing required DOM elements for seasons demo.");
}

const dayOfYear = dayOfYearEl;
const dayOfYearValue = dayOfYearValueEl;
const dateValue = dateValueEl;

const tilt = tiltEl;
const tiltValue = tiltValueEl;
const latitude = latitudeEl;
const latitudeValue = latitudeValueEl;

const anchorMarEqx = anchorMarEqxEl;
const anchorJunSol = anchorJunSolEl;
const anchorSepEqx = anchorSepEqxEl;
const anchorDecSol = anchorDecSolEl;

const animateYear = animateYearEl;
const motionNote = motionNoteEl;

const stationMode = stationModeEl;
const challengeMode = challengeModeEl;
const help = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

const declinationValue = declinationValueEl;
const dayLengthValue = dayLengthValueEl;
const noonAltitudeValue = noonAltitudeValueEl;
const distanceAuValue = distanceAuValueEl;
const seasonNorthValue = seasonNorthValueEl;
const seasonSouthValue = seasonSouthValueEl;

const earthOrbitDot = earthOrbitDotEl;
const orbitLabel = orbitLabelEl;

const terminator = terminatorEl;
const equatorBand = equatorBandEl;
const tropicN = tropicNEl;
const tropicS = tropicSEl;
const arcticN = arcticNEl;
const arcticS = arcticSEl;
const globeAxis = globeAxisEl;
const globeMarker = globeMarkerEl;
const latBandsGroup = latBandsGroupEl;
const globeEcliptic = globeEclipticEl;
const globeEquator = globeEquatorEl;
const distanceLine = distanceLineEl;
const polarisAxis = polarisAxisEl;
const polarisLabel = polarisLabelEl;
const dayArc = dayArcEl;
const nightArc = nightArcEl;
const hourGrid = hourGridEl;
const contextMessage = contextMessageEl;

stationMode.disabled = false;
challengeMode.disabled = true;
help.disabled = true;
copyResults.disabled = false;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:seasons:mode",
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
          { key: "\u2190 / \u2192", action: "Step \u00B11 day" },
          { key: "\u2191 / \u2193", action: "Step \u00B130 days" },
          { key: "Space", action: "Play / pause animation" },
          { key: "E", action: "Jump to March equinox" },
          { key: "S", action: "Jump to June solstice" },
          { key: "?", action: "Toggle help" },
          { key: "g", action: "Toggle station mode" }
        ]
      },
      {
        heading: "Tip",
        type: "bullets",
        items: [
          "Try equinox vs solstice anchor dates and compare North/South seasons.",
          "Set $\\varepsilon$ to $0^\\circ$ to see that $\\delta$ stays near $0^\\circ$ all year in this toy model."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Seasons",
    subtitle: "Record date, declination, day length, and seasons by hemisphere",
    columns: [
      { key: "date", label: "Date" },
      { key: "day", label: "Day" },
      { key: "latitude", label: "Latitude $\\phi$ ($^\\circ$)" },
      { key: "tilt", label: "Tilt $\\varepsilon$ ($^\\circ$)" },
      { key: "declination", label: "$\\delta$ ($^\\circ$)" },
      { key: "dayLength", label: "Day length (h)" },
      { key: "noonAltitude", label: "Noon altitude (deg)" },
      { key: "seasonN", label: "Season (N)" },
      { key: "seasonS", label: "Season (S)" },
      { key: "distanceAu", label: "Distance $r$ (AU)" }
    ],
    getSnapshotRow: () => {
      const day = clamp(Math.round(state.dayOfYear), 1, 365);
      const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 90);
      const latitudeDeg = clamp(Number(state.latitudeDeg), -90, 90);

      const declinationDegValue = SeasonsModel.sunDeclinationDeg({
        dayOfYear: day,
        axialTiltDeg
      });
      const dayLengthHoursValue = SeasonsModel.dayLengthHours({
        latitudeDeg,
        sunDeclinationDeg: declinationDegValue
      });
      const noonAltitudeDegValue = SeasonsModel.sunNoonAltitudeDeg({
        latitudeDeg,
        sunDeclinationDeg: declinationDegValue
      });
      const distanceAu = SeasonsModel.earthSunDistanceAu({ dayOfYear: day });
      const north = seasonFromPhaseNorth(day);
      const south = oppositeSeason(north);

      return {
        date: formatDateFromDayOfYear(day),
        day: String(day),
        latitude: String(Math.round(latitudeDeg)),
        tilt: formatNumber(axialTiltDeg, 1),
        declination: formatNumber(declinationDegValue, 1),
        dayLength: formatNumber(dayLengthHoursValue, 2),
        noonAltitude: formatNumber(noonAltitudeDegValue, 1),
        seasonN: north,
        seasonS: south,
        distanceAu: formatNumber(distanceAu, 3)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add anchor dates",
        getRows: () => {
          const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 90);
          const latitudeDeg = clamp(Number(state.latitudeDeg), -90, 90);
          const anchors = [
            { label: "Mar equinox", day: 80 },
            { label: "Jun solstice", day: 172 },
            { label: "Sep equinox", day: 266 },
            { label: "Dec solstice", day: 356 }
          ];

          return anchors.map((a) => {
            const declinationDegValue = SeasonsModel.sunDeclinationDeg({
              dayOfYear: a.day,
              axialTiltDeg
            });
            const dayLengthHoursValue = SeasonsModel.dayLengthHours({
              latitudeDeg,
              sunDeclinationDeg: declinationDegValue
            });
            const noonAltitudeDegValue = SeasonsModel.sunNoonAltitudeDeg({
              latitudeDeg,
              sunDeclinationDeg: declinationDegValue
            });
            const distanceAu = SeasonsModel.earthSunDistanceAu({ dayOfYear: a.day });
            const north = seasonFromPhaseNorth(a.day);
            const south = oppositeSeason(north);

            return {
              date: `${formatDateFromDayOfYear(a.day)} (${a.label})`,
              day: String(a.day),
              latitude: String(Math.round(latitudeDeg)),
              tilt: formatNumber(axialTiltDeg, 1),
              declination: formatNumber(declinationDegValue, 1),
              dayLength: formatNumber(dayLengthHoursValue, 2),
              noonAltitude: formatNumber(noonAltitudeDegValue, 1),
              seasonN: north,
              seasonS: south,
              distanceAu: formatNumber(distanceAu, 3)
            };
          });
        }
      }
    ]
  }
});

demoModes.bindButtons({
  helpButton: help,
  stationButton: stationMode
});

help.disabled = false;

type State = {
  dayOfYear: number;
  axialTiltDeg: number;
  latitudeDeg: number;
};

const state: State = {
  dayOfYear: 80,
  axialTiltDeg: 23.5,
  latitudeDeg: 40
};

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  motionNote.hidden = false;
  motionNote.textContent = "Animation uses discrete steps due to reduced-motion preference.";
}

let isAnimating = false;
let rafId: number | null = null;
let reducedMotionIntervalId: ReturnType<typeof setInterval> | null = null;

// Fixed 10-second year animation (frame-rate independent)
const YEAR_ANIM_DURATION_MS = 10_000;
let animStartT = 0;
let animStartDay = 0;

// Preset transition: 500ms eased animation to target day
const PRESET_TRANSITION_MS = 500;
let presetRafId: number | null = null;

function cancelPresetTransition() {
  if (presetRafId !== null) {
    window.cancelAnimationFrame(presetRafId);
    presetRafId = null;
  }
}

function stopAnimation() {
  isAnimating = false;
  animateYear.textContent = "Animate year";
  if (rafId !== null) window.cancelAnimationFrame(rafId);
  rafId = null;
  if (reducedMotionIntervalId !== null) {
    clearInterval(reducedMotionIntervalId);
    reducedMotionIntervalId = null;
  }
  cancelPresetTransition();
  animStartT = 0;
}

function startAnimation() {
  isAnimating = true;
  animateYear.textContent = "Stop animation";
  setAnchorPressed(null);
  animStartDay = state.dayOfYear;

  if (prefersReducedMotion) {
    // Reduced-motion fallback: 24 discrete steps over 10 seconds
    let step = 0;
    const totalSteps = 24;
    const stepIntervalMs = YEAR_ANIM_DURATION_MS / totalSteps;
    reducedMotionIntervalId = setInterval(() => {
      step++;
      state.dayOfYear = ((animStartDay - 1 + (step / totalSteps) * 365.25) % 365.25) + 1;
      render();
      if (step >= totalSteps) {
        stopAnimation();
      }
    }, stepIntervalMs);
  } else {
    animStartT = 0;
    rafId = window.requestAnimationFrame(tick);
  }
}

function tick(t: number) {
  if (!isAnimating) return;
  if (animStartT === 0) { animStartT = t; }
  const elapsed = t - animStartT;
  const progress = animationProgress(elapsed, YEAR_ANIM_DURATION_MS);
  state.dayOfYear = ((animStartDay - 1 + progress * 365.25) % 365.25) + 1;
  render();
  if (progress < 1) {
    rafId = window.requestAnimationFrame(tick);
  } else {
    stopAnimation();
  }
}

// Globe geometry constants (the globe is centred at (0,0) inside its translated SVG group)
const GLOBE_R = 155;
const GLOBE_AXIS_LEN = 180;   // extends a bit beyond the globe radius
const GLOBE_CX = 0;           // centre within the <g> translate
const GLOBE_CY = 0;

/** Set ellipse attributes in one call. */
function setEllipse(el: SVGEllipseElement, cx: number, cy: number, rx: number, ry: number): void {
  el.setAttribute("cx", formatNumber(cx, 2));
  el.setAttribute("cy", formatNumber(cy, 2));
  el.setAttribute("rx", formatNumber(Math.abs(rx), 2));
  el.setAttribute("ry", formatNumber(Math.abs(ry), 2));
}

/**
 * Render the globe panel: terminator, latitude bands, axis, marker, day-length arc.
 */
function renderGlobe(args: {
  axialTiltDeg: number;
  latitudeDeg: number;
  declinationDeg: number;
  dayLengthHours: number;
}) {
  const tiltVal = args.axialTiltDeg;

  // --- Terminator ---
  const tShift = terminatorShiftX(args.declinationDeg, GLOBE_R);
  const termRx = GLOBE_R;
  const termRy = GLOBE_R;
  terminator.setAttribute("cx", formatNumber(-tShift - termRx, 2));
  terminator.setAttribute("cy", "0");
  terminator.setAttribute("rx", formatNumber(termRx, 2));
  terminator.setAttribute("ry", formatNumber(termRy, 2));

  // --- Latitude bands ---
  const tropicLat = tiltVal;
  const arcticLat = 90 - tiltVal;

  const eqBand = latitudeBandEllipse(0, tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_R);
  setEllipse(equatorBand, GLOBE_CX, eqBand.cy, eqBand.rx, eqBand.ry);

  const tnBand = latitudeBandEllipse(tropicLat, tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_R);
  setEllipse(tropicN, GLOBE_CX, tnBand.cy, tnBand.rx, tnBand.ry);

  const tsBand = latitudeBandEllipse(-tropicLat, tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_R);
  setEllipse(tropicS, GLOBE_CX, tsBand.cy, tsBand.rx, tsBand.ry);

  const anBand = latitudeBandEllipse(arcticLat, tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_R);
  setEllipse(arcticN, GLOBE_CX, anBand.cy, anBand.rx, anBand.ry);

  const asBand = latitudeBandEllipse(-arcticLat, tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_R);
  setEllipse(arcticS, GLOBE_CX, asBand.cy, asBand.rx, asBand.ry);

  // --- Celestial equator ---
  const ceq = latitudeBandEllipse(0, tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_R);
  setEllipse(globeEquator, GLOBE_CX, ceq.cy, ceq.rx, ceq.ry);

  // --- Globe axis ---
  const axis = globeAxisEndpoints(tiltVal, GLOBE_CX, GLOBE_CY, GLOBE_AXIS_LEN);
  globeAxis.setAttribute("x1", formatNumber(axis.x1, 2));
  globeAxis.setAttribute("y1", formatNumber(axis.y1, 2));
  globeAxis.setAttribute("x2", formatNumber(axis.x2, 2));
  globeAxis.setAttribute("y2", formatNumber(axis.y2, 2));

  // --- Latitude marker ---
  const latRad = (args.latitudeDeg * Math.PI) / 180;
  const markerX = GLOBE_R * Math.cos(latRad) * 0.98;
  const markerY = -GLOBE_R * Math.sin(latRad) * 0.98;
  globeMarker.setAttribute("cx", formatNumber(markerX, 2));
  globeMarker.setAttribute("cy", formatNumber(markerY, 2));

  // --- Day-length arc ---
  const arcGeom = dayLengthArcGeometry({
    latitudeDeg: args.latitudeDeg,
    dayLengthHours: args.dayLengthHours,
    globeRadius: GLOBE_R,
    tiltDeg: tiltVal,
  });
  dayArc.setAttribute("d", arcGeom.dayArcD);
  nightArc.setAttribute("d", arcGeom.nightArcD);
}

// --- Season labels (positioned once at init) ---
function initSeasonLabels() {
  const labels = orbitSeasonLabelPositions(140, 0, 0);
  for (const lbl of labels) {
    const el = document.querySelector<SVGTextElement>(`#seasonLabel-${lbl.label}`);
    if (el) {
      el.setAttribute("x", formatNumber(lbl.x, 1));
      el.setAttribute("y", formatNumber(lbl.y, 1));
      el.setAttribute("text-anchor", lbl.textAnchor);
      el.textContent = lbl.label;
    }
  }
}

// --- Hour grid (rendered once at init, visibility toggled) ---
function initHourGrid() {
  hourGrid.innerHTML = "";
  for (let i = -2; i <= 2; i++) {
    const x = i * 50;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", String(-GLOBE_R));
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(GLOBE_R));
    line.setAttribute("class", "stage__hourGridLine");
    hourGrid.appendChild(line);
  }
}

function renderStage(args: {
  dayOfYear: number;
  axialTiltDeg: number;
  latitudeDeg: number;
  declinationDeg: number;
  distanceAu: number;
  dayLengthHours: number;
}) {
  // Orbit panel (orbit is centered at (0,0) inside its translated SVG group)
  const orbitR = 140;

  const angle = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: args.dayOfYear });
  const { x, y } = orbitPosition(angle, args.distanceAu, orbitR, 2);
  earthOrbitDot.setAttribute("cx", formatNumber(x, 2));
  earthOrbitDot.setAttribute("cy", formatNumber(y, 2));
  orbitLabel.textContent = `r ~ ${formatNumber(args.distanceAu, 3)} AU`;

  // Distance line [S5] — from Sun (0,0) to Earth position
  distanceLine.setAttribute("x2", formatNumber(x, 2));
  distanceLine.setAttribute("y2", formatNumber(y, 2));

  // Polaris axis indicator [S2]
  const polaris = polarisIndicatorEndpoints(args.axialTiltDeg, x, y, 30);
  polarisAxis.setAttribute("x1", formatNumber(x, 2));
  polarisAxis.setAttribute("y1", formatNumber(y, 2));
  polarisAxis.setAttribute("x2", formatNumber(polaris.x2, 2));
  polarisAxis.setAttribute("y2", formatNumber(polaris.y2, 2));
  polarisLabel.setAttribute("x", formatNumber(polaris.x2 + 5, 2));
  polarisLabel.setAttribute("y", formatNumber(polaris.y2 - 5, 2));

  // Globe panel
  renderGlobe({
    axialTiltDeg: args.axialTiltDeg,
    latitudeDeg: args.latitudeDeg,
    declinationDeg: args.declinationDeg,
    dayLengthHours: args.dayLengthHours,
  });
}

function render() {
  const day = clamp(Math.round(state.dayOfYear), 1, 365);
  const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 90);
  const latitudeDeg = clamp(Number(state.latitudeDeg), -90, 90);

  state.dayOfYear = day;
  state.axialTiltDeg = axialTiltDeg;
  state.latitudeDeg = latitudeDeg;

  const declinationDegValue = SeasonsModel.sunDeclinationDeg({
    dayOfYear: day,
    axialTiltDeg
  });

  const dayLengthHoursValue = SeasonsModel.dayLengthHours({
    latitudeDeg,
    sunDeclinationDeg: declinationDegValue
  });

  const noonAltitudeDegValue = SeasonsModel.sunNoonAltitudeDeg({
    latitudeDeg,
    sunDeclinationDeg: declinationDegValue
  });

  const distanceAu = SeasonsModel.earthSunDistanceAu({ dayOfYear: day });

  const north = seasonFromPhaseNorth(day);
  const south = oppositeSeason(north);

  dayOfYear.value = String(day);
  tilt.value = String(axialTiltDeg);
  latitude.value = String(latitudeDeg);

  dayOfYearValue.textContent = `Day ${day}`;
  dateValue.textContent = `(${formatDateFromDayOfYear(day)})`;

  tiltValue.textContent = `${formatNumber(axialTiltDeg, 1)} deg`;
  latitudeValue.textContent = formatLatitude(Math.round(latitudeDeg));

  declinationValue.textContent = formatNumber(declinationDegValue, 1);
  dayLengthValue.textContent = formatDayLength(dayLengthHoursValue);
  noonAltitudeValue.textContent = formatNumber(noonAltitudeDegValue, 1);
  distanceAuValue.textContent = formatNumber(distanceAu, 3);
  seasonNorthValue.textContent = north;
  seasonSouthValue.textContent = south;

  // Season readout color coding [S1]
  seasonNorthValue.className = seasonColorClass(north);
  seasonSouthValue.className = seasonColorClass(south);

  // Contextual message [S7]
  const msg = contextualMessage({
    dayOfYear: day,
    seasonNorth: north,
    axialTiltDeg,
    distanceAu,
  });
  contextMessage.textContent = msg;

  renderStage({
    dayOfYear: day,
    axialTiltDeg,
    latitudeDeg,
    declinationDeg: declinationDegValue,
    distanceAu,
    dayLengthHours: dayLengthHoursValue,
  });

  (window as any).__cp = {
    slug: "seasons",
    mode: runtime.mode,
    exportResults: () => exportResults(getState())
  };
}

type SeasonsDemoState = {
  dayOfYear: number;
  axialTiltDeg: number;
  latitudeDeg: number;
  declinationDeg: number;
  dayLengthHours: number;
  noonAltitudeDeg: number;
};

function getState(): SeasonsDemoState {
  const day = clamp(Math.round(state.dayOfYear), 1, 365);
  const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 90);
  const latitudeDeg = clamp(Number(state.latitudeDeg), -90, 90);

  const declinationDegValue = SeasonsModel.sunDeclinationDeg({
    dayOfYear: day,
    axialTiltDeg
  });
  const dayLengthHoursValue = SeasonsModel.dayLengthHours({
    latitudeDeg,
    sunDeclinationDeg: declinationDegValue
  });
  const noonAltitudeDegValue = SeasonsModel.sunNoonAltitudeDeg({
    latitudeDeg,
    sunDeclinationDeg: declinationDegValue
  });

  return {
    dayOfYear: day,
    axialTiltDeg,
    latitudeDeg,
    declinationDeg: declinationDegValue,
    dayLengthHours: dayLengthHoursValue,
    noonAltitudeDeg: noonAltitudeDegValue
  };
}

function setState(next: unknown): void {
  if (!next || typeof next !== "object") return;
  const obj = next as Partial<SeasonsDemoState>;

  if (Number.isFinite(obj.dayOfYear)) state.dayOfYear = clamp(obj.dayOfYear as number, 1, 365);
  if (Number.isFinite(obj.axialTiltDeg)) state.axialTiltDeg = clamp(obj.axialTiltDeg as number, 0, 90);
  if (Number.isFinite(obj.latitudeDeg)) state.latitudeDeg = clamp(obj.latitudeDeg as number, -90, 90);

  stopAnimation();
  render();
}

function exportResults(st: SeasonsDemoState): ExportPayloadV1 {
  const day = clamp(Math.round(st.dayOfYear), 1, 365);
  const dateLabel = formatDateFromDayOfYear(day);
  const axialTiltDeg = clamp(Number(st.axialTiltDeg), 0, 90);
  const latitudeDeg = clamp(Number(st.latitudeDeg), -90, 90);

  const distanceAu = SeasonsModel.earthSunDistanceAu({ dayOfYear: day });
  const seasonN = seasonFromPhaseNorth(day);
  const seasonS = oppositeSeason(seasonN);

  const notes: string[] = [];
  notes.push(
    "Declination uses a simplified toy model: delta = asin(sin(epsilon) * sin(L)), with L treated as uniform in time (~1 deg accuracy vs ephemeris)."
  );
  notes.push(
    "Earth\u2013Sun distance uses a first-order eccentric model r ~ 1 - e cos(theta) (not a Kepler solver); distance variations are small and not the main cause of seasons."
  );
  notes.push(
    `Perihelion is anchored near day 3 (Jan 3) with an uncertainty of about \u00B1${SeasonsModel.PERIHELION_DAY_UNCERTAINTY} days.`
  );
  if (prefersReducedMotion) {
    notes.push("Reduced motion: year animation is disabled.");
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Day-of-year", value: `${day} (${dateLabel})` },
      { name: "Latitude phi (deg)", value: String(Math.round(latitudeDeg)) },
      { name: "Axial tilt epsilon (deg)", value: formatNumber(axialTiltDeg, 1) }
    ],
    readouts: [
      { name: "Solar declination delta (deg)", value: formatNumber(st.declinationDeg, 1) },
      { name: "Day length (h)", value: formatNumber(st.dayLengthHours, 2) },
      { name: "Noon altitude (deg)", value: formatNumber(st.noonAltitudeDeg, 1) },
      { name: "Earth\u2013Sun distance r (AU)", value: formatNumber(distanceAu, 3) },
      { name: "Season (North)", value: seasonN },
      { name: "Season (South)", value: seasonS }
    ],
    notes
  };
}

function getControlsBody(): HTMLElement {
  const el = document.querySelector<HTMLElement>(".cp-demo__sidebar .cp-panel-body");
  if (!el) throw new Error("Missing controls container for challenge mode.");
  return el;
}

const challenges: Challenge[] = [
  {
    type: "custom",
    prompt: "Show \u201Cno seasons\u201D: set $\\varepsilon$ to $0^\\circ$ so $\\delta$ stays near $0^\\circ$.",
    initialState: { dayOfYear: 172, axialTiltDeg: 23.5, latitudeDeg: 40 },
    hints: ["Set axial tilt ($\\varepsilon$) close to $0^\\circ$ and watch declination ($\\delta$)."],
    check: (s: unknown) => {
      const st = s as Partial<SeasonsDemoState>;
      const tiltVal = Number(st.axialTiltDeg);
      const decl = Number(st.declinationDeg);
      if (![tiltVal, decl].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      const tiltOk = tiltVal <= 1;
      const declOk = Math.abs(decl) <= 1;
      if (tiltOk && declOk) {
        return {
          correct: true,
          close: true,
          message: `Nice: $\\varepsilon \\approx ${tiltVal.toFixed(1)}^\\circ$, $\\delta \\approx ${decl.toFixed(1)}^\\circ$`
        };
      }
      return {
        correct: false,
        close: tiltVal <= 2 || Math.abs(decl) <= 2,
        message: `Not yet: $\\varepsilon = ${tiltVal.toFixed(1)}^\\circ$, $\\delta = ${decl.toFixed(1)}^\\circ$ (targets $\\le 1^\\circ$)`
      };
    }
  },
  {
    type: "custom",
    prompt: "At the March equinox, day length is about $12\\,\\mathrm{h}$ at mid-latitudes.",
    initialState: { dayOfYear: 172, axialTiltDeg: 23.5, latitudeDeg: 40 },
    hints: ["Set day-of-year to 80 (March equinox). Keep $|\\phi| \\le 50^\\circ$."],
    check: (s: unknown) => {
      const st = s as Partial<SeasonsDemoState>;
      const dayVal = Number(st.dayOfYear);
      const lat = Number(st.latitudeDeg);
      const dayLen = Number(st.dayLengthHours);
      if (![dayVal, lat, dayLen].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      const dayOk = Math.abs(dayVal - 80) <= 1;
      const latOk = Math.abs(lat) <= 50;
      const lenOk = Math.abs(dayLen - 12) <= 1;

      if (dayOk && latOk && lenOk) {
        return {
          correct: true,
          close: true,
          message: `Nice: day length $\\approx ${dayLen.toFixed(2)}\\,\\mathrm{h}$`
        };
      }

      const close = (dayOk && latOk) || (latOk && lenOk);
      return {
        correct: false,
        close,
        message: `Not yet: day=${Math.round(dayVal)}, $\\phi=${Math.round(lat)}^\\circ$, day length $=${dayLen.toFixed(2)}\\,\\mathrm{h}$`
      };
    }
  },
  {
    type: "custom",
    prompt: "Opposite hemispheres: at June solstice, the north has longer days than the south (for symmetric latitudes).",
    initialState: { dayOfYear: 80, axialTiltDeg: 23.5, latitudeDeg: 40 },
    hints: ["Set day-of-year to 172 (June solstice). Try $|\\phi|$ between $10^\\circ$ and $60^\\circ$."],
    check: (s: unknown) => {
      const st = s as Partial<SeasonsDemoState>;
      const dayVal = Number(st.dayOfYear);
      const tiltVal = Number(st.axialTiltDeg);
      const lat = Number(st.latitudeDeg);
      if (![dayVal, tiltVal, lat].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      const dayOk = Math.abs(dayVal - 172) <= 1;
      const absLat = Math.abs(lat);
      const latOk = absLat >= 10 && absLat <= 60;

      const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: dayVal, axialTiltDeg: tiltVal });
      const dayNorth = SeasonsModel.dayLengthHours({ latitudeDeg: absLat, sunDeclinationDeg: decl });
      const daySouth = SeasonsModel.dayLengthHours({ latitudeDeg: -absLat, sunDeclinationDeg: decl });
      const longerInNorth = dayNorth > daySouth;

      if (dayOk && latOk && longerInNorth) {
        return {
          correct: true,
          close: true,
          message: `Nice: $+${absLat.toFixed(0)}^\\circ \\to ${dayNorth.toFixed(2)}\\,\\mathrm{h}$, $-${absLat.toFixed(0)}^\\circ \\to ${daySouth.toFixed(2)}\\,\\mathrm{h}$`
        };
      }

      const close = dayOk && longerInNorth;
      return {
        correct: false,
        close,
        message: `Not yet: day=${Math.round(dayVal)} (target 172), $|\\phi|=${absLat.toFixed(0)}^\\circ$ ($10^\\circ$\u2013$60^\\circ$ recommended)`
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
    stopAnimation();
    challengeEngine.start();
  }
});

const anchorButtons: HTMLButtonElement[] = [anchorMarEqx, anchorJunSol, anchorSepEqx, anchorDecSol];

function setAnchorPressed(active: HTMLButtonElement | null) {
  for (const btn of anchorButtons) {
    btn.setAttribute("aria-pressed", btn === active ? "true" : "false");
  }
}

function setDay(day: number, activeButton: HTMLButtonElement | null = null) {
  stopAnimation();
  state.dayOfYear = clamp(day, 1, 365);
  setAnchorPressed(activeButton);
  render();
}

function animateToDay(targetDay: number, activeButton: HTMLButtonElement | null = null) {
  stopAnimation();
  cancelPresetTransition();
  setAnchorPressed(activeButton);

  const startDay = state.dayOfYear;
  const delta = shortestDayDelta(startDay, targetDay);

  // If already at target (or very close), just snap
  if (Math.abs(delta) < 0.5) {
    state.dayOfYear = clamp(targetDay, 1, 365);
    render();
    return;
  }

  if (prefersReducedMotion) {
    // Snap immediately for reduced-motion users
    state.dayOfYear = clamp(targetDay, 1, 365);
    render();
    return;
  }

  let startT = 0;

  function presetStep(t: number) {
    if (startT === 0) startT = t;
    const elapsed = t - startT;
    const rawProgress = animationProgress(elapsed, PRESET_TRANSITION_MS);
    const easedProgress = easeInOutCubic(rawProgress);
    const currentDay = startDay + delta * easedProgress;
    // Wrap into [1, 365] range
    state.dayOfYear = ((currentDay - 1 + 365.25) % 365.25) + 1;
    render();
    if (rawProgress < 1) {
      presetRafId = window.requestAnimationFrame(presetStep);
    } else {
      presetRafId = null;
      // Snap to exact target at end of animation
      state.dayOfYear = clamp(targetDay, 1, 365);
      render();
    }
  }

  presetRafId = window.requestAnimationFrame(presetStep);
}

anchorMarEqx.addEventListener("click", () => animateToDay(80, anchorMarEqx));
anchorJunSol.addEventListener("click", () => animateToDay(172, anchorJunSol));
anchorSepEqx.addEventListener("click", () => animateToDay(266, anchorSepEqx));
anchorDecSol.addEventListener("click", () => animateToDay(356, anchorDecSol));

dayOfYear.addEventListener("input", () => {
  stopAnimation();
  setAnchorPressed(null);
  state.dayOfYear = Number(dayOfYear.value);
  render();
});

tilt.addEventListener("input", () => {
  stopAnimation();
  state.axialTiltDeg = Number(tilt.value);
  render();
});

latitude.addEventListener("input", () => {
  stopAnimation();
  state.latitudeDeg = Number(latitude.value);
  render();
});

animateYear.addEventListener("click", () => {
  cancelPresetTransition();
  if (isAnimating) stopAnimation();
  else startAnimation();
});

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying\u2026");
  void runtime
    .copyResults(exportResults(getState()))
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

// --- Overlay toggles ---
const overlayTargets: Record<string, (SVGElement | HTMLElement)[]> = {
  "latitude-bands": [latBandsGroup],
  "terminator": [terminator],
  "ecliptic": [globeEcliptic],
  "equator": [globeEquator],
  "sunlight-rays": [sunlightRaysEl],
  "day-arc": [dayArc, nightArc],
  "hour-grid": [hourGrid],
};

const overlayButtons = document.querySelectorAll<HTMLButtonElement>("[data-overlay]");

for (const btn of overlayButtons) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.overlay;
    if (!key) return;
    const pressed = btn.getAttribute("aria-pressed") === "true";
    const next = !pressed;
    btn.setAttribute("aria-pressed", String(next));
    const targets = overlayTargets[key];
    if (targets) {
      for (const el of targets) {
        (el as HTMLElement).style.display = next ? "" : "none";
      }
    }
  });
}

// --- Keyboard shortcuts ---
document.addEventListener("keydown", (e) => {
  // Don't intercept when focus is on an input/textarea (e.g. slider keyboard usage)
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

  switch (e.key) {
    case "ArrowRight": {
      stopAnimation();
      cancelPresetTransition();
      setAnchorPressed(null);
      state.dayOfYear = ((state.dayOfYear - 1 + 1) % 365.25) + 1;
      render();
      e.preventDefault();
      break;
    }
    case "ArrowLeft": {
      stopAnimation();
      cancelPresetTransition();
      setAnchorPressed(null);
      state.dayOfYear = ((state.dayOfYear - 1 - 1 + 365.25) % 365.25) + 1;
      render();
      e.preventDefault();
      break;
    }
    case "ArrowUp": {
      stopAnimation();
      cancelPresetTransition();
      setAnchorPressed(null);
      state.dayOfYear = ((state.dayOfYear - 1 + 30) % 365.25) + 1;
      render();
      e.preventDefault();
      break;
    }
    case "ArrowDown": {
      stopAnimation();
      cancelPresetTransition();
      setAnchorPressed(null);
      state.dayOfYear = ((state.dayOfYear - 1 - 30 + 365.25) % 365.25) + 1;
      render();
      e.preventDefault();
      break;
    }
    case " ": {
      cancelPresetTransition();
      if (isAnimating) stopAnimation();
      else startAnimation();
      e.preventDefault();
      break;
    }
    case "e":
    case "E": {
      animateToDay(80, anchorMarEqx);
      break;
    }
    case "s":
    case "S": {
      animateToDay(172, anchorJunSol);
      break;
    }
  }
});

// --- Initialize ---
initSeasonLabels();
initHourGrid();
render();

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}
