import { test, expect } from "@playwright/test";

test.describe("Moon Phases -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/moon-phases/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visibility ---

  test("demo loads with title Moon Phases", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Moon Phases");
  });

  test("sidebar panel is visible with header", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar")).toBeVisible();
    const header = page.locator(".cp-panel-header");
    await expect(header).toContainText("Moon Phases");
  });

  test("orbital SVG is visible", async ({ page }) => {
    await expect(page.locator("#orbital-svg")).toBeVisible();
  });

  test("phase SVG is visible", async ({ page }) => {
    await expect(page.locator("#phase-svg")).toBeVisible();
  });

  test("readouts strip is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test("shelf has two tabs", async ({ page }) => {
    const tabs = page.locator(".cp-tab");
    const count = await tabs.count();
    expect(count).toBe(2);
  });

  // --- Phase Angle Control ---

  test("phase angle slider updates readouts", async ({ page }) => {
    const slider = page.locator("#angle");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "180";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("New Moon");
    const illum = await page.locator("#illumination").textContent();
    expect(parseFloat(illum || "NaN")).toBeLessThanOrEqual(1);
  });

  test("preset button sets Full Moon", async ({ page }) => {
    // First move away from Full Moon
    await page.locator("#angle").evaluate((el: HTMLInputElement) => {
      el.value = "180";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Click the Full Moon preset (data-angle="0")
    await page.locator("#phase-presets-trigger").click();
    await page.locator('.phase-btn[data-angle="0"]').click();
    await page.waitForTimeout(500); // tween animation
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("Full Moon");
  });

  test("preset button sets First Quarter", async ({ page }) => {
    await page.locator("#phase-presets-trigger").click();
    await page.locator('.phase-btn[data-angle="270"]').click();
    await page.waitForTimeout(500);
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("First Quarter");
  });

  test("angle readout shows numeric degrees", async ({ page }) => {
    const value = await page.locator("#angleReadout").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  test("illumination readout shows percentage", async ({ page }) => {
    const value = await page.locator("#illumination").textContent();
    expect(value).toBeTruthy();
    const pct = parseFloat(value || "NaN");
    expect(pct).not.toBeNaN();
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  test("days since new readout is numeric", async ({ page }) => {
    const value = await page.locator("#days-since-new").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  // --- Advanced Controls ---

  test("advanced controls toggle shows latitude and day inputs", async ({ page }) => {
    const toggle = page.locator("#toggle-advanced");
    await toggle.evaluate((el: HTMLInputElement) => el.click());
    await expect(page.locator("#advanced-controls")).toBeVisible();
    await expect(page.locator("#latitude")).toBeVisible();
    await expect(page.locator("#dayOfYear")).toBeVisible();
  });

  test("latitude slider updates readout", async ({ page }) => {
    await page.locator("#toggle-advanced").evaluate((el: HTMLInputElement) => el.click());
    const slider = page.locator("#latitude");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "45";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const readout = await page.locator("#latitudeReadout").textContent();
    expect(readout).toContain("45");
  });

  test("season preset buttons set day of year", async ({ page }) => {
    await page.locator("#toggle-advanced").evaluate((el: HTMLInputElement) => el.click());
    await page.locator("#preset-summer").click();
    const readout = await page.locator("#dayOfYearReadout").textContent();
    expect(readout).toContain("172");
  });

  // --- Rise/Set Controls ---

  test("rise/set toggle shows rise and set times", async ({ page }) => {
    const toggle = page.locator("#toggle-rise-set");
    await toggle.evaluate((el: HTMLInputElement) => el.click());
    await expect(page.locator("#rise-set-line")).toBeVisible();
    const text = await page.locator("#rise-set-text").textContent();
    expect(text).toMatch(/Rises|Sets/);
  });

  // --- Shadow Toggle ---

  test("shadow toggle shows earth shadow group", async ({ page }) => {
    const toggle = page.locator("#show-shadow-toggle");
    await toggle.evaluate((el: HTMLInputElement) => el.click());
    const display = await page.locator("#earth-shadow-group").evaluate(
      (el) => getComputedStyle(el).display
    );
    expect(display).not.toBe("none");
  });

  // --- Animation Controls ---

  test("playbar has play, pause, step, reset buttons", async ({ page }) => {
    await expect(page.locator("#btn-play")).toBeVisible();
    await expect(page.locator("#btn-pause")).toBeVisible();
    await expect(page.locator("#btn-step-back")).toBeVisible();
    await expect(page.locator("#btn-step-forward")).toBeVisible();
    await expect(page.locator("#btn-reset")).toBeVisible();
  });

  test("speed select defaults to 5x", async ({ page }) => {
    const val = await page.locator("#speed-select").inputValue();
    expect(val).toBe("5");
  });

  test("step forward button advances to next phase", async ({ page }) => {
    // Start at Full Moon (default, angle=90)
    const before = await page.locator("#phase-name").textContent();
    await page.locator("#btn-step-forward").click();
    await page.waitForTimeout(500); // tween
    const after = await page.locator("#phase-name").textContent();
    expect(after).not.toBe(before);
  });

  test("reset button returns to Full Moon", async ({ page }) => {
    // Step away first
    await page.locator("#btn-step-forward").click();
    await page.waitForTimeout(500);
    // Reset
    await page.locator("#btn-reset").click();
    await page.waitForTimeout(500);
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("Full Moon");
  });

  // --- Timeline ---

  test("timeline shows waxing/waning direction", async ({ page }) => {
    const dir = await page.locator("#timeline-direction").textContent();
    expect(dir).toMatch(/WAXING|WANING/);
  });

  test("timeline day counter is visible", async ({ page }) => {
    const day = await page.locator("#timeline-day").textContent();
    expect(day).toMatch(/Day/);
  });

  test("timeline phase button navigates to phase", async ({ page }) => {
    // Click the New Moon timeline button (data-angle="180")
    await page.locator('.timeline-phase[data-angle="180"]').click();
    await page.waitForTimeout(500);
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("New Moon");
  });

  // --- Keyboard Interaction ---

  test("arrow keys change phase angle when moon has focus", async ({ page }) => {
    const moonGroup = page.locator("#moon-group");
    await moonGroup.focus();
    const before = await page.locator("#angleReadout").textContent();
    await moonGroup.press("ArrowRight");
    const after = await page.locator("#angleReadout").textContent();
    expect(after).not.toBe(before);
  });

  test("Home key jumps to Full Moon", async ({ page }) => {
    // Move away from Full Moon first via keyboard
    const moonGroup = page.locator("#moon-group");
    await moonGroup.focus();
    // Press End to go to New Moon (angle 180), then Home to come back
    await moonGroup.press("End");
    await page.waitForTimeout(500); // tween
    await moonGroup.press("Home");
    await page.waitForTimeout(500); // tween
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("Full Moon");
  });

  test("number keys jump to phases", async ({ page }) => {
    const moonGroup = page.locator("#moon-group");
    await moonGroup.focus();
    await moonGroup.press("1"); // New Moon (angle 180)
    await page.waitForTimeout(500); // tween
    const phaseName = await page.locator("#phase-name").textContent();
    expect(phaseName).toContain("New Moon");
  });

  // --- Moon Group ARIA ---

  test("moon group has slider role with aria attributes", async ({ page }) => {
    const moon = page.locator("#moon-group");
    await expect(moon).toHaveAttribute("role", "slider");
    await expect(moon).toHaveAttribute("tabindex", "0");
    const valuetext = await moon.getAttribute("aria-valuetext");
    expect(valuetext).toBeTruthy();
    expect(valuetext).toMatch(/Moon|illuminated/);
  });

  // --- Modes ---

  test("station mode button opens dialog", async ({ page }) => {
    await page.locator("#btn-station-mode").click();
    const dialog = page.getByRole("dialog", { name: /Station Mode/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".cp-station-table")).toBeVisible();
  });

  test("help button opens help dialog", async ({ page }) => {
    await page.locator("#btn-help").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("challenges button is visible", async ({ page }) => {
    await expect(page.locator("#btn-challenges")).toBeVisible();
  });

  // --- Export ---

  test("copy results button is visible", async ({ page }) => {
    await expect(page.locator("#copyResults")).toBeVisible();
  });

  test("copy results triggers status message", async ({ page }) => {
    await page.locator("#copyResults").click();
    await page.waitForTimeout(300);
    const statusText = await page.locator("#status").textContent();
    expect(statusText).toBeTruthy();
    expect(statusText!.length).toBeGreaterThan(0);
  });

  // --- DOM Structure ---

  test("readout units are in separate .cp-readout__unit spans", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    // deg, %, d units at minimum
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("status region has aria-live polite", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("sidebar has accessible label", async ({ page }) => {
    const sidebar = page.locator(".cp-demo__sidebar");
    await expect(sidebar).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts strip has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts");
  });

  test("stage section has accessible label", async ({ page }) => {
    const stage = page.locator(".cp-demo__stage");
    await expect(stage).toHaveAttribute("aria-label", "Visualization stage");
  });

  // --- SVG Structure ---

  test("orbital SVG has moon-group and earth-group", async ({ page }) => {
    await expect(page.locator("#moon-group")).toBeVisible();
    await expect(page.locator("#earth-group")).toBeVisible();
  });

  test("phase SVG has lit-portion path", async ({ page }) => {
    const litPath = page.locator("#lit-portion");
    await expect(litPath).toBeAttached();
    const d = await litPath.getAttribute("d");
    expect(d).toBeTruthy();
  });

  // --- Visual Regression Screenshots (skipped) ---

  test.skip("screenshot: default Full Moon view", async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("moon-phases-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: New Moon view", async ({ page }) => {
    await page.locator("#angle").evaluate((el: HTMLInputElement) => {
      el.value = "180";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("moon-phases-new-moon.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: First Quarter with shadow", async ({ page }) => {
    await page.locator("#phase-presets-trigger").click();
    await page.locator('.phase-btn[data-angle="270"]').click();
    await page.waitForTimeout(500);
    await page.locator("#show-shadow-toggle").evaluate((el: HTMLInputElement) => el.click());
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("moon-phases-first-quarter-shadow.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Moon Phases -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/moon-phases/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    // Play button should be disabled
    await expect(page.locator("#btn-play")).toBeDisabled({ timeout: 5000 });
  });
});
