/* @vitest-environment jsdom */

import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const runtimeSpies = {
  bindButtons: vi.fn(),
  copyResults: vi.fn(async () => undefined),
  initMath: vi.fn(),
  renderMath: vi.fn(),
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
  renderMath: runtimeSpies.renderMath,
  initPopovers: runtimeSpies.initPopovers,
  initStarfield: runtimeSpies.initStarfield,
  initTabs: runtimeSpies.initTabs,
  setLiveRegionText: runtimeSpies.setLiveRegionText
}));

vi.mock("@cosmic/data-astr101", () => ({
  nearbyStars: [
    { name: "Alpha Centauri", parallaxMas: 747.1 },
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

describe("Parallax Distance -- DOM integration", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const spy of Object.values(runtimeSpies)) {
      spy.mockClear();
    }
    mountDemoHtml();
  });

  it("keeps presets, slider, geometry, and readouts synchronized", async () => {
    await import("./main.ts");

    const parallaxSlider = requiredElement<HTMLInputElement>("#parallaxMas");
    const presetSelect = requiredElement<HTMLSelectElement>("#starPreset");
    const starNode = requiredElement<SVGCircleElement>("#star");
    const detectorJan = requiredElement<SVGCircleElement>("#detectorMarkerJan");
    const detectorJul = requiredElement<SVGCircleElement>("#detectorMarkerJul");
    const distancePc = requiredElement<HTMLElement>("#distancePc");
    const parallaxValue = requiredElement<HTMLElement>("#parallaxMasValue");

    const currentState = () => ({
      starY: Number(starNode.getAttribute("cy")),
      detectorSeparation: Math.abs(
        Number(detectorJul.getAttribute("cx")) - Number(detectorJan.getAttribute("cx"))
      ),
      distancePc: Number(distancePc.textContent || "NaN")
    });

    parallaxSlider.value = "1000";
    parallaxSlider.dispatchEvent(new Event("input", { bubbles: true }));
    const nearState = currentState();

    parallaxSlider.value = "1";
    parallaxSlider.dispatchEvent(new Event("input", { bubbles: true }));
    const farState = currentState();

    expect(farState.distancePc).toBeGreaterThan(nearState.distancePc);
    expect(farState.detectorSeparation).toBeLessThan(nearState.detectorSeparation);
    expect(farState.starY).toBeLessThan(nearState.starY);

    presetSelect.value = "Vega";
    presetSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(parallaxSlider.value).toBe("130");
    expect(parallaxValue.textContent).toContain("130 mas");
    expect(Number(distancePc.textContent || "NaN")).toBeGreaterThan(0);

    expect(runtimeSpies.initTabs).toHaveBeenCalledTimes(1);
    expect(runtimeSpies.initPopovers).toHaveBeenCalledTimes(1);
    expect(runtimeSpies.initStarfield).toHaveBeenCalledTimes(1);
    expect(runtimeSpies.renderMath).toHaveBeenCalled();
  });
});
