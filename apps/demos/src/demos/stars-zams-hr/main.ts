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
  type HrLabPresetId,
  OBSERVER_AXIS_LIMITS,
  type PlotMode,
  type PlotPoint,
  RADIUS_GUIDE_VALUES_RSUN,
  THEORIST_AXIS_LIMITS,
  applyHrLabPreset,
  clamp,
  cmdCoordinates,
  describeSelectedStarInference,
  formatNumber,
  getGuideRegions,
  getRadiusLinesVisible,
  hrCoordinates,
  linearTicks,
  logTicks,
  luminosityLsunFromRadiusTemperature,
  massColorHex,
  radiusRsunFromLuminosityTemperature,
  sanitizeNumericControl,
  selectBoundaryStar,
  selectNextStarByDirection
} from "./logic";

type DemoState = {
  plotMode: PlotMode;
  guideMode: boolean;
  showRadiusLinesPreference: boolean;
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
  hoveredStarId: string | null;
  activePresetId: HrLabPresetId | null;
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

const DEFAULTS = {
  seed: "hr-lab-42",
  populationSize: 320,
  distancePc: 140,
  photErr: 0.03,
  modeCluster: true,
  clusterAgeGyr: 0.7,
  binaryFrac: 0.28,
  metallicityZ: 0.02,
  evolveMassMsun: 1
} as const;

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

const massLegendGradient = `linear-gradient(90deg, ${massColorHex(0.1)}, ${massColorHex(1)}, ${massColorHex(
  5
)}, ${massColorHex(20)}, ${massColorHex(50)})`;

const claimStarters = [
  {
    buttonId: "claimStarterMainSequence",
    text: "As stars on the main sequence become hotter, they also become ___."
  },
  {
    buttonId: "claimStarterHotFaint",
    text: "This hot but faint star must have a ___ radius because ___."
  },
  {
    buttonId: "claimStarterMassGradient",
    text: "Revealing mass colors shows that mass increases toward the ___ end of the main sequence."
  }
] as const;

function requireEl<T extends Element>(element: T | null, selector: string): T {
  if (!element) throw new Error(`Missing required DOM element: ${selector}`);
  return element;
}

const modeObserver = requireEl(document.querySelector<HTMLButtonElement>("#modeObserver"), "#modeObserver");
const modeTheorist = requireEl(document.querySelector<HTMLButtonElement>("#modeTheorist"), "#modeTheorist");
const guideModeInput = requireEl(document.querySelector<HTMLInputElement>("#guideMode"), "#guideMode");
const showRadiusLines = requireEl(
  document.querySelector<HTMLInputElement>("#showRadiusLines"),
  "#showRadiusLines"
);
const revealMassColors = requireEl(
  document.querySelector<HTMLInputElement>("#revealMassColors"),
  "#revealMassColors"
);

const seedInput = requireEl(document.querySelector<HTMLInputElement>("#seedInput"), "#seedInput");
const populationSizeInput = requireEl(
  document.querySelector<HTMLInputElement>("#populationSize"),
  "#populationSize"
);
const distanceInput = requireEl(document.querySelector<HTMLInputElement>("#distancePc"), "#distancePc");
const photErrInput = requireEl(document.querySelector<HTMLInputElement>("#photErr"), "#photErr");
const metallicityInput = requireEl(document.querySelector<HTMLInputElement>("#metallicityZ"), "#metallicityZ");
const clusterModeInput = requireEl(
  document.querySelector<HTMLInputElement>("#clusterMode"),
  "#clusterMode"
);
const clusterAgeSlider = requireEl(document.querySelector<HTMLInputElement>("#clusterAge"), "#clusterAge");
const clusterAgeNumber = requireEl(
  document.querySelector<HTMLInputElement>("#clusterAgeNumber"),
  "#clusterAgeNumber"
);
const clusterAgeValue = requireEl(
  document.querySelector<HTMLSpanElement>("#clusterAgeValue"),
  "#clusterAgeValue"
);
const binaryFracSlider = requireEl(document.querySelector<HTMLInputElement>("#binaryFrac"), "#binaryFrac");
const binaryFracNumber = requireEl(
  document.querySelector<HTMLInputElement>("#binaryFracNumber"),
  "#binaryFracNumber"
);
const binaryFracValue = requireEl(
  document.querySelector<HTMLSpanElement>("#binaryFracValue"),
  "#binaryFracValue"
);
const regenerateButton = requireEl(
  document.querySelector<HTMLButtonElement>("#regeneratePopulation"),
  "#regeneratePopulation"
);
const experimentControls = requireEl(
  document.querySelector<HTMLDetailsElement>("#experimentControls"),
  "#experimentControls"
);
const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-hr-preset]")
);

const evolveMass = requireEl(document.querySelector<HTMLSelectElement>("#evolveMass"), "#evolveMass");
const evolveTime = requireEl(document.querySelector<HTMLInputElement>("#evolveTime"), "#evolveTime");
const evolveTimeValue = requireEl(
  document.querySelector<HTMLSpanElement>("#evolveTimeValue"),
  "#evolveTimeValue"
);
const evolveMsLifetime = requireEl(
  document.querySelector<HTMLSpanElement>("#evolveMsLifetime"),
  "#evolveMsLifetime"
);
const evolveStage = requireEl(document.querySelector<HTMLSpanElement>("#evolveStage"), "#evolveStage");
const evolveMessage = requireEl(
  document.querySelector<HTMLParagraphElement>("#evolveMessage"),
  "#evolveMessage"
);

const selectedStage = requireEl(
  document.querySelector<HTMLSpanElement>("#selectedStage"),
  "#selectedStage"
);
const selectedLuminosity = requireEl(
  document.querySelector<HTMLSpanElement>("#selectedLuminosity"),
  "#selectedLuminosity"
);
const selectedTeff = requireEl(document.querySelector<HTMLSpanElement>("#selectedTeff"), "#selectedTeff");
const selectedRadius = requireEl(
  document.querySelector<HTMLSpanElement>("#selectedRadius"),
  "#selectedRadius"
);
const selectedMass = requireEl(document.querySelector<HTMLSpanElement>("#selectedMass"), "#selectedMass");
const selectedInterpretation = requireEl(
  document.querySelector<HTMLParagraphElement>("#selectedInterpretation"),
  "#selectedInterpretation"
);
const selectedGuideHint = requireEl(
  document.querySelector<HTMLParagraphElement>("#selectedGuideHint"),
  "#selectedGuideHint"
);

const claimInput = requireEl(document.querySelector<HTMLInputElement>("#claimInput"), "#claimInput");
const addClaim = requireEl(document.querySelector<HTMLButtonElement>("#addClaim"), "#addClaim");
const exportClaims = requireEl(
  document.querySelector<HTMLButtonElement>("#exportClaims"),
  "#exportClaims"
);
const clearClaims = requireEl(document.querySelector<HTMLButtonElement>("#clearClaims"), "#clearClaims");
const claimList = requireEl(document.querySelector<HTMLUListElement>("#claimList"), "#claimList");
const claimStarterButtons = claimStarters.map((starter) =>
  requireEl(document.querySelector<HTMLButtonElement>(`#${starter.buttonId}`), `#${starter.buttonId}`)
);

const massLegend = requireEl(document.querySelector<HTMLDivElement>("#massLegend"), "#massLegend");
const massLegendBar = requireEl(
  document.querySelector<HTMLDivElement>("#massLegendBar"),
  "#massLegendBar"
);
const guideOverlay = requireEl(document.querySelector<HTMLDivElement>("#guideOverlay"), "#guideOverlay");
const plotTooltip = requireEl(document.querySelector<HTMLDivElement>("#plotTooltip"), "#plotTooltip");
const plotCaption = requireEl(document.querySelector<HTMLParagraphElement>("#plotCaption"), "#plotCaption");
const plotOrientationHint = requireEl(
  document.querySelector<HTMLParagraphElement>("#plotOrientationHint"),
  "#plotOrientationHint"
);
const exploreHint = requireEl(document.querySelector<HTMLParagraphElement>("#exploreHint"), "#exploreHint");
const modeBadge = requireEl(document.querySelector<HTMLSpanElement>("#modeBadge"), "#modeBadge");

const copyResults = requireEl(document.querySelector<HTMLButtonElement>("#copyResults"), "#copyResults");
const stationMode = requireEl(document.querySelector<HTMLButtonElement>("#stationMode"), "#stationMode");
const help = requireEl(document.querySelector<HTMLButtonElement>("#help"), "#help");
const status = requireEl(document.querySelector<HTMLParagraphElement>("#status"), "#status");

const hrCanvas = requireEl(document.querySelector<HTMLCanvasElement>("#hrCanvas"), "#hrCanvas");
const hrPlot = requireEl(document.querySelector<HTMLDivElement>(".hr-plot"), ".hr-plot");

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:stars-zams-hr:mode",
  url: new URL(window.location.href)
});

const state: DemoState = {
  plotMode: "observer",
  guideMode: true,
  showRadiusLinesPreference: false,
  revealMassColors: false,
  seed: DEFAULTS.seed,
  populationSize: DEFAULTS.populationSize,
  distancePc: DEFAULTS.distancePc,
  photErr: DEFAULTS.photErr,
  modeCluster: DEFAULTS.modeCluster,
  clusterAgeGyr: DEFAULTS.clusterAgeGyr,
  binaryFrac: DEFAULTS.binaryFrac,
  metallicityZ: DEFAULTS.metallicityZ,
  population: [],
  selectedStarId: null,
  hoveredStarId: null,
  activePresetId: null,
  evolveMassMsun: DEFAULTS.evolveMassMsun,
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

let plottedPoints: CanvasPoint[] = [];

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveColor(raw: string): string {
  colorProbe.style.color = raw;
  return getComputedStyle(colorProbe).color;
}

function selectedStar(): PopulationStar | null {
  if (!state.selectedStarId) return null;
  return state.population.find((star) => star.id === state.selectedStarId) ?? null;
}

function hoveredStar(): PopulationStar | null {
  if (!state.hoveredStarId) return null;
  return state.population.find((star) => star.id === state.hoveredStarId) ?? null;
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
  for (let index = 0; index <= msSamples; index += 1) {
    const fraction = index / msSamples;
    const timeGyr = fraction * tMs;
    const luminosityLsun = msL * (0.72 + 0.85 * fraction);
    const teffK = msT * (0.98 - 0.06 * fraction);
    const radiusRsun = radiusRsunFromLuminosityTemperature({
      luminosityLsun,
      teffK,
      tSunK: T_SUN_K
    });
    points.push({ timeGyr, stage: "ms", teffK, luminosityLsun, radiusRsun });
  }

  if (massMsun < 8) {
    const giantStart = tMs;
    const giantEnd = 1.12 * tMs;
    const giantSamples = 28;

    for (let index = 1; index <= giantSamples; index += 1) {
      const fraction = index / giantSamples;
      const timeGyr = giantStart + fraction * (giantEnd - giantStart);
      const radiusRsun = msR * (4 + 95 * fraction ** 1.15);
      const teffK = clamp(msT * (0.85 - 0.5 * fraction), 3200, 7000);
      const luminosityLsun = luminosityLsunFromRadiusTemperature({ radiusRsun, teffK, tSunK: T_SUN_K });
      points.push({
        timeGyr,
        stage: index < 8 ? "subgiant" : "giant",
        teffK,
        luminosityLsun,
        radiusRsun
      });
    }

    const wdMass = clamp(0.45 + 0.12 * massMsun, 0.52, 1.1);
    const wdRadius = 0.012 * (wdMass / 0.6) ** (-1 / 3);
    const wdStart = giantEnd;
    const wdEnd = endT;
    const wdSamples = 24;

    for (let index = 1; index <= wdSamples; index += 1) {
      const fraction = index / wdSamples;
      const timeGyr = wdStart + fraction * (wdEnd - wdStart);
      const teffK = 29000 * (1 - 0.68 * fraction) + 6500;
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

    for (let index = 1; index <= superSamples; index += 1) {
      const fraction = index / superSamples;
      const timeGyr = superStart + fraction * (superEnd - superStart);
      const radiusRsun = msR * (10 + 330 * fraction ** 1.02);
      const teffK = clamp(msT * (0.9 - 0.68 * fraction), 3200, 45000);
      const luminosityLsun = luminosityLsunFromRadiusTemperature({
        radiusRsun,
        teffK,
        tSunK: T_SUN_K
      });
      points.push({ timeGyr, stage: "supergiant", teffK, luminosityLsun, radiusRsun });
    }

    const remnantStart = superEnd;
    const remnantEnd = endT;
    const remnantSamples = 14;
    for (let index = 1; index <= remnantSamples; index += 1) {
      const fraction = index / remnantSamples;
      const timeGyr = remnantStart + fraction * (remnantEnd - remnantStart);
      const radiusRsun = 2e-5;
      const teffK = 2.2e5 * (1 - 0.4 * fraction);
      const luminosityLsun = luminosityLsunFromRadiusTemperature({
        radiusRsun,
        teffK,
        tSunK: T_SUN_K
      });
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

  for (let index = 1; index < track.length; index += 1) {
    const candidate = track[index];
    const delta = Math.abs(candidate.timeGyr - state.evolveTimeGyr);
    if (delta < bestDelta) {
      best = candidate;
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

  if (!state.hoveredStarId || !state.population.some((star) => star.id === state.hoveredStarId)) {
    state.hoveredStarId = null;
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
  const { width, height } = resizeCanvasToCssPixels(hrCanvas, ctx);
  const margin = { left: 74, right: 26, top: 28, bottom: 68 };
  const plotWidth = Math.max(1, width - margin.left - margin.right);
  const plotHeight = Math.max(1, height - margin.top - margin.bottom);

  const background = resolveColor(cssVar("--cp-bg0"));
  const panelBg = resolveColor(cssVar("--cp-bg1"));
  const text = resolveColor(cssVar("--cp-text"));
  const majorGrid = resolveColor(cssVar("--cp-border"));
  const minorGrid = resolveColor(cssVar("--cp-border-subtle"));
  const accent = resolveColor(cssVar("--cp-accent"));
  const accentSoft = resolveColor(cssVar("--cp-accent-soft"));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = panelBg;
  ctx.fillRect(margin.left, margin.top, plotWidth, plotHeight);

  const xPx = (xNorm: number) => margin.left + clamp(xNorm, 0, 1) * plotWidth;
  const yPx = (yNorm: number) => margin.top + (1 - clamp(yNorm, 0, 1)) * plotHeight;

  const xTicks: number[] = [];
  const yTicks: number[] = [];

  if (state.plotMode === "theorist") {
    xTicks.push(3000, 5000, 10000, 20000, 40000);
    yTicks.push(...logTicks(-4, 6));

    for (const tick of xTicks) {
      const point = hrCoordinates({ teffK: tick, luminosityLsun: 1 });
      const x = xPx(point.xNorm);
      ctx.strokeStyle = majorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();
    }

    for (const tick of yTicks) {
      const point = hrCoordinates({ teffK: 10000, luminosityLsun: tick });
      const y = yPx(point.yNorm);
      ctx.strokeStyle = majorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();
    }

    if (getRadiusLinesVisible({ plotMode: state.plotMode, showRadiusLinesPreference: state.showRadiusLinesPreference })) {
      ctx.save();
      ctx.strokeStyle = resolveColor(cssVar("--cp-chart-3"));
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.2;

      for (const radiusRsun of RADIUS_GUIDE_VALUES_RSUN) {
        ctx.beginPath();
        let started = false;
        for (let index = 0; index <= 100; index += 1) {
          const fraction = index / 100;
          const teffK =
            THEORIST_AXIS_LIMITS.teffMinK *
            (THEORIST_AXIS_LIMITS.teffMaxK / THEORIST_AXIS_LIMITS.teffMinK) ** fraction;
          const luminosityLsun = luminosityLsunFromRadiusTemperature({
            radiusRsun,
            teffK,
            tSunK: T_SUN_K
          });
          const point = hrCoordinates({ teffK, luminosityLsun });
          const x = xPx(point.xNorm);
          const y = yPx(point.yNorm);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        const labelTeff = 3800;
        const labelLuminosity = luminosityLsunFromRadiusTemperature({
          radiusRsun,
          teffK: labelTeff,
          tSunK: T_SUN_K
        });
        const labelPoint = hrCoordinates({
          teffK: labelTeff,
          luminosityLsun: labelLuminosity
        });
        ctx.fillStyle = resolveColor(cssVar("--cp-chart-3"));
        ctx.font = "12px 'Source Sans 3', sans-serif";
        ctx.fillText(
          `R = ${formatNumber(radiusRsun, 2)} R_sun`,
          xPx(labelPoint.xNorm) + 4,
          yPx(labelPoint.yNorm) - 4
        );
      }

      ctx.restore();
    }
  } else {
    xTicks.push(...linearTicks(-0.4, 2.2, 0.4));
    yTicks.push(...linearTicks(-10, 15, 5));

    for (const tick of xTicks) {
      const point = cmdCoordinates({ bMinusV: tick, absoluteMv: 0 });
      const x = xPx(point.xNorm);
      ctx.strokeStyle = minorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();
    }

    for (const tick of yTicks) {
      const point = cmdCoordinates({ bMinusV: 0.6, absoluteMv: tick });
      const y = yPx(point.yNorm);
      ctx.strokeStyle = minorGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
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
    const isSelected = star.id === state.selectedStarId;
    const isHovered = star.id === state.hoveredStarId;

    if (isSelected) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 5.2 : 3.7, 0, Math.PI * 2);
    ctx.fillStyle = state.revealMassColors
      ? resolveColor(massColorHex(star.mass))
      : resolveColor("var(--cp-chart-1)");
    ctx.globalAlpha = isSelected ? 1 : 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    if (isSelected || isHovered) {
      ctx.strokeStyle = isSelected ? accentSoft : text;
      ctx.lineWidth = isSelected ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 7.8 : 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    plottedPoints.push({
      starId: star.id,
      x,
      y,
      radiusPx: isSelected ? 10 : 7
    });
  }

  const track = buildEvolutionTrack(state.evolveMassMsun);
  const currentTrackPoint = nearestTrackPoint(track);

  if (state.plotMode === "theorist") {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    let started = false;
    for (const point of track) {
      const norm = hrCoordinates({ teffK: point.teffK, luminosityLsun: point.luminosityLsun });
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

    const current = hrCoordinates({
      teffK: currentTrackPoint.teffK,
      luminosityLsun: currentTrackPoint.luminosityLsun
    });
    ctx.beginPath();
    ctx.arc(xPx(current.xNorm), yPx(current.yNorm), 5.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = text;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin.left, margin.top, plotWidth, plotHeight);
  ctx.fillStyle = text;
  ctx.font = "600 12px 'Source Sans 3', sans-serif";

  if (state.plotMode === "theorist") {
    for (const tick of xTicks) {
      const point = hrCoordinates({ teffK: tick, luminosityLsun: 1 });
      const x = xPx(point.xNorm);
      ctx.fillText(`${Math.round(tick).toLocaleString()} K`, x - 28, margin.top + plotHeight + 20);
    }

    for (const tick of yTicks) {
      const point = hrCoordinates({ teffK: 8000, luminosityLsun: tick });
      const y = yPx(point.yNorm);
      ctx.fillText(`10^${Math.round(Math.log10(tick))}`, margin.left - 42, y + 4);
    }

    ctx.fillText("log(T_eff [K])", margin.left + plotWidth * 0.5 - 40, height - 14);
    ctx.save();
    ctx.translate(22, margin.top + plotHeight * 0.6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("log(L/L_sun)", 0, 0);
    ctx.restore();
  } else {
    for (const tick of xTicks) {
      const point = cmdCoordinates({ bMinusV: tick, absoluteMv: 0 });
      const x = xPx(point.xNorm);
      ctx.fillText(tick.toFixed(1), x - 10, margin.top + plotHeight + 20);
    }

    for (const tick of yTicks) {
      const point = cmdCoordinates({ bMinusV: 0.4, absoluteMv: tick });
      const y = yPx(point.yNorm);
      ctx.fillText(String(Math.round(tick)), margin.left - 28, y + 4);
    }

    ctx.fillText("Color index (B-V)", margin.left + plotWidth * 0.5 - 42, height - 14);
    ctx.save();
    ctx.translate(22, margin.top + plotHeight * 0.6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Absolute magnitude M_V", 0, 0);
    ctx.restore();
  }

  evolveStage.textContent = stageLabels[currentTrackPoint.stage];
}

function renderGuideOverlay(): void {
  guideOverlay.replaceChildren();
  if (!state.guideMode) return;

  for (const region of getGuideRegions(state.plotMode)) {
    const label = document.createElement("div");
    label.className = "guide-overlay__label";
    label.style.left = `${region.xNorm * 100}%`;
    label.style.top = `${(1 - region.yNorm) * 100}%`;

    const title = document.createElement("span");
    title.className = "guide-overlay__title";
    title.textContent = region.label;

    const hint = document.createElement("span");
    hint.className = "guide-overlay__hint";
    hint.textContent = region.hint;

    label.append(title, hint);
    guideOverlay.appendChild(label);
  }
}

function renderHoverTooltip(): void {
  const star = hoveredStar();
  if (!star) {
    plotTooltip.hidden = true;
    plotTooltip.textContent = "";
    return;
  }

  const point = plottedPoints.find((candidate) => candidate.starId === star.id);
  if (!point) {
    plotTooltip.hidden = true;
    return;
  }

  const stage = stageLabels[star.stage];
  const luminosity = `${formatNumber(star.L, 3)} L/L_sun`;
  const temperature = `${formatNumber(star.Teff, 0)} K`;
  const radius = `${formatNumber(
    radiusRsunFromLuminosityTemperature({ luminosityLsun: star.L, teffK: star.Teff, tSunK: T_SUN_K }),
    3
  )} R/R_sun`;
  const mass = state.revealMassColors ? `${formatNumber(star.mass, 3)} M_sun` : "Mass hidden";

  plotTooltip.innerHTML = `
    <span class="plot-tooltip__title">${stage}</span>
    <span class="plot-tooltip__meta">${temperature} · ${luminosity}</span>
    <span class="plot-tooltip__meta">${radius} · ${mass}</span>
  `;
  plotTooltip.hidden = false;
  plotTooltip.style.left = `${point.x}px`;
  plotTooltip.style.top = `${point.y}px`;
}

function renderModeControls(): void {
  modeObserver.setAttribute("aria-pressed", state.plotMode === "observer" ? "true" : "false");
  modeTheorist.setAttribute("aria-pressed", state.plotMode === "theorist" ? "true" : "false");
  guideModeInput.checked = state.guideMode;
  showRadiusLines.checked = state.showRadiusLinesPreference;
  showRadiusLines.disabled = state.plotMode !== "theorist";
  revealMassColors.checked = state.revealMassColors;

  modeBadge.textContent = state.plotMode === "observer" ? "Observer CMD" : "Theorist HR";
  massLegend.hidden = !state.revealMassColors;
  massLegendBar.style.background = massLegendGradient;

  plotOrientationHint.textContent =
    state.plotMode === "observer"
      ? "In Observer CMD mode, brighter stars appear higher because absolute magnitude runs bright-up and faint-down."
      : "In Theorist HR mode, hotter stars are on the left because temperature increases toward the left.";

  exploreHint.textContent = state.guideMode
    ? "Guide mode highlights the major regions and keeps the core inference steps in front."
    : "Guide mode is off, so the diagram is in full sandbox mode.";

  plotCaption.textContent =
    state.plotMode === "observer"
      ? "Observer CMD mode: M_V vs (B-V), with brighter stars upward and photometric scatter tied to distance and uncertainty."
      : "Theorist HR mode: log(L/L_sun) vs log(T_eff), with hotter stars to the left and optional constant-radius guides.";

  experimentControls.classList.toggle("is-guided", state.guideMode);
}

function renderPopulationControls(): void {
  seedInput.value = state.seed;
  populationSizeInput.value = String(state.populationSize);
  distanceInput.value = String(state.distancePc);
  photErrInput.value = String(state.photErr);
  metallicityInput.value = state.metallicityZ.toFixed(4);
  clusterModeInput.checked = state.modeCluster;
  clusterAgeSlider.value = String(Math.round(state.clusterAgeGyr * 100));
  clusterAgeNumber.value = state.clusterAgeGyr.toFixed(2);
  clusterAgeValue.textContent = `${state.clusterAgeGyr.toFixed(2)} Gyr`;
  clusterAgeSlider.disabled = !state.modeCluster;
  clusterAgeNumber.disabled = !state.modeCluster;
  binaryFracSlider.value = String(Math.round(state.binaryFrac * 100));
  binaryFracNumber.value = String(Math.round(state.binaryFrac * 100));
  binaryFracValue.textContent = `${Math.round(state.binaryFrac * 100)}%`;

  for (const button of presetButtons) {
    const presetId = button.dataset.hrPreset as HrLabPresetId | undefined;
    button.setAttribute("aria-pressed", state.activePresetId === presetId ? "true" : "false");
  }
}

function renderSelectionCard(): void {
  const star = selectedStar();
  if (!star) {
    selectedStage.textContent = "-";
    selectedLuminosity.textContent = "-";
    selectedTeff.textContent = "-";
    selectedRadius.textContent = "-";
    selectedMass.textContent = "-";
    selectedInterpretation.textContent = "Click a star to begin the inference workflow.";
    selectedGuideHint.hidden = !state.guideMode;
    return;
  }

  const inferredRadius = radiusRsunFromLuminosityTemperature({
    luminosityLsun: star.L,
    teffK: star.Teff,
    tSunK: T_SUN_K
  });

  selectedStage.textContent = stageLabels[star.stage];
  selectedLuminosity.textContent = formatNumber(star.L, 4);
  selectedTeff.textContent = formatNumber(star.Teff, 0);
  selectedRadius.textContent = formatNumber(inferredRadius, 4);
  selectedMass.textContent = state.revealMassColors ? `${formatNumber(star.mass, 3)} M_sun` : "Hidden until revealed";
  selectedInterpretation.textContent = describeSelectedStarInference({
    stage: star.stage,
    teffK: star.Teff,
    luminosityLsun: star.L,
    radiusRsun: inferredRadius
  });
  selectedGuideHint.hidden = !state.guideMode;
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
    const item = document.createElement("li");
    item.className = "claim-item";
    item.textContent = `${index + 1}. ${claim}`;
    claimList.appendChild(item);
  });
}

function renderEvolveReadout(): void {
  const tMs = HrInferencePopulationModel.mainSequenceLifetimeGyr(state.evolveMassMsun);
  const maxTime = 1.2 * tMs;
  state.evolveTimeGyr = clamp(state.evolveTimeGyr, 0, maxTime);
  evolveTime.max = String(maxTime);
  evolveTime.value = String(state.evolveTimeGyr);
  evolveTimeValue.textContent = `${state.evolveTimeGyr.toFixed(3)} Gyr`;
  evolveMsLifetime.textContent = `${tMs.toFixed(3)} Gyr`;
  evolveMessage.textContent =
    state.guideMode
      ? "Compare a low-mass and a high-mass star to see how mass changes both lifetime and post-main-sequence path."
      : "Mass determines both the path and the timescale.";
}

function render(): void {
  renderModeControls();
  renderPopulationControls();
  renderEvolveReadout();
  drawPlot();
  renderGuideOverlay();
  renderSelectionCard();
  renderClaims();
  renderHoverTooltip();
}

function starFromCanvasHit(x: number, y: number): string | null {
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const point of plottedPoints) {
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance <= point.radiusPx && distance < bestDistance) {
      bestDistance = distance;
      bestId = point.starId;
    }
  }

  return bestId;
}

function applyStarSelection(nextId: string, announce = false): void {
  state.selectedStarId = nextId;
  render();
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
    guideMode: state.guideMode,
    revealMassColors: state.revealMassColors,
    activePresetId: state.activePresetId ?? "custom",
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
      { name: "Guide mode", value: state.guideMode ? "on" : "off" },
      { name: "Preset", value: state.activePresetId ?? "custom" },
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
      "Guide mode adds pedagogical annotations only; it does not change the underlying population.",
      "Mass determines both the path and the timescale."
    ]
  };
}

function markManualPopulationEdit(): void {
  state.activePresetId = null;
}

function setHoveredStar(nextId: string | null): void {
  if (state.hoveredStarId === nextId) return;
  state.hoveredStarId = nextId;
  renderHoverTooltip();
  drawPlot();
  renderGuideOverlay();
  renderHoverTooltip();
}

function applyPopulationChange(announce?: string): void {
  regeneratePopulation();
  render();
  if (announce) setLiveRegionText(status, announce);
}

function commitSeed(): void {
  const next = seedInput.value.trim() || DEFAULTS.seed;
  seedInput.value = next;
  if (state.seed === next) return;
  state.seed = next;
  markManualPopulationEdit();
  applyPopulationChange("Updated the seed and regenerated the synthetic population.");
}

function commitPopulationSize(): void {
  const next = sanitizeNumericControl({
    rawValue: populationSizeInput.value,
    fallback: state.populationSize,
    min: 40,
    max: 1200,
    step: 10
  });
  populationSizeInput.value = String(next);
  if (state.populationSize === next) return;
  state.populationSize = next;
  markManualPopulationEdit();
  applyPopulationChange("Updated the population size.");
}

function commitDistance(): void {
  const next = sanitizeNumericControl({
    rawValue: distanceInput.value,
    fallback: state.distancePc,
    min: 1,
    max: 10000,
    step: 1
  });
  distanceInput.value = String(next);
  if (state.distancePc === next) return;
  state.distancePc = next;
  markManualPopulationEdit();
  applyPopulationChange("Updated the distance and recomputed the CMD scatter.");
}

function commitPhotErr(): void {
  const next = sanitizeNumericControl({
    rawValue: photErrInput.value,
    fallback: state.photErr,
    min: 0,
    max: 0.5,
    step: 0.005
  });
  photErrInput.value = String(next);
  if (state.photErr === next) return;
  state.photErr = next;
  markManualPopulationEdit();
  applyPopulationChange("Updated the photometric error.");
}

function commitMetallicity(): void {
  const next = sanitizeNumericControl({
    rawValue: metallicityInput.value,
    fallback: state.metallicityZ,
    min: ZamsTout1996Model.CONSTANTS.metallicityMin,
    max: ZamsTout1996Model.CONSTANTS.metallicityMax,
    step: 0.0001
  });
  metallicityInput.value = next.toFixed(4);
  if (state.metallicityZ === next) return;
  state.metallicityZ = next;
  markManualPopulationEdit();
  applyPopulationChange("Updated the metallicity.");
}

function setClusterAge(nextGyr: number, announce?: string): void {
  const clampedAge = clamp(nextGyr, 0, 14);
  state.clusterAgeGyr = clampedAge;
  clusterAgeSlider.value = String(Math.round(clampedAge * 100));
  clusterAgeNumber.value = clampedAge.toFixed(2);
  markManualPopulationEdit();
  applyPopulationChange(announce);
}

function setBinaryFraction(nextFraction: number, announce?: string): void {
  const clampedFraction = clamp(nextFraction, 0, 1);
  state.binaryFrac = clampedFraction;
  binaryFracSlider.value = String(Math.round(clampedFraction * 100));
  binaryFracNumber.value = String(Math.round(clampedFraction * 100));
  markManualPopulationEdit();
  applyPopulationChange(announce);
}

function applyPreset(presetId: HrLabPresetId): void {
  const patch = applyHrLabPreset(presetId);
  if (patch.modeCluster !== undefined) state.modeCluster = patch.modeCluster;
  if (patch.clusterAgeGyr !== undefined) state.clusterAgeGyr = patch.clusterAgeGyr;
  if (patch.binaryFrac !== undefined) state.binaryFrac = patch.binaryFrac;
  if (patch.metallicityZ !== undefined) state.metallicityZ = patch.metallicityZ;
  if (patch.evolveMassMsun !== undefined) {
    state.evolveMassMsun = patch.evolveMassMsun;
    state.evolveTimeGyr = 0;
  }
  state.activePresetId = presetId;
  applyPopulationChange(`Applied the ${presetId.replace(/-/g, " ")} preset.`);
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
  render();
});

modeTheorist.addEventListener("click", () => {
  state.plotMode = "theorist";
  render();
});

guideModeInput.addEventListener("change", () => {
  state.guideMode = guideModeInput.checked;
  render();
});

showRadiusLines.addEventListener("change", () => {
  state.showRadiusLinesPreference = showRadiusLines.checked;
  render();
});

revealMassColors.addEventListener("change", () => {
  state.revealMassColors = revealMassColors.checked;
  render();
});

seedInput.addEventListener("change", commitSeed);
seedInput.addEventListener("blur", commitSeed);
populationSizeInput.addEventListener("change", commitPopulationSize);
populationSizeInput.addEventListener("blur", commitPopulationSize);
distanceInput.addEventListener("change", commitDistance);
distanceInput.addEventListener("blur", commitDistance);
photErrInput.addEventListener("change", commitPhotErr);
photErrInput.addEventListener("blur", commitPhotErr);
metallicityInput.addEventListener("change", commitMetallicity);
metallicityInput.addEventListener("blur", commitMetallicity);

clusterModeInput.addEventListener("change", () => {
  state.modeCluster = clusterModeInput.checked;
  markManualPopulationEdit();
  applyPopulationChange("Updated cluster mode.");
});

clusterAgeSlider.addEventListener("input", () => {
  setClusterAge(Number(clusterAgeSlider.value) / 100);
});

clusterAgeNumber.addEventListener("change", () => {
  const next = sanitizeNumericControl({
    rawValue: clusterAgeNumber.value,
    fallback: state.clusterAgeGyr,
    min: 0,
    max: 14,
    step: 0.01
  });
  setClusterAge(next);
});

clusterAgeNumber.addEventListener("blur", () => {
  clusterAgeNumber.value = state.clusterAgeGyr.toFixed(2);
});

binaryFracSlider.addEventListener("input", () => {
  setBinaryFraction(Number(binaryFracSlider.value) / 100);
});

binaryFracNumber.addEventListener("change", () => {
  const nextPercent = sanitizeNumericControl({
    rawValue: binaryFracNumber.value,
    fallback: state.binaryFrac * 100,
    min: 0,
    max: 100,
    step: 1
  });
  setBinaryFraction(nextPercent / 100);
});

binaryFracNumber.addEventListener("blur", () => {
  binaryFracNumber.value = String(Math.round(state.binaryFrac * 100));
});

regenerateButton.addEventListener("click", () => {
  applyPopulationChange("Regenerated the synthetic population with the current settings.");
});

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const presetId = button.dataset.hrPreset as HrLabPresetId | undefined;
    if (!presetId) return;
    applyPreset(presetId);
  });
}

evolveMass.addEventListener("change", () => {
  state.evolveMassMsun = Number(evolveMass.value);
  state.evolveTimeGyr = 0;
  if (state.activePresetId !== "solar-like-reference") {
    state.activePresetId = null;
  }
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
  const nextId = starFromCanvasHit(x, y);
  if (nextId) applyStarSelection(nextId);
});

hrCanvas.addEventListener("pointermove", (event) => {
  const rect = hrCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  setHoveredStar(starFromCanvasHit(x, y));
});

hrCanvas.addEventListener("pointerleave", () => {
  state.hoveredStarId = null;
  renderHoverTooltip();
  drawPlot();
  renderGuideOverlay();
  renderHoverTooltip();
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

  if (!nextId || nextId === state.selectedStarId) return;
  event.preventDefault();
  applyStarSelection(nextId, true);
});

addClaim.addEventListener("click", addClaimFromInput);

claimInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addClaimFromInput();
  }
});

claimStarterButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    claimInput.value = claimStarters[index]?.text ?? "";
    claimInput.focus();
    claimInput.setSelectionRange(claimInput.value.length, claimInput.value.length);
  });
});

clearClaims.addEventListener("click", () => {
  state.claims = [];
  renderClaims();
});

exportClaims.addEventListener("click", exportClaimJson);

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
          "Click a star, compare luminosity and temperature, and then infer radius from the selected-star card.",
          "Switch to Theorist HR mode, turn on radius lines, and reveal mass colors only after making a prediction."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: HR Diagram Inference Lab",
    subtitle: "Capture claims and compare inferred structure across modes.",
    steps: [
      "Record one hot-faint star and infer radius from Stefan-Boltzmann reasoning.",
      "Record one cool-luminous star and compare its inferred radius with the first case.",
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
        return { id: "none", stage: "none", teff: "-", lum: "-", radius: "-", mass: "-" };
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
