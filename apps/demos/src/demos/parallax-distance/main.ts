import {
  createDemoModes,
  createInstrumentRuntime,
  initMath,
  initPopovers,
  renderMath,
  initStarfield,
  initTabs,
  setLiveRegionText
} from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { ParallaxDistanceModel } from "@cosmic/physics";
import { nearbyStars } from "@cosmic/data-astr101";
import {
  clamp,
  describeMeasurability,
  detectorOffsetPx,
  diagramHalfAngle,
  diagramStarY,
  formatNumber,
  parallaxArcsecFromMas,
  signalToNoise
} from "./logic";

function requireEl<T extends Element>(element: T | null, name: string): T {
  if (!element) {
    throw new Error(`Missing required element: ${name}`);
  }
  return element;
}

const starPreset = requireEl(
  document.querySelector<HTMLSelectElement>("#starPreset"),
  "#starPreset"
);
const parallaxMas = requireEl(
  document.querySelector<HTMLInputElement>("#parallaxMas"),
  "#parallaxMas"
);
const parallaxMasValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxMasValue"),
  "#parallaxMasValue"
);
const sigmaMas = requireEl(
  document.querySelector<HTMLInputElement>("#sigmaMas"),
  "#sigmaMas"
);
const sigmaMasValue = requireEl(
  document.querySelector<HTMLElement>("#sigmaMasValue"),
  "#sigmaMasValue"
);

const stationModeButton = requireEl(
  document.querySelector<HTMLButtonElement>("#stationMode"),
  "#stationMode"
);
const helpButton = requireEl(
  document.querySelector<HTMLButtonElement>("#help"),
  "#help"
);
const copyResults = requireEl(
  document.querySelector<HTMLButtonElement>("#copyResults"),
  "#copyResults"
);
const status = requireEl(
  document.querySelector<HTMLParagraphElement>("#status"),
  "#status"
);

const baseline = requireEl(
  document.querySelector<SVGLineElement>("#baseline"),
  "#baseline"
);
const earthJan = requireEl(
  document.querySelector<SVGCircleElement>("#earthJan"),
  "#earthJan"
);
const earthJul = requireEl(
  document.querySelector<SVGCircleElement>("#earthJul"),
  "#earthJul"
);
const earthJanLabel = requireEl(
  document.querySelector<SVGTextElement>("#earthJanLabel"),
  "#earthJanLabel"
);
const earthJulLabel = requireEl(
  document.querySelector<SVGTextElement>("#earthJulLabel"),
  "#earthJulLabel"
);
const baselineLabel = requireEl(
  document.querySelector<SVGTextElement>("#baselineLabel"),
  "#baselineLabel"
);
const rayJan = requireEl(
  document.querySelector<SVGLineElement>("#rayJan"),
  "#rayJan"
);
const rayJul = requireEl(
  document.querySelector<SVGLineElement>("#rayJul"),
  "#rayJul"
);
const star = requireEl(
  document.querySelector<SVGCircleElement>("#star"),
  "#star"
);
const starLabel = requireEl(
  document.querySelector<SVGTextElement>("#starLabel"),
  "#starLabel"
);
const angleArc = requireEl(
  document.querySelector<SVGPathElement>("#angleArc"),
  "#angleArc"
);
const angleLabel = requireEl(
  document.querySelector<SVGTextElement>("#angleLabel"),
  "#angleLabel"
);
const detectorTrack = requireEl(
  document.querySelector<SVGLineElement>("#detectorTrack"),
  "#detectorTrack"
);
const detectorCenter = requireEl(
  document.querySelector<SVGLineElement>("#detectorCenter"),
  "#detectorCenter"
);
const detectorMarkerJan = requireEl(
  document.querySelector<SVGCircleElement>("#detectorMarkerJan"),
  "#detectorMarkerJan"
);
const detectorMarkerJul = requireEl(
  document.querySelector<SVGCircleElement>("#detectorMarkerJul"),
  "#detectorMarkerJul"
);
const detectorJanLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorJanLabel"),
  "#detectorJanLabel"
);
const detectorJulLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorJulLabel"),
  "#detectorJulLabel"
);
const detectorLabel = requireEl(
  document.querySelector<SVGTextElement>("#detectorLabel"),
  "#detectorLabel"
);
const distanceCue = requireEl(
  document.querySelector<SVGTextElement>("#distanceCue"),
  "#distanceCue"
);
const exaggerationNote = requireEl(
  document.querySelector<SVGTextElement>("#exaggerationNote"),
  "#exaggerationNote"
);

const parallaxArcsecValue = requireEl(
  document.querySelector<HTMLElement>("#parallaxArcsec"),
  "#parallaxArcsec"
);
const distancePcValue = requireEl(
  document.querySelector<HTMLElement>("#distancePc"),
  "#distancePc"
);
const distanceLyValue = requireEl(
  document.querySelector<HTMLElement>("#distanceLy"),
  "#distanceLy"
);
const snrValue = requireEl(
  document.querySelector<HTMLElement>("#snr"),
  "#snr"
);
const snrQualityValue = requireEl(
  document.querySelector<HTMLElement>("#snrQuality"),
  "#snrQuality"
);

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

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const a0 = polarToCartesian(cx, cy, r, start);
  const a1 = polarToCartesian(cx, cy, r, end);
  const sweep = end - start;
  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  const sweepFlag = sweep >= 0 ? 1 : 0;
  return `M ${a0.x.toFixed(2)} ${a0.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${a1.x.toFixed(2)} ${a1.y.toFixed(2)}`;
}

function renderDiagram(inputs: { parallaxMas: number }, distancePc: number) {
  const centerX = 480;
  const earthY = 296;
  const baselineLen = 320;
  const baselineHalf = baselineLen / 2;
  const xJan = centerX - baselineHalf;
  const xJul = centerX + baselineHalf;

  baseline.setAttribute("x1", String(xJan));
  baseline.setAttribute("y1", String(earthY));
  baseline.setAttribute("x2", String(xJul));
  baseline.setAttribute("y2", String(earthY));

  earthJan.setAttribute("cx", String(xJan));
  earthJan.setAttribute("cy", String(earthY));
  earthJul.setAttribute("cx", String(xJul));
  earthJul.setAttribute("cy", String(earthY));

  earthJanLabel.setAttribute("x", String(xJan));
  earthJanLabel.setAttribute("y", String(earthY + 34));
  earthJulLabel.setAttribute("x", String(xJul));
  earthJulLabel.setAttribute("y", String(earthY + 34));

  baselineLabel.setAttribute("x", String(centerX));
  baselineLabel.setAttribute("y", String(earthY + 60));

  const { halfAngle, exaggeration } = diagramHalfAngle(inputs.parallaxMas);
  const starY = diagramStarY(earthY, baselineLen, halfAngle, 92, 236);
  const starX = centerX;

  star.setAttribute("cx", String(starX));
  star.setAttribute("cy", String(starY));
  starLabel.setAttribute("x", String(starX + 16));
  starLabel.setAttribute("y", String(starY - 14));

  rayJan.setAttribute("x1", String(starX));
  rayJan.setAttribute("y1", String(starY));
  rayJan.setAttribute("x2", String(xJan));
  rayJan.setAttribute("y2", String(earthY));

  rayJul.setAttribute("x1", String(starX));
  rayJul.setAttribute("y1", String(starY));
  rayJul.setAttribute("x2", String(xJul));
  rayJul.setAttribute("y2", String(earthY));

  const dPx = Math.max(1, earthY - starY);
  const half = Math.atan(baselineHalf / dPx);
  const down = Math.PI / 2;
  const start = down - half;
  const end = down + half;
  angleArc.setAttribute("d", arcPath(starX, starY, 42, start, end));

  angleLabel.setAttribute("x", String(starX));
  angleLabel.setAttribute("y", String(starY + 58));
  angleLabel.textContent = "2p (visual)";

  const detectorY = 490;
  const detectorHalf = 132;
  detectorTrack.setAttribute("x1", String(centerX - detectorHalf));
  detectorTrack.setAttribute("y1", String(detectorY));
  detectorTrack.setAttribute("x2", String(centerX + detectorHalf));
  detectorTrack.setAttribute("y2", String(detectorY));

  detectorCenter.setAttribute("x1", String(centerX));
  detectorCenter.setAttribute("y1", String(detectorY - 22));
  detectorCenter.setAttribute("x2", String(centerX));
  detectorCenter.setAttribute("y2", String(detectorY + 22));

  const offset = detectorOffsetPx(inputs.parallaxMas, detectorHalf - 14, 12);
  const janX = centerX - offset;
  const julX = centerX + offset;

  detectorMarkerJan.setAttribute("cx", janX.toFixed(2));
  detectorMarkerJan.setAttribute("cy", String(detectorY));
  detectorMarkerJul.setAttribute("cx", julX.toFixed(2));
  detectorMarkerJul.setAttribute("cy", String(detectorY));

  detectorJanLabel.setAttribute("x", janX.toFixed(2));
  detectorJanLabel.setAttribute("y", String(detectorY + 24));
  detectorJulLabel.setAttribute("x", julX.toFixed(2));
  detectorJulLabel.setAttribute("y", String(detectorY + 24));

  detectorLabel.textContent = `Apparent shift scales with p (current separation ${formatNumber(offset * 2, 1)} px)`;

  const roundedExaggeration = Math.max(1, Math.round(exaggeration));
  exaggerationNote.textContent = `Visual angle exaggeration $\\approx$ ${roundedExaggeration.toLocaleString("en-US")} $\\times$ for clarity.`;
  renderMath(exaggerationNote);

  if (distancePc >= 100) {
    distanceCue.textContent = "Tiny p means tiny apparent shift, so inferred distance d is very large.";
  } else if (distancePc >= 10) {
    distanceCue.textContent = "Moderate p gives a moderate shift and an intermediate distance d.";
  } else {
    distanceCue.textContent = "Large p gives a larger shift and indicates a nearby star.";
  }
}

function render() {
  const inputs = currentInputs();
  const pArcsec = parallaxArcsecFromMas(inputs.parallaxMas);
  const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(inputs.parallaxMas);
  const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
  const snr = signalToNoise(inputs.parallaxMas, inputs.sigmaMas);

  parallaxMasValue.textContent = `${Math.round(inputs.parallaxMas)} mas`;
  sigmaMasValue.textContent = `${formatNumber(inputs.sigmaMas, 1)} mas`;

  parallaxArcsecValue.textContent = formatNumber(pArcsec, 4);
  distancePcValue.textContent = Number.isFinite(dPc) ? formatNumber(dPc, 2) : "Infinity";
  distanceLyValue.textContent = Number.isFinite(dLy) ? formatNumber(dLy, 2) : "Infinity";
  snrValue.textContent = Number.isFinite(snr) ? formatNumber(snr, 1) : "—";
  snrQualityValue.textContent = describeMeasurability(snr);

  renderDiagram(inputs, dPc);
}

function exportResults(): ExportPayloadV1 {
  const inputs = currentInputs();
  const pArcsec = parallaxArcsecFromMas(inputs.parallaxMas);
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
      { name: "Signal-to-noise p/sigma_p", value: Number.isFinite(snr) ? formatNumber(snr, 6) : "—" },
      { name: "Measurement quality", value: describeMeasurability(snr) }
    ],
    notes: [
      "Parsec definition: d(pc) = 1 / p(arcsec).",
      "1 arcsec = 1000 mas.",
      "Stage geometry is schematic and visually exaggerates tiny angles."
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
          "Try preset stars to compare nearby and distant examples."
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
        label: "Add nearby star examples (sigma_p = 1 mas)",
        getRows() {
          return nearbyStars.map((s) => {
            const dPc = ParallaxDistanceModel.distanceParsecFromParallaxMas(s.parallaxMas);
            const dLy = ParallaxDistanceModel.distanceLyFromParsec(dPc);
            const snr = s.parallaxMas;
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

  for (const starPresetItem of nearbyStars) {
    const opt = document.createElement("option");
    opt.value = starPresetItem.name;
    opt.textContent = starPresetItem.name;
    starPreset.appendChild(opt);
  }

  starPreset.value = "";
}

populatePresetSelect();
render();

starPreset.addEventListener("change", () => {
  const selected = nearbyStars.find((item) => item.name === starPreset.value);
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
