import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ConservationLawsModel, TwoBodyAnalytic } from "@cosmic/physics";
import {
  animationTimeScaleYrPerSec,
  arrowScale,
  buildPathD,
  clamp,
  DEFAULT_SIM_YEARS_PER_SEC,
  formatEccentricity,
  formatNumber,
  formatOrbitType,
  formatPeriapsis,
  formatSpecificEnergy,
  formatSpeedFactor,
  formatTimeScale,
  logSliderToValue,
  orbitAnnouncement,
  toSvg,
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

const CENTER = { x: 300, y: 300 };
const VIEW_RADIUS_PX = 250;
const PATH_SAMPLES = 720;
/** Step moves the body this fraction of anim.characteristicYr per press: sixteen presses make one lap. */
const STEPS_PER_ORBIT = 16;
const LEFT_VIEW_MESSAGE = "The body has left the view. Press Play to run it again.";

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

function validOrbit(): ValidOrbit | null {
  return orbit.orbitType === "invalid" ? null : orbit;
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
  if (o.ecc >= 1 && anim.nuRad >= anim.nuMax - 1e-9) anim.nuRad = o.nu0Rad;

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
    renderBody();
    if (step.stopped) {
      stopAnimation();
      setLiveRegionText(status, LEFT_VIEW_MESSAGE);
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
  if (o.ecc >= 1 && anim.nuRad >= anim.nuMax - 1e-9) anim.nuRad = o.nu0Rad;
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
  if (step.stopped) setLiveRegionText(status, LEFT_VIEW_MESSAGE);
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
  orbit = ConservationLawsModel.initialOrbit(controls);
  renderControlValues();

  const o = validOrbit();
  if (!o) {
    orbitTypeValue.textContent = formatOrbitType("invalid");
    for (const el of [eccValue, kValue, uValue, epsValue, hValue, vKmSValue, rpAuValue]) el.textContent = "—";
    orbitPath.setAttribute("d", "");
    velocityLine.style.display = "none";
    anim.characteristicYr = Number.NaN;
    renderTimeScale();
    stopAnimation();
    return;
  }

  const rMaxAu = viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au });
  anim.scalePxPerAu = VIEW_RADIUS_PX / rMaxAu;
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

  renderBody();
  // Not redundant: the call at the top ran canAnimate() against the old orbit. This one re-runs it
  // against the new orbit, so Play's disabled state is right.
  stopAnimation();
}

/** The caption's "1 s on screen =" line, and the scale the animation runs at, from anim.characteristicYr. */
function renderTimeScale() {
  anim.timeScaleYrPerSec = animationTimeScaleYrPerSec(anim.characteristicYr);
  timeScaleValue.textContent = formatTimeScale(anim.timeScaleYrPerSec);
  timeScaleSlowed.hidden = !(anim.timeScaleYrPerSec < DEFAULT_SIM_YEARS_PER_SEC);
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
if (prefersReducedMotion) {
  setLiveRegionText(status, "Reduced motion is enabled; use Step to move the body.");
}
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);
