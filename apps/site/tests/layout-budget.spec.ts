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
 *
 * 2026-09-05: the eos-lab and keplers-laws sidebar allowances went UP without either demo
 * getting worse. `.cp-accordion` used `overflow: hidden`, which makes it a SCROLL CONTAINER,
 * and a grid item that is a scroll container has an automatic minimum size of zero -- so once
 * a sidebar grid overflowed, the track holding an accordion collapsed to 2px and its summary
 * spilled out over whatever followed. eos-lab had four such accordions, keplers-laws one.
 * Switching to `overflow: clip` (clips identically, but is not a scroll container) restored
 * their real heights, and the scroller now reports content it had been hiding at zero height.
 */
const BUDGETS: Record<string, Budget> = {
  // binary-orbits was 46 below the fold with 3,070px hidden. Fixed 2026-09-04: activities
  // and the invariant quiz moved to the drawer, readouts filtered by view, the integrity
  // panel given the full grid width. Not yet clean -- the Energy view has the most
  // readouts of any -- but no longer the outlier.
  // binary-orbits was 1 below the fold with 601px of sidebar hidden. Fixed 2026-09-04: its
  // stage bound was gated on `min-height: 820px`, which switched it off at 1366x768 and
  // 1280x720 -- the viewports that need it most, where all 16 readouts were below the fold.
  // The remaining sidebar overflow is live content tied to its controls: an inclination
  // hint that computes sin(i), and a Live response panel that answers the mass-ratio slider.
  "binary-orbits": { readoutsBelowFold: 0, sidebarOverflowPx: 330 },
  // eos-lab was 14 below the fold with 540px of sidebar hidden and a 1,282px stage. Fixed
  // 2026-09-04: both panel help paragraphs to the drawer, the three channel cards into the
  // strip where they belong, the seven derived quantities behind a disclosure, presets
  // behind a trigger, and the stage bounded with both surfaces made height-driven. The
  // remaining overflow is the sidebar's own controls.
  // 2026-09-10: 520 -> 600. Every number in this map was measured on macOS, and CI runs
  // Linux, where the default sans is wider and taller: eos-lab's sidebar overflows by 569
  // there against 520 here. CI is the platform that gates the deploy, so it is the one the
  // ratchet has to be set from. The allowance still ratchets -- it just starts from the
  // binding measurement instead of the convenient one.
  "eos-lab": { readoutsBelowFold: 0, sidebarOverflowPx: 600 },
  // galaxy-rotation was 22 below the fold with 322px of sidebar hidden. Fixed 2026-09-04:
  // its galaxy schematic is a SQUARE viewBox at `width: 100%`, so its height was its
  // column's width -- 693px at a 1920 viewport. Capped so it letterboxes into the width the
  // column has spare, the shell's stage floor released, prose to the drawer, and the seven
  // inputs and mass-budget values behind a disclosure.
  "galaxy-rotation": { readoutsBelowFold: 0, sidebarOverflowPx: 160 },
  // doppler-shift was 20 below the fold with 343px of sidebar hidden and a 955px stage.
  // Fixed 2026-09-04: the two viz cards sit side by side as cause and observable rather
  // than stacked, the shell's stage floor released so the stage is content-sized, prose and
  // the misconception callout to the drawer, velocity presets behind a trigger, and the
  // inputs and frequency restatement behind a disclosure.
  "doppler-shift": { readoutsBelowFold: 0, sidebarOverflowPx: 60 },
  // keplers-laws was 7 below the fold. Fixed 2026-09-04: the stage is height-bounded and
  // its SVG made height-driven so the cap shrinks the orbit rather than cropping it, the
  // Friendly/Advanced switch moved into the panel header, and the Conservation disclosure
  // spans the readouts row. The remaining overflow is the sidebar's own controls.
  "keplers-laws": { readoutsBelowFold: 0, sidebarOverflowPx: 940 },

  // spectral-lines was 12 below the fold -- every readout, at every desktop width, because
  // its 833px stage never responded to width at all. Both diagrams capped on WIDTH (400px
  // and 220px) and took their height from that cap, so `.viz-top` spent 426px of vertical
  // space to draw 620px of content inside a 980px row. Fixed 2026-09-05: the drawings are
  // height-driven from a budget of `viewport - constants`, the two advanced tool panels
  // moved to the drawer, and the six readouts fit one row. Clean, so it is gone from here.
  // stars-zams-hr was 10 below the fold with 2,178px hidden. Fixed 2026-09-04: Start
  // Here and the Inference Log moved to the drawer, the 905px Selected Star card became a
  // strip under the plot, and the demo's custom grid gained the `readouts` row it never
  // had. The sidebar's remaining overflow is the controls themselves.
  // 2026-09-05: its stage rules were gated `and (min-height: 745px)`, so at 1280x720 they
  // switched off, `#hrCanvas` fell back to `aspect-ratio: 4/3` at full width, and the stage
  // grew to 856px with all ten readouts 329px past the fold -- the binary-orbits defect
  // again. This test only samples 1440x900, so it never saw it.
  // 2026-09-10: 40 -> 56. Linux CI measured 44 (see the eos-lab note above).
  "stars-zams-hr": { readoutsBelowFold: 0, sidebarOverflowPx: 56 },

  // retrograde-motion was 4 below the fold at 1440x900 -- and all 12 at 1920x1080, 1366x768
  // and 1280x720, which this test's single 1440 sample could not see: its stage GREW with
  // the viewport, 629px at 1280 to 917px at 1920, because `#orbitSvg` is a square viewBox at
  // `width: 100%` and its height was its column's width. Fixed 2026-09-05: three fixed costs
  // came out first so the drawing kept its size -- the overlay checkboxes to the sidebar, the
  // timeline row unstacked, and a 11.5rem reserve that cleared nothing -- then the orbit was
  // capped against a budget of `viewport - constants`. Clean, so it is gone from here.
  // parallax-distance was 2 below the fold at 1440x900 and 6 at 1366 and 1280. Fixed
  // 2026-09-04: the stage is height-bounded with both schematics made height-driven, and
  // two of the strip's eight cards fold into the numbers they qualify. The remaining
  // overflow is the sidebar's own controls.
  "parallax-distance": { readoutsBelowFold: 0, sidebarOverflowPx: 920 },

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

  for (const slug of demoSlugsFromContent()) {
    test(`${slug} tells the reader when its sidebar has more below`, async ({ page }) => {
      /*
       * 4,205px of sidebar content was hidden across 11 demos with no visual signal at
       * all: macOS gives overlay scrollbars, so the panel looked finished and the rest was
       * simply gone. `initScrollAffordance` publishes the state as `data-scroll` and the
       * stylesheet fades that edge.
       *
       * The assertion is two-sided on purpose. A demo whose sidebar overflows must say so,
       * and one whose sidebar fits must say "none" -- an affordance that is always on
       * carries no information.
       */
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`play/${slug}/`, { waitUntil: "load" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      await page.waitForTimeout(600);

      const state = await page.evaluate(() => {
        const scroller = document.querySelector<HTMLElement>(
          ".cp-demo__controls .cp-panel-body, .cp-demo__sidebar .cp-panel-body"
        );
        if (!scroller) return null;
        return {
          overflows: scroller.scrollHeight - scroller.clientHeight > 1,
          scroll: scroller.dataset.scroll ?? "(unset)",
          masked: getComputedStyle(scroller).maskImage !== "none"
        };
      });
      test.skip(state === null, "no sidebar scroller");

      if (state!.overflows) {
        expect(state!.scroll, `${slug}: sidebar overflows but data-scroll is not set`).toBe(
          "bottom"
        );
        expect(state!.masked, `${slug}: overflowing sidebar has no fade`).toBe(true);
      } else {
        expect(state!.scroll, `${slug}: sidebar fits but claims there is more`).toBe("none");
        expect(state!.masked, `${slug}: sidebar fits but is faded anyway`).toBe(false);
      }
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
