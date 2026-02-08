import { test, expect } from "@playwright/test";

test.describe("Seasons -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/seasons/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  // --- Layout & Visual ---

  test("demo loads with all four shell sections visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator(".cp-demo__stage")).toBeVisible();
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
    await expect(page.locator(".cp-demo__drawer")).toBeVisible();
  });

  test("starfield canvas is present and visible", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeVisible();
  });

  test("SVG stage has correct viewBox and accessible label", async ({ page }) => {
    const svg = page.locator("#seasonStage");
    await expect(svg).toHaveAttribute("viewBox", "0 0 920 420");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute(
      "aria-label",
      "Seasons visualization (orbit + sunlight geometry)"
    );
  });

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("seasons-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: station mode active", async ({ page }) => {
    await page.locator("#stationMode").click();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("seasons-station.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Slider Interaction ---

  test("day-of-year slider updates date readout", async ({ page }) => {
    const before = await page.locator("#dateValue").textContent();
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const after = await page.locator("#dateValue").textContent();
    expect(after).not.toBe(before);
  });

  test("tilt slider updates declination readout", async ({ page }) => {
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const before = await page.locator("#declinationValue").textContent();

    await page.locator("#tilt").fill("10");
    await page.locator("#tilt").dispatchEvent("input");
    const after = await page.locator("#declinationValue").textContent();
    expect(after).not.toBe(before);
  });

  test("latitude slider updates noon altitude readout", async ({ page }) => {
    const before = await page.locator("#noonAltitudeValue").textContent();
    await page.locator("#latitude").fill("60");
    await page.locator("#latitude").dispatchEvent("input");
    const after = await page.locator("#noonAltitudeValue").textContent();
    expect(after).not.toBe(before);
  });

  // --- Anchor Buttons ---

  test("anchor buttons set day-of-year to expected values", async ({ page }) => {
    // Preset transitions animate over 500ms; wait for each to finish
    await page.locator("#anchorJunSol").click();
    await page.waitForTimeout(700);
    expect(await page.locator("#dayOfYear").inputValue()).toBe("172");

    await page.locator("#anchorMarEqx").click();
    await page.waitForTimeout(700);
    expect(await page.locator("#dayOfYear").inputValue()).toBe("80");

    await page.locator("#anchorSepEqx").click();
    await page.waitForTimeout(700);
    expect(await page.locator("#dayOfYear").inputValue()).toBe("266");

    await page.locator("#anchorDecSol").click();
    await page.waitForTimeout(700);
    expect(await page.locator("#dayOfYear").inputValue()).toBe("356");
  });

  // --- Season Labels ---

  test("March equinox shows Spring/Autumn", async ({ page }) => {
    await page.locator("#anchorMarEqx").click();
    await expect(page.locator("#seasonNorthValue")).toHaveText("Spring");
    await expect(page.locator("#seasonSouthValue")).toHaveText("Autumn");
  });

  test("June solstice shows Summer/Winter", async ({ page }) => {
    await page.locator("#anchorJunSol").click();
    await expect(page.locator("#seasonNorthValue")).toHaveText("Summer");
    await expect(page.locator("#seasonSouthValue")).toHaveText("Winter");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // --- Accordion / Drawer ---

  test("What to notice accordion is open by default", async ({ page }) => {
    const firstAccordion = page.locator(".cp-accordion").first();
    await expect(firstAccordion).toHaveAttribute("open", "");
    await expect(firstAccordion).toContainText("What to notice");
  });

  test("Model notes accordion can be opened", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
    await expect(modelNotes).toContainText("Model notes");
  });

  // --- Station Mode ---

  test("station mode button opens station dialog", async ({ page }) => {
    const stationBtn = page.locator("#stationMode");
    await expect(stationBtn).toBeVisible();
    await expect(stationBtn).toBeEnabled();
    await stationBtn.click();

    const stationDialog = page.getByRole("dialog", {
      name: "Station Mode: Seasons",
    });
    await expect(stationDialog).toBeVisible();
    await expect(page.locator(".cp-station-table")).toBeVisible();
  });

  // --- Accessibility ---

  test("status region has aria-live for announcements", async ({ page }) => {
    const status = page.locator("#status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveAttribute("role", "status");
  });

  test("controls panel has accessible label", async ({ page }) => {
    const controls = page.locator(".cp-demo__controls");
    await expect(controls).toHaveAttribute("aria-label", "Controls panel");
  });

  test("readouts panel has accessible label", async ({ page }) => {
    const readouts = page.locator(".cp-demo__readouts");
    await expect(readouts).toHaveAttribute("aria-label", "Readouts panel");
  });

  test("help button opens help modal", async ({ page }) => {
    const helpBtn = page.locator("#help");
    await expect(helpBtn).toBeVisible();
    await expect(helpBtn).toBeEnabled();
    await helpBtn.click();

    const helpDialog = page.getByRole("dialog", { name: "Help / Shortcuts" });
    await expect(helpDialog).toBeVisible();
  });

  // --- Keyboard Shortcuts ---

  test("ArrowRight steps day forward by 1", async ({ page }) => {
    // Set day to 80 via slider, then blur so keyboard shortcuts fire on body
    await page.locator("#dayOfYear").fill("80");
    await page.locator("#dayOfYear").dispatchEvent("input");
    await page.locator("body").click();
    await page.keyboard.press("ArrowRight");
    expect(await page.locator("#dayOfYear").inputValue()).toBe("81");
  });

  test("ArrowLeft steps day backward by 1", async ({ page }) => {
    await page.locator("#dayOfYear").fill("80");
    await page.locator("#dayOfYear").dispatchEvent("input");
    await page.locator("body").click();
    await page.keyboard.press("ArrowLeft");
    expect(await page.locator("#dayOfYear").inputValue()).toBe("79");
  });

  test("ArrowUp steps day forward by 30", async ({ page }) => {
    await page.locator("#dayOfYear").fill("80");
    await page.locator("#dayOfYear").dispatchEvent("input");
    await page.locator("body").click();
    await page.keyboard.press("ArrowUp");
    expect(await page.locator("#dayOfYear").inputValue()).toBe("110");
  });

  test("ArrowDown steps day backward by 30", async ({ page }) => {
    await page.locator("#dayOfYear").fill("80");
    await page.locator("#dayOfYear").dispatchEvent("input");
    await page.locator("body").click();
    await page.keyboard.press("ArrowDown");
    expect(await page.locator("#dayOfYear").inputValue()).toBe("50");
  });

  test("E key jumps to March equinox (day 80)", async ({ page }) => {
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    await page.locator("body").click();
    await page.keyboard.press("e");
    await page.waitForTimeout(700);
    expect(await page.locator("#dayOfYear").inputValue()).toBe("80");
  });

  test("S key jumps to June solstice (day 172)", async ({ page }) => {
    await page.locator("#dayOfYear").fill("80");
    await page.locator("#dayOfYear").dispatchEvent("input");
    await page.locator("body").click();
    await page.keyboard.press("s");
    await page.waitForTimeout(700);
    expect(await page.locator("#dayOfYear").inputValue()).toBe("172");
  });

  test("Space toggles play/pause animation", async ({ page }) => {
    await page.locator("body").click();
    const btnText = await page.locator("#animateYear").textContent();
    expect(btnText?.trim()).toBe("Animate year");
    await page.keyboard.press("Space");
    const runningText = await page.locator("#animateYear").textContent();
    expect(runningText?.trim()).toBe("Stop animation");
    await page.keyboard.press("Space");
    const stoppedText = await page.locator("#animateYear").textContent();
    expect(stoppedText?.trim()).toBe("Animate year");
  });

  // --- Latitude Display ---

  test("latitude display shows N/S hemisphere direction", async ({ page }) => {
    const display = page.locator("#latitudeValue");
    // Default is 40 deg N
    await expect(display).toHaveText(/N/);
    await page.locator("#latitude").fill("-30");
    await page.locator("#latitude").dispatchEvent("input");
    await expect(display).toHaveText(/S/);
    await page.locator("#latitude").fill("0");
    await page.locator("#latitude").dispatchEvent("input");
    await expect(display).toHaveText(/Equator/);
  });

  // --- Globe View ---

  test("globe terminator moves when day changes", async ({ page }) => {
    // Record terminator cx at default (day 80, equinox)
    const terminator = page.locator("#terminator");
    const cxBefore = await terminator.getAttribute("cx");

    // Move to June solstice (day 172) — high declination shifts terminator
    await page.locator("#anchorJunSol").click();
    await page.waitForTimeout(700);
    const cxAfter = await terminator.getAttribute("cx");

    expect(cxBefore).not.toBe(cxAfter);
  });

  test("globe axis line exists and has coordinates", async ({ page }) => {
    const axis = page.locator("#globe-axis");
    await expect(axis).toBeAttached();
    const x1 = await axis.getAttribute("x1");
    const y1 = await axis.getAttribute("y1");
    const x2 = await axis.getAttribute("x2");
    const y2 = await axis.getAttribute("y2");
    expect(x1).not.toBeNull();
    expect(y1).not.toBeNull();
    expect(x2).not.toBeNull();
    expect(y2).not.toBeNull();
  });

  test("globe latitude marker is present", async ({ page }) => {
    const marker = page.locator("#globe-marker");
    await expect(marker).toBeAttached();
    const cx = await marker.getAttribute("cx");
    const cy = await marker.getAttribute("cy");
    expect(cx).not.toBeNull();
    expect(cy).not.toBeNull();
  });

  // --- Overlay Toggles ---

  test("clicking Terminator overlay chip hides the terminator element", async ({ page }) => {
    const terminator = page.locator("#terminator");
    // Terminator starts visible (aria-pressed="true")
    await expect(terminator).toBeVisible();

    const chip = page.locator('button[data-overlay="terminator"]');
    await chip.click();
    // After toggle, terminator should be hidden
    await expect(terminator).toBeHidden();

    // Click again to restore
    await chip.click();
    await expect(terminator).toBeVisible();
  });

  test("clicking Ecliptic overlay chip shows the ecliptic line", async ({ page }) => {
    const ecliptic = page.locator("#globe-ecliptic");
    // Ecliptic starts hidden via inline style="display:none"
    await expect(ecliptic).toHaveCSS("display", "none");

    const chip = page.locator('button[data-overlay="ecliptic"]');
    await chip.click();
    // After toggle, display:none is removed (SVG line may not pass toBeVisible due to thin stroke in clip-path)
    await expect(ecliptic).not.toHaveCSS("display", "none");
    // Verify the chip aria-pressed flipped
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking Cel. Equator overlay chip shows the celestial equator", async ({ page }) => {
    const celEquator = page.locator("#globe-equator");
    // Starts hidden via inline style="display:none"
    await expect(celEquator).toHaveCSS("display", "none");

    const chip = page.locator('button[data-overlay="equator"]');
    await chip.click();
    // After toggle, display:none is removed
    await expect(celEquator).not.toHaveCSS("display", "none");
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  // --- Latitude Slider & Day Length ---

  test("latitude slider updates day-length readout", async ({ page }) => {
    // Set to June solstice for maximum day-length variation
    await page.locator("#anchorJunSol").click();
    await page.waitForTimeout(700);

    const before = await page.locator("#dayLengthValue").textContent();
    // Change latitude from 40 to 0 (equator)
    await page.locator("#latitude").fill("0");
    await page.locator("#latitude").dispatchEvent("input");
    const after = await page.locator("#dayLengthValue").textContent();
    expect(before).not.toBe(after);
  });

  test("day-length readout uses h/m format", async ({ page }) => {
    const text = await page.locator("#dayLengthValue").textContent();
    expect(text).toMatch(/\d+h \d{2}m/);
  });

  // --- Distance Exaggeration ---

  test("orbit is not a perfect circle (distance exaggeration)", async ({ page }) => {
    // At perihelion (near day 3) and aphelion (near day 186), the Earth dot
    // should be at different distances from the sun (cx=0, cy=0 in orbit group).
    // Set day near perihelion
    await page.locator("#dayOfYear").fill("3");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const periCx = parseFloat((await page.locator("#earthOrbitDot").getAttribute("cx")) || "0");
    const periCy = parseFloat((await page.locator("#earthOrbitDot").getAttribute("cy")) || "0");
    const periR = Math.sqrt(periCx * periCx + periCy * periCy);

    // Set day near aphelion
    await page.locator("#dayOfYear").fill("186");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const aphCx = parseFloat((await page.locator("#earthOrbitDot").getAttribute("cx")) || "0");
    const aphCy = parseFloat((await page.locator("#earthOrbitDot").getAttribute("cy")) || "0");
    const aphR = Math.sqrt(aphCx * aphCx + aphCy * aphCy);

    // With 8x exaggeration, perihelion should be noticeably closer than aphelion
    expect(aphR).toBeGreaterThan(periR);
    expect(aphR - periR).toBeGreaterThan(5); // significant pixel difference
  });

  // --- Tilt Slider Full Range ---

  test("tilt slider accepts values up to 90 degrees", async ({ page }) => {
    await page.locator("#tilt").fill("90");
    await page.locator("#tilt").dispatchEvent("input");
    const tiltText = await page.locator("#tiltValue").textContent();
    expect(tiltText).toContain("90");
  });

  test("tilt at 90 degrees produces extreme declination at solstice", async ({ page }) => {
    await page.locator("#tilt").fill("90");
    await page.locator("#tilt").dispatchEvent("input");
    await page.locator("#dayOfYear").fill("172");
    await page.locator("#dayOfYear").dispatchEvent("input");
    const decl = await page.locator("#declinationValue").textContent();
    // With 90 deg tilt at June solstice, declination should be near 90 deg
    expect(parseFloat(decl || "0")).toBeGreaterThan(80);
  });
});

// --- Reduced Motion (separate describe, no beforeEach) ---

test.describe("Seasons -- Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/seasons/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    // The animate button stays enabled but uses discrete steps for reduced-motion
    await expect(page.locator("#animateYear")).toBeEnabled();
    const noteText = await page.locator("#motionNote").textContent();
    expect(noteText).toContain("reduced-motion");
  });
});
