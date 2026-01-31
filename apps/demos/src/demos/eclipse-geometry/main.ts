import { EclipseGeometryModel } from "@cosmic/physics";
import { ChallengeEngine, createDemoModes } from "@cosmic/runtime";
import type { Challenge } from "@cosmic/runtime";

const setNewMoonEl = document.querySelector<HTMLButtonElement>("#setNewMoon");
const setFullMoonEl = document.querySelector<HTMLButtonElement>("#setFullMoon");

const moonLonEl = document.querySelector<HTMLInputElement>("#moonLon");
const moonLonValueEl = document.querySelector<HTMLSpanElement>("#moonLonValue");
const nodeLonEl = document.querySelector<HTMLInputElement>("#nodeLon");
const nodeLonValueEl = document.querySelector<HTMLSpanElement>("#nodeLonValue");
const tiltEl = document.querySelector<HTMLInputElement>("#tilt");
const tiltValueEl = document.querySelector<HTMLSpanElement>("#tiltValue");
const distancePresetEl =
  document.querySelector<HTMLSelectElement>("#distancePreset");
const distanceValueEl =
  document.querySelector<HTMLSpanElement>("#distanceValue");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const challengeModeEl =
  document.querySelector<HTMLButtonElement>("#challengeMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");
const controlsBodyEl = document.querySelector<HTMLElement>(
  ".cp-demo__controls .cp-panel-body"
);

const phaseLabelEl = document.querySelector<HTMLSpanElement>("#phaseLabel");
const phaseAngleEl = document.querySelector<HTMLSpanElement>("#phaseAngle");
const absBetaEl = document.querySelector<HTMLSpanElement>("#absBeta");
const nearestNodeEl = document.querySelector<HTMLSpanElement>("#nearestNode");
const solarOutcomeEl = document.querySelector<HTMLSpanElement>("#solarOutcome");
const lunarOutcomeEl = document.querySelector<HTMLSpanElement>("#lunarOutcome");

const moonDotEl = document.querySelector<SVGCircleElement>("#moonDot");
const betaLineEl = document.querySelector<SVGLineElement>("#betaLine");
const ascNodeDotEl = document.querySelector<SVGCircleElement>("#ascNodeDot");
const descNodeDotEl = document.querySelector<SVGCircleElement>("#descNodeDot");
const ascNodeLabelEl = document.querySelector<SVGTextElement>("#ascNodeLabel");
const descNodeLabelEl =
  document.querySelector<SVGTextElement>("#descNodeLabel");
const betaMarkerEl = document.querySelector<SVGCircleElement>("#betaMarker");
const betaLabelEl = document.querySelector<SVGTextElement>("#betaLabel");

if (
  !setNewMoonEl ||
  !setFullMoonEl ||
  !moonLonEl ||
  !moonLonValueEl ||
  !nodeLonEl ||
  !nodeLonValueEl ||
  !tiltEl ||
  !tiltValueEl ||
  !distancePresetEl ||
  !distanceValueEl ||
  !stationModeEl ||
  !challengeModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !controlsBodyEl ||
  !phaseLabelEl ||
  !phaseAngleEl ||
  !absBetaEl ||
  !nearestNodeEl ||
  !solarOutcomeEl ||
  !lunarOutcomeEl ||
  !moonDotEl ||
  !betaLineEl ||
  !ascNodeDotEl ||
  !descNodeDotEl ||
  !ascNodeLabelEl ||
  !descNodeLabelEl ||
  !betaMarkerEl ||
  !betaLabelEl
) {
  throw new Error("Missing required DOM elements for eclipse-geometry demo.");
}

const setNewMoon = setNewMoonEl;
const setFullMoon = setFullMoonEl;
const moonLon = moonLonEl;
const moonLonValue = moonLonValueEl;
const nodeLon = nodeLonEl;
const nodeLonValue = nodeLonValueEl;
const tilt = tiltEl;
const tiltValue = tiltValueEl;
const distancePreset = distancePresetEl;
const distanceValue = distanceValueEl;

const stationMode = stationModeEl;
const challengeMode = challengeModeEl;
const help = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;
const controlsBody = controlsBodyEl;

const phaseLabel = phaseLabelEl;
const phaseAngle = phaseAngleEl;
const absBeta = absBetaEl;
const nearestNode = nearestNodeEl;
const solarOutcome = solarOutcomeEl;
const lunarOutcome = lunarOutcomeEl;

const moonDot = moonDotEl;
const betaLine = betaLineEl;
const ascNodeDot = ascNodeDotEl;
const descNodeDot = descNodeDotEl;
const ascNodeLabel = ascNodeLabelEl;
const descNodeLabel = descNodeLabelEl;
const betaMarker = betaMarkerEl;
const betaLabel = betaLabelEl;

stationMode.disabled = true;
challengeMode.disabled = true;
help.disabled = true;
copyResults.disabled = true;

const SYZYGY_TOLERANCE_DEG = 5;

const DISTANCE_PRESETS_KM = {
  perigee: 363300,
  mean: 384400,
  apogee: 405500
} as const;

type DistancePresetKey = keyof typeof DISTANCE_PRESETS_KM;

type State = {
  sunLonDeg: number;
  moonLonDeg: number;
  nodeLonDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  distancePresetKey: DistancePresetKey;
};

const state: State = {
  sunLonDeg: 0,
  moonLonDeg: 180,
  nodeLonDeg: 210,
  orbitalTiltDeg: 5.145,
  earthMoonDistanceKm: DISTANCE_PRESETS_KM.mean,
  distancePresetKey: "mean"
};

type EclipseDemoState = {
  moonLonDeg: number;
  sunLonDeg: number;
  nodeLonDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  phaseAngleDeg: number;
  betaDeg: number;
  absBetaDeg: number;
  nearestNodeDeg: number;
  solarType: "none" | "partial-solar" | "annular-solar" | "total-solar";
  lunarType: "none" | "penumbral-lunar" | "partial-lunar" | "total-lunar";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number, digits: number) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function phaseInfo(phaseAngleDeg: number): {
  label: string;
  isNew: boolean;
  isFull: boolean;
} {
  const dNew = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 0);
  const dFull = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 180);
  const dFirst = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 90);
  const dThird = EclipseGeometryModel.angularSeparationDeg(phaseAngleDeg, 270);

  if (dNew <= 10) return { label: "New Moon", isNew: true, isFull: false };
  if (dFull <= 10) return { label: "Full Moon", isNew: false, isFull: true };
  if (dFirst <= 10) return { label: "First quarter", isNew: false, isFull: false };
  if (dThird <= 10) return { label: "Third quarter", isNew: false, isFull: false };

  const norm = EclipseGeometryModel.normalizeAngleDeg(phaseAngleDeg);
  if (norm > 0 && norm < 180) {
    return {
      label: norm < 90 ? "Waxing crescent" : "Waxing gibbous",
      isNew: false,
      isFull: false
    };
  }
  return {
    label: norm > 180 && norm < 270 ? "Waning gibbous" : "Waning crescent",
    isNew: false,
    isFull: false
  };
}

function computeDerived(args: {
  sunLonDeg: number;
  moonLonDeg: number;
  nodeLonDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
}): EclipseDemoState {
  const phaseAngleDegValue = EclipseGeometryModel.phaseAngleDeg({
    moonLonDeg: args.moonLonDeg,
    sunLonDeg: args.sunLonDeg
  });

  const betaDeg = EclipseGeometryModel.eclipticLatitudeDeg({
    tiltDeg: args.orbitalTiltDeg,
    moonLonDeg: args.moonLonDeg,
    nodeLonDeg: args.nodeLonDeg
  });

  const absBetaDegValue = Math.abs(betaDeg);
  const nearestNodeDeg = EclipseGeometryModel.nearestNodeDistanceDeg({
    moonLonDeg: args.moonLonDeg,
    nodeLonDeg: args.nodeLonDeg
  });

  const isNewSyzygy =
    EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 0) <=
    SYZYGY_TOLERANCE_DEG;
  const isFullSyzygy =
    EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 180) <=
    SYZYGY_TOLERANCE_DEG;

  const solarType = isNewSyzygy
    ? EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
        betaDeg,
        earthMoonDistanceKm: args.earthMoonDistanceKm
      }).type
    : "none";

  const lunarType = isFullSyzygy
    ? EclipseGeometryModel.lunarEclipseTypeFromBetaDeg({
        betaDeg,
        earthMoonDistanceKm: args.earthMoonDistanceKm
      }).type
    : "none";

  return {
    moonLonDeg: args.moonLonDeg,
    sunLonDeg: args.sunLonDeg,
    nodeLonDeg: args.nodeLonDeg,
    orbitalTiltDeg: args.orbitalTiltDeg,
    earthMoonDistanceKm: args.earthMoonDistanceKm,
    phaseAngleDeg: phaseAngleDegValue,
    betaDeg,
    absBetaDeg: absBetaDegValue,
    nearestNodeDeg,
    solarType,
    lunarType
  };
}

function outcomeLabel(type: string): string {
  if (type === "none") return "None";
  if (type === "partial-solar") return "Partial solar";
  if (type === "annular-solar") return "Annular solar";
  if (type === "total-solar") return "Total solar";
  if (type === "penumbral-lunar") return "Penumbral lunar";
  if (type === "partial-lunar") return "Partial lunar";
  if (type === "total-lunar") return "Total lunar";
  return type;
}

function populateDistancePresets() {
  distancePreset.innerHTML = "";
  const entries: Array<{ key: DistancePresetKey; label: string; valueKm: number }> = [
    { key: "perigee", label: "Perigee", valueKm: DISTANCE_PRESETS_KM.perigee },
    { key: "mean", label: "Mean", valueKm: DISTANCE_PRESETS_KM.mean },
    { key: "apogee", label: "Apogee", valueKm: DISTANCE_PRESETS_KM.apogee }
  ];
  for (const entry of entries) {
    const opt = document.createElement("option");
    opt.value = entry.key;
    opt.textContent = `${entry.label} (${entry.valueKm.toLocaleString()} km)`;
    distancePreset.appendChild(opt);
  }
  distancePreset.value = state.distancePresetKey;
}

function renderStage(args: {
  moonLonDeg: number;
  nodeLonDeg: number;
  betaDeg: number;
}) {
  // Orbit geometry in local panel coords (see index.html transform translate(220,180)).
  const cx = 0;
  const cy = 0;
  const r = 140;

  const moonAngle = (Math.PI / 180) * args.moonLonDeg;
  const mx = cx + r * Math.cos(moonAngle);
  const my = cy + r * Math.sin(moonAngle);
  moonDot.setAttribute("cx", formatNumber(mx, 2));
  moonDot.setAttribute("cy", formatNumber(my, 2));

  // Node markers
  const ascAngle = (Math.PI / 180) * args.nodeLonDeg;
  const dx = cx + r * Math.cos(ascAngle);
  const dy = cy + r * Math.sin(ascAngle);
  ascNodeDot.setAttribute("cx", formatNumber(dx, 2));
  ascNodeDot.setAttribute("cy", formatNumber(dy, 2));

  const descAngle = (Math.PI / 180) * (args.nodeLonDeg + 180);
  const ex = cx + r * Math.cos(descAngle);
  const ey = cy + r * Math.sin(descAngle);
  descNodeDot.setAttribute("cx", formatNumber(ex, 2));
  descNodeDot.setAttribute("cy", formatNumber(ey, 2));

  ascNodeLabel.textContent = `Ω ≈ ${Math.round(EclipseGeometryModel.normalizeAngleDeg(args.nodeLonDeg))}°`;
  descNodeLabel.textContent = `Ω+180 ≈ ${Math.round(EclipseGeometryModel.normalizeAngleDeg(args.nodeLonDeg + 180))}°`;

  // β indicator: draw a short line "out of plane" near the Moon point.
  const betaScalePxPerDeg = 10;
  const by = my - clamp(args.betaDeg, -10, 10) * betaScalePxPerDeg;
  betaLine.setAttribute("x1", formatNumber(mx, 2));
  betaLine.setAttribute("y1", formatNumber(my, 2));
  betaLine.setAttribute("x2", formatNumber(mx, 2));
  betaLine.setAttribute("y2", formatNumber(by, 2));

  // β panel marker: y = -beta
  const betaPanelScale = 12;
  const y = clamp(-args.betaDeg * betaPanelScale, -140, 140);
  betaMarker.setAttribute("cy", formatNumber(y, 2));
  betaLabel.textContent = `β ≈ ${formatNumber(args.betaDeg, 2)}°`;
}

function render() {
  const moonLonDeg = clamp(Number(moonLon.value), 0, 360);
  const nodeLonDeg = clamp(Number(nodeLon.value), 0, 360);
  const orbitalTiltDeg = clamp(Number(tilt.value), 0, 10);
  const presetKey = distancePreset.value as DistancePresetKey;

  state.moonLonDeg = moonLonDeg;
  state.nodeLonDeg = nodeLonDeg;
  state.orbitalTiltDeg = orbitalTiltDeg;
  state.distancePresetKey = presetKey;
  state.earthMoonDistanceKm = DISTANCE_PRESETS_KM[presetKey] ?? DISTANCE_PRESETS_KM.mean;

  const derived = computeDerived({
    sunLonDeg: state.sunLonDeg,
    moonLonDeg: state.moonLonDeg,
    nodeLonDeg: state.nodeLonDeg,
    orbitalTiltDeg: state.orbitalTiltDeg,
    earthMoonDistanceKm: state.earthMoonDistanceKm
  });

  const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
    earthMoonDistanceKm: state.earthMoonDistanceKm
  });

  const phase = phaseInfo(derived.phaseAngleDeg);

  moonLonValue.textContent = `${Math.round(moonLonDeg)}°`;
  nodeLonValue.textContent = `${Math.round(nodeLonDeg)}°`;
  tiltValue.textContent = `${formatNumber(orbitalTiltDeg, 3)}°`;
  distanceValue.textContent = `${state.earthMoonDistanceKm.toLocaleString()} km`;

  phaseLabel.textContent = phase.label;
  phaseAngle.textContent = `${formatNumber(derived.phaseAngleDeg, 1)}°`;
  absBeta.textContent = `${formatNumber(derived.absBetaDeg, 3)}°`;
  nearestNode.textContent = `${formatNumber(derived.nearestNodeDeg, 2)}°`;

  solarOutcome.textContent = outcomeLabel(derived.solarType);
  lunarOutcome.textContent = outcomeLabel(derived.lunarType);

  renderStage({ moonLonDeg, nodeLonDeg, betaDeg: derived.betaDeg });

  status.textContent = `Thresholds (mean-distance example): solar partial ≈ ${formatNumber(thresholds.solarPartialDeg, 2)}°, solar central ≈ ${formatNumber(thresholds.solarCentralDeg, 2)}°`;
}

function getState(): EclipseDemoState {
  return computeDerived({
    sunLonDeg: state.sunLonDeg,
    moonLonDeg: state.moonLonDeg,
    nodeLonDeg: state.nodeLonDeg,
    orbitalTiltDeg: state.orbitalTiltDeg,
    earthMoonDistanceKm: state.earthMoonDistanceKm
  });
}

function setState(next: unknown): void {
  if (!next || typeof next !== "object") return;
  const obj = next as Partial<EclipseDemoState> & { distancePresetKey?: DistancePresetKey };

  if (Number.isFinite(obj.moonLonDeg)) moonLon.value = String(clamp(obj.moonLonDeg as number, 0, 360));
  if (Number.isFinite(obj.nodeLonDeg)) nodeLon.value = String(clamp(obj.nodeLonDeg as number, 0, 360));
  if (Number.isFinite(obj.orbitalTiltDeg)) tilt.value = String(clamp(obj.orbitalTiltDeg as number, 0, 10));

  if (obj.distancePresetKey && obj.distancePresetKey in DISTANCE_PRESETS_KM) {
    distancePreset.value = obj.distancePresetKey;
  } else if (Number.isFinite(obj.earthMoonDistanceKm)) {
    // Snap to nearest preset for simplicity.
    const target = obj.earthMoonDistanceKm as number;
    const entries: Array<[DistancePresetKey, number]> = [
      ["perigee", DISTANCE_PRESETS_KM.perigee],
      ["mean", DISTANCE_PRESETS_KM.mean],
      ["apogee", DISTANCE_PRESETS_KM.apogee]
    ];
    const nearest = entries.reduce(
      (best, entry) => (Math.abs(entry[1] - target) < Math.abs(best[1] - target) ? entry : best),
      entries[0]
    );
    distancePreset.value = nearest[0];
  }

  render();
}

function buildStationRow(args: {
  label: string;
  phaseLabel: string;
  phaseAngleDeg: number;
  absBetaDeg: number;
  nearestNodeDeg: number;
  orbitalTiltDeg: number;
  earthMoonDistanceKm: number;
  outcome: string;
}) {
  return {
    case: args.label,
    phase: args.phaseLabel,
    phaseAngleDeg: formatNumber(args.phaseAngleDeg, 1),
    absBetaDeg: formatNumber(args.absBetaDeg, 3),
    nearestNodeDeg: formatNumber(args.nearestNodeDeg, 2),
    tiltDeg: formatNumber(args.orbitalTiltDeg, 3),
    earthMoonDistanceKm: String(Math.round(args.earthMoonDistanceKm)),
    outcome: args.outcome
  };
}

stationMode.disabled = false;
help.disabled = false;

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
        heading: "How to use",
        type: "bullets",
        items: [
          "Use New/Full buttons to set phase, then adjust node longitude Ω and tilt i.",
          "Eclipses require syzygy (New/Full) and |β| small enough for the chosen Earth–Moon distance."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Eclipse Geometry",
    subtitle: "Record phase, node proximity, and eclipse outcomes",
    columns: [
      { key: "case", label: "Case" },
      { key: "phase", label: "Phase" },
      { key: "phaseAngleDeg", label: "Δ (deg)" },
      { key: "absBetaDeg", label: "|β| (deg)" },
      { key: "nearestNodeDeg", label: "Nearest node (deg)" },
      { key: "tiltDeg", label: "Tilt i (deg)" },
      { key: "earthMoonDistanceKm", label: "Earth–Moon distance (km)" },
      { key: "outcome", label: "Outcome" }
    ],
    getSnapshotRow: () => {
      const phaseAngleDegValue = EclipseGeometryModel.phaseAngleDeg({
        moonLonDeg: state.moonLonDeg,
        sunLonDeg: state.sunLonDeg
      });
      const betaDeg = EclipseGeometryModel.eclipticLatitudeDeg({
        tiltDeg: state.orbitalTiltDeg,
        moonLonDeg: state.moonLonDeg,
        nodeLonDeg: state.nodeLonDeg
      });
      const absBetaDegValue = Math.abs(betaDeg);
      const nearestNodeDeg = EclipseGeometryModel.nearestNodeDistanceDeg({
        moonLonDeg: state.moonLonDeg,
        nodeLonDeg: state.nodeLonDeg
      });

      const phase = phaseInfo(phaseAngleDegValue);
      const isNewSyzygy =
        EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 0) <=
        SYZYGY_TOLERANCE_DEG;
      const isFullSyzygy =
        EclipseGeometryModel.angularSeparationDeg(phaseAngleDegValue, 180) <=
        SYZYGY_TOLERANCE_DEG;

      const solarType = isNewSyzygy
        ? EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
            betaDeg,
            earthMoonDistanceKm: state.earthMoonDistanceKm
          }).type
        : "none";

      const lunarType = isFullSyzygy
        ? EclipseGeometryModel.lunarEclipseTypeFromBetaDeg({
            betaDeg,
            earthMoonDistanceKm: state.earthMoonDistanceKm
          }).type
        : "none";

      const outcome =
        solarType !== "none"
          ? outcomeLabel(solarType)
          : lunarType !== "none"
            ? outcomeLabel(lunarType)
            : "None";

      return buildStationRow({
        label: phase.label,
        phaseLabel: phase.label,
        phaseAngleDeg: phaseAngleDegValue,
        absBetaDeg: absBetaDegValue,
        nearestNodeDeg,
        orbitalTiltDeg: state.orbitalTiltDeg,
        earthMoonDistanceKm: state.earthMoonDistanceKm,
        outcome
      });
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add 4-case template (blank)",
        getRows: () => [
          {
            case: "New (far)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          },
          {
            case: "New (near)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          },
          {
            case: "Full (far)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          },
          {
            case: "Full (near)",
            phase: "",
            phaseAngleDeg: "",
            absBetaDeg: "",
            nearestNodeDeg: "",
            tiltDeg: "",
            earthMoonDistanceKm: "",
            outcome: ""
          }
        ]
      }
    ]
  }
});

demoModes.bindButtons({
  helpButton: help,
  stationButton: stationMode
});

const challenges: Challenge[] = [
  {
    type: "custom",
    prompt: "Achieve a solar eclipse (New Moon and |β| small enough).",
    initialState: {
      moonLonDeg: 12,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Click “New Moon” (or get phase angle Δ close to 0°).",
      "Then adjust node longitude Ω so the Moon is near a node (|β| decreases)."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const delta = Number(st.phaseAngleDeg);
      const absBetaDeg = Number(st.absBetaDeg);
      const distanceKm = Number(st.earthMoonDistanceKm);
      const solarType = st.solarType;

      if (![delta, absBetaDeg, distanceKm].every(Number.isFinite) || !solarType) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      const thresholds = EclipseGeometryModel.eclipseThresholdsDeg({
        earthMoonDistanceKm: distanceKm
      });

      const isNewSyzygy =
        EclipseGeometryModel.angularSeparationDeg(delta, 0) <= SYZYGY_TOLERANCE_DEG;
      if (!isNewSyzygy) {
        return {
          correct: false,
          close: EclipseGeometryModel.angularSeparationDeg(delta, 0) <= 2 * SYZYGY_TOLERANCE_DEG,
          message: `Not yet: get New Moon (Δ within ${SYZYGY_TOLERANCE_DEG}° of 0°).`
        };
      }

      if (solarType !== "none") {
        return {
          correct: true,
          close: true,
          message: `Nice: ${outcomeLabel(solarType)} (|β|=${absBetaDeg.toFixed(3)}°)`
        };
      }

      const target = thresholds.solarPartialDeg;
      return {
        correct: false,
        close: absBetaDeg <= target * 1.2,
        message: `Close, but no eclipse: try reducing |β| below ~${target.toFixed(2)}° (for this distance).`
      };
    }
  },
  {
    type: "custom",
    prompt: "Achieve a lunar eclipse (Full Moon and lunar outcome ≠ none).",
    initialState: {
      moonLonDeg: 192,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Click “Full Moon” (or get phase angle Δ close to 180°).",
      "Then adjust Ω so the Moon is near a node (|β| decreases)."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const delta = Number(st.phaseAngleDeg);
      const absBetaDeg = Number(st.absBetaDeg);
      const lunarType = st.lunarType;

      if (![delta, absBetaDeg].every(Number.isFinite) || !lunarType) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      const isFullSyzygy =
        EclipseGeometryModel.angularSeparationDeg(delta, 180) <= SYZYGY_TOLERANCE_DEG;
      if (!isFullSyzygy) {
        return {
          correct: false,
          close:
            EclipseGeometryModel.angularSeparationDeg(delta, 180) <= 2 * SYZYGY_TOLERANCE_DEG,
          message: `Not yet: get Full Moon (Δ within ${SYZYGY_TOLERANCE_DEG}° of 180°).`
        };
      }

      if (lunarType !== "none") {
        return {
          correct: true,
          close: true,
          message: `Nice: ${outcomeLabel(lunarType)} (|β|=${absBetaDeg.toFixed(3)}°)`
        };
      }

      return {
        correct: false,
        close: absBetaDeg <= 1.5,
        message: "Close, but no eclipse: try bringing the Moon closer to a node (smaller |β|)."
      };
    }
  },
  {
    type: "custom",
    prompt: "Show “monthly eclipses” if i = 0°: make tilt 0° so New and Full both produce eclipses.",
    initialState: {
      moonLonDeg: 180,
      nodeLonDeg: 210,
      orbitalTiltDeg: 5.145,
      distancePresetKey: "mean"
    },
    hints: [
      "Set orbital tilt i to 0°.",
      "Then check New and Full: with i=0°, β stays at 0° so eclipses are always possible at syzygy."
    ],
    check: (s: unknown) => {
      const st = s as Partial<EclipseDemoState>;
      const tiltDeg = Number(st.orbitalTiltDeg);
      const distanceKm = Number(st.earthMoonDistanceKm);
      if (![tiltDeg, distanceKm].every(Number.isFinite)) {
        return { correct: false, close: false, message: "State is not finite." };
      }

      if (tiltDeg > 0.1) {
        return {
          correct: false,
          close: tiltDeg <= 0.5,
          message: `Not yet: set i very close to 0° (currently ${tiltDeg.toFixed(3)}°).`
        };
      }

      const solar = EclipseGeometryModel.solarEclipseTypeFromBetaDeg({
        betaDeg: 0,
        earthMoonDistanceKm: distanceKm
      }).type;
      const lunar = EclipseGeometryModel.lunarEclipseTypeFromBetaDeg({
        betaDeg: 0,
        earthMoonDistanceKm: distanceKm
      }).type;

      if (solar !== "none" && lunar !== "none") {
        return {
          correct: true,
          close: true,
          message: `Nice: at i≈0°, New → ${outcomeLabel(solar)} and Full → ${outcomeLabel(lunar)}`
        };
      }

      return { correct: false, close: false, message: "Unexpected: eclipse types were none at β=0." };
    }
  }
];

const challengeEngine = new ChallengeEngine(challenges, {
  container: controlsBody,
  showUI: true,
  getState,
  setState
});

challengeMode.disabled = false;
challengeMode.addEventListener("click", () => {
  if (challengeEngine.isActive()) {
    challengeEngine.stop();
  } else {
    render();
    challengeEngine.start();
  }
});

populateDistancePresets();

setNewMoon.addEventListener("click", () => {
  moonLon.value = String(state.sunLonDeg);
  render();
});

setFullMoon.addEventListener("click", () => {
  moonLon.value = String(EclipseGeometryModel.normalizeAngleDeg(state.sunLonDeg + 180));
  render();
});

moonLon.addEventListener("input", render);
nodeLon.addEventListener("input", render);
tilt.addEventListener("input", render);
distancePreset.addEventListener("change", render);

render();
