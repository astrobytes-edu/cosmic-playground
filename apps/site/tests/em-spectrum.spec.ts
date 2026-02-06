import { test, expect } from "@playwright/test";

test.describe("EM Spectrum -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/em-spectrum/", { waitUntil: "domcontentloaded" });
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

  test("spectrum bar is present", async ({ page }) => {
    await expect(page.locator(".spectrum__bar")).toBeVisible();
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("em-spectrum-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: radio band selected", async ({ page }) => {
    await page.locator('.band[data-band="radio"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("em-spectrum-radio.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: convert panel active", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("em-spectrum-convert.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Band Buttons ---

  test("seven band buttons are present", async ({ page }) => {
    const buttons = page.locator(".band");
    await expect(buttons).toHaveCount(7);
  });

  test("visible band is active by default", async ({ page }) => {
    const visibleBtn = page.locator('.band[data-band="visible"]');
    await expect(visibleBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking a band button activates it and deactivates others", async ({ page }) => {
    const radioBtn = page.locator('.band[data-band="radio"]');
    await radioBtn.click();
    await expect(radioBtn).toHaveAttribute("aria-pressed", "true");
    // Previous active button should now be deactivated
    const visibleBtn = page.locator('.band[data-band="visible"]');
    await expect(visibleBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking a band button updates band badge", async ({ page }) => {
    await page.locator('.band[data-band="xray"]').click();
    const badge = page.locator("#bandBadge");
    await expect(badge).toContainText("X-ray");
  });

  // --- Wavelength Slider ---

  test("wavelength slider updates readouts", async ({ page }) => {
    const before = await page.locator("#readoutWavelength").textContent();
    await page.locator("#wavelengthSlider").fill("100");
    await page.locator("#wavelengthSlider").dispatchEvent("input");
    const after = await page.locator("#readoutWavelength").textContent();
    expect(after).not.toBe(before);
  });

  test("slider changes update band badge", async ({ page }) => {
    // Move to extreme left (radio end: low position percent = long wavelength)
    await page.locator("#wavelengthSlider").fill("10");
    await page.locator("#wavelengthSlider").dispatchEvent("input");
    const badge = await page.locator("#bandBadge").textContent();
    expect(badge).toBe("Radio");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("wavelength readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutWavelength").textContent();
    const unit = await page.locator("#readoutWavelengthUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  test("frequency readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutFrequency").textContent();
    const unit = await page.locator("#readoutFrequencyUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  test("energy readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutEnergy").textContent();
    const unit = await page.locator("#readoutEnergyUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  // --- Band Card ---

  test("band card shows description for current band", async ({ page }) => {
    await expect(page.locator("#bandDescription")).not.toBeEmpty();
  });

  test("band card shows examples and detectors", async ({ page }) => {
    await expect(page.locator("#bandExamples")).not.toBeEmpty();
    await expect(page.locator("#bandDetection")).not.toBeEmpty();
  });

  test("band card updates when band changes", async ({ page }) => {
    const beforeDesc = await page.locator("#bandDescription").textContent();
    await page.locator('.band[data-band="gamma"]').click();
    const afterDesc = await page.locator("#bandDescription").textContent();
    expect(afterDesc).not.toBe(beforeDesc);
  });

  // --- Tabs ---

  test("four tabs are present", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);
  });

  test("Lines tab is active by default", async ({ page }) => {
    const linesTab = page.locator("#tabLines");
    await expect(linesTab).toHaveAttribute("aria-selected", "true");
  });

  test("clicking Convert tab shows convert panel", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await expect(page.locator("#panelConvert")).toBeVisible();
    await expect(page.locator("#panelLines")).toBeHidden();
  });

  test("clicking Telescopes tab shows telescope list", async ({ page }) => {
    await page.locator("#tabTelescopes").click();
    await expect(page.locator("#panelTelescopes")).toBeVisible();
    const items = page.locator("#telescopeList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking Objects tab shows object list", async ({ page }) => {
    await page.locator("#tabObjects").click();
    await expect(page.locator("#panelObjects")).toBeVisible();
    const items = page.locator("#objectList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("convert panel has three input fields", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await expect(page.locator("#convertWavelengthNm")).toBeVisible();
    await expect(page.locator("#convertFrequencyHz")).toBeVisible();
    await expect(page.locator("#convertEnergyEv")).toBeVisible();
  });

  test("typing wavelength in convert panel updates frequency and energy", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await page.locator("#convertWavelengthNm").fill("500");
    await page.locator("#convertWavelengthNm").dispatchEvent("input");
    const freq = await page.locator("#convertFrequencyHz").inputValue();
    const energy = await page.locator("#convertEnergyEv").inputValue();
    expect(freq).toBeTruthy();
    expect(energy).toBeTruthy();
    expect(Number(freq)).toBeGreaterThan(0);
    expect(Number(energy)).toBeGreaterThan(0);
  });

  // --- Lines List ---

  test("Lines panel shows atomic and molecular lines", async ({ page }) => {
    const items = page.locator("#lineList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  // --- Accordion / Drawer ---

  test("Explore panels accordion is open by default", async ({ page }) => {
    const firstAccordion = page.locator(".cp-accordion").first();
    await expect(firstAccordion).toHaveAttribute("open", "");
    await expect(firstAccordion).toContainText("Explore panels");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
    await expect(modelNotes).toContainText("Model notes");
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

  test("band picker has accessible label", async ({ page }) => {
    const bandPicker = page.locator(".band-picker");
    await expect(bandPicker).toHaveAttribute("aria-label", "EM band");
  });

  test("tab list has accessible label", async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toHaveAttribute("aria-label", "Explore panels");
  });
});
