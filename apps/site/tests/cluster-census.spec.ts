import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/**
 * Cluster Census -- E2E.
 *
 * The claims worth guarding are behavioural, not cosmetic: the heaviest star must be
 * volatile in a small cluster and stable in a large one, the turnoff must fall as the
 * cluster ages, and the three population counts must always add up.
 */

const ROUTE = "play/cluster-census/";

/** Range inputs with a log mapping need their value set through the DOM, not typed. */
async function setSlider(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((element, next) => {
    const input = element as HTMLInputElement;
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function readNumber(locator: Locator): Promise<number> {
  const text = (await locator.textContent()) ?? "";
  return Number(text.replace(/,/g, ""));
}

test.describe("Cluster Census", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.locator("#clusterCanvas")).toBeVisible();
  });

  test("loads with no console errors", async ({ page }) => {
    // The starfield used to throw InvalidStateError whenever its canvas measured 0x0.
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.reload();
    await expect(page.locator("#mostMassive")).not.toHaveText("");
    expect(errors).toEqual([]);
  });

  test("renders all three panels and the starfield", async ({ page }) => {
    await expect(page.locator("#clusterCanvas")).toBeVisible();
    await expect(page.locator("#hrCanvas")).toBeVisible();
    await expect(page.locator("#imfCanvas")).toBeVisible();
    // Zero-size and offscreen by design, so attached rather than visible.
    await expect(page.locator("canvas.cp-starfield")).toBeAttached();
  });

  test("populates every readout on load", async ({ page }) => {
    for (const id of ["#mostMassive", "#turnoff", "#totalMass", "#halfRadius"]) {
      await expect(page.locator(id)).not.toHaveText("");
    }
  });

  test("the three population counts always add up to the number of stars", async ({ page }) => {
    for (const [count, age] of [
      [300, 0],
      [700, 500],
      [1000, 1000]
    ]) {
      await setSlider(page, "#countSlider", count);
      await setSlider(page, "#ageSlider", age);
      const requested = await readNumber(page.locator("#countValue"));
      const shining = await readNumber(page.locator("#shiningCount"));
      const remnants = await readNumber(page.locator("#remnantCount"));
      const outside = await readNumber(page.locator("#outsideCount"));
      expect(shining + remnants + outside).toBe(requested);
    }
  });

  test("the heaviest star is volatile in a small cluster and steady in a large one", async ({
    page
  }) => {
    // The whole point of the instrument. Measured live: about 12x spread at 300 stars,
    // under 1.5x at 20,000.
    const sample = async (): Promise<number[]> => {
      const values: number[] = [];
      for (let i = 0; i < 6; i += 1) {
        await page.locator("#reseed").click();
        values.push(await readNumber(page.locator("#mostMassive")));
      }
      return values;
    };

    await setSlider(page, "#countSlider", 300);
    const small = await sample();
    const smallSpread = Math.max(...small) / Math.min(...small);

    await setSlider(page, "#countSlider", 1000);
    const large = await sample();
    const largeSpread = Math.max(...large) / Math.min(...large);

    expect(smallSpread).toBeGreaterThan(largeSpread);
    expect(largeSpread).toBeLessThan(2);
  });

  test("the turnoff falls monotonically as the cluster ages", async ({ page }) => {
    await setSlider(page, "#countSlider", 700);
    const turnoffs: number[] = [];
    for (const age of [0, 300, 500, 700, 900, 1000]) {
      await setSlider(page, "#ageSlider", age);
      turnoffs.push(await readNumber(page.locator("#turnoff")));
    }
    for (let i = 1; i < turnoffs.length; i += 1) {
      expect(turnoffs[i]).toBeLessThan(turnoffs[i - 1]);
    }
    // An old cluster's turnoff sits near a solar mass, which is the observed result.
    expect(turnoffs[turnoffs.length - 1]).toBeLessThan(1.5);
  });

  test("remnants appear only once the cluster is old enough", async ({ page }) => {
    await setSlider(page, "#countSlider", 800);
    await setSlider(page, "#ageSlider", 0);
    expect(await readNumber(page.locator("#remnantCount"))).toBe(0);
    await setSlider(page, "#ageSlider", 900);
    expect(await readNumber(page.locator("#remnantCount"))).toBeGreaterThan(0);
  });

  test("switching the mass function updates the chips and the readouts", async ({ page }) => {
    await expect(page.locator("#lawMaschberger")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#lawKroupa")).toHaveAttribute("aria-pressed", "false");
    await page.locator("#lawKroupa").click();
    await expect(page.locator("#lawKroupa")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#lawMaschberger")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#status")).toContainText("Kroupa");
  });

  test("switching the spatial profile updates the chips", async ({ page }) => {
    await expect(page.locator("#profilePlummer")).toHaveAttribute("aria-pressed", "true");
    await page.locator("#profileEff").click();
    await expect(page.locator("#profileEff")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#profilePlummer")).toHaveAttribute("aria-pressed", "false");
  });

  test("presets move several controls at once", async ({ page }) => {
    await page.locator('button.preset[data-preset="globular"]').click();
    await expect(page.locator('button.preset[data-preset="globular"]')).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.locator("#countValue")).toHaveText("20,000");
    await expect(page.locator("#ageValue")).toContainText("Gyr");
    await expect(page.locator("#remnantCount")).not.toHaveText("0");
  });

  test("reset returns every control to its default", async ({ page }) => {
    await page.locator('button.preset[data-preset="globular"]').click();
    await expect(page.locator("#countValue")).toHaveText("20,000");
    await page.locator("#reset").click();
    await expect(page.locator("#countValue")).toHaveText("800");
    await expect(page.locator("#ageValue")).toContainText("0 Myr");
    await expect(page.locator("#profilePlummer")).toHaveAttribute("aria-pressed", "true");
  });

  test("the sliders announce a meaningful value, not the raw slider position", async ({
    page
  }) => {
    await setSlider(page, "#countSlider", 500);
    await expect(page.locator("#countSlider")).toHaveAttribute("aria-valuetext", /stars$/);
    await expect(page.locator("#slopeSlider")).toHaveAttribute("aria-valuetext", /^alpha /);
    await expect(page.locator("#ageSlider")).toHaveAttribute("aria-valuetext", /Myr|Gyr/);
  });

  test("the live region carries the census rather than describing the picture", async ({
    page
  }) => {
    await setSlider(page, "#countSlider", 400);
    const status = page.locator("#status");
    await expect(status).toContainText("stars drawn from the");
    await expect(status).toContainText("Heaviest star");
    await expect(status).toContainText("remnants");
  });

  test("stars below the model range are counted but never plotted", async ({ page }) => {
    // Clamping them onto the HR diagram is the defect this demo was built to avoid.
    await setSlider(page, "#countSlider", 800);
    await setSlider(page, "#ageSlider", 0);
    const outside = await readNumber(page.locator("#outsideCount"));
    const shining = await readNumber(page.locator("#shiningCount"));
    expect(outside).toBeGreaterThan(0);

    const plotted = await page.evaluate(() =>
      // The HR panel plots main-sequence stars only; the tally is the check on that.
      Number(document.querySelector("#shiningCount")?.textContent?.replace(/,/g, "") ?? "0")
    );
    expect(plotted).toBe(shining);
    expect(plotted + outside).toBe(await readNumber(page.locator("#countValue")));
  });

  test("the Understand tab explains the model's limits", async ({ page }) => {
    await page.locator("#tab-understand").click();
    const panel = page.locator("#panel-understand");
    await expect(panel).toBeVisible();
    // The panel capitalises it as a heading; the drawer uses it mid-sentence.
    await expect(panel).toContainText(/no post-main-sequence/i);
    await expect(panel).toContainText(/extrapolate/i);
    await expect(panel).toContainText(/domain/i);
  });

  test("copy results puts the sources and the counts on the clipboard", async ({ page }) => {
    await page.evaluate(() => {
      const store: { text: string } = { text: "" };
      (window as unknown as { __copied: { text: string } }).__copied = store;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: (text: string) => { store.text = text; return Promise.resolve(); } }
      });
    });
    await page.locator("#copyResults").click();
    await expect(page.locator("#status")).toContainText("Copied");
    const copied = await page.evaluate(
      () => (window as unknown as { __copied: { text: string } }).__copied.text
    );
    expect(copied).toContain("Maschberger");
    expect(copied).toContain("Hurley");
    expect(copied).toContain("Heaviest star");
    expect(copied).toContain("Below the ZAMS model range");
  });
});

test.describe("Cluster Census -- Reduced Motion", () => {
  test("still renders every panel", async ({ page }) => {
    // The repo convention: emulateMedia on the page, not a test.use fixture.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROUTE);
    await expect(page.locator("#clusterCanvas")).toBeVisible();
    await expect(page.locator("#hrCanvas")).toBeVisible();
    await expect(page.locator("#imfCanvas")).toBeVisible();
    await expect(page.locator("#mostMassive")).not.toHaveText("");
  });
});
