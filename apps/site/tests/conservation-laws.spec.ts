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

  // The orbit shell dropped the controls' panel header (the dock has none); the demo's name is the page's h1.
  test(".cp-demo__controls is visible and the demo is named by its heading", async ({ page }) => {
    await expect(page.locator(".cp-demo__controls")).toBeVisible();
    await expect(page.locator("#cp-demo h1")).toContainText("Conservation Laws");
  });

  test(".cp-demo__readouts is visible", async ({ page }) => {
    await expect(page.locator(".cp-demo__readouts")).toBeVisible();
  });

  test("starfield canvas is attached", async ({ page }) => {
    const canvas = page.locator("canvas.cp-starfield");
    await expect(canvas).toBeAttached();
  });

  test('data-shell="orbit" attribute is present', async ({ page }) => {
    await expect(page.locator("#cp-demo")).toHaveAttribute("data-shell", "orbit");
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

  const trailPaths = (page: Page) =>
    page
      .locator("#orbitTrail path")
      .evaluateAll((els) =>
        els.map((el) => ({ d: (el.getAttribute("d") ?? "").trim(), hidden: getComputedStyle(el).display === "none" }))
      );
  const pathEnds = (d: string) => {
    const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    return { first: { x: n[0], y: n[1] }, last: { x: n[n.length - 2], y: n[n.length - 1] } };
  };

  test("Step leaves a trail along the arc it covered, and Reset clears it (trail)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#orbitType")).toHaveText("elliptical");
    const before = await particle(page);
    await page.locator("#step").click();
    const after = await particle(page);
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(5);

    const drawn = (await trailPaths(page)).filter((p) => p.d.length > 0 && !p.hidden);
    expect(drawn.length, JSON.stringify(drawn)).toBeGreaterThan(0);
    const { first } = pathEnds(drawn[0].d);
    const { last } = pathEnds(drawn[drawn.length - 1].d);
    expect(Math.hypot(first.x - before.x, first.y - before.y), JSON.stringify({ first, before })).toBeLessThanOrEqual(1.5);
    expect(Math.hypot(last.x - after.x, last.y - after.y), JSON.stringify({ last, after })).toBeLessThanOrEqual(1.5);

    await page.locator("#reset").click();
    const cleared = await trailPaths(page);
    expect(cleared.length).toBeGreaterThan(0);
    for (const p of cleared) expect(p.d === "" || p.hidden, JSON.stringify(p)).toBe(true);
  });

  test("a trail stays drawn after Play and Pause on a highly eccentric orbit (trail)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0.1);
    await expect(page.locator("#ecc")).toHaveText("0.990");
    await page.locator("#play").click();
    await page.waitForTimeout(600);
    await page.locator("#pause").click();
    const drawn = (await trailPaths(page)).filter((p) => p.d.length > 0 && !p.hidden);
    expect(drawn.length, JSON.stringify(drawn)).toBeGreaterThan(0);
  });

  test("speed factor 0 is radial motion, not escape (P3)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#orbitType")).toHaveText("radial");
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

  test("Enter on Play and on Pause keeps focus on the playback controls and says so (U6, U1)", async ({ page }) => {
    const focusedId = () => page.evaluate(() => document.activeElement?.id ?? "");
    await page.locator("#play").focus();
    await page.keyboard.press("Enter");
    await expect.poll(focusedId).toBe("pause");
    await expect(page.locator("#status")).toHaveText("Playing.");
    await page.keyboard.press("Enter");
    await expect.poll(focusedId).toBe("play");
    await expect(page.locator("#status")).toHaveText("Paused.");
  });

  test("Reset after Play says so, so the status never reads Playing while stopped (U1)", async ({ page }) => {
    await page.locator("#play").click();
    await expect(page.locator("#status")).toHaveText("Playing.");
    await page.locator("#reset").click();
    await expect(page.locator("#play")).toBeEnabled();
    await expect(page.locator("#status")).toHaveText("Reset to the start.");
  });

  test("focus moves from Pause to Play when an open orbit leaves the view (U6)", async ({ page }) => {
    const focusedId = () => page.evaluate(() => document.activeElement?.id ?? "");
    await page.locator('[data-preset="hyperbolic"]').click();
    await page.locator("#play").click();
    await page.locator("#pause").focus();
    await expect.poll(focusedId).toBe("pause");
    await expect(page.locator("#status")).toHaveText("The body has left the view. Press Play to run it again.", {
      timeout: 10_000
    });
    await expect.poll(focusedId).toBe("play");
  });

  test("each slider's accessible name is plain words, without its value (U7)", async ({ page }) => {
    const names: Record<string, string> = {
      massSlider: "Central mass",
      r0Slider: "Initial radius",
      speedFactor: "Speed factor, speed divided by circular speed",
      directionDeg: "Direction from tangential, positive is outward"
    };
    for (const [id, name] of Object.entries(names)) {
      await expect(page.getByRole("slider", { name, exact: true })).toHaveAttribute("id", id);
    }
    await expect(page.locator("#r0Slider")).toHaveAttribute("aria-valuetext", "1.00 AU");
    await expect(page.locator("#directionDeg")).toHaveAttribute("aria-valuetext", "0 degrees from tangential");
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

  test("the caption states the time scale: 1 s on screen is 4 months by default (T1)", async ({ page }) => {
    await expect(page.locator("#timeScale")).toHaveText("4 months");
    await expect(page.locator("#timeScaleSlowed")).toBeHidden();
  });

  test("a very fast orbit is slowed to a 1.5 s lap, says so, and never appears to run backwards (T1)", async ({ page }) => {
    // M = 10, r0 = 0.1 AU, circular: the period is 0.01 yr, which lasts 30 ms at 4 months per second.
    await setSlider(page, "massSlider", 1);
    await setSlider(page, "r0Slider", -1);
    await expect(page.locator("#orbitType")).toHaveText("circular");
    await expect(page.locator("#timeScale")).toHaveText("2.4 days");
    await expect(page.locator("#timeScaleSlowed")).toBeVisible();

    await page.locator("#play").click();
    const stepsDeg = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const body = document.querySelector("#particle") as Element;
          // Math convention, counter-clockwise positive: SVG y points down, so it is flipped.
          const angle = () => Math.atan2(300 - Number(body.getAttribute("cy")), Number(body.getAttribute("cx")) - 300);
          const samples: number[] = [];
          const sample = () => {
            samples.push(angle());
            if (samples.length < 20) {
              requestAnimationFrame(sample);
              return;
            }
            resolve(
              samples.slice(1).map((a, i) => {
                const d = a - samples[i];
                return (Math.atan2(Math.sin(d), Math.cos(d)) * 180) / Math.PI;
              })
            );
          };
          requestAnimationFrame(sample);
        })
    );
    await page.locator("#pause").click();
    expect(stepsDeg).toHaveLength(19);
    for (const step of stepsDeg) {
      expect(step, JSON.stringify(stepsDeg)).toBeGreaterThan(0);
      expect(step, JSON.stringify(stepsDeg)).toBeLessThan(20);
    }

    await setSlider(page, "massSlider", 0);
    await setSlider(page, "r0Slider", 0);
    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#timeScale")).toHaveText("4 months");
    await expect(page.locator("#timeScaleSlowed")).toBeHidden();
  });

  test("Step is disabled for radial motion, which has no orbit to step along (S1)", async ({ page }) => {
    await expect(page.locator("#step")).toBeEnabled();
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#orbitType")).toHaveText("radial");
    await expect(page.locator("#step")).toBeDisabled();
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
      // Seven since the orbit shell: the orbit type moved from a readout card to the stage chip.
      await expect(page.locator(".cp-readout")).toHaveCount(7);
      const bottoms = await page.locator(".cp-readout").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      for (const b of bottoms) expect(b).toBeLessThanOrEqual(size.height);
    });
  }

  /** Reload at `size`, then wait for fonts and the entry animations, so geometry is about the settled layout. */
  const settleAt = async (page: Page, size: { width: number; height: number }) => {
    await page.setViewportSize(size);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
    await page.evaluate(() =>
      Promise.all([
        document.fonts.ready,
        // Skip infinite animations (the starfield twinkle never finishes).
        ...document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished)
      ]).then(() => undefined)
    );
  };

  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
    test(`all readouts are above the fold for radial motion at ${size.width}x${size.height} (V2)`, async ({ page }) => {
      await settleAt(page, size);
      await setSlider(page, "speedFactor", 0);
      await expect(page.locator("#eps")).toHaveText("-39.4784");
      // Seven since the orbit shell: the orbit type moved from a readout card to the stage chip.
      await expect(page.locator(".cp-readout")).toHaveCount(7);
      const bottoms = await page.locator(".cp-readout").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      for (const b of bottoms) expect(b, JSON.stringify(bottoms)).toBeLessThanOrEqual(size.height);
    });

    test(`Play, Pause, Step and Reset share one row inside the viewport at ${size.width}x${size.height} (V1)`, async ({ page }) => {
      await settleAt(page, size);
      const { buttons, innerHeight } = await page.evaluate(() => ({
        buttons: Array.from(document.querySelectorAll(".cp-button-row > .cp-button")).map((el) => {
          const r = el.getBoundingClientRect();
          return { id: el.id, top: r.top, bottom: r.bottom };
        }),
        innerHeight: window.innerHeight
      }));
      expect(buttons.map((b) => b.id)).toEqual(["play", "pause", "step", "reset"]);
      for (const b of buttons) {
        expect(Math.abs(b.top - buttons[0].top), JSON.stringify(buttons)).toBeLessThanOrEqual(1);
        expect(b.bottom, JSON.stringify({ buttons, innerHeight })).toBeLessThanOrEqual(innerHeight);
      }
    });

    // The orbit shell puts the caption under the drawing, inside the stage (orbit-stage design section 4), not beside it.
    test(`the caption sits within 40 px under the orbit at ${size.width}x${size.height} (V4)`, async ({ page }) => {
      await settleAt(page, size);
      const box = await page.evaluate(() => {
        const orbit = (document.getElementById("orbitSvg") as Element).getBoundingClientRect();
        const caption = (document.getElementById("stageCaption") as Element).getBoundingClientRect();
        return { orbitLeft: orbit.left, orbitRight: orbit.right, orbitBottom: orbit.bottom, captionLeft: caption.left, captionRight: caption.right, captionTop: caption.top };
      });
      const gap = box.captionTop - box.orbitBottom;
      expect(gap, JSON.stringify(box)).toBeGreaterThanOrEqual(0);
      expect(gap, JSON.stringify(box)).toBeLessThanOrEqual(40);
      expect(box.captionLeft < box.orbitRight && box.captionRight > box.orbitLeft, JSON.stringify(box)).toBe(true);
    });
  }

  test("the caption states the view radius, since the drawing zooms to fit (V7)", async ({ page }) => {
    await expect(page.locator("#viewRadiusAu")).toHaveText("1.50");
    await setSlider(page, "r0Slider", -1);
    await expect(page.locator("#r0Value")).toHaveText("0.10");
    await expect(page.locator("#orbitType")).toHaveText("circular");
    await expect(page.locator("#viewRadiusAu")).toHaveText("0.15");
  });

  test("by default the caption states the playback time scale, not the Step duration (L2, V8)", async ({ page }) => {
    await expect(page.locator("#timeCaption")).toBeVisible();
    await expect(page.locator("#stepCaption")).toBeAttached();
    await expect(page.locator("#stepCaption")).toBeHidden();
  });

  test("radial motion neither plays nor steps, so the caption states neither time (V8)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#eps")).toHaveText("-39.4784");
    await expect(page.locator("#timeCaption")).toBeAttached();
    await expect(page.locator("#timeCaption")).toBeHidden();
    await expect(page.locator("#stepCaption")).toBeAttached();
    await expect(page.locator("#stepCaption")).toBeHidden();
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

  test("Step moves the body a sixteenth of an orbit, so K and U can be followed without animation (S1)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
    await expect(page.locator("#play")).toBeDisabled();
    await expect(page.locator("#step")).toBeEnabled();

    const particle = async () => ({
      x: Number(await page.locator("#particle").getAttribute("cx")),
      y: Number(await page.locator("#particle").getAttribute("cy"))
    });
    const num = async (id: string) => Number.parseFloat((await page.locator(`#${id}`).textContent()) ?? "NaN");

    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#orbitType")).toHaveText("elliptical");
    const start = await particle();
    const kStart = (await page.locator("#kAu").textContent()) ?? "";
    const uStart = (await page.locator("#uAu").textContent()) ?? "";

    await page.locator("#step").click();
    await expect(page.locator("#kAu")).not.toHaveText(kStart);
    await expect(page.locator("#uAu")).not.toHaveText(uStart);
    // Three 4-decimal roundings: K + U matches eps to 0.00015.
    expect(Math.abs((await num("kAu")) + (await num("uAu")) - (await num("eps")))).toBeLessThanOrEqual(0.0002);

    for (let i = 0; i < 15; i++) await page.locator("#step").click();
    const end = await particle();
    expect(Math.hypot(end.x - start.x, end.y - start.y), JSON.stringify({ start, end })).toBeLessThanOrEqual(0.5);
  });

  test("the caption states what one Step covers instead of the playback scale (L2, V8)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
    await page.locator('[data-preset="elliptical"]').click();
    await expect(page.locator("#orbitType")).toHaveText("elliptical");
    // One sixteenth of the period T = 0.580214 yr: 0.580214 / 16 x 365.25 = 13.245 days.
    await expect(page.locator("#stepDuration")).toHaveText("13.2 days");
    await expect(page.locator("#stepCaption")).toBeVisible();
    await expect(page.locator("#timeCaption")).toBeAttached();
    await expect(page.locator("#timeCaption")).toBeHidden();

    await page.locator("#speedFactor").evaluate((el: HTMLInputElement) => {
      el.value = "0";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(page.locator("#eps")).toHaveText("-39.4784");
    await expect(page.locator("#stepCaption")).toBeHidden();
    await expect(page.locator("#timeCaption")).toBeHidden();
  });

  test("Stepping an open orbit out of view says to press Step, and the next Step says it started again (M1, M2)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
    await page.locator('[data-preset="hyperbolic"]').click();
    await expect(page.locator("#orbitType")).toHaveText("hyperbolic");
    // Sixteen Steps cover the run from the start to the view edge.
    for (let i = 0; i < 16; i++) await page.locator("#step").click();
    await expect(page.locator("#status")).toHaveText("The body has left the view. Press Step to run it again.");
    await page.locator("#step").click();
    await expect(page.locator("#status")).toHaveText("Back to the start.");
  });
});

test.describe("Conservation Laws -- instructor page", () => {
  test("does not scroll sideways at 390 px, with KaTeX inside a scrolling table (V3)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // "load", not "domcontentloaded": the escape comes from KaTeX's stylesheet, so it must have applied.
    await page.goto("instructor/conservation-laws/", { waitUntil: "load" });
    await expect(page.locator(".cp-table-scroll .katex").first()).toBeAttached();
    const scroll = await page.evaluate(() => {
      window.scrollTo(2000, 0);
      return { scrollX: window.scrollX, scrollWidth: document.documentElement.scrollWidth };
    });
    expect(scroll.scrollX, JSON.stringify(scroll)).toBe(0);
  });
});

test.describe("Conservation Laws -- orbit shell and energy instrument", () => {
  const MU = 4 * Math.PI * Math.PI; // M = 1 solar mass
  const setSlider = async (page: Page, id: string, value: number) => {
    await page.locator(`#${id}`).evaluate((el: HTMLInputElement, v: number) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  const num = async (page: Page, id: string) => Number.parseFloat((await page.locator(`#${id}`).textContent()) ?? "NaN");
  const rect = (page: Page, sel: string) =>
    page.locator(sel).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    });

  test.beforeEach(async ({ page }) => {
    // Reduced motion switches off the entry slide, so boxes are measured where they settle.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("play/conservation-laws/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#orbitType")).toHaveText("circular");
  });

  test("lays out stage left, instrument right and dock under the stage at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const stage = await rect(page, ".cp-demo__stage");
    const inst = await rect(page, ".cp-demo__readouts");
    const dock = await rect(page, ".cp-demo__controls");
    expect(inst.left).toBeGreaterThanOrEqual(stage.right - 1);
    expect(dock.top).toBeGreaterThanOrEqual(stage.bottom - 1);
    expect(dock.right).toBeLessThanOrEqual(inst.left + 1);
  });

  test("glass panels blur what is behind them", async ({ page }) => {
    const filter = await page.locator(".cp-demo__readouts").evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filter).toBe("blur(16px)");
  });

  test("K ends on the total-energy marker, which stays put while K and U trade (Elliptical)", async ({ page }) => {
    await page.locator('[data-preset="elliptical"]').click();
    // Read once the drawing has settled. Under reduced motion the theme sets `transition-duration: 0.01ms` on every
    // element, and `transition-property` defaults to `all`, so each new left/width starts a CSS transition: a read
    // right after the click returned the previous orbit's bars (41.6px off, 2026-09-11). Two animation frames were not
    // enough under a loaded parallel run, so this waits for the transitions themselves (getAnimations() also flushes
    // style, which starts any that are pending).
    const read = () =>
      page.evaluate(async () => {
        const transitions = document.getAnimations().filter((an) => an.constructor.name === "CSSTransition");
        await Promise.all(transitions.map((an) => an.finished.catch(() => undefined)));
        await new Promise<void>((done) => requestAnimationFrame(() => done()));
        const r = (id: string) => (document.getElementById(id) as HTMLElement).getBoundingClientRect();
        return {
          uLeft: r("energyBarU").left,
          uRight: r("energyBarU").right,
          kLeft: r("energyBarK").left,
          kRight: r("energyBarK").right,
          zero: r("energyBarZero").left,
          eps: r("energyBarEps").left + r("energyBarEps").width / 2,
          // Context for failures: a page scroll or a track resize moves every bar, not just the marker.
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          trackLeft: r("energyBar").left,
          trackWidth: r("energyBar").width,
          epsStyleLeft: (document.getElementById("energyBarEps") as HTMLElement).style.left
        };
      });
    const a = await read();
    expect(a.uRight - a.uLeft, JSON.stringify(a)).toBeGreaterThan(10);
    expect(Math.abs(a.uRight - a.zero), JSON.stringify(a)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.kLeft - a.uLeft), JSON.stringify(a)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.kRight - a.eps), JSON.stringify(a)).toBeLessThanOrEqual(1.5);
    for (let i = 0; i < 3; i++) await page.locator("#step").click();
    const b = await read();
    expect(Math.abs(b.eps - a.eps), JSON.stringify({ a, b })).toBeLessThanOrEqual(0.5);
    expect(Math.abs(b.kRight - b.eps), JSON.stringify({ a, b })).toBeLessThanOrEqual(1.5);
    expect(Math.abs(b.uLeft - a.uLeft), JSON.stringify({ a, b })).toBeGreaterThan(2);
  });

  test("the drop line is the radial kinetic energy: zero at both turning points, not between (Elliptical)", async ({ page }) => {
    // Elliptical starts tangential at speed factor 0.75, so the start is apoapsis; 8 Steps are half an orbit.
    await page.locator('[data-preset="elliptical"]').click();
    const drop = async () => {
      const l = page.locator("#ueffDrop");
      const [y1, y2, kr] = await Promise.all([l.getAttribute("y1"), l.getAttribute("y2"), l.getAttribute("data-radial-kinetic")]);
      return { kr: Number(kr), len: Math.abs(Number(y2) - Number(y1)) };
    };
    const apo = await drop();
    expect(apo.kr).toBeLessThan(1e-6);
    expect(apo.len).toBeLessThan(0.5);
    for (let i = 0; i < 4; i++) await page.locator("#step").click();
    const between = await drop();
    expect(between.kr).toBeGreaterThan(1);
    expect(between.len).toBeGreaterThan(3);
    for (let i = 0; i < 4; i++) await page.locator("#step").click();
    const peri = await drop();
    expect(peri.kr).toBeLessThan(1e-6);
    expect(peri.len).toBeLessThan(0.5);
  });

  test("the plot's r_p and r_a labels sit where independent arithmetic from the readouts puts them (tilted start)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0.9);
    await setSlider(page, "directionDeg", 30);
    const rp = await num(page, "rpAu");
    const eps = await num(page, "eps");
    const rMax = await num(page, "viewRadiusAu");
    const ra = -MU / eps - rp; // 2a - r_p, with a = -mu / (2 eps)
    const plot = await rect(page, "#ueffPlot");
    const left = async (id: string) => Number.parseFloat(await page.locator(`#${id}`).evaluate((el) => (el as HTMLElement).style.left));
    const rMin = 0.55 * rp;
    expect(Math.abs((await left("ueffRpLabel")) - ((rp - rMin) / (rMax - rMin)) * plot.width)).toBeLessThanOrEqual(2);
    expect(Math.abs((await left("ueffRaLabel")) - ((ra - rMin) / (rMax - rMin)) * plot.width)).toBeLessThanOrEqual(2);
  });

  test("radial motion hides the energy bar and the plot rather than drawing nonsense", async ({ page }) => {
    // Drawn first: Playwright counts a zero-size box as hidden, so without this the test passes on an empty instrument.
    await expect(page.locator("#energyBarK")).toBeVisible();
    await expect(page.locator("#ueffCurve")).toBeVisible();
    await setSlider(page, "speedFactor", 0);
    await expect(page.locator("#orbitType")).toHaveText("radial");
    await expect(page.locator("#energyBarK")).toBeHidden();
    await expect(page.locator("#ueffCurve")).toBeHidden();
  });

  test("opens in Observatory, switches to Potential and back by click and arrow key, without moving the body", async ({ page }) => {
    const stage = page.locator(".cp-demo__stage");
    await expect(stage).toHaveAttribute("data-view", "observatory");
    await expect(page.locator("#observatoryView")).toBeVisible();
    await expect(page.locator("#potentialView")).toBeHidden();
    await page.locator('[data-preset="elliptical"]').click();
    for (let i = 0; i < 3; i++) await page.locator("#step").click();
    const u = await page.locator("#uAu").textContent();
    // Page coordinates, not viewport: Step scrolls the page down to the dock and clicking the tab scrolls back up
    // (a viewport-relative top moved by exactly that 460px scroll at 1280x720, 2026-09-11).
    const dockPageTop = () =>
      page.locator(".cp-demo__controls").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const dockTop = await dockPageTop();

    await page.getByRole("tab", { name: "Potential" }).click();
    await expect(stage).toHaveAttribute("data-view", "potential");
    await expect(page.locator("#potentialView")).toBeVisible();
    await expect(page.locator("#observatoryView")).toBeHidden();
    await expect(page.locator("#uAu")).toHaveText(u ?? "");
    await expect(page.locator("#status")).toContainText("Potential view.");
    expect(Math.abs((await dockPageTop()) - dockTop)).toBeLessThanOrEqual(1);

    await page.keyboard.press("ArrowLeft");
    await expect(stage).toHaveAttribute("data-view", "observatory");
    await expect(page.locator("#status")).toHaveText("Observatory view.");
  });

  test("the Potential view puts the body on the energy line at x = r, with the Sun at the centre (tilted start)", async ({ page }) => {
    await setSlider(page, "speedFactor", 0.9);
    await setSlider(page, "directionDeg", 30);
    await page.getByRole("tab", { name: "Potential" }).click();
    const rp = await num(page, "rpAu");
    const rMax = await num(page, "viewRadiusAu");
    const g = await page.evaluate(() => {
      const n = (id: string, a: string) => Number(document.getElementById(id)?.getAttribute(a));
      const w = (document.getElementById("potentialSvg") as Element).getBoundingClientRect().width;
      const rpLeft = Number.parseFloat((document.getElementById("potentialRpLabel") as HTMLElement).style.left);
      return { w, bodyX: n("potentialBody", "cx"), bodyY: n("potentialBody", "cy"), epsY: n("potentialEps", "y1"), sunX: n("potentialSun", "cx"), rpLeft };
    });
    expect(Math.abs(g.sunX - g.w / 2)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(g.bodyY - g.epsY)).toBeLessThanOrEqual(0.5);
    // At the start r = r0 = 1 AU. The caption's view radius has 2 decimals, worth about 1px here.
    expect(Math.abs(g.bodyX - (g.w / 2 + (1 / rMax) * (g.w / 2)))).toBeLessThanOrEqual(2);
    expect(Math.abs(g.rpLeft - (g.w / 2 + (rp / rMax) * (g.w / 2)))).toBeLessThanOrEqual(2);
  });
});
