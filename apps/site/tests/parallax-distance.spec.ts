import { test, expect } from "@playwright/test";

function parseNumeric(text: string | null): number {
  if (!text) return Number.NaN;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

test.describe("Parallax Distance -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/parallax-distance/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present and visible", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeVisible();
  });

  test("both orbit and detector panels render with expected labels", async ({ page }) => {
    const orbitSvg = page.locator("#orbitSvg");
    await expect(orbitSvg).toHaveAttribute("viewBox", "0 0 560 420");
    await expect(orbitSvg).toHaveAttribute("role", "img");
    await expect(orbitSvg).toHaveAttribute(
      "aria-label",
      "Top view showing Sun, Earth orbit, two observation epochs, and line-of-sight rays"
    );

    const detectorSvg = page.locator("#detectorSvg");
    await expect(detectorSvg).toHaveAttribute("viewBox", "0 0 560 420");
    await expect(detectorSvg).toHaveAttribute("role", "img");
    await expect(detectorSvg).toHaveAttribute(
      "aria-label",
      "Detector sky view with fixed background stars and two apparent target positions"
    );

    await expect(page.locator(".viz-panel .panel-title").first()).toHaveText(
      "View from Above (orbit geometry)"
    );
    await expect(page.locator(".viz-panel .panel-title").nth(1)).toHaveText(
      "As Seen on the Sky / Detector (observable shift)"
    );
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("parallax-distance-default.png", {
      maxDiffPixelRatio: 0.05
    });
  });

  test.skip("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("parallax-distance-station.png", {
      maxDiffPixelRatio: 0.05
    });
  });

  // --- Distance-first Interaction ---

  test("distance slider updates inferred parallax and distance readouts inversely", async ({
    page
  }) => {
    await page.locator("#distancePcRange").fill("10");
    await page.locator("#distancePcRange").dispatchEvent("input");

    const pNear = parseNumeric(await page.locator("#parallaxMas").textContent());
    const dNear = parseNumeric(await page.locator("#distancePc").textContent());

    await page.locator("#distancePcRange").fill("100");
    await page.locator("#distancePcRange").dispatchEvent("input");

    const pFar = parseNumeric(await page.locator("#parallaxMas").textContent());
    const dFar = parseNumeric(await page.locator("#distancePc").textContent());

    expect(pFar).toBeLessThan(pNear);
    expect(dFar).toBeGreaterThan(dNear);
  });

  test("sigma slider updates sigma readout", async ({ page }) => {
    const before = await page.locator("#sigmaMasValue").textContent();
    await page.locator("#sigmaMas").fill("10");
    await page.locator("#sigmaMas").dispatchEvent("input");
    const after = await page.locator("#sigmaMasValue").textContent();
    expect(after).not.toBe(before);
  });

  test("changing orbital phase moves detector marker smoothly", async ({ page }) => {
    await page.locator("#phaseDeg").fill("0");
    await page.locator("#phaseDeg").dispatchEvent("input");

    const beforeCx = await page.locator("#detectorMarkerEpochA").getAttribute("cx");
    const beforeCy = await page.locator("#detectorMarkerEpochA").getAttribute("cy");

    await page.locator("#phaseDeg").fill("90");
    await page.locator("#phaseDeg").dispatchEvent("input");

    const afterCx = await page.locator("#detectorMarkerEpochA").getAttribute("cx");
    const afterCy = await page.locator("#detectorMarkerEpochA").getAttribute("cy");

    expect(afterCx).not.toBe(beforeCx);
    expect(afterCy).not.toBe(beforeCy);
  });

  // --- Preset Selection ---

  test("selecting a preset updates distance input and inferred readouts", async ({ page }) => {
    const options = page.locator("#starPreset option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    await page.locator("#starPreset").selectOption({ index: 1 });

    const distancePc = parseNumeric(await page.locator("#distancePcInput").inputValue());
    const parallaxMas = parseNumeric(await page.locator("#parallaxMas").textContent());
    expect(distancePc).toBeGreaterThan(0);
    expect(parallaxMas).toBeGreaterThan(0);
  });

  test("manual distance change clears preset to Custom", async ({ page }) => {
    await page.locator("#starPreset").selectOption({ index: 1 });
    const presetBefore = await page.locator("#starPreset").inputValue();
    expect(presetBefore).not.toBe("");

    await page.locator("#distancePcInput").fill("42");
    await page.locator("#distancePcInput").dispatchEvent("input");

    const presetAfter = await page.locator("#starPreset").inputValue();
    expect(presetAfter).toBe("");
  });

  test("cycling through all presets does not produce errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    const options = page.locator("#starPreset option");
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      await page.locator("#starPreset").selectOption({ index: i });
      const distanceValue = await page.locator("#distancePcValue").textContent();
      expect(distanceValue?.trim().length).toBeGreaterThan(0);
    }

    expect(errors).toEqual([]);
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  // --- Shelf Tabs ---

  test("What to notice tab is active by default", async ({ page }) => {
    await expect(page.locator("#tab-btn-notice")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-notice")).toBeVisible();
    await expect(page.locator("#tab-notice")).toContainText("Cause:");
  });

  test("Model notes tab can be opened", async ({ page }) => {
    const modelTab = page.locator("#tab-btn-model");
    await modelTab.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#tab-btn-model")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-model")).toBeVisible();
    await expect(page.locator("#tab-model")).toContainText("Small-angle parallax relation");
  });

  // --- Station Mode ---

  test("station mode button opens station dialog", async ({ page }) => {
    const stationBtn = page.locator("#stationMode");
    await expect(stationBtn).toBeVisible();
    await expect(stationBtn).toBeEnabled();
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Parallax Distance"
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  // --- Accessibility ---

  test("status region has aria-live for announcements", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("role", "status");
  });

  test("controls panel has accessible label", async ({ page }) => {
    const controls = page.locator(".cp-demo__sidebar");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts");
  });

  test("help button opens help modal", async ({ page }) => {
    const helpBtn = page.locator("#help");
    await expect(helpBtn).toBeVisible();
    await expect(helpBtn).toBeEnabled();
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
