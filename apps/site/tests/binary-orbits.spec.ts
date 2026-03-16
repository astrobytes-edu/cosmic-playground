import { test, expect } from "@playwright/test";

const RV_PLOT_MARGIN = { left: 62, right: 28, top: 22, bottom: 42 } as const;

function rvPeakClickPosition(args: {
  box: { width: number; height: number };
  yMaxKmPerS: number;
  phaseCycle: number;
  velocityKmPerS: number;
  verticalOffsetPx?: number;
}) {
  const { box, yMaxKmPerS, phaseCycle, velocityKmPerS, verticalOffsetPx = 0 } = args;
  const plotWidth = box.width - RV_PLOT_MARGIN.left - RV_PLOT_MARGIN.right;
  const plotHeight = box.height - RV_PLOT_MARGIN.top - RV_PLOT_MARGIN.bottom;
  const x = RV_PLOT_MARGIN.left + (phaseCycle / 2) * plotWidth;
  const y =
    RV_PLOT_MARGIN.top
    + ((yMaxKmPerS - velocityKmPerS) / (2 * yMaxKmPerS)) * plotHeight
    + verticalOffsetPx;
  return { x, y };
}

test.describe("Binary Orbits -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visibility ---

  test("demo loads with title Binary Orbits", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Binary Orbits");
  });

  test("orbit canvas is visible", async ({ page }) => {
    await expect(page.locator("#orbitCanvas")).toBeVisible();
  });

  test("stage shows exactly one primary panel at a time", async ({ page }) => {
    await expect(page.locator("#orbitCanvas")).toBeVisible();
    await expect(page.locator("#rvPanel")).toBeHidden();
    await expect(page.locator("#spectrumPanel")).toBeHidden();
    await expect(page.locator("#energyPanel")).toBeHidden();

    await page.locator("#viewRv").click();
    await expect(page.locator("#orbitCanvas")).toBeHidden();
    await expect(page.locator("#rvPanel")).toBeVisible();
    await expect(page.locator("#spectrumPanel")).toBeHidden();
    await expect(page.locator("#energyPanel")).toBeHidden();

    await page.locator("#viewSpectrum").click();
    await expect(page.locator("#orbitCanvas")).toBeHidden();
    await expect(page.locator("#rvPanel")).toBeHidden();
    await expect(page.locator("#spectrumPanel")).toBeVisible();
    await expect(page.locator("#energyPanel")).toBeHidden();

    await page.locator("#viewEnergy").click();
    await expect(page.locator("#orbitCanvas")).toBeHidden();
    await expect(page.locator("#rvPanel")).toBeHidden();
    await expect(page.locator("#spectrumPanel")).toBeHidden();
    await expect(page.locator("#energyPanel")).toBeVisible();
  });

  test("controls panel is visible with header", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toBeVisible();
    const header = page.locator(".cp-panel-header");
    await expect(header.first()).toContainText("Binary Orbits");
  });

  test("readouts panel is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test("data-shell is viz-first", async ({ page }) => {
    await expect(page.locator("#cp-demo")).toHaveAttribute(
      "data-shell",
      "viz-first"
    );
  });

  // --- Controls ---

  test("mass ratio slider changes displayed value", async ({ page }) => {
    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.3";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#massRatioValue").textContent();
    expect(value).toContain("0.300");
  });

  test("separation slider changes displayed value", async ({ page }) => {
    const slider = page.locator("#separation");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "700";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = parseFloat(
      (await page.locator("#separationValue").textContent()) || "NaN",
    );
    expect(value).toBeGreaterThan(10);
  });

  test("mass ratio slider has correct min and max", async ({ page }) => {
    const slider = page.locator("#massRatio");
    await expect(slider).toHaveAttribute("min", "0.001");
    await expect(slider).toHaveAttribute("max", "1");
  });

  test("planet limit preset sets q to 0.001", async ({ page }) => {
    await page.locator("#presetPlanet").click();
    await expect(page.locator("#massRatio")).toHaveValue("0.001");
    await expect(page.locator("#massRatioValue")).toContainText("0.001");
  });

  test("auto-scale toggle is visible and defaults on", async ({ page }) => {
    const toggle = page.locator("#autoScaleLog");
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeChecked();
  });

  test("auto-scale toggle does not change physics readouts", async ({ page }) => {
    const before = {
      a1: await page.locator("#baryOffsetValue").textContent(),
      a2: await page.locator("#baryOffsetSecondaryValue").textContent(),
      v1: await page.locator("#speedPrimaryValue").textContent(),
      v2: await page.locator("#speedSecondaryValue").textContent(),
      p: await page.locator("#periodValue").textContent(),
      k1: await page.locator("#k1Value").textContent(),
      k2: await page.locator("#k2Value").textContent(),
      e: await page.locator("#energyTotalValue").textContent(),
    };

    await page.locator("#autoScaleLog").uncheck();
    await page.waitForTimeout(80);

    const after = {
      a1: await page.locator("#baryOffsetValue").textContent(),
      a2: await page.locator("#baryOffsetSecondaryValue").textContent(),
      v1: await page.locator("#speedPrimaryValue").textContent(),
      v2: await page.locator("#speedSecondaryValue").textContent(),
      p: await page.locator("#periodValue").textContent(),
      k1: await page.locator("#k1Value").textContent(),
      k2: await page.locator("#k2Value").textContent(),
      e: await page.locator("#energyTotalValue").textContent(),
    };

    expect(after).toEqual(before);
  });

  test("separation slider has correct min and max", async ({ page }) => {
    const slider = page.locator("#separation");
    await expect(slider).toHaveAttribute("min", "0");
    await expect(slider).toHaveAttribute("max", "1000");
  });

  // --- Readouts ---

  test("barycenter offset readout is numeric with AU unit", async ({
    page,
  }) => {
    const value = await page.locator("#baryOffsetValue").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
    const unit = page
      .locator(".cp-readout__unit")
      .filter({ hasText: "AU" })
      .first();
    await expect(unit).toBeVisible();
  });

  test("period readout is numeric with yr unit", async ({ page }) => {
    const value = await page.locator("#periodValue").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
    const unit = page
      .locator(".cp-readout__unit")
      .filter({ hasText: "yr" })
      .first();
    await expect(unit).toBeVisible();
  });

  test("mass-ratio changes immediately update synchronized live physics readouts", async ({ page }) => {
    const before = {
      q: await page.locator("#massRatioValue").textContent(),
      a1: parseFloat((await page.locator("#baryOffsetValue").textContent()) || "NaN"),
      a2: parseFloat((await page.locator("#baryOffsetSecondaryValue").textContent()) || "NaN"),
      v1: parseFloat((await page.locator("#speedPrimaryValue").textContent()) || "NaN"),
      v2: parseFloat((await page.locator("#speedSecondaryValue").textContent()) || "NaN"),
      k1: parseFloat((await page.locator("#k1Value").textContent()) || "NaN"),
      k2: parseFloat((await page.locator("#k2Value").textContent()) || "NaN"),
    };

    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.306";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await expect(page.locator("#massRatioValue")).toContainText("0.306");

    const after = {
      a1: parseFloat((await page.locator("#baryOffsetValue").textContent()) || "NaN"),
      a2: parseFloat((await page.locator("#baryOffsetSecondaryValue").textContent()) || "NaN"),
      v1: parseFloat((await page.locator("#speedPrimaryValue").textContent()) || "NaN"),
      v2: parseFloat((await page.locator("#speedSecondaryValue").textContent()) || "NaN"),
      k1: parseFloat((await page.locator("#k1Value").textContent()) || "NaN"),
      k2: parseFloat((await page.locator("#k2Value").textContent()) || "NaN"),
    };

    expect(after.a1).not.toBe(before.a1);
    expect(after.a2).not.toBe(before.a2);
    expect(after.v1).not.toBe(before.v1);
    expect(after.v2).not.toBe(before.v2);
    expect(after.k1).not.toBe(before.k1);
    expect(after.k2).not.toBe(before.k2);
    expect(after.a2).toBeGreaterThan(after.a1);
    expect(after.v2).toBeGreaterThan(after.v1);
    expect(after.k2).toBeGreaterThan(after.k1);
  });

  test("reduced-motion mode still rerenders immediately when mass ratio changes", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    const before = await page.locator("#orbitCanvas").evaluate((el) => (el as HTMLCanvasElement).toDataURL());
    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.306";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const after = await page.locator("#orbitCanvas").evaluate((el) => (el as HTMLCanvasElement).toDataURL());
    expect(after).not.toBe(before);

    await context.close();
  });

  test("changing separation updates period", async ({ page }) => {
    const before = await page.locator("#periodValue").textContent();
    const slider = page.locator("#separation");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "900";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = await page.locator("#periodValue").textContent();
    expect(after).not.toBe(before);
  });

  test("secondary barycenter and speed readouts are numeric", async ({ page }) => {
    const a2 = await page.locator("#baryOffsetSecondaryValue").textContent();
    const v1 = await page.locator("#speedPrimaryValue").textContent();
    const v2 = await page.locator("#speedSecondaryValue").textContent();
    expect(parseFloat(a2 || "NaN")).not.toBeNaN();
    expect(parseFloat(v1 || "NaN")).not.toBeNaN();
    expect(parseFloat(v2 || "NaN")).not.toBeNaN();
  });

  test("shared-period cue states P1 equals P2", async ({ page }) => {
    await expect(page.locator("#periodSharedCue")).toContainText("P1 = P2");
  });

  test("motion mode toggle is available", async ({ page }) => {
    const motionMode = page.locator("#motionMode");
    await expect(motionMode).toBeVisible();
    await motionMode.selectOption("physical");
    await expect(motionMode).toHaveValue("physical");
  });

  test("motion mode toggle preserves physical readouts", async ({ page }) => {
    const periodBefore = await page.locator("#periodValue").textContent();
    const a1Before = await page.locator("#baryOffsetValue").textContent();
    const mode = page.locator("#motionMode");
    await mode.selectOption("physical");
    const periodPhysical = await page.locator("#periodValue").textContent();
    const a1Physical = await page.locator("#baryOffsetValue").textContent();
    await mode.selectOption("normalized");
    const periodNormalized = await page.locator("#periodValue").textContent();
    const a1Normalized = await page.locator("#baryOffsetValue").textContent();

    expect(periodPhysical).toBe(periodBefore);
    expect(a1Physical).toBe(a1Before);
    expect(periodNormalized).toBe(periodBefore);
    expect(a1Normalized).toBe(a1Before);
  });

  test("copy results stays available during prediction compare workflow", async ({ page }) => {
    await page.locator("#startPrediction").click();
    await expect(page.locator("#predictionFeedback")).toContainText("Baseline captured");
    await page.locator("#copyResults").click();
    const status = page.locator("#status");
    await expect(status).toContainText(/Copied|Copy failed/, {
      timeout: 3000,
    });
  });

  // --- Canvas Rendering ---

  test("canvas has non-zero dimensions", async ({ page }) => {
    const dims = await page.locator("#orbitCanvas").evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height };
    });
    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
  });

  test("canvas renders non-transparent content", async ({ page }) => {
    // Wait for at least one frame to render
    await page.waitForTimeout(200);
    const alpha = await page.locator("#orbitCanvas").evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;
      const cx = Math.floor(canvas.width / 2);
      const cy = Math.floor(canvas.height / 2);
      const pixel = ctx.getImageData(cx, cy, 1, 1).data;
      return pixel[3];
    });
    expect(alpha).toBeGreaterThan(0);
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
    const label = await stage.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  test("readout units are in separate .cp-readout__unit spans", async ({
    page,
  }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("tab navigation reaches mass ratio slider", async ({ page }) => {
    await page.locator("#massRatio").focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe("massRatio");
  });

  test("stage view radio group supports Arrow/Home/End keyboard navigation", async ({ page }) => {
    await page.locator("#viewOrbit").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#viewRv")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#viewSpectrum")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#viewEnergy")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Home");
    await expect(page.locator("#viewOrbit")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("End");
    await expect(page.locator("#viewEnergy")).toHaveAttribute("aria-checked", "true");
  });

  test("energy view can be reached and readouts remain finite after separation change", async ({ page }) => {
    await page.locator("#viewEnergy").click();
    await expect(page.locator("#energyPanel")).toBeVisible();
    await expect(page.locator("#energyTotalValue")).toBeVisible();
    await expect(page.locator("#energyPanel .cp-muted")).toContainText(
      "Signed circular-orbit energies in teaching units:",
    );

    const before = parseFloat((await page.locator("#energyTotalValue").textContent()) || "NaN");
    expect(Number.isFinite(before)).toBe(true);

    const slider = page.locator("#separation");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "780";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const after = parseFloat((await page.locator("#energyTotalValue").textContent()) || "NaN");
    expect(Number.isFinite(after)).toBe(true);
    expect(after).not.toBe(before);
  });

  test("spectrum view exposes SB1/SB2 and element controls", async ({ page }) => {
    await page.locator("#viewSpectrum").click();
    await expect(page.locator("#spectrumPanel")).toBeVisible();
    await expect(page.locator("#spectrumCanvas")).toBeVisible();
    await expect(page.locator("#spectroscopySb2")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#elementH")).toHaveAttribute("aria-checked", "true");

    await page.locator("#spectroscopySb1").click();
    await expect(page.locator("#spectroscopySb1")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#spectroscopySb2")).toHaveAttribute("aria-checked", "false");

    await page.locator("#elementNa").click();
    await expect(page.locator("#elementNa")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#elementH")).toHaveAttribute("aria-checked", "false");
  });

  // --- Station Mode ---

  test("station mode button is visible", async ({ page }) => {
    await expect(page.locator("#stationMode")).toBeVisible();
  });

  test("clicking station mode opens dialog with title", async ({ page }) => {
    await page.locator("#stationMode").click();
    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Binary Orbits",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  test("station mode dialog has Add comparison set button", async ({
    page,
  }) => {
    await page.locator("#stationMode").click();
    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Binary Orbits",
    });
    await expect(stationDialog).toBeVisible();
    const addBtn = stationDialog.getByRole("button", {
      name: "Add comparison set",
    });
    await expect(addBtn).toBeVisible();
  });

  test("station snapshot remains available during prediction compare workflow", async ({ page }) => {
    await page.locator("#startPrediction").click();
    await page.locator("#stationMode").click();
    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Binary Orbits",
    });
    await expect(stationDialog).toBeVisible();
    await stationDialog.getByRole("button", { name: "Add row (snapshot)" }).click();
    await expect(stationDialog.locator(".cp-station-table")).not.toContainText("No rows yet.");
  });

  test("prediction compare uses a captured baseline while the live demo keeps updating", async ({ page }) => {
    await page.locator("#startPrediction").click();
    await expect(page.locator("#predictionFeedback")).toContainText("Baseline captured");

    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.306";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await expect(page.locator("#massRatioValue")).toContainText("0.306");
    await expect(page.locator("#baryOffsetSecondaryValue")).not.toContainText("2.000");

    await page.locator("#predictPeriod").selectOption("increase");
    await page.locator("#predictV1").selectOption("decrease");
    await page.locator("#predictA1").selectOption("decrease");
    await page.locator("#revealPrediction").click();

    await expect(page.locator("#predictionOutcome")).toContainText("Actual changes:");
    await expect(page.locator("#predictionOutcome")).toContainText(/P .*v1 .*a1/);
  });

  test("invariant discrimination flags selected distractors", async ({ page }) => {
    await page.locator("#invariantSum").check();
    await page.locator("#invariantBary").check();
    await page.locator("#invariantSpeed").check();
    await page.locator("#invariantPeriod").check();
    await page.locator("#invariantEqualOffsets").check();
    await page.locator("#invariantEqualRv").check();
    await page.locator("#invariantCheck").click();
    await expect(page.locator("#invariantFeedback")).toContainText("distractor");
  });

  test("RV challenge workflow: start, measure, reveal, and compare inferred q", async ({ page }) => {
    await page.locator("#viewRv").click();
    await page.locator("#rvChallengeStart").click();
    await expect(page.locator("#rvChallengeFeedback")).toContainText("Challenge active");

    const rvCanvas = page.locator("#rvCanvas");
    const box = await rvCanvas.boundingBox();
    if (!box) throw new Error("RV canvas has no bounding box.");
    const trueK1 = parseFloat((await page.locator("#k1Value").textContent()) || "NaN");
    const trueK2 = parseFloat((await page.locator("#k2Value").textContent()) || "NaN");
    const yMaxKmPerS = Math.max(trueK1, trueK2) * 1.2;

    await rvCanvas.click({
      position: rvPeakClickPosition({
        box,
        yMaxKmPerS,
        phaseCycle: 0.25,
        velocityKmPerS: trueK1,
      }),
    });
    await rvCanvas.click({
      position: rvPeakClickPosition({
        box,
        yMaxKmPerS,
        phaseCycle: 0.25,
        velocityKmPerS: -trueK2,
      }),
    });

    await expect(page.locator("#rvMeasuredK1Value")).not.toHaveText("—");
    await expect(page.locator("#rvMeasuredK2Value")).not.toHaveText("—");
    await expect(page.locator("#rvInferredQValue")).not.toHaveText("—");

    await page.locator("#rvChallengeReveal").click();
    await expect(page.locator("#rvChallengeFeedback")).toContainText("Inferred q");
    await expect(page.locator("#rvChallengeFeedback")).toContainText("true q");
    await expect(page.locator("#rvChallengeFeedback")).toContainText("error");
  });

  test("RV challenge measurements come from user clicks, not the exact hidden model amplitudes", async ({ page }) => {
    await page.locator("#viewRv").click();
    const trueK1 = parseFloat((await page.locator("#k1Value").textContent()) || "NaN");
    const trueK2 = parseFloat((await page.locator("#k2Value").textContent()) || "NaN");

    await page.locator("#rvChallengeStart").click();
    const rvCanvas = page.locator("#rvCanvas");
    const box = await rvCanvas.boundingBox();
    if (!box) throw new Error("RV canvas has no bounding box.");
    const yMaxKmPerS = Math.max(trueK1, trueK2) * 1.2;

    await rvCanvas.click({
      position: rvPeakClickPosition({
        box,
        yMaxKmPerS,
        phaseCycle: 0.25,
        velocityKmPerS: trueK1,
        verticalOffsetPx: 7,
      }),
    });
    await rvCanvas.click({
      position: rvPeakClickPosition({
        box,
        yMaxKmPerS,
        phaseCycle: 0.25,
        velocityKmPerS: -trueK2,
        verticalOffsetPx: -7,
      }),
    });

    const measuredK1 = parseFloat((await page.locator("#rvMeasuredK1Value").textContent()) || "NaN");
    const measuredK2 = parseFloat((await page.locator("#rvMeasuredK2Value").textContent()) || "NaN");
    expect(Number.isFinite(measuredK1)).toBe(true);
    expect(Number.isFinite(measuredK2)).toBe(true);
    expect(Math.abs(measuredK1 - trueK1)).toBeGreaterThan(0.02);
    expect(Math.abs(measuredK2 - trueK2)).toBeGreaterThan(0.02);
  });

  test("copy and snapshot are locked while RV challenge is active and unrevealed", async ({ page }) => {
    await page.locator("#viewRv").click();
    await page.locator("#rvChallengeStart").click();
    await page.locator("#copyResults").click();
    await expect(page.locator("#status")).toContainText("Finish or reveal the RV challenge before copying results.");

    await page.locator("#stationMode").click();
    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Binary Orbits",
    });
    await expect(stationDialog).toBeVisible();
    await stationDialog.getByRole("button", { name: "Add row (snapshot)" }).click();
    await expect(page.locator("#status")).toContainText("Finish or reveal the RV challenge before adding snapshot row.");
  });

  // --- Export ---

  test("copy results button is visible", async ({ page }) => {
    await expect(page.locator("#copyResults")).toBeVisible();
  });

  test("clicking copy results triggers status message", async ({ page }) => {
    await page.locator("#copyResults").click();
    const status = page.locator("#status");
    await expect(status).toContainText(/Copied|Copy failed/, {
      timeout: 3000,
    });
  });

  test("export payload includes energy and RV challenge state fields", async ({ page }) => {
    const payload = await page.evaluate(() => {
      const cp = (window as Window & { __cp?: { exportResults?: () => unknown } }).__cp;
      if (!cp || typeof cp.exportResults !== "function") return null;
      return cp.exportResults() as {
        parameters: Array<{ name: string; value: string }>;
        readouts: Array<{ name: string; value: string }>;
      };
    });

    expect(payload).toBeTruthy();
    const parameterNames = payload!.parameters.map((entry) => entry.name);
    const readoutNames = payload!.readouts.map((entry) => entry.name);

    expect(parameterNames).toContain("RV challenge state");
    expect(parameterNames).toContain("Spectroscopy mode");
    expect(parameterNames).toContain("Spectrum element");
    expect(readoutNames).toContain("Mass function f(m) (M_sun)");
    expect(readoutNames).toContain("Primary minimum mass M1 sin^3(i) (M_sun)");
    expect(readoutNames).toContain("Total orbital energy E (M_sun AU^2/yr^2)");
  });

  test("export payload includes live integrity readouts", async ({ page }) => {
    const payload = await page.evaluate(() => {
      const cp = (window as Window & { __cp?: { exportResults?: () => unknown } }).__cp;
      if (!cp || typeof cp.exportResults !== "function") return null;
      return cp.exportResults() as {
        readouts: Array<{ name: string; value: string }>;
      };
    });

    expect(payload).toBeTruthy();
    const readoutNames = payload!.readouts.map((entry) => entry.name);
    expect(readoutNames).toContain("Integrity check a1 + a2 vs a");
    expect(readoutNames).toContain("Integrity check M1 a1 vs M2 a2");
    expect(readoutNames).toContain("Integrity check K1 / K2 vs q");
  });

  // --- Visual Regression ---

  test("screenshot: default view", async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("binary-orbits-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("screenshot: mobile default view", async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 1100 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("binary-orbits-mobile-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("screenshot: low mass ratio q=0.2", async ({ page }) => {
    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "0.2";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("binary-orbits-q0p2.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Binary Orbits -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.addInitScript(() => {
      (window as any).__cpRafCount = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        (window as any).__cpRafCount++;
        return original(cb);
      }) as any;
    });

    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    await page.waitForTimeout(300);

    const count = await page.evaluate(() => (window as any).__cpRafCount);
    expect(
      count,
      "rAF should not loop under reduced motion"
    ).toBeLessThanOrEqual(1);
  });
});
