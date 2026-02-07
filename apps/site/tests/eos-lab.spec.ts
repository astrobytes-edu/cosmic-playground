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
    await page.locator('button.preset[data-preset-id="white-dwarf-core"]').click();
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

  test("pressure cards are clickable on Understand tab", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await expect(page.locator(".pressure-card--clickable")).toHaveCount(3);
  });

  test("clicking gas mechanism card opens gas deep-dive panel", async ({ page }) => {
    // Deep-dives are on the Understand tab behind mechanism cards
    await page.locator("#tab-understand").click();
    await page.locator("#mechanismGas").click();
    await expect(page.locator("#deepDiveGas")).toBeVisible();
    await expect(page.locator(".mechanism-grid")).toBeHidden();
    await expect(page.locator("#gasAnimCanvas")).toBeVisible();
    await expect(page.locator("#gasEquation")).toBeVisible();
    await expect(page.locator("#gasDeepChart")).toBeVisible();
  });

  test("gas deep-dive back button returns to mechanism overview", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await page.locator("#mechanismGas").click();
    await expect(page.locator("#deepDiveGas")).toBeVisible();
    await page.locator("#deepDiveGas .deep-dive__back").click();
    await expect(page.locator("#deepDiveGas")).toBeHidden();
    await expect(page.locator(".mechanism-grid")).toBeVisible();
  });

  test("radiation deep-dive has only temperature slider", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await page.locator("#mechanismRadiation").click();
    await expect(page.locator("#deepDiveRadiation")).toBeVisible();
    await expect(page.locator("#radDeepT")).toBeVisible();
    // Radiation pressure is density-independent, so no rho slider
    const rhoSliders = page.locator("#deepDiveRadiation input[id*='Rho']");
    await expect(rhoSliders).toHaveCount(0);
  });

  test("degeneracy deep-dive has density slider", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await page.locator("#mechanismDegeneracy").click();
    await expect(page.locator("#deepDiveDegeneracy")).toBeVisible();
    await expect(page.locator("#degDeepRho")).toBeVisible();
  });

  test("deep-dive slider updates equation content", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await page.locator("#mechanismGas").click();
    await expect(page.locator("#deepDiveGas")).toBeVisible();
    const before = await page.locator("#gasEquation").textContent();
    await page.locator("#gasDeepT").fill("200");
    await page.locator("#gasDeepT").dispatchEvent("input");
    await page.waitForTimeout(100);
    const after = await page.locator("#gasEquation").textContent();
    expect(after).not.toBe(before);
  });

  test("switching between deep-dives closes previous", async ({ page }) => {
    await page.locator("#tab-understand").click();
    await page.locator("#mechanismGas").click();
    await expect(page.locator("#deepDiveGas")).toBeVisible();
    // Go back then open another
    await page.locator("#deepDiveGas .deep-dive__back").click();
    await page.locator("#mechanismRadiation").click();
    await expect(page.locator("#deepDiveRadiation")).toBeVisible();
    await expect(page.locator("#deepDiveGas")).toBeHidden();
  });

  test("pressure curve plot is visible with pressure curves", async ({ page }) => {
    await expect(page.locator("#pressureCurvePlot")).toBeVisible();
    // uPlot renders a canvas inside the plot container
    await expect(page.locator("#pressureCurvePlot canvas")).toBeVisible();
  });
});
