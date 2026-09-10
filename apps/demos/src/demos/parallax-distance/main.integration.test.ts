/* @vitest-environment jsdom */

import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

/*
 * Timeouts here are set from measurement, not taste. See the beforeAll note below for
 * where the time goes; these are the ceilings, and they exist because this file is the
 * one place in the demos suite whose cost is a module graph rather than a few assertions.
 *
 * Measured 2026-09-09 on a 12-core machine, idle vs. under a deliberately harsh stressor
 * (the full Playwright E2E suite running concurrently PLUS 24 busy loops, so roughly 3x
 * oversubscription -- harsher than the condition that first broke this):
 *
 *                idle     under load          stretch
 *   beforeAll     180ms    12.5s/28.5s/12.5s  70-158x
 *   slowest test   38ms    2.9s               ~75x
 *
 * 60s for the hook is ~2x the worst observed; 20s per test is ~7x. Both are far above
 * anything the work can legitimately cost, so they trip only on a genuine hang -- which
 * is what a timeout is for. The default 5s did not survive the stretch, and a test that
 * fails for want of CPU costs a real investigation every time it happens.
 */
describe("Parallax Distance -- DOM integration", { timeout: 20000 }, () => {
  /*
   * Pay for the module graph once, in a hook, instead of billing it to whichever test
   * happens to run first.
   *
   * Every test here does `vi.resetModules()` then `await import("./main")`, because each
   * one needs a fresh module instance wired to a freshly mounted DOM. Only the FIRST of
   * those imports is expensive: it transforms main.ts and everything it pulls in
   * (@cosmic/physics, @cosmic/runtime, @cosmic/data-astr101). Measured 2026-09-09 inside
   * the first test -- import 167.4ms, assertions 10.4ms. `resetModules` clears the module
   * registry but not Vite's transform cache, so the other five imports cost 11-21ms.
   *
   * The effect was that "captures two epochs..." looked like a 406ms test when it is a
   * 10ms test standing behind a 167ms import -- and at 406ms it was the slowest test in
   * the repo by 18x (next slowest: 22ms) and 44% of the entire suite's 915ms of test
   * time. On 2026-09-09 it stretched past the 5s default and failed, while the assertions
   * it was timing had never stopped passing.
   *
   * Importing here concentrates that one-off cost in a single place with a single ceiling
   * and leaves each test's budget covering only its own ~10-20ms of work: idle, the first
   * test drops from 406ms to 38ms and the file stops being the suite's outlier. The
   * instance this creates is discarded -- `beforeEach` resets the module registry and
   * replaces document.body, so no test ever sees it.
   *
   * Worth recording that this hook ALONE did not fix the flake. Moving a load-sensitive
   * 167ms from a 5s budget to the default 10s hook budget just relocated the failure, and
   * made it quieter: a failed beforeAll SKIPS all six tests rather than failing two. Under
   * the stressor it timed out 3 runs out of 3. The measured ceilings above are the other
   * half of the fix, and neither half is sufficient on its own.
   */
  beforeAll(async () => {
    mountDemoHtml();
    await import("./main");
  }, 60000);

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

  it("shows baseline-too-small guidance and placeholder inferred readouts", async () => {
    await import("./main");

    const detectorSeparationLabel = requiredElement<SVGTextElement>("#detectorSeparationLabel");
    const degenerateWarningLabel = requiredElement<SVGTextElement>("#degenerateWarningLabel");
    const parallaxMasReadout = requiredElement<HTMLElement>("#parallaxMas");
    const parallaxArcsecReadout = requiredElement<HTMLElement>("#parallaxArcsec");
    const distancePcReadout = requiredElement<HTMLElement>("#distancePc");

    setRangeValue("#distancePcRange", 10);
    captureEpoch(90, "A");
    captureEpoch(270, "B");

    expect(detectorSeparationLabel.textContent).toContain("baseline too small");
    expect(detectorSeparationLabel.textContent).toContain("stable inference");
    expect(degenerateWarningLabel.textContent).toContain(
      "Increase capture separation along the parallax axis."
    );

    expect(parallaxMasReadout.textContent?.trim()).toBe("—");
    expect(parallaxArcsecReadout.textContent?.trim()).toBe("—");
    expect(distancePcReadout.textContent?.trim()).toBe("—");
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
