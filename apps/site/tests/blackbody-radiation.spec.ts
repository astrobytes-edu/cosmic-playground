import { test, expect } from "@playwright/test";

test.describe("Blackbody Radiation -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/blackbody-radiation/", { waitUntil: "domcontentloaded" });
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

  test("spectrum canvas is present and has accessible label", async ({ page }) => {
    const canvas = page.locator("#spectrumCanvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("role", "img");
  });

  test("screenshot: default state (Sun temperature)", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("blackbody-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Temperature Slider ---

  test("temperature slider updates readouts", async ({ page }) => {
    const before = await page.locator("#peakNm").textContent();
    await page.locator("#tempSlider").fill("200");
    await page.locator("#tempSlider").dispatchEvent("input");
    const after = await page.locator("#peakNm").textContent();
    expect(after).not.toBe(before);
  });

  test("temperature slider updates star color preview", async ({ page }) => {
    await page.locator("#tempSlider").fill("100");
    await page.locator("#tempSlider").dispatchEvent("input");
    const color1 = await page.locator("#starCircle").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    await page.locator("#tempSlider").fill("900");
    await page.locator("#tempSlider").dispatchEvent("input");
    const color2 = await page.locator("#starCircle").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    expect(color1).not.toBe(color2);
  });

  // --- Preset Buttons ---

  test("Sun preset sets temperature to 5772 K", async ({ page }) => {
    await page.locator('button.preset[data-temp-k="5772"]').click();
    const text = await page.locator("#tempValue").textContent();
    expect(text).toContain("5772");
  });

  test("CMB preset sets temperature to 2.725 K", async ({ page }) => {
    await page.locator('button.preset[data-temp-k="2.725"]').click();
    // Display rounds to 0 decimal places: 2.725 -> "3 K"
    const text = await page.locator("#tempValue").textContent();
    expect(text).toContain("3");
    // Slider should be at minimum position (0)
    const sliderVal = await page.locator("#tempSlider").inputValue();
    expect(sliderVal).toBe("0");
  });

  test("screenshot: CMB preset", async ({ page }) => {
    await page.locator('button.preset[data-temp-k="2.725"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("blackbody-cmb.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Scale Toggle ---

  test("log/linear scale buttons toggle aria-pressed", async ({ page }) => {
    const logBtn = page.locator("#scaleLog");
    const linearBtn = page.locator("#scaleLinear");

    await expect(logBtn).toHaveAttribute("aria-pressed", "true");
    await expect(linearBtn).toHaveAttribute("aria-pressed", "false");

    await linearBtn.click();
    await expect(logBtn).toHaveAttribute("aria-pressed", "false");
    await expect(linearBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("screenshot: linear scale", async ({ page }) => {
    await page.locator("#scaleLinear").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("blackbody-linear.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Overlay Checkboxes ---

  test("visible band checkbox can be toggled", async ({ page }) => {
    const checkbox = page.locator("#showVisibleBand");
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("peak marker checkbox can be toggled", async ({ page }) => {
    const checkbox = page.locator("#showPeakMarker");
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(2);
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
      name: "Station Mode: Blackbody Radiation",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("blackbody-station.png", {
      maxDiffPixelRatio: 0.05,
    });
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
