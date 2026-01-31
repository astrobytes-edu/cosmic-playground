import { createDemoModes } from "@cosmic/runtime";
import { SeasonsModel } from "@cosmic/physics";

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
copyResults.disabled = true;

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
          "Set tilt to 0° to see that declination stays near 0° all year in this toy model."
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
      { key: "latitude", label: "Latitude (°)" },
      { key: "tilt", label: "Tilt (°)" },
      { key: "declination", label: "δ (°)" },
      { key: "dayLength", label: "Day length (h)" },
      { key: "noonAltitude", label: "Noon altitude (°)" },
      { key: "seasonN", label: "Season (N)" },
      { key: "seasonS", label: "Season (S)" },
      { key: "distanceAu", label: "Distance (AU)" }
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number, digits: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

const MONTHS = [
  { name: "Jan", days: 31 },
  { name: "Feb", days: 28 },
  { name: "Mar", days: 31 },
  { name: "Apr", days: 30 },
  { name: "May", days: 31 },
  { name: "Jun", days: 30 },
  { name: "Jul", days: 31 },
  { name: "Aug", days: 31 },
  { name: "Sep", days: 30 },
  { name: "Oct", days: 31 },
  { name: "Nov", days: 30 },
  { name: "Dec", days: 31 }
] as const;

function formatDateFromDayOfYear(day: number): string {
  let d = clamp(Math.round(day), 1, 365);
  for (const m of MONTHS) {
    if (d <= m.days) return `${m.name} ${d}`;
    d -= m.days;
  }
  return "Dec 31";
}

function seasonFromPhaseNorth(dayOfYearValue: number): "Spring" | "Summer" | "Autumn" | "Winter" {
  const yearDays = 365.2422;
  const dayOfMarchEquinox = 80;
  const phase = ((dayOfYearValue - dayOfMarchEquinox) / yearDays) % 1;
  const wrapped = phase < 0 ? phase + 1 : phase;
  const quadrant = Math.floor(wrapped * 4) % 4;
  if (quadrant === 0) return "Spring";
  if (quadrant === 1) return "Summer";
  if (quadrant === 2) return "Autumn";
  return "Winter";
}

function oppositeSeason(season: "Spring" | "Summer" | "Autumn" | "Winter") {
  if (season === "Spring") return "Autumn";
  if (season === "Autumn") return "Spring";
  if (season === "Summer") return "Winter";
  return "Summer";
}

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
  // Orbit panel (center is hard-coded in SVG markup)
  const orbitCx = 180;
  const orbitCy = 170;
  const orbitR = 140;

  const angle = SeasonsModel.orbitAngleRadFromDay({ dayOfYear: args.dayOfYear });
  const rScaled = orbitR * clamp(args.distanceAu, 0.95, 1.05);
  const x = orbitCx + rScaled * Math.cos(angle);
  const y = orbitCy + rScaled * Math.sin(angle);
  earthOrbitDot.setAttribute("cx", formatNumber(x, 2));
  earthOrbitDot.setAttribute("cy", formatNumber(y, 2));
  orbitLabel.textContent = `r ≈ ${formatNumber(args.distanceAu, 3)} AU`;

  // Tilt panel
  const diskR = 92;
  const declRad = (args.declinationDeg * Math.PI) / 180;
  const latRad = (args.latitudeDeg * Math.PI) / 180;

  const axisRad = (-args.axialTiltDeg * Math.PI) / 180;
  const axisX = Math.sin(axisRad) * 120;
  const axisY = -Math.cos(axisRad) * 120;
  axisLine.setAttribute("x1", formatNumber(-axisX, 2));
  axisLine.setAttribute("y1", formatNumber(-axisY, 2));
  axisLine.setAttribute("x2", formatNumber(axisX, 2));
  axisLine.setAttribute("y2", formatNumber(axisY, 2));

  // Keep the equator line horizontal (schematic), regardless of axis tilt.
  equatorLine.setAttribute("x1", "-120");
  equatorLine.setAttribute("y1", "0");
  equatorLine.setAttribute("x2", "120");
  equatorLine.setAttribute("y2", "0");

  // Subsolar point at latitude = declination (schematic marker on the sun-facing meridian).
  const sunFacingX = 0.85 * diskR;
  const subY = -Math.sin(declRad) * 0.85 * diskR;
  subsolarDot.setAttribute("cx", formatNumber(sunFacingX, 2));
  subsolarDot.setAttribute("cy", formatNumber(subY, 2));
  subsolarLabel.textContent = `δ = ${formatNumber(args.declinationDeg, 1)}°`;

  // Observer marker at chosen latitude.
  const obsY = -Math.sin(latRad) * 0.85 * diskR;
  observerDot.setAttribute("cx", formatNumber(sunFacingX, 2));
  observerDot.setAttribute("cy", formatNumber(obsY, 2));
  observerLabel.textContent = `lat = ${Math.round(args.latitudeDeg)}°`;
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

  tiltValue.textContent = `${formatNumber(axialTiltDeg, 1)}°`;
  latitudeValue.textContent = `${Math.round(latitudeDeg)}°`;

  declinationValue.textContent = `${formatNumber(declinationDegValue, 1)}°`;
  dayLengthValue.textContent = `${formatNumber(dayLengthHoursValue, 2)} h`;
  noonAltitudeValue.textContent = `${formatNumber(noonAltitudeDegValue, 1)}°`;
  distanceAuValue.textContent = `${formatNumber(distanceAu, 3)} AU`;
  seasonNorthValue.textContent = north;
  seasonSouthValue.textContent = south;

  renderStage({
    dayOfYear: day,
    axialTiltDeg,
    latitudeDeg,
    declinationDeg: declinationDegValue,
    distanceAu
  });
}

function setDay(day: number) {
  stopAnimation();
  state.dayOfYear = clamp(day, 1, 365);
  render();
}

anchorMarEqx.addEventListener("click", () => setDay(80));
anchorJunSol.addEventListener("click", () => setDay(172));
anchorSepEqx.addEventListener("click", () => setDay(266));
anchorDecSol.addEventListener("click", () => setDay(356));

dayOfYear.addEventListener("input", () => {
  stopAnimation();
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
  status.textContent = "Export is not available yet for this demo.";
});

render();
