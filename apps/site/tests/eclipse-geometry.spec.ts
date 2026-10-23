import { test, expect } from "@playwright/test";

test.describe("Eclipse Geometry -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/eclipse-geometry/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Structure ---

  // One page load for all the "is it there" checks; soft assertions still report every miss.
  test("shell, starfield and stage render with all their parts", async ({ page }) => {
    for (const selector of [".cp-demo__sidebar", ".cp-demo__stage", ".cp-readout-strip", ".cp-demo__shelf", "#eclipseStage"]) {
      await expect.soft(page.locator(selector), selector).toBeVisible();
    }
    for (const selector of [
      "canvas.cp-starfield",
      "#orbitPanel",
      "#betaPanel",
      ".stage__earth",
      ".stage__moon",
      "#ascNodeDot",
      "#descNodeDot",
    ]) {
      await expect.soft(page.locator(selector), selector).toBeAttached();
    }
    await expect.soft(page.locator("#betaCurve"), "beta curve path").toHaveAttribute("d", /^M/);
    await expect.soft(page.locator(".stage__moon"), "moon is draggable").toHaveCSS("cursor", "grab");
  });

  // --- Phase Buttons ---

  test("New Moon button sets phase angle near 0", async ({ page }) => {
    await page.locator("#setNewMoon").click();
    // Wait for 300ms tween to complete
    await expect
      .poll(async () => parseFloat(await page.locator("#phaseAngle").textContent() || "999"), { timeout: 2000 })
      .toBeLessThanOrEqual(5);
  });

  test("Full Moon button sets phase angle near 180", async ({ page }) => {
    await page.locator("#setFullMoon").click();
    // Wait for 300ms tween to complete
    await expect
      .poll(async () => parseFloat(await page.locator("#phaseAngle").textContent() || "0"), { timeout: 2000 })
      .toBeGreaterThanOrEqual(175);
  });

  // --- Sliders ---

  test("moon angle slider updates readout", async ({ page }) => {
    const slider = page.locator("#moonLon");
    await slider.fill("90");
    await slider.dispatchEvent("input");
    const value = await page.locator("#moonLonValue").textContent();
    expect(value).toContain("90");
  });

  test("tilt slider updates readout", async ({ page }) => {
    const slider = page.locator("#tilt");
    // Range inputs can't use .fill() with decimals; set value via JS
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "3";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#tiltValue").textContent();
    expect(value).toContain("3.000");
  });

  // --- Eclipse Presets Popover ---

  test("presets popover opens and has 4 preset buttons", async ({ page }) => {
    const trigger = page.locator("#presetsBtn");
    await expect(trigger).toBeVisible();

    // Popover should be hidden initially
    const popover = page.locator("#presetsPopover");
    await expect(popover).toBeHidden();

    // Click trigger to open
    await trigger.click();
    await expect(popover).toBeVisible();

    // Should have 4 preset buttons
    const presets = popover.locator(".cp-popover-link");
    await expect(presets).toHaveCount(4);
  });

  // --- Distance Preset ---

  test("distance preset dropdown has perigee/mean/apogee options", async ({ page }) => {
    const options = page.locator("#distancePreset option");
    const count = await options.count();
    expect(count).toBe(3);

    const texts = await options.allTextContents();
    expect(texts.some((t) => t.includes("Perigee"))).toBe(true);
    expect(texts.some((t) => t.includes("Mean"))).toBe(true);
    expect(texts.some((t) => t.includes("Apogee"))).toBe(true);
  });

  test("changing distance preset updates distance readout", async ({ page }) => {
    await page.locator("#distancePreset").selectOption("perigee");
    const value = await page.locator("#distanceValue").textContent();
    expect(value).toContain("363");
  });

  // --- Readouts ---

  test("all six readouts display values", async ({ page }) => {
    for (const id of ["phaseLabel", "phaseAngle", "absBeta", "nearestNode", "solarOutcome", "lunarOutcome"]) {
      await expect.soft(page.locator(`#${id}`), `#${id}`).toHaveText(/\S/);
    }
  });

  test("readout units are in separate .cp-readout__unit spans", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Check that unit text is "deg"
    const firstUnit = await units.first().textContent();
    expect(firstUnit?.trim()).toBe("deg");
  });

  // --- Eclipse Detection ---

  test("solar eclipse detected via total solar preset", async ({ page }) => {
    // Use the preset button to guarantee a solar eclipse configuration
    await page.locator("#presetsBtn").click();
    await page.locator("#presetTotalSolar").click();
    // Wait for 400ms tween to complete
    await expect
      .poll(async () => (await page.locator("#solarOutcome").textContent() || "").toLowerCase(), { timeout: 2000 })
      .toContain("solar");
  });

  test("lunar eclipse detected via lunar preset", async ({ page }) => {
    // Use the preset button to guarantee a lunar eclipse configuration
    await page.locator("#presetsBtn").click();
    await page.locator("#presetLunar").click();
    // Wait for 400ms tween to complete
    await expect
      .poll(async () => (await page.locator("#lunarOutcome").textContent() || "").toLowerCase(), { timeout: 2000 })
      .toContain("lunar");
  });

  test("no eclipse via no-eclipse preset", async ({ page }) => {
    // Use the no-eclipse preset to guarantee no eclipses
    await page.locator("#presetsBtn").click();
    await page.locator("#presetNoEclipse").click();
    // Wait for 400ms tween to complete
    await expect
      .poll(async () => await page.locator("#solarOutcome").textContent(), { timeout: 2000 })
      .toBe("None");
    const lunarOutcome = await page.locator("#lunarOutcome").textContent();
    expect(lunarOutcome).toBe("None");
  });

  test("zero tilt always produces eclipses at syzygy", async ({ page }) => {
    // Set tilt to 0
    await page.locator("#tilt").fill("0");
    await page.locator("#tilt").dispatchEvent("input");

    // New Moon — wait for 300ms tween
    await page.locator("#setNewMoon").click();
    await expect
      .poll(async () => await page.locator("#solarOutcome").textContent(), { timeout: 2000 })
      .not.toBe("None");

    // Full Moon — wait for 300ms tween
    await page.locator("#setFullMoon").click();
    await expect
      .poll(async () => await page.locator("#lunarOutcome").textContent(), { timeout: 2000 })
      .not.toBe("None");
  });

  // --- Shelf Tabs ---

  test("What to notice tab is active by default", async ({ page }) => {
    const tab = page.locator("#tab-btn-notice");
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const panel = page.locator("#tab-notice");
    await expect(panel).toBeVisible();
  });

  test("shelf tabs switch panels correctly", async ({ page }) => {
    // Click each tab and verify its panel shows
    const tabs = [
      { btn: "#tab-btn-notice", panel: "#tab-notice" },
      { btn: "#tab-btn-model", panel: "#tab-model" },
      { btn: "#tab-btn-sim", panel: "#tab-sim" },
    ];

    for (const { btn, panel } of tabs) {
      // Tabs may be obscured by sidebar in test viewport; use JS click
      await page.locator(btn).evaluate((el: HTMLElement) => el.click());
      await expect(page.locator(btn)).toHaveAttribute("aria-selected", "true");
      await expect(page.locator(panel)).toBeVisible();

      // Other panels should be hidden
      for (const other of tabs) {
        if (other.btn !== btn) {
          await expect(page.locator(other.btn)).toHaveAttribute("aria-selected", "false");
          await expect(page.locator(other.panel)).toBeHidden();
        }
      }
    }
  });

  // --- Simulation Controls ---

  test("simulation years slider uses log scale (max shows 1,000)", async ({ page }) => {
    // Sim controls are in the Simulation tab -- click it first
    await page.locator("#tab-btn-sim").click();
    await expect(page.locator("#tab-sim")).toBeVisible();

    const slider = page.locator("#simYears");
    await expect(slider).toBeVisible();
    // Set slider to max (100) which should map to 1000 years
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "100";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#simYearsValue").textContent();
    expect(value).toMatch(/1[,.]?000/);
  });

  test("simulation tab defaults: ~10 years, four tick labels, three speeds", async ({ page }) => {
    await page.locator("#tab-btn-sim").click();
    await expect(page.locator("#tab-sim")).toBeVisible();

    expect(await page.locator("#simYearsValue").textContent()).toContain("10");

    const ticks = page.locator(".sim-ticks span");
    await expect(ticks).toHaveCount(4);
    const texts = await ticks.allTextContents();
    expect(texts[0]).toBe("1");
    expect(texts[3]).toMatch(/1[,.]?000/);

    await expect(page.locator("#simSpeed option")).toHaveCount(3);
  });

  // --- Eclipse Arc Rendering ---

  test("eclipse arcs are visible on stage SVG", async ({ page }) => {
    // The eclipse arcs are SVG path elements inside the orbit panel
    // At least one arc pair should have a non-empty d attribute (arcs around the nodes)
    const arcs = page.locator('[id^="arc-"]');
    const count = await arcs.count();
    expect(count).toBe(8); // 4 tiers x 2 nodes

    // At least one arc should have a non-empty d attribute (with default tilt > 0)
    let hasNonEmptyArc = false;
    for (let i = 0; i < count; i++) {
      const d = await arcs.nth(i).getAttribute("d");
      if (d && d.trim().length > 0) {
        hasNonEmptyArc = true;
        break;
      }
    }
    expect(hasNonEmptyArc).toBe(true);
  });

  // --- Animate Month ---

  test("animate-month advances the Moon longitude", async ({ page }) => {
    const initialMoonSlider = await page.locator("#moonLon").inputValue();

    await page.locator("#animateMonth").click();

    // Wait until the moon longitude slider changes (animation is running)
    await expect
      .poll(async () => await page.locator("#moonLon").inputValue(), { timeout: 5000 })
      .not.toBe(initialMoonSlider);
  });

  // --- Buttons ---

  test("station, challenge and copy buttons are usable", async ({ page }) => {
    for (const id of ["#stationMode", "#challengeMode"]) {
      await expect.soft(page.locator(id), id).toBeVisible();
      await expect.soft(page.locator(id), id).toBeEnabled();
    }
    await expect.soft(page.locator("#copyResults")).toBeVisible();
  });

  // --- Accessibility ---

  test("landmarks, groups and the stage have accessible names", async ({ page }) => {
    await expect.soft(page.locator("#status")).toHaveAttribute("aria-live", "polite");
    await expect.soft(page.locator(".cp-demo__sidebar")).toHaveAttribute("aria-label", "Controls panel");
    await expect.soft(page.locator(".cp-demo__readouts")).toHaveAttribute("aria-label", "Readouts");
    await expect.soft(page.locator("#eclipseStage")).toHaveAttribute("role", "img");
    await expect.soft(page.locator("#eclipseStage")).toHaveAttribute("aria-label", /\S/);
    await expect.soft(page.locator('[role="group"][aria-label="Phase buttons"]')).toBeAttached();
    await expect.soft(page.locator('[role="group"][aria-label="Time controls"]')).toBeAttached();
  });

  // --- Challenges ---

  test("challenge mode offers 5 challenges", async ({ page }) => {
    await page.locator("#challengeMode").click();
    // Challenge progress shows "1 / N" format
    const progress = page.locator(".cp-challenge-progress");
    await expect(progress).toBeVisible();
    const text = await progress.textContent();
    expect(text).toContain("/ 5");
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Eclipse Geometry -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/eclipse-geometry/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    const noteText = await page.locator("#motionNote").textContent();
    expect(noteText).toContain("reduced-motion");
  });
});
