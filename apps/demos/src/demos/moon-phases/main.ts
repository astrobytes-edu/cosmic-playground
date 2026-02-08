import {
  ChallengeEngine,
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  initStarfield,
  initTabs,
  setLiveRegionText
} from "@cosmic/runtime";
import { MoonPhasesModel, moonRiseSetLocalTimeHours } from "@cosmic/physics";
import { nextAngleDeg } from "./animation";
import { buildMoonPhasesExport } from "./exportPayload";
import {
  normalizeAngle,
  shortestAngleDelta,
  formatFraction,
  formatDay,
  formatApproxTime,
  computeApproxRiseSet,
  snapToCardinalPhase,
  computeOrbitalPosition,
  computePhaseViewPath,
  computeReadoutData,
  computeTimelineState,
  PHASE_ANGLES,
  ORBITAL_CENTER,
  ORBITAL_RADIUS,
  MOON_RADIUS,
  PHASE_MOON_RADIUS,
} from "./logic";
import { applyPresetDayOfYear, getAdvancedVisibility, getRiseSetVisibility } from "./riseSetUiState";

function requireEl<T extends Element>(element: T | null, name: string): T {
  if (!element) {
    throw new Error(`Missing required element: ${name}`);
  }
  return element;
}

const angleInputEl = requireEl(
  document.querySelector<HTMLInputElement>("#angle"),
  "#angle"
);
const phaseNameEl = requireEl(
  document.querySelector<HTMLElement>("#phase-name"),
  "#phase-name"
);
const angleReadoutEl = requireEl(
  document.querySelector<HTMLElement>("#angleReadout"),
  "#angleReadout"
);
const illumPercentEl = requireEl(
  document.querySelector<HTMLElement>("#illumination"),
  "#illumination"
);
const daysSinceNewEl = requireEl(
  document.querySelector<HTMLElement>("#days-since-new"),
  "#days-since-new"
);

const orbitalSvgEl = requireEl(
  document.querySelector<SVGSVGElement>("#orbital-svg"),
  "#orbital-svg"
);
const moonGroupEl = requireEl(
  document.querySelector<SVGGElement>("#moon-group"),
  "#moon-group"
);
const moonDarkEl = requireEl(
  document.querySelector<SVGCircleElement>("#moon-dark"),
  "#moon-dark"
);
const moonLitEl = requireEl(
  document.querySelector<SVGCircleElement>("#moon-lit"),
  "#moon-lit"
);
const moonTerminatorEl = requireEl(
  document.querySelector<SVGLineElement>("#moon-terminator"),
  "#moon-terminator"
);
const moonLitHalfClipEl = requireEl(
  document.querySelector<SVGRectElement>("#moon-lit-half-clip"),
  "#moon-lit-half-clip"
);
const earthShadowGroupEl = requireEl(
  document.querySelector<SVGGElement>("#earth-shadow-group"),
  "#earth-shadow-group"
);

const litPortionEl = requireEl(
  document.querySelector<SVGPathElement>("#lit-portion"),
  "#lit-portion"
);

const waxingWaningLabelEl = requireEl(
  document.querySelector<HTMLSpanElement>("#waxing-waning-label"),
  "#waxing-waning-label"
);

const timelineDirectionEl = requireEl(
  document.querySelector<HTMLElement>("#timeline-direction"),
  "#timeline-direction"
);
const timelineDayEl = requireEl(
  document.querySelector<HTMLElement>("#timeline-day"),
  "#timeline-day"
);
const timelinePhaseEls = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".timeline-phase")
);
const phaseButtonEls = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".phase-btn")
);

const playButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-play"),
  "#btn-play"
);
const pauseButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-pause"),
  "#btn-pause"
);
const stepBackButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-step-back"),
  "#btn-step-back"
);
const stepForwardButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-step-forward"),
  "#btn-step-forward"
);
const resetButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-reset"),
  "#btn-reset"
);
const speedSelectEl = requireEl(
  document.querySelector<HTMLSelectElement>("#speed-select"),
  "#speed-select"
);

const stationButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-station-mode"),
  "#btn-station-mode"
);
const helpButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-help"),
  "#btn-help"
);
const challengeButtonEl = requireEl(
  document.querySelector<HTMLButtonElement>("#btn-challenges"),
  "#btn-challenges"
);
const challengeContainerEl = requireEl(
  document.querySelector<HTMLDivElement>("#challenge-container"),
  "#challenge-container"
);

const shadowToggleEl = requireEl(
  document.querySelector<HTMLInputElement>("#show-shadow-toggle"),
  "#show-shadow-toggle"
);
const advancedToggleEl = requireEl(
  document.querySelector<HTMLInputElement>("#toggle-advanced"),
  "#toggle-advanced"
);
const advancedControlsEl = requireEl(
  document.querySelector<HTMLDivElement>("#advanced-controls"),
  "#advanced-controls"
);
const latitudeInputEl = requireEl(
  document.querySelector<HTMLInputElement>("#latitude"),
  "#latitude"
);
const latitudeReadoutEl = requireEl(
  document.querySelector<HTMLElement>("#latitudeReadout"),
  "#latitudeReadout"
);
const dayOfYearInputEl = requireEl(
  document.querySelector<HTMLInputElement>("#dayOfYear"),
  "#dayOfYear"
);
const dayOfYearReadoutEl = requireEl(
  document.querySelector<HTMLElement>("#dayOfYearReadout"),
  "#dayOfYearReadout"
);
const presetSpringEl = requireEl(
  document.querySelector<HTMLButtonElement>("#preset-spring"),
  "#preset-spring"
);
const presetSummerEl = requireEl(
  document.querySelector<HTMLButtonElement>("#preset-summer"),
  "#preset-summer"
);
const presetFallEl = requireEl(
  document.querySelector<HTMLButtonElement>("#preset-fall"),
  "#preset-fall"
);
const presetWinterEl = requireEl(
  document.querySelector<HTMLButtonElement>("#preset-winter"),
  "#preset-winter"
);
const riseSetToggleEl = requireEl(
  document.querySelector<HTMLInputElement>("#toggle-rise-set"),
  "#toggle-rise-set"
);
const riseSetLineEl = requireEl(
  document.querySelector<HTMLDivElement>("#rise-set-line"),
  "#rise-set-line"
);
const riseSetTextEl = requireEl(
  document.querySelector<HTMLSpanElement>("#rise-set-text"),
  "#rise-set-text"
);
const copyResultsEl = requireEl(
  document.querySelector<HTMLButtonElement>("#copyResults"),
  "#copyResults"
);
const statusEl = requireEl(
  document.querySelector<HTMLParagraphElement>("#status"),
  "#status"
);

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

let moonAngleDeg = 0;
let isAnimating = false;
let animationId: number | null = null;
let tweenId: number | null = null;
let animationSpeed = Number(speedSelectEl.value) || 5;
let advancedEnabled = advancedToggleEl.checked;
let latitudeDeg = Number(latitudeInputEl.value) || 0;
let dayOfYear = Number(dayOfYearInputEl.value) || 80;
let riseSetEnabled = riseSetToggleEl.checked;

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:moon-phases:mode",
  url: new URL(window.location.href)
});

function updateAdvancedReadouts() {
  latitudeReadoutEl.textContent = String(Math.round(latitudeDeg));
  dayOfYearReadoutEl.textContent = String(Math.round(dayOfYear));
}

function updateAdvancedVisibility() {
  advancedControlsEl.classList.toggle(
    "is-hidden",
    getAdvancedVisibility(advancedEnabled)
  );
}

function updateRiseSetVisibility() {
  riseSetLineEl.classList.toggle(
    "is-hidden",
    getRiseSetVisibility(riseSetEnabled)
  );
}

function updateRiseSetReadouts() {
  if (!riseSetEnabled) return;

  const normalized = normalizeAngle(moonAngleDeg);

  if (advancedEnabled) {
    const result = moonRiseSetLocalTimeHours({
      phaseAngleDeg: normalized,
      latitudeDeg,
      dayOfYear,
      useAdvanced: advancedEnabled
    });

    if (result.status !== "ok" || result.riseHour == null || result.setHour == null) {
      riseSetTextEl.textContent = "No rise/set at this latitude (polar)";
      return;
    }

    riseSetTextEl.textContent =
      `Rises ${formatApproxTime(result.riseHour)} \u00B7 Sets ${formatApproxTime(result.setHour)}`;
  } else {
    const { riseHour, setHour } = computeApproxRiseSet(normalized);
    riseSetTextEl.textContent =
      `Rises ${formatApproxTime(riseHour)} \u00B7 Sets ${formatApproxTime(setHour)}`;
  }
}

function updateAngleInput() {
  angleInputEl.value = String(Math.round(moonAngleDeg));
}

function setAngle(angleDeg: number) {
  moonAngleDeg = normalizeAngle(angleDeg);
  updateAngleInput();
  update();
}

function animateAngle(targetDeg: number, durationMs: number) {
  if (PREFERS_REDUCED_MOTION || durationMs <= 0) {
    setAngle(targetDeg);
    return;
  }

  if (tweenId) {
    cancelAnimationFrame(tweenId);
    tweenId = null;
  }

  const start = moonAngleDeg;
  const delta = shortestAngleDelta(start, targetDeg);
  const startTime = performance.now();

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / durationMs);
    moonAngleDeg = normalizeAngle(start + delta * t);
    updateAngleInput();
    update();
    if (t < 1) {
      tweenId = requestAnimationFrame(step);
    } else {
      tweenId = null;
    }
  };

  tweenId = requestAnimationFrame(step);
}

function updateOrbitalView() {
  const { x: moonX, y: moonY } = computeOrbitalPosition(
    moonAngleDeg,
    ORBITAL_CENTER,
    ORBITAL_RADIUS
  );

  moonDarkEl.setAttribute("cx", moonX.toFixed(2));
  moonDarkEl.setAttribute("cy", moonY.toFixed(2));
  moonLitEl.setAttribute("cx", moonX.toFixed(2));
  moonLitEl.setAttribute("cy", moonY.toFixed(2));
  moonTerminatorEl.setAttribute("x1", moonX.toFixed(2));
  moonTerminatorEl.setAttribute("x2", moonX.toFixed(2));
  moonTerminatorEl.setAttribute("y1", (moonY - MOON_RADIUS).toFixed(2));
  moonTerminatorEl.setAttribute("y2", (moonY + MOON_RADIUS).toFixed(2));

  moonLitHalfClipEl.setAttribute("x", (moonX - MOON_RADIUS).toFixed(2));
  moonLitHalfClipEl.setAttribute("y", (moonY - MOON_RADIUS).toFixed(2));
  moonLitHalfClipEl.setAttribute("width", MOON_RADIUS.toFixed(2));
  moonLitHalfClipEl.setAttribute("height", (MOON_RADIUS * 2).toFixed(2));
}

function updatePhaseView() {
  const path = computePhaseViewPath(moonAngleDeg, PHASE_MOON_RADIUS, MoonPhasesModel);
  litPortionEl.setAttribute("d", path);
}

function updateReadouts() {
  const data = computeReadoutData(moonAngleDeg, MoonPhasesModel);

  phaseNameEl.textContent = data.phaseName;
  angleReadoutEl.textContent = data.angleStr;
  illumPercentEl.textContent = data.illumPercent;
  daysSinceNewEl.textContent = data.daysSinceNew;
  waxingWaningLabelEl.textContent = data.waxingWaning;

  moonGroupEl.setAttribute("aria-valuenow", data.angleStr);
  moonGroupEl.setAttribute("aria-valuetext", data.ariaValueText);
}

function updateTimeline() {
  const state = computeTimelineState(moonAngleDeg, PHASE_ANGLES, MoonPhasesModel);

  timelineDirectionEl.textContent = state.directionText;
  timelineDirectionEl.classList.toggle("waning", state.directionClass === "waning");
  timelineDayEl.textContent = state.dayText;

  const normalized = normalizeAngle(moonAngleDeg);
  timelinePhaseEls.forEach((button) => {
    const target = Number(button.dataset.angle);
    const diff = Math.abs(shortestAngleDelta(normalized, target));
    button.classList.toggle("active", diff < 22.5);
  });

  phaseButtonEls.forEach((button) => {
    const target = Number(button.dataset.angle);
    const diff = Math.abs(shortestAngleDelta(normalized, target));
    button.classList.toggle("active", diff < 22.5);
  });
}

function update() {
  updateOrbitalView();
  updatePhaseView();
  updateReadouts();
  updateRiseSetReadouts();
  updateTimeline();
}

function applyShadowVisibility(showShadow: boolean, announce = false) {
  earthShadowGroupEl.style.display = showShadow ? "block" : "none";
  shadowToggleEl.checked = showShadow;
  if (announce) {
    setLiveRegionText(
      statusEl,
      showShadow
        ? "Earth's shadow cone is now visible. Notice it points away from the Sun."
        : "Earth's shadow cone hidden."
    );
  }
}

function setupDrag() {
  let isDragging = false;

  const startDrag = (event: Event) => {
    stopAnimation();
    isDragging = true;
    event.preventDefault();
  };

  const moveDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    let clientX: number;
    let clientY: number;

    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ("clientX" in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return;
    }

    const rect = orbitalSvgEl.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * 400;
    const svgY = ((clientY - rect.top) / rect.height) * 400;

    const dx = svgX - ORBITAL_CENTER.x;
    const dy = ORBITAL_CENTER.y - svgY;

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    moonAngleDeg = normalizeAngle(angle);
    updateAngleInput();
    update();
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    setAngle(snapToCardinalPhase(moonAngleDeg));
  };

  moonGroupEl.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", moveDrag);
  document.addEventListener("mouseup", endDrag);

  moonGroupEl.addEventListener("touchstart", startDrag, { passive: false });
  document.addEventListener("touchmove", moveDrag, { passive: false });
  document.addEventListener("touchend", endDrag);
}

function setupPresets() {
  phaseButtonEls.forEach((button) => {
    button.addEventListener("click", () => {
      stopAnimation();
      const target = Number(button.dataset.angle);
      animateAngle(target, 400);
    });
  });
}

function setupTimeline() {
  timelinePhaseEls.forEach((button) => {
    button.addEventListener("click", () => {
      stopAnimation();
      const target = Number(button.dataset.angle);
      animateAngle(target, 400);
    });
  });
}

function setupKeyboard() {
  moonGroupEl.addEventListener("keydown", (event) => {
    let delta = 0;
    let jump: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        delta = event.shiftKey ? -1 : -5;
        break;
      case "ArrowRight":
      case "ArrowUp":
        delta = event.shiftKey ? 1 : 5;
        break;
      case "Home":
        jump = 0;
        break;
      case "End":
        jump = 180;
        break;
      case "1":
        jump = 180;
        break;
      case "2":
        jump = 225;
        break;
      case "3":
        jump = 270;
        break;
      case "4":
        jump = 315;
        break;
      case "5":
        jump = 0;
        break;
      case "6":
        jump = 45;
        break;
      case "7":
        jump = 90;
        break;
      case "8":
        jump = 135;
        break;
      default:
        return;
    }

    event.preventDefault();
    stopAnimation();

    if (jump !== null) {
      animateAngle(jump, 300);
      return;
    }

    if (delta !== 0) {
      setAngle(moonAngleDeg + delta);
    }
  });
}

function updateAnimationButtons() {
  playButtonEl.disabled = isAnimating || PREFERS_REDUCED_MOTION;
  pauseButtonEl.disabled = !isAnimating;
}

function startAnimation() {
  if (PREFERS_REDUCED_MOTION) {
    setLiveRegionText(statusEl, "Animation is disabled in reduced-motion mode.");
    return;
  }
  if (isAnimating) return;

  isAnimating = true;
  updateAnimationButtons();

  let lastTime = performance.now();
  const step = (now: number) => {
    if (!isAnimating) return;
    const delta = (now - lastTime) / 1000;
    lastTime = now;
    moonAngleDeg = nextAngleDeg({
      angleDeg: moonAngleDeg,
      deltaSeconds: delta,
      speed: animationSpeed,
      synodicMonthDays: MoonPhasesModel.synodicMonthDays
    });
    updateAngleInput();
    update();
    animationId = requestAnimationFrame(step);
  };

  animationId = requestAnimationFrame(step);
}

function stopAnimation() {
  isAnimating = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  updateAnimationButtons();
}

function stepForward() {
  stopAnimation();
  const index = MoonPhasesModel.phaseIndexFromPhaseAngleDeg(moonAngleDeg);
  const target = PHASE_ANGLES[(index + 1) % PHASE_ANGLES.length];
  animateAngle(target, 300);
}

function stepBackward() {
  stopAnimation();
  const index = MoonPhasesModel.phaseIndexFromPhaseAngleDeg(moonAngleDeg);
  const target = PHASE_ANGLES[(index + PHASE_ANGLES.length - 1) % PHASE_ANGLES.length];
  animateAngle(target, 300);
}

function resetToFull() {
  stopAnimation();
  animateAngle(0, 300);
  applyShadowVisibility(false, true);
}

function setupAnimationControls() {
  playButtonEl.addEventListener("click", startAnimation);
  pauseButtonEl.addEventListener("click", stopAnimation);
  stepForwardButtonEl.addEventListener("click", stepForward);
  stepBackButtonEl.addEventListener("click", stepBackward);
  resetButtonEl.addEventListener("click", resetToFull);

  speedSelectEl.addEventListener("change", () => {
    animationSpeed = Number(speedSelectEl.value) || 1;
  });

  updateAnimationButtons();
}

function setupShadowToggle() {
  shadowToggleEl.addEventListener("change", () => {
    applyShadowVisibility(shadowToggleEl.checked, true);
  });
}

function setupAdvancedControls() {
  const syncLatitude = () => {
    latitudeDeg = Number(latitudeInputEl.value) || 0;
    updateAdvancedReadouts();
    updateRiseSetReadouts();
  };

  const syncDayOfYear = () => {
    dayOfYear = Number(dayOfYearInputEl.value) || 0;
    updateAdvancedReadouts();
    updateRiseSetReadouts();
  };

  advancedToggleEl.addEventListener("change", () => {
    advancedEnabled = advancedToggleEl.checked;
    updateAdvancedVisibility();
    updateRiseSetReadouts();
  });

  riseSetToggleEl.addEventListener("change", () => {
    riseSetEnabled = riseSetToggleEl.checked;
    updateRiseSetVisibility();
    updateRiseSetReadouts();
  });

  latitudeInputEl.addEventListener("input", syncLatitude);
  dayOfYearInputEl.addEventListener("input", syncDayOfYear);

  presetSpringEl.addEventListener("click", () => {
    dayOfYear = applyPresetDayOfYear(dayOfYear, "spring");
    dayOfYearInputEl.value = String(dayOfYear);
    syncDayOfYear();
  });

  presetSummerEl.addEventListener("click", () => {
    dayOfYear = applyPresetDayOfYear(dayOfYear, "summer");
    dayOfYearInputEl.value = String(dayOfYear);
    syncDayOfYear();
  });

  presetFallEl.addEventListener("click", () => {
    dayOfYear = applyPresetDayOfYear(dayOfYear, "fall");
    dayOfYearInputEl.value = String(dayOfYear);
    syncDayOfYear();
  });

  presetWinterEl.addEventListener("click", () => {
    dayOfYear = applyPresetDayOfYear(dayOfYear, "winter");
    dayOfYearInputEl.value = String(dayOfYear);
    syncDayOfYear();
  });

  updateAdvancedVisibility();
  updateRiseSetVisibility();
  updateAdvancedReadouts();
}

function setupChallenges() {
  const challenges = [
    {
      prompt: "Set the Moon to show a Full Moon phase.",
      hints: [
        "Full Moon is opposite the Sun in this diagram.",
        "Try $\\alpha$ near $0^\\circ$ or $360^\\circ$."
      ],
      initialState: { angleDeg: 20 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const illum = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(angleDeg);
        if (![angleDeg, illum].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        if (illum >= 0.95) {
          return { correct: true, close: false, message: `$f \\approx ${formatFraction(illum)}$.` };
        }
        if (illum >= 0.88) {
          return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(illum)}$.` };
        }
        return { correct: false, close: false, message: "Too dim\u2014move closer to Full." };
      }
    },
    {
      prompt: "Set the Moon to show a New Moon phase.",
      hints: ["New Moon is between Earth and Sun.", "Try $\\alpha$ near $180^\\circ$."],
      initialState: { angleDeg: 150 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const illum = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(angleDeg);
        if (![angleDeg, illum].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        if (illum <= 0.05) {
          return { correct: true, close: false, message: `$f \\approx ${formatFraction(illum)}$.` };
        }
        if (illum <= 0.12) {
          return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(illum)}$.` };
        }
        return { correct: false, close: false, message: "Too bright\u2014move closer to New." };
      }
    },
    {
      prompt: "Find the First Quarter Moon position.",
      hints: ["Quarter phases are about 50% illuminated.", "Try $\\alpha$ near $270^\\circ$."],
      initialState: { angleDeg: 250 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const illum = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(angleDeg);
        if (![angleDeg, illum].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        const diff = Math.abs(illum - 0.5);
        if (diff <= 0.03) {
          return { correct: true, close: false, message: `$f \\approx ${formatFraction(illum)}$.` };
        }
        if (diff <= 0.08) {
          return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(illum)}$.` };
        }
        return { correct: false, close: false, message: "Move toward quarter phase (50% lit)." };
      }
    },
    {
      prompt: "Find the Third Quarter Moon position.",
      hints: ["Quarter phases are about 50% illuminated.", "Try $\\alpha$ near $90^\\circ$."],
      initialState: { angleDeg: 110 },
      check(state: any) {
        const angleDeg = Number(state?.angleDeg);
        const illum = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(angleDeg);
        if (![angleDeg, illum].every(Number.isFinite)) {
          return { correct: false, close: false, message: "No valid state yet." };
        }
        const diff = Math.abs(illum - 0.5);
        if (diff <= 0.03) {
          return { correct: true, close: false, message: `$f \\approx ${formatFraction(illum)}$.` };
        }
        if (diff <= 0.08) {
          return { correct: false, close: true, message: `Close: $f \\approx ${formatFraction(illum)}$.` };
        }
        return { correct: false, close: false, message: "Move toward quarter phase (50% lit)." };
      }
    },
    {
      prompt: "Shadow challenge: Can Earth\u2019s shadow touch the Moon?",
      hints: [
        "Turn on the shadow toggle to see where it points.",
        "The shadow points away from the Sun (toward Full Moon)."
      ],
      initialState: { showShadow: true, angleDeg: 10 },
      check(state: any) {
        if (!state?.showShadow) {
          return {
            correct: false,
            close: false,
            message: "Turn on the shadow toggle first to see the cone."
          };
        }
        const angleDeg = Number(state?.angleDeg);
        const normalized = normalizeAngle(angleDeg);
        const inShadowZone = normalized < 30 || normalized > 330;
        return {
          correct: inShadowZone,
          close: false,
          message: inShadowZone
            ? "Yes \u2014 that\u2019s a lunar eclipse alignment."
            : "Move the Moon into the shadow cone (near Full Moon)."
        };
      }
    }
  ];

  const engine = new ChallengeEngine(challenges, {
    container: challengeContainerEl,
    showUI: true,
    getState: () => ({
      angleDeg: moonAngleDeg,
      showShadow: shadowToggleEl.checked
    }),
    setState: (next) => {
      if (typeof next === "object" && next !== null) {
        if ("showShadow" in next) {
          applyShadowVisibility(Boolean((next as any).showShadow));
        }
        if ("angleDeg" in next && Number.isFinite((next as any).angleDeg)) {
          setAngle(Number((next as any).angleDeg));
        }
      }
    }
  });

  challengeButtonEl.addEventListener("click", () => {
    if (engine.isActive()) {
      engine.stop();
      challengeButtonEl.classList.remove("active");
    } else {
      engine.start();
      challengeButtonEl.classList.add("active");
    }
  });
}

function setupModes() {
  const demoModes = createDemoModes({
    help: {
      title: "Help / Keys",
      subtitle: "Shortcuts work when focus is not in an input field.",
      sections: [
        {
          heading: "Global",
          type: "shortcuts",
          items: [
            { key: "?", action: "Toggle help" },
            { key: "g", action: "Toggle station mode" }
          ]
        },
        {
          heading: "Moon (when focused)",
          type: "shortcuts",
          items: [
            { key: "Left/Right (or Up/Down)", action: "Move Moon 5 deg around orbit" },
            { key: "Shift + arrow keys", action: "Move Moon 1 deg (fine control)" },
            { key: "Home", action: "Jump to Full Moon" },
            { key: "End", action: "Jump to New Moon" },
            { key: "1\u20138", action: "Jump to the 8 named phases" }
          ]
        },
        {
          heading: "Model",
          type: "bullets",
          items: [
            "Angle $\\alpha$ is the Sun\u2013Moon\u2013Earth phase angle in this model: $0^\\circ$ = Full, $180^\\circ$ = New.",
            "Illumination fraction is $f = \\frac{1 + \\cos\\alpha}{2}$."
          ]
        }
      ]
    },
    station: {
      title: "Station Mode: Moon Phases",
      subtitle: "Collect evidence that phases are viewing geometry (not shadow).",
      steps: [
        "Add the 4 key phases (New, First Quarter, Full, Third Quarter).",
        "Drag to any other phase and add snapshot rows.",
        "Use the table to connect angle around the orbit -> illumination fraction."
      ],
      columns: [
        { key: "angleDeg", label: "Phase angle alpha (deg)" },
        { key: "phase", label: "Phase name" },
        { key: "f", label: "Illumination fraction f" },
        { key: "percent", label: "Illuminated (%)" },
        { key: "days", label: "Days since new (d)" },
        { key: "trend", label: "Waxing/Waning" }
      ],
      snapshotLabel: "Add row (current Moon position)",
      getSnapshotRow() {
        const normalized = normalizeAngle(moonAngleDeg);
        const f = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(normalized);
        const days = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(normalized);
        return {
          angleDeg: String(Math.round(normalized)),
          phase: MoonPhasesModel.phaseNameFromPhaseAngleDeg(normalized),
          f: formatFraction(f),
          percent: String(Math.round(f * 100)),
          days: formatDay(days),
          trend: MoonPhasesModel.waxingWaningFromPhaseAngleDeg(normalized)
        };
      },
      rowSets: [
        {
          label: "Add key phases",
          getRows() {
            const keyAngles = [
              { label: "New Moon", angleDeg: 180 },
              { label: "First Quarter", angleDeg: 270 },
              { label: "Full Moon", angleDeg: 0 },
              { label: "Third Quarter", angleDeg: 90 }
            ];
            return keyAngles.map((item) => {
              const f = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(item.angleDeg);
              const days = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(item.angleDeg);
              return {
                angleDeg: String(item.angleDeg),
                phase: item.label,
                f: formatFraction(f),
                percent: String(Math.round(f * 100)),
                days: formatDay(days),
                trend: MoonPhasesModel.waxingWaningFromPhaseAngleDeg(item.angleDeg)
              };
            });
          }
        }
      ],
      synthesisPrompt: `
        <p><strong>Explain:</strong> The Sun always lights half the Moon. The phase is the fraction of that lit half we can see from Earth.</p>
        <p><strong>Use your table:</strong> Quarter phases should be about 50% illuminated, and the illumination changes smoothly as the Moon moves.</p>
      `
    },
    keys: { help: "?", station: "g" }
  });

  demoModes.bindButtons({ helpButton: helpButtonEl, stationButton: stationButtonEl });
}

async function handleCopyResults() {
  setLiveRegionText(statusEl, "Copying\u2026");
  try {
    await runtime.copyResults(
      buildMoonPhasesExport({
        phaseAngleDeg: moonAngleDeg,
        latitudeDeg,
        dayOfYear,
        advancedEnabled
      })
    );

    setLiveRegionText(statusEl, "Copied results to clipboard.");
  } catch (err) {
    setLiveRegionText(
      statusEl,
      err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
    );
  }
}

angleInputEl.addEventListener("input", () => {
  stopAnimation();
  setAngle(Number(angleInputEl.value));
});

copyResultsEl.addEventListener("click", () => {
  void handleCopyResults();
});

setupDrag();
setupPresets();
setupTimeline();
setupKeyboard();
setupAnimationControls();
setupShadowToggle();
setupAdvancedControls();
setupChallenges();
setupModes();

setAngle(0);
applyShadowVisibility(false);
initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
  initTabs(demoRoot);
}

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}
