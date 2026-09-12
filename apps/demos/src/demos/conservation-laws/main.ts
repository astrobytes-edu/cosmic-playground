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
import { ConservationLawsModel, TwoBodyAnalytic } from "@cosmic/physics";
import {
  animationTimeScaleYrPerSec,
  arrowScale,
  buildPathD,
  captionTimeLine,
  clamp,
  DEFAULT_SIM_YEARS_PER_SEC,
  type EffectivePotentialPlot,
  effectivePotentialPlot,
  energyBarLayout,
  formatEccentricity,
  formatNumber,
  formatOrbitType,
  formatPeriapsis,
  formatSpecificEnergy,
  formatSpeedFactor,
  formatTimeScale,
  leftViewMessage,
  logSliderToValue,
  orbitAnnouncement,
  potentialProfile,
  type PotentialProfile,
  toSvg,
  type TrailEntry,
  trailSegments,
  turningPointsText,
  valueToLogSlider,
  viewRadiusAu
} from "./logic";

type Controls = { massSolar: number; r0Au: number; speedFactor: number; directionDeg: number };
type Orbit = ReturnType<typeof ConservationLawsModel.initialOrbit>;
type ValidOrbit = Exclude<Orbit, { orbitType: "invalid" }>;

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`conservation-laws: missing ${selector}`);
  return el;
}

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

const massSlider = must<HTMLInputElement>("#massSlider");
const r0Slider = must<HTMLInputElement>("#r0Slider");
const speedSlider = must<HTMLInputElement>("#speedFactor");
const directionSlider = must<HTMLInputElement>("#directionDeg");
const massValue = must<HTMLSpanElement>("#massValue");
const r0Value = must<HTMLSpanElement>("#r0Value");
const speedValue = must<HTMLSpanElement>("#speedValue");
const directionValue = must<HTMLSpanElement>("#directionValue");
const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button.preset[data-preset]"));
const playButton = must<HTMLButtonElement>("#play");
const pauseButton = must<HTMLButtonElement>("#pause");
const stepButton = must<HTMLButtonElement>("#step");
const resetButton = must<HTMLButtonElement>("#reset");
const stationModeButton = must<HTMLButtonElement>("#stationMode");
const helpButton = must<HTMLButtonElement>("#help");
const copyResults = must<HTMLButtonElement>("#copyResults");
const status = must<HTMLParagraphElement>("#status");
const orbitPath = must<SVGPathElement>("#orbitPath");
const orbitTrail = must<SVGGElement>("#orbitTrail");
const particle = must<SVGCircleElement>("#particle");
const velocityLine = must<SVGLineElement>("#velocityLine");
const orbitTypeValue = must<HTMLSpanElement>("#orbitType");
const eccValue = must<HTMLSpanElement>("#ecc");
const kValue = must<HTMLSpanElement>("#kAu");
const uValue = must<HTMLSpanElement>("#uAu");
const epsValue = must<HTMLSpanElement>("#eps");
const hValue = must<HTMLSpanElement>("#h");
const vKmSValue = must<HTMLSpanElement>("#vKmS");
const rpAuValue = must<HTMLSpanElement>("#rpAu");
const arrowCaption = must<HTMLSpanElement>("#arrowCaption");
const arrowDtDays = must<HTMLSpanElement>("#arrowDtDays");
const arrowDtUnit = must<HTMLSpanElement>("#arrowDtUnit");
const arrowCaptionNotToScale = must<HTMLSpanElement>("#arrowCaptionNotToScale");
const apoCaption = must<HTMLSpanElement>("#apoCaption");
const raAuValue = must<HTMLSpanElement>("#raAu");
const timeScaleValue = must<HTMLSpanElement>("#timeScale");
const timeScaleSlowed = must<HTMLSpanElement>("#timeScaleSlowed");
const timeCaption = must<HTMLSpanElement>("#timeCaption");
const stepCaption = must<HTMLSpanElement>("#stepCaption");
const stepDurationValue = must<HTMLSpanElement>("#stepDuration");
const viewRadiusAuValue = must<HTMLSpanElement>("#viewRadiusAu");
const energyBarTracks = must<HTMLDivElement>("#energyBar");
const energyBarU = must<HTMLSpanElement>("#energyBarU");
const energyBarK = must<HTMLSpanElement>("#energyBarK");
const energyBarZero = must<HTMLSpanElement>("#energyBarZero");
const energyBarEps = must<HTMLSpanElement>("#energyBarEps");
const ueffPlot = must<SVGSVGElement>("#ueffPlot");
const ueffCurve = must<SVGPathElement>("#ueffCurve");
const ueffAllowed = must<SVGPathElement>("#ueffAllowed");
const ueffZero = must<SVGLineElement>("#ueffZero");
const ueffEps = must<SVGLineElement>("#ueffEps");
const ueffDrop = must<SVGLineElement>("#ueffDrop");
const ueffDot = must<SVGCircleElement>("#ueffDot");
const ueffRpLabel = must<HTMLSpanElement>("#ueffRpLabel");
const ueffRaLabel = must<HTMLSpanElement>("#ueffRaLabel");
const stageSection = must<HTMLElement>(".cp-demo__stage");
const stageViews = must<HTMLElement>(".stage__views");
const viewPotentialTab = must<HTMLButtonElement>("#viewPotentialTab");
const potentialSvg = must<SVGSVGElement>("#potentialSvg");
const potentialCurve = must<SVGPathElement>("#potentialCurve");
const potentialAllowed = must<SVGPathElement>("#potentialAllowed");
const potentialZero = must<SVGLineElement>("#potentialZero");
const potentialEps = must<SVGLineElement>("#potentialEps");
const potentialSun = must<SVGCircleElement>("#potentialSun");
const potentialDrop = must<SVGLineElement>("#potentialDrop");
const potentialBody = must<SVGCircleElement>("#potentialBody");
const potentialRpLabel = must<HTMLSpanElement>("#potentialRpLabel");
const potentialRaLabel = must<HTMLSpanElement>("#potentialRaLabel");
const potentialEpsLabel = must<HTMLSpanElement>("#potentialEpsLabel");

const CENTER = { x: 300, y: 300 };
const VIEW_RADIUS_PX = 250;
const PATH_SAMPLES = 720;
/** Step moves the body this fraction of anim.characteristicYr per press: sixteen presses make one lap. */
const STEPS_PER_ORBIT = 16;
/** The trail shows where the body was over this much time on screen, in this many fading segments. */
const TRAIL_WINDOW_MS = 300;
const TRAIL_SEGMENTS = 6;
/** A Step's arc is recorded as if it had just been covered over this long, so all of it sits inside the trail window. */
const STEP_TRAIL_AGE_MS = 290;

/**
 * Circular and Elliptical are shape presets and start tangential. Escape and Hyperbolic are energy presets:
 * they set only the speed (`directionDeg: null` keeps the student's direction), because escape depends on
 * energy alone and the station card asks students to test that by changing the direction.
 */
const PRESETS = {
  circular: { label: "Circular", speedFactor: 1, directionDeg: 0 },
  elliptical: { label: "Elliptical", speedFactor: 0.75, directionDeg: 0 },
  escape: { label: "Escape", speedFactor: Math.SQRT2, directionDeg: null },
  hyperbolic: { label: "Hyperbolic", speedFactor: 1.8, directionDeg: null }
} as const;
type PresetName = keyof typeof PRESETS;

const prefersReducedMotion =
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:conservation-laws:mode",
  url: new URL(window.location.href)
});

/** Exact values. The sliders display these; a slider is read only when the student moves it. */
const controls: Controls = { massSolar: 1, r0Au: 1, speedFactor: 1, directionDeg: 0 };
let orbit: Orbit = ConservationLawsModel.initialOrbit(controls);

const anim = {
  playing: false,
  frameId: null as number | null,
  lastTimeMs: 0,
  nuRad: 0,
  /** Where an open orbit leaves the view; closed orbits ignore it. */
  nuMax: 2 * Math.PI,
  scalePxPerAu: VIEW_RADIUS_PX / 1.5,
  /** Set once per orbit by recomputeOrbit; this placeholder (nothing moving) draws no arrow. */
  arrow: arrowScale(0, VIEW_RADIUS_PX / 1.5),
  /** One lap of a bound orbit, or an open orbit's run from its start to nuMax; NaN for radial motion. */
  characteristicYr: Number.NaN,
  /** Orbital years per second on screen; slowed from the default when characteristicYr would pass too fast. */
  timeScaleYrPerSec: DEFAULT_SIM_YEARS_PER_SEC
};

/** The effective-potential plot for the current orbit and box; null when there is nothing to draw. */
let ueff: EffectivePotentialPlot | null = null;
/** The Potential view's mirrored profile for the current orbit; null while the view is hidden or has nothing to draw. */
let profile: PotentialProfile | null = null;

function setLine(line: SVGLineElement, x1: number, y1: number, x2: number, y2: number) {
  line.setAttribute("x1", x1.toFixed(2));
  line.setAttribute("y1", y1.toFixed(2));
  line.setAttribute("x2", x2.toFixed(2));
  line.setAttribute("y2", y2.toFixed(2));
}

function placeFill(el: HTMLElement, xPx: number, widthPx: number) {
  el.style.left = `${xPx.toFixed(1)}px`;
  el.style.width = `${Math.max(0, widthPx).toFixed(1)}px`;
}

/** U_eff at r for this orbit, from the model. */
function uEffAt(o: ValidOrbit, rAu: number): number {
  return ConservationLawsModel.effectivePotentialAu2Yr2({ rAu, hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
}

function validOrbit(): ValidOrbit | null {
  return orbit.orbitType === "invalid" ? null : orbit;
}

/**
 * Where the body was, in time order. A very eccentric orbit can sweep most of the way round periapsis in one frame;
 * the trail draws that arc along the orbit, so it reads as a fast sweep rather than a jump, and it is longer where
 * the body is faster.
 */
const trailHistory: TrailEntry[] = [];
const trailPaths = Array.from({ length: TRAIL_SEGMENTS }, () => {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "orbit__trail");
  path.setAttribute("d", "");
  path.style.display = "none";
  orbitTrail.appendChild(path);
  return path;
});

function clearTrail() {
  trailHistory.length = 0;
  for (const path of trailPaths) {
    path.setAttribute("d", "");
    path.style.display = "none";
  }
}

/** Draw the trail segments for `nowMs` into the pre-created paths, hiding the unused ones. */
function renderTrail(nowMs: number) {
  // Bounds memory only; trailSegments applies the window itself. Index 0 stays the newest entry at or before the edge.
  while (trailHistory.length > 1 && trailHistory[1].tMs <= nowMs - TRAIL_WINDOW_MS) trailHistory.shift();
  const o = validOrbit();
  const segments = o && o.orbitType !== "radial" ? trailSegments(trailHistory, nowMs, TRAIL_WINDOW_MS, TRAIL_SEGMENTS) : [];
  for (let i = 0; i < trailPaths.length; i++) {
    const path = trailPaths[i];
    const segment = segments[i] as (typeof segments)[number] | undefined;
    const d =
      o && segment
        ? buildPathD(
            ConservationLawsModel.sampleConicArcAu({
              ecc: o.ecc,
              pAu: o.pAu,
              omegaRad: o.omegaRad,
              nuFromRad: segment.nuFromRad,
              nuToRad: segment.nuToRad
            }),
            CENTER,
            anim.scalePxPerAu
          )
        : "";
    path.setAttribute("d", d);
    if (segment && d) path.setAttribute("stroke-opacity", segment.opacity.toFixed(2));
    path.style.display = d ? "" : "none";
  }
}

/** Step needs a path to move along but no animation, so reduced motion keeps it. */
function canStep(): boolean {
  const o = validOrbit();
  return o !== null && o.orbitType !== "radial";
}

function canAnimate(): boolean {
  return !prefersReducedMotion && canStep();
}

function stopAnimation() {
  // Read before disabling: a focused button that becomes disabled drops focus to <body>.
  const pauseHadFocus = document.activeElement === pauseButton;
  anim.playing = false;
  if (anim.frameId !== null) {
    cancelAnimationFrame(anim.frameId);
    anim.frameId = null;
  }
  playButton.disabled = !canAnimate();
  pauseButton.disabled = true;
  stepButton.disabled = !canStep();
  if (pauseHadFocus && !playButton.disabled) playButton.focus();
}

function resetAnimation() {
  stopAnimation();
  clearTrail();
  const o = validOrbit();
  if (!o) return;
  anim.nuRad = o.nu0Rad;
  renderBody();
  // Play announces "Playing."; without this, that would stay in the status after Reset stops the body.
  setLiveRegionText(status, "Reset to the start.");
}

function startAnimation() {
  if (prefersReducedMotion) {
    setLiveRegionText(status, "Reduced motion is enabled; use Step to move the body.");
    return;
  }
  const o = validOrbit();
  if (anim.playing || !o || o.orbitType === "radial") return;
  // An open orbit that already ran to the edge of the view starts again from the beginning.
  // Its trail ends at the view edge, so it is cleared rather than drawn back across the view.
  if (o.ecc >= 1 && anim.nuRad >= anim.nuMax - 1e-9) {
    anim.nuRad = o.nu0Rad;
    clearTrail();
  }

  // Read before disabling: a focused button that becomes disabled drops focus to <body>.
  const playHadFocus = document.activeElement === playButton;
  anim.playing = true;
  pauseButton.disabled = false;
  playButton.disabled = true;
  if (playHadFocus) pauseButton.focus();
  setLiveRegionText(status, "Playing.");
  anim.lastTimeMs = performance.now();

  const tick = (nowMs: number) => {
    if (!anim.playing) return;
    // A backgrounded tab's long gap is clamped to 0.1 s. The first frame's timestamp can precede the
    // performance.now() taken on Play, so a negative gap counts as zero instead of running time backwards.
    const dtSec = Math.max(0, Math.min((nowMs - anim.lastTimeMs) / 1000, 0.1));
    anim.lastTimeMs = nowMs;
    // Bound orbits follow Kepler's equation and open orbits take bounded steps, so the timing
    // does not depend on the frame rate.
    const step = ConservationLawsModel.advanceTrueAnomalyByTime({
      nuRad: anim.nuRad,
      ecc: o.ecc,
      pAu: o.pAu,
      hAbsAu2Yr: o.hAbsAu2Yr,
      muAu3Yr2: o.muAu3Yr2,
      dtYr: dtSec * anim.timeScaleYrPerSec,
      nuMax: anim.nuMax
    });
    anim.nuRad = step.nuRad;
    trailHistory.push({ tMs: nowMs, nuRad: anim.nuRad });
    renderBody();
    renderTrail(nowMs);
    if (step.stopped) {
      stopAnimation();
      setLiveRegionText(status, leftViewMessage(prefersReducedMotion));
      return;
    }
    anim.frameId = requestAnimationFrame(tick);
  };
  anim.frameId = requestAnimationFrame(tick);
}

/**
 * Stop any playback, then move the body 1/STEPS_PER_ORBIT of anim.characteristicYr along its path. Stepping needs no
 * animation, so it is how a reader with reduced motion follows K and U trading while eps stays fixed.
 */
function stepBody() {
  const o = validOrbit();
  if (!o || o.orbitType === "radial" || !(anim.characteristicYr > 0)) return;
  const wasPlaying = anim.playing;
  stopAnimation();
  // As on Play, an open orbit that already ran to the edge of the view starts again from the beginning.
  const restarted = o.ecc >= 1 && anim.nuRad >= anim.nuMax - 1e-9;
  if (restarted) anim.nuRad = o.nu0Rad;
  const nuBeforeRad = anim.nuRad;
  const step = ConservationLawsModel.advanceTrueAnomalyByTime({
    nuRad: anim.nuRad,
    ecc: o.ecc,
    pAu: o.pAu,
    hAbsAu2Yr: o.hAbsAu2Yr,
    muAu3Yr2: o.muAu3Yr2,
    dtYr: anim.characteristicYr / STEPS_PER_ORBIT,
    nuMax: anim.nuMax
  });
  anim.nuRad = step.nuRad;
  renderBody();
  // The trail shows the arc this Step covered, recorded as just finished, so it stays drawn without animation and under
  // reduced motion. Clearing first keeps the history in time order, since a Play frame can be newer than
  // now - STEP_TRAIL_AGE_MS. An open orbit that restarted jumped back to its start, so it draws no trail.
  clearTrail();
  if (!restarted) {
    const nowMs = performance.now();
    trailHistory.push({ tMs: nowMs - STEP_TRAIL_AGE_MS, nuRad: nuBeforeRad }, { tMs: nowMs, nuRad: anim.nuRad });
    renderTrail(nowMs);
  }
  if (step.stopped) setLiveRegionText(status, leftViewMessage(prefersReducedMotion));
  // Without this the status would still say the body has left the view while it moves again.
  else if (restarted) setLiveRegionText(status, "Back to the start.");
  // Without this the status would still read "Playing." with the body stopped.
  else if (wasPlaying) setLiveRegionText(status, "Paused.");
}

function renderControlValues() {
  massValue.textContent = formatNumber(controls.massSolar, 2);
  r0Value.textContent = formatNumber(controls.r0Au, 2);
  speedValue.textContent = formatSpeedFactor(controls.speedFactor);
  directionValue.textContent = String(Math.round(controls.directionDeg));
  // The mass and r0 sliders' native values are log10, and the speed slider snaps an exact Escape to
  // 1.41, so without these a screen reader announces a number the student did not set.
  massSlider.setAttribute("aria-valuetext", `${formatNumber(controls.massSolar, 2)} solar masses`);
  r0Slider.setAttribute("aria-valuetext", `${formatNumber(controls.r0Au, 2)} AU`);
  speedSlider.setAttribute("aria-valuetext", `${formatSpeedFactor(controls.speedFactor)} times circular speed`);
  directionSlider.setAttribute("aria-valuetext", `${Math.round(controls.directionDeg)} degrees from tangential`);
}

function recomputeOrbit() {
  stopAnimation();
  clearTrail();
  orbit = ConservationLawsModel.initialOrbit(controls);
  renderControlValues();

  const o = validOrbit();
  if (!o) {
    orbitTypeValue.textContent = formatOrbitType("invalid");
    for (const el of [eccValue, kValue, uValue, epsValue, hValue, vKmSValue, rpAuValue]) el.textContent = "—";
    orbitPath.setAttribute("d", "");
    velocityLine.style.display = "none";
    viewRadiusAuValue.textContent = "—";
    anim.characteristicYr = Number.NaN;
    renderTimeScale();
    stopAnimation();
    hideEnergyInstrument();
    renderPotentialPlot();
    renderPotentialView();
    return;
  }

  const rMaxAu = viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au });
  anim.scalePxPerAu = VIEW_RADIUS_PX / rMaxAu;
  // The drawing zooms to fit, so a change of mass or r0 can leave it looking the same; the caption states the scale.
  viewRadiusAuValue.textContent = formatNumber(rMaxAu, 2);
  // Periapsis is the fastest point on the drawn path, so it fixes the arrow scale for the whole orbit.
  anim.arrow = arrowScale(o.vPeriAuYr, anim.scalePxPerAu);
  anim.nuRad = o.nu0Rad;

  if (o.orbitType === "radial") {
    anim.nuMax = 0;
    const start = toSvg(o.rVecAu.xAu, o.rVecAu.yAu, CENTER, anim.scalePxPerAu);
    orbitPath.setAttribute("d", `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${CENTER.x} ${CENTER.y}`);
  } else {
    const domain = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: o.ecc, pAu: o.pAu, rMaxAu });
    anim.nuMax = domain.nuMax;
    const points = ConservationLawsModel.sampleConicOrbitAu({
      ecc: o.ecc,
      pAu: o.pAu,
      omegaRad: o.omegaRad,
      numPoints: PATH_SAMPLES,
      rMaxAu
    });
    orbitPath.setAttribute("d", buildPathD(points, CENTER, anim.scalePxPerAu));
  }

  // Radial motion does not animate. A bound orbit's time is one lap; an open orbit's is the run from its start
  // to anim.nuMax, the view edge set just above.
  anim.characteristicYr =
    o.orbitType === "radial"
      ? Number.NaN
      : o.ecc < 1
        ? ConservationLawsModel.orbitalPeriodYr({ ecc: o.ecc, pAu: o.pAu, muAu3Yr2: o.muAu3Yr2 })
        : ConservationLawsModel.timeBetweenTrueAnomaliesYr({
            ecc: o.ecc,
            pAu: o.pAu,
            muAu3Yr2: o.muAu3Yr2,
            nuFromRad: o.nu0Rad,
            nuToRad: anim.nuMax
          });
  renderTimeScale();

  orbitTypeValue.textContent = formatOrbitType(o.orbitType);
  eccValue.textContent = formatEccentricity(o.orbitType, o.ecc, 3);
  epsValue.textContent = formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / controls.r0Au);
  hValue.textContent = formatNumber(o.hAbsAu2Yr, 4);
  rpAuValue.textContent = formatPeriapsis(o.orbitType, o.rpAu, 3);

  arrowCaption.hidden = !anim.arrow.toScale;
  arrowDtDays.textContent = anim.arrow.dtDays === null ? "" : String(anim.arrow.dtDays);
  arrowDtUnit.textContent = anim.arrow.dtDays === 1 ? "day" : "days";
  arrowCaptionNotToScale.hidden = anim.arrow.toScale || !(anim.arrow.pxPerAuYr > 0);
  apoCaption.hidden = !(Number.isFinite(o.raAu) && o.raAu > rMaxAu);
  raAuValue.textContent = Number.isFinite(o.raAu) ? formatNumber(o.raAu, 1) : "";

  renderPotentialPlot();
  renderPotentialView();
  renderBody();
  // Not redundant: the call at the top ran canAnimate() against the old orbit. This one re-runs it
  // against the new orbit, so Play's disabled state is right.
  stopAnimation();
}

/**
 * The scale the animation runs at, from anim.characteristicYr, and the caption's time line: "1 s on screen =" for
 * playback or, under reduced motion where Play is disabled, "Each Step =". Radial motion shows neither.
 */
function renderTimeScale() {
  anim.timeScaleYrPerSec = animationTimeScaleYrPerSec(anim.characteristicYr);
  timeScaleValue.textContent = formatTimeScale(anim.timeScaleYrPerSec);
  timeScaleSlowed.hidden = !(anim.timeScaleYrPerSec < DEFAULT_SIM_YEARS_PER_SEC);
  stepDurationValue.textContent =
    anim.characteristicYr > 0 ? formatTimeScale(anim.characteristicYr / STEPS_PER_ORBIT) : "";
  const line = captionTimeLine({ canStep: canStep(), reducedMotion: prefersReducedMotion });
  timeCaption.hidden = line !== "playback";
  stepCaption.hidden = line !== "step";
}

/** Particle, arrow, speed, K and U at the current true anomaly. Runs every animation frame. */
function renderBody() {
  const o = validOrbit();
  if (!o) return;

  let xAu = o.rVecAu.xAu;
  let yAu = o.rVecAu.yAu;
  let vAuYr = o.v0AuYr;
  let ux = 0;
  let uy = 0;
  if (o.orbitType !== "radial") {
    const pos = ConservationLawsModel.conicPositionAndTangentAu({
      ecc: o.ecc,
      pAu: o.pAu,
      omegaRad: o.omegaRad,
      nuRad: anim.nuRad
    });
    if (!pos) return;
    xAu = pos.xAu;
    yAu = pos.yAu;
    vAuYr = ConservationLawsModel.instantaneousSpeedAuPerYr({
      muAu3Yr2: o.muAu3Yr2,
      hAbsAu2Yr: o.hAbsAu2Yr,
      ecc: o.ecc,
      nuRad: anim.nuRad
    });
    // initialOrbit admits only counter-clockwise starts, so increasing nu is the direction of motion.
    const mag = Math.hypot(pos.dxAu, pos.dyAu);
    if (mag > 0) {
      ux = pos.dxAu / mag;
      uy = pos.dyAu / mag;
    }
  }

  const p = toSvg(xAu, yAu, CENTER, anim.scalePxPerAu);
  particle.setAttribute("cx", p.x.toFixed(2));
  particle.setAttribute("cy", p.y.toFixed(2));

  const lengthPx = vAuYr * anim.arrow.pxPerAuYr;
  velocityLine.style.display = lengthPx > 0 ? "" : "none";
  velocityLine.setAttribute("x1", p.x.toFixed(2));
  velocityLine.setAttribute("y1", p.y.toFixed(2));
  // SVG y points down, so the tangent's y component flips.
  velocityLine.setAttribute("x2", (p.x + ux * lengthPx).toFixed(2));
  velocityLine.setAttribute("y2", (p.y - uy * lengthPx).toFixed(2));

  const energy = ConservationLawsModel.specificEnergyPartsAu2Yr2({
    rAu: Math.hypot(xAu, yAu),
    vAuYr,
    muAu3Yr2: o.muAu3Yr2
  });
  vKmSValue.textContent = formatNumber(TwoBodyAnalytic.speedKmPerSFromAuPerYr(vAuYr), 3);
  kValue.textContent = formatNumber(energy.kAu2Yr2, 4);
  uValue.textContent = formatNumber(energy.uAu2Yr2, 4);
  renderEnergyInstrument(o, Math.hypot(xAu, yAu), energy);
}

/** The plot's curve, allowed region, lines and turning-point labels. Runs when the orbit or the plot's box changes. */
function renderPotentialPlot() {
  const o = validOrbit();
  const box = ueffPlot.getBoundingClientRect();
  ueffPlot.setAttribute("viewBox", `0 0 ${Math.max(1, box.width).toFixed(0)} ${Math.max(1, box.height).toFixed(0)}`);
  ueff = null;
  if (o && o.orbitType !== "radial") {
    const rc = ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
    ueff = effectivePotentialPlot({
      uEff: (rAu) => uEffAt(o, rAu),
      epsAu2Yr2: o.epsAu2Yr2,
      uEffMinAu2Yr2: uEffAt(o, rc),
      rpAu: o.rpAu,
      raAu: o.raAu,
      rMaxAu: viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au }),
      widthPx: box.width,
      heightPx: box.height
    });
  }
  for (const el of [ueffCurve, ueffAllowed, ueffZero, ueffEps, ueffDrop, ueffDot]) el.style.display = ueff ? "" : "none";
  ueffRpLabel.hidden = !ueff;
  ueffRaLabel.hidden = !ueff || ueff.raXPx === null;
  ueffPlot.setAttribute(
    "aria-label",
    o
      ? `Effective potential against distance. ${turningPointsText({ orbitType: o.orbitType, rpAu: o.rpAu, raAu: o.raAu })}`
      : "Effective potential against distance."
  );
  if (!ueff) return;
  ueffCurve.setAttribute("d", ueff.curveD);
  ueffAllowed.setAttribute("d", ueff.allowedD);
  setLine(ueffZero, 0, ueff.zeroYPx, box.width, ueff.zeroYPx);
  setLine(ueffEps, 0, ueff.epsYPx, box.width, ueff.epsYPx);
  ueffRpLabel.style.left = `${ueff.rpXPx.toFixed(1)}px`;
  if (ueff.raXPx !== null) ueffRaLabel.style.left = `${ueff.raXPx.toFixed(1)}px`;
}

/** Energy bar, and the plot's dot and drop line, at the body's current r. Runs every animation frame. */
function renderEnergyInstrument(o: ValidOrbit, rAu: number, energy: { kAu2Yr2: number; uAu2Yr2: number }) {
  const bar = energyBarLayout({
    kAu2Yr2: energy.kAu2Yr2,
    uAu2Yr2: energy.uAu2Yr2,
    epsAu2Yr2: o.epsAu2Yr2,
    // The deepest potential on the orbit is at periapsis; NaN for radial motion (r_p = 0), which hides the bar.
    uDeepestAu2Yr2: ConservationLawsModel.specificEnergyPartsAu2Yr2({ rAu: o.rpAu, vAuYr: 0, muAu3Yr2: o.muAu3Yr2 }).uAu2Yr2,
    widthPx: energyBarTracks.clientWidth
  });
  for (const el of [energyBarU, energyBarK, energyBarZero, energyBarEps]) el.style.display = bar ? "" : "none";
  if (bar) {
    placeFill(energyBarU, bar.uBar.xPx, bar.uBar.widthPx);
    placeFill(energyBarK, bar.kBar.xPx, bar.kBar.widthPx);
    energyBarZero.style.left = `${bar.zeroPx.toFixed(1)}px`;
    energyBarEps.style.left = `${bar.epsPx.toFixed(1)}px`;
  }

  // Past the drawn window (a bound orbit reaching beyond the view) the dot and drop line would land off the plot, since
  // both SVGs overflow visibly; hide them there, as the stage caption says the orbit leaves the view (physics review).
  const inView = rAu <= viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au }) * (1 + 1e-9);
  for (const el of [ueffDot, ueffDrop]) el.style.display = ueff && inView ? "" : "none";
  for (const el of [potentialBody, potentialDrop]) el.style.display = profile && inView ? "" : "none";

  if (ueff) {
    const x = ueff.xPx(rAu);
    ueffDot.setAttribute("cx", x.toFixed(2));
    ueffDot.setAttribute("cy", ueff.epsYPx.toFixed(2));
    setLine(ueffDrop, x, ueff.epsYPx, x, ueff.yPx(uEffAt(o, rAu)));
    ueffDrop.dataset.radialKinetic = String(
      ConservationLawsModel.radialKineticAu2Yr2({ rAu, hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2, epsAu2Yr2: o.epsAu2Yr2 })
    );
  }

  if (profile) {
    const px = profile.xPx(rAu);
    potentialBody.setAttribute("cx", px.toFixed(2));
    potentialBody.setAttribute("cy", profile.epsYPx.toFixed(2));
    setLine(potentialDrop, px, profile.epsYPx, px, profile.yPx(uEffAt(o, rAu)));
  }
}

/** The Potential view's profile for the current orbit. A hidden panel has no box, so this runs again on show. */
function renderPotentialView() {
  const o = validOrbit();
  const box = potentialSvg.getBoundingClientRect();
  profile = null;
  if (o && o.orbitType !== "radial" && box.width > 0) {
    const rc = ConservationLawsModel.circularOrbitRadiusAu({ hAbsAu2Yr: o.hAbsAu2Yr, muAu3Yr2: o.muAu3Yr2 });
    profile = potentialProfile({
      uEff: (rAu) => uEffAt(o, rAu),
      epsAu2Yr2: o.epsAu2Yr2,
      uEffMinAu2Yr2: uEffAt(o, rc),
      rpAu: o.rpAu,
      raAu: o.raAu,
      rMaxAu: viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au }),
      widthPx: box.width,
      heightPx: box.height
    });
  }
  for (const el of [potentialCurve, potentialAllowed, potentialZero, potentialEps, potentialDrop, potentialBody]) {
    el.style.display = profile ? "" : "none";
  }
  potentialRpLabel.hidden = !profile;
  potentialRaLabel.hidden = !profile || profile.raXPx === null;
  potentialEpsLabel.hidden = !profile;
  if (!profile) return;
  potentialSvg.setAttribute("viewBox", `0 0 ${box.width.toFixed(0)} ${box.height.toFixed(0)}`);
  potentialCurve.setAttribute("d", profile.curveD);
  potentialAllowed.setAttribute("d", profile.allowedD);
  setLine(potentialZero, 0, profile.zeroYPx, box.width, profile.zeroYPx);
  setLine(potentialEps, 0, profile.epsYPx, box.width, profile.epsYPx);
  potentialSun.setAttribute("cx", (box.width / 2).toFixed(2));
  potentialRpLabel.style.left = `${profile.rpXPx.toFixed(1)}px`;
  if (profile.raXPx !== null) potentialRaLabel.style.left = `${profile.raXPx.toFixed(1)}px`;
  potentialEpsLabel.style.left = `${(box.width - 12).toFixed(1)}px`;
  potentialEpsLabel.style.top = `${(profile.epsYPx - 12).toFixed(1)}px`;
}

function syncStageView() {
  const view = viewPotentialTab.getAttribute("aria-selected") === "true" ? "potential" : "observatory";
  if (stageSection.dataset.view === view) return;
  stageSection.dataset.view = view;
  renderPotentialView();
  renderBody();
  const o = validOrbit();
  setLiveRegionText(
    status,
    view === "potential"
      ? `Potential view. ${o ? turningPointsText({ orbitType: o.orbitType, rpAu: o.rpAu, raAu: o.raAu }) : ""}`.trim()
      : "Observatory view."
  );
}

function hideEnergyInstrument() {
  for (const el of [energyBarU, energyBarK, energyBarZero, energyBarEps]) el.style.display = "none";
}

function announce() {
  const o = validOrbit();
  setLiveRegionText(
    status,
    orbitAnnouncement({
      orbitType: orbit.orbitType,
      ecc: o ? o.ecc : Number.NaN,
      epsAu2Yr2: o ? o.epsAu2Yr2 : Number.NaN
    })
  );
}

function syncSlidersToControls() {
  massSlider.value = String(valueToLogSlider(controls.massSolar));
  r0Slider.value = String(valueToLogSlider(controls.r0Au));
  // The browser snaps these to the slider step for display; `controls` keeps the exact value.
  speedSlider.value = String(controls.speedFactor);
  directionSlider.value = String(controls.directionDeg);
}

function setPresetPressed(name: PresetName | null) {
  for (const btn of presetButtons) {
    btn.setAttribute("aria-pressed", btn.dataset.preset === name ? "true" : "false");
  }
}

function applyPreset(name: PresetName) {
  const preset = PRESETS[name];
  controls.speedFactor = preset.speedFactor;
  if (preset.directionDeg !== null) controls.directionDeg = preset.directionDeg;
  syncSlidersToControls();
  recomputeOrbit();
  setPresetPressed(name);
  announce();
}

const sliderReaders: Array<[HTMLInputElement, () => void]> = [
  [massSlider, () => { controls.massSolar = clamp(logSliderToValue(Number(massSlider.value)), 0.1, 10); }],
  [r0Slider, () => { controls.r0Au = clamp(logSliderToValue(Number(r0Slider.value)), 0.1, 10); }],
  [speedSlider, () => { controls.speedFactor = clamp(Number(speedSlider.value), 0, 2.5); }],
  [directionSlider, () => { controls.directionDeg = clamp(Number(directionSlider.value), -85, 85); }]
];

for (const [slider, readInto] of sliderReaders) {
  slider.addEventListener("input", () => {
    readInto();
    setPresetPressed(null);
    recomputeOrbit();
  });
  // Announce once the value settles: `input` fires on every drag step, `change` once.
  slider.addEventListener("change", announce);
}

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const name = button.dataset.preset;
    if (name && name in PRESETS) applyPreset(name as PresetName);
  });
}

playButton.addEventListener("click", startAnimation);
pauseButton.addEventListener("click", () => {
  stopAnimation();
  setLiveRegionText(status, "Paused.");
});
stepButton.addEventListener("click", stepBody);
resetButton.addEventListener("click", resetAnimation);

/** One row from exact controls, through the same derivation as the screen. */
function stationRow(caseLabel: string, c: Controls) {
  const o = ConservationLawsModel.initialOrbit(c);
  const base = {
    case: caseLabel,
    mSolar: formatNumber(c.massSolar, 3),
    r0Au: formatNumber(c.r0Au, 3),
    speedFactor: formatSpeedFactor(c.speedFactor),
    directionDeg: String(Math.round(c.directionDeg)),
    orbitType: formatOrbitType(o.orbitType)
  };
  if (o.orbitType === "invalid") return { ...base, e: "—", eps: "—", h: "—", rp: "—" };
  return {
    ...base,
    e: formatEccentricity(o.orbitType, o.ecc, 3),
    eps: formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / c.r0Au),
    h: formatNumber(o.hAbsAu2Yr, 4),
    rp: formatPeriapsis(o.orbitType, o.rpAu, 3)
  };
}

function exportResults(): ExportPayloadV1 {
  const o = validOrbit();
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mode", value: runtime.mode },
      { name: "Central mass M (Msun)", value: formatNumber(controls.massSolar, 4) },
      { name: "Initial radius r_0 (AU)", value: formatNumber(controls.r0Au, 4) },
      { name: "Speed factor v/v_circ", value: formatNumber(controls.speedFactor, 6) },
      { name: "Direction from tangential (deg, + outward)", value: String(Math.round(controls.directionDeg)) }
    ],
    readouts: [
      { name: "Orbit type", value: formatOrbitType(orbit.orbitType) },
      { name: "Eccentricity e", value: formatEccentricity(orbit.orbitType, o ? o.ecc : Number.NaN, 6) },
      { name: "Specific kinetic energy K (AU^2/yr^2)", value: kValue.textContent ?? "—" },
      { name: "Specific potential energy U (AU^2/yr^2)", value: uValue.textContent ?? "—" },
      { name: "Specific energy eps (AU^2/yr^2)", value: o ? formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / controls.r0Au) : "—" },
      { name: "Specific angular momentum |h| (AU^2/yr)", value: o ? formatNumber(o.hAbsAu2Yr, 8) : "—" },
      { name: "Periapsis r_p (AU)", value: formatPeriapsis(orbit.orbitType, o ? o.rpAu : Number.NaN, 6) },
      { name: "Speed v (km/s)", value: vKmSValue.textContent ?? "—" }
    ],
    notes: [
      "Teaching units: AU / yr / Msun with G = 4*pi^2 AU^3/(yr^2 Msun).",
      "Bound or unbound follows the sign of eps = K + U; the conic shape follows the eccentricity.",
      "Paths reaching beyond 6 r_0 are clipped to the plotted window, which stays between 1.5 r_0 and 50 AU."
    ]
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
        // Typeset by renderMath(modal) each time the dialog opens (runtime demoModes.ts:389).
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Start at $M = 1\\,M_{\\odot}$, $r_0 = 1$ AU, $v/v_{\\rm circ} = 1$, direction $0^{\\circ}$: a circular orbit.",
          "Press Escape to set $v/v_{\\rm circ} = \\sqrt{2}$ exactly and watch $\\varepsilon$ read 0.",
          "Press Play on the Elliptical preset: $K$ and $U$ change while $\\varepsilon = K + U$ does not.",
          "Press Step to move the body one sixteenth of an orbit at a time.",
          "Tilt the direction to lower $|h|$ at the same speed and watch $r_p$ shrink."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Conservation Laws",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Record a circular case (speed factor 1).",
      "Press Escape and record it (speed factor exactly the square root of 2).",
      "Record a hyperbolic case (speed factor above 1.42) and compare the specific energy."
    ],
    // ASCII on purpose: the runtime writes these labels into the CSV header (decision D2).
    columns: [
      { key: "case", label: "Case" },
      { key: "mSolar", label: "M (Msun)" },
      { key: "r0Au", label: "r0 (AU)" },
      { key: "speedFactor", label: "v/v_circ" },
      { key: "directionDeg", label: "dir (deg)" },
      { key: "orbitType", label: "type" },
      { key: "e", label: "e" },
      { key: "eps", label: "eps (AU^2/yr^2)" },
      { key: "h", label: "|h| (AU^2/yr)" },
      { key: "rp", label: "r_p (AU)" }
    ],
    getSnapshotRow: () => stationRow("Snapshot", { ...controls }),
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add the four preset cases (1 solar mass, 1 AU)",
        getRows: () =>
          (Object.keys(PRESETS) as PresetName[]).map((name) =>
            stationRow(PRESETS[name].label, {
              massSolar: 1,
              r0Au: 1,
              speedFactor: PRESETS[name].speedFactor,
              // Reference cases start tangential, whatever direction the screen shows.
              directionDeg: PRESETS[name].directionDeg ?? 0
            })
          )
      }
    ]
  }
});

demoModes.bindButtons({ helpButton, stationButton: stationModeButton });

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) => setLiveRegionText(status, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."));
});

syncSlidersToControls();
recomputeOrbit();
// The plot is sized to its box, and the box is only known after layout; redraw whenever it changes.
new ResizeObserver(() => {
  renderPotentialPlot();
  renderBody();
}).observe(ueffPlot);
initTabs(stageSection);
// initTabs has already updated aria-selected by the time these run: its listeners were added first.
stageViews.addEventListener("click", syncStageView);
stageViews.addEventListener("keydown", syncStageView);
new ResizeObserver(() => {
  renderPotentialView();
  renderBody();
}).observe(potentialSvg);
if (prefersReducedMotion) {
  setLiveRegionText(status, "Reduced motion is enabled; use Step to move the body.");
}
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);
