import { ChallengeEngine, createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import { SeasonsModel } from "@cosmic/physics";
import { clamp, formatNumber, formatDateFromDayOfYear, seasonFromPhaseNorth, oppositeSeason, orbitPosition, axisEndpoint, diskMarkerY } from "./logic";
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
const axisLineEl = document.querySelector<SVGLineElement>("#axisLine");
const equatorLineEl = document.querySelector<SVGLineElement>("#equatorLine");
const subsolarDotEl = document.querySelector<SVGCircleElement>("#subsolarDot");
const subsolarLabelEl = document.querySelector<SVGTextElement>("#subsolarLabel");
const observerDotEl = document.querySelector<SVGCircleElement>("#observerDot");
const observerLabelEl = document.querySelector<SVGTextElement>("#observerLabel");

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
  !axisLineEl ||
  !equatorLineEl ||
  !subsolarDotEl ||
  !subsolarLabelEl ||
  !observerDotEl ||
  !observerLabelEl
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
const axisLine = axisLineEl;
const equatorLine = equatorLineEl;
const subsolarDot = subsolarDotEl;
const subsolarLabel = subsolarLabelEl;
const observerDot = observerDotEl;
const observerLabel = observerLabelEl;

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
      const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 45);
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
          const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 45);
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
  animateYear.disabled = true;
  motionNote.hidden = false;
  motionNote.textContent = "Animation disabled due to reduced-motion preference.";
}

let isAnimating = false;
let rafId: number | null = null;
let lastT = 0;

function stopAnimation() {
  isAnimating = false;
  animateYear.textContent = "Animate year";
  if (rafId !== null) window.cancelAnimationFrame(rafId);
  rafId = null;
  lastT = 0;
}

function startAnimation() {
  if (prefersReducedMotion) return;
  isAnimating = true;
  animateYear.textContent = "Stop animation";
  setAnchorPressed(null);
  lastT = 0;
  rafId = window.requestAnimationFrame(step);
}

function step(t: number) {
  if (!isAnimating) return;
  if (lastT === 0) lastT = t;
  const dt = (t - lastT) / 1000;
  lastT = t;

  const daysPerSecond = 36;
  state.dayOfYear += dt * daysPerSecond;
  if (state.dayOfYear > 365) state.dayOfYear -= 365;
  if (state.dayOfYear < 1) state.dayOfYear += 365;

  render();
  rafId = window.requestAnimationFrame(step);
}

function renderStage(args: {
  dayOfYear: number;
  axialTiltDeg: number;
  latitudeDeg: number;
  declinationDeg: number;
  distanceAu: number;
}) {
  // Orbit panel (orbit is centered at (0,0) inside its translated SVG group)
  const orbitR = 140;

  const angle = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: args.dayOfYear });
  const { x, y } = orbitPosition(angle, args.distanceAu, orbitR);
  earthOrbitDot.setAttribute("cx", formatNumber(x, 2));
  earthOrbitDot.setAttribute("cy", formatNumber(y, 2));
  orbitLabel.textContent = `r ~ ${formatNumber(args.distanceAu, 3)} AU`;

  // Tilt panel
  const diskR = 92;

  const axisEnd = axisEndpoint(args.axialTiltDeg, 120);
  axisLine.setAttribute("x1", formatNumber(-axisEnd.x, 2));
  axisLine.setAttribute("y1", formatNumber(-axisEnd.y, 2));
  axisLine.setAttribute("x2", formatNumber(axisEnd.x, 2));
  axisLine.setAttribute("y2", formatNumber(axisEnd.y, 2));

  // Keep the equator line horizontal (schematic), regardless of axis tilt.
  equatorLine.setAttribute("x1", "-120");
  equatorLine.setAttribute("y1", "0");
  equatorLine.setAttribute("x2", "120");
  equatorLine.setAttribute("y2", "0");

  // Subsolar point at latitude = declination (schematic marker on the sun-facing meridian).
  const sunFacingX = 0.85 * diskR;
  const subY = diskMarkerY(args.declinationDeg, diskR);
  subsolarDot.setAttribute("cx", formatNumber(sunFacingX, 2));
  subsolarDot.setAttribute("cy", formatNumber(subY, 2));
  subsolarLabel.textContent = `delta = ${formatNumber(args.declinationDeg, 1)} deg`;

  // Observer marker at chosen latitude.
  const obsY = diskMarkerY(args.latitudeDeg, diskR);
  observerDot.setAttribute("cx", formatNumber(sunFacingX, 2));
  observerDot.setAttribute("cy", formatNumber(obsY, 2));
  observerLabel.textContent = `lat = ${Math.round(args.latitudeDeg)} deg`;
}

function render() {
  const day = clamp(Math.round(state.dayOfYear), 1, 365);
  const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 45);
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
  latitudeValue.textContent = `${Math.round(latitudeDeg)} deg`;

  declinationValue.textContent = formatNumber(declinationDegValue, 1);
  dayLengthValue.textContent = formatNumber(dayLengthHoursValue, 2);
  noonAltitudeValue.textContent = formatNumber(noonAltitudeDegValue, 1);
  distanceAuValue.textContent = formatNumber(distanceAu, 3);
  seasonNorthValue.textContent = north;
  seasonSouthValue.textContent = south;

  renderStage({
    dayOfYear: day,
    axialTiltDeg,
    latitudeDeg,
    declinationDeg: declinationDegValue,
    distanceAu
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
  const axialTiltDeg = clamp(Number(state.axialTiltDeg), 0, 45);
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
  if (Number.isFinite(obj.axialTiltDeg)) state.axialTiltDeg = clamp(obj.axialTiltDeg as number, 0, 45);
  if (Number.isFinite(obj.latitudeDeg)) state.latitudeDeg = clamp(obj.latitudeDeg as number, -90, 90);

  stopAnimation();
  render();
}

function exportResults(st: SeasonsDemoState): ExportPayloadV1 {
  const day = clamp(Math.round(st.dayOfYear), 1, 365);
  const dateLabel = formatDateFromDayOfYear(day);
  const axialTiltDeg = clamp(Number(st.axialTiltDeg), 0, 45);
  const latitudeDeg = clamp(Number(st.latitudeDeg), -90, 90);

  const distanceAu = SeasonsModel.earthSunDistanceAu({ dayOfYear: day });
  const seasonN = seasonFromPhaseNorth(day);
  const seasonS = oppositeSeason(seasonN);

  const notes: string[] = [];
  notes.push(
    "Declination uses a simplified toy model: delta = asin(sin(epsilon) * sin(L)), with L treated as uniform in time (~1 deg accuracy vs ephemeris)."
  );
  notes.push(
    "Earth–Sun distance uses a first-order eccentric model r ~ 1 - e cos(theta) (not a Kepler solver); distance variations are small and not the main cause of seasons."
  );
  notes.push(
    `Perihelion is anchored near day 3 (Jan 3) with an uncertainty of about ±${SeasonsModel.PERIHELION_DAY_UNCERTAINTY} days.`
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
      { name: "Earth–Sun distance r (AU)", value: formatNumber(distanceAu, 3) },
      { name: "Season (North)", value: seasonN },
      { name: "Season (South)", value: seasonS }
    ],
    notes
  };
}

function getControlsBody(): HTMLElement {
  const el = document.querySelector<HTMLElement>(".cp-demo__controls .cp-panel-body");
  if (!el) throw new Error("Missing controls container for challenge mode.");
  return el;
}

const challenges: Challenge[] = [
  {
    type: "custom",
    prompt: "Show “no seasons”: set $\\varepsilon$ to $0^\\circ$ so $\\delta$ stays near $0^\\circ$.",
    initialState: { dayOfYear: 172, axialTiltDeg: 23.5, latitudeDeg: 40 },
    hints: ["Set axial tilt ($\\varepsilon$) close to $0^\\circ$ and watch declination ($\\delta$)."],
    check: (s: unknown) => {
      const st = s as Partial<SeasonsDemoState>;
      const tilt = Number(st.axialTiltDeg);
      const decl = Number(st.declinationDeg);
      if (![tilt, decl].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      const tiltOk = tilt <= 1;
      const declOk = Math.abs(decl) <= 1;
      if (tiltOk && declOk) {
        return {
          correct: true,
          close: true,
          message: `Nice: $\\varepsilon \\approx ${tilt.toFixed(1)}^\\circ$, $\\delta \\approx ${decl.toFixed(1)}^\\circ$`
        };
      }
      return {
        correct: false,
        close: tilt <= 2 || Math.abs(decl) <= 2,
        message: `Not yet: $\\varepsilon = ${tilt.toFixed(1)}^\\circ$, $\\delta = ${decl.toFixed(1)}^\\circ$ (targets $\\le 1^\\circ$)`
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
      const day = Number(st.dayOfYear);
      const lat = Number(st.latitudeDeg);
      const dayLen = Number(st.dayLengthHours);
      if (![day, lat, dayLen].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      const dayOk = Math.abs(day - 80) <= 1;
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
        message: `Not yet: day=${Math.round(day)}, $\\phi=${Math.round(lat)}^\\circ$, day length $=${dayLen.toFixed(2)}\\,\\mathrm{h}$`
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
      const day = Number(st.dayOfYear);
      const tilt = Number(st.axialTiltDeg);
      const lat = Number(st.latitudeDeg);
      if (![day, tilt, lat].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }
      const dayOk = Math.abs(day - 172) <= 1;
      const absLat = Math.abs(lat);
      const latOk = absLat >= 10 && absLat <= 60;

      const decl = SeasonsModel.sunDeclinationDeg({ dayOfYear: day, axialTiltDeg: tilt });
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
        message: `Not yet: day=${Math.round(day)} (target 172), $|\\phi|=${absLat.toFixed(0)}^\\circ$ ($10^\\circ$–$60^\\circ$ recommended)`
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

anchorMarEqx.addEventListener("click", () => setDay(80, anchorMarEqx));
anchorJunSol.addEventListener("click", () => setDay(172, anchorJunSol));
anchorSepEqx.addEventListener("click", () => setDay(266, anchorSepEqx));
anchorDecSol.addEventListener("click", () => setDay(356, anchorDecSol));

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
  if (prefersReducedMotion) return;
  if (isAnimating) stopAnimation();
  else startAnimation();
});

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
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

render();

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
}
