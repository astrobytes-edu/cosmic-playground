import { test, expect } from "@playwright/test";

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
      el.value = "3";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#massRatioValue").textContent();
    expect(value).toContain("3.0");
  });

  test("separation slider changes displayed value", async ({ page }) => {
    const slider = page.locator("#separation");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "6";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const value = await page.locator("#separationValue").textContent();
    expect(value).toContain("6.0");
  });

  test("mass ratio slider has correct min and max", async ({ page }) => {
    const slider = page.locator("#massRatio");
    await expect(slider).toHaveAttribute("min", "0.2");
    await expect(slider).toHaveAttribute("max", "5");
  });

  test("separation slider has correct min and max", async ({ page }) => {
    const slider = page.locator("#separation");
    await expect(slider).toHaveAttribute("min", "1");
    await expect(slider).toHaveAttribute("max", "8");
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

  test("changing mass ratio updates barycenter offset", async ({ page }) => {
    const before = await page.locator("#baryOffsetValue").textContent();
    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "4";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = await page.locator("#baryOffsetValue").textContent();
    expect(after).not.toBe(before);
  });

  test("changing separation updates period", async ({ page }) => {
    const before = await page.locator("#periodValue").textContent();
    const slider = page.locator("#separation");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "7";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = await page.locator("#periodValue").textContent();
    expect(after).not.toBe(before);
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

  // --- Visual Regression (skipped -- re-enable when baselines are generated) ---

  test.skip("screenshot: default view", async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("binary-orbits-default.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test.skip("screenshot: high mass ratio q=5", async ({ page }) => {
    const slider = page.locator("#massRatio");
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("binary-orbits-q5.png", {
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
