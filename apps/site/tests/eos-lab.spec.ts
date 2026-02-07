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

  test("regime map canvas is visible", async ({ page }) => {
    await expect(page.locator("#regimeMapCanvas")).toBeVisible();
  });

  test("regime map includes legend and point details for interpretation", async ({ page }) => {
    await expect(page.locator(".regime-map__legend")).toBeVisible();
    await expect(page.locator(".regime-map__legend li")).toHaveCount(4);
    await expect(page.locator("#regimeDetail")).toContainText("Point details:");
    await expect(page.locator("#regimeDetail .katex")).toHaveCount(4);
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
    // Use cp-button class to target Tab 1 presets (Tab 2 uses compare-preset class)
    await page.locator('button.cp-button[data-preset-id="white-dwarf-core"]').click();
    await expect(page.locator("#dominantChannel")).toContainText("Electron degeneracy pressure");
  });

  test("advanced diagnostics accordion reveals fermi and extension readouts", async ({ page }) => {
    // Advanced diagnostics is inside a closed <details> accordion near the bottom
    // of the sidebar scroll container — force click to bypass pointer interception
    // from adjacent grid areas at narrow viewport widths
    const accordion = page.locator(".cp-demo__controls .cp-accordion").filter({
      hasText: "Advanced diagnostics",
    });
    await accordion.locator("summary").evaluate((el) => (el as HTMLElement).click());
    await expect(accordion).toHaveAttribute("open", "");
    await expect(page.locator("#xFValue")).toBeVisible();
    await expect(page.locator("#fermiRegimeValue")).toBeVisible();
    await expect(page.locator("#neutronExtensionValue")).toBeVisible();
  });

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("What to notice accordion can be opened", async ({ page }) => {
    const accordion = page.locator(".cp-demo__controls .cp-accordion").filter({
      hasText: "What to notice",
    });
    // Accordions start closed by default
    await expect(accordion).not.toHaveAttribute("open", "");
    await accordion.locator("summary").evaluate((el) => (el as HTMLElement).click());
    await expect(accordion).toHaveAttribute("open", "");
    await expect(accordion).toContainText("radiation pressure climbs");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const accordion = page.locator(".cp-demo__controls .cp-accordion").filter({
      hasText: "Model notes",
    });
    await accordion.locator("summary").evaluate((el) => (el as HTMLElement).click());
    await expect(accordion).toHaveAttribute("open", "");
    await expect(accordion).toContainText("Gas pressure");
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

  test("Tab 2 comparison grid shows three channel columns", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await expect(page.locator(".compare-grid")).toBeVisible();
    await expect(page.locator(".compare-column")).toHaveCount(3);
  });

  test("Tab 2 shared T slider updates all three equations", async ({ page }) => {
    await page.locator("#tab-understand").click();
    // Wait for initial KaTeX render (symbolic form)
    await page.waitForSelector("#compareGasEq .katex", { timeout: 5000 });
    // Toggle to substituted form so slider changes are visible
    await page.locator("#compareGasEq").click();
    await page.waitForTimeout(200);
    const gasBefore = await page.locator("#compareGasEq").textContent();
    await page.locator("#compareT").fill("800");
    await page.locator("#compareT").dispatchEvent("input");
    await page.waitForTimeout(200);
    const gasAfter = await page.locator("#compareGasEq").textContent();
    expect(gasAfter).not.toBe(gasBefore);
    // Radiation and degeneracy equations also rendered (attached, not toBeVisible —
    // KaTeX overflow inside scrollable .compare-column__equation can report "hidden")
    await expect(page.locator("#compareRadEq .katex")).toBeAttached();
    await expect(page.locator("#compareDegEq .katex")).toBeAttached();
  });

  test("Tab 2 preset chips set slider values", async ({ page }) => {
    await page.locator("#tab-understand").click();
    // Toggle to substituted form so numerical values are visible
    await page.locator("#compareDegEq").click();
    await page.locator('button.compare-preset[data-preset-id="white-dwarf-core"]').click();
    // White dwarf should update equations with numerical values
    await page.waitForSelector("#compareDegEq .katex", { state: "attached", timeout: 5000 });
    await expect(page.locator("#compareDegEq")).toContainText("10");
  });

  test("Tab 2 canvas animations are visible", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await expect(page.locator("#compareGasCanvas")).toBeVisible();
    await expect(page.locator("#compareRadCanvas")).toBeVisible();
    await expect(page.locator("#compareDegCanvas")).toBeVisible();
  });

  test("Tab 2 composition sliders show mu readout", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await expect(page.locator("#compareMuVal")).toBeVisible();
    const mu = await page.locator("#compareMuVal").textContent();
    expect(Number(mu)).toBeGreaterThan(0);
  });

  test("Scaling Law Detective accordion can be opened", async ({ page }) => {
    await page.locator("#tab-understand").click();
    const accordion = page.locator(".scaling-detective");
    await accordion.locator("summary").evaluate((el) => (el as HTMLElement).click());
    await expect(accordion).toHaveAttribute("open", "");
    await expect(page.locator("#scalingChallenge")).toBeVisible();
  });

  test("pressure curve plot is visible with pressure curves", async ({ page }) => {
    await expect(page.locator("#pressureCurvePlot")).toBeVisible();
    // uPlot renders a canvas inside the plot container
    await expect(page.locator("#pressureCurvePlot canvas")).toBeVisible();
  });
});
