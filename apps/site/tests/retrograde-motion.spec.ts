import { test, expect } from "@playwright/test";

test.describe("Retrograde Motion -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/retrograde-motion/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with title Retrograde Motion", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Retrograde Motion");
  });

  test("sidebar panel is visible with header", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar")).toBeVisible();
    const header = page.locator(".cp-panel-header");
    await expect(header).toContainText("Retrograde Motion");
  });

  test("stage section with all three SVGs is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator("#plotSvg")).toBeVisible();
    await expect(page.locator("#orbitSvg")).toBeVisible();
    await expect(page.locator("#skySvg")).toBeVisible();
  });

  test("readouts strip is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test("viz-layout has two panel columns", async ({ page }) => {
    const panels = page.locator(".viz-panel");
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(3); // plot + orbit + sky
  });

  test("shelf has three tabs", async ({ page }) => {
    const tabs = page.locator(".cp-tab");
    const count = await tabs.count();
    expect(count).toBe(3);
  });

  // --- Controls Interaction ---

  test("preset Earth->Venus changes observer and target selects", async ({ page }) => {
    await page.locator("#preset").selectOption("earth-venus");
    const obs = await page.locator("#observer").inputValue();
    const tgt = await page.locator("#target").inputValue();
    expect(obs).toBe("Earth");
    expect(tgt).toBe("Venus");
  });

  test("observer select changes orbit view", async ({ page }) => {
    // Open the advanced accordion first
    await page.locator(".cp-accordion summary").click();
    await page.locator("#observer").selectOption("Mars");
    const childCount = await page.locator("#orbitSvg").evaluate(
      (el) => el.children.length
    );
    expect(childCount).toBeGreaterThan(0);
  });

  test("target select changes orbit view", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    await page.locator("#target").selectOption("Jupiter");
    const childCount = await page.locator("#orbitSvg").evaluate(
      (el) => el.children.length
    );
    expect(childCount).toBeGreaterThan(0);
  });

  test("Earth target option supports Venus observer comparisons", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    const earthTargetOptions = page.locator("#target option[value='Earth']");
    expect(await earthTargetOptions.count()).toBeGreaterThan(0);
    await page.locator("#observer").selectOption("Venus");
    await page.locator("#target").selectOption("Earth");
    const lambdaText = await page.locator("#readoutLambda").textContent();
    expect(lambdaText).toBeTruthy();
    expect(parseFloat(lambdaText || "NaN")).not.toBeNaN();
  });

  test("window months slider updates displayed month count", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    const slider = page.locator(".cp-demo__sidebar #windowMonths");
    await expect(slider).toHaveAttribute("max", "72");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "48";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#windowMonthsValue").textContent();
    expect(value).toContain("48");
  });

  test("max window scrubbing is stable and uses split svg layers", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    await page.locator("#windowMonths").evaluate((el: HTMLInputElement) => {
      el.value = "72";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator("#scrubSlider").fill("1800");
    const dayText = await page.locator("#readoutDay").textContent();
    expect(parseFloat(dayText || "NaN")).not.toBeNaN();

    await expect(page.locator("#plotSvg g[data-layer='static']")).toHaveCount(1);
    await expect(page.locator("#plotSvg g[data-layer='dynamic']")).toHaveCount(1);
    await expect(page.locator("#orbitSvg g[data-layer='static']")).toHaveCount(1);
    await expect(page.locator("#orbitSvg g[data-layer='dynamic']")).toHaveCount(1);
    await expect(page.locator("#skySvg g[data-layer='static']")).toHaveCount(1);
    await expect(page.locator("#skySvg g[data-layer='dynamic']")).toHaveCount(1);
  });

  test("plot step select changes decimation", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    await page.locator("#plotStepDay").selectOption("2");
    const val = await page.locator("#plotStepDay").inputValue();
    expect(val).toBe("2");
  });

  test("scrub slider updates readout day value", async ({ page }) => {
    const slider = page.locator("#scrubSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "100";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#readoutDay").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  test("show other planets checkbox can be toggled", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    await page.waitForTimeout(300);
    const checkbox = page.locator("#showOtherPlanets");
    await expect(checkbox).not.toBeChecked();
    await checkbox.evaluate((el: HTMLInputElement) => el.click());
    await expect(checkbox).toBeChecked();
    await checkbox.evaluate((el: HTMLInputElement) => el.click());
    await expect(checkbox).not.toBeChecked();
  });

  test("show zodiac checkbox can be toggled", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    await page.waitForTimeout(300);
    const checkbox = page.locator("#showZodiac");
    await expect(checkbox).not.toBeChecked();
    await checkbox.evaluate((el: HTMLInputElement) => {
      el.click();
    });
    await expect(checkbox).toBeChecked();
  });

  // --- Sidebar Transport + Timeline ---

  test("sidebar has play, pause, step, reset buttons", async ({ page }) => {
    await expect(page.locator(".cp-demo__sidebar #btn-play")).toBeVisible();
    await expect(page.locator(".cp-demo__sidebar #btn-pause")).toBeVisible();
    await expect(page.locator(".cp-demo__sidebar #btn-step-back")).toBeVisible();
    await expect(page.locator(".cp-demo__sidebar #btn-step-forward")).toBeVisible();
    await expect(page.locator(".cp-demo__sidebar #btn-reset")).toBeVisible();
  });

  test("sidebar speed select defaults to 5x", async ({ page }) => {
    const val = await page.locator(".cp-demo__sidebar #speed-select").inputValue();
    expect(val).toBe("5");
  });

  test("timeline row is stage-adjacent and visible", async ({ page }) => {
    await expect(page.locator(".retro__timeline-row #scrubSlider")).toBeVisible();
    await expect(page.locator(".retro__timeline-row #nextStationary")).toBeVisible();
  });

  test("step forward button advances cursor", async ({ page }) => {
    const before = await page.locator("#readoutDay").textContent();
    await page.locator(".cp-demo__sidebar #btn-step-forward").click();
    const after = await page.locator("#readoutDay").textContent();
    const beforeNum = parseFloat(before || "0");
    const afterNum = parseFloat(after || "0");
    expect(afterNum).toBeGreaterThan(beforeNum);
  });

  test("reset button returns cursor to start", async ({ page }) => {
    // Advance first
    await page.locator(".cp-demo__sidebar #btn-step-forward").click();
    const afterStep = parseFloat(await page.locator("#readoutDay").textContent() || "0");
    expect(afterStep).toBeGreaterThan(0);
    // Reset
    await page.locator(".cp-demo__sidebar #btn-reset").click();
    const afterReset = parseFloat(await page.locator("#readoutDay").textContent() || "0");
    expect(afterReset).toBe(0);
  });

  // --- Navigation Buttons ---

  test("next stationary button updates cursor day readout", async ({ page }) => {
    const before = await page.locator("#readoutDay").textContent();
    await page.locator("#nextStationary").click();
    const after = await page.locator("#readoutDay").textContent();
    expect(after).not.toBe(before);
  });

  test("previous stationary button works after advancing cursor", async ({ page }) => {
    await page.locator("#nextStationary").click();
    await page.locator("#prevStationary").click();
    const afterPrev = await page.locator("#readoutDay").textContent();
    expect(afterPrev).toBeTruthy();
    expect(parseFloat(afterPrev || "NaN")).not.toBeNaN();
  });

  test("center on retrograde button moves cursor", async ({ page }) => {
    const before = await page.locator("#readoutDay").textContent();
    await page.locator("#centerRetrograde").click();
    const after = await page.locator("#readoutDay").textContent();
    expect(after).not.toBe(before);
  });

  test("after next stationary, state readout shows a valid label", async ({ page }) => {
    await page.locator("#nextStationary").click();
    const stateText = await page.locator("#readoutState").textContent();
    expect(stateText).toMatch(/Direct|Retrograde|Stationary/);
  });

  test("navigation buttons do not crash when cursor is at boundary", async ({ page }) => {
    const slider = page.locator("#scrubSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = el.max;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator("#nextStationary").click();
    const dayText = await page.locator("#readoutDay").textContent();
    expect(parseFloat(dayText || "NaN")).not.toBeNaN();
  });

  // --- Readouts Verification ---

  test("model day readout shows numeric value with days unit", async ({ page }) => {
    const value = await page.locator("#readoutDay").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
    // The readout strip should contain a "days" unit span
    const readoutStrip = page.locator(".cp-readout-strip .cp-readout__unit");
    const first = readoutStrip.first();
    const unitText = await first.textContent();
    expect(unitText?.trim()).toBe("days");
  });

  test("lambda readout shows numeric value with deg unit", async ({ page }) => {
    const slider = page.locator("#scrubSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#readoutLambda").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  test("derivative readout shows numeric value with deg/day unit", async ({ page }) => {
    const slider = page.locator("#scrubSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#readoutSlope").textContent();
    expect(value).toBeTruthy();
    expect(parseFloat(value || "NaN")).not.toBeNaN();
  });

  test("state readout shows Direct or Retrograde", async ({ page }) => {
    const slider = page.locator("#scrubSlider");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const stateText = await page.locator("#readoutState").textContent();
    expect(stateText).toMatch(/Direct|Retrograde|Stationary/);
  });

  test("geometry hint readout distinguishes superior vs inferior cases", async ({ page }) => {
    await expect(page.locator("#readoutGeometryHint")).toContainText(/Superior|Inferior/);
    await page.locator(".cp-accordion summary").click();
    await page.locator("#target").selectOption("Venus");
    await expect(page.locator("#readoutGeometryHint")).toContainText("Inferior");
  });

  test("retrograde duration readout shows days value or em dash", async ({ page }) => {
    const dur = await page.locator("#readoutRetroDuration").textContent();
    expect(dur).toBeTruthy();
    // Should be a number (from nearest interval) or an em dash
    const num = parseFloat(dur || "");
    if (dur !== "\u2014") {
      expect(num).not.toBeNaN();
    }
  });

  // --- State Badge ---

  test("state badge is visible", async ({ page }) => {
    await expect(page.locator("#stateBadge")).toBeVisible();
  });

  test("state badge shows Direct initially", async ({ page }) => {
    const text = await page.locator("#stateBadge").textContent();
    expect(text).toContain("Direct");
  });

  // --- Keyboard & Accessibility ---

  test("arrow keys step cursor when plot is focused", async ({ page }) => {
    const plotFocus = page.locator("#plotFocus");
    await plotFocus.focus();
    const before = await page.locator("#readoutDay").textContent();
    await plotFocus.press("ArrowRight");
    const after = await page.locator("#readoutDay").textContent();
    const beforeNum = parseFloat(before || "0");
    const afterNum = parseFloat(after || "0");
    expect(afterNum).toBeGreaterThan(beforeNum);
  });

  test("tab navigation reaches controls", async ({ page }) => {
    await page.locator("#preset").focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe("preset");
  });

  test("copy results button triggers status message", async ({ page }) => {
    await page.locator("#copyResults").click();
    await page.waitForTimeout(300);
    const statusText = await page.locator("#status").textContent();
    expect(statusText).toBeTruthy();
    expect(statusText!.length).toBeGreaterThan(0);
  });

  test("pedagogical content is present in shelf tabs", async ({ page }) => {
    // First tab (notice) is visible by default
    const noticeTab = page.locator("#tab-notice");
    const noticeText = await noticeTab.textContent();
    expect(noticeText).toContain("reverse");
    expect(noticeText).toContain("viewing-geometry");
  });

  // --- DOM Structure ---

  test("readout units are in separate .cp-readout__unit spans", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    // days, deg, deg/day, days (retro duration) + months in sidebar
    expect(count).toBeGreaterThanOrEqual(4);
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

  test("plot focus area has tabindex and aria-label", async ({ page }) => {
    const plotFocus = page.locator("#plotFocus");
    await expect(plotFocus).toHaveAttribute("tabindex", "0");
    const label = await plotFocus.getAttribute("aria-label");
    expect(label).toContain("Longitude plot");
  });

  test("copy results button is present", async ({ page }) => {
    const btn = page.locator("#copyResults");
    await expect(btn).toBeVisible();
  });

  test("show other planets checkbox adds more orbit paths", async ({ page }) => {
    await page.locator(".cp-accordion summary").click();
    await page.waitForTimeout(300);
    const countBefore = await page.locator("#orbitSvg path").count();
    await page.locator("#showOtherPlanets").evaluate((el: HTMLInputElement) => {
      el.click();
    });
    await page.waitForTimeout(200);
    const countAfter = await page.locator("#orbitSvg path").count();
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test("plot SVG contains a main curve path element", async ({ page }) => {
    const paths = page.locator("#plotSvg path");
    const count = await paths.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("orbit SVG contains sun circle at center", async ({ page }) => {
    const circles = page.locator("#orbitSvg circle");
    const count = await circles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // --- Sky View ---

  test("sky view SVG is visible with background", async ({ page }) => {
    await expect(page.locator("#skySvg")).toBeVisible();
    const rects = page.locator("#skySvg rect");
    const count = await rects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // --- Visual Regression Screenshots (skipped) ---

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
    await page.locator(".cp-accordion summary").click();
    await page.waitForTimeout(200);
    await page.locator("#showOtherPlanets").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("retrograde-motion-all-planets.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Retrograde Motion -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/retrograde-motion/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    // Play button (#btn-play) should be disabled
    await expect(page.locator("#btn-play")).toBeDisabled({ timeout: 5000 });
  });
});
