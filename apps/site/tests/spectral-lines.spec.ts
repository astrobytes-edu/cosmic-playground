import { test, expect, type Page } from "@playwright/test";

test.describe("Spectral Lines -- E2E", () => {
  const parseMysteryTarget = (status: string): string => {
    const correctMatch = status.match(/Mystery spectrum is ([A-Za-z]+) in (Emission|Absorption) mode/i);
    if (correctMatch) return `${correctMatch[1]}-${correctMatch[2].toLowerCase()}`;
    const incorrectMatch = status.match(/target is ([A-Za-z]+) \((Emission|Absorption)\)/i);
    if (incorrectMatch) return `${incorrectMatch[1]}-${incorrectMatch[2].toLowerCase()}`;
    throw new Error(`Could not parse mystery target from status: ${status}`);
  };

  const pickReflection = async (page: Page) => {
    await page.locator("#reflection-spacing-pattern").click();
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const clipboardStore = { text: "" };
      // @ts-ignore test-only window bridge
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

    await page.goto("play/spectral-lines/", { waitUntil: "domcontentloaded" });
    if (await page.getByRole("heading", { name: "404: Not Found" }).isVisible().catch(() => false)) {
      // Retry once to avoid occasional first-request 404 while preview server routes warm.
      await page.goto("play/spectral-lines/", { waitUntil: "domcontentloaded" });
    }
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  test("shared mode state stays synchronized across hydrogen and elements controls", async ({ page }) => {
    await page.locator("#modeAbsorption").click();
    await expect(page.locator("#modeAbsorption")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#elemModeAbsorption")).toHaveAttribute("aria-checked", "true");

    await page.locator("#sidebar-tab-elem").click();
    await page.locator("#elemModeEmission").click();

    await expect(page.locator("#elemModeEmission")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#modeEmission")).toHaveAttribute("aria-checked", "true");
  });

  test("elements tab applies selected mode and element without depending on hydrogen tab controls", async ({ page }) => {
    await page.locator("#sidebar-tab-elem").click();
    await page.locator('button.element-chip[data-element="Na"]').click();
    await page.locator("#elemModeAbsorption").click();

    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /absorption lines for element Na\./i);
    await expect(page.locator("#modeAbsorption")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#hydrogenVizTop")).toBeHidden();
    await expect(page.locator("#elementsGuidance")).toBeVisible();
  });

  test("hydrogen-only microscope and temperature panels toggle with tab context", async ({ page }) => {
    await expect(page.locator("#microscopePanel")).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("#temperaturePanel")).toHaveAttribute("aria-hidden", "false");

    await page.locator("#sidebar-tab-elem").click();
    await expect(page.locator("#microscopePanel")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("#temperaturePanel")).toHaveAttribute("aria-hidden", "true");

    await page.locator("#sidebar-tab-H").click();
    await expect(page.locator("#microscopePanel")).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("#temperaturePanel")).toHaveAttribute("aria-hidden", "false");
  });

  test("series filter chips change hydrogen context and spectrum label", async ({ page }) => {
    await page.locator('button.series-chip[data-series="1"]').click();
    await expect(page.locator("#readoutSeries")).toHaveText("Lyman");
    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /\(Lyman\)\./i);

    await page.locator('button.series-chip[data-series="4"]').click();
    await expect(page.locator("#readoutSeries")).toHaveText("Brackett");
    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /\(Brackett\)\./i);
  });

  test("inverse mode infers Balmer 3->2 from 656 nm", async ({ page }) => {
    await page.locator("#inferenceInverse").click();
    await page.locator("#inverseObservedWavelength").fill("656");
    await page.locator("#solveInverse").click();

    await expect(page.locator("#readoutTransition")).toContainText("n = 3");
    await expect(page.locator("#readoutTransition")).toContainText("n = 2");
    await expect(page.locator("#readoutSeries")).toHaveText("Balmer");
    await expect(page.locator("#inverseResult")).toContainText("Inferred");
  });

  test("copy results includes inverse fields only for solved hydrogen inverse context", async ({ page }) => {
    await page.locator("#inferenceInverse").click();
    await page.locator("#inverseObservedWavelength").fill("656");
    await page.locator("#solveInverse").click();
    await page.locator("#copyResults").click();
    const copied = await page.evaluate(() => {
      // @ts-ignore test-only window bridge
      return window.__cpClipboardStore?.text ?? "";
    });

    expect(copied).toContain("- Inference mode: Inverse (lambda");
    expect(copied).toContain("- Observed wavelength input (nm):");
    expect(copied).toContain("- Inferred transition:");
    expect(copied).toContain("- Inverse residual (nm):");
  });

  test("elements compare mode shows explicit comparison aria label", async ({ page }) => {
    await page.locator("#sidebar-tab-elem").click();
    await page.locator('button.element-chip[data-element="Na"]').click();
    await page.locator("#showHComparison").check();
    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /comparing Na with hydrogen Balmer fingerprints/i);
    await expect(page.locator("#hComparisonHint")).toBeHidden();
  });

  test("compare mode is disabled for hydrogen selection and never auto-switches element", async ({ page }) => {
    await page.locator("#sidebar-tab-elem").click();
    await page.locator('button.element-chip[data-element="Na"]').click();
    await page.locator("#showHComparison").check();
    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /comparing Na with hydrogen Balmer fingerprints/i);

    await page.locator('button.element-chip[data-element="H"]').click();
    await expect(page.locator('button.element-chip[data-element="H"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#showHComparison")).toBeDisabled();
    await expect(page.locator("#showHComparison")).not.toBeChecked();
    await expect(page.locator("#hComparisonHint")).toBeVisible();
    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /lines for element H\./i);
  });

  test("temperature slider updates proxy readouts", async ({ page }) => {
    const before = await page.locator("#tempBalmerProxy").innerText();
    await page.locator("#temperatureSlider").fill("12000");
    await expect(page.locator("#temperatureValue")).toHaveText("12000");
    const after = await page.locator("#tempBalmerProxy").innerText();
    expect(after).not.toBe(before);
  });

  test("orbit selection is keyboard operable and announces updates", async ({ page }) => {
    const firstOrbit = page.locator("#bohrAtom .orbit-selectable").first();
    await firstOrbit.focus();
    await expect(page.locator("#orbitTooltip")).toBeVisible();
    await expect(page.locator("#orbitTooltip")).toContainText("n=");
    await expect(page.locator("#orbitTooltip")).toContainText("E_n=");
    await firstOrbit.press("Enter");

    await expect(page.locator("#status")).toContainText("Orbit selected.");
    await expect(page.locator("#status")).toContainText("nm");
  });

  test("mode transitions announce emission and absorption messages in the live region", async ({ page }) => {
    await page.locator("#modeAbsorption").click();
    await expect(page.locator("#status")).toContainText("Absorption:");
    await expect(page.locator("#status")).toContainText("nm");

    await page.locator("#modeEmission").click();
    await expect(page.locator("#status")).toContainText("Emission:");
  });

  test("copy results includes required mode/tab/element/series export context fields", async ({ page }) => {
    await page.locator('button.series-chip[data-series="2"]').click();
    await page.locator("#sidebar-tab-elem").click();
    await page.locator('button.element-chip[data-element="Fe"]').click();
    await page.locator("#elemModeAbsorption").click();
    await page.locator("#copyResults").click();

    const copied = await page.evaluate(() => {
      // @ts-ignore test-only window bridge
      return window.__cpClipboardStore?.text ?? "";
    });
    expect(copied).toBeTruthy();

    expect(copied).toContain("Cosmic Playground — Results Export (v1)");
    expect(copied).toContain("- Mode: Absorption");
    expect(copied).toContain("- Tab: Elements");
    expect(copied).toContain("- Element: Fe");
    expect(copied).toContain("- n_upper:");
    expect(copied).toContain("- n_lower:");
    expect(copied).toContain("- Series filter: Balmer");
    expect(copied).toContain("- Representative line:");
    expect(copied).not.toContain("- Inference mode:");
    expect(copied).not.toContain("- Inferred transition:");
    expect(copied).not.toContain("- Inverse residual (nm):");

    expect(copied).toContain("- Wavelength lambda (nm):");
    expect(copied).toContain("- Energy E_gamma (eV):");
    expect(copied).toContain("- Frequency nu (Hz):");
    expect(copied).toContain("- Series: Element catalog");
    expect(copied).toContain("- Band:");

    expect(copied).toContain("Hydrogen energy levels from the Bohr model");
    expect(copied).toContain("NIST Atomic Spectra Database");
  });

  test("mystery spectrum challenge is keyboard-accessible and announces check results", async ({ page }) => {
    await page.goto("play/spectral-lines/?mysterySeed=e2e-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    await page.locator("#sidebar-tab-elem").click();
    await page.locator("#mysterySpectrumBtn").click();

    await expect(page.locator("#mysteryPanel")).toBeVisible();
    await expect(page.locator("#spectrumCanvas")).toHaveAttribute("aria-label", /hidden element and hidden mode/i);
    await pickReflection(page);
    await page.locator("#checkMysteryAnswer").click();
    await expect(page.locator("#status")).toContainText(/Correct\.|Not yet\./);

    await page.locator("#exitMystery").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#status")).toContainText("Mystery spectrum ended.");
  });

  test("mystery targets are not repeated immediately and can be deterministic with seed", async ({ page }) => {
    await page.locator("#sidebar-tab-elem").click();

    await page.locator("#mysterySpectrumBtn").click();
    await pickReflection(page);
    await page.locator("#checkMysteryAnswer").click();
    const firstStatus = await page.locator("#status").innerText();
    const firstTarget = parseMysteryTarget(firstStatus);
    await page.locator("#exitMystery").click();

    await page.locator("#mysterySpectrumBtn").click();
    await pickReflection(page);
    await page.locator("#checkMysteryAnswer").click();
    const secondStatus = await page.locator("#status").innerText();
    const secondTarget = parseMysteryTarget(secondStatus);
    await page.locator("#exitMystery").click();

    expect(secondTarget).not.toBe(firstTarget);

    await page.goto("play/spectral-lines/?mysterySeed=fixed-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    await page.locator("#sidebar-tab-elem").click();
    await page.locator("#mysterySpectrumBtn").click();
    await pickReflection(page);
    await page.locator("#checkMysteryAnswer").click();
    const seededStatusOne = await page.locator("#status").innerText();
    const seededTargetOne = parseMysteryTarget(seededStatusOne);

    await page.goto("play/spectral-lines/?mysterySeed=fixed-seed", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();
    await page.locator("#sidebar-tab-elem").click();
    await page.locator("#mysterySpectrumBtn").click();
    await pickReflection(page);
    await page.locator("#checkMysteryAnswer").click();
    const seededStatusTwo = await page.locator("#status").innerText();
    const seededTargetTwo = parseMysteryTarget(seededStatusTwo);

    expect(seededTargetTwo).toBe(seededTargetOne);
  });

  test("copy results is locked during unrevealed mystery and restored after check", async ({ page }) => {
    await page.locator("#sidebar-tab-elem").click();
    await page.locator("#mysterySpectrumBtn").click();

    await expect(page.locator("#copyResults")).toBeDisabled();
    await expect(page.locator("#copyLockHint")).toBeVisible();

    await pickReflection(page);
    await page.locator("#checkMysteryAnswer").click();
    await expect(page.locator("#copyResults")).toBeEnabled();
    await expect(page.locator("#copyLockHint")).toBeHidden();

    await page.locator("#copyResults").click();
    const copied = await page.evaluate(() => {
      // @ts-ignore test-only window bridge
      return window.__cpClipboardStore?.text ?? "";
    });
    expect(copied).toContain("- Tab: Elements");
  });

  test("popover links resolve to exhibit, station, and instructor pages", async ({ page }) => {
    await page.locator(".cp-popover-trigger").click();

    const exhibitHref = await page.locator('a[href*="exhibits/spectral-lines"]').getAttribute("href");
    const stationHref = await page.locator('a[href*="stations/spectral-lines"]').getAttribute("href");
    const instructorHref = await page.locator('a[href*="instructor/spectral-lines"]').getAttribute("href");

    expect(exhibitHref).toBeTruthy();
    expect(stationHref).toBeTruthy();
    expect(instructorHref).toBeTruthy();

    await page.goto(new URL(exhibitHref!, page.url()).toString(), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/exhibits\/spectral-lines\/?$/);

    await page.goto(new URL(stationHref!, page.url()).toString(), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stations\/spectral-lines\/?$/);

    await page.goto(new URL(instructorHref!, page.url()).toString(), { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/instructor\/spectral-lines\/?$/);
  });
});
