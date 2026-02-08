import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ConservationLawsModel, TwoBodyAnalytic } from "@cosmic/physics";

const massSliderEl = document.querySelector<HTMLInputElement>("#massSlider");
const massValueEl = document.querySelector<HTMLSpanElement>("#massValue");
const r0SliderEl = document.querySelector<HTMLInputElement>("#r0Slider");
const r0ValueEl = document.querySelector<HTMLSpanElement>("#r0Value");
const speedFactorEl = document.querySelector<HTMLInputElement>("#speedFactor");
const speedValueEl = document.querySelector<HTMLSpanElement>("#speedValue");
const directionDegEl = document.querySelector<HTMLInputElement>("#directionDeg");
const directionValueEl = document.querySelector<HTMLSpanElement>("#directionValue");

const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.preset[data-preset]'));

const playEl = document.querySelector<HTMLButtonElement>("#play");
const pauseEl = document.querySelector<HTMLButtonElement>("#pause");
const resetEl = document.querySelector<HTMLButtonElement>("#reset");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");

const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const orbitPathEl = document.querySelector<SVGPathElement>("#orbitPath");
const particleEl = document.querySelector<SVGCircleElement>("#particle");
const velocityLineEl = document.querySelector<SVGLineElement>("#velocityLine");

const orbitTypeEl = document.querySelector<HTMLSpanElement>("#orbitType");
const eccEl = document.querySelector<HTMLSpanElement>("#ecc");
const epsEl = document.querySelector<HTMLSpanElement>("#eps");
const hEl = document.querySelector<HTMLSpanElement>("#h");
const vKmSEl = document.querySelector<HTMLSpanElement>("#vKmS");
const rpAuEl = document.querySelector<HTMLSpanElement>("#rpAu");

if (
  !massSliderEl ||
  !massValueEl ||
  !r0SliderEl ||
  !r0ValueEl ||
  !speedFactorEl ||
  !speedValueEl ||
  !directionDegEl ||
  !directionValueEl ||
  !playEl ||
  !pauseEl ||
  !resetEl ||
  !stationModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !orbitPathEl ||
  !particleEl ||
  !velocityLineEl ||
  !orbitTypeEl ||
  !eccEl ||
  !epsEl ||
  !hEl ||
  !vKmSEl ||
  !rpAuEl
) {
  throw new Error("Missing required DOM elements for conservation-laws demo.");
}

const massSlider = massSliderEl;
const massValue = massValueEl;
const r0Slider = r0SliderEl;
const r0Value = r0ValueEl;
const speedFactor = speedFactorEl;
const speedValue = speedValueEl;
const directionDeg = directionDegEl;
const directionValue = directionValueEl;
const playButton = playEl;
const pauseButton = pauseEl;
const resetButton = resetEl;
const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

const orbitPath = orbitPathEl;
const particle = particleEl;
const velocityLine = velocityLineEl;

const orbitTypeValue = orbitTypeEl;
const eccValue = eccEl;
const epsValue = epsEl;
const hValue = hEl;
const vKmSValue = vKmSEl;
const rpAuValue = rpAuEl;

const CENTER = { x: 300, y: 300 };
const VIEW_RADIUS_PX = 250;
const PATH_SAMPLES = 720;

// Teaching time scale: simulation time in years per real second.
// Calibrated so that a circular orbit at 1 AU around 1 Msun completes in ~3 s.
const SIM_YEARS_PER_SEC = 1 / 3;

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:conservation-laws:mode",
  url: new URL(window.location.href)
});

const state: {
  massSolar: number;
  r0Au: number;
  speedFactor: number;
  directionDeg: number;
  playing: boolean;
  animationId: number | null;
} = {
  massSolar: 1,
  r0Au: 1,
  speedFactor: 1,
  directionDeg: 0,
  playing: false,
  animationId: null
};

const anim: {
  nuRad: number;
  startNuRad: number;
  nuMin: number;
  nuMax: number;
  dir: number;

  orbitType: "invalid" | "circular" | "elliptical" | "parabolic" | "hyperbolic";
  ecc: number;
  pAu: number;
  omegaRad: number;
  hAbsAu2Yr: number;
  epsAu2Yr2: number;
  muAu3Yr2: number;
  vCirc0AuYr: number;
  rpAu: number;

  rMaxAu: number;
  scalePxPerAu: number;
  lastTimeMs: number;
} = {
  nuRad: 0,
  startNuRad: 0,
  nuMin: 0,
  nuMax: 2 * Math.PI,
  dir: 1,

  orbitType: "invalid",
  ecc: NaN,
  pAu: NaN,
  omegaRad: NaN,
  hAbsAu2Yr: NaN,
  epsAu2Yr2: NaN,
  muAu3Yr2: NaN,
  vCirc0AuYr: NaN,
  rpAu: NaN,

  rMaxAu: 3,
  scalePxPerAu: 1,
  lastTimeMs: 0
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function logSliderToValue(sliderValue: number): number {
  return Math.pow(10, sliderValue);
}

function valueToLogSlider(value: number): number {
  return Math.log10(value);
}

function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1));
  return value.toFixed(digits);
}

function formatOrbitType(type: string): string {
  switch (type) {
    case "circular":
      return "circular";
    case "elliptical":
      return "elliptical";
    case "parabolic":
      return "parabolic (escape)";
    case "hyperbolic":
      return "hyperbolic";
    default:
      return "invalid";
  }
}

function toSvg(args: { xAu: number; yAu: number }, scalePxPerAu: number) {
  return {
    x: CENTER.x + args.xAu * scalePxPerAu,
    y: CENTER.y - args.yAu * scalePxPerAu
  };
}

function orbitalRadiusAu(args: { ecc: number; pAu: number; nuRad: number }): number {
  const { ecc, pAu, nuRad } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return NaN;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return NaN;
  if (!Number.isFinite(nuRad)) return NaN;
  const denom = 1 + ecc * Math.cos(nuRad);
  return denom > 0 ? pAu / denom : NaN;
}

function conicPositionAndTangentAu(args: {
  ecc: number;
  pAu: number;
  omegaRad: number;
  nuRad: number;
}): { xAu: number; yAu: number; dxAu: number; dyAu: number } | null {
  const { ecc, pAu, omegaRad, nuRad } = args;
  if (!Number.isFinite(ecc) || ecc < 0) return null;
  if (!Number.isFinite(pAu) || !(pAu > 0)) return null;
  if (!Number.isFinite(omegaRad)) return null;
  if (!Number.isFinite(nuRad)) return null;

  const cosNu = Math.cos(nuRad);
  const sinNu = Math.sin(nuRad);
  const denom = 1 + ecc * cosNu;
  if (!(denom > 0)) return null;

  const r = pAu / denom;
  const xOrb = r * cosNu;
  const yOrb = r * sinNu;

  // Derivative wrt nu for tangent direction.
  const drDnu = (pAu * ecc * sinNu) / (denom * denom);
  const dxOrb = drDnu * cosNu - r * sinNu;
  const dyOrb = drDnu * sinNu + r * cosNu;

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);

  const xAu = xOrb * cosO - yOrb * sinO;
  const yAu = xOrb * sinO + yOrb * cosO;
  const dxAu = dxOrb * cosO - dyOrb * sinO;
  const dyAu = dxOrb * sinO + dyOrb * cosO;
  return { xAu, yAu, dxAu, dyAu };
}

function instantaneousSpeedAuPerYr(args: { muAu3Yr2: number; hAbsAu2Yr: number; ecc: number; nuRad: number }): number {
  const { muAu3Yr2, hAbsAu2Yr, ecc, nuRad } = args;
  if (!Number.isFinite(muAu3Yr2) || !(muAu3Yr2 > 0)) return NaN;
  if (!Number.isFinite(hAbsAu2Yr) || !(hAbsAu2Yr > 0)) return NaN;
  if (!Number.isFinite(ecc) || ecc < 0) return NaN;
  if (!Number.isFinite(nuRad)) return NaN;

  // v = (mu / h) * sqrt(1 + 2e cos(nu) + e^2)
  const q = 1 + 2 * ecc * Math.cos(nuRad) + ecc * ecc;
  if (!(q >= 0)) return NaN;
  return (muAu3Yr2 / hAbsAu2Yr) * Math.sqrt(Math.max(0, q));
}

function buildPathD(points: { xAu: number; yAu: number }[], scalePxPerAu: number): string {
  if (points.length === 0) return "";
  const start = toSvg(points[0], scalePxPerAu);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const p = toSvg(points[i], scalePxPerAu);
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}

function stopAnimation() {
  state.playing = false;
  if (state.animationId !== null) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
  playButton.disabled = false;
  pauseButton.disabled = true;
}

function resetAnimation() {
  stopAnimation();
  anim.dir = 1;
  anim.nuRad = anim.startNuRad;
  renderParticleAndVelocity();
}

function startAnimation() {
  if (prefersReducedMotion) {
    setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
    return;
  }
  if (state.playing) return;
  if (!Number.isFinite(anim.ecc) || !Number.isFinite(anim.pAu) || !Number.isFinite(anim.omegaRad)) return;
  if (!Number.isFinite(anim.nuMin) || !Number.isFinite(anim.nuMax)) return;
  if (anim.orbitType === "invalid") return;

  state.playing = true;
  playButton.disabled = true;
  pauseButton.disabled = false;

  anim.lastTimeMs = typeof performance !== "undefined" ? performance.now() : Date.now();

  function tick(nowMs: number) {
    if (!state.playing) return;
    const dt = (nowMs - anim.lastTimeMs) / 1000;
    anim.lastTimeMs = nowMs;

    // Advance using Kepler’s 2nd law (constant areal velocity):
    // h = r^2 d(nu)/dt  =>  d(nu)/dt = h/r^2.
    let dtRemain = Math.min(dt, 0.1);
    let stopped = false;
    while (dtRemain > 1e-9 && !stopped) {
      const dtStep = Math.min(dtRemain, 0.02);
      const rAu = orbitalRadiusAu({ ecc: anim.ecc, pAu: anim.pAu, nuRad: anim.nuRad });
      const nuSpeedRadPerYr =
        Number.isFinite(anim.hAbsAu2Yr) && Number.isFinite(rAu) && rAu > 0 ? anim.hAbsAu2Yr / (rAu * rAu) : 0;
      const step = ConservationLawsModel.advanceTrueAnomalyRad({
        nuRad: anim.nuRad,
        ecc: anim.ecc,
        nuMin: anim.nuMin,
        nuMax: anim.nuMax,
        dir: anim.dir,
        dtSec: dtStep,
        nuSpeedRadPerSec: nuSpeedRadPerYr * SIM_YEARS_PER_SEC
      });
      anim.nuRad = step.nuRad;
      anim.dir = step.dir;
      stopped = step.stopped;
      dtRemain -= dtStep;
    }

    renderParticleAndVelocity();
    if (stopped) {
      stopAnimation();
      return;
    }
    state.animationId = requestAnimationFrame(tick);
  }

  state.animationId = requestAnimationFrame(tick);
}

function setPreset(name: string) {
  switch (name) {
    case "circular":
      state.speedFactor = 1;
      state.directionDeg = 0;
      break;
    case "elliptical":
      state.speedFactor = 0.75;
      state.directionDeg = 0;
      break;
    case "escape":
      state.speedFactor = Math.SQRT2;
      state.directionDeg = 0;
      break;
    case "hyperbolic":
      state.speedFactor = 1.8;
      state.directionDeg = 0;
      break;
    default:
      return;
  }

  speedFactor.value = String(state.speedFactor);
  directionDeg.value = String(state.directionDeg);
  stopAnimation();
  recomputeOrbit();
}

function recomputeOrbit() {
  const massSolar = clamp(logSliderToValue(Number(massSlider.value)), 0.1, 10);
  const r0Au = clamp(logSliderToValue(Number(r0Slider.value)), 0.1, 10);
  const speedFactorValue = clamp(Number(speedFactor.value), 0, 2.5);
  const directionDegValue = clamp(Number(directionDeg.value), -85, 85);

  state.massSolar = massSolar;
  state.r0Au = r0Au;
  state.speedFactor = speedFactorValue;
  state.directionDeg = directionDegValue;

  massValue.textContent = `${formatNumber(massSolar, 2)} Msun`;
  r0Value.textContent = `${formatNumber(r0Au, 2)} AU`;
  speedValue.textContent = `${formatNumber(speedFactorValue, 2)}x`;
  directionValue.textContent = `${Math.round(directionDegValue)} deg`;

  anim.muAu3Yr2 = TwoBodyAnalytic.muAu3Yr2FromMassSolar(massSolar);
  anim.vCirc0AuYr = TwoBodyAnalytic.circularSpeedAuPerYr({ muAu3Yr2: anim.muAu3Yr2, rAu: r0Au });
  const v0AuYr = speedFactorValue * anim.vCirc0AuYr;

  const init = ConservationLawsModel.initialStateAuYr({
    r0Au,
    speedAuYr: v0AuYr,
    directionDeg: directionDegValue
  });

  const elements = init.rVecAu && init.vVecAuYr ? TwoBodyAnalytic.orbitElementsFromStateAuYr({
    rVecAu: init.rVecAu,
    vVecAuYr: init.vVecAuYr,
    muAu3Yr2: anim.muAu3Yr2
  }) : { orbitType: "invalid" as const };

  if (elements.orbitType === "invalid") {
    anim.orbitType = "invalid";
    anim.ecc = NaN;
    anim.pAu = NaN;
    anim.omegaRad = NaN;
    anim.hAbsAu2Yr = NaN;
    anim.rpAu = NaN;
    orbitTypeValue.textContent = "invalid";
    eccValue.textContent = "—";
    epsValue.textContent = "—";
    hValue.textContent = "—";
    vKmSValue.textContent = "—";
    rpAuValue.textContent = "—";
    orbitPath.setAttribute("d", "");
    return;
  }

  anim.orbitType = elements.orbitType;
  anim.ecc = elements.ecc;
  anim.pAu = elements.pAu;
  anim.omegaRad = elements.omegaRad;
  anim.hAbsAu2Yr = elements.hAbsAu2Yr;
  anim.epsAu2Yr2 = elements.epsAu2Yr2;
  anim.startNuRad = 0;
  anim.nuRad = anim.startNuRad;

  // View window radius.
  let rMaxAu = 6 * r0Au;
  if (elements.orbitType === "elliptical" || elements.orbitType === "circular") {
    const ra = elements.ecc < 1 ? elements.pAu / (1 - elements.ecc) : rMaxAu;
    rMaxAu = Math.max(ra, r0Au) * 1.1;
  }
  anim.rMaxAu = clamp(rMaxAu, 1.5, 50);
  anim.scalePxPerAu = VIEW_RADIUS_PX / anim.rMaxAu;

  const dom = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: anim.ecc, pAu: anim.pAu, rMaxAu: anim.rMaxAu });
  anim.nuMin = dom.nuMin;
  anim.nuMax = dom.nuMax;

  const rpAu = anim.pAu / (1 + anim.ecc);
  anim.rpAu = rpAu;

  const vAuYr = instantaneousSpeedAuPerYr({
    muAu3Yr2: anim.muAu3Yr2,
    hAbsAu2Yr: anim.hAbsAu2Yr,
    ecc: anim.ecc,
    nuRad: anim.nuRad
  });
  const vKmS = TwoBodyAnalytic.speedKmPerSFromAuPerYr(vAuYr);

  orbitTypeValue.textContent = formatOrbitType(elements.orbitType);
  eccValue.textContent = formatNumber(anim.ecc, 3);
  epsValue.textContent = formatNumber(elements.epsAu2Yr2, 4);
  hValue.textContent = formatNumber(elements.hAbsAu2Yr, 4);
  vKmSValue.textContent = formatNumber(vKmS, 3);
  rpAuValue.textContent = formatNumber(rpAu, 3);

  const points = ConservationLawsModel.sampleConicOrbitAu({
    ecc: anim.ecc,
    pAu: anim.pAu,
    omegaRad: anim.omegaRad,
    numPoints: PATH_SAMPLES,
    rMaxAu: anim.rMaxAu
  });
  orbitPath.setAttribute("d", buildPathD(points, anim.scalePxPerAu));
  renderParticleAndVelocity();
}

function renderParticleAndVelocity() {
  const pos = conicPositionAndTangentAu({
    ecc: anim.ecc,
    pAu: anim.pAu,
    omegaRad: anim.omegaRad,
    nuRad: anim.nuRad
  });
  if (!pos) return;

  const pSvg = toSvg({ xAu: pos.xAu, yAu: pos.yAu }, anim.scalePxPerAu);
  particle.setAttribute("cx", pSvg.x.toFixed(2));
  particle.setAttribute("cy", pSvg.y.toFixed(2));

  const vAuYr = instantaneousSpeedAuPerYr({
    muAu3Yr2: anim.muAu3Yr2,
    hAbsAu2Yr: anim.hAbsAu2Yr,
    ecc: anim.ecc,
    nuRad: anim.nuRad
  });
  const vKmS = TwoBodyAnalytic.speedKmPerSFromAuPerYr(vAuYr);
  vKmSValue.textContent = formatNumber(vKmS, 3);
  const vRatio = Number.isFinite(vAuYr) && Number.isFinite(anim.vCirc0AuYr) && anim.vCirc0AuYr > 0 ? vAuYr / anim.vCirc0AuYr : 1;
  const vLenPx = Math.max(20, Math.min(120, 60 * vRatio));

  // Tangent direction in SVG coordinates (note y flip).
  const dxSvg = pos.dxAu * anim.scalePxPerAu;
  const dySvg = -pos.dyAu * anim.scalePxPerAu;
  const mag = Math.hypot(dxSvg, dySvg);
  const ux = mag > 0 ? (dxSvg / mag) * anim.dir : 0;
  const uy = mag > 0 ? (dySvg / mag) * anim.dir : 0;

  velocityLine.setAttribute("x1", pSvg.x.toFixed(2));
  velocityLine.setAttribute("y1", pSvg.y.toFixed(2));
  velocityLine.setAttribute("x2", (pSvg.x + ux * vLenPx).toFixed(2));
  velocityLine.setAttribute("y2", (pSvg.y + uy * vLenPx).toFixed(2));
}

function exportResults(): ExportPayloadV1 {
  const vAuYr = instantaneousSpeedAuPerYr({
    muAu3Yr2: anim.muAu3Yr2,
    hAbsAu2Yr: anim.hAbsAu2Yr,
    ecc: anim.ecc,
    nuRad: anim.nuRad
  });
  const vKmS = TwoBodyAnalytic.speedKmPerSFromAuPerYr(vAuYr);
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Mode", value: runtime.mode },
      { name: "Central mass M (Msun)", value: formatNumber(state.massSolar, 4) },
      { name: "Initial radius r_0 (AU)", value: formatNumber(state.r0Au, 4) },
      { name: "Speed factor v/v_circ", value: formatNumber(state.speedFactor, 4) },
      { name: "Direction from tangential (deg)", value: String(Math.round(state.directionDeg)) }
    ],
    readouts: [
      { name: "Orbit type", value: formatOrbitType(anim.orbitType) },
      { name: "Eccentricity e", value: formatNumber(anim.ecc, 6) },
      { name: "Specific energy eps (AU^2/yr^2)", value: formatNumber(anim.epsAu2Yr2, 8) },
      { name: "Specific angular momentum |h| (AU^2/yr)", value: formatNumber(anim.hAbsAu2Yr, 8) },
      { name: "Periapsis r_p (AU)", value: formatNumber(anim.rpAu, 8) },
      { name: "Speed v (km/s)", value: formatNumber(vKmS, 6) }
    ],
    notes: [
      "Teaching units: AU / yr / Msun with G = 4*pi^2 AU^3/(yr^2 Msun).",
      "Orbit type is determined by conserved specific energy eps and angular momentum |h|.",
      "For open orbits, the plotted path is clipped to a finite radius window."
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
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Start at M=1, r0=1 AU, v/v_circ=1, direction=0 deg and observe a circular orbit.",
          "Increase v/v_circ to sqrt(2) (escape) and notice eps approaches 0.",
          "Change direction to increase/decrease |h| and watch periapsis change."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Conservation Laws",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Record a circular case (v/v_circ=1).",
      "Record an escape case (v/v_circ=sqrt(2)).",
      "Record a hyperbolic case (v/v_circ>sqrt(2)) and compare eps."
    ],
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
    getSnapshotRow() {
      return {
        case: "Snapshot",
        mSolar: formatNumber(state.massSolar, 3),
        r0Au: formatNumber(state.r0Au, 3),
        speedFactor: formatNumber(state.speedFactor, 3),
        directionDeg: String(Math.round(state.directionDeg)),
        orbitType: formatOrbitType(anim.orbitType),
        e: formatNumber(anim.ecc, 3),
        eps: epsValue.textContent ?? "—",
        h: hValue.textContent ?? "—",
        rp: formatNumber(anim.rpAu, 3)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add reference cases (M=1, r0=1)",
        getRows() {
          const cases = [
            { label: "Circular", speedFactor: 1, directionDeg: 0 },
            { label: "Elliptical", speedFactor: 0.75, directionDeg: 0 },
            { label: "Escape", speedFactor: Math.SQRT2, directionDeg: 0 },
            { label: "Hyperbolic", speedFactor: 1.8, directionDeg: 0 }
          ];
          return cases.map((c) => {
            const mu = TwoBodyAnalytic.muAu3Yr2FromMassSolar(1);
            const vCirc0AuYr = TwoBodyAnalytic.circularSpeedAuPerYr({ muAu3Yr2: mu, rAu: 1 });
            const v0AuYr = c.speedFactor * vCirc0AuYr;
            const init = ConservationLawsModel.initialStateAuYr({
              r0Au: 1,
              speedAuYr: v0AuYr,
              directionDeg: c.directionDeg
            });
            const el = init.rVecAu && init.vVecAuYr ? TwoBodyAnalytic.orbitElementsFromStateAuYr({
              rVecAu: init.rVecAu,
              vVecAuYr: init.vVecAuYr,
              muAu3Yr2: mu
            }) : { orbitType: "invalid" as const };
            const rpAu = el.orbitType === "invalid" ? NaN : el.pAu / (1 + el.ecc);
            return {
              case: c.label,
              mSolar: "1.000",
              r0Au: "1.000",
              speedFactor: formatNumber(c.speedFactor, 3),
              directionDeg: String(c.directionDeg),
              orbitType: formatOrbitType(el.orbitType),
              e: el.orbitType === "invalid" ? "—" : formatNumber(el.ecc, 3),
              eps: el.orbitType === "invalid" ? "—" : formatNumber(el.epsAu2Yr2, 4),
              h: el.orbitType === "invalid" ? "—" : formatNumber(el.hAbsAu2Yr, 4),
              rp: formatNumber(rpAu, 3)
            };
          });
        }
      }
    ]
  }
});

demoModes.bindButtons({ helpButton, stationButton: stationModeButton });

massSlider.value = String(valueToLogSlider(state.massSolar));
r0Slider.value = String(valueToLogSlider(state.r0Au));

massSlider.addEventListener("input", () => {
  stopAnimation();
  recomputeOrbit();
});
r0Slider.addEventListener("input", () => {
  stopAnimation();
  recomputeOrbit();
});
speedFactor.addEventListener("input", () => {
  stopAnimation();
  recomputeOrbit();
});
directionDeg.addEventListener("input", () => {
  stopAnimation();
  recomputeOrbit();
});

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const preset = button.getAttribute("data-preset");
    if (!preset) return;
    setPreset(preset);
  });
}

playButton.addEventListener("click", () => startAnimation());
pauseButton.addEventListener("click", () => stopAnimation());
resetButton.addEventListener("click", () => resetAnimation());

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => {
      setLiveRegionText(status, "Copied results to clipboard.");
    })
    .catch((err) => {
      setLiveRegionText(status, err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.");
    });
});

if (prefersReducedMotion) {
  playButton.disabled = true;
  pauseButton.disabled = true;
  setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
}

recomputeOrbit();
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
}
