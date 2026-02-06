import { expect, test } from "@playwright/test";

test.describe("EOS Lab -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/eos-lab/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  test("demo loads with viz-first shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present and visible", async ({ page }) => {
    await expect(page.locator("canvas.cp-starfield")).toBeVisible();
  });

  test("math is rendered through KaTeX", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 });
    await expect(page.locator(".katex").first()).toBeVisible();
  });

  test("temperature slider updates pressure readouts", async ({ page }) => {
    const before = await page.locator("#pRadValue").textContent();
    await page.locator("#tempSlider").fill("950");
    await page.locator("#tempSlider").dispatchEvent("input");
    const after = await page.locator("#pRadValue").textContent();
    expect(after).not.toBe(before);
  });

  test("density slider updates pressure readouts", async ({ page }) => {
    const before = await page.locator("#pDegValue").textContent();
    await page.locator("#rhoSlider").fill("950");
    await page.locator("#rhoSlider").dispatchEvent("input");
    const after = await page.locator("#pDegValue").textContent();
    expect(after).not.toBe(before);
  });

  test("composition sliders update mu readout", async ({ page }) => {
    const before = await page.locator("#muValue").textContent();
    await page.locator("#xSlider").fill("850");
    await page.locator("#xSlider").dispatchEvent("input");
    const after = await page.locator("#muValue").textContent();
    expect(after).not.toBe(before);
  });

  test("composition constraints keep X + Y + Z = 1", async ({ page }) => {
    await page.locator("#xSlider").fill("900");
    await page.locator("#xSlider").dispatchEvent("input");
    await expect(page.locator("#ySlider")).toHaveAttribute("max", "100");
    await expect(page.locator("#xValue")).toContainText("0.900");
    await expect(page.locator("#yValue")).toContainText("0.100");
    await expect(page.locator("#zValue")).toContainText("0.000");
  });

  test("white dwarf preset selects degeneracy-dominated state", async ({ page }) => {
    await page.locator('button.preset[data-preset-id="white-dwarf-core"]').click();
    await expect(page.locator("#dominantChannel")).toContainText("Electron degeneracy pressure");
  });

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

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

  test("station mode button opens station dialog", async ({ page }) => {
    await page.locator("#stationMode").click();
    const stationDialog = page.getByRole("dialog", { name: "Station Mode: EOS Lab" });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("help button opens help dialog", async ({ page }) => {
    await page.locator("#help").click();
    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });

  test("status region has aria-live announcements", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("role", "status");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });
});
