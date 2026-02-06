import { test, expect } from "@playwright/test";

test.describe("Kepler's Laws -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/keplers-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present in the DOM", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test("SVG stage contains orbit path, star, and planet", async ({ page }) => {
    await expect(page.locator("#orbitSvg")).toBeVisible();
    await expect(page.locator("#orbitPath")).toBeAttached();
    await expect(page.locator("#star")).toBeAttached();
    await expect(page.locator("#planet")).toBeAttached();
  });

  test("foci and apsides markers are visible by default", async ({ page }) => {
    await expect(page.locator("#focus1")).toBeAttached();
    await expect(page.locator("#focus2")).toBeAttached();
    await expect(page.locator("#perihelionMarker")).toBeAttached();
    await expect(page.locator("#aphelionMarker")).toBeAttached();
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state (Earth orbit)", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("keplers-laws-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: high eccentricity orbit", async ({ page }) => {
    await page.locator('.preset[data-e="0.9"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("keplers-laws-high-e.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: Newton mode with vectors", async ({ page }) => {
    await page.locator("#modeNewton").click();
    await page.locator("#toggleVectors").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("keplers-laws-newton.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Mode Switching ---

  test("Kepler mode is active by default", async ({ page }) => {
    await expect(page.locator("#modeKepler")).toHaveClass(/cp-button--active/);
    await expect(page.locator("#modeNewton")).not.toHaveClass(/cp-button--active/);
  });

  test("clicking Newton mode activates it and shows mass slider", async ({ page }) => {
    await page.locator("#modeNewton").click();
    await expect(page.locator("#modeNewton")).toHaveClass(/cp-button--active/);
    await expect(page.locator("#modeKepler")).not.toHaveClass(/cp-button--active/);
    await expect(page.locator("#massField")).toBeVisible();
  });

  test("switching back to Kepler mode hides mass slider", async ({ page }) => {
    await page.locator("#modeNewton").click();
    await expect(page.locator("#massField")).toBeVisible();
    await page.locator("#modeKepler").click();
    await expect(page.locator("#massField")).not.toBeVisible();
  });

  test("Newton mode shows velocity and force vector toggles", async ({ page }) => {
    await page.locator("#modeNewton").click();
    await expect(page.locator("#toggleVectorsLabel")).toBeVisible();
  });

  // --- Unit Toggle ---

  test("101 units are active by default", async ({ page }) => {
    await expect(page.locator("#unit101")).toHaveClass(/cp-button--active/);
    await expect(page.locator("#unit201")).not.toHaveClass(/cp-button--active/);
  });

  test("switching to 201 units activates 201 button", async ({ page }) => {
    await page.locator("#unit201").click();
    await expect(page.locator("#unit201")).toHaveClass(/cp-button--active/);
    await expect(page.locator("#unit101")).not.toHaveClass(/cp-button--active/);
  });

  test("velocity readout changes units from km/s to cm/s on 201 toggle", async ({ page }) => {
    // In 101 mode, velocity unit should be km/s
    const unit101 = await page.locator("#velocityUnit").textContent();
    expect(unit101).toContain("km");

    // Switch to 201
    await page.locator("#unit201").click();
    // Wait for KaTeX render
    await page.waitForTimeout(300);
    const unit201 = await page.locator("#velocityUnit").textContent();
    expect(unit201).toContain("cm");
  });

  // --- Sliders ---

  test("semi-major axis slider updates display", async ({ page }) => {
    const slider = page.locator("#aAu");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "500";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#aDisplay").textContent();
    // At slider=500 on log scale 0.3-40, should be roughly ~3.5 AU
    const num = parseFloat(value || "0");
    expect(num).toBeGreaterThan(2);
    expect(num).toBeLessThan(6);
  });

  test("eccentricity slider updates display", async ({ page }) => {
    const slider = page.locator("#ecc");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "500";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#eDisplay").textContent();
    expect(value).toContain("0.500");
  });

  test("mass slider updates display in Newton mode", async ({ page }) => {
    await page.locator("#modeNewton").click();
    const slider = page.locator("#massSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "500";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#massDisplay").textContent();
    expect(value).toContain("5.0");
  });

  // --- Presets ---

  test("Earth preset is active by default", async ({ page }) => {
    await expect(page.locator('.preset[data-a="1.0"][data-e="0.017"]')).toHaveClass(/preset--active/);
  });

  test("clicking Mercury preset updates orbit parameters", async ({ page }) => {
    await page.locator('.preset[data-a="0.387"]').click();
    await expect(page.locator('.preset[data-a="0.387"]')).toHaveClass(/preset--active/);
    // Earth preset should no longer be active
    await expect(page.locator('.preset[data-a="1.0"][data-e="0.017"]')).not.toHaveClass(/preset--active/);

    const aDisplay = await page.locator("#aDisplay").textContent();
    expect(aDisplay).toContain("0.387");
  });

  test("clicking Halley preset sets high eccentricity", async ({ page }) => {
    await page.locator('.preset[data-e="0.967"]').click();
    const eDisplay = await page.locator("#eDisplay").textContent();
    expect(eDisplay).toContain("0.967");
  });

  test("all 9 presets are present", async ({ page }) => {
    const presets = page.locator(".preset");
    const count = await presets.count();
    expect(count).toBe(9);
  });

  // --- Animation ---

  test("Play button starts animation and enables Pause", async ({ page }) => {
    await page.locator("#play").click();
    await expect(page.locator("#play")).toBeDisabled();
    await expect(page.locator("#pause")).toBeEnabled();
  });

  test("Pause button stops animation", async ({ page }) => {
    await page.locator("#play").click();
    await page.locator("#pause").click();
    await expect(page.locator("#play")).toBeEnabled();
    await expect(page.locator("#pause")).toBeDisabled();
  });

  test("Reset button returns planet to initial position", async ({ page }) => {
    // Advance via timeline
    const timeline = page.locator("#timelineScrub");
    await timeline.evaluate((el: HTMLInputElement) => {
      el.value = "500";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Reset
    await page.locator("#reset").click();
    // Check timeline returned to 0
    const val = await timeline.evaluate((el: HTMLInputElement) => el.value);
    expect(Number(val)).toBe(0);
  });

  test("speed dropdown has 6 options from 0.1x to 10x", async ({ page }) => {
    const options = page.locator("#speedSelect option");
    const count = await options.count();
    expect(count).toBe(6);
  });

  // --- Timeline ---

  test("timeline scrub updates phase display", async ({ page }) => {
    const timeline = page.locator("#timelineScrub");
    await timeline.evaluate((el: HTMLInputElement) => {
      el.value = "500";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const phase = await page.locator("#phaseDisplay").textContent();
    // Should show something like "0.500 / 1.00 yr"
    expect(phase).toContain("yr");
  });

  // --- Overlays ---

  test("unchecking Foci hides foci markers", async ({ page }) => {
    await page.locator("#toggleFoci").click();
    const fociGroup = page.locator("#fociGroup");
    const display = await fociGroup.evaluate((el) => el.style.display);
    expect(display).toBe("none");
  });

  test("unchecking Apsides hides apsides markers", async ({ page }) => {
    await page.locator("#toggleApsides").click();
    const group = page.locator("#apsidesGroup");
    const display = await group.evaluate((el) => el.style.display);
    expect(display).toBe("none");
  });

  test("checking Equal Areas shows the equal-area wedge", async ({ page }) => {
    await page.locator("#toggleEqualAreas").click();
    const group = page.locator("#equalAreasGroup");
    const display = await group.evaluate((el) => el.style.display);
    expect(display).toBe("block");
  });

  // --- Readouts ---

  test("all four primary readouts display non-empty values", async ({ page }) => {
    const distance = await page.locator("#distanceValue").textContent();
    expect(distance).toBeTruthy();
    expect(parseFloat(distance || "0")).toBeGreaterThan(0);

    const velocity = await page.locator("#velocityValue").textContent();
    expect(velocity).toBeTruthy();
    expect(parseFloat(velocity || "0")).toBeGreaterThan(0);

    const accel = await page.locator("#accelValue").textContent();
    expect(accel).toBeTruthy();

    const period = await page.locator("#periodValue").textContent();
    expect(period).toBeTruthy();
    expect(parseFloat(period || "0")).toBeGreaterThan(0);
  });

  test("readout units are in separate .cp-readout__unit elements", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    expect(count).toBeGreaterThanOrEqual(9);
  });

  test("conservation readouts appear in accordion", async ({ page }) => {
    // Open the conservation accordion
    const accordion = page.locator("details.cp-accordion", { hasText: "Conservation laws" });
    await accordion.locator("summary").click();
    await expect(accordion).toHaveAttribute("open", "");

    const kinetic = await page.locator("#kineticValue").textContent();
    expect(kinetic).toBeTruthy();
    const energy = await page.locator("#energyValue").textContent();
    expect(energy).toBeTruthy();
    const angmom = await page.locator("#angmomValue").textContent();
    expect(angmom).toBeTruthy();
  });

  // --- Accordion Panels ---

  test("What to notice accordion is open by default", async ({ page }) => {
    const details = page.locator(".cp-demo__drawer details.cp-accordion").first();
    await expect(details).toHaveAttribute("open", "");
  });

  test("Model note accordion exists and can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-demo__drawer details.cp-accordion").nth(1);
    await expect(modelNotes).toBeAttached();

    const summary = modelNotes.locator("summary");
    await summary.click();
    await expect(modelNotes).toHaveAttribute("open", "");
  });

  // --- Buttons ---

  test("station mode button is present and not disabled", async ({ page }) => {
    const btn = page.locator("#stationMode");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("help button is present", async ({ page }) => {
    const btn = page.locator("#help");
    await expect(btn).toBeVisible();
  });

  test("copy results button is present", async ({ page }) => {
    const btn = page.locator("#copyResults");
    await expect(btn).toBeVisible();
  });

  // --- Accessibility ---

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
    await expect(stage).toHaveAttribute("aria-label", "Orbit visualization stage");
  });

  test("planet group has slider role for drag interaction", async ({ page }) => {
    const planetGroup = page.locator("#planetGroup");
    await expect(planetGroup).toHaveAttribute("role", "slider");
    await expect(planetGroup).toHaveAttribute("aria-label", "Planet position on orbit");
  });

  test("mode buttons group has aria-label", async ({ page }) => {
    const group = page.locator('[role="group"][aria-label="Mode"]');
    await expect(group).toBeAttached();
  });

  test("animation controls group has aria-label", async ({ page }) => {
    const group = page.locator('[role="group"][aria-label="Animation controls"]');
    await expect(group).toBeAttached();
  });

  test("orbit status region exists for screen readers", async ({ page }) => {
    const orbitStatus = page.locator("#orbitStatus");
    await expect(orbitStatus).toHaveAttribute("aria-live", "polite");
  });

  // --- Distance Line ---

  test("distance line and text update with planet position", async ({ page }) => {
    const text = await page.locator("#distanceText").textContent();
    expect(text).toContain("r =");
    expect(text).toContain("AU");
  });

  // --- Keyboard Shortcuts ---

  test("keyboard shortcut accordion exists", async ({ page }) => {
    const accordion = page.locator("details.cp-accordion", { hasText: "Keyboard shortcuts" });
    await expect(accordion).toBeAttached();
    const summary = accordion.locator("summary");
    await summary.scrollIntoViewIfNeeded();
    await summary.focus();
    await summary.press("Enter");
    await expect(accordion).toHaveAttribute("open", "");
  });

  // --- Links ---

  test("exhibit and instructor links are present", async ({ page }) => {
    const exhibitLink = page.locator('a[href*="exhibits/keplers-laws"]');
    await expect(exhibitLink).toBeAttached();
    const instructorLink = page.locator('a[href*="instructor/keplers-laws"]');
    await expect(instructorLink).toBeAttached();
  });
});
