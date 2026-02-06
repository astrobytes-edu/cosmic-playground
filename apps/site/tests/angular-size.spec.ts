import { test, expect } from "@playwright/test";

test.describe("Angular Size -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/angular-size/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__shelf")).toBeVisible();
  });

  test("starfield canvas is present and visible", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeVisible();
  });

  test("SVG stage has correct viewBox and accessible label", async ({ page }) => {
    const svg = page.locator("#stageSvg");
    await expect(svg).toHaveAttribute("viewBox", "20 40 640 300");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute("aria-label", "Angular size geometry");
  });

  test("sky view panel is present and renders object", async ({ page }) => {
    const skyView = page.locator("#skyViewSvg");
    await expect(skyView).toBeVisible();
    await expect(skyView).toHaveAttribute("role", "img");
    const skyObject = page.locator("#skyObject");
    await expect(skyObject).toBeAttached();
    // FOV label should be populated
    const fov = page.locator("#skyFov");
    await expect(fov).not.toBeEmpty();
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state (Sun preset)", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("angular-size-default-sun.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: Moon preset with orbit controls", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("angular-size-moon-orbit.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: Moon recession +500 Myr", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    await page.locator("#moonModeRecession").click();
    await page.locator("#moonRecessionTime").fill("500");
    await page.locator("#moonRecessionTime").dispatchEvent("input");
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("angular-size-moon-recession.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: challenge mode active", async ({ page }) => {
    await page.locator("#btn-challenges").click();
    await expect(page.locator(".cp-challenge-panel")).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("angular-size-challenge.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Preset Selection ---

  test("changing preset to Moon shows moon controls", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");

    const objectLabel = page.locator("#objectLabel");
    await expect(objectLabel).toContainText("Moon");

    const moonControls = page.locator("#moonControls");
    await expect(moonControls).toBeVisible();
  });

  test("preset changes update diameter and distance readouts", async ({ page }) => {
    await page.locator("#preset").selectOption("mars");
    // Mars diameter is 6779 km, shown with auto-formatting
    await expect(page.locator("#diameterKm")).toContainText("6779");
    await expect(page.locator("#diameterUnit")).toContainText("km");
    await expect(page.locator("#objectLabel")).toContainText("Mars");
  });

  test("everyday presets work (basketball)", async ({ page }) => {
    await page.locator("#preset").selectOption("basketball");
    await expect(page.locator("#objectLabel")).toContainText("Basketball");
  });

  test("cycling through all presets does not produce errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    const presetKeys = [
      "sun", "moon", "jupiter", "venus", "mars", "andromeda",
      "pleiades", "orionNebula", "lmc", "smc", "virgoCluster", "comaCluster",
      "basketball", "soccerball", "quarter", "thumb", "airplane", "iss"
    ];

    for (const key of presetKeys) {
      await page.locator("#preset").selectOption(key);
      // Verify readouts update (not empty)
      const theta = await page.locator("#thetaDeg").textContent();
      expect(theta?.trim().length).toBeGreaterThan(0);
    }

    expect(errors).toEqual([]);
  });

  // --- Slider Interaction ---

  test("distance slider updates readout when moved", async ({ page }) => {
    const before = await page.locator("#distanceKm").textContent();
    await page.locator("#distanceSlider").fill("200");
    await page.locator("#distanceSlider").dispatchEvent("input");
    const after = await page.locator("#distanceKm").textContent();
    expect(after).not.toBe(before);
  });

  test("diameter slider updates readout when moved", async ({ page }) => {
    const before = await page.locator("#diameterKm").textContent();
    await page.locator("#diameterSlider").fill("800");
    await page.locator("#diameterSlider").dispatchEvent("input");
    const after = await page.locator("#diameterKm").textContent();
    expect(after).not.toBe(before);
  });

  // --- Moon Controls ---

  test("moon orbit mode: orbit slider changes angular size", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    await expect(page.locator("#moonControls")).toBeVisible();
    await expect(page.locator("#moonModeOrbit")).toBeChecked();

    const thetaBefore = await page.locator("#thetaDeg").textContent();

    // Move orbit angle to 180 (apogee)
    await page.locator("#moonOrbitAngle").fill("180");
    await page.locator("#moonOrbitAngle").dispatchEvent("input");

    const thetaAfter = await page.locator("#thetaDeg").textContent();
    expect(thetaAfter).not.toBe(thetaBefore);
  });

  test("moon recession mode: switch and adjust time", async ({ page }) => {
    await page.locator("#preset").selectOption("moon");
    // Click the recession radio and fire the change event
    await page.locator("#moonModeRecession").click();

    // The orbit row should have hidden attribute, recession row should not
    await expect(page.locator("#moonOrbitRow")).toHaveAttribute("hidden", "");
    await expect(page.locator("#moonRecessionRow")).not.toHaveAttribute("hidden", "");

    // Adjust recession time to +500 Myr
    await page.locator("#moonRecessionTime").fill("500");
    await page.locator("#moonRecessionTime").dispatchEvent("input");

    // Moon farther away = smaller angular size
    const theta = await page.locator("#thetaDeg").textContent();
    expect(parseFloat(theta ?? "0")).toBeLessThan(0.5);
  });

  // --- New Presets ---

  test("deep-sky presets work (LMC, Virgo Cluster)", async ({ page }) => {
    await page.locator("#preset").selectOption("lmc");
    await expect(page.locator("#objectLabel")).toContainText("LMC");
    // LMC distance should show in kpc
    await expect(page.locator("#distanceUnit")).toContainText("kpc");

    await page.locator("#preset").selectOption("virgoCluster");
    await expect(page.locator("#objectLabel")).toContainText("Virgo");
    // Virgo Cluster distance should show in Mpc
    await expect(page.locator("#distanceUnit")).toContainText("Mpc");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("theta display auto-selects unit based on magnitude", async ({ page }) => {
    // Sun preset: theta ~0.53 deg -> should show arcmin
    const unit = await page.locator("#thetaDisplayUnit").textContent();
    expect(unit?.trim()).toBe("arcmin");

    // Switch to Mars: tiny angle -> should show arcsec
    await page.locator("#preset").selectOption("mars");
    const marsUnit = await page.locator("#thetaDisplayUnit").textContent();
    expect(marsUnit?.trim()).toBe("arcsec");
  });

  test("distance readout uses auto-formatted units", async ({ page }) => {
    // Sun default: distance ~1 AU
    await expect(page.locator("#distanceUnit")).toContainText("AU");

    // Switch to basketball: distance in m
    await page.locator("#preset").selectOption("basketball");
    await expect(page.locator("#distanceUnit")).toContainText("m");
  });

  test("diameter readout uses auto-formatted units", async ({ page }) => {
    // Sun: diameter ~1.39e6 km
    await expect(page.locator("#diameterUnit")).toContainText("km");

    // Switch to quarter: diameter in cm
    await page.locator("#preset").selectOption("quarter");
    await expect(page.locator("#diameterUnit")).toContainText("cm");
  });

  // --- Unit Conversion Controls ---

  test("distance unit selector changes readout unit", async ({ page }) => {
    // Default is auto (AU for Sun)
    await expect(page.locator("#distanceUnit")).toContainText("AU");

    // Force km
    await page.locator("#distanceUnitSelect").selectOption("km");
    await expect(page.locator("#distanceUnit")).toContainText("km");

    // Force pc
    await page.locator("#distanceUnitSelect").selectOption("pc");
    await expect(page.locator("#distanceUnit")).toContainText("pc");

    // Back to auto
    await page.locator("#distanceUnitSelect").selectOption("auto");
    await expect(page.locator("#distanceUnit")).toContainText("AU");
  });

  test("angle unit selector changes theta display unit", async ({ page }) => {
    // Default is auto (arcmin for Sun)
    await expect(page.locator("#thetaDisplayUnit")).toContainText("arcmin");

    // Force deg
    await page.locator("#angleUnitSelect").selectOption("deg");
    await expect(page.locator("#thetaDisplayUnit")).toContainText("deg");

    // Force arcsec
    await page.locator("#angleUnitSelect").selectOption("arcsec");
    await expect(page.locator("#thetaDisplayUnit")).toContainText("arcsec");
  });

  // --- Tabs / Shelf ---

  test("What to notice tab is active by default", async ({ page }) => {
    const noticeTab = page.getByRole("tab", { name: "What to notice" });
    await expect(noticeTab).toHaveAttribute("aria-selected", "true");
    const noticePanel = page.locator("#tab-notice");
    await expect(noticePanel).toBeVisible();
    await expect(noticePanel).toContainText("Nearer objects look larger");
  });

  test("Model notes tab can be activated and shows equations", async ({ page }) => {
    const modelTab = page.getByRole("tab", { name: "Model notes" });
    await modelTab.click();
    await expect(modelTab).toHaveAttribute("aria-selected", "true");
    const modelPanel = page.locator("#tab-model");
    await expect(modelPanel).toBeVisible();
    await expect(modelPanel).toContainText("Exact geometry");
  });

  // --- Station Mode ---

  test("station mode button activates station UI", async ({ page }) => {
    const stationBtn = page.locator("#btn-station-mode");
    await expect(stationBtn).toBeVisible();
    await expect(stationBtn).toBeEnabled();
    await stationBtn.click();

    // Station mode opens a modal dialog with the station table
    const stationDialog = page.getByRole("dialog", { name: "Station Mode: Angular Size" });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  // --- Challenge Mode ---

  test("challenge mode is enabled and starts challenges", async ({ page }) => {
    const challengeBtn = page.locator("#btn-challenges");
    await expect(challengeBtn).toBeVisible();
    await expect(challengeBtn).toBeEnabled();
    await challengeBtn.click();

    // Challenge UI should appear (panel inserted into controls)
    await expect(page.locator(".cp-challenge-panel")).toBeVisible();
  });

  // --- Accessibility ---

  test("status region has aria-live for announcements", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("role", "status");
  });

  test("controls panel has accessible label", async ({ page }) => {
    const controls = page.locator(".cp-demo__sidebar");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts strip has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts");
  });

  test("help button opens help modal", async ({ page }) => {
    const helpBtn = page.locator("#btn-help");
    await expect(helpBtn).toBeVisible();
    await expect(helpBtn).toBeEnabled();
    await helpBtn.click();

    // Help opens a modal dialog with keyboard shortcuts
    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });
});
