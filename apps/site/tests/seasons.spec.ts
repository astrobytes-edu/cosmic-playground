import { test, expect } from "@playwright/test";

test.describe("Seasons -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/seasons/", { waitUntil: "domcontentloaded" });
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
    const svg = page.locator("#seasonStage");
    await expect(svg).toHaveAttribute("viewBox", "0 0 920 420");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute(
      "aria-label",
      "Seasons visualization (orbit + sunlight geometry)"
    );
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("seasons-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("seasons-station.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Slider Interaction ---

  test("day-of-year slider updates date readout", async ({ page }) => {
    const before = await page.locator("#dateValue").textContent();
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const after = await page.locator("#dateValue").textContent();
    expect(after).not.toBe(before);
  });

  test("tilt slider updates declination readout", async ({ page }) => {
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const before = await page.locator("#declinationValue").textContent();

    await page.locator("#tilt").fill("10");
    await page.locator("#tilt").dispatchEvent("input");
    const after = await page.locator("#declinationValue").textContent();
    expect(after).not.toBe(before);
  });

  test("latitude slider updates noon altitude readout", async ({ page }) => {
    const before = await page.locator("#noonAltitudeValue").textContent();
    await page.locator("#latitude").fill("60");
    await page.locator("#latitude").dispatchEvent("input");
    const after = await page.locator("#noonAltitudeValue").textContent();
    expect(after).not.toBe(before);
  });

  // --- Anchor Buttons ---

  test("anchor buttons set day-of-year to expected values", async ({ page }) => {
    await page.locator("#anchorJunSol").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("172");

    await page.locator("#anchorMarEqx").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("80");

    await page.locator("#anchorSepEqx").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("266");

    await page.locator("#anchorDecSol").click();
    expect(await page.locator("#dayOfYear").inputValue()).toBe("356");
  });

  // --- Season Labels ---

  test("March equinox shows Spring/Autumn", async ({ page }) => {
    await page.locator("#anchorMarEqx").click();
    await expect(page.locator("#seasonNorthValue")).toHaveText("Spring");
    await expect(page.locator("#seasonSouthValue")).toHaveText("Autumn");
  });

  test("June solstice shows Summer/Winter", async ({ page }) => {
    await page.locator("#anchorJunSol").click();
    await expect(page.locator("#seasonNorthValue")).toHaveText("Summer");
    await expect(page.locator("#seasonSouthValue")).toHaveText("Winter");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(4);
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
      name: "Station Mode: Seasons",
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
    await expect(helpBtn).toBeEnabled();
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
