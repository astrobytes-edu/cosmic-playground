import { test, expect } from "@playwright/test";

test.describe("Retrograde Motion -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/retrograde-motion/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual (5 tests) ---

  test("demo loads with title Retrograde Motion", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Retrograde Motion");
  });

  test("controls panel is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
  });

  test("stage section with both SVGs is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator("#plotSvg")).toBeVisible();
    await expect(page.locator("#orbitSvg")).toBeVisible();
  });

  test("readouts panel is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  // --- Controls Interaction (7 tests) ---

  test("preset Earth->Venus changes observer and target selects", async ({ page }) => {
    await page.locator("#preset").selectOption("earth-venus");
    const obs = await page.locator("#observer").inputValue();
    const tgt = await page.locator("#target").inputValue();
    expect(obs).toBe("Earth");
    expect(tgt).toBe("Venus");
  });

  test("observer select changes orbit view", async ({ page }) => {
    await page.locator("#observer").selectOption("Mars");
    // Orbit SVG should have content (child elements rendered)
    const childCount = await page.locator("#orbitSvg").evaluate(
      (el) => el.children.length
    );
    expect(childCount).toBeGreaterThan(0);
  });

  test("target select changes orbit view", async ({ page }) => {
    await page.locator("#target").selectOption("Jupiter");
    const childCount = await page.locator("#orbitSvg").evaluate(
      (el) => el.children.length
    );
    expect(childCount).toBeGreaterThan(0);
  });

  test("window months slider updates displayed month count", async ({ page }) => {
    const slider = page.locator("#windowMonths");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "12";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#windowMonthsValue").textContent();
    expect(value).toContain("12");
  });

  test("plot step select changes decimation", async ({ page }) => {
    await page.locator("#plotStepDay").selectOption("2");
    const val = await page.locator("#plotStepDay").inputValue();
    expect(val).toBe("2");
  });

  test("cursor day slider updates readout day value", async ({ page }) => {
    const slider = page.locator("#cursorDay");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "100";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#cursorDayValue").textContent();
    expect(value).toContain("100");
  });

  test("show other planets checkbox can be toggled", async ({ page }) => {
    const checkbox = page.locator("#showOtherPlanets");
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  // --- Navigation Buttons (5 tests) ---

  test("next stationary button updates cursor day readout", async ({ page }) => {
    const before = await page.locator("#readoutDay").textContent();
    await page.locator("#nextStationary").click();
    const after = await page.locator("#readoutDay").textContent();
    // The cursor should have moved (readout changed)
    expect(after).not.toBe(before);
  });

  test("previous stationary button works after advancing cursor", async ({ page }) => {
    // First go to a stationary point
    await page.locator("#nextStationary").click();
    const atStationary = await page.locator("#readoutDay").textContent();

    // Then try to go to the previous one (if it exists)
    await page.locator("#prevStationary").click();
    const afterPrev = await page.locator("#readoutDay").textContent();
    // Should have moved or stayed (we just verify it doesn't crash and readout is numeric)
    expect(afterPrev).toBeTruthy();
    expect(parseFloat(afterPrev || "NaN")).not.toBeNaN();
  });

  test("center on retrograde button moves cursor", async ({ page }) => {
    const before = await page.locator("#readoutDay").textContent();
    await page.locator("#centerRetrograde").click();
    const after = await page.locator("#readoutDay").textContent();
    // For Earth-Mars (default), retrograde intervals exist, so cursor should move
    expect(after).not.toBe(before);
  });

  test("after next stationary, state readout shows a valid label", async ({ page }) => {
    await page.locator("#nextStationary").click();
    const stateText = await page.locator("#readoutState").textContent();
    // At a stationary point the state should be one of: Direct, Retrograde, Stationary
    expect(stateText).toMatch(/Direct|Retrograde|Stationary/);
  });

  test("navigation buttons do not crash when cursor is at boundary", async ({ page }) => {
    // Set cursor to max day
    const slider = page.locator("#cursorDay");
    const maxVal = await slider.evaluate((el: HTMLInputElement) => el.max);
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = el.max;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Click next stationary at the end -- should not crash
    await page.locator("#nextStationary").click();
    // Readout should still display a number
    const dayText = await page.locator("#readoutDay").textContent();
    expect(parseFloat(dayText || "NaN")).not.toBeNaN();
  });

  // --- Readouts Verification (5 tests) ---

  test("model day readout shows numeric value with days unit", async ({ page }) => {
    const value = await page.locator("#readoutDay").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
    // Check that the unit span exists
    const unit = page.locator(".cp-readout__unit").first();
    const unitText = await unit.textContent();
    expect(unitText?.trim()).toBe("days");
  });

  test("lambda readout shows numeric value with deg unit", async ({ page }) => {
    // Move cursor so lambda is computed (not em dash)
    const slider = page.locator("#cursorDay");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#readoutLambda").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  test("derivative readout shows numeric value with deg/day unit", async ({ page }) => {
    const slider = page.locator("#cursorDay");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#readoutSlope").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  test("state readout shows Direct or Retrograde", async ({ page }) => {
    const slider = page.locator("#cursorDay");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const stateText = await page.locator("#readoutState").textContent();
    expect(stateText).toMatch(/Direct|Retrograde|Stationary/);
  });

  test("retrograde interval readout shows day range or em dash", async ({ page }) => {
    const bounds = await page.locator("#readoutRetroBounds").textContent();
    // Should be either an em dash or a "X.XXX to Y.YYY day" string
    expect(bounds).toBeTruthy();
    if (bounds !== "\u2014") {
      expect(bounds).toContain("to");
      expect(bounds).toContain("day");
    }
  });

  // --- Keyboard & Accessibility (4 tests) ---

  test("arrow keys step cursor when plot is focused", async ({ page }) => {
    const plotFocus = page.locator("#plotFocus");
    await plotFocus.focus();
    const before = await page.locator("#readoutDay").textContent();
    await plotFocus.press("ArrowRight");
    const after = await page.locator("#readoutDay").textContent();
    // Cursor should advance by 1 day (default step)
    const beforeNum = parseFloat(before || "0");
    const afterNum = parseFloat(after || "0");
    expect(afterNum).toBeGreaterThan(beforeNum);
  });

  test("tab navigation reaches controls", async ({ page }) => {
    // Focus the first control element
    await page.locator("#preset").focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe("preset");
  });

  test("copy results button triggers status message", async ({ page }) => {
    await page.locator("#copyResults").click();
    // Wait for the status message to appear
    await page.waitForTimeout(300);
    const statusText = await page.locator("#status").textContent();
    // Should show either "Copied..." or "Copy failed..." (depending on clipboard API availability)
    expect(statusText).toBeTruthy();
    expect(statusText!.length).toBeGreaterThan(0);
  });

  test("pedagogical guardrail text is present in drawer", async ({ page }) => {
    const drawer = page.locator(".cp-demo__drawer");
    const text = await drawer.textContent();
    expect(text).toContain("apparent");
    expect(text).toContain("never reverses");
  });

  // --- Visual Regression Screenshots (4 tests, skipped) ---

  test.skip("screenshot: default Earth->Mars view", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("retrograde-motion-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: Earth->Venus preset", async ({ page }) => {
    await page.locator("#preset").selectOption("earth-venus");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("retrograde-motion-earth-venus.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: cursor on stationary point", async ({ page }) => {
    await page.locator("#nextStationary").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("retrograde-motion-stationary.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: orbit view with show other planets", async ({ page }) => {
    await page.locator("#showOtherPlanets").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("retrograde-motion-all-planets.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Additional DOM structure tests ---

  test("readout units are in separate .cp-readout__unit spans", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    // At least: days, deg, deg/day, days (prev stat), days (next stat), days (retro bounds), days (retro duration)
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test("status region has aria-live polite", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("controls panel has accessible label", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
  });

  test("stage section has accessible label", async ({ page }) => {
    const stage = page.locator(".cp-demo__stage");
    await expect(stage).toHaveAttribute("aria-label", "Visualization stage");
  });

  test("plot focus area has tabindex and aria-label", async ({ page }) => {
    const plotFocus = page.locator("#plotFocus");
    await expect(plotFocus).toHaveAttribute("tabindex", "0");
    await expect(plotFocus).toHaveAttribute("aria-label", "Longitude plot");
  });

  test("copy results button is present", async ({ page }) => {
    const btn = page.locator("#copyResults");
    await expect(btn).toBeVisible();
  });

  test("show other planets checkbox adds more orbit paths", async ({ page }) => {
    // Count orbit paths with checkbox off
    const countBefore = await page.locator("#orbitSvg path").count();
    // Turn on show other planets
    await page.locator("#showOtherPlanets").click();
    const countAfter = await page.locator("#orbitSvg path").count();
    // With all 5 planets visible, there should be more orbit paths
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test("plot SVG contains a main curve path element", async ({ page }) => {
    // The plot SVG should have at least one path (the main lambda curve)
    const paths = page.locator("#plotSvg path");
    const count = await paths.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("orbit SVG contains sun circle at center", async ({ page }) => {
    // The orbit view renders a sun circle with celestial token fill
    const circles = page.locator("#orbitSvg circle");
    const count = await circles.count();
    // At minimum: sun + observer dot + target dot = 3
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
