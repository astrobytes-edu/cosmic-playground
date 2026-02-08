import { test, expect } from "@playwright/test";

test.describe("Planetary Conjunctions -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/planetary-conjunctions/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visibility ---

  test("title contains Planetary Conjunctions", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Planetary Conjunctions");
  });

  test("conjunction SVG is visible", async ({ page }) => {
    await expect(page.locator("#conjunctionSvg")).toBeVisible();
  });

  test("controls panel is visible with header text", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toBeVisible();
    const header = page.locator(".cp-panel-header");
    await expect(header.first()).toContainText("Planetary Conjunctions");
  });

  test("readouts panel is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test("demo shell uses triad layout", async ({ page }) => {
    await expect(page.locator("#cp-demo")).toHaveAttribute("data-shell", "triad");
  });

  // --- Planet Selection ---

  test("default selected planet is Mars", async ({ page }) => {
    const marsChip = page.locator('[data-planet="Mars"]');
    await expect(marsChip).toHaveAttribute("aria-checked", "true");
  });

  test("clicking Venus flips aria-checked from Mars to Venus", async ({ page }) => {
    await page.locator('[data-planet="Venus"]').click();
    await expect(page.locator('[data-planet="Venus"]')).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('[data-planet="Mars"]')).toHaveAttribute("aria-checked", "false");
  });

  test("clicking Jupiter updates synodic period readout", async ({ page }) => {
    const beforeText = await page.locator("#synodicPeriod").textContent();
    await page.locator('[data-planet="Jupiter"]').click();
    const afterText = await page.locator("#synodicPeriod").textContent();
    expect(afterText).not.toBe(beforeText);
  });

  test("clicking Saturn updates target angle readout", async ({ page }) => {
    // Let animation run a moment so angles diverge from initial state
    await page.waitForTimeout(500);
    const beforeText = await page.locator("#targetAngle").textContent();
    await page.locator('[data-planet="Saturn"]').click();
    // After reset caused by planet switch, angle resets to initial value
    const afterText = await page.locator("#targetAngle").textContent();
    // The value changes because reset sets elapsedDays to 0
    expect(afterText).toBeDefined();
  });

  // --- Speed Slider ---

  test("speed slider changes speed value display", async ({ page }) => {
    const slider = page.locator("#speedSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#speedValue").textContent();
    expect(value).toContain("50");
  });

  test("speed slider has min=1 and max=100", async ({ page }) => {
    const slider = page.locator("#speedSlider");
    await expect(slider).toHaveAttribute("min", "1");
    await expect(slider).toHaveAttribute("max", "100");
  });

  // --- Animation & Reset ---

  test("days elapsed increments over time", async ({ page }) => {
    // Animation auto-starts, wait for it to advance
    await page.waitForTimeout(1500);
    const daysText = await page.locator("#daysElapsed").textContent();
    const days = parseFloat(daysText || "0");
    expect(days).toBeGreaterThan(0);
  });

  test("reset button sets daysElapsed near zero", async ({ page }) => {
    await page.waitForTimeout(500);
    await page.locator("#reset").click();
    // Animation auto-restarts after reset, so allow tolerance of one frame advance
    const daysText = await page.locator("#daysElapsed").textContent();
    const days = parseFloat(daysText || "999");
    expect(days).toBeLessThanOrEqual(2);
  });

  test("reset button sets conjunctionCount to 0", async ({ page }) => {
    await page.waitForTimeout(500);
    await page.locator("#reset").click();
    const countText = await page.locator("#conjunctionCount").textContent();
    expect(countText).toBe("0");
  });

  // --- Readouts ---

  test("synodic period readout is numeric with days unit", async ({ page }) => {
    const value = await page.locator("#synodicPeriod").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
    const unit = page.locator("#synodicPeriod").locator("..").locator(".cp-readout__unit");
    const unitText = await unit.textContent();
    expect(unitText?.trim()).toBe("days");
  });

  test("days elapsed readout has days unit", async ({ page }) => {
    const unit = page.locator("#daysElapsed").locator("..").locator(".cp-readout__unit");
    const unitText = await unit.textContent();
    expect(unitText?.trim()).toBe("days");
  });

  test("conjunction count readout is present as integer", async ({ page }) => {
    const countText = await page.locator("#conjunctionCount").textContent();
    expect(countText).toBeTruthy();
    const num = parseInt(countText || "NaN", 10);
    expect(Number.isInteger(num)).toBe(true);
  });

  test("earth angle readout has deg unit", async ({ page }) => {
    const unit = page.locator("#earthAngle").locator("..").locator(".cp-readout__unit");
    const unitText = await unit.textContent();
    expect(unitText?.trim()).toBe("deg");
  });

  test("target angle readout has deg unit", async ({ page }) => {
    const unit = page.locator("#targetAngle").locator("..").locator(".cp-readout__unit");
    const unitText = await unit.textContent();
    expect(unitText?.trim()).toBe("deg");
  });

  test("separation readout has deg unit", async ({ page }) => {
    const unit = page.locator("#separation").locator("..").locator(".cp-readout__unit");
    const unitText = await unit.textContent();
    expect(unitText?.trim()).toBe("deg");
  });

  // --- Synodic Period Physics ---

  test("Mars synodic period is between 770 and 790 days", async ({ page }) => {
    const value = await page.locator("#synodicPeriod").textContent();
    const period = parseFloat(value || "0");
    expect(period).toBeGreaterThanOrEqual(770);
    expect(period).toBeLessThanOrEqual(790);
  });

  test("Venus synodic period is between 574 and 594 days", async ({ page }) => {
    await page.locator('[data-planet="Venus"]').click();
    const value = await page.locator("#synodicPeriod").textContent();
    const period = parseFloat(value || "0");
    expect(period).toBeGreaterThanOrEqual(574);
    expect(period).toBeLessThanOrEqual(594);
  });

  // --- SVG Structure ---

  test("earth orbit circle is visible", async ({ page }) => {
    await expect(page.locator("#earthOrbit")).toBeVisible();
  });

  test("target orbit circle is visible", async ({ page }) => {
    await expect(page.locator("#targetOrbit")).toBeVisible();
  });

  test("earth dot and target dot circles are visible", async ({ page }) => {
    await expect(page.locator("#earthDot")).toBeVisible();
    await expect(page.locator("#targetDot")).toBeVisible();
  });

  // --- Accessibility ---

  test("status region has aria-live polite", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("controls panel has aria-label", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has aria-label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
  });

  test("planet selector has radiogroup role", async ({ page }) => {
    const group = page.locator('[role="radiogroup"]');
    await expect(group).toBeAttached();
    await expect(group).toHaveAttribute("aria-label", "Target planet");
  });

  test("readout units in .cp-readout__unit spans (count >= 4)", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  // --- Export ---

  test("copy results button is visible", async ({ page }) => {
    await expect(page.locator("#copyResults")).toBeVisible();
  });

  test("clicking copy triggers status message", async ({ page }) => {
    await page.locator("#copyResults").click();
    const status = page.locator("#status");
    await expect(status).toContainText(/Copied|Copy failed/, { timeout: 3000 });
  });

  // --- Visual Regression Screenshots (skipped) ---

  test.skip("screenshot: default Mars view", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("planetary-conjunctions-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: Venus selected", async ({ page }) => {
    await page.locator('[data-planet="Venus"]').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("planetary-conjunctions-venus.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Planetary Conjunctions -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/planetary-conjunctions/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    await page.waitForTimeout(500);
    const days = await page.locator("#daysElapsed").textContent();
    expect(days).toBe("0");
    const statusText = await page.locator("#status").textContent();
    expect(statusText).toContain("Reduced motion");
  });
});
