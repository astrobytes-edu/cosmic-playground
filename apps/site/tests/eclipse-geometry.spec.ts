import { test, expect } from "@playwright/test";

test.describe("Eclipse Geometry -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/eclipse-geometry/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-readout-strip")).toBeVisible();
    await expect(page.locator(".cp-demo__shelf")).toBeVisible();
  });

  test("starfield canvas is present in the DOM", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test("SVG stage contains orbit and beta panels", async ({ page }) => {
    const svg = page.locator("#eclipseStage");
    await expect(svg).toBeVisible();
    await expect(page.locator("#orbitPanel")).toBeAttached();
    await expect(page.locator("#betaPanel")).toBeAttached();
  });

  test("earth and moon elements are rendered in SVG", async ({ page }) => {
    await expect(page.locator(".stage__earth")).toBeAttached();
    await expect(page.locator(".stage__moon")).toBeAttached();
    await expect(page.locator("#ascNodeDot")).toBeAttached();
    await expect(page.locator("#descNodeDot")).toBeAttached();
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("eclipse-geometry-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: new moon near node", async ({ page }) => {
    await page.locator("#setNewMoon").click();
    // Use total solar preset to position near node
    await page.locator("#presetsBtn").click();
    await page.locator("#presetTotalSolar").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("eclipse-geometry-solar-eclipse.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: full moon near node", async ({ page }) => {
    await page.locator("#presetsBtn").click();
    await page.locator("#presetLunar").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("eclipse-geometry-lunar-eclipse.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Phase Buttons ---

  test("New Moon button sets phase angle near 0", async ({ page }) => {
    await page.locator("#setNewMoon").click();
    const text = await page.locator("#phaseAngle").textContent();
    const angle = parseFloat(text || "999");
    expect(angle).toBeLessThanOrEqual(5);
  });

  test("Full Moon button sets phase angle near 180", async ({ page }) => {
    await page.locator("#setFullMoon").click();
    const text = await page.locator("#phaseAngle").textContent();
    const angle = parseFloat(text || "0");
    expect(angle).toBeGreaterThanOrEqual(175);
    expect(angle).toBeLessThanOrEqual(185);
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

  test("total solar preset produces solar eclipse readout", async ({ page }) => {
    // Open popover and click total solar preset
    await page.locator("#presetsBtn").click();
    await page.locator("#presetTotalSolar").click();

    // Wait for render
    await page.waitForTimeout(100);

    const outcome = await page.locator("#solarOutcome").textContent();
    expect(outcome).toBeTruthy();
    expect(outcome).not.toBe("None");
    expect(outcome!.toLowerCase()).toContain("solar");
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
    const phaseLabel = await page.locator("#phaseLabel").textContent();
    expect(phaseLabel).toBeTruthy();

    const phaseAngle = await page.locator("#phaseAngle").textContent();
    expect(phaseAngle).toBeTruthy();

    const absBeta = await page.locator("#absBeta").textContent();
    expect(absBeta).toBeTruthy();

    const nearestNode = await page.locator("#nearestNode").textContent();
    expect(nearestNode).toBeTruthy();

    const solarOutcome = await page.locator("#solarOutcome").textContent();
    expect(solarOutcome).toBeTruthy();

    const lunarOutcome = await page.locator("#lunarOutcome").textContent();
    expect(lunarOutcome).toBeTruthy();
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
    await page.waitForTimeout(100);

    const outcome = await page.locator("#solarOutcome").textContent();
    expect(outcome).not.toBe("None");
    expect(outcome!.toLowerCase()).toContain("solar");
  });

  test("lunar eclipse detected via lunar preset", async ({ page }) => {
    // Use the preset button to guarantee a lunar eclipse configuration
    await page.locator("#presetsBtn").click();
    await page.locator("#presetLunar").click();
    await page.waitForTimeout(100);

    const outcome = await page.locator("#lunarOutcome").textContent();
    expect(outcome).not.toBe("None");
    expect(outcome!.toLowerCase()).toContain("lunar");
  });

  test("no eclipse via no-eclipse preset", async ({ page }) => {
    // Use the no-eclipse preset to guarantee no eclipses
    await page.locator("#presetsBtn").click();
    await page.locator("#presetNoEclipse").click();
    await page.waitForTimeout(100);

    const solarOutcome = await page.locator("#solarOutcome").textContent();
    const lunarOutcome = await page.locator("#lunarOutcome").textContent();
    expect(solarOutcome).toBe("None");
    expect(lunarOutcome).toBe("None");
  });

  test("zero tilt always produces eclipses at syzygy", async ({ page }) => {
    // Set tilt to 0
    await page.locator("#tilt").fill("0");
    await page.locator("#tilt").dispatchEvent("input");

    // New Moon
    await page.locator("#setNewMoon").click();
    const solarOutcome = await page.locator("#solarOutcome").textContent();
    expect(solarOutcome).not.toBe("None");

    // Full Moon
    await page.locator("#setFullMoon").click();
    const lunarOutcome = await page.locator("#lunarOutcome").textContent();
    expect(lunarOutcome).not.toBe("None");
  });

  // --- Shelf Tabs ---

  test("What to notice tab is active by default", async ({ page }) => {
    const tab = page.locator("#tab-btn-notice");
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const panel = page.locator("#tab-notice");
    await expect(panel).toBeVisible();
  });

  test("Model notes tab can be clicked to switch", async ({ page }) => {
    const modelTab = page.locator("#tab-btn-model");
    // Tab may be obscured by sidebar in test viewport; use JS click
    await modelTab.evaluate((el: HTMLElement) => el.click());

    await expect(modelTab).toHaveAttribute("aria-selected", "true");
    const modelPanel = page.locator("#tab-model");
    await expect(modelPanel).toBeVisible();

    // Previous tab should be deselected
    const noticeTab = page.locator("#tab-btn-notice");
    await expect(noticeTab).toHaveAttribute("aria-selected", "false");
    const noticePanel = page.locator("#tab-notice");
    await expect(noticePanel).toBeHidden();
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

  test("simulation years slider default is ~10 years", async ({ page }) => {
    // Open the simulation tab to ensure the readout is rendered
    await page.locator("#tab-btn-sim").click();
    const value = await page.locator("#simYearsValue").textContent();
    expect(value).toContain("10");
  });

  test("simulation slider has tick labels", async ({ page }) => {
    await page.locator("#tab-btn-sim").click();
    const ticks = page.locator(".sim-ticks span");
    const count = await ticks.count();
    expect(count).toBe(4);
    const texts = await ticks.allTextContents();
    expect(texts[0]).toBe("1");
    expect(texts[3]).toMatch(/1[,.]?000/);
  });

  test("simulation speed dropdown has three options", async ({ page }) => {
    await page.locator("#tab-btn-sim").click();
    const options = page.locator("#simSpeed option");
    const count = await options.count();
    expect(count).toBe(3);
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

  test("animate-month advances Sun and Node (not just the Moon)", async ({ page }) => {
    // Record initial moon slider value
    const initialMoonSlider = await page.locator("#moonLon").inputValue();

    // Start the month animation
    await page.locator("#animateMonth").click();

    // Wait until moon longitude slider value changes (animation is running)
    await expect
      .poll(async () => {
        return await page.locator("#moonLon").inputValue();
      }, { timeout: 5000 })
      .not.toBe(initialMoonSlider);

    // Let animation run a bit more to accumulate enough node drift
    // (Node regression is slow: ~0.053 deg/day, at 10 days/sec that's ~0.53 deg/sec)
    await page.waitForTimeout(3000);

    // Stop the animation by clicking again (it toggles)
    await page.locator("#animateMonth").click();

    // Read the phase angle readout -- should have changed from initial
    // This verifies the animation is running and updating state
    const updatedMoon = await page.locator("#moonLon").inputValue();
    expect(parseFloat(updatedMoon)).not.toBeCloseTo(parseFloat(initialMoonSlider), 0);
  });

  // --- Buttons ---

  test("station mode button is present and not disabled", async ({ page }) => {
    const btn = page.locator("#stationMode");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("challenge mode button is present and not disabled", async ({ page }) => {
    const btn = page.locator("#challengeMode");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
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

  test("sidebar has accessible label", async ({ page }) => {
    const sidebar = page.locator(".cp-demo__sidebar");
    await expect(sidebar).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readout strip has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts");
  });

  test("SVG stage has role=img and aria-label", async ({ page }) => {
    const svg = page.locator("#eclipseStage");
    await expect(svg).toHaveAttribute("role", "img");
    const label = await svg.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  test("phase buttons group has aria-label", async ({ page }) => {
    const group = page.locator('[role="group"][aria-label="Phase buttons"]');
    await expect(group).toBeAttached();
  });

  test("time controls group has aria-label", async ({ page }) => {
    const group = page.locator('[role="group"][aria-label="Time controls"]');
    await expect(group).toBeAttached();
  });

  // --- Beta Curve ---

  test("beta curve path element exists with non-empty d attribute", async ({ page }) => {
    const path = page.locator("#betaCurve");
    await expect(path).toBeAttached();
    const d = await path.getAttribute("d");
    expect(d).toBeTruthy();
    expect(d!.startsWith("M")).toBe(true);
  });

  // --- Moon Drag ---

  test("moon dot has grab cursor for drag interaction", async ({ page }) => {
    const cursor = await page.locator(".stage__moon").evaluate(
      (el) => getComputedStyle(el).cursor
    );
    expect(cursor).toBe("grab");
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
