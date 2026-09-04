import {
  ChallengeEngine,
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  renderInlineKatex,
  initStarfield,
  initTabs,
  setLiveRegionText
} from "@cosmic/runtime";
import type { Challenge, ExportPayloadV1 } from "@cosmic/runtime";
import { HydrostaticEquilibriumModel } from "@cosmic/physics";
import {
  GUIDED_STEPS,
  HYDROSTATIC_CHALLENGES,
  HYDROSTATIC_PRESETS,
  PROFILE_TABS,
  buildHydrostaticScenario,
  formatKelvinOrMegaKelvinLatex,
  formatScientificLatex,
  formatSolarNormalizedLatex,
  guidedStepPresentation,
  guidedStepIndex,
  matchingPresetId,
  profileValueForKey,
  profileTeachingNote,
  solarReferenceScales,
  type GuidedStepId,
  type HydrostaticExplorerMode,
  type HydrostaticPreset,
  type HydrostaticPresetId,
  type HydrostaticProfileKey,
  type HydrostaticSupportMode
} from "./logic";
import { renderMathText } from "../../shared/mathText";

type ChallengeTone = "correct" | "incorrect" | "close" | null;

type ExplorerState = {
  presetId: HydrostaticPresetId;
  massSolarMass: number;
  radiusSolarRadius: number;
  shellRadiusFraction: number;
  densityModel: HydrostaticPreset["densityModel"];
  supportMode: HydrostaticSupportMode;
  meanMolecularWeightMu: number;
  profileKey: HydrostaticProfileKey;
  explorerMode: HydrostaticExplorerMode;
  guidedStepId: GuidedStepId;
  showUnits: boolean;
  showNormalizedValues: boolean;
  showDerivations: boolean;
  predictionChoiceId: "up" | "down" | "same" | null;
  predictionFeedbackHtml: string | null;
  predictionChecked: boolean;
  challenge: {
    selectedChoiceId: string | null;
    hintText: string | null;
    feedbackText: string | null;
    feedbackTone: ChallengeTone;
    completed: boolean;
    awaitingAdvance: boolean;
  };
  synthesis: {
    local: string;
    global: string;
    thermal: string;
  };
};

const DEMO_SLUG = "hydrostatic-equilibrium-explorer";

const PROFILE_LINE_CLASS: Record<HydrostaticProfileKey, string> = {
  pressure: "pressure",
  "pressure-gradient": "pressure-gradient",
  "enclosed-mass": "enclosed-mass",
  gravity: "gravity",
  density: "density"
};

const SUPPORT_MODE_LABEL: Record<HydrostaticSupportMode, string> = {
  balanced: "Balanced",
  "under-supported": "Under-supported",
  "over-supported": "Over-supported"
};

const DENSITY_MODEL_LABEL: Record<HydrostaticPreset["densityModel"], string> = {
  uniform: "Uniform-density toy",
  "central-toy": "Centrally concentrated toy"
};

const CHALLENGE_LOOKUP = new Map(HYDROSTATIC_CHALLENGES.map((challenge) => [challenge.id, challenge]));
const PREDICTION_CHALLENGE = HYDROSTATIC_CHALLENGES[0];
const STRUCTURE_HINT_BY_STEP: Record<GuidedStepId, string> = {
  predict: "Mass, radius, and density-model controls unlock later in the guided flow.",
  "local-shell": "Stay with one shell first. Mass and radius unlock at the compactness step.",
  "global-profile": "Connect the shell to the whole star first. Mass and radius unlock next.",
  compactness: "Mass and radius are now live. Density-model changes unlock in the next step.",
  "density-model": "Mass, radius, and density model are all active here.",
  "thermal-bridge": "Mean molecular weight now connects the support requirement to a temperature scale.",
  synthesis: "All controls are active so you can build a full explanation."
};

const lastMathMarkup = new WeakMap<HTMLElement, string>();

function q<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatFixed(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  if (!Number.isFinite(value)) return "--";
  if (abs === 0) return "0";
  if (abs >= 1.0e4 || abs < 1.0e-2) {
    const exponent = Math.floor(Math.log10(abs));
    const mantissa = value / Math.pow(10, exponent);
    return `${mantissa.toFixed(1)} x 10^${exponent}`;
  }
  return abs >= 100 ? value.toFixed(0) : abs >= 10 ? value.toFixed(1) : value.toFixed(2);
}

function formatRatioLatex(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\\text{--}";
  const abs = Math.abs(value);
  if (abs >= 100 || abs < 0.1) return formatScientificLatex(value, Math.max(2, digits));
  return formatFixed(value, digits);
}

function latexQuantity(valueLatex: string, unitLatex: string | null, showUnits: boolean): string {
  if (!showUnits || !unitLatex) return valueLatex;
  return `${valueLatex}\\,${unitLatex}`;
}

function formatTemperatureLatex(valueK: number, showUnits: boolean): string {
  if (showUnits) return formatKelvinOrMegaKelvinLatex(valueK);
  if (!Number.isFinite(valueK)) return "\\text{--}";
  return formatScientificLatex(valueK, 3);
}

function scientificQuantityLatex(
  value: number,
  unitLatex: string | null,
  showUnits: boolean,
  digits = 3
): string {
  return latexQuantity(formatScientificLatex(value, digits), unitLatex, showUnits);
}

function formatMassLatex(massSolarMass: number, showUnits: boolean): string {
  return latexQuantity(formatFixed(massSolarMass, 2), "M_{\\odot}", showUnits);
}

function formatRadiusLatex(radiusSolarRadius: number, showUnits: boolean): string {
  return latexQuantity(formatFixed(radiusSolarRadius, 2), "R_{\\odot}", showUnits);
}

function formatProfileValueLatex(
  key: HydrostaticProfileKey,
  value: number,
  showUnits: boolean
): string {
  if (key === "enclosed-mass") {
    return latexQuantity(formatScientificLatex(value, 3), "M_{\\odot}", showUnits);
  }
  if (key === "gravity") {
    return scientificQuantityLatex(value, "{\\rm cm\\,s^{-2}}", showUnits, 3);
  }
  if (key === "density") {
    return scientificQuantityLatex(value, "{\\rm g\\,cm^{-3}}", showUnits, 3);
  }
  if (key === "pressure-gradient") {
    return scientificQuantityLatex(value, "{\\rm dyne\\,cm^{-3}}", showUnits, 3);
  }
  return scientificQuantityLatex(value, "{\\rm dyne\\,cm^{-2}}", showUnits, 3);
}

function setMathText(element: HTMLElement, content: string): void {
  const html = renderMathText(content);
  if (lastMathMarkup.get(element) === html) return;
  lastMathMarkup.set(element, html);
  element.innerHTML = html;
}

function buildReadoutMarkup(primaryLatex: string, secondaryLatex: string | null): string {
  if (!secondaryLatex) {
    return `<span class="readout-primary">${renderInlineLatex(primaryLatex)}</span>`;
  }
  return `<span class="readout-primary">${renderInlineLatex(primaryLatex)}</span><span class="readout-secondary">${renderInlineLatex(secondaryLatex)}</span>`;
}

function nearlyEqual(a: number, b: number, tolerance = 1e-6): boolean {
  return Math.abs(a - b) <= tolerance;
}

function normalizeInlineLatex(latex: string): string {
  if (latex.startsWith("$$") && latex.endsWith("$$")) return latex.slice(2, -2);
  if (latex.startsWith("$") && latex.endsWith("$")) return latex.slice(1, -1);
  return latex;
}

function renderInlineLatex(latex: string): string {
  return renderInlineKatex(normalizeInlineLatex(latex));
}

function setInlineLatex(element: HTMLElement, latex: string): void {
  const normalized = normalizeInlineLatex(latex);
  const cacheKey = `inline:${normalized}`;
  if (lastMathMarkup.get(element) === cacheKey) return;
  lastMathMarkup.set(element, cacheKey);
  element.innerHTML = renderInlineLatex(normalized);
}

function setMarkup(element: HTMLElement, html: string): void {
  if (lastMathMarkup.get(element) === html) return;
  lastMathMarkup.set(element, html);
  element.innerHTML = html;
}

function stateMatchesPreset(state: ExplorerState): boolean {
  return matchingPresetId(currentPresetFromState(state)) !== null;
}

function currentGuidedStep(stepId: GuidedStepId) {
  return GUIDED_STEPS[guidedStepIndex(stepId)] ?? GUIDED_STEPS[0];
}

function stepAtOrAfter(current: GuidedStepId, target: GuidedStepId): boolean {
  return guidedStepIndex(current) >= guidedStepIndex(target);
}

function buildPredictionFeedback(choiceId: ExplorerState["predictionChoiceId"]): string {
  if (!choiceId) {
    return "Pick an answer before checking the prediction.";
  }

  if (choiceId === PREDICTION_CHALLENGE.correctChoiceId) {
    return "Prediction checked. Smaller $R$ at fixed $M$ means larger required $P_c$.";
  }

  return "Re-check the scaling. At fixed mass, shrinking $R$ drives $P_c$ upward.";
}

function currentPresetFromState(state: ExplorerState): HydrostaticPreset {
  const basePreset = HYDROSTATIC_PRESETS[state.presetId];
  return {
    ...basePreset,
    massSolarMass: state.massSolarMass,
    radiusSolarRadius: state.radiusSolarRadius,
    shellRadiusFraction: state.shellRadiusFraction,
    densityModel: state.densityModel,
    supportMode: state.supportMode,
    meanMolecularWeightMu: state.meanMolecularWeightMu
  };
}

function isProfileKey(value: string | undefined): value is HydrostaticProfileKey {
  return PROFILE_TABS.some((tab) => tab.key === value);
}

function buildChallengeDefinitions(): Challenge[] {
  return HYDROSTATIC_CHALLENGES.map((challenge) => ({
    id: challenge.id,
    prompt: challenge.prompt,
    type: "custom",
    hints: [challenge.hint],
    explanation: challenge.explanation,
    check: (rawChoiceId: unknown) => {
      const choiceId = typeof rawChoiceId === "string" ? rawChoiceId : null;
      if (!choiceId) {
        return {
          correct: false,
          close: false,
          message: "Choose an answer before checking."
        };
      }

      const correct = choiceId === challenge.correctChoiceId;
      return {
        correct,
        close: false,
        message: correct
          ? challenge.explanation
          : `Not yet. ${challenge.explanation}`
      };
    }
  }));
}

function profileTabMeta(profileKey: HydrostaticProfileKey) {
  return PROFILE_TABS.find((tab) => tab.key === profileKey) ?? PROFILE_TABS[0];
}

function primaryPromptForPreset(preset: HydrostaticPreset): string {
  if (preset.supportMode === "under-supported") {
    return "The global toy star stays hydrostatic, but the highlighted shell patch deliberately applies too little pressure support so the local imbalance is visible.";
  }

  if (preset.supportMode === "over-supported") {
    return "The global toy star stays hydrostatic, but the highlighted shell patch deliberately applies too much pressure support so the local imbalance reverses direction.";
  }

  return preset.note;
}

function profileDomain(values: number[], key: HydrostaticProfileKey): { min: number; max: number } {
  const max = Math.max(...values);
  const min = Math.min(...values);

  if (key === "pressure-gradient") {
    const upper = Math.max(0, max);
    const lower = min === upper ? upper - 1 : min;
    return { min: lower, max: upper };
  }

  if (max === min) {
    return { min: 0, max: max === 0 ? 1 : max * 1.1 };
  }

  return { min: Math.min(0, min), max };
}

function scaleArrowLength(value: number, reference: number, minLength: number, maxLength: number): number {
  const norm = Math.abs(value) / Math.max(reference, 1e-30);
  const eased = Math.tanh(norm * 1.6);
  return minLength + (maxLength - minLength) * eased;
}

function polarPoint(cx: number, cy: number, radius: number, angleRad: number): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  };
}

function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngleRad: number,
  endAngleRad: number
): string {
  const start = polarPoint(cx, cy, radius, startAngleRad);
  const end = polarPoint(cx, cy, radius, endAngleRad);
  const largeArcFlag = Math.abs(endAngleRad - startAngleRad) > Math.PI ? 1 : 0;
  const sweepFlag = endAngleRad > startAngleRad ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function arrowPolygon(args: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className: string;
  shaftWidth?: number;
  headWidth?: number;
  headLength?: number;
}): string {
  const dx = args.x2 - args.x1;
  const dy = args.y2 - args.y1;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return "";

  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const shaftWidth = args.shaftWidth ?? 12;
  const headWidth = args.headWidth ?? shaftWidth * 1.95;
  const headLength = Math.min(args.headLength ?? 22, length * 0.62);
  const baseX = args.x2 - ux * headLength;
  const baseY = args.y2 - uy * headLength;
  const points = [
    [args.x1 + px * (shaftWidth * 0.5), args.y1 + py * (shaftWidth * 0.5)],
    [baseX + px * (shaftWidth * 0.5), baseY + py * (shaftWidth * 0.5)],
    [baseX + px * (headWidth * 0.5), baseY + py * (headWidth * 0.5)],
    [args.x2, args.y2],
    [baseX - px * (headWidth * 0.5), baseY - py * (headWidth * 0.5)],
    [baseX - px * (shaftWidth * 0.5), baseY - py * (shaftWidth * 0.5)],
    [args.x1 - px * (shaftWidth * 0.5), args.y1 - py * (shaftWidth * 0.5)]
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  return `<polygon class="${args.className}" points="${points}" />`;
}

function renderHeroSvg(
  scenario: ReturnType<typeof buildHydrostaticScenario>,
  state: ExplorerState
): string {
  const starCx = 240;
  const starCy = 286;
  const starRadiusPx = 178;
  const shellRadiusPx = Math.max(12, starRadiusPx * scenario.shellRadiusFraction);
  const shellAngleRad = -0.72;
  const shellNode = polarPoint(starCx, starCy, shellRadiusPx, shellAngleRad);
  const shellOuter = polarPoint(starCx, starCy, shellRadiusPx + 38, shellAngleRad);
  const shellInner = polarPoint(starCx, starCy, shellRadiusPx - 48, shellAngleRad);
  const shellArc = arcPath(starCx, starCy, shellRadiusPx, shellAngleRad - 0.46, shellAngleRad + 0.46);
  const enclosedRadiusPx = Math.max(8, shellRadiusPx);

  const patch = scenario.shellPatch;
  const patchX = 480;
  const patchY = 184;
  const patchWidth = 264;
  const patchHeight = 144;
  const patchCenterY = patchY + patchHeight / 2;
  const patchCenterX = patchX + patchWidth / 2;
  const patchInnerX = patchX + 42;
  const patchOuterX = patchX + patchWidth - 42;
  const avgPressure = Math.max(
    (patch.pressureInnerDynePerCm2 + patch.pressureOuterDynePerCm2) * 0.5,
    1
  );
  // The pressure difference is physically tiny compared with absolute pressure, so the
  // visual offset is deliberately nonlinear to keep the support logic visible.
  const pressureContrast = Math.abs(patch.pressureDifferenceDynePerCm2) / avgPressure;
  const deltaVisible = 18 * Math.tanh(pressureContrast * 110);
  const pressureBaseLength = 56;
  const innerPressureLength = pressureBaseLength + deltaVisible * 0.6;
  const outerPressureLength = pressureBaseLength - deltaVisible * 0.45;
  const forceReference = Math.max(
    Math.abs(patch.gravitationalForceDyne),
    Math.abs(patch.pressureForceDifferenceDyne),
    Math.abs(patch.netForceDyne),
    1
  );
  const gravityLength = scaleArrowLength(patch.gravitationalForceDyne, forceReference, 36, 82);
  const netLength = scaleArrowLength(patch.netForceDyne, forceReference, 14, 58);
  const netDirection = patch.netForceDyne >= 0 ? 1 : -1;
  const netBalanced = Math.abs(patch.netForceDyne) / forceReference < 0.05;
  const supportModeText =
    state.supportMode === "balanced"
      ? "net force ~ 0"
      : state.supportMode === "under-supported"
        ? "net force inward"
        : "net force outward";
  const connectorStartX = shellNode.x + 10;
  const connectorStartY = shellNode.y - 12;
  const connectorEndX = patchX - 18;
  const connectorEndY = patchCenterY - 8;
  const innerArrowY = patchCenterY - 18;
  const outerArrowY = patchCenterY + 18;
  const gravityArrowY = patchY + patchHeight + 44;
  const netArrowY = patchY + patchHeight + 88;

  return `
      <title>Hydrostatic equilibrium shell view</title>
      <desc>
        A star cutaway highlights the selected shell radius and the mass enclosed inside it. A local shell patch compares the inner pressure force, outer pressure force, gravity, and the net force.
      </desc>
      <defs>
        <radialGradient id="hydroHeroGlow" cx="36%" cy="38%" r="78%">
          <stop offset="0%" style="stop-color: color-mix(in srgb, var(--cp-glow-blue) 82%, transparent); stop-opacity: 1;" />
          <stop offset="58%" style="stop-color: color-mix(in srgb, var(--cp-accent) 8%, transparent); stop-opacity: 0.72;" />
          <stop offset="100%" style="stop-color: transparent; stop-opacity: 0;" />
        </radialGradient>
        <radialGradient id="hydroStarFill" cx="40%" cy="34%" r="76%">
          <stop offset="0%" style="stop-color: color-mix(in srgb, var(--hydro-star-core) 92%, white 8%); stop-opacity: 1;" />
          <stop offset="58%" style="stop-color: var(--hydro-star-outer); stop-opacity: 0.94;" />
          <stop offset="100%" style="stop-color: color-mix(in srgb, var(--cp-bg2) 88%, transparent); stop-opacity: 1;" />
        </radialGradient>
      </defs>

      <rect class="hero-backdrop" x="0" y="0" width="840" height="560" rx="24"></rect>

      <circle class="hero-star-shell" cx="${starCx}" cy="${starCy}" r="${starRadiusPx}"></circle>
      <circle class="hero-enclosed-mass" cx="${starCx}" cy="${starCy}" r="${enclosedRadiusPx}"></circle>
      <circle class="hero-shell-guide" cx="${starCx}" cy="${starCy}" r="${shellRadiusPx}"></circle>
      <path class="hero-shell-arc" d="${shellArc}"></path>
      <circle class="hero-shell-node" cx="${shellNode.x}" cy="${shellNode.y}" r="6.4"></circle>
      <circle class="hero-contour" cx="${starCx}" cy="${starCy}" r="${starRadiusPx * 0.72}"></circle>
      <circle class="hero-contour" cx="${starCx}" cy="${starCy}" r="${starRadiusPx * 0.42}"></circle>
      <circle class="hero-contour" cx="${starCx}" cy="${starCy}" r="${starRadiusPx * 0.18}"></circle>

      ${arrowPolygon({
        x1: shellOuter.x,
        y1: shellOuter.y,
        x2: shellInner.x,
        y2: shellInner.y,
        className: "hero-arrow hero-arrow--gravity",
        shaftWidth: 10,
        headLength: 22,
        headWidth: 24
      })}
      <text class="hero-label hero-label--strong" x="${starCx - 108}" y="${starCy - enclosedRadiusPx - 18}">enclosed mass M(r)</text>
      <text class="hero-label hero-label--gravity hero-label--strong" x="${shellOuter.x + 18}" y="${shellOuter.y - 10}">local gravity</text>

      <path class="hero-callout" d="M ${connectorStartX} ${connectorStartY} C 416 156, 472 150, ${connectorEndX} ${connectorEndY}"></path>

      <rect class="hero-patch" x="${patchX}" y="${patchY}" width="${patchWidth}" height="${patchHeight}" rx="18"></rect>
      <line class="hero-patch-face hero-patch-face--inner" x1="${patchInnerX}" y1="${patchY + 18}" x2="${patchInnerX}" y2="${patchY + patchHeight - 18}"></line>
      <line class="hero-patch-face hero-patch-face--outer" x1="${patchOuterX}" y1="${patchY + 18}" x2="${patchOuterX}" y2="${patchY + patchHeight - 18}"></line>

      ${arrowPolygon({
        x1: patchInnerX - innerPressureLength,
        y1: innerArrowY,
        x2: patchInnerX + 4,
        y2: innerArrowY,
        className: "hero-arrow hero-arrow--pressure",
        shaftWidth: 10,
        headLength: 20,
        headWidth: 24
      })}
      ${arrowPolygon({
        x1: patchOuterX + outerPressureLength,
        y1: outerArrowY,
        x2: patchOuterX - 4,
        y2: outerArrowY,
        className: "hero-arrow hero-arrow--pressure-outer",
        shaftWidth: 10,
        headLength: 20,
        headWidth: 24
      })}
      ${arrowPolygon({
        x1: patchCenterX + gravityLength * 0.5,
        y1: gravityArrowY,
        x2: patchCenterX - gravityLength * 0.5,
        y2: gravityArrowY,
        className: "hero-arrow hero-arrow--gravity",
        shaftWidth: 10,
        headLength: 20,
        headWidth: 24
      })}
      ${
        netBalanced
          ? `<line class="hero-force-guide" x1="${patchCenterX - 20}" y1="${netArrowY}" x2="${patchCenterX + 20}" y2="${netArrowY}"></line>`
          : arrowPolygon({
              x1: patchCenterX - netDirection * netLength * 0.5,
              y1: netArrowY,
              x2: patchCenterX + netDirection * netLength * 0.5,
              y2: netArrowY,
              className: `hero-arrow ${netBalanced ? "hero-arrow--net" : "hero-arrow--net-unbalanced"}`,
              shaftWidth: 8,
              headLength: 16,
              headWidth: 18
            })
      }

      <text class="hero-label hero-label--strong" x="${patchX}" y="${patchY - 18}">pressure difference across the shell</text>
      <text class="hero-label hero-label--pressure hero-label--strong" x="${patchX}" y="${innerArrowY - 10}">inner pressure</text>
      <text class="hero-label hero-label--pressure hero-label--strong" x="${patchOuterX + 18}" y="${outerArrowY + 34}">outer pressure</text>
      <text class="hero-label hero-label--gravity hero-label--strong" x="${patchX}" y="${gravityArrowY + 14}">gravity</text>
      <text class="hero-label hero-label--net hero-label--strong" x="${patchX}" y="${netArrowY + 18}">${supportModeText}</text>
  `;
}

function buildPath(points: Array<[number, number]>): string {
  if (points.length === 0) return "";
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function renderProfileSvg(
  scenario: ReturnType<typeof buildHydrostaticScenario>,
  profileKey: HydrostaticProfileKey,
  explorerMode: HydrostaticExplorerMode
): string {
  const width = 760;
  const height = 380;
  const margin = { top: 28, right: 30, bottom: 54, left: 88 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = scenario.profile.map((point) => profileValueForKey(point, profileKey));
  const domain = profileDomain(values, profileKey);
  const tab = profileTabMeta(profileKey);
  const baselineValue = profileKey === "pressure-gradient" ? 0 : domain.min;

  const xFor = (fraction: number) => margin.left + fraction * plotWidth;
  const yFor = (value: number) => {
    if (domain.max === domain.min) return margin.top + plotHeight * 0.5;
    const norm = (value - domain.min) / (domain.max - domain.min);
    return margin.top + plotHeight * (1 - norm);
  };

  const linePoints = scenario.profile.map((point) => [xFor(point.radiusFraction), yFor(profileValueForKey(point, profileKey))] as [number, number]);
  const areaPath = `${buildPath(linePoints)} L ${xFor(1).toFixed(2)} ${yFor(baselineValue).toFixed(2)} L ${xFor(0).toFixed(2)} ${yFor(baselineValue).toFixed(2)} Z`;
  const linePath = buildPath(linePoints);
  const shellValue = profileValueForKey(scenario.shellPoint, profileKey);
  const shellX = xFor(scenario.shellRadiusFraction);
  const shellY = yFor(shellValue);
  const baselineY = yFor(0);
  const ticks =
    profileKey === "pressure-gradient"
      ? [0, 0.5 * domain.min, domain.min]
      : [domain.max, 0.5 * (domain.max + domain.min), domain.min];

  const lineClass = PROFILE_LINE_CLASS[profileKey];
  const showArea = explorerMode === "instructor" && profileKey !== "pressure-gradient";

  return `
      <title>${tab.label} radial profile</title>
      <desc>
        The selected radial quantity is plotted against radius fraction. A guide line marks the current shell radius and a marker highlights the current shell value.
      </desc>

      <line class="profile-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"></line>
      <line class="profile-axis" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"></line>
      ${
        profileKey === "pressure-gradient"
          ? `<line class="plot-zero-line" x1="${margin.left}" y1="${baselineY}" x2="${margin.left + plotWidth}" y2="${baselineY}"></line>`
          : ""
      }
      ${showArea ? `<path class="profile-area plot-area--${lineClass}" d="${areaPath}"></path>` : ""}
      <path class="profile-line plot-line--${lineClass}" d="${linePath}"></path>
      <line class="profile-guide" x1="${shellX}" y1="${margin.top}" x2="${shellX}" y2="${margin.top + plotHeight}"></line>
      <circle class="plot-marker-ring" cx="${shellX}" cy="${shellY}" r="12"></circle>
      <circle class="plot-marker" cx="${shellX}" cy="${shellY}" r="7.5"></circle>

      ${ticks
        .map((tickValue, index) => {
          const y = yFor(tickValue);
          return `
            <line class="profile-axis" x1="${margin.left - 8}" y1="${y}" x2="${margin.left}" y2="${y}"></line>
            <text class="profile-tick" x="${margin.left - 14}" y="${y + 4}" text-anchor="end">${formatAxisValue(tickValue)}</text>
            ${
              index > 0 && index < ticks.length - 1
                ? `<line class="hero-force-guide" x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}"></line>`
                : ""
            }
          `;
        })
        .join("")}

      <text class="profile-axis-label" x="${margin.left + plotWidth * 0.5}" y="${height - 14}" text-anchor="middle">radius fraction r/R</text>
      <text class="profile-axis-label" x="${margin.left}" y="${margin.top - 10}">${tab.label}</text>
      <text class="profile-caption" x="${margin.left + plotWidth}" y="${margin.top - 10}" text-anchor="end">shell guide at r/R = ${formatFixed(scenario.shellRadiusFraction, 2)}</text>
  `;
}

function applyInteractiveState(
  scope: ParentNode,
  selector: string,
  enabled: boolean
): void {
  for (const element of scope.querySelectorAll<HTMLInputElement | HTMLButtonElement>(selector)) {
    element.disabled = !enabled;
  }
}

function buildStateBannerHtml(
  scenario: ReturnType<typeof buildHydrostaticScenario>,
  stepId: GuidedStepId
): string | null {
  if (scenario.supportMode !== "balanced") {
    return "Local shell intentionally perturbed; the global profile stays hydrostatic for reference.";
  }

  if (stepId === "density-model") {
    return "Mass and radius fixed. Only the interior density distribution changed.";
  }

  if (scenario.shellRadiusFraction < 0.1) {
    return "Near the center, $g(r)$ tends toward zero because enclosed mass shrinks faster than $r^2$ in these toy models.";
  }

  if (scenario.shellRadiusFraction > 0.9) {
    return "Near the surface, the toy-model pressure profile approaches the chosen outer boundary condition $P(R)=0$.";
  }

  return null;
}

function buildNoticeItems(
  scenario: ReturnType<typeof buildHydrostaticScenario>,
  stepId: GuidedStepId
): string[] {
  if (stepId === "predict") {
    return [
      "Compactness means packing the same mass into a smaller radius.",
      "Ask whether stronger self-gravity should require more or less pressure support.",
      "Then test the scaling law $P_c \\propto R^{-4}$."
    ];
  }

  if (stepId === "local-shell") {
    return [
      `At $r/R=${formatFixed(scenario.shellRadiusFraction, 2)}$, the shell faces have equal area.`,
      "Equal pressure on those faces would cancel and leave gravity unbalanced.",
      "Only the pressure difference across the shell can support its local weight."
    ];
  }

  if (stepId === "global-profile") {
    return [
      "Use the vertical guide to match the shell radius across the cutaway and the profile plot.",
      "Pressure and density are local quantities; enclosed mass is cumulative.",
      "The pressure-gradient curve is the most direct support diagnostic."
    ];
  }

  if (stepId === "compactness") {
    return [
      "Hold $M$ fixed, shrink $R$, and the support problem steepens sharply.",
      "Mean density rises because the same mass is packed into a smaller volume.",
      "The pressure scale responds very strongly: $P_c \\propto R^{-4}$."
    ];
  }

  if (stepId === "density-model") {
    return [
      "Keep the same total $M$ and $R$ while changing only the internal mass distribution.",
      "A centrally concentrated toy star places more mass deeper inside the star.",
      "That raises the exact central pressure even though the same scaling ladder still helps."
    ];
  }

  if (stepId === "thermal-bridge") {
    return [
      "Hydrostatic equilibrium gives the pressure requirement; it does not tell you the energy source.",
      "If gas pressure supplies that support, the ideal-gas bridge converts the support scale into a temperature scale.",
      "Changing $\\mu$ changes the temperature required for the same support problem."
    ];
  }

  return [
    "Use one local statement: $dP/dr=-\\rho g$.",
    "Use one global scale: $P_c\\sim G M^2 / R^4$.",
    "Then bridge to the thermal requirement: $T_c\\sim \\mu G M m_p / (k_B R)$."
  ];
}

function buildProfileInterpretation(
  scenario: ReturnType<typeof buildHydrostaticScenario>,
  profileKey: HydrostaticProfileKey
): string {
  const valueLatex = formatProfileValueLatex(
    profileKey,
    profileValueForKey(scenario.shellPoint, profileKey),
    true
  );

  return `${profileTeachingNote(profileKey)} At the highlighted shell, the current value is $${valueLatex}$.`;
}

function buildSummaryCards(args: {
  scenario: ReturnType<typeof buildHydrostaticScenario>;
  stepId: GuidedStepId;
  pressureScaleToSolar: number;
  exactCenterToScale: number;
  supportFactor: number;
  netDirection: string;
}): { change: string; why: string; infer: string } {
  const { scenario, stepId, pressureScaleToSolar, exactCenterToScale, supportFactor, netDirection } = args;

  if (stepId === "predict") {
    return {
      change: `This starting case has $M=${formatFixed(scenario.preset.massSolarMass, 2)}\\,M_{\\odot}$ and $R=${formatFixed(scenario.preset.radiusSolarRadius, 2)}\\,R_{\\odot}$.`,
      why: "The next question is whether making the star more compact should increase or decrease the pressure required for support.",
      infer: "Make the prediction before you use the structure controls."
    };
  }

  if (stepId === "local-shell") {
    return {
      change: `At $r/R=${formatFixed(scenario.shellRadiusFraction, 2)}$, the required local gradient is $${scientificQuantityLatex(scenario.shellPoint.pressureGradientDynePerCm3, "{\\rm dyne\\,cm^{-3}}", true)}$.`,
      why: "The shell has local weight because the gas there has density and feels gravity.",
      infer: "Hydrostatic equilibrium is a local balance law, not just a statement that the star has pressure."
    };
  }

  if (stepId === "global-profile") {
    return {
      change: `This shell encloses $${formatScientificLatex(HydrostaticEquilibriumModel.massGToSolarMass(scenario.shellPoint.enclosedMassG), 3)}\\,M_{\\odot}$ and feels $g(r)=${scientificQuantityLatex(scenario.shellPoint.gravityCmPerS2, "{\\rm cm\\,s^{-2}}", true)}$.`,
      why: "Enclosed mass sets the local gravity problem, and the radial profiles show how that problem changes with depth.",
      infer: "A single shell only makes sense when you place it in the whole stellar structure."
    };
  }

  if (stepId === "compactness") {
    return {
      change: `This star needs about $${formatRatioLatex(pressureScaleToSolar, 2)}$ times the Sun's characteristic pressure scale.`,
      why: "At fixed mass, smaller radius strengthens self-gravity and drives the support requirement upward as $R^{-4}$.",
      infer: "Compactness is a powerful global predictor of how hard the hydrostatic problem is."
    };
  }

  if (stepId === "density-model") {
    return {
      change: `With ${DENSITY_MODEL_LABEL[scenario.densityModel].toLowerCase()}, the exact toy-model center is about $${formatRatioLatex(exactCenterToScale, 2)}$ times the scale estimate.`,
      why: "Redistributing the same total mass deeper inside the star steepens the inner support problem.",
      infer: "Scaling relations are useful, but the exact central pressure still depends on internal structure."
    };
  }

  if (stepId === "thermal-bridge") {
    return {
      change: `With $\\mu=${formatFixed(scenario.meanMolecularWeightMu, 2)}$, the thermal bridge implies $T_c\\sim ${formatKelvinOrMegaKelvinLatex(scenario.coreTemperatureScaleK)}$.`,
      why: "The ideal-gas relation connects pressure support to a temperature scale through the average particle mass.",
      infer: "Support can be thermal without making fusion itself the support law."
    };
  }

  return {
    change: `This case needs $P_c\\sim ${scientificQuantityLatex(scenario.centralPressureScaleDynePerCm2, "{\\rm dyne\\,cm^{-2}}", true)}$ and $T_c\\sim ${formatKelvinOrMegaKelvinLatex(scenario.coreTemperatureScaleK)}$.`,
    why: "Gravity sets the support problem, hydrostatic equilibrium sets the gradient, and the ideal-gas bridge turns pressure into temperature.",
    infer: "The local shell law leads all the way to a core-temperature scale for an ideal-gas-supported star."
  };
}

const demoRoot = q<HTMLElement>("#cp-demo");
const helpButton = q<HTMLButtonElement>("#help");
const stationModeButton = q<HTMLButtonElement>("#stationMode");
const copyResultsButton = q<HTMLButtonElement>("#copyResults");
const statusEl = q<HTMLParagraphElement>("#status");

const massSlider = q<HTMLInputElement>("#massSlider");
const radiusSlider = q<HTMLInputElement>("#radiusSlider");
const shellRadiusSlider = q<HTMLInputElement>("#shellRadiusSlider");
const muSlider = q<HTMLInputElement>("#muSlider");

const massValue = q<HTMLSpanElement>("#massValue");
const radiusValue = q<HTMLSpanElement>("#radiusValue");
const shellRadiusValue = q<HTMLSpanElement>("#shellRadiusValue");
const muValue = q<HTMLSpanElement>("#muValue");
const sidebarStepBadge = q<HTMLSpanElement>("#sidebarStepBadge");
const modeCard = q<HTMLElement>("#modeCard");
const presetCard = q<HTMLElement>("#presetCard");
const modeDescription = q<HTMLParagraphElement>("#modeDescription");
const presetStateBadge = q<HTMLSpanElement>("#presetStateBadge");
const presetNote = q<HTMLParagraphElement>("#presetNote");
const basicControlsCard = q<HTMLElement>("#basicControlsCard");
const localShellStateControls = q<HTMLElement>("#localShellStateControls");
const structureControlsCard = q<HTMLElement>("#structureControlsCard");
const advancedControlsCard = q<HTMLDetailsElement>("#advancedControlsCard");
const basicControlsLock = q<HTMLParagraphElement>("#basicControlsLock");
const structureControlsLock = q<HTMLParagraphElement>("#structureControlsLock");
const advancedControlsLock = q<HTMLParagraphElement>("#advancedControlsLock");

const profilePlot = q<SVGSVGElement>("#profilePlot");
const starShellView = q<SVGSVGElement>("#starShellView");
const heroCard = q<HTMLElement>("#heroCard");
const noticeCard = q<HTMLElement>("#noticeCard");
const profileCard = q<HTMLElement>("#profileCard");
const profileCurrentValue = q<HTMLDivElement>("#profileCurrentValue");
const profileCurrentLabel = q<HTMLDivElement>("#profileCurrentLabel");
const profileInterpretation = q<HTMLParagraphElement>("#profileInterpretation");
const heroShellRadiusText = q<HTMLSpanElement>("#heroShellRadiusText");
const heroDensityBadge = q<HTMLSpanElement>("#heroDensityBadge");
const heroSupportBadge = q<HTMLSpanElement>("#heroSupportBadge");
const shellNarrative = q<HTMLParagraphElement>("#shellNarrative");
const currentTaskBadge = q<HTMLSpanElement>("#currentTaskBadge");
const currentTaskTag = q<HTMLSpanElement>("#currentTaskTag");
const currentTaskTitle = q<HTMLHeadingElement>("#currentTaskTitle");
const currentTaskPrompt = q<HTMLParagraphElement>("#currentTaskPrompt");
const predictionPanel = q<HTMLDivElement>("#predictionPanel");
const predictionUp = q<HTMLButtonElement>("#predictionUp");
const predictionDown = q<HTMLButtonElement>("#predictionDown");
const predictionSame = q<HTMLButtonElement>("#predictionSame");
const checkPredictionButton = q<HTMLButtonElement>("#checkPrediction");
const predictionFeedback = q<HTMLParagraphElement>("#predictionFeedback");
const guidedTaskActions = q<HTMLDivElement>("#guidedTaskActions");
const taskPrev = q<HTMLButtonElement>("#taskPrev");
const taskNext = q<HTMLButtonElement>("#taskNext");
const taskPrevAlt = q<HTMLButtonElement>("#taskPrevAlt");
const taskNextAlt = q<HTMLButtonElement>("#taskNextAlt");
const noticeModeTag = q<HTMLSpanElement>("#noticeModeTag");
const noticeTitle = q<HTMLHeadingElement>("#noticeTitle");
const noticeBody = q<HTMLParagraphElement>("#noticeBody");
const stateBanner = q<HTMLDivElement>("#stateBanner");
const noticeList = q<HTMLUListElement>("#noticeList");
const summaryChange = q<HTMLParagraphElement>("#summaryChange");
const summaryWhy = q<HTMLParagraphElement>("#summaryWhy");
const summaryInfer = q<HTMLParagraphElement>("#summaryInfer");
const thermalBridgeCard = q<HTMLElement>("#thermalBridgeCard");
const thermalBridgeNotice = q<HTMLParagraphElement>("#thermalBridgeNotice");
const synthesisCard = q<HTMLElement>("#synthesisCard");
const synthesisLocal = q<HTMLTextAreaElement>("#synthesisLocal");
const synthesisGlobal = q<HTMLTextAreaElement>("#synthesisGlobal");
const synthesisThermal = q<HTMLTextAreaElement>("#synthesisThermal");
const synthesisChecklist = q<HTMLParagraphElement>("#synthesisChecklist");

const ladderGravityText = q<HTMLDivElement>("#ladderGravityText");
const ladderHydroText = q<HTMLDivElement>("#ladderHydroText");
const ladderPressureText = q<HTMLDivElement>("#ladderPressureText");
const ladderGasText = q<HTMLDivElement>("#ladderGasText");
const ladderTemperatureText = q<HTMLDivElement>("#ladderTemperatureText");

const gravityNotice = q<HTMLParagraphElement>("#gravityNotice");
const hydroNotice = q<HTMLParagraphElement>("#hydroNotice");
const pressureScaleNotice = q<HTMLParagraphElement>("#pressureScaleNotice");
const temperatureNotice = q<HTMLParagraphElement>("#temperatureNotice");

const readoutMass = q<HTMLDivElement>("#readoutMass");
const readoutRadius = q<HTMLDivElement>("#readoutRadius");
const readoutMeanDensity = q<HTMLDivElement>("#readoutMeanDensity");
const readoutGravity = q<HTMLDivElement>("#readoutGravity");
const readoutCentralPressure = q<HTMLDivElement>("#readoutCentralPressure");
const readoutCoreTemperature = q<HTMLDivElement>("#readoutCoreTemperature");
const readoutStrip = q<HTMLElement>("#readoutStrip");
const readoutMassCard = q<HTMLElement>("#readoutMassCard");
const readoutRadiusCard = q<HTMLElement>("#readoutRadiusCard");
const readoutMeanDensityCard = q<HTMLElement>("#readoutMeanDensityCard");
const readoutGravityCard = q<HTMLElement>("#readoutGravityCard");
const readoutCentralPressureCard = q<HTMLElement>("#readoutCentralPressureCard");
const readoutCoreTemperatureCard = q<HTMLElement>("#readoutCoreTemperatureCard");
const readoutUnitLabels = Array.from(
  document.querySelectorAll<HTMLElement>(".hydro-readout-unit")
);
const drawerShelf = q<HTMLElement>("#drawerShelf");
const stageTabs = q<HTMLElement>(".stage-tabs");
const tabExplore = q<HTMLButtonElement>("#tab-explore");
const tabUnderstand = q<HTMLButtonElement>("#tab-understand");
const panelExplore = q<HTMLElement>("#panel-explore");
const panelUnderstand = q<HTMLElement>("#panel-understand");

const modeStudent = q<HTMLButtonElement>("#modeStudent");
const modeInstructor = q<HTMLButtonElement>("#modeInstructor");
const densityModelUniform = q<HTMLButtonElement>("#densityModelUniform");
const densityModelCentral = q<HTMLButtonElement>("#densityModelCentral");
const supportModeBalanced = q<HTMLButtonElement>("#supportModeBalanced");
const supportModeUnder = q<HTMLButtonElement>("#supportModeUnder");
const supportModeOver = q<HTMLButtonElement>("#supportModeOver");

const toggleUnits = q<HTMLInputElement>("#toggleUnits");
const toggleNormalized = q<HTMLInputElement>("#toggleNormalized");
const toggleDerivation = q<HTMLInputElement>("#toggleDerivation");

const derivationToggles = Array.from(document.querySelectorAll<HTMLElement>(".derivation-toggle"));
const profileButtons = Array.from(q<HTMLDivElement>("#profileTabGroup").querySelectorAll<HTMLButtonElement>("button[data-profile-key]"));

const presetButtons: Record<HydrostaticPresetId, HTMLButtonElement> = {
  "sun-like": q<HTMLButtonElement>("#presetSunLike"),
  "same-mass-smaller-radius": q<HTMLButtonElement>("#presetSameMassSmallerRadius"),
  "massive-main-sequence": q<HTMLButtonElement>("#presetMassiveMainSequence"),
  "compact-toy": q<HTMLButtonElement>("#presetCompactToy"),
  "under-supported": q<HTMLButtonElement>("#presetUnderSupported"),
  "over-supported": q<HTMLButtonElement>("#presetOverSupported")
};

const challengeProgress = q<HTMLSpanElement>("#challengeProgress");
const challengePrompt = q<HTMLParagraphElement>("#challengePrompt");
const challengeChoices = q<HTMLDivElement>("#challengeChoices");
const challengeHintText = q<HTMLParagraphElement>("#challengeHintText");
const challengeFeedback = q<HTMLDivElement>("#challengeFeedback");
const checkChallengeButton = q<HTMLButtonElement>("#checkChallenge");
const nextChallengeButton = q<HTMLButtonElement>("#nextChallenge");
const challengeHintButton = q<HTMLButtonElement>("#challengeHint");

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:hydrostatic-equilibrium-explorer:mode",
  url: new URL(window.location.href)
});

const state: ExplorerState = {
  presetId: "sun-like",
  massSolarMass: HYDROSTATIC_PRESETS["sun-like"].massSolarMass,
  radiusSolarRadius: HYDROSTATIC_PRESETS["sun-like"].radiusSolarRadius,
  shellRadiusFraction: HYDROSTATIC_PRESETS["sun-like"].shellRadiusFraction,
  densityModel: HYDROSTATIC_PRESETS["sun-like"].densityModel,
  supportMode: HYDROSTATIC_PRESETS["sun-like"].supportMode,
  meanMolecularWeightMu: HYDROSTATIC_PRESETS["sun-like"].meanMolecularWeightMu,
  profileKey: "pressure",
  explorerMode: "student",
  guidedStepId: "predict",
  showUnits: true,
  showNormalizedValues: true,
  showDerivations: false,
  predictionChoiceId: null,
  predictionFeedbackHtml: null,
  predictionChecked: false,
  challenge: {
    selectedChoiceId: null,
    hintText: null,
    feedbackText: null,
    feedbackTone: null,
    completed: false,
    awaitingAdvance: false
  },
  synthesis: {
    local: "",
    global: "",
    thermal: ""
  }
};

const challengeEngine = new ChallengeEngine(buildChallengeDefinitions(), {
  showUI: false,
  onProgress: (_current, total, challenge) => {
    state.challenge.selectedChoiceId = null;
    state.challenge.hintText = null;
    state.challenge.feedbackText = null;
    state.challenge.feedbackTone = null;
    state.challenge.completed = false;
    state.challenge.awaitingAdvance = false;
    challengeProgress.textContent = `${Math.max(1, _current)} / ${total}`;
    if (challenge?.prompt) {
      setLiveRegionText(statusEl, "Checkpoint ready. Answer first, then check your reasoning.");
    }
    render();
  },
  onCorrect: (_challenge, _answer) => {
    state.challenge.awaitingAdvance = true;
    const promptId = _challenge.id;
    const source = CHALLENGE_LOOKUP.get(promptId);
    state.challenge.feedbackTone = "correct";
    state.challenge.feedbackText = source
      ? `Correct. ${source.explanation}`
      : "Correct.";
    render();
    setLiveRegionText(statusEl, "Correct. The next checkpoint will load automatically.");
  },
  onIncorrect: (_challenge, _answer, result) => {
    state.challenge.feedbackTone = result.close ? "close" : "incorrect";
    state.challenge.feedbackText = result.message ? `Try again. ${result.message}` : "Try again.";
    render();
    setLiveRegionText(statusEl, "Not quite. Use the shell view and the profile plot before checking again.");
  },
  onComplete: () => {
    state.challenge.completed = true;
    state.challenge.awaitingAdvance = false;
    state.challenge.feedbackTone = "correct";
    state.challenge.feedbackText =
      "Checkpoint deck complete. Restart it or keep exploring with new presets and density models.";
    render();
    setLiveRegionText(statusEl, "Checkpoint deck complete.");
  },
  onStop: () => {
    state.challenge.awaitingAdvance = false;
    render();
  }
});

const demoModes = createDemoModes({
  help: {
    title: "Help / Shortcuts",
    subtitle: "Use the shell view, radial profile, and equation ladder together.",
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
        heading: "How to use this exhibit",
        type: "html",
        html: `
          <ul style="margin: 0; padding-left: 1.2rem;">
            <li>Start with a prediction: if compactness changes, what happens to the required pressure scale?</li>
            <li>Move the shell radius and compare the local weight to the pressure-force difference across the patch.</li>
            <li>Switch density models to separate “mean-density scaling” from “central concentration changes the exact center.”</li>
          </ul>
        `
      }
    ]
  },
  station: {
    title: "Station Mode: Hydrostatic Equilibrium Explorer",
    subtitle: "Predict -> inspect -> infer. Add rows, then copy CSV or print.",
    steps: [
      "Choose a preset and write one compactness prediction before moving any sliders.",
      "Move the shell radius and record how the local pressure gradient and local gravity compare.",
      "Switch density models at fixed mass and radius, then explain why the exact central pressure changes."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "massSolar", label: "M (M_sun)" },
      { key: "radiusSolar", label: "R (R_sun)" },
      { key: "shellFraction", label: "r/R" },
      { key: "densityModel", label: "Density model" },
      { key: "supportMode", label: "Local shell state" },
      { key: "gravity", label: "g (cm s^-2)" },
      { key: "gradient", label: "dP/dr (dyne cm^-3)" },
      { key: "pressureScale", label: "P_c scale (dyne cm^-2)" }
    ],
    getSnapshotRow() {
      const scenario = buildHydrostaticScenario(currentPresetFromState(state));
      return {
        case: HYDROSTATIC_PRESETS[state.presetId].label,
        massSolar: formatFixed(state.massSolarMass, 2),
        radiusSolar: formatFixed(state.radiusSolarRadius, 2),
        shellFraction: formatFixed(state.shellRadiusFraction, 2),
        densityModel: DENSITY_MODEL_LABEL[state.densityModel],
        supportMode: SUPPORT_MODE_LABEL[state.supportMode],
        gravity: formatScientificLatex(scenario.shellPoint.gravityCmPerS2, 3),
        gradient: formatScientificLatex(scenario.shellPoint.pressureGradientDynePerCm3, 3),
        pressureScale: formatScientificLatex(scenario.centralPressureScaleDynePerCm2, 3)
      };
    },
    snapshotLabel: "Add row (current shell)",
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> Explain how gravity, the pressure gradient, and compactness fit into one causal chain. Cite one local shell observation and one global scaling result.</p>"
  }
});

function applyPreset(presetId: HydrostaticPresetId): void {
  const preset = HYDROSTATIC_PRESETS[presetId];
  state.presetId = presetId;
  state.massSolarMass = preset.massSolarMass;
  state.radiusSolarRadius = preset.radiusSolarRadius;
  state.shellRadiusFraction = preset.shellRadiusFraction;
  state.densityModel = preset.densityModel;
  state.supportMode = preset.supportMode;
  state.meanMolecularWeightMu = preset.meanMolecularWeightMu;
  state.challenge.feedbackText = null;
  state.challenge.feedbackTone = null;
  state.challenge.hintText = null;
  render();
  setLiveRegionText(statusEl, `${preset.label} preset loaded.`);
}

function setGuidedStep(stepId: GuidedStepId): void {
  state.guidedStepId = stepId;
  if (state.explorerMode === "student") {
    state.profileKey = currentGuidedStep(stepId).focusProfileKey;
  }
  render();
  setLiveRegionText(statusEl, `${currentGuidedStep(stepId).title}.`);
}

function shiftGuidedStep(delta: number): void {
  const currentIndex = guidedStepIndex(state.guidedStepId);
  const nextIndex = clamp(currentIndex + delta, 0, GUIDED_STEPS.length - 1);
  setGuidedStep(GUIDED_STEPS[nextIndex].id);
}

function setSelectionButtons(): void {
  const matchedPresetId = matchingPresetId(currentPresetFromState(state));
  for (const [presetId, button] of Object.entries(presetButtons) as Array<[HydrostaticPresetId, HTMLButtonElement]>) {
    const active = presetId === matchedPresetId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  densityModelUniform.setAttribute("aria-checked", state.densityModel === "uniform" ? "true" : "false");
  densityModelCentral.setAttribute("aria-checked", state.densityModel === "central-toy" ? "true" : "false");
  supportModeBalanced.setAttribute("aria-checked", state.supportMode === "balanced" ? "true" : "false");
  supportModeUnder.setAttribute("aria-checked", state.supportMode === "under-supported" ? "true" : "false");
  supportModeOver.setAttribute("aria-checked", state.supportMode === "over-supported" ? "true" : "false");
  modeStudent.setAttribute("aria-checked", state.explorerMode === "student" ? "true" : "false");
  modeInstructor.setAttribute("aria-checked", state.explorerMode === "instructor" ? "true" : "false");

  for (const button of profileButtons) {
    const key = button.dataset.profileKey;
    const active = key === state.profileKey;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  predictionUp.setAttribute("aria-pressed", state.predictionChoiceId === "up" ? "true" : "false");
  predictionDown.setAttribute("aria-pressed", state.predictionChoiceId === "down" ? "true" : "false");
  predictionSame.setAttribute("aria-pressed", state.predictionChoiceId === "same" ? "true" : "false");
}

function setChallengeFeedback(text: string | null, tone: ChallengeTone): void {
  state.challenge.feedbackText = text;
  state.challenge.feedbackTone = tone;
}

function renderChallengePanel(): void {
  if (state.challenge.completed) {
    setMathText(
      challengePrompt,
      "You worked through the full checkpoint deck. Restart it or change the star and test whether your reasoning still holds."
    );
    challengeChoices.innerHTML = "";
    challengeFeedback.hidden = !state.challenge.feedbackText;
    challengeFeedback.dataset.tone = state.challenge.feedbackTone ?? "";
    if (state.challenge.feedbackText) {
      setMathText(challengeFeedback, state.challenge.feedbackText);
    }
    challengeHintText.hidden = true;
    nextChallengeButton.textContent = "Restart deck";
    checkChallengeButton.disabled = true;
    challengeHintButton.disabled = true;
    challengeProgress.textContent = "Done";
    return;
  }

  const current = challengeEngine.getCurrentChallenge();
  const source = current ? CHALLENGE_LOOKUP.get(current.id) : null;

  if (!source) {
    challengePrompt.textContent = "Challenge deck unavailable.";
    challengeChoices.innerHTML = "";
    challengeHintText.hidden = true;
    challengeFeedback.hidden = true;
    checkChallengeButton.disabled = true;
    challengeHintButton.disabled = true;
    return;
  }

  setMathText(challengePrompt, source.prompt);
  challengeChoices.innerHTML = "";

  for (const choice of source.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "challenge-choice";
    button.setAttribute("role", "radio");
    const selected = state.challenge.selectedChoiceId === choice.id;
    button.setAttribute("aria-checked", selected ? "true" : "false");
    button.dataset.choiceId = choice.id;
    button.innerHTML = renderMathText(choice.label);
    button.addEventListener("click", () => {
      state.challenge.selectedChoiceId = choice.id;
      if (state.challenge.feedbackTone !== "correct") {
        setChallengeFeedback(null, null);
      }
      renderChallengePanel();
    });
    challengeChoices.appendChild(button);
  }

  if (state.challenge.hintText) {
    challengeHintText.hidden = false;
    setMathText(challengeHintText, state.challenge.hintText);
  } else {
    challengeHintText.hidden = true;
  }

  if (state.challenge.feedbackText) {
    challengeFeedback.hidden = false;
    challengeFeedback.dataset.tone = state.challenge.feedbackTone ?? "";
    setMathText(challengeFeedback, state.challenge.feedbackText);
  } else {
    challengeFeedback.hidden = true;
  }

  nextChallengeButton.textContent = "Next question";
  checkChallengeButton.disabled = state.challenge.awaitingAdvance;
  challengeHintButton.disabled = false;
}

function render(): void {
  const guidedStep = currentGuidedStep(state.guidedStepId);
  const studentPresentation = guidedStepPresentation(guidedStep.id);
  const stepNumber = guidedStepIndex(state.guidedStepId) + 1;
  const atFirstStep = stepNumber === 1;
  const atLastStep = stepNumber === GUIDED_STEPS.length;
  const shellUnlocked =
    state.explorerMode === "instructor" || studentPresentation.showShellStage;
  const massRadiusUnlocked =
    state.explorerMode === "instructor" || studentPresentation.showMassRadiusControls;
  const densityUnlocked =
    state.explorerMode === "instructor" || studentPresentation.showDensityModelControls;
  const advancedUnlocked =
    state.explorerMode === "instructor" || studentPresentation.showThermalBridge;
  const profileTabsUnlocked =
    state.explorerMode === "instructor" || studentPresentation.showProfileStage;

  if (!profileTabsUnlocked && state.profileKey !== guidedStep.focusProfileKey) {
    state.profileKey = guidedStep.focusProfileKey;
  }

  const preset = currentPresetFromState(state);
  const scenario = buildHydrostaticScenario(preset);
  const solarRefs = solarReferenceScales({
    meanMolecularWeightMu: state.meanMolecularWeightMu
  });
  const currentProfileValue = profileValueForKey(scenario.shellPoint, state.profileKey);
  const currentProfileMeta = profileTabMeta(state.profileKey);
  const pressureScaleToSolar =
    scenario.centralPressureScaleDynePerCm2 / solarRefs.centralPressureScaleDynePerCm2;
  const exactCenterToScale =
    scenario.centralPressureExactDynePerCm2 / scenario.centralPressureScaleDynePerCm2;
  const densityToSolar =
    scenario.meanDensityGPerCm3 /
    HydrostaticEquilibriumModel.meanDensityGPerCm3({
      massG: HydrostaticEquilibriumModel.solarMassToG(1),
      radiusCm: HydrostaticEquilibriumModel.solarRadiusToCm(1)
    });
  const supportFactor =
    scenario.shellPatch.pressureGradientRequiredDynePerCm3 === 0
      ? 1
      : scenario.shellPatch.pressureGradientAppliedDynePerCm3 /
        scenario.shellPatch.pressureGradientRequiredDynePerCm3;
  const netDirection =
    scenario.shellPatch.netForceDyne > 0
      ? "outward"
      : scenario.shellPatch.netForceDyne < 0
        ? "inward"
        : "nearly zero";
  const matchedPresetId = matchingPresetId(preset);
  const presetIsActive = matchedPresetId !== null;
  const stateBannerHtml = buildStateBannerHtml(scenario, guidedStep.id);
  const summaryCards = buildSummaryCards({
    scenario,
    stepId: guidedStep.id,
    pressureScaleToSolar,
    exactCenterToScale,
    supportFactor,
    netDirection
  });

  demoRoot.dataset.viewMode = state.explorerMode;
  demoRoot.dataset.guidedStep = guidedStep.id;

  massSlider.value = state.massSolarMass.toFixed(1);
  radiusSlider.value = state.radiusSolarRadius.toFixed(2);
  shellRadiusSlider.value = String(Math.round(state.shellRadiusFraction * 100));
  muSlider.value = state.meanMolecularWeightMu.toFixed(2);
  toggleUnits.checked = state.showUnits;
  toggleNormalized.checked = state.showNormalizedValues;
  toggleDerivation.checked = state.showDerivations;
  synthesisLocal.value = state.synthesis.local;
  synthesisGlobal.value = state.synthesis.global;
  synthesisThermal.value = state.synthesis.thermal;

  massValue.textContent = state.massSolarMass.toFixed(1);
  radiusValue.textContent = state.radiusSolarRadius.toFixed(2);
  shellRadiusValue.textContent = state.shellRadiusFraction.toFixed(2);
  muValue.textContent = state.meanMolecularWeightMu.toFixed(2);

  sidebarStepBadge.textContent = `Step ${stepNumber} · ${guidedStep.tag}`;
  modeDescription.textContent =
    state.explorerMode === "student"
      ? "Student mode stages one idea at a time: predict, inspect one shell, connect it to the full star, then bridge support to temperature."
      : "Instructor mode keeps all controls available while preserving the same local-to-global reasoning ladder.";
  presetStateBadge.textContent = presetIsActive
    ? "Preset active"
    : "Custom";
  setMathText(presetNote, primaryPromptForPreset(preset));
  setSelectionButtons();

  stageTabs.hidden = state.explorerMode === "student";
  if (state.explorerMode === "student") {
    tabExplore.setAttribute("aria-selected", "true");
    tabUnderstand.setAttribute("aria-selected", "false");
    panelExplore.hidden = false;
    panelUnderstand.hidden = true;
  }
  presetCard.hidden = state.explorerMode === "student" && !studentPresentation.showPresetChooser;
  basicControlsCard.hidden = state.explorerMode === "student" && !studentPresentation.showShellStage;
  localShellStateControls.hidden =
    state.explorerMode === "student" && !studentPresentation.showLocalShellStateControls;
  structureControlsCard.hidden =
    state.explorerMode === "student" &&
    !studentPresentation.showMassRadiusControls &&
    !studentPresentation.showDensityModelControls;
  advancedControlsCard.hidden =
    state.explorerMode === "student" && !studentPresentation.showThermalBridge;
  heroCard.hidden = state.explorerMode === "student" && !studentPresentation.showShellStage;
  noticeCard.hidden = state.explorerMode === "student" && !studentPresentation.showShellStage;
  profileCard.hidden = state.explorerMode === "student" && !studentPresentation.showProfileStage;
  thermalBridgeCard.hidden =
    state.explorerMode === "student" && !studentPresentation.showThermalBridge;
  synthesisCard.hidden =
    state.explorerMode === "student" && !studentPresentation.showSynthesisCard;
  readoutStrip.hidden =
    state.explorerMode === "student" && !studentPresentation.showReadoutStrip;
  drawerShelf.hidden =
    state.explorerMode === "student" && !studentPresentation.showCheckpointDeck;

  currentTaskBadge.textContent = `Step ${stepNumber} of ${GUIDED_STEPS.length}`;
  currentTaskTag.textContent = guidedStep.tag;
  currentTaskTitle.textContent = guidedStep.title;
  setMathText(currentTaskPrompt, guidedStep.prompt);

  predictionPanel.hidden = guidedStep.id !== "predict";
  guidedTaskActions.hidden = true;
  taskPrev.hidden = false;
  taskNext.hidden = false;
  taskPrev.disabled = atFirstStep;
  taskPrevAlt.disabled = atFirstStep;
  taskNext.disabled =
    atLastStep ||
    (state.explorerMode === "student" && guidedStep.id === "predict" && !state.predictionChecked);
  taskNextAlt.disabled = atLastStep;
  checkPredictionButton.disabled = state.predictionChoiceId === null;
  if (state.predictionFeedbackHtml) {
    predictionFeedback.hidden = false;
    setMathText(predictionFeedback, state.predictionFeedbackHtml);
  } else {
    predictionFeedback.hidden = true;
  }

  basicControlsCard.dataset.locked = shellUnlocked ? "false" : "true";
  structureControlsCard.dataset.locked = massRadiusUnlocked ? "false" : "true";
  advancedControlsCard.dataset.locked = advancedUnlocked ? "false" : "true";
  basicControlsLock.hidden = state.explorerMode === "instructor" || shellUnlocked;
  structureControlsLock.textContent = STRUCTURE_HINT_BY_STEP[state.guidedStepId];
  structureControlsLock.hidden = state.explorerMode === "instructor" || massRadiusUnlocked;
  advancedControlsLock.hidden = state.explorerMode === "instructor" || advancedUnlocked;
  advancedControlsCard.open =
    state.explorerMode === "instructor" || advancedUnlocked || state.showDerivations;

  applyInteractiveState(basicControlsCard, "input, button", shellUnlocked);
  applyInteractiveState(structureControlsCard, "#massSlider, #radiusSlider", massRadiusUnlocked);
  applyInteractiveState(
    structureControlsCard,
    "#densityModelUniform, #densityModelCentral",
    densityUnlocked
  );
  applyInteractiveState(
    advancedControlsCard,
    "#muSlider, #supportModeBalanced, #supportModeUnder, #supportModeOver, #toggleUnits, #toggleNormalized, #toggleDerivation",
    advancedUnlocked
  );
  applyInteractiveState(q("#profileTabGroup"), "button[data-profile-key]", profileTabsUnlocked);

  heroDensityBadge.textContent = DENSITY_MODEL_LABEL[state.densityModel];
  heroSupportBadge.textContent = SUPPORT_MODE_LABEL[state.supportMode];
  setInlineLatex(heroShellRadiusText, `r/R = ${formatFixed(state.shellRadiusFraction, 2)}`);

  const shellNarrativeHtml =
    state.supportMode === "balanced"
      ? "At the highlighted shell, the pressure-force difference matches the shell's local weight, so $F_{\\rm net}\\approx 0$. This is the local meaning of hydrostatic equilibrium."
      : `The global profile stays hydrostatic for reference, but the local shell patch applies only $${formatRatioLatex(supportFactor, 2)}$ of the required gradient. The patch now feels a net ${netDirection} force.`;
  setMathText(shellNarrative, shellNarrativeHtml);

  starShellView.innerHTML = renderHeroSvg(scenario, state);
  profilePlot.innerHTML = renderProfileSvg(scenario, state.profileKey, state.explorerMode);

  setInlineLatex(profileCurrentLabel, currentProfileMeta.quantityLabel);
  setInlineLatex(
    profileCurrentValue,
    formatProfileValueLatex(state.profileKey, currentProfileValue, state.showUnits)
  );
  setMathText(profileInterpretation, buildProfileInterpretation(scenario, state.profileKey));

  noticeModeTag.textContent = state.explorerMode === "student" ? "Student mode" : "Instructor mode";
  noticeTitle.textContent = guidedStep.noticeTitle;
  setMathText(noticeBody, guidedStep.noticeBody);
  if (stateBannerHtml) {
    stateBanner.hidden = false;
    setMathText(stateBanner, stateBannerHtml);
  } else {
    stateBanner.hidden = true;
  }
  noticeList.innerHTML = "";
  for (const item of buildNoticeItems(scenario, guidedStep.id)) {
    const listItem = document.createElement("li");
    setMathText(listItem, item);
    noticeList.appendChild(listItem);
  }

  setMathText(summaryChange, summaryCards.change);
  setMathText(summaryWhy, summaryCards.why);
  setMathText(summaryInfer, summaryCards.infer);
  setMathText(
    thermalBridgeNotice,
    `Exact law: $dP/dr=-\\rho g$. Global support scale: $P_c\\sim G M^2/R^4$. Ideal-gas bridge: $P\\sim \\rho k_B T/(\\mu m_p)$, so $T_c\\sim \\mu G M m_p/(k_B R)$.`
  );
  const synthesisPromptsCompleted = [
    state.synthesis.local.trim().length > 0,
    state.synthesis.global.trim().length > 0,
    state.synthesis.thermal.trim().length > 0
  ].filter(Boolean).length;
  setMathText(
    synthesisChecklist,
    synthesisPromptsCompleted === 3
      ? "Synthesis complete. You connected one local law, one global scale estimate, and one thermal bridge statement."
      : `Complete all three explanation boxes before leaving the synthesis step. Progress: ${synthesisPromptsCompleted}/3.`
  );

  if (state.explorerMode === "student") {
    readoutMassCard.hidden = !studentPresentation.showMassRadiusControls;
    readoutRadiusCard.hidden = !studentPresentation.showMassRadiusControls;
    readoutMeanDensityCard.hidden = guidedStep.id === "thermal-bridge" || guidedStep.id === "synthesis" ? true : !studentPresentation.showReadoutStrip;
    readoutGravityCard.hidden = guidedStep.id === "compactness";
    readoutCentralPressureCard.hidden = !studentPresentation.showReadoutStrip;
    readoutCoreTemperatureCard.hidden = !studentPresentation.showThermalBridge;
  } else {
    readoutMassCard.hidden = false;
    readoutRadiusCard.hidden = false;
    readoutMeanDensityCard.hidden = false;
    readoutGravityCard.hidden = false;
    readoutCentralPressureCard.hidden = false;
    readoutCoreTemperatureCard.hidden = false;
  }

  const enclosedMassSolar = HydrostaticEquilibriumModel.massGToSolarMass(
    scenario.shellPoint.enclosedMassG
  );
  const gravityNoticeHtml =
    state.explorerMode === "instructor"
      ? `At $r/R=${formatFixed(state.shellRadiusFraction, 2)}$, the shell encloses $${formatScientificLatex(enclosedMassSolar, 3)}\\,M_{\\odot}$ and feels $${scientificQuantityLatex(scenario.shellPoint.gravityCmPerS2, "{\\rm cm\\,s^{-2}}", true)}$. In spherical symmetry, only the mass inside the shell sets that local field.`
      : `The selected shell encloses $${formatScientificLatex(enclosedMassSolar, 3)}\\,M_{\\odot}$, so local gravity is $${scientificQuantityLatex(scenario.shellPoint.gravityCmPerS2, "{\\rm cm\\,s^{-2}}", true)}$. In spherical symmetry, the shell responds to the mass inside it, not to the whole star all at once.`;
  setMathText(gravityNotice, gravityNoticeHtml);

  const hydroNoticeHtml =
    state.supportMode === "balanced"
      ? `The required local gradient is $${scientificQuantityLatex(scenario.shellPoint.pressureGradientDynePerCm3, "{\\rm dyne\\,cm^{-3}}", true)}$. The negative sign in $dP/dr=-\\rho g$ means pressure must fall outward so the lower side of the shell pushes harder.`
      : `This patch applies $${formatRatioLatex(supportFactor, 2)}$ of the hydrostatic gradient, so $F_{\\rm net}$ points ${netDirection}. Large pressure alone is not enough; the shell needs the right pressure difference across its thickness.`;
  setMathText(hydroNotice, hydroNoticeHtml);

  const pressureScaleHtml = state.showNormalizedValues
    ? `The characteristic support scale is $P_c\\sim ${scientificQuantityLatex(scenario.centralPressureScaleDynePerCm2, "{\\rm dyne\\,cm^{-2}}", true)}$, which is $${formatSolarNormalizedLatex({
        value: scenario.centralPressureScaleDynePerCm2,
        solarValue: solarRefs.centralPressureScaleDynePerCm2,
        symbolLatex: "P_{c,\\odot}",
        digits: 2
      })}$. This is an order-of-magnitude central support requirement, not an exact law for every star. In this toy structure, the exact center is $${scientificQuantityLatex(scenario.centralPressureExactDynePerCm2, "{\\rm dyne\\,cm^{-2}}", true)}$, about $${formatRatioLatex(exactCenterToScale, 2)}$ times the scale estimate.`
    : `The characteristic support scale is $P_c\\sim ${scientificQuantityLatex(scenario.centralPressureScaleDynePerCm2, "{\\rm dyne\\,cm^{-2}}", true)}$. This is an order-of-magnitude central support requirement, while the exact toy-model center is $${scientificQuantityLatex(scenario.centralPressureExactDynePerCm2, "{\\rm dyne\\,cm^{-2}}", true)}$.`;
  setMathText(pressureScaleNotice, pressureScaleHtml);

  const temperatureHtml = state.showNormalizedValues
    ? `If ideal-gas pressure supplies the support, the required thermal scale is roughly $T_c\\sim ${formatKelvinOrMegaKelvinLatex(scenario.coreTemperatureScaleK)}$, or $${formatSolarNormalizedLatex({
        value: scenario.coreTemperatureScaleK,
        solarValue: solarRefs.coreTemperatureScaleK,
        symbolLatex: "T_{c,\\odot}",
        digits: 2
      })}$. Changing $\\mu$ rescales this bridge directly.`
    : `If ideal-gas pressure supplies the support, the required thermal scale is roughly $T_c\\sim ${formatKelvinOrMegaKelvinLatex(scenario.coreTemperatureScaleK)}$. This is a scaling argument, not a full stellar model prediction.`;
  setMathText(temperatureNotice, temperatureHtml);

  setMathText(
    ladderGravityText,
    `At the selected shell, $M(r)$ is $${formatScientificLatex(enclosedMassSolar, 3)}\\,M_{\\odot}$, so gravity follows from the enclosed mass.`
  );
  setMathText(
    ladderHydroText,
    "Hydrostatic equilibrium requires $dP/dr=-\\rho g$, so pressure must be larger deeper inside the star."
  );
  setMathText(
    ladderPressureText,
    `The characteristic pressure scale for this configuration is about $${formatRatioLatex(pressureScaleToSolar, 2)}$ times the Sun's.`
  );
  setMathText(
    ladderGasText,
    `With $\\mu=${formatFixed(state.meanMolecularWeightMu, 2)}$, the ideal-gas bridge turns the pressure requirement into a thermal requirement.`
  );
  setMathText(
    ladderTemperatureText,
    `If ideal-gas pressure supplies the support, the required thermal scale is $T_c\\sim ${formatKelvinOrMegaKelvinLatex(scenario.coreTemperatureScaleK)}$.`
  );

  readoutUnitLabels.forEach((unit) => {
    unit.hidden = !state.showUnits;
  });

  setMarkup(
    readoutMass,
    buildReadoutMarkup(formatMassLatex(state.massSolarMass, false), null)
  );
  setMarkup(
    readoutRadius,
    buildReadoutMarkup(formatRadiusLatex(state.radiusSolarRadius, false), null)
  );
  setMarkup(
    readoutMeanDensity,
    buildReadoutMarkup(
      scientificQuantityLatex(scenario.meanDensityGPerCm3, "{\\rm g\\,cm^{-3}}", false),
      state.showNormalizedValues
        ? formatSolarNormalizedLatex({
            value: scenario.meanDensityGPerCm3,
            solarValue: scenario.meanDensityGPerCm3 / densityToSolar,
            symbolLatex: "\\bar{\\rho}_{\\odot}",
            digits: 2
          })
        : null
    )
  );
  setMarkup(
    readoutGravity,
    buildReadoutMarkup(
      scientificQuantityLatex(
        scenario.shellPoint.gravityCmPerS2,
        "{\\rm cm\\,s^{-2}}",
        false
      ),
      state.showNormalizedValues ? `r/R=${formatFixed(state.shellRadiusFraction, 2)}\\ \\text{shell}` : null
    )
  );
  setMarkup(
    readoutCentralPressure,
    buildReadoutMarkup(
      scientificQuantityLatex(
        scenario.centralPressureExactDynePerCm2,
        "{\\rm dyne\\,cm^{-2}}",
        false
      ),
      state.showNormalizedValues
        ? formatSolarNormalizedLatex({
            value: scenario.centralPressureScaleDynePerCm2,
            solarValue: solarRefs.centralPressureScaleDynePerCm2,
            symbolLatex: "P_{c,\\odot}",
            digits: 2
          })
        : null
    )
  );
  setMarkup(
    readoutCoreTemperature,
    buildReadoutMarkup(
      formatTemperatureLatex(scenario.coreTemperatureScaleK, false),
      state.showNormalizedValues
        ? formatSolarNormalizedLatex({
            value: scenario.coreTemperatureScaleK,
            solarValue: solarRefs.coreTemperatureScaleK,
            symbolLatex: "T_{c,\\odot}",
            digits: 2
          })
        : null
    )
  );

  for (const details of derivationToggles) {
    details.hidden = !state.showDerivations;
  }

  renderChallengePanel();
}

function exportResults(): ExportPayloadV1 {
  const scenario = buildHydrostaticScenario(currentPresetFromState(state));
  const profileMeta = profileTabMeta(state.profileKey);
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: HYDROSTATIC_PRESETS[state.presetId].label },
      { name: "Mass", value: `${formatFixed(state.massSolarMass, 2)} M_sun` },
      { name: "Radius", value: `${formatFixed(state.radiusSolarRadius, 2)} R_sun` },
      { name: "Shell radius", value: `${formatFixed(state.shellRadiusFraction, 2)} R` },
      { name: "Density model", value: DENSITY_MODEL_LABEL[state.densityModel] },
      { name: "Local shell state", value: SUPPORT_MODE_LABEL[state.supportMode] },
      { name: "Mean molecular weight", value: formatFixed(state.meanMolecularWeightMu, 2) }
    ],
    readouts: [
      {
        name: "Mean density",
        value: `${formatScientificLatex(scenario.meanDensityGPerCm3, 3)} g cm^-3`
      },
      {
        name: "Local gravity",
        value: `${formatScientificLatex(scenario.shellPoint.gravityCmPerS2, 3)} cm s^-2`
      },
      {
        name: "Selected profile",
        value: `${profileMeta.label}: ${formatProfileValueLatex(state.profileKey, profileValueForKey(scenario.shellPoint, state.profileKey), true)}`
      },
      {
        name: "Central pressure scale",
        value: `${formatScientificLatex(scenario.centralPressureScaleDynePerCm2, 3)} dyne cm^-2`
      },
      {
        name: "Exact central pressure",
        value: `${formatScientificLatex(scenario.centralPressureExactDynePerCm2, 3)} dyne cm^-2`
      },
      {
        name: "Core-temperature scale",
        value: formatKelvinOrMegaKelvinLatex(scenario.coreTemperatureScaleK)
      }
    ],
    notes: [
      "Toy models use CGS internally and teach hydrostatic logic, not full stellar evolution.",
      "Under-supported and over-supported modes perturb only the local shell patch; the radial profiles remain hydrostatic."
    ]
  };
}

function restartChallengeDeck(): void {
  challengeEngine.reset();
  challengeEngine.start();
}

function bindEvents(): void {
  demoModes.bindButtons({
    helpButton,
    stationButton: stationModeButton
  });

  copyResultsButton.addEventListener("click", () => {
    setLiveRegionText(statusEl, "Copying results...");
    void runtime
      .copyResults(exportResults())
      .then(() => setLiveRegionText(statusEl, "Copied results to clipboard."))
      .catch((error) =>
        setLiveRegionText(
          statusEl,
          error instanceof Error ? `Copy failed: ${error.message}` : "Copy failed."
        )
      );
  });

  for (const [presetId, button] of Object.entries(presetButtons) as Array<[HydrostaticPresetId, HTMLButtonElement]>) {
    button.addEventListener("click", () => applyPreset(presetId));
  }

  massSlider.addEventListener("input", () => {
    state.massSolarMass = clamp(Number(massSlider.value), 0.1, 30);
    render();
  });

  radiusSlider.addEventListener("input", () => {
    state.radiusSolarRadius = clamp(Number(radiusSlider.value), 0.1, 20);
    render();
  });

  shellRadiusSlider.addEventListener("input", () => {
    state.shellRadiusFraction = clamp(Number(shellRadiusSlider.value) / 100, 0, 1);
    render();
  });

  muSlider.addEventListener("input", () => {
    state.meanMolecularWeightMu = clamp(Number(muSlider.value), 0.5, 1.35);
    render();
  });

  densityModelUniform.addEventListener("click", () => {
    state.densityModel = "uniform";
    render();
  });

  densityModelCentral.addEventListener("click", () => {
    state.densityModel = "central-toy";
    render();
  });

  supportModeBalanced.addEventListener("click", () => {
    state.supportMode = "balanced";
    render();
  });

  supportModeUnder.addEventListener("click", () => {
    state.supportMode = "under-supported";
    render();
  });

  supportModeOver.addEventListener("click", () => {
    state.supportMode = "over-supported";
    render();
  });

  modeStudent.addEventListener("click", () => {
    state.explorerMode = "student";
    state.profileKey = currentGuidedStep(state.guidedStepId).focusProfileKey;
    render();
  });

  modeInstructor.addEventListener("click", () => {
    state.explorerMode = "instructor";
    render();
  });

  toggleUnits.addEventListener("change", () => {
    state.showUnits = toggleUnits.checked;
    render();
  });

  toggleNormalized.addEventListener("change", () => {
    state.showNormalizedValues = toggleNormalized.checked;
    render();
  });

  toggleDerivation.addEventListener("change", () => {
    state.showDerivations = toggleDerivation.checked;
    render();
  });

  for (const button of profileButtons) {
    button.addEventListener("click", () => {
      const profileKey = button.dataset.profileKey;
      if (!isProfileKey(profileKey)) return;
      state.profileKey = profileKey;
      render();
    });
  }

  checkChallengeButton.addEventListener("click", () => {
    if (!challengeEngine.isActive() || state.challenge.completed) return;
    if (!state.challenge.selectedChoiceId) {
      setChallengeFeedback(
        "Pick an answer first. Use the shell view or the current profile before checking.",
        "incorrect"
      );
      renderChallengePanel();
      setLiveRegionText(statusEl, "Pick an answer before checking.");
      return;
    }
    challengeEngine.check(state.challenge.selectedChoiceId);
  });

  predictionUp.addEventListener("click", () => {
    state.predictionChoiceId = "up";
    state.predictionFeedbackHtml = null;
    state.predictionChecked = false;
    render();
  });

  predictionDown.addEventListener("click", () => {
    state.predictionChoiceId = "down";
    state.predictionFeedbackHtml = null;
    state.predictionChecked = false;
    render();
  });

  predictionSame.addEventListener("click", () => {
    state.predictionChoiceId = "same";
    state.predictionFeedbackHtml = null;
    state.predictionChecked = false;
    render();
  });

  checkPredictionButton.addEventListener("click", () => {
    state.predictionFeedbackHtml = buildPredictionFeedback(state.predictionChoiceId);
    state.predictionChecked = state.predictionChoiceId !== null;
    render();
    setLiveRegionText(
      statusEl,
      state.predictionChoiceId === PREDICTION_CHALLENGE.correctChoiceId
        ? "Prediction checked. Compactness raises the required pressure scale."
        : "Prediction checked. Revisit the compactness scaling."
    );
  });

  taskPrev.addEventListener("click", () => shiftGuidedStep(-1));
  taskPrevAlt.addEventListener("click", () => shiftGuidedStep(-1));
  taskNext.addEventListener("click", () => shiftGuidedStep(1));
  taskNextAlt.addEventListener("click", () => shiftGuidedStep(1));

  nextChallengeButton.addEventListener("click", () => {
    if (state.challenge.completed) {
      restartChallengeDeck();
      return;
    }
    if (state.challenge.awaitingAdvance) return;
    challengeEngine.skip();
    render();
  });

  challengeHintButton.addEventListener("click", () => {
    if (!challengeEngine.isActive() || state.challenge.completed) return;
    const hint = challengeEngine.getHint();
    if (!hint) {
      setLiveRegionText(statusEl, "No more hints for this checkpoint.");
      return;
    }
    state.challenge.hintText = hint;
    renderChallengePanel();
    setLiveRegionText(statusEl, "Hint revealed.");
  });

  synthesisLocal.addEventListener("input", () => {
    state.synthesis.local = synthesisLocal.value;
    render();
  });

  synthesisGlobal.addEventListener("input", () => {
    state.synthesis.global = synthesisGlobal.value;
    render();
  });

  synthesisThermal.addEventListener("input", () => {
    state.synthesis.thermal = synthesisThermal.value;
    render();
  });
}

bindEvents();

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) initStarfield({ canvas: starfieldCanvas });

initMath(document);
initPopovers(demoRoot);
initTabs(demoRoot);

challengeEngine.start();
render();
