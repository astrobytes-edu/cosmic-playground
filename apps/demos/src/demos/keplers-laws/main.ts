import { createDemoModes, createInstrumentRuntime, initMath, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { AstroUnits, KeplersLawsModel, TwoBodyAnalytic } from "@cosmic/physics";
import {
  buildExportPayload,
  buildReadouts,
  logSliderToValue,
  meanAnomalyRadFromTime,
  timeFromMeanAnomalyRad,
  valueToLogSlider
} from "./keplers-laws-logic";

const SVG_CENTER = { x: 300, y: 200 };
const SVG_SCALE = 150;
const TAU = 2 * Math.PI;

const elements = {
  modeKepler: document.querySelector<HTMLButtonElement>("#modeKepler"),
  modeNewton: document.querySelector<HTMLButtonElement>("#modeNewton"),
  unit101: document.querySelector<HTMLButtonElement>("#unit101"),
  unit201: document.querySelector<HTMLButtonElement>("#unit201"),
  aSlider: document.querySelector<HTMLInputElement>("#aAu"),
  aDisplay: document.querySelector<HTMLDivElement>("#aDisplay"),
  eSlider: document.querySelector<HTMLInputElement>("#ecc"),
  eDisplay: document.querySelector<HTMLDivElement>("#eDisplay"),
  massField: document.querySelector<HTMLDivElement>("#massField"),
  massSlider: document.querySelector<HTMLInputElement>("#massSlider"),
  massDisplay: document.querySelector<HTMLDivElement>("#massDisplay"),
  timelineScrub: document.querySelector<HTMLInputElement>("#timelineScrub"),
  phaseDisplay: document.querySelector<HTMLDivElement>("#phaseDisplay"),
  meanAnomalyDeg: document.querySelector<HTMLInputElement>("#meanAnomalyDeg"),
  play: document.querySelector<HTMLButtonElement>("#play"),
  pause: document.querySelector<HTMLButtonElement>("#pause"),
  reset: document.querySelector<HTMLButtonElement>("#reset"),
  speedSelect: document.querySelector<HTMLSelectElement>("#speedSelect"),
  presets: Array.from(document.querySelectorAll<HTMLButtonElement>(".preset")),
  toggleFoci: document.querySelector<HTMLInputElement>("#toggleFoci"),
  toggleApsides: document.querySelector<HTMLInputElement>("#toggleApsides"),
  toggleEqualAreas: document.querySelector<HTMLInputElement>("#toggleEqualAreas"),
  toggleVectors: document.querySelector<HTMLInputElement>("#toggleVectors"),
  toggleVectorsLabel: document.querySelector<HTMLLabelElement>("#toggleVectorsLabel"),
  stationMode: document.querySelector<HTMLButtonElement>("#stationMode"),
  help: document.querySelector<HTMLButtonElement>("#help"),
  copyResults: document.querySelector<HTMLButtonElement>("#copyResults"),
  status: document.querySelector<HTMLParagraphElement>("#status"),
  orbitStatus: document.querySelector<HTMLParagraphElement>("#orbitStatus"),
  orbitCanvas: document.querySelector<HTMLCanvasElement>("#orbitCanvas"),
  orbitSvg: document.querySelector<SVGSVGElement>("#orbitSvg"),
  orbitPath: document.querySelector<SVGEllipseElement>("#orbitPath"),
  planetGroup: document.querySelector<SVGGElement>("#planetGroup"),
  planet: document.querySelector<SVGCircleElement>("#planet"),
  star: document.querySelector<SVGCircleElement>("#star"),
  fociGroup: document.querySelector<SVGGElement>("#fociGroup"),
  focus1: document.querySelector<SVGCircleElement>("#focus1"),
  focus2: document.querySelector<SVGCircleElement>("#focus2"),
  focus1Label: document.querySelector<SVGTextElement>("#focus1Label"),
  apsidesGroup: document.querySelector<SVGGElement>("#apsidesGroup"),
  perihelionMarker: document.querySelector<SVGCircleElement>("#perihelionMarker"),
  perihelionLabel: document.querySelector<SVGTextElement>("#perihelionLabel"),
  aphelionMarker: document.querySelector<SVGCircleElement>("#aphelionMarker"),
  aphelionLabel: document.querySelector<SVGTextElement>("#aphelionLabel"),
  equalAreasGroup: document.querySelector<SVGGElement>("#equalAreasGroup"),
  equalAreasWedge: document.querySelector<SVGPathElement>("#equalAreasWedge"),
  equalTimeMarkers: document.querySelector<SVGGElement>("#equalTimeMarkers"),
  distanceLine: document.querySelector<SVGLineElement>("#distanceLine"),
  distanceText: document.querySelector<SVGTextElement>("#distanceText"),
  velocityVector: document.querySelector<SVGGElement>("#velocityVector"),
  velocityLine: document.querySelector<SVGLineElement>("#velocityLine"),
  forceVector: document.querySelector<SVGGElement>("#forceVector"),
  forceLine: document.querySelector<SVGLineElement>("#forceLine"),
  distanceValue: document.querySelector<HTMLDivElement>("#distanceValue"),
  velocityValue: document.querySelector<HTMLDivElement>("#velocityValue"),
  velocityUnit: document.querySelector<HTMLDivElement>("#velocityUnit"),
  accelValue: document.querySelector<HTMLDivElement>("#accelValue"),
  accelUnit: document.querySelector<HTMLDivElement>("#accelUnit"),
  periodValue: document.querySelector<HTMLDivElement>("#periodValue"),
  kineticValue: document.querySelector<HTMLDivElement>("#kineticValue"),
  kineticUnit: document.querySelector<HTMLDivElement>("#kineticUnit"),
  potentialValue: document.querySelector<HTMLDivElement>("#potentialValue"),
  potentialUnit: document.querySelector<HTMLDivElement>("#potentialUnit"),
  energyValue: document.querySelector<HTMLDivElement>("#energyValue"),
  energyUnit: document.querySelector<HTMLDivElement>("#energyUnit"),
  angmomValue: document.querySelector<HTMLDivElement>("#angmomValue"),
  angmomUnit: document.querySelector<HTMLDivElement>("#angmomUnit"),
  arealValue: document.querySelector<HTMLDivElement>("#arealValue"),
  arealUnit: document.querySelector<HTMLDivElement>("#arealUnit")
};

const required = Object.entries(elements).filter(([, value]) => value === null);
if (required.length > 0) {
  throw new Error(`Missing required DOM elements: ${required.map(([key]) => key).join(", ")}`);
}

const state = {
  mode: "kepler" as "kepler" | "newton",
  units: "101" as "101" | "201",
  aAu: 1,
  e: 0.017,
  massSolar: 1,
  meanAnomalyRad: 0,
  thetaRad: 0,
  tYr: 0,
  playing: false,
  speed: 1,
  animationId: 0,
  overlays: {
    foci: true,
    apsides: true,
    equalAreas: false,
    vectors: false
  }
};

const CANVAS_MARGIN = 36;

function resolveCanvasColor(value: string): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

const canvasColors = {
  planet: resolveCanvasColor("var(--cp-chart-2)")
};

let lastAnnounce = 0;
function maybeAnnouncePosition(force = false) {
  const now = performance.now();
  if (!force && now - lastAnnounce < 500) return;
  lastAnnounce = now;
  announcePosition();
}

function prefersReducedMotionEnabled() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function orbitalToSvg(rAu: number, thetaRad: number) {
  const scale = SVG_SCALE / Math.max(state.aAu, 1);
  const xOrb = -rAu * Math.cos(thetaRad);
  const yOrb = rAu * Math.sin(thetaRad);
  return {
    x: SVG_CENTER.x + xOrb * scale,
    y: SVG_CENTER.y - yOrb * scale
  };
}

function updateOrbitPath() {
  const scale = SVG_SCALE / Math.max(state.aAu, 1);
  const rx = state.aAu * scale;
  const ry = state.aAu * Math.sqrt(1 - state.e * state.e) * scale;
  const c = state.aAu * state.e * scale;
  elements.orbitPath!.setAttribute("cx", String(SVG_CENTER.x + c));
  elements.orbitPath!.setAttribute("cy", String(SVG_CENTER.y));
  elements.orbitPath!.setAttribute("rx", String(rx));
  elements.orbitPath!.setAttribute("ry", String(ry));
}

function updatePlanetPosition(rAu: number, thetaRad: number) {
  const pos = orbitalToSvg(rAu, thetaRad);
  elements.planet!.setAttribute("cx", String(pos.x));
  elements.planet!.setAttribute("cy", String(pos.y));
}

function drawOrbitCanvas(stateAtM: ReturnType<typeof KeplersLawsModel.stateAtMeanAnomalyRad>) {
  const canvas = elements.orbitCanvas!;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  const dpr = window.devicePixelRatio || 1;
  const pixelW = Math.round(w * dpr);
  const pixelH = Math.round(h * dpr);
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const aAu = state.aAu;
  const ecc = state.e;
  const rp = aAu * (1 - ecc);
  const ra = aAu * (1 + ecc);
  const b = aAu * Math.sqrt(1 - ecc * ecc);
  const pad = 0.2 * aAu;

  const plotW = Math.max(1, w - 2 * CANVAS_MARGIN);
  const plotH = Math.max(1, h - 2 * CANVAS_MARGIN);
  const xMin = -ra - pad;
  const xMax = rp + pad;
  const yMax = b + pad;
  const scale = Math.min(plotW / (xMax - xMin), plotH / (2 * yMax));
  const cx = CANVAS_MARGIN + (-xMin) * scale;
  const cy = h / 2;

  const rAu = stateAtM.rAu;
  const thetaRad = stateAtM.trueAnomalyRad;
  const px = cx + rAu * Math.cos(thetaRad) * scale;
  const py = cy - rAu * Math.sin(thetaRad) * scale;

  ctx.fillStyle = canvasColors.planet;
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, TAU);
  ctx.fill();
}

function updateFociMarkers() {
  const scale = SVG_SCALE / Math.max(state.aAu, 1);
  const c = state.aAu * state.e * scale;

  elements.star!.setAttribute("cx", String(SVG_CENTER.x));
  elements.star!.setAttribute("cy", String(SVG_CENTER.y));
  elements.focus1!.setAttribute("cx", String(SVG_CENTER.x));
  elements.focus1!.setAttribute("cy", String(SVG_CENTER.y));
  elements.focus1Label!.setAttribute("x", String(SVG_CENTER.x));
  elements.focus1Label!.setAttribute("y", String(SVG_CENTER.y + 35));

  elements.focus2!.setAttribute("cx", String(SVG_CENTER.x + 2 * c));
  elements.focus2!.setAttribute("cy", String(SVG_CENTER.y));

  setSvgVisible(elements.fociGroup!, state.overlays.foci);
}

function updateApsidesMarkers() {
  const scale = SVG_SCALE / Math.max(state.aAu, 1);
  const c = state.aAu * state.e * scale;
  const rx = state.aAu * scale;

  const periX = SVG_CENTER.x - (rx - c);
  elements.perihelionMarker!.setAttribute("cx", String(periX));
  elements.perihelionMarker!.setAttribute("cy", String(SVG_CENTER.y));
  elements.perihelionLabel!.setAttribute("x", String(periX));
  elements.perihelionLabel!.setAttribute("y", String(SVG_CENTER.y + 15));

  const periDist = state.aAu * (1 - state.e);
  elements.perihelionLabel!.textContent = `Perihelion (${periDist.toPrecision(3)} AU)`;

  const aphX = SVG_CENTER.x + (rx + c);
  elements.aphelionMarker!.setAttribute("cx", String(aphX));
  elements.aphelionMarker!.setAttribute("cy", String(SVG_CENTER.y));
  elements.aphelionLabel!.setAttribute("x", String(aphX));
  elements.aphelionLabel!.setAttribute("y", String(SVG_CENTER.y + 15));

  const aphDist = state.aAu * (1 + state.e);
  elements.aphelionLabel!.textContent = `Aphelion (${aphDist.toPrecision(3)} AU)`;

  setSvgVisible(elements.apsidesGroup!, state.overlays.apsides);
}

function updateDistanceLine(rAu: number, thetaRad: number) {
  const pos = orbitalToSvg(rAu, thetaRad);
  elements.distanceLine!.setAttribute("x1", String(SVG_CENTER.x));
  elements.distanceLine!.setAttribute("y1", String(SVG_CENTER.y));
  elements.distanceLine!.setAttribute("x2", String(pos.x));
  elements.distanceLine!.setAttribute("y2", String(pos.y));

  const midX = (SVG_CENTER.x + pos.x) / 2;
  const midY = (SVG_CENTER.y + pos.y) / 2 - 10;
  elements.distanceText!.setAttribute("x", String(midX));
  elements.distanceText!.setAttribute("y", String(midY));
  elements.distanceText!.textContent = `r = ${rAu.toPrecision(3)} AU`;
}

function updateVectors(stateAtM: ReturnType<typeof KeplersLawsModel.stateAtMeanAnomalyRad>) {
  if (state.mode !== "newton" || !state.overlays.vectors) {
    setSvgVisible(elements.velocityVector!, false);
    setSvgVisible(elements.forceVector!, false);
    return;
  }

  const rAu = stateAtM.rAu;
  const pos = orbitalToSvg(rAu, stateAtM.trueAnomalyRad);
  const vx = -stateAtM.vxAuPerYr;
  const vy = stateAtM.vyAuPerYr;

  const maxSpeed = stateAtM.speedAuPerYr;
  const vScale = maxSpeed > 0 ? 60 / maxSpeed : 0;

  setSvgVisible(elements.velocityVector!, true);
  elements.velocityLine!.setAttribute("x1", String(pos.x));
  elements.velocityLine!.setAttribute("y1", String(pos.y));
  elements.velocityLine!.setAttribute("x2", String(pos.x + vx * vScale));
  elements.velocityLine!.setAttribute("y2", String(pos.y - vy * vScale));

  const forceAngle = Math.atan2(SVG_CENTER.y - pos.y, SVG_CENTER.x - pos.x);
  const fLen = 40;
  setSvgVisible(elements.forceVector!, true);
  elements.forceLine!.setAttribute("x1", String(pos.x));
  elements.forceLine!.setAttribute("y1", String(pos.y));
  elements.forceLine!.setAttribute("x2", String(pos.x + fLen * Math.cos(forceAngle)));
  elements.forceLine!.setAttribute("y2", String(pos.y + fLen * Math.sin(forceAngle)));
}

function updateEqualAreas() {
  if (!state.overlays.equalAreas) {
    setSvgVisible(elements.equalAreasGroup!, false);
    return;
  }

  setSvgVisible(elements.equalAreasGroup!, true);
  const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
  const sweepTime = period * 0.1;

  const currentM = state.meanAnomalyRad;
  const startM = currentM - (sweepTime / period) * TAU;
  const startTheta = TwoBodyAnalytic.meanToTrueAnomalyRad({ meanAnomalyRad: startM, e: state.e });

  const numPoints = 30;
  let pathD = `M ${SVG_CENTER.x} ${SVG_CENTER.y}`;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const theta = startTheta + t * (state.thetaRad - startTheta);
    const rAu = KeplersLawsModel.stateAtMeanAnomalyRad({
      aAu: state.aAu,
      e: state.e,
      centralMassSolar: state.massSolar,
      meanAnomalyRad: TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad: theta, e: state.e })
    }).rAu;
    const pos = orbitalToSvg(rAu, theta);
    pathD += ` L ${pos.x} ${pos.y}`;
  }
  pathD += " Z";
  elements.equalAreasWedge!.setAttribute("d", pathD);

  const N = 12;
  const group = elements.equalTimeMarkers!;
  if (group.childElementCount !== N) {
    group.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", "2");
      c.setAttribute("fill", "var(--cp-chart-2)");
      c.setAttribute("opacity", "0.75");
      group.appendChild(c);
    }
  }

  for (let i = 0; i < N; i++) {
    const M = (TAU * i) / N;
    const theta = TwoBodyAnalytic.meanToTrueAnomalyRad({ meanAnomalyRad: M, e: state.e });
    const rAu = KeplersLawsModel.stateAtMeanAnomalyRad({
      aAu: state.aAu,
      e: state.e,
      centralMassSolar: state.massSolar,
      meanAnomalyRad: M
    }).rAu;
    const pos = orbitalToSvg(rAu, theta);
    const c = group.children[i] as SVGCircleElement;
    c.setAttribute("cx", String(pos.x));
    c.setAttribute("cy", String(pos.y));
  }
}

function setSvgVisible(el: SVGElement, visible: boolean) {
  el.style.display = visible ? "block" : "none";
}

function updateReadouts(stateAtM: ReturnType<typeof KeplersLawsModel.stateAtMeanAnomalyRad>) {
  const readouts = buildReadouts({
    rAu: stateAtM.rAu,
    speedAuPerYr: stateAtM.speedAuPerYr,
    accelAuPerYr2: stateAtM.accelAuPerYr2,
    periodYr: KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar }),
    specificEnergyAu2Yr2: stateAtM.specificEnergyAu2Yr2,
    specificAngularMomentumAu2Yr: stateAtM.specificAngularMomentumAu2Yr,
    arealVelocityAu2Yr: stateAtM.arealVelocityAu2Yr,
    units: state.units
  });

  elements.distanceValue!.textContent = readouts.distance.value.toPrecision(3);
  elements.velocityValue!.textContent = readouts.velocity.value.toPrecision(3);
  elements.velocityUnit!.textContent = readouts.velocity.unit;
  elements.accelValue!.textContent = readouts.acceleration.value.toPrecision(3);
  elements.accelUnit!.textContent = readouts.acceleration.unit;
  elements.periodValue!.textContent = readouts.period.value.toPrecision(3);

  elements.kineticValue!.textContent = readouts.conservation.kinetic.value.toPrecision(4);
  elements.kineticUnit!.textContent = readouts.conservation.kinetic.unit;
  elements.potentialValue!.textContent = readouts.conservation.potential.value.toPrecision(4);
  elements.potentialUnit!.textContent = readouts.conservation.potential.unit;
  elements.energyValue!.textContent = readouts.conservation.total.value.toPrecision(4);
  elements.energyUnit!.textContent = readouts.conservation.total.unit;
  elements.angmomValue!.textContent = readouts.conservation.h.value.toPrecision(4);
  elements.angmomUnit!.textContent = readouts.conservation.h.unit;
  elements.arealValue!.textContent = readouts.conservation.areal.value.toPrecision(4);
  elements.arealUnit!.textContent = readouts.conservation.areal.unit;
}

function updateTimeline() {
  const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
  const fraction = period > 0 ? (state.tYr % period) / period : 0;
  elements.timelineScrub!.value = String(Math.round(fraction * 1000));
  elements.phaseDisplay!.textContent = `${state.tYr.toPrecision(3)} / ${period.toPrecision(3)} yr`;
}

function updateSliderDisplays() {
  const aText = state.aAu < 1 ? state.aAu.toFixed(3) : state.aAu < 10 ? state.aAu.toFixed(2) : state.aAu.toFixed(1);
  elements.aDisplay!.textContent = `${aText} AU`;
  elements.eDisplay!.textContent = state.e.toFixed(3);
  elements.massDisplay!.textContent = `${state.massSolar.toFixed(1)} M_sun`;
}

function update() {
  const stateAtM = KeplersLawsModel.stateAtMeanAnomalyRad({
    aAu: state.aAu,
    e: state.e,
    centralMassSolar: state.massSolar,
    meanAnomalyRad: state.meanAnomalyRad
  });
  state.thetaRad = stateAtM.trueAnomalyRad;

  updateOrbitPath();
  updatePlanetPosition(stateAtM.rAu, state.thetaRad);
  drawOrbitCanvas(stateAtM);
  updateFociMarkers();
  updateApsidesMarkers();
  updateDistanceLine(stateAtM.rAu, state.thetaRad);
  updateEqualAreas();
  updateVectors(stateAtM);
  updateReadouts(stateAtM);
  updateTimeline();
  updateSliderDisplays();
  elements.meanAnomalyDeg!.value = String(Math.round(AstroUnits.radToDeg(state.meanAnomalyRad)));
  maybeAnnouncePosition();
}

function setMode(mode: "kepler" | "newton") {
  state.mode = mode;
  const isNewton = mode === "newton";
  elements.modeKepler!.classList.toggle("cp-button--active", !isNewton);
  elements.modeKepler!.classList.toggle("cp-button--outline", isNewton);
  elements.modeNewton!.classList.toggle("cp-button--active", isNewton);
  elements.modeNewton!.classList.toggle("cp-button--outline", !isNewton);
  elements.massField!.hidden = !isNewton;
  elements.toggleVectorsLabel!.hidden = !isNewton;
  if (!isNewton) {
    state.massSolar = 1;
    elements.massSlider!.value = "100";
  }
  update();
}

function setUnits(units: "101" | "201") {
  state.units = units;
  elements.unit101!.classList.toggle("cp-button--active", units === "101");
  elements.unit101!.classList.toggle("cp-button--outline", units === "201");
  elements.unit201!.classList.toggle("cp-button--active", units === "201");
  elements.unit201!.classList.toggle("cp-button--outline", units === "101");
  update();
}

function clearPresetHighlight() {
  elements.presets.forEach((btn) => btn.classList.remove("preset--active"));
}

function applyPreset(btn: HTMLButtonElement) {
  const a = Number(btn.dataset.a);
  const e = Number(btn.dataset.e);
  if (!Number.isFinite(a) || !Number.isFinite(e)) return;
  state.aAu = a;
  state.e = KeplersLawsModel.clampEccentricity(e);
  state.meanAnomalyRad = 0;
  state.tYr = 0;

  elements.aSlider!.value = String(valueToLogSlider(a, 0.3, 40));
  elements.eSlider!.value = String(Math.round(state.e * 1000));

  clearPresetHighlight();
  btn.classList.add("preset--active");
  update();
}

function startAnimation() {
  if (prefersReducedMotionEnabled()) return;
  if (state.playing) return;
  state.playing = true;
  elements.play!.disabled = true;
  elements.pause!.disabled = false;

  let lastTime = performance.now();
  const step = (now: number) => {
    if (!state.playing) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
    state.tYr += dt * state.speed;
    state.meanAnomalyRad = meanAnomalyRadFromTime(state.tYr, period);
    update();

    state.animationId = requestAnimationFrame(step);
  };

  state.animationId = requestAnimationFrame(step);
}

function stopAnimation() {
  if (!state.playing) return;
  state.playing = false;
  cancelAnimationFrame(state.animationId);
  elements.play!.disabled = false;
  elements.pause!.disabled = true;
}

function resetAnimation() {
  stopAnimation();
  state.meanAnomalyRad = 0;
  state.tYr = 0;
  update();
}

function updateFromTimeline() {
  stopAnimation();
  const fraction = Number(elements.timelineScrub!.value) / 1000;
  const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
  state.tYr = fraction * period;
  state.meanAnomalyRad = TAU * fraction;
  update();
  maybeAnnouncePosition(true);
}

function setupDrag() {
  let dragging = false;

  function getAngleFromEvent(event: MouseEvent | TouchEvent) {
    const svg = elements.orbitSvg!;
    const pt = svg.createSVGPoint();
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return Math.atan2(SVG_CENTER.y - svgP.y, svgP.x - SVG_CENTER.x);
  }

  const onMove = (event: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    const theta = getAngleFromEvent(event);
    state.meanAnomalyRad = TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad: theta, e: state.e });
    const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
    state.tYr = timeFromMeanAnomalyRad(state.meanAnomalyRad, period);
    update();
    maybeAnnouncePosition();
  };

  elements.planetGroup!.addEventListener("mousedown", (event) => {
    dragging = true;
    stopAnimation();
    event.preventDefault();
  });
  elements.planetGroup!.addEventListener("touchstart", (event) => {
    dragging = true;
    stopAnimation();
    event.preventDefault();
  });

  document.addEventListener("mousemove", onMove);
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });
  document.addEventListener("touchend", () => {
    dragging = false;
  });
}

function announcePosition() {
  const stateAtM = KeplersLawsModel.stateAtMeanAnomalyRad({
    aAu: state.aAu,
    e: state.e,
    centralMassSolar: state.massSolar,
    meanAnomalyRad: state.meanAnomalyRad
  });
  const rAu = stateAtM.rAu;
  const vKmS = AstroUnits.auPerYrToKmPerS(stateAtM.speedAuPerYr);
  const normalized = ((state.thetaRad % TAU) + TAU) % TAU;
  const phasePct = ((normalized / TAU) * 100).toFixed(0);

  let position = "orbit";
  if (Math.abs(state.thetaRad) < 0.1) position = "perihelion";
  else if (Math.abs(state.thetaRad - Math.PI) < 0.1) position = "aphelion";

  setLiveRegionText(
    elements.orbitStatus!,
    `${position}, distance ${rAu.toFixed(2)} AU, velocity ${vKmS.toFixed(1)} km/s, ${phasePct}% through orbit`
  );

  elements.planetGroup!.setAttribute("aria-valuenow", String(Math.round(AstroUnits.radToDeg(state.thetaRad))));
  elements.planetGroup!.setAttribute("aria-valuetext", `${position}, ${rAu.toFixed(2)} AU from star`);
}

function bindEvents() {
  elements.modeKepler!.addEventListener("click", () => setMode("kepler"));
  elements.modeNewton!.addEventListener("click", () => setMode("newton"));
  elements.unit101!.addEventListener("click", () => setUnits("101"));
  elements.unit201!.addEventListener("click", () => setUnits("201"));

  elements.aSlider!.addEventListener("input", () => {
    stopAnimation();
    state.aAu = logSliderToValue(Number(elements.aSlider!.value), 0.3, 40);
    clearPresetHighlight();
    update();
    maybeAnnouncePosition(true);
  });

  elements.eSlider!.addEventListener("input", () => {
    stopAnimation();
    state.e = KeplersLawsModel.clampEccentricity(Number(elements.eSlider!.value) / 1000);
    clearPresetHighlight();
    update();
    maybeAnnouncePosition(true);
  });

  elements.massSlider!.addEventListener("input", () => {
    stopAnimation();
    state.massSolar = Number(elements.massSlider!.value) / 100;
    update();
    maybeAnnouncePosition(true);
  });

  elements.speedSelect!.addEventListener("change", () => {
    state.speed = Number(elements.speedSelect!.value);
  });

  elements.timelineScrub!.addEventListener("input", updateFromTimeline);

  elements.play!.addEventListener("click", startAnimation);
  elements.pause!.addEventListener("click", stopAnimation);
  elements.reset!.addEventListener("click", resetAnimation);

  elements.presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPreset(btn);
      maybeAnnouncePosition(true);
    });
  });

  elements.toggleFoci!.addEventListener("change", () => {
    state.overlays.foci = elements.toggleFoci!.checked;
    update();
    maybeAnnouncePosition(true);
  });
  elements.toggleApsides!.addEventListener("change", () => {
    state.overlays.apsides = elements.toggleApsides!.checked;
    update();
    maybeAnnouncePosition(true);
  });
  elements.toggleEqualAreas!.addEventListener("change", () => {
    state.overlays.equalAreas = elements.toggleEqualAreas!.checked;
    update();
    maybeAnnouncePosition(true);
  });
  elements.toggleVectors!.addEventListener("change", () => {
    state.overlays.vectors = elements.toggleVectors!.checked;
    update();
    maybeAnnouncePosition(true);
  });

  elements.planetGroup!.addEventListener("keydown", (event) => {
    const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
    let delta = 0;
    let jumpAngle: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        delta = event.shiftKey ? -0.01 : -0.05;
        break;
      case "ArrowRight":
        delta = event.shiftKey ? 0.01 : 0.05;
        break;
      case "Home":
        jumpAngle = 0;
        break;
      case "End":
        jumpAngle = Math.PI;
        break;
      case " ":
        event.preventDefault();
        if (prefersReducedMotionEnabled()) return;
        if (state.playing) stopAnimation();
        else startAnimation();
        return;
      default:
        return;
    }

    event.preventDefault();
    stopAnimation();

    if (jumpAngle !== null) {
      state.meanAnomalyRad = TwoBodyAnalytic.trueToMeanAnomalyRad({ thetaRad: jumpAngle, e: state.e });
      state.tYr = timeFromMeanAnomalyRad(state.meanAnomalyRad, period);
    } else if (delta !== 0) {
      state.meanAnomalyRad = (state.meanAnomalyRad + delta * TAU + TAU) % TAU;
      state.tYr = timeFromMeanAnomalyRad(state.meanAnomalyRad, period);
    }

    update();
    maybeAnnouncePosition(true);
  });

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;

    switch (event.key) {
      case "k":
      case "K":
        setMode("kepler");
        break;
      case "n":
      case "N":
        setMode("newton");
        break;
      case "1":
        elements.presets[0]?.click();
        break;
      case "2":
        elements.presets[1]?.click();
        break;
      case "3":
        elements.presets[2]?.click();
        break;
      case "4":
        elements.presets[3]?.click();
        break;
      case "5":
        elements.presets[4]?.click();
        break;
      case "6":
        elements.presets[5]?.click();
        break;
      default:
        break;
    }
  });
}

function exportResults(): ExportPayloadV1 {
  const stateAtM = KeplersLawsModel.stateAtMeanAnomalyRad({
    aAu: state.aAu,
    e: state.e,
    centralMassSolar: state.massSolar,
    meanAnomalyRad: state.meanAnomalyRad
  });

  const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
  const speedKmS = AstroUnits.auPerYrToKmPerS(stateAtM.speedAuPerYr);
  const accelMs2 = AstroUnits.auPerYr2ToMPerS2(stateAtM.accelAuPerYr2);

  return buildExportPayload({
    mode: state.mode,
    units: state.units,
    speed: state.speed,
    aAu: state.aAu,
    e: state.e,
    centralMassSolar: state.massSolar,
    meanAnomalyDeg: Math.round(AstroUnits.radToDeg(state.meanAnomalyRad)),
    rAu: stateAtM.rAu,
    speedKmS,
    accelMs2: state.units === "201" ? accelMs2 * 100 : accelMs2 * 1000,
    periodYr: period,
    specificEnergy: stateAtM.specificEnergyAu2Yr2,
    specificAngularMomentum: stateAtM.specificAngularMomentumAu2Yr,
    arealVelocity: stateAtM.arealVelocityAu2Yr
  });
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:keplers-laws:mode",
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
          { key: "g", action: "Toggle station mode" },
          { key: "Space", action: "Play/Pause" },
          { key: "Home/End", action: "Perihelion/Aphelion" }
        ]
      },
      {
        heading: "How to use this instrument",
        type: "html",
        html: `
          <ul style="margin: 0; padding-left: 1.2rem;">
            <li>Increase eccentricity e and compare speed near perihelion vs aphelion.</li>
            <li>Turn on equal-area slices and notice the areas look similar even when arc lengths differ.</li>
            <li>Change a to see period scaling: P propto a^{3/2} when M is fixed.</li>
          </ul>
        `
      }
    ]
  },
  station: {
    title: "Station Mode: Kepler's Laws",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Pick an orbit (a, e).",
      "Record a snapshot at two different times and compare r and v.",
      "Double a (same M) and record how P changes."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "aAu", label: "a (AU)" },
      { key: "e", label: "e" },
      { key: "mSolar", label: "M (M_sun)" },
      { key: "meanAnomalyDeg", label: "M (deg)" },
      { key: "periodYr", label: "P (yr)" },
      { key: "rAu", label: "r (AU)" },
      { key: "vKmS", label: "v (km/s)" }
    ],
    getSnapshotRow() {
      const stateAtM = KeplersLawsModel.stateAtMeanAnomalyRad({
        aAu: state.aAu,
        e: state.e,
        centralMassSolar: state.massSolar,
        meanAnomalyRad: state.meanAnomalyRad
      });
      const period = KeplersLawsModel.orbitalPeriodYr({ aAu: state.aAu, centralMassSolar: state.massSolar });
      const vKmS = AstroUnits.auPerYrToKmPerS(stateAtM.speedAuPerYr);
      return {
        case: "Snapshot",
        aAu: state.aAu.toFixed(3),
        e: state.e.toFixed(3),
        mSolar: state.massSolar.toFixed(3),
        meanAnomalyDeg: String(Math.round(AstroUnits.radToDeg(state.meanAnomalyRad))),
        periodYr: period.toFixed(3),
        rAu: stateAtM.rAu.toFixed(3),
        vKmS: vKmS.toFixed(2)
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add solar-system examples (M=1)",
        getRows() {
          const cases = [
            { label: "Earth", aAu: 1.0, e: 0.017 },
            { label: "Mars", aAu: 1.524, e: 0.093 },
            { label: "Jupiter", aAu: 5.204, e: 0.049 }
          ];
          return cases.map((c) => {
            const period = KeplersLawsModel.orbitalPeriodYr({ aAu: c.aAu, centralMassSolar: 1 });
            const st = KeplersLawsModel.stateAtMeanAnomalyRad({
              aAu: c.aAu,
              e: c.e,
              centralMassSolar: 1,
              meanAnomalyRad: 0
            });
            const vKmS = AstroUnits.auPerYrToKmPerS(st.speedAuPerYr);
            return {
              case: c.label,
              aAu: c.aAu.toFixed(3),
              e: c.e.toFixed(3),
              mSolar: "1.000",
              meanAnomalyDeg: "0",
              periodYr: period.toFixed(3),
              rAu: st.rAu.toFixed(3),
              vKmS: vKmS.toFixed(2)
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> In one sentence, explain why equal areas in equal times implies faster motion near perihelion.</p>"
  }
});

demoModes.bindButtons({
  helpButton: elements.help!,
  stationButton: elements.stationMode!
});

bindEvents();
setupDrag();
setMode("kepler");
setUnits("101");

if (prefersReducedMotionEnabled()) {
  elements.play!.disabled = true;
  elements.pause!.disabled = true;
}

elements.copyResults!.addEventListener("click", () => {
  stopAnimation();
  setLiveRegionText(elements.status!, "Copying...");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(elements.status!, "Copied results to clipboard."))
    .catch((err) =>
      setLiveRegionText(
        elements.status!,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      )
    );
});

initMath(document);
