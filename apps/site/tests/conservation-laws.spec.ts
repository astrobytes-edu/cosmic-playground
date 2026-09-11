import { test, expect, type Page } from "@playwright/test";

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

  test("readout units in .cp-readout__unit spans (count >= 6)", async ({ page }) => {
    const units = page.locator(".cp-readout__unit");
    const count = await units.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test("Tab from the top of the page reaches the play button", async ({ page }) => {
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = (await page.evaluate(() => document.activeElement?.id)) === "play";
    }
    expect(reached).toBe(true);
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

test.describe("Conservation Laws -- what the student sees", () => {
  const CENTER = 300;
  const setSlider = async (page: Page, id: string, value: number) => {
    await page.locator(`#${id}`).evaluate((el: HTMLInputElement, v: number) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  const particle = async (page: Page) => ({
    x: Number(await page.locator("#particle").getAttribute("cx")),
    y: Number(await page.locator("#particle").getAttribute("cy"))
  });
  const arrowPx = async (page: Page) => {
    const l = page.locator("#velocityLine");
    const [x1, y1, x2, y2] = await Promise.all(["x1", "y1", "x2", "y2"].map((a) => l.getAttribute(a).then(Number)));
    return Math.hypot(x2 - x1, y2 - y1);
  };
  const num = async (page: Page, id: string) => Number.parseFloat((await page.locator(`#${id}`).textContent()) ?? "NaN");

  test.beforeEach(async ({ page }) => {
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
  });

  test("Escape preset is exactly parabolic with zero energy (P1)", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    await expect(page.locator("#orbitType")).toHaveText("parabolic (escape)");
    await expect(page.locator("#ecc")).toHaveText("1.000");
    await expect(page.locator("#eps")).toHaveText("0");
    await expect(page.locator("#speedValue")).toHaveText("1.414");
  });

  test("the slider's nearest values straddle escape honestly", async ({ page }) => {
    await setSlider(page, "speedFactor", 1.41);
    await expect(page.locator("#orbitType")).toHaveText("elliptical");
    await setSlider(page, "speedFactor", 1.42);
    await expect(page.locator("#orbitType")).toHaveText("hyperbolic");
  });

  test("Station Mode's Escape rows agree with the screen (P1)", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    await page.locator("#stationMode").click();
    const dialog = page.getByRole("dialog", { name: /Station Mode/ });
    await dialog.getByRole("button", { name: /Add row/ }).click();
    await dialog.getByRole("button", { name: /preset cases/ }).click();
    // Anchor on the first cell: the Snapshot row's "(escape)" would also match a bare "Escape".
    const snapshot = dialog.locator("tr", { hasText: /^\s*Snapshot/ });
    const reference = dialog.locator("tr", { hasText: /^\s*Escape/ });
    await expect(snapshot).toContainText("parabolic (escape)");
    await expect(reference).toContainText("parabolic (escape)");
    await expect(snapshot).toContainText("1.414");
  });

  test("Elliptical preset starts at r0 on +x with the speed that was set (P2)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    const p = await particle(page);
    expect(p.x).toBeCloseTo(CENTER + 250 / 1.5, 0);
    expect(p.y).toBeCloseTo(CENTER, 0);
    expect(await num(page, "vKmS")).toBeCloseTo(0.75 * 29.785, 1);
  });

  test("an outward 60 deg start is also on +x (asymmetric state)", async ({ page }) => {
    await setSlider(page, "speedFactor", 1.2);
    await setSlider(page, "directionDeg", 60);
    const p = await particle(page);
    expect(p.x).toBeCloseTo(CENTER + 250 / 3.719438, 0);
    expect(p.y).toBeCloseTo(CENTER, 0);
    expect(await num(page, "vKmS")).toBeCloseTo(1.2 * 29.785, 1);
  });

  test("Reset returns the body to where it started", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    const start = await particle(page);
    await page.locator("#play").click();
    await page.waitForTimeout(400);
    await page.locator("#pause").click();
    const moved = await particle(page);
    expect(Math.hypot(moved.x - start.x, moved.y - start.y)).toBeGreaterThan(5);
    await page.locator("#reset").click();
    const back = await particle(page);
    expect(back.x).toBeCloseTo(start.x, 1);
    expect(back.y).toBeCloseTo(start.y, 1);
  });

  test("speed factor 0 is radial motion, not escape (P3)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#orbitType")).toHaveText("radial (straight line)");
    await expect(page.locator("#eps")).toHaveText("-39.4784");
    await expect(page.locator("#velocityLine")).toBeHidden();
    await expect(page.locator("#play")).toBeDisabled();
    const p = await particle(page);
    expect(p.x).toBeCloseTo(CENTER + 250 / 1.5, 0);
  });

  test("the view does not jump across escape (P4)", async ({ page }) => {
    for (const f of [1.4, 1.42]) {
      await setSlider(page, "speedFactor", f);
      const p = await particle(page);
      expect(Math.hypot(p.x - CENTER, p.y - CENTER)).toBeCloseTo(250 / 6, 0);
    }
    await setSlider(page, "speedFactor", 1.4);
    await expect(page.locator("#apoCaption")).toBeVisible();
    await expect(page.locator("#raAu")).toHaveText("49.0");
  });

  test("the arrow is distance covered in the stated time (P5)", async ({ page }) => {
    await expect(page.locator("#arrowDtDays")).toHaveText("20");
    expect(await arrowPx(page)).toBeCloseTo(57.341, 0);
    await setSlider(page, "massSlider", 1);
    await expect(page.locator("#arrowDtDays")).toHaveText("10");
    expect(await arrowPx(page)).toBeCloseTo(90.665, 0);
  });

  test("K and U trade while the specific energy stays fixed (B2)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#kAu")).toHaveText("11.1033");
    await expect(page.locator("#uAu")).toHaveText("-39.4784");
    const eps = await page.locator("#eps").textContent();
    await page.locator("#play").click();
    await page.waitForTimeout(300);
    await page.locator("#pause").click();
    await expect(page.locator("#kAu")).not.toHaveText("11.1033");
    await expect(page.locator("#uAu")).not.toHaveText("-39.4784");
    await expect(page.locator("#eps")).toHaveText(eps ?? "");
    // #eps is written only when the orbit is recomputed, so the line above cannot see drift during playback.
    // K and U are written every frame; their sum must still match it (three 4-decimal roundings: 0.00015).
    const kPlusU = (await num(page, "kAu")) + (await num(page, "uAu"));
    expect(Math.abs(kPlusU - (await num(page, "eps")))).toBeLessThanOrEqual(0.0002);
  });

  test("announces the orbit after a keyboard change and a preset (U1)", async ({ page }) => {
    await page.locator("#speedFactor").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#status")).toHaveText("Elliptical orbit: bound, eccentricity 0.020.");
    await page.locator('[data-preset="hyperbolic"]').click();
    await expect(page.locator("#status")).toHaveText("Hyperbolic orbit: unbound, eccentricity 2.240.");
  });

  test("help text is typeset, not ASCII (B5)", async ({ page }) => {
    await page.locator("#help").click();
    const dialog = page.getByRole("dialog", { name: /Help/ });
    await expect(dialog.locator(".katex").first()).toBeVisible();
    await expect(dialog).not.toContainText("sqrt(");
  });

  test("an exact Escape stays open after a mass change (M1)", async ({ page }) => {
    await page.locator('[data-preset="escape"]').click();
    await setSlider(page, "massSlider", -0.96);
    await expect(page.locator("#orbitType")).toHaveText("parabolic (escape)");
    const box = await page.locator("#orbitPath").evaluate((el: SVGPathElement) => {
      const b = el.getBBox();
      return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };
    });
    for (const edge of [box.x0, box.y0, box.x1, box.y1]) {
      expect(edge).toBeGreaterThanOrEqual(-1);
      expect(edge).toBeLessThanOrEqual(601);
    }
  });

  test("readouts never use e-notation, and a circular orbit reads e = 0 (L3)", async ({ page }) => {
    await setSlider(page, "massSlider", -1);
    await setSlider(page, "r0Slider", -0.8);
    await expect(page.locator("#ecc")).toHaveText("0");
    await expect(page.locator("#h")).not.toHaveText(/e[+-]/);
    await expect(page.locator("#rpAu")).not.toHaveText(/e[+-]/);
  });

  test("an arrow too long for the zoom is capped and captioned as not to scale (L2)", async ({ page }) => {
    await setSlider(page, "massSlider", 1);
    await setSlider(page, "r0Slider", -1);
    await setSlider(page, "speedFactor", 0.1);
    await expect(page.locator("#arrowCaptionNotToScale")).toBeVisible();
    await page.locator("#play").click();
    await page.waitForTimeout(300);
    await page.locator("#pause").click();
    expect(await arrowPx(page)).toBeLessThanOrEqual(120.5);
  });

  test("sliders tell a screen reader the physical value (slider text)", async ({ page }) => {
    await expect(page.locator("#massSlider")).toHaveAttribute("aria-valuetext", "1.00 solar masses");
    await page.locator('[data-preset="escape"]').click();
    await expect(page.locator("#speedFactor")).toHaveAttribute("aria-valuetext", "1.414 times circular speed");
  });

  test("a small orbit is drawn 250/1.5 px from the Sun, not inside it (P6)", async ({ page }) => {
    await setSlider(page, "massSlider", 1);
    await setSlider(page, "r0Slider", -1);
    await expect(page.locator("#massValue")).toHaveText("10.00");
    await expect(page.locator("#r0Value")).toHaveText("0.10");
    const p = await particle(page);
    expect(Math.abs(Math.hypot(p.x - CENTER, p.y - CENTER) - 250 / 1.5)).toBeLessThanOrEqual(1);
  });

  test("the speed-factor value does not overprint its label at 1025 px (U4)", async ({ page }) => {
    await page.setViewportSize({ width: 1025, height: 768 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(page.locator("label.control", { has: page.locator("#speedFactor") }).locator(".katex").first()).toBeAttached();
    const boxes = await page.locator("#speedFactor").evaluate((input) => {
      const box = (r: DOMRect) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      const labelText = input.closest("label")?.firstElementChild as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(labelText);
      return {
        labelElement: box(labelText.getBoundingClientRect()),
        labelText: box(range.getBoundingClientRect()),
        value: box((document.getElementById("speedValue")?.parentElement as HTMLElement).getBoundingClientRect())
      };
    });
    type Box = (typeof boxes)["value"];
    const intersects = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    expect(intersects(boxes.labelText, boxes.value), JSON.stringify(boxes)).toBe(false);
    expect(intersects(boxes.labelElement, boxes.value), JSON.stringify(boxes)).toBe(false);
  });

  test("preset chips fit their text at 1280 px (U5)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const chips = await page
      .locator("button.preset")
      .evaluateAll((els) => els.map((el) => ({ text: el.textContent, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth })));
    expect(chips).toHaveLength(4);
    for (const chip of chips) expect(chip.scrollWidth, JSON.stringify(chip)).toBeLessThanOrEqual(chip.clientWidth);
  });

  test("Escape and Hyperbolic keep the direction; Circular and Elliptical set 0 (U9)", async ({ page }) => {
    await setSlider(page, "directionDeg", 60);
    await page.locator('[data-preset="escape"]').click();
    await expect(page.locator("#directionValue")).toHaveText("60");
    await expect(page.locator("#orbitType")).toHaveText("parabolic (escape)");
    await page.locator('[data-preset="hyperbolic"]').click();
    await expect(page.locator("#directionValue")).toHaveText("60");
    await expect(page.locator("#orbitType")).toHaveText("hyperbolic");
    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#directionValue")).toHaveText("0");
    await setSlider(page, "directionDeg", 60);
    await page.locator('[data-preset="circular"]').click();
    await expect(page.locator("#directionValue")).toHaveText("0");
  });

  test("Station Mode's preset rows stay reference cases at direction 0 (U9)", async ({ page }) => {
    await setSlider(page, "directionDeg", 60);
    await page.locator('[data-preset="escape"]').click();
    await page.locator("#stationMode").click();
    const dialog = page.getByRole("dialog", { name: /Station Mode/ });
    await dialog.getByRole("button", { name: /Add row/ }).click();
    await dialog.getByRole("button", { name: /preset cases/ }).click();
    // Column 4 (from 0) is the direction.
    await expect(dialog.locator("tr", { hasText: /^\s*Snapshot/ }).locator("td").nth(4)).toHaveText("60");
    for (const label of ["Circular", "Elliptical", "Escape", "Hyperbolic"]) {
      await expect(dialog.locator("tr", { hasText: new RegExp(`^\\s*${label}`) }).locator("td").nth(4)).toHaveText("0");
    }
  });

  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
    test(`all readouts are above the fold at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.reload({ waitUntil: "domcontentloaded" });
      // Entry animations slide panels up by ~10px; the fold is about the settled layout.
      // Skip infinite animations (the starfield twinkle never finishes).
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished)
        )
      );
      await expect(page.locator(".cp-readout")).toHaveCount(8);
      const bottoms = await page.locator(".cp-readout").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      for (const b of bottoms) expect(b).toBeLessThanOrEqual(size.height);
    });
  }
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
