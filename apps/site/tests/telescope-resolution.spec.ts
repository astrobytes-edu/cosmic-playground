import { test, expect } from "@playwright/test";

test.describe("Telescope Resolution -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/telescope-resolution/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present and visible", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeVisible();
  });

  test("PSF canvas is present and has accessible label", async ({ page }) => {
    const canvas = page.locator("#canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("aria-label", "Point-spread function view");
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("telescope-resolution-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: atmosphere mode", async ({ page }) => {
    await page.locator("#includeAtmosphere").check();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("telescope-resolution-atmosphere.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("telescope-resolution-station.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Preset Selector ---

  test("telescope preset selector changes aperture readout", async ({ page }) => {
    const before = await page.locator("#apertureValue").textContent();
    // Select a different preset (Hubble = 2.4 m)
    await page.locator("#preset").selectOption("hubble");
    const after = await page.locator("#apertureValue").textContent();
    expect(after).not.toBe(before);
  });

  // --- Aperture Slider ---

  test("aperture slider updates aperture readout", async ({ page }) => {
    const before = await page.locator("#apertureValue").textContent();
    await page.locator("#aperture").fill("800");
    await page.locator("#aperture").dispatchEvent("input");
    const after = await page.locator("#apertureValue").textContent();
    expect(after).not.toBe(before);
  });

  test("aperture slider switches preset to Custom", async ({ page }) => {
    await page.locator("#preset").selectOption("hubble");
    await page.locator("#aperture").fill("800");
    await page.locator("#aperture").dispatchEvent("input");
    const presetVal = await page.locator("#preset").inputValue();
    expect(presetVal).toBe("custom");
  });

  // --- Wavelength Band Buttons ---

  test("wavelength band buttons are present", async ({ page }) => {
    const buttons = page.locator("#bands button.band");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("clicking a band button activates it", async ({ page }) => {
    const buttons = page.locator("#bands button.band");
    const secondBtn = buttons.nth(1);
    await secondBtn.click();
    await expect(secondBtn).toHaveAttribute("aria-pressed", "true");
  });

  // --- Binary Mode ---

  test("binary separation slider updates separation readout", async ({ page }) => {
    const before = await page.locator("#sepReadout").textContent();
    await page.locator("#separation").fill("300");
    await page.locator("#separation").dispatchEvent("input");
    const after = await page.locator("#sepReadout").textContent();
    expect(after).not.toBe(before);
  });

  test("disabling binary mode disables separation slider", async ({ page }) => {
    await page.locator("#binaryEnabled").uncheck();
    await expect(page.locator("#separation")).toBeDisabled();
  });

  test("disabling binary mode shows single-star status", async ({ page }) => {
    await page.locator("#binaryEnabled").uncheck();
    const status = await page.locator("#statusReadout").textContent();
    expect(status).toContain("Single");
  });

  // --- Atmosphere Controls ---

  test("atmosphere controls are hidden by default", async ({ page }) => {
    await expect(page.locator("#atmosphereControls")).toBeHidden();
  });

  test("enabling atmosphere shows atmosphere controls", async ({ page }) => {
    await page.locator("#includeAtmosphere").check();
    await expect(page.locator("#atmosphereControls")).toBeVisible();
  });

  test("seeing preset changes seeing slider value", async ({ page }) => {
    await page.locator("#includeAtmosphere").check();
    const before = await page.locator("#seeing").inputValue();
    await page.locator("#seeingPreset").selectOption("poor");
    const after = await page.locator("#seeing").inputValue();
    expect(after).not.toBe(before);
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // --- Accordion / Drawer ---

  test("What to notice accordion is open by default", async ({ page }) => {
    const firstAccordion = page.locator(".cp-accordion").first();
    await expect(firstAccordion).toHaveAttribute("open", "");
    await expect(firstAccordion).toContainText("What to notice");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
    await expect(modelNotes).toContainText("Model notes");
  });

  // --- Station Mode ---

  test("station mode button opens station dialog", async ({ page }) => {
    const stationBtn = page.locator("#stationMode");
    await expect(stationBtn).toBeVisible();
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Telescope Resolution",
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
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
  });

  test("help button opens help modal", async ({ page }) => {
    const helpBtn = page.locator("#help");
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
