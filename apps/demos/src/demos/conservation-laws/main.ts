import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ConservationLawsModel, TwoBodyAnalytic } from "@cosmic/physics";
import {
  arrowLengthPx,
  buildPathD,
  clamp,
  formatNumber,
  formatOrbitType,
  formatSpecificEnergy,
  formatSpeedFactor,
  logSliderToValue,
  orbitAnnouncement,
  pickArrowDtDays,
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
const apoCaption = must<HTMLSpanElement>("#apoCaption");
const raAuValue = must<HTMLSpanElement>("#raAu");

const CENTER = { x: 300, y: 300 };
const VIEW_RADIUS_PX = 250;
const PATH_SAMPLES = 720;
/** Teaching time scale: a circular orbit at 1 AU around 1 Msun takes about 3 s. */
const SIM_YEARS_PER_SEC = 1 / 3;

const PRESETS = {
  circular: { label: "Circular", speedFactor: 1, directionDeg: 0 },
  elliptical: { label: "Elliptical", speedFactor: 0.75, directionDeg: 0 },
  escape: { label: "Escape", speedFactor: Math.SQRT2, directionDeg: 0 },
  hyperbolic: { label: "Hyperbolic", speedFactor: 1.8, directionDeg: 0 }
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
  nuMin: 0,
  nuMax: 2 * Math.PI,
  dir: 1,
  scalePxPerAu: VIEW_RADIUS_PX / 1.5,
  dtDays: null as number | null
};

function validOrbit(): ValidOrbit | null {
  return orbit.orbitType === "invalid" ? null : orbit;
}

function canAnimate(): boolean {
  const o = validOrbit();
  return !prefersReducedMotion && o !== null && o.orbitType !== "radial";
}

function stopAnimation() {
  anim.playing = false;
  if (anim.frameId !== null) {
    cancelAnimationFrame(anim.frameId);
    anim.frameId = null;
  }
  playButton.disabled = !canAnimate();
  pauseButton.disabled = true;
}

function resetAnimation() {
  stopAnimation();
  const o = validOrbit();
  if (!o) return;
  anim.dir = 1;
  anim.nuRad = o.nu0Rad;
  renderBody();
}

function startAnimation() {
  if (prefersReducedMotion) {
    setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
    return;
  }
  const o = validOrbit();
  if (anim.playing || !o || o.orbitType === "radial") return;
  // An open orbit that already ran to the edge of the view starts again from the beginning.
  if (o.ecc >= 1 && anim.nuRad >= anim.nuMax - 1e-9) anim.nuRad = o.nu0Rad;

  anim.playing = true;
  playButton.disabled = true;
  pauseButton.disabled = false;
  anim.lastTimeMs = performance.now();

  const tick = (nowMs: number) => {
    if (!anim.playing) return;
    let dtRemain = Math.min((nowMs - anim.lastTimeMs) / 1000, 0.1);
    anim.lastTimeMs = nowMs;
    let stopped = false;
    // Kepler's second law: h = r^2 dnu/dt, so dnu/dt = h / r^2.
    while (dtRemain > 1e-9 && !stopped) {
      const dtSec = Math.min(dtRemain, 0.02);
      const rAu = ConservationLawsModel.orbitalRadiusAu({ ecc: o.ecc, pAu: o.pAu, nuRad: anim.nuRad });
      const nuRadPerYr = rAu > 0 ? o.hAbsAu2Yr / (rAu * rAu) : 0;
      const step = ConservationLawsModel.advanceTrueAnomalyRad({
        nuRad: anim.nuRad,
        ecc: o.ecc,
        nuMin: anim.nuMin,
        nuMax: anim.nuMax,
        dir: anim.dir,
        dtSec,
        nuSpeedRadPerSec: nuRadPerYr * SIM_YEARS_PER_SEC
      });
      anim.nuRad = step.nuRad;
      anim.dir = step.dir;
      stopped = step.stopped;
      dtRemain -= dtSec;
    }
    renderBody();
    if (stopped) {
      stopAnimation();
      setLiveRegionText(status, "The body has left the view. Press Play to run it again.");
      return;
    }
    anim.frameId = requestAnimationFrame(tick);
  };
  anim.frameId = requestAnimationFrame(tick);
}

function renderControlValues() {
  massValue.textContent = formatNumber(controls.massSolar, 2);
  r0Value.textContent = formatNumber(controls.r0Au, 2);
  speedValue.textContent = formatSpeedFactor(controls.speedFactor);
  directionValue.textContent = String(Math.round(controls.directionDeg));
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
    stopAnimation();
    return;
  }

  const rMaxAu = viewRadiusAu({ raAu: o.raAu, r0Au: controls.r0Au });
  anim.scalePxPerAu = VIEW_RADIUS_PX / rMaxAu;
  anim.dtDays = pickArrowDtDays(o.vPeriAuYr, anim.scalePxPerAu);
  anim.dir = 1;
  anim.nuRad = o.nu0Rad;

  if (o.orbitType === "radial") {
    anim.nuMin = 0;
    anim.nuMax = 0;
    const start = toSvg(o.rVecAu.xAu, o.rVecAu.yAu, CENTER, anim.scalePxPerAu);
    orbitPath.setAttribute("d", `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${CENTER.x} ${CENTER.y}`);
  } else {
    const domain = ConservationLawsModel.conicTrueAnomalyDomainRadForPlot({ ecc: o.ecc, pAu: o.pAu, rMaxAu });
    anim.nuMin = domain.nuMin;
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

  const radial = o.orbitType === "radial";
  orbitTypeValue.textContent = formatOrbitType(o.orbitType);
  eccValue.textContent = radial ? "—" : formatNumber(o.ecc, 3);
  epsValue.textContent = formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / controls.r0Au);
  hValue.textContent = formatNumber(o.hAbsAu2Yr, 4);
  rpAuValue.textContent = radial ? "—" : formatNumber(o.rpAu, 3);

  arrowCaption.hidden = anim.dtDays === null;
  arrowDtDays.textContent = anim.dtDays === null ? "" : String(anim.dtDays);
  apoCaption.hidden = !(Number.isFinite(o.raAu) && o.raAu > rMaxAu);
  raAuValue.textContent = Number.isFinite(o.raAu) ? formatNumber(o.raAu, 1) : "";

  renderBody();
  stopAnimation();
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
    const mag = Math.hypot(pos.dxAu, pos.dyAu);
    if (mag > 0) {
      ux = (pos.dxAu / mag) * anim.dir;
      uy = (pos.dyAu / mag) * anim.dir;
    }
  }

  const p = toSvg(xAu, yAu, CENTER, anim.scalePxPerAu);
  particle.setAttribute("cx", p.x.toFixed(2));
  particle.setAttribute("cy", p.y.toFixed(2));

  const lengthPx = anim.dtDays === null ? 0 : arrowLengthPx(vAuYr, anim.dtDays, anim.scalePxPerAu);
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
  controls.speedFactor = PRESETS[name].speedFactor;
  controls.directionDeg = PRESETS[name].directionDeg;
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
pauseButton.addEventListener("click", stopAnimation);
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
  const radial = o.orbitType === "radial";
  return {
    ...base,
    e: radial ? "—" : formatNumber(o.ecc, 3),
    eps: formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / c.r0Au),
    h: formatNumber(o.hAbsAu2Yr, 4),
    rp: radial ? "—" : formatNumber(o.rpAu, 3)
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
      { name: "Eccentricity e", value: o ? formatNumber(o.ecc, 6) : "—" },
      { name: "Specific kinetic energy K (AU^2/yr^2)", value: kValue.textContent ?? "—" },
      { name: "Specific potential energy U (AU^2/yr^2)", value: uValue.textContent ?? "—" },
      { name: "Specific energy eps (AU^2/yr^2)", value: o ? formatSpecificEnergy(o.epsAu2Yr2, o.muAu3Yr2 / controls.r0Au) : "—" },
      { name: "Specific angular momentum |h| (AU^2/yr)", value: o ? formatNumber(o.hAbsAu2Yr, 8) : "—" },
      { name: "Periapsis r_p (AU)", value: o ? formatNumber(o.rpAu, 8) : "—" },
      { name: "Speed v (km/s)", value: vKmSValue.textContent ?? "—" }
    ],
    notes: [
      "Teaching units: AU / yr / Msun with G = 4*pi^2 AU^3/(yr^2 Msun).",
      "Bound or unbound follows the sign of eps = K + U; the conic shape follows the eccentricity.",
      "Paths reaching beyond 6 r_0 (within 1.5 to 50 AU) are clipped to the plotted window."
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
              directionDeg: PRESETS[name].directionDeg
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
  setLiveRegionText(status, "Reduced motion is enabled; animation is disabled.");
}
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) initPopovers(demoRoot);
