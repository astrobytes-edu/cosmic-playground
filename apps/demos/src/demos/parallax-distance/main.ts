import { createDemoModes, createInstrumentRuntime, initMath, initPopovers, initStarfield, setLiveRegionText } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ParallaxDistanceModel } from "@cosmic/physics";
import { nearbyStars } from "@cosmic/data-astr101";
import { clamp, formatNumber, signalToNoise, diagramHalfAngle, diagramStarY } from "./logic";

const starPresetEl = document.querySelector<HTMLSelectElement>("#starPreset");
const parallaxMasEl = document.querySelector<HTMLInputElement>("#parallaxMas");
const parallaxMasValueEl = document.querySelector<HTMLSpanElement>("#parallaxMasValue");
const sigmaMasEl = document.querySelector<HTMLInputElement>("#sigmaMas");
const sigmaMasValueEl = document.querySelector<HTMLSpanElement>("#sigmaMasValue");

const stationModeEl = document.querySelector<HTMLButtonElement>("#stationMode");
const helpEl = document.querySelector<HTMLButtonElement>("#help");
const copyResultsEl = document.querySelector<HTMLButtonElement>("#copyResults");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

const diagramEl = document.querySelector<SVGSVGElement>("#diagram");
const baselineEl = document.querySelector<SVGLineElement>("#baseline");
const earthAEl = document.querySelector<SVGCircleElement>("#earthA");
const earthBEl = document.querySelector<SVGCircleElement>("#earthB");
const baselineLabelEl = document.querySelector<SVGTextElement>("#baselineLabel");
const rayAEl = document.querySelector<SVGLineElement>("#rayA");
const rayBEl = document.querySelector<SVGLineElement>("#rayB");
const starEl = document.querySelector<SVGCircleElement>("#star");
const starLabelEl = document.querySelector<SVGTextElement>("#starLabel");
const angleArcEl = document.querySelector<SVGPathElement>("#angleArc");
const angleLabelEl = document.querySelector<SVGTextElement>("#angleLabel");
const clampNoteEl = document.querySelector<SVGTextElement>("#clampNote");

const parallaxArcsecEl = document.querySelector<HTMLSpanElement>("#parallaxArcsec");
const distancePcEl = document.querySelector<HTMLSpanElement>("#distancePc");
const distanceLyEl = document.querySelector<HTMLSpanElement>("#distanceLy");
const snrEl = document.querySelector<HTMLSpanElement>("#snr");

if (
  !starPresetEl ||
  !parallaxMasEl ||
  !parallaxMasValueEl ||
  !sigmaMasEl ||
  !sigmaMasValueEl ||
  !stationModeEl ||
  !helpEl ||
  !copyResultsEl ||
  !statusEl ||
  !diagramEl ||
  !baselineEl ||
  !earthAEl ||
  !earthBEl ||
  !baselineLabelEl ||
  !rayAEl ||
  !rayBEl ||
  !starEl ||
  !starLabelEl ||
  !angleArcEl ||
  !angleLabelEl ||
  !clampNoteEl ||
  !parallaxArcsecEl ||
  !distancePcEl ||
  !distanceLyEl ||
  !snrEl
) {
  throw new Error("Missing required DOM elements for parallax-distance demo.");
}

const starPreset = starPresetEl;
const parallaxMas = parallaxMasEl;
const parallaxMasValue = parallaxMasValueEl;
const sigmaMas = sigmaMasEl;
const sigmaMasValue = sigmaMasValueEl;
const stationModeButton = stationModeEl;
const helpButton = helpEl;
const copyResults = copyResultsEl;
const status = statusEl;

const baseline = baselineEl;
const earthA = earthAEl;
const earthB = earthBEl;
const baselineLabel = baselineLabelEl;
const rayA = rayAEl;
const rayB = rayBEl;
const star = starEl;
const starLabel = starLabelEl;
const angleArc = angleArcEl;
const angleLabel = angleLabelEl;
const clampNote = clampNoteEl;

const parallaxArcsecValue = parallaxArcsecEl;
const distancePcValue = distancePcEl;
const distanceLyValue = distanceLyEl;
const snrValue = snrEl;

function currentPresetLabel(): string {
  const idx = starPreset.selectedIndex;
  const opt = idx >= 0 ? starPreset.options[idx] : null;
  return opt ? opt.textContent?.trim() || "Custom" : "Custom";
}

function currentInputs(): { parallaxMas: number; sigmaMas: number } {
  const pMas = clamp(Number(parallaxMas.value), 1, 1000);
  const sMas = clamp(Number(sigmaMas.value), 0.1, 20);
  return { parallaxMas: pMas, sigmaMas: sMas };
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const a0 = polarToCartesian(cx, cy, r, start);
  const a1 = polarToCartesian(cx, cy, r, end);
  const sweep = end - start;
  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  const sweepFlag = sweep >= 0 ? 1 : 0;
  return `M ${a0.x.toFixed(2)} ${a0.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${a1.x.toFixed(2)} ${a1.y.toFixed(2)}`;
}

function renderDiagram(inputs: { parallaxMas: number }) {
  // Schematic geometry: baseline is Jan↔Jul (2 AU). The angle between sightlines is 2p.
  // We exaggerate the angle for visibility while keeping proportional scaling.
  const viewW = 900;
  const viewH = 520;
  const cx = viewW / 2;
  const baselineY = 420;
  const baselineLen = 320;
  const xA = cx - baselineLen / 2;
  const xB = cx + baselineLen / 2;
  const yA = baselineY;
  const yB = baselineY;

  baseline.setAttribute("x1", String(xA));
  baseline.setAttribute("y1", String(yA));
  baseline.setAttribute("x2", String(xB));
  baseline.setAttribute("y2", String(yB));
  earthA.setAttribute("cx", String(xA));
  earthA.setAttribute("cy", String(yA));
  earthB.setAttribute("cx", String(xB));
  earthB.setAttribute("cy", String(yB));

  baselineLabel.setAttribute("x", String(cx));
  baselineLabel.setAttribute("y", String(baselineY + 44));
  baselineLabel.setAttribute("text-anchor", "middle");

  const { halfAngle } = diagramHalfAngle(inputs.parallaxMas);
  const { starY, clamped } = diagramStarY(baselineY, baselineLen, halfAngle);
  const starX = cx;

  star.setAttribute("cx", String(starX));
  star.setAttribute("cy", String(starY));
  starLabel.setAttribute("x", String(starX + 14));
  starLabel.setAttribute("y", String(starY - 12));

  rayA.setAttribute("x1", String(starX));
  rayA.setAttribute("y1", String(starY));
  rayA.setAttribute("x2", String(xA));
  rayA.setAttribute("y2", String(yA));
  rayB.setAttribute("x1", String(starX));
  rayB.setAttribute("y1", String(starY));
  rayB.setAttribute("x2", String(xB));
  rayB.setAttribute("y2", String(yB));

  // Angle between the two rays at the star (use the *small* angle about the downward direction).
  const dPx = Math.max(1, baselineY - starY);
  const half = Math.atan((baselineLen / 2) / dPx);
  const down = Math.PI / 2;
  const start = down - half;
  const end = down + half;
  const arcR = 46;
  angleArc.setAttribute("d", arcPath(starX, starY, arcR, start, end));

  angleLabel.setAttribute("x", String(starX));
  angleLabel.setAttribute("y", String(starY + arcR + 20));
  angleLabel.setAttribute("text-anchor", "middle");
  angleLabel.textContent = "2p (exaggerated)";

  clampNote.setAttribute("x", String(cx));
  clampNote.setAttribute("y", String(44));
  clampNote.setAttribute("text-anchor", "middle");
  clampNote.textContent = clamped ? "Note: star position is clamped for visibility (angle would be even smaller)." : "";
}

function render() {
  const inputs = currentInputs();
  const pArcsec = inputs.parallaxMas / 1000;
  const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(inputs.parallaxMas);
  const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);

  const snr = signalToNoise(inputs.parallaxMas, inputs.sigmaMas);

  parallaxMasValue.textContent = `${Math.round(inputs.parallaxMas)} mas`;
  sigmaMasValue.textContent = `${formatNumber(inputs.sigmaMas, 1)} mas`;

  parallaxArcsecValue.textContent = formatNumber(pArcsec, 4);
  distancePcValue.textContent = Number.isFinite(dPc) ? formatNumber(dPc, 2) : "Infinity";
  distanceLyValue.textContent = Number.isFinite(dLy) ? formatNumber(dLy, 2) : "Infinity";
  snrValue.textContent = Number.isFinite(snr) ? formatNumber(snr, 1) : "—";

  renderDiagram(inputs);
}

function exportResults(): ExportPayloadV1 {
  const inputs = currentInputs();
  const pArcsec = inputs.parallaxMas / 1000;
  const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(inputs.parallaxMas);
  const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
  const snr = signalToNoise(inputs.parallaxMas, inputs.sigmaMas);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Preset", value: currentPresetLabel() },
      { name: "Parallax p (mas)", value: String(Math.round(inputs.parallaxMas)) },
      { name: "Uncertainty sigma_p (mas)", value: formatNumber(inputs.sigmaMas, 2) }
    ],
    readouts: [
      { name: "Parallax p (arcsec)", value: formatNumber(pArcsec, 6) },
      { name: "Distance d (pc)", value: Number.isFinite(dPc) ? formatNumber(dPc, 6) : "Infinity" },
      { name: "Distance d (ly)", value: Number.isFinite(dLy) ? formatNumber(dLy, 6) : "Infinity" },
      { name: "Signal-to-noise p/sigma_p", value: Number.isFinite(snr) ? formatNumber(snr, 6) : "—" }
    ],
    notes: [
      "Parsec definition: d(pc) = 1 / p(arcsec).",
      "1 arcsec = 1000 mas.",
      "This diagram is schematic; angles are exaggerated for visibility."
    ]
  };
}

const runtime = createInstrumentRuntime({
  hasMathMode: false,
  storageKey: "cp:parallax-distance:mode",
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
          { key: "g", action: "Toggle station mode" }
        ]
      },
      {
        heading: "How to use this instrument",
        type: "bullets",
        items: [
          "Decrease p and watch d increase (d is proportional to 1/p).",
          "Increase sigma_p and notice the signal-to-noise p/sigma_p falls for tiny parallax angles.",
          "Try the preset stars to compare nearby vs more distant examples."
        ]
      }
    ]
  },
  station: {
    title: "Station Mode: Parallax Distance",
    subtitle: "Add snapshot rows, then copy CSV or print.",
    steps: [
      "Pick a parallax p and record the resulting distance d.",
      "Change p by a factor of 10 and check that d changes by a factor of 10 in the opposite direction.",
      "Adjust sigma_p to discuss why very small parallax angles are hard to measure."
    ],
    columns: [
      { key: "case", label: "Case" },
      { key: "preset", label: "Preset" },
      { key: "pMas", label: "p (mas)" },
      { key: "sigmaMas", label: "sigma_p (mas)" },
      { key: "dPc", label: "d (pc)" },
      { key: "dLy", label: "d (ly)" },
      { key: "snr", label: "p/sigma_p" }
    ],
    getSnapshotRow() {
      const inputs = currentInputs();
      const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(inputs.parallaxMas);
      const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
      const snr = signalToNoise(inputs.parallaxMas, inputs.sigmaMas);
      return {
        case: "Snapshot",
        preset: currentPresetLabel(),
        pMas: String(Math.round(inputs.parallaxMas)),
        sigmaMas: formatNumber(inputs.sigmaMas, 2),
        dPc: Number.isFinite(dPc) ? formatNumber(dPc, 3) : "Infinity",
        dLy: Number.isFinite(dLy) ? formatNumber(dLy, 3) : "Infinity",
        snr: Number.isFinite(snr) ? formatNumber(snr, 2) : "—"
      };
    },
    snapshotLabel: "Add row (snapshot)",
    rowSets: [
      {
        label: "Add nearby star examples (sigma_p=1 mas)",
        getRows() {
          return nearbyStars.map((s) => {
            const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(s.parallaxMas);
            const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
            const snr = s.parallaxMas / 1;
            return {
              case: "Preset",
              preset: s.name,
              pMas: String(Math.round(s.parallaxMas)),
              sigmaMas: "1.00",
              dPc: formatNumber(dPc, 3),
              dLy: formatNumber(dLy, 3),
              snr: formatNumber(snr, 2)
            };
          });
        }
      }
    ],
    synthesisPrompt:
      "<p><strong>Synthesis:</strong> In one sentence, explain why measuring parallax becomes difficult for very distant stars.</p>"
  }
});

demoModes.bindButtons({
  helpButton,
  stationButton: stationModeButton
});

function populatePresetSelect() {
  starPreset.innerHTML = "";
  const custom = document.createElement("option");
  custom.value = "";
  custom.textContent = "Custom";
  starPreset.appendChild(custom);

  for (const s of nearbyStars) {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    starPreset.appendChild(opt);
  }
  starPreset.value = "";
}

populatePresetSelect();
render();

starPreset.addEventListener("change", () => {
  const selected = nearbyStars.find((s) => s.name === starPreset.value);
  if (selected) {
    parallaxMas.value = String(Math.round(selected.parallaxMas));
  }
  render();
});

parallaxMas.addEventListener("input", () => {
  if (starPreset.value !== "") {
    starPreset.value = "";
  }
  render();
});

sigmaMas.addEventListener("input", render);

copyResults.addEventListener("click", () => {
  setLiveRegionText(status, "Copying…");
  void runtime
    .copyResults(exportResults())
    .then(() => setLiveRegionText(status, "Copied results to clipboard."))
    .catch((err) =>
      setLiveRegionText(
        status,
        err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed."
      )
    );
});

const starfieldCanvas = document.querySelector<HTMLCanvasElement>(".cp-starfield");
if (starfieldCanvas) {
  initStarfield({ canvas: starfieldCanvas });
}

initMath(document);

const demoRoot = document.getElementById("cp-demo");
if (demoRoot) {
  initPopovers(demoRoot);
}
