import { test, expect } from "@playwright/test";

test.describe("EM Spectrum -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("play/em-spectrum/", { waitUntil: "domcontentloaded" });
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

  test("spectrum bar is present with rainbow gradient", async ({ page }) => {
    const bar = page.locator(".spectrum__bar");
    await expect(bar).toBeVisible();
    // JS-applied gradient should set inline style
    const style = await bar.getAttribute("style");
    expect(style).toContain("linear-gradient");
  });

  test("chirp wave canvas overlays the spectrum bar", async ({ page }) => {
    const canvas = page.locator("#spectrumWaveCanvas");
    await expect(canvas).toBeVisible();
    // Canvas should have non-zero dimensions (DPI-aware rendering)
    const width = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
    expect(width).toBeGreaterThan(0);
  });

  test("scale objects row is rendered below spectrum", async ({ page }) => {
    const scale = page.locator("#spectrumScale");
    await expect(scale).toBeVisible();
    const items = page.locator(".spectrum__scale-item");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("powers-of-ten SI guide is visible above spectrum ticks", async ({ page }) => {
    const powers = page.locator(".spectrum__powers");
    await expect(powers).toBeVisible();
    await expect(page.locator(".spectrum__powers > span")).toHaveCount(7);
    await expect(powers).toContainText("10");
  });

  // --- Axis labels sit on the same log axis as the bar (P0 d085a04d) ---

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 320, height: 512 }
  ]) {
    test(`tick and power rows sit on the log axis at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("play/em-spectrum/", { waitUntil: "domcontentloaded" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      await page.waitForSelector(".spectrum__ticks .katex", { timeout: 5000 });
      await page.evaluate(() => document.fonts.ready);

      // True positions are 100 - (log10(lambdaCm) + 12) / 18 * 100, recomputed here
      // (not imported) so this check is independent of the demo's own mapping.
      const trueFraction = (lambdaCm: number) => 1 - (Math.log10(lambdaCm) + 12) / 18;
      // 10 km, 1 m, 1 mm, 1 um, 1 nm, 1 pm, 10 fm -- both rows name the same seven wavelengths
      const LABEL_LAMBDA_CM = [1e6, 1e2, 1e-1, 1e-4, 1e-7, 1e-10, 1e-12];

      const measured = await page.evaluate(() => {
        const bar = document.querySelector(".spectrum__bar")?.getBoundingClientRect();
        if (!bar) throw new Error("no .spectrum__bar");
        return [".spectrum__ticks", ".spectrum__powers"].map((sel) => ({
          sel,
          labels: [...document.querySelectorAll<HTMLElement>(`${sel} > span`)].map((el) => {
            const r = el.getBoundingClientRect();
            return {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom
            };
          })
        })).map((row) => ({ ...row, barLeft: bar.left, barWidth: bar.width }));
      });

      for (const row of measured) {
        expect(row.labels, `${row.sel} label count`).toHaveLength(7);
        row.labels.forEach((label, i) => {
          const x = row.barLeft + trueFraction(LABEL_LAMBDA_CM[i]) * row.barWidth;
          if (i === 0) {
            // flush to the bar's left end, not centred (half would hang off the edge)
            expect(Math.abs(label.left - x), `${row.sel}[0] left edge`).toBeLessThan(1);
          } else if (i === 6) {
            expect(Math.abs(label.right - x), `${row.sel}[6] right edge`).toBeLessThan(1);
          } else {
            const centre = (label.left + label.right) / 2;
            expect(Math.abs(centre - x), `${row.sel}[${i}] centre vs true position`).toBeLessThan(1);
          }
          expect(label.left, `${row.sel}[${i}] inside bar (left)`).toBeGreaterThanOrEqual(row.barLeft - 1);
          expect(label.right, `${row.sel}[${i}] inside bar (right)`).toBeLessThanOrEqual(
            row.barLeft + row.barWidth + 1
          );
        });

        // no two labels in a row may overlap
        for (let a = 0; a < row.labels.length; a++) {
          for (let b = a + 1; b < row.labels.length; b++) {
            const A = row.labels[a];
            const B = row.labels[b];
            const overlap =
              A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom;
            expect(overlap, `${row.sel}[${a}] overlaps [${b}]`).toBe(false);
          }
        }

        // At phone width neighbours on one line had 2px to spare on macOS and overlapped
        // on CI's Linux fonts (2026-10-24), so they must sit on different lines there.
        if (viewport.width <= 480) {
          for (let i = 0; i + 1 < row.labels.length; i++) {
            expect(
              Math.abs(row.labels[i].top - row.labels[i + 1].top),
              `${row.sel}[${i}] and [${i + 1}] share a line`
            ).toBeGreaterThan(1);
          }
        }
      }

      // the page must not scroll sideways because of the label rows
      const scrolls = await page.evaluate(() => {
        window.scrollTo(2000, 0);
        return window.scrollX;
      });
      expect(scrolls).toBe(0);
    });
  }

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default state", async ({ page }) => {
    await page.waitForSelector(".katex", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("em-spectrum-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: radio band selected", async ({ page }) => {
    await page.locator('.band[data-band="radio"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("em-spectrum-radio.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: convert panel active", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("em-spectrum-convert.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  // --- Band Buttons ---

  test("seven band buttons are present", async ({ page }) => {
    const buttons = page.locator(".band");
    await expect(buttons).toHaveCount(7);
  });

  test("visible band is active by default", async ({ page }) => {
    const visibleBtn = page.locator('.band[data-band="visible"]');
    await expect(visibleBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking a band button activates it and deactivates others", async ({ page }) => {
    const radioBtn = page.locator('.band[data-band="radio"]');
    await radioBtn.click();
    await expect(radioBtn).toHaveAttribute("aria-pressed", "true");
    // Previous active button should now be deactivated
    const visibleBtn = page.locator('.band[data-band="visible"]');
    await expect(visibleBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking a band button updates band badge", async ({ page }) => {
    await page.locator('.band[data-band="xray"]').click();
    const badge = page.locator("#bandBadge");
    await expect(badge).toContainText("X-ray");
  });

  // --- Wavelength Slider ---

  test("wavelength slider updates readouts", async ({ page }) => {
    const before = await page.locator("#readoutWavelength").textContent();
    await page.locator("#wavelengthSlider").fill("100");
    await page.locator("#wavelengthSlider").dispatchEvent("input");
    const after = await page.locator("#readoutWavelength").textContent();
    expect(after).not.toBe(before);
  });

  test("wavelength slider exposes physical aria-valuetext", async ({ page }) => {
    const slider = page.locator("#wavelengthSlider");
    await slider.fill("100");
    await slider.dispatchEvent("input");
    const valueText = await slider.getAttribute("aria-valuetext");
    expect(valueText).toBeTruthy();
    expect(valueText).toMatch(/[a-zA-Z]/);
  });

  test("slider changes update band badge", async ({ page }) => {
    // Move to extreme left (radio end: low position percent = long wavelength)
    await page.locator("#wavelengthSlider").fill("10");
    await page.locator("#wavelengthSlider").dispatchEvent("input");
    const badge = await page.locator("#bandBadge").textContent();
    expect(badge).toBe("Radio");
  });

  // --- Readout Formatting ---

  test("readout units are displayed in separate spans", async ({ page }) => {
    const unitSpans = page.locator(".cp-readout__unit");
    const count = await unitSpans.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("wavelength readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutWavelength").textContent();
    const unit = await page.locator("#readoutWavelengthUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  test("frequency readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutFrequency").textContent();
    const unit = await page.locator("#readoutFrequencyUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  test("energy readout shows value and unit", async ({ page }) => {
    const value = await page.locator("#readoutEnergy").textContent();
    const unit = await page.locator("#readoutEnergyUnit").textContent();
    expect(value).toBeTruthy();
    expect(unit).toBeTruthy();
  });

  // --- Band Card ---

  test("band card shows description for current band", async ({ page }) => {
    await expect(page.locator("#bandDescription")).not.toBeEmpty();
  });

  test("band card shows examples and detectors", async ({ page }) => {
    await expect(page.locator("#bandExamples")).not.toBeEmpty();
    await expect(page.locator("#bandDetection")).not.toBeEmpty();
  });

  test("band card updates when band changes", async ({ page }) => {
    const beforeDesc = await page.locator("#bandDescription").textContent();
    await page.locator('.band[data-band="gamma"]').click();
    const afterDesc = await page.locator("#bandDescription").textContent();
    expect(afterDesc).not.toBe(beforeDesc);
  });

  // --- Tabs ---

  test("four tabs are present", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);
  });

  test("Lines tab is active by default", async ({ page }) => {
    const linesTab = page.locator("#tabLines");
    await expect(linesTab).toHaveAttribute("aria-selected", "true");
  });

  test("clicking Convert tab shows convert panel", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await expect(page.locator("#panelConvert")).toBeVisible();
    await expect(page.locator("#panelLines")).toBeHidden();
  });

  test("clicking Telescopes tab shows telescope list", async ({ page }) => {
    await page.locator("#tabTelescopes").click();
    await expect(page.locator("#panelTelescopes")).toBeVisible();
    const items = page.locator("#telescopeList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking Objects tab shows object list", async ({ page }) => {
    await page.locator("#tabObjects").click();
    await expect(page.locator("#panelObjects")).toBeVisible();
    const items = page.locator("#objectList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test("convert panel has three input fields", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await expect(page.locator("#convertWavelengthNm")).toBeVisible();
    await expect(page.locator("#convertFrequencyHz")).toBeVisible();
    await expect(page.locator("#convertEnergyEv")).toBeVisible();
  });

  test("typing wavelength in convert panel updates frequency and energy", async ({ page }) => {
    await page.locator("#tabConvert").click();
    await page.locator("#convertWavelengthNm").fill("500");
    await page.locator("#convertWavelengthNm").dispatchEvent("input");
    const freq = await page.locator("#convertFrequencyHz").inputValue();
    const energy = await page.locator("#convertEnergyEv").inputValue();
    expect(freq).toBeTruthy();
    expect(energy).toBeTruthy();
    expect(Number(freq)).toBeGreaterThan(0);
    expect(Number(energy)).toBeGreaterThan(0);
  });

  // --- Lines List ---

  test("Lines panel shows atomic and molecular lines", async ({ page }) => {
    const items = page.locator("#lineList li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  // --- Accordion / Drawer ---

  test("Explore panels accordion is open by default", async ({ page }) => {
    const firstAccordion = page.locator(".cp-accordion").first();
    await expect(firstAccordion).toHaveAttribute("open", "");
    await expect(firstAccordion).toContainText("Explore panels");
  });

  test("Model notes accordion can be opened and contains equations", async ({ page }) => {
    const modelNotes = page.locator(".cp-accordion").nth(1);
    await modelNotes.locator("summary").click();
    await expect(modelNotes).toHaveAttribute("open", "");
    await expect(modelNotes).toContainText("Model notes");
    // Equation callout was moved here from readouts panel
    const callout = modelNotes.locator('[data-kind="model"]');
    await expect(callout).toBeVisible();
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

  test("band picker has accessible label", async ({ page }) => {
    const bandPicker = page.locator(".band-picker");
    await expect(bandPicker).toHaveAttribute("aria-label", "EM band");
  });

  test("tab list has accessible label", async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toHaveAttribute("aria-label", "Explore panels");
  });
});
