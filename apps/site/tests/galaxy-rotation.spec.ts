import { expect, test } from "@playwright/test";

function parseFirstNumber(text: string): number {
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

test.describe("Galaxy Rotation -- E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const clipboardStore = { text: "" };
      // @ts-ignore test-only bridge
      window.__cpClipboardStore = clipboardStore;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            clipboardStore.text = text;
          },
          readText: async () => clipboardStore.text,
        },
      });
    });

    await page.goto("play/galaxy-rotation/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible({ timeout: 15000 });
  });

  test("radius marker synchronizes readouts", async ({ page }) => {
    await page.locator("#radiusSlider").fill("30");
    await expect(page.locator("#radiusValue")).toHaveText(/30\.0/);
    await expect(page.locator("#status")).toContainText("Radius");
  });

  test("halo mass increase raises dark-to-visible ratio", async ({ page }) => {
    await page.locator("#radiusSlider").fill("50");
    const initialRatio = parseFirstNumber(await page.locator("#darkVisRatioValue").innerText());
    await page.locator("#presetSelect").selectOption("custom");
    await page.locator("#haloMassSlider").fill("180");
    const updatedRatio = parseFirstNumber(await page.locator("#darkVisRatioValue").innerText());
    expect(updatedRatio).toBeGreaterThan(initialRatio);
  });

  test("plot mode and MOND toggle update controls", async ({ page }) => {
    await page.locator("#showMond").check();
    await page.locator("#plotMass").click();
    await expect(page.locator("#plotMass")).toHaveAttribute("aria-checked", "true");
    await page.locator("#plotVelocity").click();
    await expect(page.locator("#plotVelocity")).toHaveAttribute("aria-checked", "true");
  });

  test("keyboard shortcuts toggle curves and presets", async ({ page }) => {
    await page.keyboard.press("k");
    await expect(page.locator("#showKeplerian")).not.toBeChecked();

    await page.keyboard.press("m");
    await expect(page.locator("#showMond")).toBeChecked();

    await page.keyboard.press("4");
    await expect(page.locator("#presetSelect")).toHaveValue("no-dark-matter");

    const before = parseFirstNumber(await page.locator("#radiusValue").innerText());
    await page.keyboard.press("]");
    const after = parseFirstNumber(await page.locator("#radiusValue").innerText());
    expect(after).toBeGreaterThan(before);
  });

  test("mystery challenge locks copy results until reveal", async ({ page }) => {
    await page.goto("play/galaxy-rotation/?challengeSeed=e2e-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible({ timeout: 15000 });

    await page.locator("#challengeModeBtn").click();
    await expect(page.locator("#challengePanel")).toBeVisible();
    await expect(page.locator("#copyResults")).toBeDisabled();
    await expect(page.locator("#haloMassSlider")).toBeDisabled();
    await expect(page.locator("#diskMassSlider")).toBeDisabled();
    await expect(page.locator("#mDarkValue")).toHaveText("—");
    await expect(page.locator("#copyChallengeEvidence")).toHaveAttribute("hidden", "");

    const haloMassBefore = await page.locator("#haloMassSliderValue").innerText();
    await page.keyboard.press("4");
    await expect(page.locator("#haloMassSliderValue")).toHaveText(haloMassBefore);

    await page.locator("#checkChallenge").click();
    await expect(page.locator("#copyResults")).toBeEnabled();
    await expect(page.locator("#copyChallengeEvidence")).toBeVisible();
    await expect(page.locator("#copyChallengeEvidence")).toBeEnabled();
  });

  test("copy challenge evidence includes required context", async ({ page }) => {
    await page.goto("play/galaxy-rotation/?challengeSeed=e2e-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible({ timeout: 15000 });
    await page.locator("#challengeModeBtn").click();
    await page.locator("#checkChallenge").click();
    await page.locator("#copyChallengeEvidence").click();

    const copied = await page.evaluate(() => {
      // @ts-ignore test-only bridge
      return window.__cpClipboardStore?.text ?? "";
    });

    expect(copied).toContain("Galaxy Rotation — Challenge Evidence");
    expect(copied).toContain("Outcome:");
    expect(copied).toContain("Guess preset:");
    expect(copied).toContain("Target preset:");
    expect(copied).toContain("Claim + evidence + mechanism");
  });

  test("copy results includes export payload fields", async ({ page }) => {
    await page.locator("#copyResults").click();

    const copied = await page.evaluate(() => {
      // @ts-ignore test-only bridge
      return window.__cpClipboardStore?.text ?? "";
    });

    expect(copied).toContain("Cosmic Playground — Results Export (v1)");
    expect(copied).toContain("- Galaxy model:");
    expect(copied).toContain("- Dark halo mass (10^10 Msun):");
    expect(copied).toContain("- V_total (km/s):");
    expect(copied).toContain("- Delta-lambda 21cm (mm):");
    expect(copied).toContain("- Concentration c:");
  });

  test("popover links resolve", async ({ page }) => {
    await page.locator(".cp-popover-trigger").click();

    const exhibitHref = await page.locator('a[href*="exhibits/galaxy-rotation"]').getAttribute("href");
    const stationHref = await page.locator('a[href*="stations/galaxy-rotation"]').getAttribute("href");
    const instructorHref = await page.locator('a[href*="instructor/galaxy-rotation"]').getAttribute("href");

    expect(exhibitHref).toBeTruthy();
    expect(stationHref).toBeTruthy();
    expect(instructorHref).toBeTruthy();
  });

  test("radio groups support keyboard arrow navigation", async ({ page }) => {
    await page.locator("#plotVelocity").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#plotMass")).toHaveAttribute("aria-checked", "true");

    await page.locator("#challengeModeBtn").click();
    await page.locator("#guessFlat").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#guessKeplerian")).toHaveAttribute("aria-checked", "true");
  });
});
