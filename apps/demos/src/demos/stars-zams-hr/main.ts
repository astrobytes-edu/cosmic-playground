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
import {
  HrInferencePopulationModel,
  type HrStarStage,
  type PopulationStar,
  ZamsTout1996Model
} from "@cosmic/physics";
import {
  OBSERVER_AXIS_LIMITS,
  type PlotPoint,
  RADIUS_GUIDE_VALUES_RSUN,
  THEORIST_AXIS_LIMITS,
  clamp,
  cmdCoordinates,
  formatNumber,
  formatWithUnit,
  hrCoordinates,
  linearTicks,
  logTicks,
  luminosityLsunFromRadiusTemperature,
  massColorHex,
  radiusRsunFromLuminosityTemperature,
  selectBoundaryStar,
  selectNextStarByDirection
} from "./logic";

type PlotMode = "observer" | "theorist";

type DemoState = {
  plotMode: PlotMode;
  showRadiusLines: boolean;
  revealMassColors: boolean;
  seed: string;
  populationSize: number;
  distancePc: number;
  photErr: number;
  modeCluster: boolean;
  clusterAgeGyr: number;
  binaryFrac: number;
  metallicityZ: number;
  population: PopulationStar[];
  selectedStarId: string | null;
  evolveMassMsun: number;
  evolveTimeGyr: number;
  claims: string[];
};

type CanvasPoint = PlotPoint & {
  radiusPx: number;
};

type TrackPoint = {
  timeGyr: number;
  stage: HrStarStage;
  teffK: number;
  luminosityLsun: number;
  radiusRsun: number;
};

const T_SUN_K = ZamsTout1996Model.CONSTANTS.tSunK;
const EVOLVE_MASSES_MSUN = [0.8, 1, 2, 5, 10, 20] as const;

const stageLabels: Record<HrStarStage, string> = {
  ms: "Main sequence",
  subgiant: "Subgiant",
  giant: "Giant",
  supergiant: "Supergiant",
  white_dwarf: "White dwarf",
  compact_remnant: "Compact remnant"
};

const neutralPointColor = "var(--cp-chart-1)";

const massLegendGradient = `linear-gradient(90deg, ${massColorHex(0.1)}, ${massColorHex(1)}, ${massColorHex(
  5
)}, ${massColorHex(20)}, ${massColorHex(50)})`;

const modeObserver = document.querySelector<HTMLButtonElement>("#modeObserver");
const modeTheorist = document.querySelector<HTMLButtonElement>("#modeTheorist");
const showRadiusLines = document.querySelector<HTMLInputElement>("#showRadiusLines");
const revealMassColors = document.querySelector<HTMLInputElement>("#revealMassColors");

const seedInput = document.querySelector<HTMLInputElement>("#seedInput");
const populationSizeInput = document.querySelector<HTMLInputElement>("#populationSize");
const distanceInput = document.querySelector<HTMLInputElement>("#distancePc");
const photErrInput = document.querySelector<HTMLInputElement>("#photErr");
const metallicityInput = document.querySelector<HTMLInputElement>("#metallicityZ");
const clusterModeInput = document.querySelector<HTMLInputElement>("#clusterMode");
const clusterAgeInput = document.querySelector<HTMLInputElement>("#clusterAge");
const clusterAgeValue = document.querySelector<HTMLSpanElement>("#clusterAgeValue");
const binaryFracInput = document.querySelector<HTMLInputElement>("#binaryFrac");
const binaryFracValue = document.querySelector<HTMLSpanElement>("#binaryFracValue");
const regenerateButton = document.querySelector<HTMLButtonElement>("#regeneratePopulation");

const evolveMass = document.querySelector<HTMLSelectElement>("#evolveMass");
const evolveTime = document.querySelector<HTMLInputElement>("#evolveTime");
const evolveTimeValue = document.querySelector<HTMLSpanElement>("#evolveTimeValue");
const evolveMsLifetime = document.querySelector<HTMLSpanElement>("#evolveMsLifetime");
const evolveStage = document.querySelector<HTMLSpanElement>("#evolveStage");
const evolveMessage = document.querySelector<HTMLParagraphElement>("#evolveMessage");

const selectedStage = document.querySelector<HTMLSpanElement>("#selectedStage");
const selectedLuminosity = document.querySelector<HTMLSpanElement>("#selectedLuminosity");
const selectedTeff = document.querySelector<HTMLSpanElement>("#selectedTeff");
const selectedRadius = document.querySelector<HTMLSpanElement>("#selectedRadius");
const selectedMass = document.querySelector<HTMLSpanElement>("#selectedMass");

const claimInput = document.querySelector<HTMLInputElement>("#claimInput");
const addClaim = document.querySelector<HTMLButtonElement>("#addClaim");
const exportClaims = document.querySelector<HTMLButtonElement>("#exportClaims");
const clearClaims = document.querySelector<HTMLButtonElement>("#clearClaims");
const claimList = document.querySelector<HTMLUListElement>("#claimList");

const massLegend = document.querySelector<HTMLDivElement>("#massLegend");
const massLegendBar = document.querySelector<HTMLDivElement>("#massLegendBar");
const plotCaption = document.querySelector<HTMLParagraphElement>("#plotCaption");
const modeBadge = document.querySelector<HTMLSpanElement>("#modeBadge");

const copyResults = document.querySelector<HTMLButtonElement>("#copyResults");
const stationMode = document.querySelector<HTMLButtonElement>("#stationMode");
const help = document.querySelector<HTMLButtonElement>("#help");
const status = document.querySelector<HTMLParagraphElement>("#status");

const hrCanvas = document.querySelector<HTMLCanvasElement>("#hrCanvas");
const hrPlot = document.querySelector<HTMLDivElement>(".hr-plot");

if (
  !modeObserver ||
  !modeTheorist ||
  !showRadiusLines ||
  !revealMassColors ||
  !seedInput ||
  !populationSizeInput ||
  !distanceInput ||
  !photErrInput ||
  !metallicityInput ||
  !clusterModeInput ||
  !clusterAgeInput ||
  !clusterAgeValue ||
  !binaryFracInput ||
  !binaryFracValue ||
  !regenerateButton ||
  !evolveMass ||
  !evolveTime ||
  !evolveTimeValue ||
  !evolveMsLifetime ||
  !evolveStage ||
  !evolveMessage ||
  !selectedStage ||
  !selectedLuminosity ||
  !selectedTeff ||
  !selectedRadius ||
  !selectedMass ||
  !claimInput ||
  !addClaim ||
  !exportClaims ||
  !clearClaims ||
  !claimList ||
  !massLegend ||
  !massLegendBar ||
  !plotCaption ||
  !modeBadge ||
  !copyResults ||
  !stationMode ||
  !help ||
  !status ||
  !hrCanvas ||
  !hrPlot
) {
  throw new Error("Missing required DOM elements for HR inference lab.");
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:stars-zams-hr:mode",
  url: new URL(window.location.href)
});

const state: DemoState = {
  plotMode: "observer",
  showRadiusLines: false,
  revealMassColors: false,
  seed: "hr-lab-42",
  populationSize: 320,
  distancePc: 140,
  photErr: 0.03,
  modeCluster: true,
  clusterAgeGyr: 0.7,
  binaryFrac: 0.28,
  metallicityZ: 0.02,
  population: [],
  selectedStarId: null,
  evolveMassMsun: 1,
  evolveTimeGyr: 0,
  claims: []
};

const ctx = hrCanvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D context unavailable for HR inference lab.");

const colorProbe = document.createElement("span");
colorProbe.style.position = "absolute";
colorProbe.style.left = "-9999px";
colorProbe.style.top = "-9999px";
colorProbe.style.visibility = "hidden";
document.body.appendChild(colorProbe);

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveColor(raw: string): string {
  colorProbe.style.color = raw;
  return getComputedStyle(colorProbe).color;
}

let plottedPoints: CanvasPoint[] = [];

function selectedStar(): PopulationStar | null {
  if (!state.selectedStarId) return null;
  return state.population.find((star) => star.id === state.selectedStarId) ?? null;
}

function normalizeTrackPointForHr(point: TrackPoint): { xNorm: number; yNorm: number } {
  return hrCoordinates({ teffK: point.teffK, luminosityLsun: point.luminosityLsun });
}

function buildEvolutionTrack(massMsun: number): TrackPoint[] {
  const msL = ZamsTout1996Model.luminosityLsunFromMassMetallicity({
    massMsun,
    metallicityZ: state.metallicityZ
  });
  const msR = ZamsTout1996Model.radiusRsunFromMassMetallicity({
    massMsun,
    metallicityZ: state.metallicityZ
  });
  const msT = ZamsTout1996Model.effectiveTemperatureKFromMassMetallicity({
    massMsun,
    metallicityZ: state.metallicityZ
  });

  const tMs = HrInferencePopulationModel.mainSequenceLifetimeGyr(massMsun);
  const endT = 1.2 * tMs;
  const points: TrackPoint[] = [];

  const msSamples = 54;
  for (let i = 0; i <= msSamples; i += 1) {
    const f = i / msSamples;
    const timeGyr = f * tMs;
    const luminosityLsun = msL * (0.72 + 0.85 * f);
    const teffK = msT * (0.98 - 0.06 * f);
    const radiusRsun = radiusRsunFromLuminosityTemperature({ luminosityLsun, teffK, tSunK: T_SUN_K });
    points.push({ timeGyr, stage: "ms", teffK, luminosityLsun, radiusRsun });
  }

  if (massMsun < 8) {
    const giantStart = tMs;
    const giantEnd = 1.12 * tMs;
    const giantSamples = 28;

    for (let i = 1; i <= giantSamples; i += 1) {
      const f = i / giantSamples;
      const timeGyr = giantStart + f * (giantEnd - giantStart);
      const radiusRsun = msR * (4 + 95 * f ** 1.15);
      const teffK = clamp(msT * (0.85 - 0.5 * f), 3200, 7000);
      const luminosityLsun = luminosityLsunFromRadiusTemperature({ radiusRsun, teffK, tSunK: T_SUN_K });
      points.push({ timeGyr, stage: i < 8 ? "subgiant" : "giant", teffK, luminosityLsun, radiusRsun });
    }

    const wdMass = clamp(0.45 + 0.12 * massMsun, 0.52, 1.1);
    const wdRadius = 0.012 * (wdMass / 0.6) ** (-1 / 3);
    const wdStart = giantEnd;
    const wdEnd = endT;
    const wdSamples = 24;

    for (let i = 1; i <= wdSamples; i += 1) {
      const f = i / wdSamples;
      const timeGyr = wdStart + f * (wdEnd - wdStart);
      const teffK = 29000 * (1 - 0.68 * f) + 6500;
      const luminosityLsun = luminosityLsunFromRadiusTemperature({
        radiusRsun: wdRadius,
        teffK,
        tSunK: T_SUN_K
      });
      points.push({
        timeGyr,
        stage: "white_dwarf",
        teffK,
        luminosityLsun,
        radiusRsun: wdRadius
      });
    }
  } else {
    const superStart = tMs;
    const superEnd = 1.12 * tMs;
    const superSamples = 30;

    for (let i = 1; i <= superSamples; i += 1) {
      const f = i / superSamples;
      const timeGyr = superStart + f * (superEnd - superStart);
      const radiusRsun = msR * (10 + 330 * f ** 1.02);
      const teffK = clamp(msT * (0.9 - 0.68 * f), 3200, 45000);
      const luminosityLsun = luminosityLsunFromRadiusTemperature({ radiusRsun, teffK, tSunK: T_SUN_K });
      points.push({
        timeGyr,
        stage: "supergiant",
        teffK,
        luminosityLsun,
        radiusRsun
      });
    }

    const remnantStart = superEnd;
    const remnantEnd = endT;
    const remnantSamples = 14;
    for (let i = 1; i <= remnantSamples; i += 1) {
      const f = i / remnantSamples;
      const timeGyr = remnantStart + f * (remnantEnd - remnantStart);
      const radiusRsun = 2e-5;
      const teffK = 2.2e5 * (1 - 0.4 * f);
      const luminosityLsun = luminosityLsunFromRadiusTemperature({ radiusRsun, teffK, tSunK: T_SUN_K });
      points.push({
        timeGyr,
        stage: "compact_remnant",
        teffK,
        luminosityLsun,
        radiusRsun
      });
    }
  }

  return points;
}

function nearestTrackPoint(track: TrackPoint[]): TrackPoint {
  let best = track[0];
  let bestDelta = Math.abs(best.timeGyr - state.evolveTimeGyr);
  for (let i = 1; i < track.length; i += 1) {
    const delta = Math.abs(track[i].timeGyr - state.evolveTimeGyr);
    if (delta < bestDelta) {
      best = track[i];
      bestDelta = delta;
    }
  }
  return best;
}

function regeneratePopulation(): void {
  state.population = HrInferencePopulationModel.generatePopulation({
    N: state.populationSize,
    seed: state.seed,
    distancePc: state.distancePc,
    photErr: state.photErr,
    modeCluster: state.modeCluster,
    clusterAge: state.modeCluster ? state.clusterAgeGyr : undefined,
    binaryFrac: state.binaryFrac,
    metallicityZ: state.metallicityZ
  });
  if (!state.selectedStarId || !state.population.some((star) => star.id === state.selectedStarId)) {
    state.selectedStarId = state.population[0]?.id ?? null;
  }
}

function resizeCanvasToCssPixels(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): {
  width: number;
  height: number;
} {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;
  const nextW = Math.max(1, Math.round(width * dpr));
  const nextH = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW;
    canvas.height = nextH;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function drawPlot(): void {
  const { width: w, height: h } = resizeCanvasToCssPixels(hrCanvas, ctx);
  const margin = { left: 70, right: 24, top: 24, bottom: 60 };
  const plotW = Math.max(1, w - margin.left - margin.right);
  const plotH = Math.max(1, h - margin.top - margin.bottom);

  const background = resolveColor(cssVar("--cp-bg0"));
  const panelBg = resolveColor(cssVar("--cp-bg1"));
  const text = resolveColor(cssVar("--cp-text"));
  const muted = resolveColor(cssVar("--cp-text2"));
  const majorGrid = resolveColor(cssVar("--cp-border"));
  const minorGrid = resolveColor(cssVar("--cp-border-subtle"));
  const trackColor = resolveColor(cssVar("--cp-accent"));

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = panelBg;
  ctx.fillRect(margin.left, margin.top, plotW, plotH);

  const xPx = (xNorm: number) => margin.left + clamp(xNorm, 0, 1) * plotW;
  const yPx = (yNorm: number) => margin.top + (1 - clamp(yNorm, 0, 1)) * plotH;

  const xTicks: number[] = [];
  const yTicks: number[] = [];

  if (state.plotMode === "theorist") {
    xTicks.push(3000, 5000, 10000, 20000, 40000);
    yTicks.push(...logTicks(-4, 6));

    for (const t of xTicks) {
      const p = hrCoordinates({ teffK: t, luminosityLsun: 1 });
      const x = xPx(p.xNorm);
      ctx.strokeStyle = majorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotH);
      ctx.stroke();
    }

    for (const l of yTicks) {
      const p = hrCoordinates({ teffK: 10000, luminosityLsun: l });
      const y = yPx(p.yNorm);
      ctx.strokeStyle = majorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();
    }

    if (state.showRadiusLines) {
      ctx.save();
      ctx.strokeStyle = resolveColor(cssVar("--cp-chart-3"));
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.2;

      for (const radiusRsun of RADIUS_GUIDE_VALUES_RSUN) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 100; i += 1) {
          const f = i / 100;
          const teffK =
            THEORIST_AXIS_LIMITS.teffMinK *
            (THEORIST_AXIS_LIMITS.teffMaxK / THEORIST_AXIS_LIMITS.teffMinK) ** f;
          const luminosityLsun = luminosityLsunFromRadiusTemperature({
            radiusRsun,
            teffK,
            tSunK: T_SUN_K
          });
          const pt = hrCoordinates({ teffK, luminosityLsun });
          const x = xPx(pt.xNorm);
          const y = yPx(pt.yNorm);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        const labelTeff = 3800;
        const labelL = luminosityLsunFromRadiusTemperature({
          radiusRsun,
          teffK: labelTeff,
          tSunK: T_SUN_K
        });
        const labelPt = hrCoordinates({ teffK: labelTeff, luminosityLsun: labelL });
        ctx.fillStyle = resolveColor(cssVar("--cp-chart-3"));
        ctx.font = "12px 'Source Sans 3', sans-serif";
        ctx.fillText(`R = ${formatNumber(radiusRsun, 2)} R_sun`, xPx(labelPt.xNorm) + 4, yPx(labelPt.yNorm) - 4);
      }

      ctx.restore();
    }
  } else {
    xTicks.push(...linearTicks(-0.4, 2.2, 0.4));
    yTicks.push(...linearTicks(-10, 15, 5));

    for (const c of xTicks) {
      const p = cmdCoordinates({ bMinusV: c, absoluteMv: 0 });
      const x = xPx(p.xNorm);
      ctx.strokeStyle = minorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotH);
      ctx.stroke();
    }

    for (const mv of yTicks) {
      const p = cmdCoordinates({ bMinusV: 0.6, absoluteMv: mv });
      const y = yPx(p.yNorm);
      ctx.strokeStyle = minorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();
    }
  }

  plottedPoints = [];

  for (const star of state.population) {
    const norm =
      state.plotMode === "theorist"
        ? hrCoordinates({ teffK: star.Teff, luminosityLsun: star.L })
        : cmdCoordinates({ bMinusV: star.BminusV, absoluteMv: star.Mv });

    const x = xPx(norm.xNorm);
    const y = yPx(norm.yNorm);
    const selected = star.id === state.selectedStarId;

    ctx.beginPath();
    ctx.arc(x, y, selected ? 4.8 : 3.4, 0, Math.PI * 2);
    ctx.fillStyle = state.revealMassColors
      ? resolveColor(massColorHex(star.mass))
      : resolveColor(neutralPointColor);
    ctx.globalAlpha = selected ? 1 : 0.86;
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = resolveColor(cssVar("--cp-bg1"));
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    plottedPoints.push({
      starId: star.id,
      x,
      y,
      radiusPx: selected ? 8 : 6
    });
  }

  const track = buildEvolutionTrack(state.evolveMassMsun);
  const currentTrackPoint = nearestTrackPoint(track);

  if (state.plotMode === "theorist") {
    ctx.save();
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    let started = false;
    for (const point of track) {
      const norm = normalizeTrackPointForHr(point);
      const x = xPx(norm.xNorm);
      const y = yPx(norm.yNorm);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    const current = normalizeTrackPointForHr(currentTrackPoint);
    ctx.beginPath();
    ctx.arc(xPx(current.xNorm), yPx(current.yNorm), 5.2, 0, Math.PI * 2);
    ctx.fillStyle = trackColor;
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = text;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin.left, margin.top, plotW, plotH);

  ctx.fillStyle = text;
  ctx.font = "600 12px 'Source Sans 3', sans-serif";

  if (state.plotMode === "theorist") {
    for (const t of xTicks) {
      const p = hrCoordinates({ teffK: t, luminosityLsun: 1 });
      const x = xPx(p.xNorm);
      ctx.fillText(`${Math.round(t).toLocaleString()} K`, x - 28, margin.top + plotH + 18);
    }
    for (const l of yTicks) {
      const p = hrCoordinates({ teffK: 8000, luminosityLsun: l });
      const y = yPx(p.yNorm);
      ctx.fillText(`10^${Math.round(Math.log10(l))}`, margin.left - 42, y + 4);
    }

    ctx.fillText("log(T_eff [K])", margin.left + plotW * 0.5 - 40, h - 10);
    ctx.save();
    ctx.translate(18, margin.top + plotH * 0.6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("log(L/L_sun)", 0, 0);
    ctx.restore();
  } else {
    for (const c of xTicks) {
      const p = cmdCoordinates({ bMinusV: c, absoluteMv: 0 });
      const x = xPx(p.xNorm);
      ctx.fillText(c.toFixed(1), x - 10, margin.top + plotH + 18);
    }
    for (const mv of yTicks) {
      const p = cmdCoordinates({ bMinusV: 0.4, absoluteMv: mv });
      const y = yPx(p.yNorm);
      ctx.fillText(String(Math.round(mv)), margin.left - 28, y + 4);
    }

    ctx.fillText("Color index (B-V)", margin.left + plotW * 0.5 - 42, h - 10);
    ctx.save();
    ctx.translate(18, margin.top + plotH * 0.6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Absolute magnitude M_V", 0, 0);
    ctx.restore();
  }

  evolveStage.textContent = stageLabels[currentTrackPoint.stage];

  plotCaption.textContent =
    state.plotMode === "observer"
      ? "Observer CMD mode: M_V vs (B-V) with photometric scatter and brighter-up axis inversion."
      : "Theorist HR mode: log(L/L_sun) vs log(T_eff) with hot-left reversal and optional constant-radius lines.";
}

function renderModeControls(): void {
  modeObserver.setAttribute("aria-pressed", state.plotMode === "observer" ? "true" : "false");
  modeTheorist.setAttribute("aria-pressed", state.plotMode === "theorist" ? "true" : "false");
  showRadiusLines.checked = state.showRadiusLines;
  revealMassColors.checked = state.revealMassColors;

  showRadiusLines.disabled = state.plotMode !== "theorist";
  if (state.plotMode !== "theorist") state.showRadiusLines = false;

  modeBadge.textContent = state.plotMode === "observer" ? "Observer CMD" : "Theorist HR";

  massLegend.hidden = !state.revealMassColors;
  massLegendBar.style.background = massLegendGradient;
}

function renderInputs(): void {
  seedInput.value = state.seed;
  populationSizeInput.value = String(state.populationSize);
  distanceInput.value = String(state.distancePc);
  photErrInput.value = String(state.photErr);
  metallicityInput.value = state.metallicityZ.toFixed(4);
  clusterModeInput.checked = state.modeCluster;
  clusterAgeInput.value = String(Math.round(state.clusterAgeGyr * 100));
  clusterAgeValue.textContent = `${state.clusterAgeGyr.toFixed(2)} Gyr`;
  clusterAgeInput.disabled = !state.modeCluster;
  binaryFracInput.value = String(Math.round(state.binaryFrac * 100));
  binaryFracValue.textContent = `${Math.round(state.binaryFrac * 100)}%`;
}

function renderSelectionCard(): void {
  const star = selectedStar();
  if (!star) {
    selectedStage.textContent = "-";
    selectedLuminosity.textContent = "-";
    selectedTeff.textContent = "-";
    selectedRadius.textContent = "-";
    selectedMass.textContent = "-";
    return;
  }

  const inferredRadius = radiusRsunFromLuminosityTemperature({
    luminosityLsun: star.L,
    teffK: star.Teff,
    tSunK: T_SUN_K
  });

  selectedStage.textContent = stageLabels[star.stage];
  selectedLuminosity.textContent = formatWithUnit(star.L, "L_sun", 4);
  selectedTeff.textContent = formatWithUnit(star.Teff, "K", 0);
  selectedRadius.textContent = formatWithUnit(inferredRadius, "R_sun", 4);
  selectedMass.textContent = state.revealMassColors
    ? formatWithUnit(star.mass, "M_sun", 3)
    : "Hidden until mass colors are revealed";
}

function renderClaims(): void {
  claimList.replaceChildren();
  if (state.claims.length === 0) {
    const empty = document.createElement("li");
    empty.className = "claim-item claim-item--empty";
    empty.textContent = "No claims yet. Add one sentence after each inference step.";
    claimList.appendChild(empty);
    return;
  }

  state.claims.forEach((claim, index) => {
    const li = document.createElement("li");
    li.className = "claim-item";
    li.textContent = `${index + 1}. ${claim}`;
    claimList.appendChild(li);
  });
}

function renderEvolveReadout(): void {
  const tMs = HrInferencePopulationModel.mainSequenceLifetimeGyr(state.evolveMassMsun);
  const maxT = 1.2 * tMs;

  evolveTime.max = String(maxT);
  state.evolveTimeGyr = clamp(state.evolveTimeGyr, 0, maxT);
  evolveTime.value = String(state.evolveTimeGyr);

  evolveTimeValue.textContent = `${state.evolveTimeGyr.toFixed(3)} Gyr`;
  evolveMsLifetime.textContent = `${tMs.toFixed(3)} Gyr`;
  evolveMessage.textContent = "Mass determines both the path and the timescale.";
}

function render(): void {
  renderModeControls();
  renderInputs();
  renderEvolveReadout();
  drawPlot();
  renderSelectionCard();
  renderClaims();
}

function starFromCanvasHit(x: number, y: number): string | null {
  let bestId: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const point of plottedPoints) {
    const dx = point.x - x;
    const dy = point.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist <= point.radiusPx && dist < bestDist) {
      bestDist = dist;
      bestId = point.starId;
    }
  }

  return bestId;
}

function applyStarSelection(nextId: string, announce = false): void {
  state.selectedStarId = nextId;
  renderSelectionCard();
  drawPlot();
  if (!announce) return;
  const star = selectedStar();
  if (!star) return;
  setLiveRegionText(status, `Selected ${star.id}: ${stageLabels[star.stage]}.`);
}

function addClaimFromInput(): void {
  const raw = claimInput.value.trim();
  if (!raw) return;
  const claim = /[.!?]$/.test(raw) ? raw : `${raw}.`;
  state.claims.push(claim);
  claimInput.value = "";
  renderClaims();
}

function exportClaimJson(): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    plotMode: state.plotMode,
    revealMassColors: state.revealMassColors,
    options: {
      seed: state.seed,
      populationSize: state.populationSize,
      distancePc: state.distancePc,
      photErr: state.photErr,
      modeCluster: state.modeCluster,
      clusterAgeGyr: state.clusterAgeGyr,
      binaryFrac: state.binaryFrac,
      metallicityZ: state.metallicityZ
    },
    claims: state.claims
  };

  void navigator.clipboard
    .writeText(JSON.stringify(payload, null, 2))
    .then(() => setLiveRegionText(status, "Exported inference log JSON to clipboard."))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Clipboard export failed.";
      setLiveRegionText(status, message);
    });
}

function exportResultsPayload(): ExportPayloadV1 {
  const star = selectedStar();
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Plot mode", value: state.plotMode },
      { name: "Population size", value: String(state.populationSize) },
      { name: "Distance (pc)", value: formatNumber(state.distancePc, 1) },
      { name: "Photometric error sigma (mag)", value: formatNumber(state.photErr, 3) },
      { name: "Cluster mode", value: state.modeCluster ? "on" : "off" },
      { name: "Cluster age (Gyr)", value: formatNumber(state.clusterAgeGyr, 3) },
      { name: "Binary fraction", value: formatNumber(state.binaryFrac, 3) },
      { name: "Metallicity Z", value: formatNumber(state.metallicityZ, 4) },
      { name: "Reveal mass colors", value: state.revealMassColors ? "on" : "off" }
    ],
    readouts: star
      ? [
          { name: "Selected stage", value: stageLabels[star.stage] },
          { name: "Selected L/L_sun", value: formatNumber(star.L, 6) },
          { name: "Selected Teff (K)", value: formatNumber(star.Teff, 2) },
          {
            name: "Selected inferred R/R_sun",
            value: formatNumber(
              radiusRsunFromLuminosityTemperature({
                luminosityLsun: star.L,
                teffK: star.Teff,
                tSunK: T_SUN_K
              }),
              6
            )
          },
          {
            name: "Selected mass M_sun",
            value: state.revealMassColors ? formatNumber(star.mass, 6) : "hidden"
          }
        ]
      : [{ name: "Selected star", value: "none" }],
    notes: [
      "Main-sequence stars use Tout et al. (1996) L(M,Z) and R(M,Z); Teff is SB-closed.",
      "Observer CMD mode applies deterministic Gaussian photometric scatter in M_V and B-V.",
      "Evolve tool uses conceptual tracks with mass-dependent lifetimes: t_MS ~ 10 Gyr * (M/M_sun)^(-2.5).",
      "Mass determines both the path and the timescale."
    ]
  };
}

for (const mass of EVOLVE_MASSES_MSUN) {
  const option = document.createElement("option");
  option.value = String(mass);
  option.textContent = `${mass} M_sun`;
  if (mass === state.evolveMassMsun) option.selected = true;
  evolveMass.appendChild(option);
}

modeObserver.addEventListener("click", () => {
  state.plotMode = "observer";
  regeneratePopulation();
  render();
});

modeTheorist.addEventListener("click", () => {
  state.plotMode = "theorist";
  regeneratePopulation();
  render();
});

showRadiusLines.addEventListener("change", () => {
  state.showRadiusLines = showRadiusLines.checked;
  render();
});

revealMassColors.addEventListener("change", () => {
  state.revealMassColors = revealMassColors.checked;
  render();
});

regenerateButton.addEventListener("click", () => {
  state.seed = seedInput.value.trim() || state.seed;
  state.populationSize = clamp(Math.round(Number(populationSizeInput.value)), 40, 1200);
  state.distancePc = clamp(Number(distanceInput.value), 1, 10000);
  state.photErr = clamp(Number(photErrInput.value), 0, 0.5);
  state.metallicityZ = clamp(
    Number(metallicityInput.value),
    ZamsTout1996Model.CONSTANTS.metallicityMin,
    ZamsTout1996Model.CONSTANTS.metallicityMax
  );
  state.modeCluster = clusterModeInput.checked;
  state.clusterAgeGyr = clamp(Number(clusterAgeInput.value) / 100, 0, 14);
  state.binaryFrac = clamp(Number(binaryFracInput.value) / 100, 0, 1);

  regeneratePopulation();
  render();
  setLiveRegionText(status, "Generated new synthetic population.");
});

clusterModeInput.addEventListener("change", () => {
  state.modeCluster = clusterModeInput.checked;
  clusterAgeInput.disabled = !state.modeCluster;
  regeneratePopulation();
  render();
});

clusterAgeInput.addEventListener("input", () => {
  state.clusterAgeGyr = clamp(Number(clusterAgeInput.value) / 100, 0, 14);
  regeneratePopulation();
  render();
});

binaryFracInput.addEventListener("input", () => {
  state.binaryFrac = clamp(Number(binaryFracInput.value) / 100, 0, 1);
  regeneratePopulation();
  render();
});

evolveMass.addEventListener("change", () => {
  state.evolveMassMsun = Number(evolveMass.value);
  state.evolveTimeGyr = 0;
  render();
});

evolveTime.addEventListener("input", () => {
  state.evolveTimeGyr = Number(evolveTime.value);
  render();
});

hrCanvas.addEventListener("click", (event) => {
  const rect = hrCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const id = starFromCanvasHit(x, y);
  if (id) {
    applyStarSelection(id);
  }
});

hrCanvas.addEventListener("keydown", (event) => {
  let nextId: string | null = null;

  if (event.key === "ArrowLeft") {
    nextId = selectNextStarByDirection({
      points: plottedPoints,
      currentStarId: state.selectedStarId,
      direction: "left"
    });
  } else if (event.key === "ArrowRight") {
    nextId = selectNextStarByDirection({
      points: plottedPoints,
      currentStarId: state.selectedStarId,
      direction: "right"
    });
  } else if (event.key === "ArrowUp") {
    nextId = selectNextStarByDirection({
      points: plottedPoints,
      currentStarId: state.selectedStarId,
      direction: "up"
    });
  } else if (event.key === "ArrowDown") {
    nextId = selectNextStarByDirection({
      points: plottedPoints,
      currentStarId: state.selectedStarId,
      direction: "down"
    });
  } else if (event.key === "Home") {
    nextId = selectBoundaryStar({ points: plottedPoints, boundary: "home" });
  } else if (event.key === "End") {
    nextId = selectBoundaryStar({ points: plottedPoints, boundary: "end" });
  } else {
    return;
  }

  if (!nextId) return;
  event.preventDefault();
  if (nextId === state.selectedStarId) return;
  applyStarSelection(nextId, true);
});

addClaim.addEventListener("click", () => {
  addClaimFromInput();
});

claimInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addClaimFromInput();
  }
});

clearClaims.addEventListener("click", () => {
  state.claims = [];
  renderClaims();
});

exportClaims.addEventListener("click", () => {
  exportClaimJson();
});

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying...");
  void runtime
    .copyResults(exportResultsPayload())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Copy failed.";
      setLiveRegionText(status, `Copy failed: ${message}`);
    });
});

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Inference-first workflow for HR and CMD structure.",
    sections: [
      {
        heading: "Core sequence",
        type: "bullets",
        items: [
          "Start in Observer CMD mode and identify the main sequence, giant branch, and white dwarf region.",
          "Switch to Theorist HR mode and toggle radius lines to infer size from L and Teff.",
          "Reveal mass colors and infer the hidden mass gradient direction along the main sequence."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: HR Diagram Inference Lab",
    subtitle: "Capture claims and compare inferred structure across modes.",
    steps: [
      "Record one hot-faint star and infer radius from Stefan-Boltzmann relation.",
      "Record one cool-luminous star and compare inferred radius.",
      "Reveal mass colors and explain mass ordering along the main sequence."
    ],
    columns: [
      { key: "id", label: "ID" },
      { key: "stage", label: "Stage" },
      { key: "teff", label: "Teff (K)" },
      { key: "lum", label: "L/L_sun" },
      { key: "radius", label: "R/R_sun" },
      { key: "mass", label: "Mass (M_sun)" }
    ],
    getSnapshotRow() {
      const star = selectedStar();
      if (!star) {
        return {
          id: "none",
          stage: "none",
          teff: "-",
          lum: "-",
          radius: "-",
          mass: "-"
        };
      }
      const inferredRadius = radiusRsunFromLuminosityTemperature({
        luminosityLsun: star.L,
        teffK: star.Teff,
        tSunK: T_SUN_K
      });
      return {
        id: star.id,
        stage: stageLabels[star.stage],
        teff: formatNumber(star.Teff, 0),
        lum: formatNumber(star.L, 4),
        radius: formatNumber(inferredRadius, 4),
        mass: state.revealMassColors ? formatNumber(star.mass, 4) : "hidden"
      };
    },
    snapshotLabel: "Add snapshot row"
  }
});

demoModes.bindButtons({
  helpButton: help,
  stationButton: stationMode
});

window.addEventListener("resize", () => render());

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}

regeneratePopulation();
render();
initMath(document);
