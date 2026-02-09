import { expect, test, type Page } from "@playwright/test";

function parseNumeric(text: string | null): number {
  if (!text) return Number.NaN;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

async function setRange(page: Page, selector: string, value: number) {
  await page.locator(selector).fill(String(value));
  await page.locator(selector).dispatchEvent("input");
}

async function captureEpoch(
  page: Page,
  phaseDeg: number,
  label: "A" | "B"
) {
  await setRange(page, "#orbitPhaseScrub", phaseDeg);
  await page.locator(label === "A" ? "#captureEpochA" : "#captureEpochB").click();
}

test.describe("Parallax Distance -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/parallax-distance/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  test("demo loads with shell sections and updated panel labels", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();

    await expect(page.locator(".viz-panel .panel-title").first()).toHaveText(
      "Cause: Orbit Geometry (Top View)"
    );
    await expect(page.locator(".viz-panel .panel-title").nth(1)).toHaveText(
      "Observable: Detector/Sky Shift"
    );

    await expect(page.locator("#orbitSvg")).toHaveAttribute(
      "aria-label",
      "Top view showing Sun, moving Earth, target direction, parallax axis, and captured baseline"
    );
    await expect(page.locator("#detectorSvg")).toHaveAttribute(
      "aria-label",
      "Detector view with fixed background stars and live plus captured apparent positions"
    );
  });

  test("distance increase reduces measured shift after capture workflow", async ({ page }) => {
    await setRange(page, "#distancePcRange", 10);
    await captureEpoch(page, 0, "A");
    await captureEpoch(page, 180, "B");

    const deltaNear = parseNumeric(await page.locator("#deltaThetaMas").textContent());
    const pNear = parseNumeric(await page.locator("#parallaxMas").textContent());
    const dNear = parseNumeric(await page.locator("#distancePc").textContent());
    const bEff = parseNumeric(await page.locator("#baselineEffAu").textContent());

    await setRange(page, "#distancePcRange", 100);
    await captureEpoch(page, 0, "A");
    await captureEpoch(page, 180, "B");

    const deltaFar = parseNumeric(await page.locator("#deltaThetaMas").textContent());
    const pFar = parseNumeric(await page.locator("#parallaxMas").textContent());
    const dFar = parseNumeric(await page.locator("#distancePc").textContent());

    expect(bEff).toBeGreaterThan(1.9);
    expect(deltaNear).toBeGreaterThan(deltaFar);
    expect(pNear).toBeGreaterThan(pFar);
    expect(dFar).toBeGreaterThan(dNear);
  });

  test("workflow stepper and capture controls enforce A then B flow", async ({ page }) => {
    await expect(page.locator("#captureEpochB")).toBeDisabled();
    await expect(page.locator("#stepCaptureA")).toHaveAttribute("data-step-state", "current");
    await expect(page.locator("#stepCaptureB")).toHaveAttribute("data-step-state", "pending");

    await captureEpoch(page, 0, "A");
    await expect(page.locator("#captureEpochB")).toBeEnabled();
    await expect(page.locator("#stepCaptureA")).toHaveAttribute("data-step-state", "complete");
    await expect(page.locator("#stepCaptureB")).toHaveAttribute("data-step-state", "current");

    await captureEpoch(page, 180, "B");
    await expect(page.locator("#stepCaptureB")).toHaveAttribute("data-step-state", "complete");
  });

  test("difference and blink modes change visualization state only", async ({ page }) => {
    await captureEpoch(page, 0, "A");
    await captureEpoch(page, 180, "B");

    await setRange(page, "#exaggeration", 5);
    const pLow = await page.locator("#parallaxMas").textContent();
    const dLow = await page.locator("#distancePc").textContent();
    const xALow = Number(await page.locator("#detectorMarkerEpochA").getAttribute("cx"));
    const xBLow = Number(await page.locator("#detectorMarkerEpochB").getAttribute("cx"));
    const sepLow = Math.abs(xBLow - xALow);

    await setRange(page, "#exaggeration", 30);
    const pHigh = await page.locator("#parallaxMas").textContent();
    const dHigh = await page.locator("#distancePc").textContent();
    const xAHigh = Number(await page.locator("#detectorMarkerEpochA").getAttribute("cx"));
    const xBHigh = Number(await page.locator("#detectorMarkerEpochB").getAttribute("cx"));
    const sepHigh = Math.abs(xBHigh - xAHigh);

    expect(sepHigh).toBeGreaterThan(sepLow * 2);
    expect(pHigh).toBe(pLow);
    expect(dHigh).toBe(dLow);

    await page.locator("#detectorModeDifference").click();
    await expect(page.locator("#detectorPanel")).toHaveAttribute(
      "data-detector-mode",
      "difference"
    );

    await page.locator("#blinkMode").check();
    await expect(page.locator("#detectorPanel")).toHaveAttribute("data-blink", "on");
  });

  test("station mode exposes distance-first snapshot columns", async ({ page }) => {
    await page.locator("#stationMode").click();
    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Parallax Distance"
    });
    await expect(stationDialog).toBeVisible();

    await expect(stationDialog).toContainText("d_true (pc)");
    await expect(stationDialog).toContainText("Measured deltaTheta (mas)");
    await expect(stationDialog).toContainText("B_eff (AU)");
    await expect(stationDialog).toContainText("Inferred d_hat (pc)");
  });

  test("keyboard shortcuts support play/pause and capture workflow", async ({ page }) => {
    await page.keyboard.press("Space");
    await expect(page.locator("#playPauseOrbit")).toContainText("Play orbit");

    await setRange(page, "#orbitPhaseScrub", 0);
    await page.locator("#orbitSvg").click();
    await page.keyboard.press("a");
    await setRange(page, "#orbitPhaseScrub", 180);
    await page.locator("#orbitSvg").click();
    await page.keyboard.press("b");

    await expect(page.locator("#status")).toContainText("Captured B");
    const pHat = parseNumeric(await page.locator("#parallaxMas").textContent());
    expect(Number.isFinite(pHat)).toBe(true);
  });

  test("status region and readouts keep accessibility labels", async ({ page }) => {
    await expect(page.locator("#status")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("#status")).toHaveAttribute("role", "status");
    await expect(page.locator(".cp-demo__sidebar")).toHaveAttribute(
      "aria-label",
      "Controls panel"
    );
    await expect(page.locator(".cp-demo__readouts")).toHaveAttribute("aria-label", "Readouts");
  });
});
