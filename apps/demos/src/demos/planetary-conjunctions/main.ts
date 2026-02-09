import { createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { RetrogradeMotionModel, TwoBodyAnalytic } from "@cosmic/physics";
import {
  type PlanetName,
  type ConjunctionCallbacks,
  siderealPeriodDays,
  synodicPeriodDays,
  planetAngleRad,
  angularSeparationDeg,
  isConjunction,
  formatNumber,
  formatDays,
  formatAngleDeg,
  orbitToSvg,
  orbitRadiusPx,
  planetCssVar,
  yearDays
} from "./logic";

// ---------------------------------------------------------------------------
// Starfield
// ---------------------------------------------------------------------------
const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

// ---------------------------------------------------------------------------
// DOM queries
// ---------------------------------------------------------------------------
const planetChips = Array.from(document.querySelectorAll<HTMLButtonElement>("button.planet-chip[data-planet]"));
const speedSliderEl = document.querySelector<HTMLInputElement>("#speedSlider");
const speedValueEl = document.querySelector<HTMLSpanElement>("#speedValue");
const resetEl = document.querySelector<HTMLButtonElement>("#reset");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const earthOrbitEl = document.querySelector<SVGCircleElement>("#earthOrbit");
const targetOrbitEl = document.querySelector<SVGCircleElement>("#targetOrbit");
const earthDotEl = document.querySelector<SVGCircleElement>("#earthDot");
const targetDotEl = document.querySelector<SVGCircleElement>("#targetDot");
const earthLabelEl = document.querySelector<SVGTextElement>("#earthLabel");
const targetLabelEl = document.querySelector<SVGTextElement>("#targetLabel");
const conjunctionLineEl = document.querySelector<SVGLineElement>("#conjunctionLine");
const conjunctionFlashEl = document.querySelector<SVGCircleElement>("#conjunctionFlash");

const synodicPeriodEl = document.querySelector<HTMLSpanElement>("#synodicPeriod");
const daysElapsedEl = document.querySelector<HTMLSpanElement>("#daysElapsed");
const conjunctionCountEl = document.querySelector<HTMLSpanElement>("#conjunctionCount");
const earthAngleEl = document.querySelector<HTMLSpanElement>("#earthAngle");
const targetAngleEl = document.querySelector<HTMLSpanElement>("#targetAngle");
const separationEl = document.querySelector<HTMLSpanElement>("#separation");

if (
  !speedSliderEl || !speedValueEl || !resetEl || !copyResultsEl || !statusEl ||
  !earthOrbitEl || !targetOrbitEl || !earthDotEl || !targetDotEl ||
  !earthLabelEl || !targetLabelEl || !conjunctionLineEl || !conjunctionFlashEl ||
  !synodicPeriodEl || !daysElapsedEl || !conjunctionCountEl ||
  !earthAngleEl || !targetAngleEl || !separationEl
) {
  throw new Error("Missing required DOM elements for planetary-conjunctions demo.");
}

const speedSlider = speedSliderEl;
const speedValue = speedValueEl;
const resetButton = resetEl;
const copyResults = copyResultsEl;
const status = statusEl;
const earthOrbit = earthOrbitEl;
const targetOrbit = targetOrbitEl;
const earthDot = earthDotEl;
const targetDot = targetDotEl;
const earthLabel = earthLabelEl;
const targetLabel = targetLabelEl;
const conjunctionLine = conjunctionLineEl;
const conjunctionFlash = conjunctionFlashEl;
const synodicPeriodReadout = synodicPeriodEl;
const daysElapsedReadout = daysElapsedEl;
const conjunctionCountReadout = conjunctionCountEl;
const earthAngleReadout = earthAngleEl;
const targetAngleReadout = targetAngleEl;
const separationReadout = separationEl;

// ---------------------------------------------------------------------------
// Physics DI callbacks
// ---------------------------------------------------------------------------
const callbacks: ConjunctionCallbacks = {
  planetSemiMajorAxisAu(name: PlanetName): number {
    const el = RetrogradeMotionModel.planetElements(name);
    return el.aAu;
  },
  orbitalPeriodYr(aAu: number, massSolar: number): number {
    return TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({ aAu, massSolar });
  },
  synodicPeriod(p1: number, p2: number): number {
    return TwoBodyAnalytic.synodicPeriod(p1, p2);
  }
};

// ---------------------------------------------------------------------------
// SVG constants
// ---------------------------------------------------------------------------
const SVG_CX = 300;
const SVG_CY = 300;
const MAX_ORBIT_PX = 240; // largest orbit radius in SVG pixels

const CONJUNCTION_THRESHOLD_DEG = 5;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let selectedPlanet: PlanetName = "Mars";
let elapsedDays = 0;
let conjunctionCount = 0;
let lastWasConjunction = false; // edge detector for conjunction counting
let animId: number | null = null;
let lastTimestamp = 0;
let flashOpacity = 0;

// ---------------------------------------------------------------------------
// Precomputed periods
// ---------------------------------------------------------------------------
let earthPeriodDays = siderealPeriodDays("Earth", callbacks);
let targetPeriodDays = siderealPeriodDays(selectedPlanet, callbacks);
let synPeriodDays = synodicPeriodDays(earthPeriodDays, targetPeriodDays, callbacks);

// Semi-major axes for orbit scaling
const earthAu = 1.00000261;
function targetAu(): number {
  return callbacks.planetSemiMajorAxisAu(selectedPlanet);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function getMaxAu(): number {
  // The outermost orbit determines the scale. Always include the target.
  return Math.max(earthAu, targetAu());
}

function updateOrbits(): void {
  const maxAu = getMaxAu();
  const earthR = orbitRadiusPx(earthAu, maxAu, MAX_ORBIT_PX);
  const targetR = orbitRadiusPx(targetAu(), maxAu, MAX_ORBIT_PX);

  earthOrbit.setAttribute("r", earthR.toFixed(1));
  targetOrbit.setAttribute("r", targetR.toFixed(1));
}

function updateTargetColor(): void {
  const cssVar = planetCssVar(selectedPlanet);
  const color = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (color) {
    targetDot.style.fill = `var(${cssVar})`;
  }
}

function render(): void {
  const maxAu = getMaxAu();
  const earthR = orbitRadiusPx(earthAu, maxAu, MAX_ORBIT_PX);
  const targetR = orbitRadiusPx(targetAu(), maxAu, MAX_ORBIT_PX);

  const earthAngle = planetAngleRad(elapsedDays, earthPeriodDays);
  const targetAngle = planetAngleRad(elapsedDays, targetPeriodDays);

  // Position planets
  const earthPos = orbitToSvg(SVG_CX, SVG_CY, earthR, earthAngle);
  const targetPos = orbitToSvg(SVG_CX, SVG_CY, targetR, targetAngle);

  earthDot.setAttribute("cx", earthPos.x.toFixed(1));
  earthDot.setAttribute("cy", earthPos.y.toFixed(1));
  earthLabel.setAttribute("x", earthPos.x.toFixed(1));
  earthLabel.setAttribute("y", (earthPos.y - 12).toFixed(1));

  targetDot.setAttribute("cx", targetPos.x.toFixed(1));
  targetDot.setAttribute("cy", targetPos.y.toFixed(1));
  targetLabel.setAttribute("x", targetPos.x.toFixed(1));
  targetLabel.setAttribute("y", (targetPos.y - 12).toFixed(1));

  // Angular separation
  const sepDeg = angularSeparationDeg(earthAngle, targetAngle);
  const inConj = isConjunction(sepDeg, CONJUNCTION_THRESHOLD_DEG);

  // Conjunction detection (rising-edge: transition from not-conjunction to conjunction)
  if (inConj && !lastWasConjunction && elapsedDays > 1) {
    conjunctionCount++;
    flashOpacity = 0.8;
  }
  lastWasConjunction = inConj;

  // Conjunction line: draw from sun through the midpoint angle when near conjunction
  if (inConj) {
    // Use vector averaging to handle 0/2pi wraparound correctly:
    const mx = Math.cos(earthAngle) + Math.cos(targetAngle);
    const my = Math.sin(earthAngle) + Math.sin(targetAngle);
    const avgAngle = Math.atan2(my, mx);
    const farR = Math.max(earthR, targetR) + 30;
    const lineEnd = orbitToSvg(SVG_CX, SVG_CY, farR, avgAngle);
    conjunctionLine.setAttribute("x1", String(SVG_CX));
    conjunctionLine.setAttribute("y1", String(SVG_CY));
    conjunctionLine.setAttribute("x2", lineEnd.x.toFixed(1));
    conjunctionLine.setAttribute("y2", lineEnd.y.toFixed(1));
    conjunctionLine.classList.add("conjunction__line--visible");
  } else {
    conjunctionLine.classList.remove("conjunction__line--visible");
  }

  // Flash effect (decaying)
  if (flashOpacity > 0.01) {
    conjunctionFlash.setAttribute("r", String(MAX_ORBIT_PX));
    conjunctionFlash.setAttribute("opacity", flashOpacity.toFixed(2));
    flashOpacity *= 0.92;
  } else {
    conjunctionFlash.setAttribute("opacity", "0");
    flashOpacity = 0;
  }

  // Update readouts
  synodicPeriodReadout.textContent = formatNumber(synPeriodDays, 1);
  daysElapsedReadout.textContent = formatDays(elapsedDays);
  conjunctionCountReadout.textContent = String(conjunctionCount);
  earthAngleReadout.textContent = formatAngleDeg(earthAngle);
  targetAngleReadout.textContent = formatAngleDeg(targetAngle);
  separationReadout.textContent = formatNumber(sepDeg, 1);
}

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------
const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function tick(now: number): void {
  const dtSec = Math.min((now - lastTimestamp) / 1000, 0.1); // clamp for tab-backgrounding
  lastTimestamp = now;

  const speed = Number(speedSlider.value);
  speedValue.textContent = String(speed);

  // Advance simulation: speed multiplier in days per real second
  elapsedDays += dtSec * speed;

  render();
  animId = requestAnimationFrame(tick);
}

function startAnimation(): void {
  if (prefersReducedMotion) {
    setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
    render();
    return;
  }
  if (animId !== null) return;
  lastTimestamp = performance.now();
  animId = requestAnimationFrame(tick);
}

function stopAnimation(): void {
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function resetSimulation(): void {
  stopAnimation();
  elapsedDays = 0;
  conjunctionCount = 0;
  lastWasConjunction = false;
  flashOpacity = 0;
  render();
  startAnimation();
}

// ---------------------------------------------------------------------------
// Planet selection
// ---------------------------------------------------------------------------
function selectPlanet(name: PlanetName): void {
  selectedPlanet = name;

  // Update chip aria states
  for (const chip of planetChips) {
    const isSelected = chip.getAttribute("data-planet") === name;
    chip.setAttribute("aria-checked", String(isSelected));
    if (isSelected) chip.classList.add("cp-chip--active");
    else chip.classList.remove("cp-chip--active");
  }

  // Recompute periods
  targetPeriodDays = siderealPeriodDays(name, callbacks);
  synPeriodDays = synodicPeriodDays(earthPeriodDays, targetPeriodDays, callbacks);

  // Update target label
  targetLabel.textContent = name;

  // Update target color via CSS variable
  updateTargetColor();

  // Update orbits
  updateOrbits();

  // Reset simulation for the new planet
  resetSimulation();
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------
for (const chip of planetChips) {
  chip.addEventListener("click", () => {
    const planet = chip.getAttribute("data-planet") as PlanetName | null;
    if (planet) selectPlanet(planet);
  });
}

speedSlider.addEventListener("input", () => {
  speedValue.textContent = speedSlider.value;
});

resetButton.addEventListener("click", () => {
  resetSimulation();
});

// ---------------------------------------------------------------------------
// Runtime + export
// ---------------------------------------------------------------------------
const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:planetary-conjunctions:mode",
  url: new URL(window.location.href)
});

function exportResults(): ExportPayloadV1 {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Target planet", value: selectedPlanet },
      { name: "Speed multiplier", value: speedSlider.value + "x" }
    ],
    readouts: [
      { name: "Synodic period (days)", value: formatNumber(synPeriodDays, 1) },
      { name: "Days elapsed", value: formatDays(elapsedDays) },
      { name: "Conjunctions observed", value: String(conjunctionCount) },
      { name: "Earth sidereal period (days)", value: formatNumber(earthPeriodDays, 2) },
      { name: "Target sidereal period (days)", value: formatNumber(targetPeriodDays, 2) }
    ],
    notes: [
      "Teaching units: AU / yr / Msun with G = 4*pi^2 AU^3/(yr^2 Msun).",
      "Orbits shown as circles at mean semi-major axis (eccentricity ignored).",
      "Synodic period: P_syn = |P1 * P2 / (P1 - P2)|.",
      "Conjunction threshold: " + CONJUNCTION_THRESHOLD_DEG + " degrees angular separation."
    ]
  };
}

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying\u2026");
  void runtime
    .copyResults(exportResults())
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

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
selectPlanet("Mars"); // sets initial state
startAnimation();

initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);
