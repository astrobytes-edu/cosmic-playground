import {
  ChallengeEngine,
  copyTextToClipboard,
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
  setLiveRegionText,
} from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import { GalaxyRotationModel, type GalaxyParams, type GalaxyPresetKey, type RotationCurvePoint } from "@cosmic/physics";
import {
  RADIAL_PROFILE_SAMPLE_KPC,
  advanceRadiusSweep,
  buildChallengeEvidenceText,
  buildGalaxyRotationExportPayload,
  classifyOuterCurveBehavior,
  clamp,
  createSeededRandom,
  findDarkDominanceRadiusKpc,
  formatNumber,
  formatSigned,
  isChallengeCopyLocked,
  pickChallengeTarget,
  type ChallengeTarget,
  type GalaxyPresetId,
  type OuterCurveBehavior,
  type PlotMode,
} from "./logic";

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
};

const presetSelect = $<HTMLSelectElement>("#presetSelect");
const haloMassSlider = $<HTMLInputElement>("#haloMassSlider");
const haloScaleSlider = $<HTMLInputElement>("#haloScaleSlider");
const diskMassSlider = $<HTMLInputElement>("#diskMassSlider");
const diskScaleSlider = $<HTMLInputElement>("#diskScaleSlider");
const bulgeMassSlider = $<HTMLInputElement>("#bulgeMassSlider");
const bulgeScaleSlider = $<HTMLInputElement>("#bulgeScaleSlider");
const radiusSlider = $<HTMLInputElement>("#radiusSlider");

const haloMassSliderValue = $<HTMLSpanElement>("#haloMassSliderValue");
const haloScaleSliderValue = $<HTMLSpanElement>("#haloScaleSliderValue");
const diskMassSliderValue = $<HTMLSpanElement>("#diskMassSliderValue");
const diskScaleSliderValue = $<HTMLSpanElement>("#diskScaleSliderValue");
const bulgeMassSliderValue = $<HTMLSpanElement>("#bulgeMassSliderValue");
const bulgeScaleSliderValue = $<HTMLSpanElement>("#bulgeScaleSliderValue");
const radiusSliderValue = $<HTMLSpanElement>("#radiusSliderValue");

const plotVelocity = $<HTMLButtonElement>("#plotVelocity");
const plotMass = $<HTMLButtonElement>("#plotMass");
const showKeplerian = $<HTMLInputElement>("#showKeplerian");
const showDisk = $<HTMLInputElement>("#showDisk");
const showBulge = $<HTMLInputElement>("#showBulge");
const showHalo = $<HTMLInputElement>("#showHalo");
const showMond = $<HTMLInputElement>("#showMond");
const insetToggle = $<HTMLInputElement>("#insetToggle");

const challengeModeBtn = $<HTMLButtonElement>("#challengeModeBtn");
const challengePanel = $<HTMLDivElement>("#challengePanel");
const challengePrompt = $<HTMLParagraphElement>("#challengePrompt");
const challengeGuessPreset = $<HTMLSelectElement>("#challengeGuessPreset");
const guessFlat = $<HTMLButtonElement>("#guessFlat");
const guessKeplerian = $<HTMLButtonElement>("#guessKeplerian");
const checkChallenge = $<HTMLButtonElement>("#checkChallenge");
const challengeHint = $<HTMLButtonElement>("#challengeHint");
const endChallenge = $<HTMLButtonElement>("#endChallenge");
const copyChallengeEvidence = $<HTMLButtonElement>("#copyChallengeEvidence");
const copyLockHint = $<HTMLParagraphElement>("#copyLockHint");

const stationMode = $<HTMLButtonElement>("#stationMode");
const help = $<HTMLButtonElement>("#help");
const copyResults = $<HTMLButtonElement>("#copyResults");
const status = $<HTMLParagraphElement>("#status");
const playBtn = $<HTMLButtonElement>("#btn-play");
const pauseBtn = $<HTMLButtonElement>("#btn-pause");
const stepBackBtn = $<HTMLButtonElement>("#btn-step-back");
const stepForwardBtn = $<HTMLButtonElement>("#btn-step-forward");
const resetBtn = $<HTMLButtonElement>("#btn-reset");
const speedSelect = $<HTMLSelectElement>("#speed-select");
const playbarState = $<HTMLSpanElement>("#playbarState");

const galaxyView = $<SVGSVGElement>("#galaxyView");

const rotationCanvas = $<HTMLCanvasElement>("#rotationCanvas");
const plotAria = $<HTMLParagraphElement>("#plotAria");

const radiusValue = $<HTMLSpanElement>("#radiusValue");
const vTotalValue = $<HTMLSpanElement>("#vTotalValue");
const vKeplerianValue = $<HTMLSpanElement>("#vKeplerianValue");
const mEnclosedValue = $<HTMLSpanElement>("#mEnclosedValue");
const mVisibleValue = $<HTMLSpanElement>("#mVisibleValue");
const mDarkValue = $<HTMLSpanElement>("#mDarkValue");
const darkVisRatioValue = $<HTMLSpanElement>("#darkVisRatioValue");
const baryonFracValue = $<HTMLSpanElement>("#baryonFracValue");
const deltaLambda21Value = $<HTMLSpanElement>("#deltaLambda21Value");
const concValue = $<HTMLSpanElement>("#concValue");
const rVirValue = $<HTMLSpanElement>("#rVirValue");

const modelControlRows = [
  presetSelect.closest(".control"),
  haloMassSlider.closest(".control"),
  haloScaleSlider.closest(".control"),
  diskMassSlider.closest(".control"),
  diskScaleSlider.closest(".control"),
  bulgeMassSlider.closest(".control"),
  bulgeScaleSlider.closest(".control"),
].filter((row): row is HTMLElement => row instanceof HTMLElement);

const canvasContext = rotationCanvas.getContext("2d");
if (!canvasContext) {
  throw new Error("Canvas 2D context unavailable for rotation curve plot.");
}
const ctx = canvasContext;

type PresetConfig = {
  id: Exclude<GalaxyPresetId, "custom">;
  label: string;
  params: GalaxyParams;
};

const PRESETS: Record<Exclude<GalaxyPresetId, "custom">, PresetConfig> = {
  "milky-way-like": {
    id: "milky-way-like",
    label: "Milky Way-like",
    params: { ...GalaxyRotationModel.PRESETS["milky-way-like"] },
  },
  "dwarf-galaxy": {
    id: "dwarf-galaxy",
    label: "Dwarf galaxy",
    params: { ...GalaxyRotationModel.PRESETS["dwarf-galaxy"] },
  },
  "massive-spiral": {
    id: "massive-spiral",
    label: "Massive spiral",
    params: { ...GalaxyRotationModel.PRESETS["massive-spiral"] },
  },
  "no-dark-matter": {
    id: "no-dark-matter",
    label: "No dark matter",
    params: { ...GalaxyRotationModel.PRESETS["no-dark-matter"] },
  },
};

const PRESET_ORDER: Array<Exclude<GalaxyPresetId, "custom">> = [
  "milky-way-like",
  "dwarf-galaxy",
  "massive-spiral",
  "no-dark-matter",
];

const state = {
  presetId: "milky-way-like" as GalaxyPresetId,
  params: { ...PRESETS["milky-way-like"].params },
  plotMode: "velocity" as PlotMode,
  show: {
    keplerian: true,
    disk: false,
    bulge: false,
    halo: false,
    mond: false,
    inset: true,
  },
  radiusMarkerKpc: 10,
  challenge: {
    active: false,
    revealed: false,
    guessPreset: "milky-way-like" as Exclude<GalaxyPresetId, "custom">,
    guessBehavior: "flat" as OuterCurveBehavior,
    target: null as ChallengeTarget | null,
    lastTarget: null as ChallengeTarget | null,
    lastEvidence: null as null | {
      guessedPresetLabel: string;
      guessedOuterBehavior: OuterCurveBehavior;
      targetPresetLabel: string;
      targetOuterBehavior: OuterCurveBehavior;
      correct: boolean;
      radiusKpc: number;
      vTotalKmS: number;
      vKeplerianKmS: number;
      darkVisibleRatio: number;
      baryonFraction: number;
      deltaLambda21mm: number;
    },
  },
};

const challengeSeed = new URL(window.location.href).searchParams.get("challengeSeed");
const challengeRandom = challengeSeed ? createSeededRandom(challengeSeed) : null;
const prefersReducedMotion =
  typeof window !== "undefined"
  && typeof window.matchMedia !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let sweepFrame = 0;
let sweepLastTimestamp = 0;
let sweepDirection: -1 | 1 = 1;

const RADIUS_SWEEP_RATE_KPC_PER_SEC = 3.4;

function curveForParams(params: GalaxyParams): RotationCurvePoint[] {
  return GalaxyRotationModel.rotationCurve({
    params,
    rMinKpc: 0,
    rMaxKpc: 50,
    nPoints: 260,
  });
}

const challengeTargets: ChallengeTarget[] = PRESET_ORDER.map((presetId) => {
  const behavior = classifyOuterCurveBehavior(curveForParams(PRESETS[presetId].params));
  return { presetId, outerBehavior: behavior };
});

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:galaxy-rotation:mode",
  url: new URL(window.location.href),
});

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function clearSvg(svg: SVGSVGElement) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function resizePlotCanvas() {
  const rect = rotationCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (rotationCanvas.width !== pixelWidth || rotationCanvas.height !== pixelHeight) {
    rotationCanvas.width = pixelWidth;
    rotationCanvas.height = pixelHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function sliderToParams() {
  state.params = {
    bulgeMass10: Number(bulgeMassSlider.value),
    bulgeScaleKpc: Number(bulgeScaleSlider.value),
    diskMass10: Number(diskMassSlider.value),
    diskScaleLengthKpc: Number(diskScaleSlider.value),
    haloMass10: Number(haloMassSlider.value),
    haloScaleRadiusKpc: Number(haloScaleSlider.value),
  };
}

function setPreset(presetId: GalaxyPresetId, announce = true) {
  if (state.challenge.active && !state.challenge.revealed) {
    if (announce) {
      setLiveRegionText(status, "Preset switching is locked while the mystery target is hidden. Tune model sliders instead.");
    }
    return;
  }
  state.presetId = presetId;
  if (presetId !== "custom") {
    state.params = { ...PRESETS[presetId].params };
  }
  render();
  if (announce) {
    const label = presetId === "custom" ? "Custom" : PRESETS[presetId].label;
    setLiveRegionText(status, `${label} preset selected.`);
  }
}

function setCustomFromSliderChange() {
  if (state.presetId !== "custom") {
    state.presetId = "custom";
  }
  sliderToParams();
}

function bindButtonRadioGroup(args: {
  buttons: [HTMLButtonElement, HTMLButtonElement];
  getSelectedIndex: () => 0 | 1;
  setSelectedIndex: (index: 0 | 1) => void;
}) {
  const { buttons, getSelectedIndex, setSelectedIndex } = args;
  const handler = (event: KeyboardEvent) => {
    let nextIndex: 0 | 1 | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = getSelectedIndex() === 0 ? 1 : 0;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = getSelectedIndex() === 0 ? 1 : 0;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = 1;
        break;
      default:
        break;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedIndex(nextIndex);
    buttons[nextIndex].focus();
  };
  for (const button of buttons) {
    button.addEventListener("keydown", handler);
  }
}

function setPlotMode(nextMode: PlotMode, announce = true) {
  state.plotMode = nextMode;
  render();
  if (announce) {
    setLiveRegionText(status, nextMode === "velocity" ? "Velocity plot mode selected." : "Enclosed mass plot mode selected.");
  }
}

function sampleCurveAtRadius(curve: RotationCurvePoint[], radiusKpc: number): RotationCurvePoint {
  if (curve.length === 0) {
    throw new Error("sampleCurveAtRadius requires non-empty curve");
  }
  if (radiusKpc <= curve[0].radiusKpc) return curve[0];
  if (radiusKpc >= curve[curve.length - 1].radiusKpc) return curve[curve.length - 1];

  for (let i = 0; i < curve.length - 1; i += 1) {
    const a = curve[i];
    const b = curve[i + 1];
    if (radiusKpc >= a.radiusKpc && radiusKpc <= b.radiusKpc) {
      const t = (radiusKpc - a.radiusKpc) / (b.radiusKpc - a.radiusKpc);
      const lerp = (x: number, y: number) => x + t * (y - x);
      return {
        radiusKpc,
        vTotalKmS: lerp(a.vTotalKmS, b.vTotalKmS),
        vBulgeKmS: lerp(a.vBulgeKmS, b.vBulgeKmS),
        vDiskKmS: lerp(a.vDiskKmS, b.vDiskKmS),
        vHaloKmS: lerp(a.vHaloKmS, b.vHaloKmS),
        vKeplerianKmS: lerp(a.vKeplerianKmS, b.vKeplerianKmS),
        vMondKmS: lerp(a.vMondKmS, b.vMondKmS),
        mTotal10: lerp(a.mTotal10, b.mTotal10),
        mVisible10: lerp(a.mVisible10, b.mVisible10),
        mDark10: lerp(a.mDark10, b.mDark10),
        darkVisRatio: lerp(a.darkVisRatio, b.darkVisRatio),
        baryonFraction: lerp(a.baryonFraction, b.baryonFraction),
        deltaLambda21mm: lerp(a.deltaLambda21mm, b.deltaLambda21mm),
      };
    }
  }

  return curve[curve.length - 1];
}

function challengeStateLabel(): "inactive" | "active-hidden" | "revealed" {
  if (state.challenge.active && !state.challenge.revealed) return "active-hidden";
  if (state.challenge.revealed) return "revealed";
  return "inactive";
}

function isCopyLocked(): boolean {
  return isChallengeCopyLocked({
    challengeActive: state.challenge.active,
    challengeRevealed: state.challenge.revealed,
  });
}

function syncCopyLockState() {
  const locked = isCopyLocked();
  copyResults.disabled = locked;
  copyResults.setAttribute("aria-disabled", String(locked));
  copyLockHint.hidden = !locked;

  const evidenceReady = state.challenge.revealed && state.challenge.lastEvidence !== null;
  copyChallengeEvidence.hidden = !state.challenge.revealed;
  copyChallengeEvidence.disabled = !evidenceReady;
  copyChallengeEvidence.setAttribute("aria-disabled", String(!evidenceReady));
}

function syncPlaybarState() {
  const running = sweepFrame !== 0;
  playBtn.disabled = running || prefersReducedMotion;
  pauseBtn.disabled = !running;
  playbarState.textContent = running
    ? `Sweeping ${sweepDirection > 0 ? "outward" : "inward"}`
    : "Sweep paused";
}

function stopRadiusSweep() {
  if (sweepFrame !== 0) {
    window.cancelAnimationFrame(sweepFrame);
    sweepFrame = 0;
  }
  sweepLastTimestamp = 0;
  syncPlaybarState();
}

function startRadiusSweep() {
  if (prefersReducedMotion) {
    setLiveRegionText(status, "Reduced motion enabled; autoplay sweep is disabled.");
    return;
  }
  if (sweepFrame !== 0) return;

  sweepLastTimestamp = 0;
  const tick = (timestamp: number) => {
    if (sweepFrame === 0) return;
    if (sweepLastTimestamp === 0) {
      sweepLastTimestamp = timestamp;
      sweepFrame = window.requestAnimationFrame(tick);
      return;
    }

    const dtSec = Math.min(0.12, (timestamp - sweepLastTimestamp) / 1000);
    sweepLastTimestamp = timestamp;
    const speed = Number(speedSelect.value) || 1;
    const next = advanceRadiusSweep({
      radiusKpc: state.radiusMarkerKpc,
      minKpc: 0.5,
      maxKpc: 50,
      direction: sweepDirection,
      deltaKpc: RADIUS_SWEEP_RATE_KPC_PER_SEC * speed * dtSec,
    });
    sweepDirection = next.direction;
    state.radiusMarkerKpc = next.radiusKpc;
    render();
    sweepFrame = window.requestAnimationFrame(tick);
  };

  sweepFrame = window.requestAnimationFrame(tick);
  syncPlaybarState();
}

function drawGalaxyView(curveSample: RotationCurvePoint) {
  clearSvg(galaxyView);

  const width = 600;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;

  const defs = svgEl("defs");
  const glowFilter = svgEl("filter", { id: "galaxyGlow", x: "-40%", y: "-40%", width: "180%", height: "180%" });
  glowFilter.appendChild(svgEl("feGaussianBlur", { stdDeviation: "5", result: "blur" }));
  const merge = svgEl("feMerge");
  merge.appendChild(svgEl("feMergeNode", { in: "blur" }));
  merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
  glowFilter.appendChild(merge);
  defs.appendChild(glowFilter);

  const diskGrad = svgEl("radialGradient", { id: "diskGrad", cx: "50%", cy: "50%", r: "50%" });
  diskGrad.appendChild(svgEl("stop", { offset: "0%", "stop-color": "var(--cp-celestial-sun)", "stop-opacity": "0.95" }));
  diskGrad.appendChild(svgEl("stop", { offset: "55%", "stop-color": "var(--cp-celestial-earth)", "stop-opacity": "0.34" }));
  diskGrad.appendChild(svgEl("stop", { offset: "100%", "stop-color": "var(--cp-celestial-orbit)", "stop-opacity": "0.05" }));
  defs.appendChild(diskGrad);

  const haloGrad = svgEl("radialGradient", { id: "haloGrad", cx: "50%", cy: "50%", r: "50%" });
  haloGrad.appendChild(svgEl("stop", { offset: "0%", "stop-color": "var(--cp-celestial-orbit)", "stop-opacity": "0.24" }));
  haloGrad.appendChild(svgEl("stop", { offset: "100%", "stop-color": "var(--cp-celestial-orbit)", "stop-opacity": "0.02" }));
  defs.appendChild(haloGrad);
  galaxyView.appendChild(defs);

  const derived = GalaxyRotationModel.nfwDerived({
    haloMass10: state.params.haloMass10,
    haloScaleRadiusKpc: state.params.haloScaleRadiusKpc,
  });

  const haloRadius = clamp((derived.rVirKpc / 260) * 255, 110, 280);
  galaxyView.appendChild(svgEl("circle", {
    cx,
    cy,
    r: haloRadius,
    fill: "url(#haloGrad)",
    filter: "url(#galaxyGlow)",
  }));

  galaxyView.appendChild(svgEl("circle", {
    cx,
    cy,
    r: 158,
    fill: "url(#diskGrad)",
    filter: "url(#galaxyGlow)",
  }));

  for (let arm = 0; arm < 2; arm += 1) {
    const pathParts: string[] = [];
    for (let theta = 0; theta <= 5.8 * Math.PI; theta += 0.15) {
      const radius = 30 + 14 * theta;
      const phase = theta + arm * Math.PI;
      const x = cx + radius * Math.cos(phase) * 0.9;
      const y = cy + radius * Math.sin(phase) * 0.58;
      pathParts.push(`${pathParts.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    galaxyView.appendChild(svgEl("path", {
      d: pathParts.join(" "),
      stroke: "color-mix(in srgb, var(--cp-celestial-orbit) 45%, transparent)",
      "stroke-width": 1.3,
      fill: "none",
    }));
  }

  galaxyView.appendChild(svgEl("circle", {
    cx,
    cy,
    r: 24,
    fill: "var(--cp-celestial-sun-core)",
    filter: "url(#galaxyGlow)",
  }));

  const slitY = cy;
  const slitLeft = 72;
  const slitRight = width - 72;
  galaxyView.appendChild(svgEl("line", {
    x1: slitLeft,
    y1: slitY,
    x2: cx,
    y2: slitY,
    stroke: "var(--cp-accent-cyan)",
    "stroke-width": 4,
    "stroke-linecap": "round",
  }));
  galaxyView.appendChild(svgEl("line", {
    x1: cx,
    y1: slitY,
    x2: slitRight,
    y2: slitY,
    stroke: "var(--cp-accent-red)",
    "stroke-width": 4,
    "stroke-linecap": "round",
  }));

  const markerX = cx + ((state.radiusMarkerKpc / 50) * (slitRight - cx));
  galaxyView.appendChild(svgEl("line", {
    x1: markerX,
    y1: slitY - 24,
    x2: markerX,
    y2: slitY + 24,
    stroke: "var(--cp-celestial-sun-core)",
    "stroke-width": 3,
  }));

  const labelBlue = svgEl("text", { x: slitLeft - 8, y: slitY - 10, fill: "var(--cp-accent-cyan)", "font-size": 12 });
  labelBlue.textContent = "Blueshift";
  galaxyView.appendChild(labelBlue);
  const labelRed = svgEl("text", { x: slitRight - 56, y: slitY - 10, fill: "var(--cp-accent-red)", "font-size": 12 });
  labelRed.textContent = "Redshift";
  galaxyView.appendChild(labelRed);

  const note = svgEl("text", { x: 16, y: 580, fill: "var(--cp-muted)", "font-size": 11 });
  note.textContent = "Schematic face-on view. V(R) is intrinsic inclination-corrected velocity.";
  galaxyView.appendChild(note);

  const presetLabel = state.challenge.active && !state.challenge.revealed
    ? "mystery preset"
    : state.presetId === "custom"
      ? "custom model"
      : PRESETS[state.presetId].label;
  galaxyView.setAttribute(
    "aria-label",
    `Galaxy schematic for ${presetLabel}. Radius marker at ${formatNumber(state.radiusMarkerKpc, 1)} kiloparsecs. Total velocity ${formatNumber(curveSample.vTotalKmS, 1)} kilometers per second.`,
  );
}

function drawLine(args: {
  points: Array<{ x: number; y: number }>;
  color: string;
  width?: number;
  dash?: number[];
}) {
  if (args.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = args.color;
  ctx.lineWidth = args.width ?? 1.5;
  ctx.setLineDash(args.dash ?? []);
  ctx.beginPath();
  ctx.moveTo(args.points[0].x, args.points[0].y);
  for (const point of args.points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawVelocityInset(curve: RotationCurvePoint[], region: { x: number; y: number; w: number; h: number }) {
  if (!state.show.inset || state.plotMode !== "velocity") return;

  const solar = [
    { rNorm: 0.387, vNorm: 1.607 },
    { rNorm: 0.723, vNorm: 1.176 },
    { rNorm: 1.0, vNorm: 1.0 },
    { rNorm: 1.524, vNorm: 0.809 },
    { rNorm: 5.203, vNorm: 0.439 },
  ];

  const refSample = sampleCurveAtRadius(curve, 8.2);
  const refVelocity = Math.max(refSample.vTotalKmS, 1e-6);
  const normalizedCurve = curve
    .filter((row) => row.radiusKpc <= 49.2)
    .map((row) => ({
      x: row.radiusKpc / 8.2,
      y: row.vTotalKmS / refVelocity,
    }))
    .filter((row) => row.x <= 6);

  const xFrom = (x: number) => region.x + (x / 6) * region.w;
  const yFrom = (y: number) => region.y + region.h - (y / 1.5) * region.h;

  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 22, 0.78)";
  ctx.strokeStyle = "rgba(212, 224, 248, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(region.x, region.y, region.w, region.h);
  ctx.fill();
  ctx.stroke();

  drawLine({
    points: normalizedCurve.map((row) => ({ x: xFrom(row.x), y: yFrom(row.y) })),
    color: "rgba(255, 206, 115, 0.92)",
    width: 1.7,
  });

  drawLine({
    points: [
      { x: xFrom(0.25), y: yFrom(Math.pow(0.25, -0.5)) },
      { x: xFrom(6), y: yFrom(Math.pow(6, -0.5)) },
    ],
    color: "rgba(132, 210, 255, 0.78)",
    width: 1.2,
    dash: [4, 3],
  });

  for (const planet of solar) {
    if (planet.rNorm > 6) continue;
    ctx.fillStyle = "rgba(255, 206, 115, 0.85)";
    ctx.beginPath();
    ctx.arc(xFrom(planet.rNorm), yFrom(planet.vNorm), 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(226, 234, 248, 0.9)";
  ctx.font = "11px var(--cp-font-sans, ui-sans-serif)";
  ctx.fillText("Solar System vs Galaxy", region.x + 8, region.y + 14);
  ctx.restore();
}

function drawCurvePlot(curve: RotationCurvePoint[], sample: RotationCurvePoint) {
  const { width, height } = resizePlotCanvas();
  ctx.clearRect(0, 0, width, height);

  const left = 54;
  const right = width - 16;
  const top = 16;
  const bottom = height - 30;
  const plotWidth = right - left;
  const plotHeight = bottom - top;

  ctx.fillStyle = "rgba(8, 12, 22, 0.76)";
  ctx.fillRect(left, top, plotWidth, plotHeight);

  const xFromRadius = (radiusKpc: number) => left + (radiusKpc / 50) * plotWidth;

  const velocityYMax = state.plotMode === "velocity"
    ? Math.max(
      240,
      ...curve.map((row) => row.vTotalKmS),
      ...(state.show.keplerian ? curve.map((row) => row.vKeplerianKmS) : [0]),
      ...(state.show.halo ? curve.map((row) => row.vHaloKmS) : [0]),
      ...(state.show.disk ? curve.map((row) => row.vDiskKmS) : [0]),
      ...(state.show.bulge ? curve.map((row) => row.vBulgeKmS) : [0]),
      ...(state.show.mond ? curve.map((row) => row.vMondKmS) : [0]),
    )
    : Math.max(10, ...curve.map((row) => row.mTotal10));

  const yFromValue = (value: number) => top + plotHeight - (value / velocityYMax) * plotHeight;

  ctx.strokeStyle = "rgba(217, 226, 243, 0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = left + (i / 5) * plotWidth;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let i = 0; i <= 5; i += 1) {
    const y = top + (i / 5) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const totalPoints = curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(state.plotMode === "velocity" ? row.vTotalKmS : row.mTotal10) }));
  const visiblePoints = curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(state.plotMode === "velocity" ? row.vKeplerianKmS : row.mVisible10) }));
  const darkPoints = curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(state.plotMode === "velocity" ? row.vHaloKmS : row.mDark10) }));

  if (state.plotMode === "velocity" && state.show.keplerian) {
    ctx.save();
    ctx.fillStyle = "rgba(242, 140, 140, 0.12)";
    ctx.beginPath();
    for (let i = 0; i < totalPoints.length; i += 1) {
      const p = totalPoints[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    for (let i = visiblePoints.length - 1; i >= 0; i -= 1) {
      const p = visiblePoints[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawLine({ points: totalPoints, color: "rgba(255, 206, 115, 0.95)", width: 2.6 });

  if (state.plotMode === "velocity") {
    if (state.show.keplerian) {
      drawLine({ points: visiblePoints, color: "rgba(132, 210, 255, 0.85)", width: 1.8, dash: [6, 4] });
    }
    if (state.show.disk) {
      drawLine({
        points: curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(row.vDiskKmS) })),
        color: "rgba(145, 227, 154, 0.9)",
        width: 1.4,
        dash: [8, 3, 2, 3],
      });
    }
    if (state.show.bulge) {
      drawLine({
        points: curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(row.vBulgeKmS) })),
        color: "rgba(255, 173, 173, 0.9)",
        width: 1.4,
        dash: [2, 4],
      });
    }
    if (state.show.halo) {
      drawLine({
        points: curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(row.vHaloKmS) })),
        color: "rgba(189, 154, 255, 0.9)",
        width: 1.4,
        dash: [10, 4],
      });
    }
    if (state.show.mond) {
      drawLine({
        points: curve.map((row) => ({ x: xFromRadius(row.radiusKpc), y: yFromValue(row.vMondKmS) })),
        color: "rgba(255, 133, 188, 0.9)",
        width: 1.4,
      });
    }
  } else {
    drawLine({ points: visiblePoints, color: "rgba(132, 210, 255, 0.85)", width: 1.8, dash: [6, 4] });
    drawLine({ points: darkPoints, color: "rgba(189, 154, 255, 0.9)", width: 1.4, dash: [10, 4] });

    const crossing = findDarkDominanceRadiusKpc(curve.map((row) => ({
      radiusKpc: row.radiusKpc,
      vTotalKmS: row.vTotalKmS,
      vKeplerianKmS: row.vKeplerianKmS,
      mVisible10: row.mVisible10,
      mDark10: row.mDark10,
      mTotal10: row.mTotal10,
    })));
    if (crossing !== null) {
      const x = xFromRadius(crossing);
      ctx.save();
      ctx.strokeStyle = "rgba(255, 164, 98, 0.9)";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 199, 155, 0.95)";
      ctx.font = "11px var(--cp-font-sans, ui-sans-serif)";
      ctx.fillText(`M_dark = M_vis near ${formatNumber(crossing, 1)} kpc`, Math.min(x + 6, right - 165), top + 14);
      ctx.restore();
    }
  }

  const markerX = xFromRadius(state.radiusMarkerKpc);
  const markerY = yFromValue(state.plotMode === "velocity" ? sample.vTotalKmS : sample.mTotal10);
  ctx.save();
  ctx.strokeStyle = "rgba(252, 245, 225, 0.55)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(markerX, top);
  ctx.lineTo(markerX, bottom);
  ctx.moveTo(left, markerY);
  ctx.lineTo(right, markerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#fff2cf";
  ctx.beginPath();
  ctx.arc(markerX, markerY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(226, 234, 248, 0.9)";
  ctx.font = "12px var(--cp-font-sans, ui-sans-serif)";
  ctx.fillText("R (kpc)", right - 42, bottom + 20);
  const yLabel = state.plotMode === "velocity" ? "V (km/s)" : "M(<R) (10^10 Msun)";
  ctx.fillText(yLabel, left + 2, top + 12);

  drawVelocityInset(curve, {
    x: right - 210,
    y: top + 8,
    w: 190,
    h: 130,
  });
}

function currentPresetLabel() {
  if (state.presetId === "custom") return "Custom";
  return PRESETS[state.presetId].label;
}

function exportResults(curveSample: RotationCurvePoint): ExportPayloadV1 {
  const derived = GalaxyRotationModel.nfwDerived({
    haloMass10: state.params.haloMass10,
    haloScaleRadiusKpc: state.params.haloScaleRadiusKpc,
  });
  return buildGalaxyRotationExportPayload({
    presetLabel: currentPresetLabel(),
    plotMode: state.plotMode,
    radiusKpc: state.radiusMarkerKpc,
    params: state.params,
    derived: {
      concentration: derived.concentration,
      rVirKpc: derived.rVirKpc,
    },
    readouts: {
      vTotalKmS: curveSample.vTotalKmS,
      vKeplerianKmS: curveSample.vKeplerianKmS,
      vMondKmS: curveSample.vMondKmS,
      mTotal10: curveSample.mTotal10,
      mVisible10: curveSample.mVisible10,
      mDark10: curveSample.mDark10,
      darkVisRatio: curveSample.darkVisRatio,
      baryonFraction: curveSample.baryonFraction,
      deltaLambda21mm: curveSample.deltaLambda21mm,
    },
    challengeState: challengeStateLabel(),
  });
}

function render() {
  const curve = curveForParams(state.params);
  const sample = sampleCurveAtRadius(curve, state.radiusMarkerKpc);
  const derived = GalaxyRotationModel.nfwDerived({
    haloMass10: state.params.haloMass10,
    haloScaleRadiusKpc: state.params.haloScaleRadiusKpc,
  });

  haloMassSlider.value = String(state.params.haloMass10);
  haloScaleSlider.value = String(state.params.haloScaleRadiusKpc);
  diskMassSlider.value = String(state.params.diskMass10);
  diskScaleSlider.value = String(state.params.diskScaleLengthKpc);
  bulgeMassSlider.value = String(state.params.bulgeMass10);
  bulgeScaleSlider.value = String(state.params.bulgeScaleKpc);
  radiusSlider.value = String(state.radiusMarkerKpc);
  const challengeHidden = state.challenge.active && !state.challenge.revealed;
  presetSelect.value = challengeHidden ? "custom" : state.presetId;
  presetSelect.disabled = state.challenge.active;

  haloMassSliderValue.textContent = formatNumber(state.params.haloMass10, 1);
  haloScaleSliderValue.textContent = formatNumber(state.params.haloScaleRadiusKpc, 1);
  diskMassSliderValue.textContent = formatNumber(state.params.diskMass10, 1);
  diskScaleSliderValue.textContent = formatNumber(state.params.diskScaleLengthKpc, 1);
  bulgeMassSliderValue.textContent = formatNumber(state.params.bulgeMass10, 1);
  bulgeScaleSliderValue.textContent = formatNumber(state.params.bulgeScaleKpc, 2);
  radiusSliderValue.textContent = formatNumber(state.radiusMarkerKpc, 1);

  const lockedPreset = state.presetId !== "custom";
  const modelControlsLocked = lockedPreset && !state.challenge.active;
  haloMassSlider.disabled = modelControlsLocked;
  haloScaleSlider.disabled = modelControlsLocked;
  diskMassSlider.disabled = modelControlsLocked;
  diskScaleSlider.disabled = modelControlsLocked;
  bulgeMassSlider.disabled = modelControlsLocked;
  bulgeScaleSlider.disabled = modelControlsLocked;
  for (const row of modelControlRows) {
    row.hidden = false;
  }

  plotVelocity.setAttribute("aria-checked", String(state.plotMode === "velocity"));
  plotMass.setAttribute("aria-checked", String(state.plotMode === "mass"));
  plotVelocity.tabIndex = state.plotMode === "velocity" ? 0 : -1;
  plotMass.tabIndex = state.plotMode === "mass" ? 0 : -1;

  showKeplerian.checked = state.show.keplerian;
  showDisk.checked = state.show.disk;
  showBulge.checked = state.show.bulge;
  showHalo.checked = state.show.halo;
  showMond.checked = state.show.mond;
  insetToggle.checked = state.show.inset;
  insetToggle.disabled = state.plotMode !== "velocity";

  challengePanel.hidden = !(state.challenge.active || state.challenge.revealed);
  const activePrompt = challengeEngine.getCurrentChallenge()?.prompt;
  challengePrompt.textContent = state.challenge.revealed
    ? "Answer revealed. Start another challenge to try a new hidden target."
    : activePrompt ?? "Guess the hidden preset and whether its outer curve is flat or Keplerian decline.";
  challengeGuessPreset.value = state.challenge.guessPreset;
  guessFlat.setAttribute("aria-checked", String(state.challenge.guessBehavior === "flat"));
  guessKeplerian.setAttribute("aria-checked", String(state.challenge.guessBehavior === "keplerian"));
  guessFlat.tabIndex = state.challenge.guessBehavior === "flat" ? 0 : -1;
  guessKeplerian.tabIndex = state.challenge.guessBehavior === "keplerian" ? 0 : -1;
  checkChallenge.disabled = !state.challenge.active;
  challengeHint.disabled = !state.challenge.active;

  syncCopyLockState();
  syncPlaybarState();

  radiusValue.textContent = formatNumber(state.radiusMarkerKpc, 1);
  if (challengeHidden) {
    vTotalValue.textContent = "\u2014";
    vKeplerianValue.textContent = "\u2014";
    mEnclosedValue.textContent = "\u2014";
    mVisibleValue.textContent = "\u2014";
    mDarkValue.textContent = "\u2014";
    darkVisRatioValue.textContent = "\u2014";
    baryonFracValue.textContent = "\u2014";
    deltaLambda21Value.textContent = "\u2014";
    concValue.textContent = "\u2014";
    rVirValue.textContent = "\u2014";
  } else {
    vTotalValue.textContent = formatNumber(sample.vTotalKmS, 2);
    vKeplerianValue.textContent = formatNumber(sample.vKeplerianKmS, 2);
    mEnclosedValue.textContent = formatNumber(sample.mTotal10, 3);
    mVisibleValue.textContent = formatNumber(sample.mVisible10, 3);
    mDarkValue.textContent = formatNumber(sample.mDark10, 3);
    darkVisRatioValue.textContent = Number.isFinite(sample.darkVisRatio) ? formatNumber(sample.darkVisRatio, 3) : "\u2014";
    baryonFracValue.textContent = formatNumber(sample.baryonFraction, 3);
    deltaLambda21Value.textContent = formatNumber(sample.deltaLambda21mm, 3);
    concValue.textContent = Number.isFinite(derived.concentration) ? formatNumber(derived.concentration, 2) : "\u2014";
    rVirValue.textContent = Number.isFinite(derived.rVirKpc) ? formatNumber(derived.rVirKpc, 1) : "\u2014";
  }

  drawGalaxyView(sample);
  drawCurvePlot(curve, sample);

  const presetLabel = state.challenge.active && !state.challenge.revealed ? "mystery preset" : currentPresetLabel();
  plotAria.textContent = `Rotation curve showing ${state.plotMode === "velocity" ? "velocity" : "enclosed mass"} versus radius for ${presetLabel}.`;
}

function applyKeyboardNudge(deltaKpc: number) {
  state.radiusMarkerKpc = clamp(state.radiusMarkerKpc + deltaKpc, 0.5, 50);
  render();
}

type ChallengeCheckState = {
  guessedPreset: Exclude<GalaxyPresetId, "custom">;
  guessedBehavior: OuterCurveBehavior;
  targetPreset: Exclude<GalaxyPresetId, "custom">;
  targetBehavior: OuterCurveBehavior;
};

const challenges: Challenge[] = [
  {
    type: "custom",
    prompt: "Scenario 1: Identify the hidden preset and outer-curve behavior.",
    hints: [
      "Check whether V_total stays nearly constant or declines like R^(-1/2) between 30 and 50 kpc.",
      "Dwarfs have lower overall speeds and high dark/visible ratios, while massive spirals peak higher.",
    ],
    check(rawState: unknown) {
      const payload = rawState as ChallengeCheckState;
      const correct = payload.guessedPreset === payload.targetPreset
        && payload.guessedBehavior === payload.targetBehavior;
      if (correct) {
        return {
          correct: true,
          close: true,
          message: `Correct. Hidden preset was ${PRESETS[payload.targetPreset].label} with ${payload.targetBehavior} outer behavior.`,
        };
      }
      return {
        correct: false,
        close: false,
        message: `Not yet. You guessed ${PRESETS[payload.guessedPreset].label} (${payload.guessedBehavior}); target was ${PRESETS[payload.targetPreset].label} (${payload.targetBehavior}).`,
      };
    },
  },
  {
    type: "custom",
    prompt: "Scenario 2: Classify whether the outer curve stays flat or follows Keplerian decline.",
    hints: [
      "Compare R=30 and R=50 kpc values before deciding.",
      "A pronounced R^(-1/2) falloff indicates Keplerian decline.",
    ],
    check(rawState: unknown) {
      const payload = rawState as ChallengeCheckState;
      const correct = payload.guessedPreset === payload.targetPreset
        && payload.guessedBehavior === payload.targetBehavior;
      return {
        correct,
        close: correct,
        message: correct
          ? "Correct. Your slope classification matches the hidden curve."
          : "Not yet. Use the outer-slope trend between 30 and 50 kpc as your evidence.",
      };
    },
  },
  {
    type: "custom",
    prompt: "Scenario 3: Estimate where dark matter dominates and use it to support your inference.",
    hints: [
      "Use mass mode and find where M_dark crosses M_vis.",
      "Combine dark-to-visible ratio with outer-slope behavior for your argument.",
    ],
    check(rawState: unknown) {
      const payload = rawState as ChallengeCheckState;
      const correct = payload.guessedPreset === payload.targetPreset
        && payload.guessedBehavior === payload.targetBehavior;
      return {
        correct,
        close: correct,
        message: correct
          ? "Correct. Your classification is consistent with dark-dominance evidence."
          : "Not yet. Re-check dark-mass dominance and slope evidence together.",
      };
    },
  },
];

const challengeEngine = new ChallengeEngine(challenges, {
  showUI: false,
  onProgress: () => {
    const prompt = challengeEngine.getCurrentChallenge()?.prompt;
    if (prompt) challengePrompt.textContent = prompt;
    setLiveRegionText(status, "Mystery challenge started. Inspect the curve, then check your guess.");
  },
  onStop: () => {
    syncCopyLockState();
  },
});

function startChallenge() {
  const target = pickChallengeTarget({
    targets: challengeTargets,
    random: challengeRandom ?? Math.random,
    previous: state.challenge.lastTarget,
  });

  state.challenge.active = true;
  state.challenge.revealed = false;
  state.challenge.target = target;
  state.challenge.lastTarget = target;
  state.challenge.guessPreset = "milky-way-like";
  state.challenge.guessBehavior = "flat";
  state.challenge.lastEvidence = null;

  state.presetId = "custom";
  state.params = { ...PRESETS[target.presetId].params };

  challengeEngine.start();
  render();
}

function stopChallenge() {
  if (!state.challenge.active && !state.challenge.revealed) return;
  state.challenge.active = false;
  state.challenge.revealed = false;
  state.challenge.target = null;
  state.challenge.lastEvidence = null;
  if (challengeEngine.isActive()) challengeEngine.stop();
  render();
  setLiveRegionText(status, "Challenge ended.");
}

function checkChallengeAnswer() {
  if (!state.challenge.active || !state.challenge.target) return;
  const curve = curveForParams(state.params);
  const sample = sampleCurveAtRadius(curve, state.radiusMarkerKpc);
  const result = challengeEngine.check({
    guessedPreset: state.challenge.guessPreset,
    guessedBehavior: state.challenge.guessBehavior,
    targetPreset: state.challenge.target.presetId,
    targetBehavior: state.challenge.target.outerBehavior,
  } satisfies ChallengeCheckState);

  state.challenge.active = false;
  state.challenge.revealed = true;
  state.challenge.lastEvidence = {
    guessedPresetLabel: PRESETS[state.challenge.guessPreset].label,
    guessedOuterBehavior: state.challenge.guessBehavior,
    targetPresetLabel: PRESETS[state.challenge.target.presetId].label,
    targetOuterBehavior: state.challenge.target.outerBehavior,
    correct: Boolean(result.correct),
    radiusKpc: state.radiusMarkerKpc,
    vTotalKmS: sample.vTotalKmS,
    vKeplerianKmS: sample.vKeplerianKmS,
    darkVisibleRatio: sample.darkVisRatio,
    baryonFraction: sample.baryonFraction,
    deltaLambda21mm: sample.deltaLambda21mm,
  };

  if (challengeEngine.isActive()) challengeEngine.stop();
  render();
  setLiveRegionText(status, result.message ?? "Challenge answer checked.");
}

presetSelect.addEventListener("change", () => {
  stopRadiusSweep();
  setPreset(presetSelect.value as GalaxyPresetId);
});

haloMassSlider.addEventListener("input", () => {
  stopRadiusSweep();
  setCustomFromSliderChange();
  render();
});
haloScaleSlider.addEventListener("input", () => {
  stopRadiusSweep();
  setCustomFromSliderChange();
  render();
});
diskMassSlider.addEventListener("input", () => {
  stopRadiusSweep();
  setCustomFromSliderChange();
  render();
});
diskScaleSlider.addEventListener("input", () => {
  stopRadiusSweep();
  setCustomFromSliderChange();
  render();
});
bulgeMassSlider.addEventListener("input", () => {
  stopRadiusSweep();
  setCustomFromSliderChange();
  render();
});
bulgeScaleSlider.addEventListener("input", () => {
  stopRadiusSweep();
  setCustomFromSliderChange();
  render();
});

radiusSlider.addEventListener("input", () => {
  stopRadiusSweep();
  state.radiusMarkerKpc = Number(radiusSlider.value);
  render();
  const curve = curveForParams(state.params);
  const sample = sampleCurveAtRadius(curve, state.radiusMarkerKpc);
  const dominant = sample.mDark10 >= sample.mVisible10 ? "dark matter halo" : "visible baryons";
  setLiveRegionText(
    status,
    `Radius ${formatNumber(state.radiusMarkerKpc, 1)} kpc, V total ${formatNumber(sample.vTotalKmS, 1)} km/s, dominant mass component: ${dominant}.`,
  );
});

plotVelocity.addEventListener("click", () => setPlotMode("velocity"));
plotMass.addEventListener("click", () => setPlotMode("mass"));
bindButtonRadioGroup({
  buttons: [plotVelocity, plotMass],
  getSelectedIndex: () => (state.plotMode === "velocity" ? 0 : 1),
  setSelectedIndex: (index) => setPlotMode(index === 0 ? "velocity" : "mass", true),
});

showKeplerian.addEventListener("change", () => {
  stopRadiusSweep();
  state.show.keplerian = showKeplerian.checked;
  render();
});
showDisk.addEventListener("change", () => {
  stopRadiusSweep();
  state.show.disk = showDisk.checked;
  render();
});
showBulge.addEventListener("change", () => {
  stopRadiusSweep();
  state.show.bulge = showBulge.checked;
  render();
});
showHalo.addEventListener("change", () => {
  stopRadiusSweep();
  state.show.halo = showHalo.checked;
  render();
});
showMond.addEventListener("change", () => {
  stopRadiusSweep();
  state.show.mond = showMond.checked;
  render();
});
insetToggle.addEventListener("change", () => {
  stopRadiusSweep();
  state.show.inset = insetToggle.checked;
  render();
});

challengeModeBtn.addEventListener("click", () => {
  stopRadiusSweep();
  startChallenge();
});
guessFlat.addEventListener("click", () => {
  stopRadiusSweep();
  state.challenge.guessBehavior = "flat";
  render();
});
guessKeplerian.addEventListener("click", () => {
  stopRadiusSweep();
  state.challenge.guessBehavior = "keplerian";
  render();
});
bindButtonRadioGroup({
  buttons: [guessFlat, guessKeplerian],
  getSelectedIndex: () => (state.challenge.guessBehavior === "flat" ? 0 : 1),
  setSelectedIndex: (index) => {
    state.challenge.guessBehavior = index === 0 ? "flat" : "keplerian";
    render();
  },
});
challengeGuessPreset.addEventListener("change", () => {
  stopRadiusSweep();
  state.challenge.guessPreset = challengeGuessPreset.value as Exclude<GalaxyPresetId, "custom">;
});
checkChallenge.addEventListener("click", () => {
  stopRadiusSweep();
  checkChallengeAnswer();
});
challengeHint.addEventListener("click", () => {
  if (!state.challenge.active) {
    setLiveRegionText(status, "Start a challenge to request a hint.");
    return;
  }
  const hint = challengeEngine.getHint();
  if (!hint) {
    setLiveRegionText(status, "No more hints available for this challenge.");
    return;
  }
  setLiveRegionText(status, `Hint: ${hint}`);
});
endChallenge.addEventListener("click", () => {
  stopRadiusSweep();
  stopChallenge();
});

copyChallengeEvidence.addEventListener("click", () => {
  if (!state.challenge.lastEvidence) {
    setLiveRegionText(status, "Challenge evidence is available only after checking an answer.");
    return;
  }
  const text = buildChallengeEvidenceText({
    ...state.challenge.lastEvidence,
    checkedAtIso: new Date().toISOString(),
  });
  void copyTextToClipboard(text)
    .then(() => setLiveRegionText(status, "Copied challenge evidence to clipboard."))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Copy failed.";
      setLiveRegionText(status, `Copy failed: ${message}`);
    });
});

copyResults.addEventListener("click", () => {
  if (isCopyLocked()) {
    setLiveRegionText(status, "Copy Results is locked until you check or end the mystery challenge.");
    return;
  }
  const curve = curveForParams(state.params);
  const sample = sampleCurveAtRadius(curve, state.radiusMarkerKpc);
  void runtime.copyResults(exportResults(sample))
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Copy failed.";
      setLiveRegionText(status, `Copy failed: ${message}`);
    });
});

playBtn.addEventListener("click", () => {
  startRadiusSweep();
});

pauseBtn.addEventListener("click", () => {
  stopRadiusSweep();
});

stepBackBtn.addEventListener("click", () => {
  stopRadiusSweep();
  sweepDirection = -1;
  state.radiusMarkerKpc = clamp(state.radiusMarkerKpc - 1, 0.5, 50);
  render();
});

stepForwardBtn.addEventListener("click", () => {
  stopRadiusSweep();
  sweepDirection = 1;
  state.radiusMarkerKpc = clamp(state.radiusMarkerKpc + 1, 0.5, 50);
  render();
});

resetBtn.addEventListener("click", () => {
  stopRadiusSweep();
  sweepDirection = 1;
  state.radiusMarkerKpc = 10;
  render();
  setLiveRegionText(status, "Radius marker reset to 10.0 kpc.");
});

speedSelect.addEventListener("change", () => {
  syncPlaybarState();
  const speed = Number(speedSelect.value) || 1;
  setLiveRegionText(status, `Sweep speed set to ${formatNumber(speed, 0)}x.`);
});

window.addEventListener("resize", () => render());

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Keyboard shortcuts work when focus is not in an editable field.",
    sections: [
      {
        heading: "Shortcuts",
        type: "shortcuts",
        items: [
          { key: "?", action: "Toggle help" },
          { key: "g", action: "Toggle station mode" },
          { key: "k", action: "Toggle Keplerian curve" },
          { key: "m", action: "Toggle MOND curve" },
          { key: "s", action: "Toggle solar-system inset" },
          { key: "p", action: "Toggle plot mode" },
          { key: "[ / ]", action: "Move radius marker by 2 kpc" },
          { key: "1-4", action: "Activate preset 1-4" },
        ],
      },
      {
        heading: "What to notice",
        type: "bullets",
        items: [
          "No-halo curves decline nearly Keplerian at large radius.",
          "Halo mass and scale radius flatten the outer curve and increase M_dark/M_vis.",
          "Mass mode highlights where dark mass exceeds visible mass.",
        ],
      },
    ],
  },
  station: {
    title: "Station Mode: Galaxy Rotation",
    subtitle: "Collect snapshot rows and radial profile comparisons.",
    steps: [
      "Record a snapshot at your chosen radius marker.",
      "Add the radial profile row set and identify where dark matter dominates.",
      "Compare baryon fraction at 50 kpc with the cosmic value (0.157).",
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "radiusKpc", label: "R (kpc)" },
      { key: "vTotalKmS", label: "V_total (km/s)" },
      { key: "vKeplerianKmS", label: "V_Kep (km/s)" },
      { key: "vMondKmS", label: "V_MOND (km/s)" },
      { key: "mEnclosed10", label: "M_total(<R) (10^10 Msun)" },
      { key: "mVisible10", label: "M_vis(<R) (10^10 Msun)" },
      { key: "mDark10", label: "M_dark(<R) (10^10 Msun)" },
      { key: "darkVisRatio", label: "M_dark/M_vis" },
      { key: "baryonFrac", label: "f_b" },
      { key: "deltaLambda21mm", label: "Delta-lambda_21 (mm)" },
    ],
    getSnapshotRow() {
      const curve = curveForParams(state.params);
      const sample = sampleCurveAtRadius(curve, state.radiusMarkerKpc);
      return {
        case: "Snapshot",
        radiusKpc: formatNumber(state.radiusMarkerKpc, 1),
        vTotalKmS: formatNumber(sample.vTotalKmS, 2),
        vKeplerianKmS: formatNumber(sample.vKeplerianKmS, 2),
        vMondKmS: formatNumber(sample.vMondKmS, 2),
        mEnclosed10: formatNumber(sample.mTotal10, 3),
        mVisible10: formatNumber(sample.mVisible10, 3),
        mDark10: formatNumber(sample.mDark10, 3),
        darkVisRatio: Number.isFinite(sample.darkVisRatio) ? formatNumber(sample.darkVisRatio, 3) : "\u2014",
        baryonFrac: formatNumber(sample.baryonFraction, 3),
        deltaLambda21mm: formatNumber(sample.deltaLambda21mm, 3),
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add radial profile rows",
        getRows() {
          const curve = curveForParams(state.params);
          return RADIAL_PROFILE_SAMPLE_KPC.map((radiusKpc) => {
            const sample = sampleCurveAtRadius(curve, radiusKpc);
            return {
              case: `R=${radiusKpc} kpc`,
              radiusKpc: formatNumber(radiusKpc, 1),
              vTotalKmS: formatNumber(sample.vTotalKmS, 2),
              vKeplerianKmS: formatNumber(sample.vKeplerianKmS, 2),
              vMondKmS: formatNumber(sample.vMondKmS, 2),
              mEnclosed10: formatNumber(sample.mTotal10, 3),
              mVisible10: formatNumber(sample.mVisible10, 3),
              mDark10: formatNumber(sample.mDark10, 3),
              darkVisRatio: Number.isFinite(sample.darkVisRatio) ? formatNumber(sample.darkVisRatio, 3) : "\u2014",
              baryonFrac: formatNumber(sample.baryonFraction, 3),
              deltaLambda21mm: formatNumber(sample.deltaLambda21mm, 3),
            };
          });
        },
      },
    ],
    synthesisPrompt:
      "Plot $M_{\\rm dark}/M_{\\rm vis}$ versus $R$. Where does dark matter begin to dominate, and how does $f_b(50\\,{\\rm kpc})$ compare to the cosmic value $0.157$?",
  },
});

demoModes.bindButtons({ helpButton: help, stationButton: stationMode });

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
    return;
  }

  switch (event.key) {
    case "k":
      event.preventDefault();
      stopRadiusSweep();
      state.show.keplerian = !state.show.keplerian;
      render();
      break;
    case "m":
      event.preventDefault();
      stopRadiusSweep();
      state.show.mond = !state.show.mond;
      render();
      break;
    case "s":
      event.preventDefault();
      stopRadiusSweep();
      state.show.inset = !state.show.inset;
      render();
      break;
    case "p":
      event.preventDefault();
      setPlotMode(state.plotMode === "velocity" ? "mass" : "velocity", false);
      break;
    case "[":
      event.preventDefault();
      stopRadiusSweep();
      applyKeyboardNudge(-2);
      break;
    case "]":
      event.preventDefault();
      stopRadiusSweep();
      applyKeyboardNudge(2);
      break;
    case "1":
      event.preventDefault();
      stopRadiusSweep();
      setPreset("milky-way-like");
      break;
    case "2":
      event.preventDefault();
      stopRadiusSweep();
      setPreset("dwarf-galaxy");
      break;
    case "3":
      event.preventDefault();
      stopRadiusSweep();
      setPreset("massive-spiral");
      break;
    case "4":
      event.preventDefault();
      stopRadiusSweep();
      setPreset("no-dark-matter");
      break;
    default:
      break;
  }
});

if (prefersReducedMotion) {
  setLiveRegionText(status, "Reduced motion enabled; autoplay sweep is disabled.");
}

render();
initMath(document);

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}
