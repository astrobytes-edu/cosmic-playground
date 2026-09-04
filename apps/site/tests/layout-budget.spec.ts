import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Layout budget -- a cross-demo ratchet.
 *
 * The defect this exists to stop: a demo's readouts sitting below the fold, so the reader
 * has to scroll the page to see a number that changes when they move a slider. It went
 * unnoticed for the life of the project because nothing in ~1,000 tests looked at
 * geometry; every demo's own spec asserted that its readouts contained the right TEXT.
 *
 * Measured 2026-09-04 at 1440x900, the size of a common laptop:
 *
 *   15 of 20 demos had at least one readout below the fold.
 *   binary-orbits had 46 of 48 below it, the first at y = 3388, in a sidebar holding
 *   3,889px of content in an 819px box.
 *
 * That is too much to fix in one pass, so this is a RATCHET rather than a pass/fail gate:
 * `BUDGETS` records what each demo does today. A demo that gets worse fails. A demo that
 * gets better fails too, loudly, and the fix is to tighten its budget -- which is the
 * point. `null` means "must be clean", and every demo should end up there.
 *
 * To fix a demo, see docs/reviews/2026-09-04-layout-audit.md for what actually fills these
 * sidebars; it is rarely the controls.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const demosDir = path.resolve(here, "..", "src", "content", "demos");

function demoSlugsFromContent(): string[] {
  return readdirSync(demosDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/, ""))
    .sort();
}

interface Budget {
  /** Readouts allowed below the fold. 0 is the goal. */
  readoutsBelowFold: number;
  /** Sidebar content allowed to exceed its box, in px. 0 is the goal. */
  sidebarOverflowPx: number;
}

/**
 * Allowances are the MEASURED value plus a small slack, so a demo cannot drift worse
 * without failing. Anything absent from this map must be clean.
 *
 * Overflow figures were re-measured after the shared `.control` component landed, which
 * took 836px off nine sidebars.
 *
 * Readout counts were re-measured on 2026-09-04 after the visibility filter was corrected
 * (see the note on `checkVisibility` below). Three demos had been over-reported because
 * their closed accordions were counted: binary-orbits 9 -> 1, eos-lab 22 -> 14,
 * keplers-laws 17 -> 7.
 */
const BUDGETS: Record<string, Budget> = {
  // binary-orbits was 46 below the fold with 3,070px hidden. Fixed 2026-09-04: activities
  // and the invariant quiz moved to the drawer, readouts filtered by view, the integrity
  // panel given the full grid width. Not yet clean -- the Energy view has the most
  // readouts of any -- but no longer the outlier.
  "binary-orbits": { readoutsBelowFold: 1, sidebarOverflowPx: 650 },
  "eos-lab": { readoutsBelowFold: 14, sidebarOverflowPx: 580 },
  "galaxy-rotation": { readoutsBelowFold: 22, sidebarOverflowPx: 360 },
  "doppler-shift": { readoutsBelowFold: 20, sidebarOverflowPx: 380 },
  // keplers-laws was 7 below the fold. Fixed 2026-09-04: the stage is height-bounded and
  // its SVG made height-driven so the cap shrinks the orbit rather than cropping it, the
  // Friendly/Advanced switch moved into the panel header, and the Conservation disclosure
  // spans the readouts row. The remaining overflow is the sidebar's own controls.
  "keplers-laws": { readoutsBelowFold: 0, sidebarOverflowPx: 880 },
  "conservation-laws": { readoutsBelowFold: 12, sidebarOverflowPx: 0 },
  "planetary-conjunctions": { readoutsBelowFold: 12, sidebarOverflowPx: 0 },
  "spectral-lines": { readoutsBelowFold: 12, sidebarOverflowPx: 0 },
  // stars-zams-hr was 10 below the fold with 2,178px hidden. Fixed 2026-09-04: Start
  // Here and the Inference Log moved to the drawer, the 905px Selected Star card became a
  // strip under the plot, and the demo's custom grid gained the `readouts` row it never
  // had. The sidebar's remaining overflow is the controls themselves.
  "stars-zams-hr": { readoutsBelowFold: 0, sidebarOverflowPx: 40 },
  seasons: { readoutsBelowFold: 10, sidebarOverflowPx: 80 },
  "telescope-resolution": { readoutsBelowFold: 8, sidebarOverflowPx: 120 },
  "blackbody-radiation": { readoutsBelowFold: 4, sidebarOverflowPx: 330 },
  "retrograde-motion": { readoutsBelowFold: 4, sidebarOverflowPx: 0 },
  "parallax-distance": { readoutsBelowFold: 2, sidebarOverflowPx: 920 },
  "eclipse-geometry": { readoutsBelowFold: 0, sidebarOverflowPx: 280 }
};

const CLEAN: Budget = { readoutsBelowFold: 0, sidebarOverflowPx: 0 };

test.describe("Layout budget", () => {
  for (const slug of demoSlugsFromContent()) {
    test(`${slug} keeps its readouts on screen at 1440x900`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`play/${slug}/`, { waitUntil: "load" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      // Canvas and SVG demos lay out on the first frame; give them one.
      await page.waitForTimeout(600);

      const measured = await page.evaluate(() => {
        const sidebar = document.querySelector<HTMLElement>(
          ".cp-demo__controls, .cp-demo__sidebar"
        );
        const scroller =
          sidebar?.querySelector<HTMLElement>(".cp-panel-body") ?? sidebar ?? null;
        // Rendered readouts only. An element inside a collapsed <details> is content the
        // reader has deliberately not opened, so counting it below the fold blames the demo
        // for the reader's choice.
        //
        // This filter used to be `getBoundingClientRect().height > 0`, which does NOT do
        // that. Chromium hides a closed <details>'s contents with `content-visibility:
        // hidden`: painting and descendant layout are skipped, but the element keeps a box
        // and still reports a rect. keplers-laws' closed Conservation accordion measured
        // 189x582 while `checkVisibility()` said false, so the ratchet counted its five
        // readouts -- and their five value spans -- as below the fold. It reported 17 where
        // the honest figure was 7.
        //
        // `checkVisibility()` is the predicate that actually answers the question: it
        // accounts for display:none, visibility:hidden and content-visibility together.
        const readouts = [
          ...document.querySelectorAll<HTMLElement>(".cp-readout, .cp-readout__value")
        ].filter((el) => el.checkVisibility());
        const below = readouts.filter(
          (el) => el.getBoundingClientRect().bottom > window.innerHeight
        );
        return {
          readoutCount: readouts.length,
          readoutsBelowFold: below.length,
          firstBelowTop: below[0] ? Math.round(below[0].getBoundingClientRect().top) : null,
          sidebarOverflowPx: scroller
            ? Math.max(0, scroller.scrollHeight - scroller.clientHeight)
            : 0
        };
      });

      const budget = BUDGETS[slug] ?? CLEAN;

      expect(
        measured.readoutsBelowFold,
        `${slug}: ${measured.readoutsBelowFold} of ${measured.readoutCount} readouts below the fold` +
          (measured.firstBelowTop === null ? "" : `, first at y=${measured.firstBelowTop}`) +
          `. Budget is ${budget.readoutsBelowFold}.` +
          (measured.readoutsBelowFold < budget.readoutsBelowFold
            ? " This is BETTER than the budget -- tighten the entry in BUDGETS."
            : "")
      ).toBe(budget.readoutsBelowFold);

      expect(
        measured.sidebarOverflowPx,
        `${slug}: sidebar overflows its box by ${measured.sidebarOverflowPx}px ` +
          `(budget ${budget.sidebarOverflowPx}px). Content that does not fit is a design ` +
          `decision, not something to hide behind an inner scrollbar.`
      ).toBeLessThanOrEqual(budget.sidebarOverflowPx);
    });
  }

  test("the budget map has no entries for demos that no longer exist", () => {
    // A stale allowance silently exempts nothing and hides that the list has shrunk.
    const slugs = new Set(demoSlugsFromContent());
    for (const slug of Object.keys(BUDGETS)) {
      expect(slugs.has(slug), `BUDGETS names "${slug}", which is not a demo`).toBe(true);
    }
  });
});
