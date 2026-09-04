import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * HR Diagram Inference Lab -- E2E.
 *
 * This was the only demo of the twenty with no dedicated spec; it was covered by the
 * cross-demo accessibility and layout sweeps and nothing else. That is how a sidebar came
 * to hold 2,997px of content in an 819px box with the Selected Star inspector 905px down
 * it, and how every white dwarf came to sit at exactly 15,400 K.
 *
 * The claims worth guarding are the ones a reader would notice: the diagram's three
 * structures are actually distinguishable, the inspector sits beside the plot, and the
 * activities moved to the drawer are still reachable.
 */

const ROUTE = "play/stars-zams-hr/";

/** Open the drawer accordion containing a control, the way a reader does. */
async function openPanelContaining(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((element) => {
    const details = element.closest("details");
    if (details && !details.open) details.open = true;
  });
}

test.describe("HR Diagram Inference Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.locator("#cp-demo")).toBeVisible();
  });

  test("loads with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.reload();
    await expect(page.locator("#hrCanvas")).toBeVisible();
    await page.waitForTimeout(600);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("the selected-star inspector sits beside the plot, not down the sidebar", async ({
    page
  }) => {
    // It was a 905px card at the bottom of a sidebar that only showed 819px, so in
    // practice the reader never saw the inspector for the plot they were clicking.
    const strip = page.locator(".zams-strip");
    await expect(strip).toBeVisible();
    const geometry = await page.evaluate(() => {
      const s = document.querySelector(".zams-strip")!.getBoundingClientRect();
      const stage = document.querySelector(".cp-demo__stage")!.getBoundingClientRect();
      const sidebar = document
        .querySelector(".cp-demo__controls, .cp-demo__sidebar")!
        .getBoundingClientRect();
      return { stripTop: s.top, stripLeft: s.left, stageBottom: stage.bottom, sidebarLeft: sidebar.left };
    });
    // Under the stage, not inside the sidebar column. Measured against the STAGE rather
    // than the canvas: the canvas can extend past the stage's clipped box, so comparing
    // to it would encode the clipping rather than the placement.
    expect(geometry.stripTop).toBeGreaterThanOrEqual(geometry.stageBottom - 24);
    expect(geometry.stripLeft).toBeLessThan(geometry.sidebarLeft);
  });

  test("the activities moved to the drawer are still reachable", async ({ page }) => {
    // Start Here and the Inference Log left the sidebar for drawer accordions. A reader
    // has to be able to open them and use them.
    for (const title of ["Start here", "Inference log"]) {
      const summary = page.locator("summary", { hasText: title });
      await expect(summary).toBeVisible();
    }
    await openPanelContaining(page, "#claimInput");
    await expect(page.locator("#claimInput")).toBeVisible();
    await page.locator("#claimInput").fill("The main sequence runs hot-bright to cool-faint.");
    await page.locator("#addClaim").click();
    await expect(page.locator("#claimList")).toContainText("main sequence");
  });

  test("switching to an old cluster redraws the diagram", async ({ page }) => {
    /*
     * Two tests used to sit here asserting `typeof text === "string"` and that the canvas
     * was still visible. Neither could fail.
     *
     * The population is drawn to a 2-D canvas, so the honest split is: the physics is
     * pinned in packages/physics (white-dwarf cooling, the giant branch, lifetimes), and
     * what E2E can check is that the control actually reaches the renderer. Comparing the
     * canvas to itself before and after does exactly that, and nothing weaker would have
     * noticed a control wired to nothing.
     */
    const snapshot = () =>
      page.locator("#hrCanvas").evaluate((el) => (el as HTMLCanvasElement).toDataURL());

    await page.waitForTimeout(600);
    const before = await snapshot();
    expect(before.length).toBeGreaterThan(1000);

    await page.evaluate(() => {
      const mode = document.querySelector<HTMLInputElement>("#clusterMode");
      if (mode && !mode.checked) {
        mode.checked = true;
        mode.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const age = document.querySelector<HTMLInputElement>("#clusterAge");
      if (age) {
        age.value = age.max;
        age.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    await expect
      .poll(snapshot, { message: "the diagram should redraw when the cluster age changes" })
      .not.toBe(before);
  });

  test("the sidebar holds controls, not prose", async ({ page }) => {
    const contents = await page.evaluate(() => {
      const sidebar = document.querySelector(".cp-demo__controls, .cp-demo__sidebar")!;
      return {
        hasStartHere: !!sidebar.querySelector("#startHereTitle"),
        hasInferenceLog: !!sidebar.querySelector("#inferenceLogTitle"),
        hasSelectedStar: !!sidebar.querySelector("#selectedStarTitle"),
        hasExploreControls: !!sidebar.querySelector("#exploreTitle")
      };
    });
    expect(contents.hasExploreControls).toBe(true);
    expect(contents.hasStartHere).toBe(false);
    expect(contents.hasInferenceLog).toBe(false);
    expect(contents.hasSelectedStar).toBe(false);
  });

  test("the plot is never clipped by the stage that contains it", async ({ page }) => {
    // The stage is `overflow: hidden`, so a canvas floor larger than the stage's own
    // budget silently cuts the bottom off the diagram -- axis and all. It did: 55px at
    // 1280x720 before the floors were reconciled.
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1366, 768],
      [1280, 720]
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(350);
      const clipped = await page.evaluate(() => {
        const stage = document.querySelector(".cp-demo__stage")!.getBoundingClientRect();
        const canvas = document.querySelector("#hrCanvas")!.getBoundingClientRect();
        return Math.round(Math.max(0, canvas.bottom - stage.bottom));
      });
      expect(clipped, `${width}x${height}: ${clipped}px of the plot is cut off`).toBe(0);
    }
  });
});
