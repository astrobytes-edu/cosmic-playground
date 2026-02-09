/* @vitest-environment jsdom */

import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runtimeSpies = {
  bindButtons: vi.fn(),
  copyResults: vi.fn(async () => undefined),
  initMath: vi.fn(),
  initPopovers: vi.fn(),
  initStarfield: vi.fn(),
  initTabs: vi.fn(),
  setLiveRegionText: vi.fn((element: HTMLElement, message: string) => {
    element.textContent = message;
  })
};

vi.mock("@cosmic/runtime", () => ({
  createDemoModes: () => ({
    bindButtons: runtimeSpies.bindButtons
  }),
  createInstrumentRuntime: () => ({
    copyResults: runtimeSpies.copyResults
  }),
  initMath: runtimeSpies.initMath,
  initPopovers: runtimeSpies.initPopovers,
  initStarfield: runtimeSpies.initStarfield,
  initTabs: runtimeSpies.initTabs,
  setLiveRegionText: runtimeSpies.setLiveRegionText
}));

vi.mock("@cosmic/data-astr101", () => ({
  nearbyStars: [
    { name: "Proxima Centauri", parallaxMas: 768.5 },
    { name: "Vega", parallaxMas: 130.2 },
    { name: "Far Probe", parallaxMas: 5.2 }
  ]
}));

function mountDemoHtml() {
  const htmlPath = path.resolve(__dirname, "index.html");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!bodyMatch) {
    throw new Error("Failed to parse <body> from parallax index.html");
  }

  const bodyHtml = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "");
  document.body.innerHTML = bodyHtml;
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element in integration test: ${selector}`);
  }
  return element;
}

function parseNumericText(value: string | null): number {
  return Number((value ?? "").replace(/,/g, "").trim());
}

function detectorSeparationPx(): number {
  const markerA = requiredElement<SVGCircleElement>("#detectorMarkerEpochA");
  const markerB = requiredElement<SVGCircleElement>("#detectorMarkerEpochB");

  const xA = Number(markerA.getAttribute("cx"));
  const yA = Number(markerA.getAttribute("cy"));
  const xB = Number(markerB.getAttribute("cx"));
  const yB = Number(markerB.getAttribute("cy"));

  return Math.hypot(xB - xA, yB - yA);
}

describe("Parallax Distance -- DOM integration", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const spy of Object.values(runtimeSpies)) {
      spy.mockClear();
    }
    mountDemoHtml();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves detector positions periodically with phase and preserves inverse distance scaling", async () => {
    await import("./main");

    const phaseSlider = requiredElement<HTMLInputElement>("#phaseDeg");
    const distanceSlider = requiredElement<HTMLInputElement>("#distancePcRange");
    const parallaxMasReadout = requiredElement<HTMLElement>("#parallaxMas");

    const markerA = requiredElement<SVGCircleElement>("#detectorMarkerEpochA");
    const markerB = requiredElement<SVGCircleElement>("#detectorMarkerEpochB");

    const setPhase = (value: number) => {
      phaseSlider.value = String(value);
      phaseSlider.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const setDistancePc = (value: number) => {
      distanceSlider.value = String(value);
      distanceSlider.dispatchEvent(new Event("input", { bubbles: true }));
    };

    setDistancePc(10);
    setPhase(0);
    const phase0 = {
      x: Number(markerA.getAttribute("cx")),
      y: Number(markerA.getAttribute("cy"))
    };

    setPhase(90);
    const phase90 = {
      x: Number(markerA.getAttribute("cx")),
      y: Number(markerA.getAttribute("cy"))
    };

    setPhase(360);
    const phase360 = {
      x: Number(markerA.getAttribute("cx")),
      y: Number(markerA.getAttribute("cy"))
    };

    expect(Math.abs(phase0.x - phase90.x) + Math.abs(phase0.y - phase90.y)).toBeGreaterThan(0.5);
    expect(phase360.x).toBeCloseTo(phase0.x, 4);
    expect(phase360.y).toBeCloseTo(phase0.y, 4);

    setPhase(0);
    setDistancePc(10);
    const p10 = parseNumericText(parallaxMasReadout.textContent);
    const sep10 = detectorSeparationPx();

    setDistancePc(100);
    const p100 = parseNumericText(parallaxMasReadout.textContent);
    const sep100 = detectorSeparationPx();

    expect(p10 / p100).toBeCloseTo(10, 2);
    expect(sep10).toBeGreaterThan(sep100 * 5);

    expect(Math.abs(Number(markerA.getAttribute("cx")) - Number(markerB.getAttribute("cx")))).toBeGreaterThan(
      0.1
    );
  });

  it("increasing sigma expands uncertainty visuals and lowers p/sigma", async () => {
    await import("./main");

    const sigmaSlider = requiredElement<HTMLInputElement>("#sigmaMas");
    const snrReadout = requiredElement<HTMLElement>("#snr");
    const qualityReadout = requiredElement<HTMLElement>("#snrQuality");
    const errA = requiredElement<SVGCircleElement>("#errorCircleEpochA");

    const setSigma = (value: number) => {
      sigmaSlider.value = String(value);
      sigmaSlider.dispatchEvent(new Event("input", { bubbles: true }));
    };

    setSigma(0.5);
    const highSnr = parseNumericText(snrReadout.textContent);
    const smallErrorRadius = Number(errA.getAttribute("r"));

    setSigma(20);
    const lowSnr = parseNumericText(snrReadout.textContent);
    const largeErrorRadius = Number(errA.getAttribute("r"));

    expect(lowSnr).toBeLessThan(highSnr);
    expect(largeErrorRadius).toBeGreaterThan(smallErrorRadius);
    expect(["Excellent", "Good", "Poor", "Not measurable"]).toContain(
      qualityReadout.textContent?.trim() || ""
    );
  });

  it("blink mode alternates visible markers and exaggeration does not change computed p or d", async () => {
    vi.useFakeTimers();
    await import("./main");

    const exaggerationSlider = requiredElement<HTMLInputElement>("#exaggeration");
    const parallaxArcsec = requiredElement<HTMLElement>("#parallaxArcsec");
    const distancePc = requiredElement<HTMLElement>("#distancePc");
    const blinkToggle = requiredElement<HTMLInputElement>("#blinkMode");
    const detectorPanel = requiredElement<HTMLElement>("#detectorPanel");

    const markerA = requiredElement<SVGCircleElement>("#detectorMarkerEpochA");
    const markerB = requiredElement<SVGCircleElement>("#detectorMarkerEpochB");

    const setExaggeration = (value: number) => {
      exaggerationSlider.value = String(value);
      exaggerationSlider.dispatchEvent(new Event("input", { bubbles: true }));
    };

    setExaggeration(5);
    const sepLowExaggeration = detectorSeparationPx();
    const pArcsecLow = parallaxArcsec.textContent;
    const dPcLow = distancePc.textContent;

    setExaggeration(30);
    const sepHighExaggeration = detectorSeparationPx();
    const pArcsecHigh = parallaxArcsec.textContent;
    const dPcHigh = distancePc.textContent;

    expect(sepHighExaggeration).toBeGreaterThan(sepLowExaggeration * 2);
    expect(pArcsecHigh).toBe(pArcsecLow);
    expect(dPcHigh).toBe(dPcLow);

    blinkToggle.checked = true;
    blinkToggle.dispatchEvent(new Event("change", { bubbles: true }));

    expect(detectorPanel.dataset.blink).toBe("on");
    const initialA = markerA.getAttribute("visibility");
    const initialB = markerB.getAttribute("visibility");

    vi.advanceTimersByTime(500);

    const nextA = markerA.getAttribute("visibility");
    const nextB = markerB.getAttribute("visibility");

    expect(nextA).not.toBe(initialA);
    expect(nextB).not.toBe(initialB);

    expect(runtimeSpies.initTabs).toHaveBeenCalledTimes(1);
    expect(runtimeSpies.initPopovers).toHaveBeenCalledTimes(1);
    expect(runtimeSpies.initStarfield).toHaveBeenCalledTimes(1);
  });

  it("keeps both epochs visible when reduced motion is enabled and blink is toggled", async () => {
    const originalMatchMedia = window.matchMedia;

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn().mockReturnValue(true)
      }))
    });

    await import("./main");

    const blinkToggle = requiredElement<HTMLInputElement>("#blinkMode");
    const detectorPanel = requiredElement<HTMLElement>("#detectorPanel");
    const markerA = requiredElement<SVGCircleElement>("#detectorMarkerEpochA");
    const markerB = requiredElement<SVGCircleElement>("#detectorMarkerEpochB");

    blinkToggle.checked = true;
    blinkToggle.dispatchEvent(new Event("change", { bubbles: true }));

    expect(detectorPanel.dataset.blink).toBe("off");
    expect(markerA.getAttribute("visibility")).toBe("visible");
    expect(markerB.getAttribute("visibility")).toBe("visible");

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia
    });
  });

  it("announces measurement updates for interaction changes", async () => {
    vi.useFakeTimers();
    await import("./main");

    const distanceSlider = requiredElement<HTMLInputElement>("#distancePcRange");
    const phaseSlider = requiredElement<HTMLInputElement>("#phaseDeg");
    const beforeCount = runtimeSpies.setLiveRegionText.mock.calls.length;

    distanceSlider.value = "25";
    distanceSlider.dispatchEvent(new Event("input", { bubbles: true }));

    phaseSlider.value = "45";
    phaseSlider.dispatchEvent(new Event("input", { bubbles: true }));

    vi.advanceTimersByTime(300);

    const afterCount = runtimeSpies.setLiveRegionText.mock.calls.length;
    expect(afterCount).toBeGreaterThan(beforeCount);

    const lastMessage = String(runtimeSpies.setLiveRegionText.mock.calls.at(-1)?.[1] ?? "");
    expect(lastMessage).toContain("p");
    expect(lastMessage).toContain("pc");
    expect(lastMessage).toContain("quality");
  });
});
