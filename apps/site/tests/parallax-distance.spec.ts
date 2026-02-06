import { test, expect } from "@playwright/test";

test.describe("Parallax Distance -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/parallax-distance/", { waitUntil: "domcontentloaded" });
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

  test("SVG stage has correct viewBox and accessible label", async ({ page }) => {
    const svg = page.locator("#diagram");
    await expect(svg).toHaveAttribute("viewBox", "0 0 900 520");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute(
      "aria-label",
      "Parallax triangle diagram with two observation points and a star"
    );
  });

  test("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("parallax-distance-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Slider Interaction ---

  test("parallax slider updates readouts when moved", async ({ page }) => {
    const before = await page.locator("#parallaxArcsec").textContent();
    await page.locator("#parallaxMas").fill("500");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const after = await page.locator("#parallaxArcsec").textContent();
    expect(after).not.toBe(before);
  });

  test("sigma slider updates sigma readout", async ({ page }) => {
    const before = await page.locator("#sigmaMasValue").textContent();
    await page.locator("#sigmaMas").fill("10");
    await page.locator("#sigmaMas").dispatchEvent("input");
    const after = await page.locator("#sigmaMasValue").textContent();
    expect(after).not.toBe(before);
  });

  test("moving parallax slider updates distance readouts inversely", async ({ page }) => {
    await page.locator("#parallaxMas").fill("100");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const dPc100 = await page.locator("#distancePc").textContent();

    await page.locator("#parallaxMas").fill("10");
    await page.locator("#parallaxMas").dispatchEvent("input");
    const dPc10 = await page.locator("#distancePc").textContent();

    expect(parseFloat(dPc10 ?? "0")).toBeGreaterThan(parseFloat(dPc100 ?? "0"));
  });

  // --- Preset Selection ---

  test("selecting a preset updates parallax slider", async ({ page }) => {
    const options = page.locator("#starPreset option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    await page.locator("#starPreset").selectOption({ index: 1 });
    const parallaxVal = await page.locator("#parallaxMas").inputValue();
    expect(parseInt(parallaxVal)).toBeGreaterThan(0);
  });

  test("manual slider movement clears preset to Custom", async ({ page }) => {
    await page.locator("#starPreset").selectOption({ index: 1 });
    const presetBefore = await page.locator("#starPreset").inputValue();
    expect(presetBefore).not.toBe("");

    await page.locator("#parallaxMas").fill("42");
    await page.locator("#parallaxMas").dispatchEvent("input");
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
      const pArcsec = await page.locator("#parallaxArcsec").textContent();
      expect(pArcsec?.trim().length).toBeGreaterThan(0);
    }

    expect(errors).toEqual([]);
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
    await expect(stationBtn).toBeEnabled();
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Parallax Distance",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("parallax-distance-station.png", {
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
    await expect(helpBtn).toBeEnabled();
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
