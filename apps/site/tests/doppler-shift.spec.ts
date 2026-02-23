import { expect, test } from "@playwright/test";

test.describe("Doppler Shift -- E2E", () => {
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

    await page.goto("play/doppler-shift/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  test("velocity and redshift sliders stay synchronized", async ({ page }) => {
    await page.locator("#velocitySlider").fill("1000");
    await expect(page.locator("#redshiftValue")).not.toHaveText("0");

    await page.locator("#redshiftSlider").fill("0.1");
    await expect(page.locator("#velocityValue")).toContainText("+");
    await expect(page.locator("#velocityClampIndicator")).toBeHidden();
  });

  test("preset 8 clamps velocity slider and uses high redshift", async ({ page }) => {
    await page.locator('button.preset-chip[data-preset="8"]').click();

    await expect(page.locator("#velocityClampIndicator")).toBeVisible();
    await expect(page.locator("#redshiftValue")).toContainText("+2.");
    await expect(page.locator("#regimeValue")).toContainText("relativistic");

    await page.locator("#formulaNonRel").click();
    await expect(page.locator("#formulaLimitIndicator")).toBeVisible();
    await expect(page.locator("#comparisonReadouts")).toBeVisible();
  });

  test("formula toggle reveals comparison readouts", async ({ page }) => {
    await page.locator("#formulaRel").click();
    await expect(page.locator("#comparisonReadouts")).toBeVisible();
    await expect(page.locator("#zCompareValue")).toContainText("vs");

    await page.locator("#formulaNonRel").click();
    await expect(page.locator("#comparisonReadouts")).toBeHidden();
  });

  test("redshift slider shows 5% regime markers with non-color cue", async ({ page }) => {
    await expect(page.locator("#regimeMarkerBlue")).toBeVisible();
    await expect(page.locator("#regimeMarkerRed")).toBeVisible();
    await expect(page.locator("#regimeMarkerCaption")).toContainText("5% NR error");
    await expect(page.locator("#regimeMarkerCaption")).toContainText(/outside these markers, relativistic is required/i);
  });

  test("Fe line density toggle shows and can switch", async ({ page }) => {
    await page.locator('button.element-chip[data-element="Fe"]').click();
    await expect(page.locator("#lineDensityWrap")).toBeVisible();

    await page.locator("#showAllLines").check();
    await expect(page.locator("#status")).toContainText("full line catalog");

    await page.locator("#showAllLines").uncheck();
    await expect(page.locator("#status")).toContainText("strongest 8");
  });

  test("keyboard shortcuts adjust velocity/redshift and presets", async ({ page }) => {
    await page.keyboard.press("]");
    await expect(page.locator("#velocityValue")).toContainText("+");

    await page.keyboard.press("z");
    await expect(page.locator("#redshiftValue")).toContainText("-");

    await page.keyboard.press("7");
    await expect(page.locator("#redshiftValue")).toContainText("+0.158");
  });

  test("mystery challenge locks copy until check", async ({ page }) => {
    await page.goto("play/doppler-shift/?challengeSeed=e2e-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    await expect(page.locator("#repLineRuleChip")).toBeEnabled();
    await page.locator("#repLineRuleChip").click();
    await expect(page.locator("#repLineRuleNote")).toBeVisible();

    await page.locator("#mysterySpectrumBtn").click();
    await expect(page.locator("#mysteryPanel")).toBeVisible();
    await expect(page.locator("#copyResults")).toBeDisabled();
    await expect(page.locator("#repLineRuleChip")).toBeDisabled();
    await expect(page.locator("#repLineRuleNote")).toBeHidden();
    await expect(page.locator("#copyChallengeEvidence")).toBeHidden();

    await page.locator("#checkMysteryAnswer").click();
    await expect(page.locator("#copyResults")).toBeEnabled();
    await expect(page.locator("#status")).toContainText(/Correct\.|Not yet\./);
    await expect(page.locator("#repLineRuleChip")).toBeEnabled();
    await expect(page.locator("#copyChallengeEvidence")).toBeVisible();
    await expect(page.locator("#copyChallengeEvidence")).toBeEnabled();
  });

  test("copy challenge evidence includes debrief context after reveal", async ({ page }) => {
    await page.goto("play/doppler-shift/?challengeSeed=e2e-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    await page.locator("#mysterySpectrumBtn").click();
    await page.locator("#checkMysteryAnswer").click();
    await page.locator("#copyChallengeEvidence").click();

    const copied = await page.evaluate(() => {
      // @ts-ignore test-only bridge
      return window.__cpClipboardStore?.text ?? "";
    });

    expect(copied).toContain("Doppler Shift — Mystery Evidence");
    expect(copied).toContain("Outcome:");
    expect(copied).toContain("Guess:");
    expect(copied).toContain("Target:");
    expect(copied).toContain("Representative line:");
    expect(copied).toContain("Radial velocity (km/s):");
    expect(copied).toContain("Physical redshift z_rel:");
    expect(copied).toContain("Claim + evidence + why formula choice");
  });

  test("copy results includes doppler export context", async ({ page }) => {
    await page.locator('button.preset-chip[data-preset="7"]').click();
    await page.locator("#formulaRel").click();
    await page.locator('button.element-chip[data-element="Na"]').click();
    await page.locator("#copyResults").click();

    const copied = await page.evaluate(() => {
      // @ts-ignore test-only bridge
      return window.__cpClipboardStore?.text ?? "";
    });

    expect(copied).toContain("Cosmic Playground — Results Export (v1)");
    expect(copied).toContain("- Radial velocity (km/s):");
    expect(copied).toContain("- Redshift z:");
    expect(copied).toContain("- Element: Na");
    expect(copied).toContain("- Formula: Relativistic");
    expect(copied).toContain("- Spectrum mode:");
    expect(copied).toContain("- Observed wavelength (nm):");
    expect(copied).toContain("- Frequency shift (THz):");
    expect(copied).toContain("- NR divergence (%):");
  });

  test("popover links resolve", async ({ page }) => {
    await page.locator(".cp-popover-trigger").click();

    const exhibitHref = await page.locator('a[href*="exhibits/doppler-shift"]').getAttribute("href");
    const stationHref = await page.locator('a[href*="stations/doppler-shift"]').getAttribute("href");
    const instructorHref = await page.locator('a[href*="instructor/doppler-shift"]').getAttribute("href");

    expect(exhibitHref).toBeTruthy();
    expect(stationHref).toBeTruthy();
    expect(instructorHref).toBeTruthy();

    await page.goto(new URL(exhibitHref!, page.url()).toString(), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/exhibits\/doppler-shift\/?$/);

    await page.goto(new URL(stationHref!, page.url()).toString(), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stations\/doppler-shift\/?$/);

    await page.goto(new URL(instructorHref!, page.url()).toString(), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/instructor\/doppler-shift\/?$/);
  });
});
