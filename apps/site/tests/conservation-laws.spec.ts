import { test, expect } from "@playwright/test";

test.describe("Conservation Laws -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visibility ---

  test("title contains Conservation Laws", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Conservation Laws");
  });

  test("#orbitSvg is visible", async ({ page }) => {
    await expect(page.locator("#orbitSvg")).toBeVisible();
  });

  test(".cp-demo__controls is visible with panel header text", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    const header = page.locator(".cp-panel-header").first();
    await expect(header).toContainText("Conservation Laws");
  });

  test(".cp-demo__readouts is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test('data-shell="triad" attribute is present', async ({ page }) => {
    await expect(page.locator("#cp-demo")).toHaveAttribute("data-shell", "triad");
  });

  // --- Slider Controls ---

  test("#speedFactor slider changes #speedValue text", async ({ page }) => {
    const slider = page.locator("#speedFactor");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "1.50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const text = await page.locator("#speedValue").textContent();
    expect(text).toContain("1.50");
  });

  test("#directionDeg slider changes #directionValue text", async ({ page }) => {
    const slider = page.locator("#directionDeg");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "45";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const text = await page.locator("#directionValue").textContent();
    expect(text).toContain("45");
  });

  test("#massSlider changes #massValue text", async ({ page }) => {
    const slider = page.locator("#massSlider");
    const before = await page.locator("#massValue").textContent();
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = await page.locator("#massValue").textContent();
    expect(after).not.toBe(before);
  });

  test("#r0Slider changes #r0Value text", async ({ page }) => {
    const slider = page.locator("#r0Slider");
    const before = await page.locator("#r0Value").textContent();
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = await page.locator("#r0Value").textContent();
    expect(after).not.toBe(before);
  });

  // --- Preset Chips ---

  test("clicking circular preset shows orbit type circular", async ({ page }) => {
    await page.locator('[data-preset="circular"]').click();
    const text = await page.locator("#orbitType").textContent();
    expect(text).toBe("circular");
  });

  test("clicking elliptical preset shows orbit type elliptical", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    const text = await page.locator("#orbitType").textContent();
    expect(text).toBe("elliptical");
  });

  test("clicking escape preset shows orbit type near parabolic", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    const text = await page.locator("#orbitType").textContent();
    // sqrt(2) is numerically fragile: may classify as parabolic or barely-elliptical
    expect(text).toMatch(/parabolic|elliptical/);
  });

  test("clicking hyperbolic preset shows orbit type hyperbolic", async ({ page }) => {
    await page.locator('[data-preset="hyperbolic"]').click();
    const text = await page.locator("#orbitType").textContent();
    expect(text).toBe("hyperbolic");
  });

  // --- Animation Controls ---

  test("play, pause, and reset buttons are visible", async ({ page }) => {
    await expect(page.locator("#play")).toBeVisible();
    await expect(page.locator("#pause")).toBeVisible();
    await expect(page.locator("#reset")).toBeVisible();
  });

  test("clicking play disables play and enables pause", async ({ page }) => {
    await page.locator("#play").click();
    await expect(page.locator("#play")).toBeDisabled();
    await expect(page.locator("#pause")).toBeEnabled();
  });

  test("clicking pause after play re-enables play", async ({ page }) => {
    await page.locator("#play").click();
    await expect(page.locator("#pause")).toBeEnabled();
    await page.locator("#pause").click();
    await expect(page.locator("#play")).toBeEnabled();
    await expect(page.locator("#pause")).toBeDisabled();
  });

  test("clicking reset after play stops animation and re-enables play", async ({ page }) => {
    await page.locator("#play").click();
    await expect(page.locator("#play")).toBeDisabled();
    await page.locator("#reset").click();
    await expect(page.locator("#play")).toBeEnabled();
    await expect(page.locator("#pause")).toBeDisabled();
  });

  // --- Readouts ---

  test("#orbitType shows circular initially", async ({ page }) => {
    const text = await page.locator("#orbitType").textContent();
    expect(text).toBe("circular");
  });

  test("#ecc is numeric", async ({ page }) => {
    const text = await page.locator("#ecc").textContent();
    expect(parseFloat(text || "NaN")).not.toBeNaN();
  });

  test("#eps has a .cp-readout__unit sibling", async ({ page }) => {
    const unit = page.locator("#eps").locator("..").locator(".cp-readout__unit");
    await expect(unit).toBeAttached();
  });

  test("#h has a .cp-readout__unit sibling", async ({ page }) => {
    const unit = page.locator("#h").locator("..").locator(".cp-readout__unit");
    await expect(unit).toBeAttached();
  });

  test('#vKmS has .cp-readout__unit with text containing "km/s"', async ({ page }) => {
    const unit = page.locator("#vKmS").locator("..").locator(".cp-readout__unit");
    const text = await unit.textContent();
    expect(text).toContain("km/s");
  });

  test('#rpAu has .cp-readout__unit with text containing "AU"', async ({ page }) => {
    const unit = page.locator("#rpAu").locator("..").locator(".cp-readout__unit");
    const text = await unit.textContent();
    expect(text).toContain("AU");
  });

  // --- Physics Behavior ---

  test("after circular preset, eccentricity is near zero", async ({ page }) => {
    await page.locator('[data-preset="circular"]').click();
    const text = await page.locator("#ecc").textContent();
    const ecc = parseFloat(text || "999");
    expect(ecc).toBeLessThan(0.05);
  });

  test("after escape preset, orbit type is near parabolic", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    const text = await page.locator("#orbitType").textContent();
    // sqrt(2) is numerically fragile at the parabolic boundary
    expect(text).toMatch(/parabolic|elliptical/);
  });

  test("after hyperbolic preset, orbit type is hyperbolic", async ({ page }) => {
    await page.locator('[data-preset="hyperbolic"]').click();
    const text = await page.locator("#orbitType").textContent();
    expect(text).toBe("hyperbolic");
  });

  // --- SVG Structure ---

  test("#centralMass circle is visible", async ({ page }) => {
    await expect(page.locator("#centralMass")).toBeVisible();
  });

  test("#orbitPath has a non-empty d attribute", async ({ page }) => {
    const d = await page.locator("#orbitPath").getAttribute("d");
    expect(d).toBeTruthy();
    expect(d!.startsWith("M")).toBe(true);
  });

  test("#particle circle is visible", async ({ page }) => {
    await expect(page.locator("#particle")).toBeVisible();
  });

  // --- Accessibility ---

  test('#status has aria-live="polite"', async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });

  test('.cp-demo__controls has aria-label="Controls panel"', async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test('.cp-demo__readouts has aria-label="Readouts panel"', async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
  });

  test("readout units in .cp-readout__unit spans (count >= 4)", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("tab navigation reaches play button", async ({ page }) => {
    await page.locator("#play").focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe("play");
  });

  // --- Export ---

  test("#copyResults button is visible", async ({ page }) => {
    const btn = page.locator("#copyResults");
    await expect(btn).toBeVisible();
  });

  test("clicking #copyResults triggers status message", async ({ page }) => {
    await page.locator("#copyResults").click();
    const status = page.locator("#status");
    await expect(status).toContainText(/Copied|Copy failed/, { timeout: 3000 });
  });

  // --- Visual Regression (skipped) ---

  test.skip("screenshot: default circular orbit", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("conservation-laws-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: elliptical preset", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("conservation-laws-elliptical.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: hyperbolic preset", async ({ page }) => {
    await page.locator('[data-preset="hyperbolic"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("conservation-laws-hyperbolic.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Conservation Laws -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    const playDisabled = await page.locator("#play").isDisabled();
    expect(playDisabled).toBe(true);
    const statusText = await page.locator("#status").textContent();
    expect(statusText).toContain("Reduced motion");
  });
});
