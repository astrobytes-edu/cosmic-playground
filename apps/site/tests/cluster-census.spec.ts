import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/**
 * Cluster Census -- E2E.
 *
 * The claims worth guarding are behavioural, not cosmetic: the heaviest star must be
 * volatile in a small cluster and stable in a large one, the turnoff must fall as the
 * cluster ages, the population counts must always add up, and pointing at a star in one
 * panel must light up the same star in the other.
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

  test("the population counts always add up to the number of stars", async ({ page }) => {
    for (const [count, age] of [
      [300, 0],
      [700, 500],
      [1000, 1000]
    ]) {
      await setSlider(page, "#countSlider", count);
      await setSlider(page, "#ageSlider", age);
      const requested = await readNumber(page.locator("#countValue"));
      const shining = await readNumber(page.locator("#shiningCount"));
      const giants = await readNumber(page.locator("#giantCount"));
      const remnants = await readNumber(page.locator("#remnantCount"));
      expect(shining + giants + remnants).toBe(requested);
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
    // Starts at 300, not 0: at age zero the readout says "not yet" rather than repeating
    // the heaviest star, because no star has left the main sequence to define a turnoff.
    for (const age of [300, 500, 700, 900, 1000]) {
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

  test("every star drawn is a star the model can place", async ({ page }) => {
    // The draw now starts at the ZAMS floor of 0.1 Msun rather than the hydrogen-burning
    // limit of 0.08, so no star is sampled that the model cannot describe. Previously a
    // tenth of every cluster appeared as hollow rings with no HR point. Clamping them
    // onto the diagram instead is the defect this demo was built to avoid, so the tally
    // has to stay complete without one.
    await setSlider(page, "#countSlider", 800);
    await setSlider(page, "#ageSlider", 0);
    const requested = await readNumber(page.locator("#countValue"));
    const shining = await readNumber(page.locator("#shiningCount"));
    expect(shining).toBe(requested);
    expect(await readNumber(page.locator("#giantCount"))).toBe(0);
    expect(await readNumber(page.locator("#remnantCount"))).toBe(0);
  });

  test("the Understand tab explains the model's limits", async ({ page }) => {
    await page.locator("#tab-understand").click();
    const panel = page.locator("#panel-understand");
    await expect(panel).toBeVisible();
    // The giant branch exists now, so the honest limit to state is that its SHAPE is
    // schematic even though its timescales are Hurley's.
    await expect(panel).toContainText(/schematic/i);
    await expect(panel).toContainText(/Hurley/i);
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

  test("says there is no turnoff yet at age zero", async ({ page }) => {
    // The old readout printed the heaviest star's mass in both boxes, which reads as a
    // coincidence and teaches nothing.
    await setSlider(page, "#ageSlider", 0);
    await expect(page.locator("#turnoff")).toHaveText(/not yet/i);
    await expect(page.locator("#giantCount")).toHaveText("0");
  });

  test("ageing the cluster grows a giant branch instead of deleting stars", async ({ page }) => {
    // The defect this guards: stars past the turnoff were marked "remnant" and dropped,
    // so raising the age erased the top of the HR diagram rather than bending it into
    // the branch that carries a cluster's age.
    await setSlider(page, "#countSlider", 4000);
    await setSlider(page, "#ageSlider", 0);
    expect(await readNumber(page.locator("#giantCount"))).toBe(0);

    await setSlider(page, "#ageSlider", 1000);
    expect(await readNumber(page.locator("#giantCount"))).toBeGreaterThan(0);
  });

  test("hovering a star in one panel selects it in the other", async ({ page }) => {
    const card = page.locator("#starCard");
    await expect(card).toHaveAttribute("data-empty", "true");

    // Sweep for a star rather than assuming one sits at a fixed pixel: the draw is
    // random, so a hard-coded coordinate would be flaky by construction.
    const found = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("#hrCanvas");
      const cardEl = document.querySelector<HTMLElement>("#starCard");
      if (!canvas || !cardEl) return false;
      const rect = canvas.getBoundingClientRect();
      for (let i = 1; i < 60; i += 1) {
        for (let j = 1; j < 42; j += 1) {
          const x = rect.left + (rect.width * i) / 60;
          const y = rect.top + (rect.height * j) / 42;
          canvas.dispatchEvent(
            new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true, buttons: 0 })
          );
          if (cardEl.dataset.empty === "false") return true;
        }
      }
      return false;
    });
    expect(found).toBe(true);
    await expect(card).toHaveAttribute("data-empty", "false");
    await expect(card.locator('[data-star="mass"]')).not.toHaveText("--");
    await expect(card.locator('[data-star="teff"]')).not.toHaveText("--");
    await expect(card.locator('[data-star="phase"]')).toHaveText(/main sequence|giant/i);
  });

  test("the keyboard reaches the same per-star detail as the pointer", async ({ page }) => {
    const card = page.locator("#starCard");
    await page.locator("#hrCanvas").focus();
    await page.keyboard.press("ArrowRight");
    await expect(card).toHaveAttribute("data-empty", "false");
    const first = await card.locator('[data-star="mass"]').textContent();

    // Several presses, not one: the mass function is steep enough that the first hundred
    // stars all round to 0.10, so a single step is a true no-op in the readout.
    for (let i = 0; i < 20; i += 1) await page.keyboard.press("ArrowRight");
    const later = await card.locator('[data-star="mass"]').textContent();
    expect(later).not.toBe(first);
    expect(Number(later)).toBeGreaterThan(Number(first));

    await page.keyboard.press("Escape");
    await expect(card).toHaveAttribute("data-empty", "true");
  });

  test("arrow keys walk up the main sequence in mass order", async ({ page }) => {
    await setSlider(page, "#countSlider", 2000);
    await page.locator("#hrCanvas").focus();
    const masses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("ArrowRight");
      masses.push(await readNumber(page.locator('#starCard [data-star="mass"]')));
    }
    for (let i = 1; i < masses.length; i += 1) {
      expect(masses[i]).toBeGreaterThanOrEqual(masses[i - 1]);
    }
  });

  test("a resample clears the selection rather than pointing it at a different star", async ({
    page
  }) => {
    await page.locator("#hrCanvas").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#starCard")).toHaveAttribute("data-empty", "false");
    await page.locator("#reseed").click();
    await expect(page.locator("#starCard")).toHaveAttribute("data-empty", "true");
  });

  test("axis titles are typeset maths, not canvas text", async ({ page }) => {
    // KaTeX renders into .katex; a plain-text fallback would mean the maths never ran.
    await expect(page.locator(".census-plot__ytitle .katex").first()).toBeVisible();
    await expect(page.locator(".census-plot__xtitle .katex").first()).toBeVisible();
  });

  test("deriving the slope from the environment makes the cluster top-heavy", async ({
    page
  }) => {
    // The pedagogical payoff: the mass function is not a constant of nature. A dense,
    // metal-poor cluster forms a flatter high-mass slope (Jerabkova+2018), and that has
    // to show up in the stars actually drawn, not just in the readout.
    const slope = page.locator("#slopeValue");
    await expect(page.locator("#derivePanel")).toBeHidden();
    await expect(slope).toHaveText("2.30");

    await page.locator("#deriveToggle").click();
    await expect(page.locator("#derivePanel")).toBeVisible();
    await expect(page.locator("#deriveToggle")).toHaveAttribute("aria-pressed", "true");
    // Solar metallicity, ordinary cluster mass: nothing should have changed yet.
    await expect(slope).toContainText("2.30");
    await expect(slope).toContainText(/nothing special/i);

    await setSlider(page, "#fehSlider", -200);
    await setSlider(page, "#meclSlider", 600);
    await expect(slope).toContainText(/top-heavy/i);

    const derived = Number((await slope.textContent())?.split(" ")[0]);
    expect(derived).toBeLessThan(2.3);
    // The slider itself follows the derived value, so the reader can see it move.
    expect(Number(await page.locator("#slopeSlider").inputValue())).toBeCloseTo(
      derived * 100,
      0
    );
  });

  test("the slope slider stops accepting input while the slope is derived", async ({ page }) => {
    await page.locator("#deriveToggle").click();
    await setSlider(page, "#fehSlider", -200);
    await setSlider(page, "#meclSlider", 600);
    const derived = await page.locator("#slopeSlider").inputValue();

    // Dragging it must not override the environment.
    await setSlider(page, "#slopeSlider", 300);
    await expect(page.locator("#slopeSlider")).toHaveValue(derived);
    await expect(page.locator("#slopeSlider")).toHaveAttribute("aria-readonly", "true");

    // Turning derivation off hands control back.
    await page.locator("#deriveToggle").click();
    await setSlider(page, "#slopeSlider", 300);
    await expect(page.locator("#slopeValue")).toHaveText("3.00");
  });

  test("renders the cluster with WebGL", async ({ page }) => {
    const context = await page.locator("#clusterCanvas").evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      // getContext returns the EXISTING context; it does not create a second one.
      if (canvas.getContext("webgl2")) return "webgl2";
      if (canvas.getContext("webgl")) return "webgl";
      return "none";
    });
    expect(context).not.toBe("none");
  });

  test("switches between the 2D and 3D views", async ({ page }) => {
    const overlay = page.locator("#clusterOverlay");
    await expect(overlay).toHaveAttribute("data-view-mode", "2D");
    await expect(page.locator("#view2d")).toHaveAttribute("aria-pressed", "true");

    await page.locator("#view3d").click();
    await expect(overlay).toHaveAttribute("data-view-mode", "3D");
    await expect(page.locator("#view3d")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#view2d")).toHaveAttribute("aria-pressed", "false");

    await page.locator("#view2d").click();
    await expect(overlay).toHaveAttribute("data-view-mode", "2D");
  });

  const scaleOf = async (page: Page): Promise<number> =>
    Number(await page.locator("#clusterOverlay").getAttribute("data-pc-per-pixel"));

  test("zooming changes the scale, and reset puts it back", async ({ page }) => {
    // The scale bar has to track the camera: a bar that keeps its label while the reader
    // zooms past it is worse than no bar, because it looks authoritative.
    const start = await scaleOf(page);
    expect(start).toBeGreaterThan(0);

    await page.locator("#clusterCanvas").hover();
    await page.mouse.wheel(0, -900);
    await expect
      .poll(() => scaleOf(page), { message: "zooming in shrinks parsecs-per-pixel" })
      .toBeLessThan(start * 0.9);

    await page.locator("#resetView").click();
    await expect.poll(() => scaleOf(page)).toBeCloseTo(start, 5);
  });

  test("the 3D view is reachable in both directions without the scale jumping", async ({
    page
  }) => {
    // Switching modes must not resize the cluster: the orthographic frustum is matched to
    // what the perspective camera sees at the cluster centre precisely so it does not.
    const flat = await scaleOf(page);
    await page.locator("#view3d").click();
    await expect(page.locator("#clusterOverlay")).toHaveAttribute("data-view-mode", "3D");
    const solid = await scaleOf(page);
    expect(Math.abs(Math.log(solid / flat))).toBeLessThan(0.35);
  });

  test("selecting a star in the cluster panel shows it in the inspector", async ({ page }) => {
    // The cross-panel link has to survive the move to WebGL: the cluster panel's picks are
    // now projected from the live camera rather than recorded during a draw.
    const card = page.locator("#starCard");
    await expect(card).toHaveAttribute("data-empty", "true");
    const found = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("#clusterCanvas");
      const cardEl = document.querySelector<HTMLElement>("#starCard");
      if (!canvas || !cardEl) return false;
      const rect = canvas.getBoundingClientRect();
      for (let i = 1; i < 50; i += 1) {
        for (let j = 1; j < 38; j += 1) {
          canvas.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.left + (rect.width * i) / 50,
              clientY: rect.top + (rect.height * j) / 38,
              bubbles: true,
              buttons: 0
            })
          );
          if (cardEl.dataset.empty === "false") return true;
        }
      }
      return false;
    });
    expect(found).toBe(true);
    await expect(card.locator('[data-star="mass"]')).not.toHaveText("--");
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
