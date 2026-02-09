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
  const parsed = Number((value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
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

function setRangeValue(selector: string, value: number) {
  const input = requiredElement<HTMLInputElement>(selector);
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function captureEpoch(phaseDeg: number, label: "A" | "B") {
  setRangeValue("#orbitPhaseScrub", phaseDeg);
  const button = requiredElement<HTMLButtonElement>(
    label === "A" ? "#captureEpochA" : "#captureEpochB"
  );
  button.click();
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

  it("captures two epochs, updates detector positions, and preserves inverse distance scaling", async () => {
    await import("./main");

    const captureBButton = requiredElement<HTMLButtonElement>("#captureEpochB");
    const parallaxMasReadout = requiredElement<HTMLElement>("#parallaxMas");
    const baselineEffReadout = requiredElement<HTMLElement>("#baselineEffAu");
    const detectorNow = requiredElement<SVGCircleElement>("#detectorNow");

    expect(captureBButton.disabled).toBe(true);

    const now0 = {
      x: Number(detectorNow.getAttribute("cx")),
      y: Number(detectorNow.getAttribute("cy"))
    };
    setRangeValue("#orbitPhaseScrub", 90);
    const now90 = {
      x: Number(detectorNow.getAttribute("cx")),
      y: Number(detectorNow.getAttribute("cy"))
    };
    expect(Math.abs(now90.x - now0.x) + Math.abs(now90.y - now0.y)).toBeGreaterThan(0.5);

    setRangeValue("#distancePcRange", 10);
    captureEpoch(0, "A");
    expect(captureBButton.disabled).toBe(false);
    captureEpoch(180, "B");

    const p10 = parseNumericText(parallaxMasReadout.textContent);
    const bEff = parseNumericText(baselineEffReadout.textContent);
    const sep10 = detectorSeparationPx();

    expect(bEff).toBeCloseTo(2, 2);
    expect(p10).toBeGreaterThan(0);
    expect(sep10).toBeGreaterThan(0);

    setRangeValue("#distancePcRange", 100);
    captureEpoch(0, "A");
    captureEpoch(180, "B");

    const p100 = parseNumericText(parallaxMasReadout.textContent);
    const sep100 = detectorSeparationPx();

    expect(p10 / p100).toBeGreaterThan(8.5);
    expect(p10 / p100).toBeLessThan(11.5);
    expect(sep10).toBeGreaterThan(sep100 * 2);
  });

  it("increasing sigma expands uncertainty visuals and lowers p/sigma", async () => {
    await import("./main");

    const snrReadout = requiredElement<HTMLElement>("#snr");
    const qualityReadout = requiredElement<HTMLElement>("#snrQuality");
    const errA = requiredElement<SVGCircleElement>("#errorCircleEpochA");

    setRangeValue("#distancePcRange", 10);

    setRangeValue("#sigmaMas", 0.5);
    captureEpoch(0, "A");
    captureEpoch(180, "B");
    const highSnr = parseNumericText(snrReadout.textContent);
    const smallErrorRadius = Number(errA.getAttribute("r"));

    setRangeValue("#sigmaMas", 20);
    captureEpoch(0, "A");
    captureEpoch(180, "B");
    const lowSnr = parseNumericText(snrReadout.textContent);
    const largeErrorRadius = Number(errA.getAttribute("r"));

    expect(lowSnr).toBeLessThan(highSnr);
    expect(largeErrorRadius).toBeGreaterThan(smallErrorRadius);
    expect(["Excellent", "Good", "Poor", "Not measurable"]).toContain(
      qualityReadout.textContent?.trim() || ""
    );
  });

  it("blink mode alternates captured visibility and exaggeration does not change inferred p or d", async () => {
    vi.useFakeTimers();
    await import("./main");

    const parallaxArcsec = requiredElement<HTMLElement>("#parallaxArcsec");
    const distancePc = requiredElement<HTMLElement>("#distancePc");
    const blinkToggle = requiredElement<HTMLInputElement>("#blinkMode");
    const detectorPanel = requiredElement<HTMLElement>("#detectorPanel");

    const markerA = requiredElement<SVGCircleElement>("#detectorMarkerEpochA");
    const markerB = requiredElement<SVGCircleElement>("#detectorMarkerEpochB");

    captureEpoch(0, "A");
    captureEpoch(180, "B");

    setRangeValue("#exaggeration", 5);
    const sepLowExaggeration = detectorSeparationPx();
    const pArcsecLow = parallaxArcsec.textContent;
    const dPcLow = distancePc.textContent;

    setRangeValue("#exaggeration", 30);
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

  it("keeps autoplay off and blink disabled under reduced motion", async () => {
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

    const playPause = requiredElement<HTMLButtonElement>("#playPauseOrbit");
    const blinkToggle = requiredElement<HTMLInputElement>("#blinkMode");
    const detectorPanel = requiredElement<HTMLElement>("#detectorPanel");
    const markerA = requiredElement<SVGCircleElement>("#detectorMarkerEpochA");
    const markerB = requiredElement<SVGCircleElement>("#detectorMarkerEpochB");

    expect(playPause.textContent).toContain("Play orbit");

    captureEpoch(0, "A");
    captureEpoch(180, "B");

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

  it("announces distance and capture workflow updates in live region", async () => {
    await import("./main");

    const beforeCount = runtimeSpies.setLiveRegionText.mock.calls.length;

    setRangeValue("#distancePcRange", 25);
    captureEpoch(0, "A");
    captureEpoch(180, "B");

    const afterCount = runtimeSpies.setLiveRegionText.mock.calls.length;
    expect(afterCount).toBeGreaterThan(beforeCount);

    const calls = runtimeSpies.setLiveRegionText.mock.calls.map((call) => String(call[1] ?? ""));
    expect(calls.some((message) => message.includes("Distance updated"))).toBe(true);
    expect(calls.some((message) => message.includes("Captured A"))).toBe(true);
    expect(calls.some((message) => message.includes("Captured B"))).toBe(true);
  });
});
