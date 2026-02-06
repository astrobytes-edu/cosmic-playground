import { test, expect } from "@playwright/test";

test.describe("Eclipse Geometry -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/eclipse-geometry/", { waitUntil: "domcontentloaded" });
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
    await page.locator("#nodeLon").fill("0");
    await page.locator("#nodeLon").dispatchEvent("input");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("eclipse-geometry-solar-eclipse.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: full moon near node", async ({ page }) => {
    await page.locator("#setFullMoon").click();
    await page.locator("#nodeLon").fill("180");
    await page.locator("#nodeLon").dispatchEvent("input");
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

  test("node longitude slider updates readout", async ({ page }) => {
    const slider = page.locator("#nodeLon");
    await slider.fill("45");
    await slider.dispatchEvent("input");
    const value = await page.locator("#nodeLonValue").textContent();
    expect(value).toContain("45");
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

  test("solar eclipse detected at New Moon near node with small beta", async ({ page }) => {
    // Set New Moon
    await page.locator("#setNewMoon").click();
    // Set node at same position as Moon (both at 0)
    await page.locator("#nodeLon").fill("0");
    await page.locator("#nodeLon").dispatchEvent("input");

    const outcome = await page.locator("#solarOutcome").textContent();
    expect(outcome).not.toBe("None");
    // Should be some kind of solar eclipse
    expect(outcome?.toLowerCase()).toContain("solar");
  });

  test("lunar eclipse detected at Full Moon near node with small beta", async ({ page }) => {
    // Set Full Moon
    await page.locator("#setFullMoon").click();
    // Set node at 180 (where Full Moon is)
    await page.locator("#nodeLon").fill("180");
    await page.locator("#nodeLon").dispatchEvent("input");

    const outcome = await page.locator("#lunarOutcome").textContent();
    expect(outcome).not.toBe("None");
    expect(outcome?.toLowerCase()).toContain("lunar");
  });

  test("no eclipse when Moon is far from node", async ({ page }) => {
    // New Moon with node at 90 degrees away
    await page.locator("#setNewMoon").click();
    await page.locator("#nodeLon").fill("90");
    await page.locator("#nodeLon").dispatchEvent("input");

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

  // --- Accordion Panels ---

  test("What to notice accordion is open by default", async ({ page }) => {
    const details = page.locator("details.cp-accordion").first();
    await expect(details).toHaveAttribute("open", "");
  });

  test("Model notes accordion exists and can be opened", async ({ page }) => {
    const modelNotes = page.locator("details.cp-accordion").nth(1);
    await expect(modelNotes).toBeAttached();

    const summary = modelNotes.locator("summary");
    await summary.click();
    await expect(modelNotes).toHaveAttribute("open", "");
  });

  // --- Simulation Controls ---

  test("simulation years slider uses log scale (max shows 1,000)", async ({ page }) => {
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
    const value = await page.locator("#simYearsValue").textContent();
    expect(value).toContain("10");
  });

  test("simulation slider has tick labels", async ({ page }) => {
    const ticks = page.locator(".sim-ticks span");
    const count = await ticks.count();
    expect(count).toBe(4);
    const texts = await ticks.allTextContents();
    expect(texts[0]).toBe("1");
    expect(texts[3]).toMatch(/1[,.]?000/);
  });

  test("simulation speed dropdown has three options", async ({ page }) => {
    const options = page.locator("#simSpeed option");
    const count = await options.count();
    expect(count).toBe(3);
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

  test("controls panel has accessible label", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
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

  // --- Moon Drag ---

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
