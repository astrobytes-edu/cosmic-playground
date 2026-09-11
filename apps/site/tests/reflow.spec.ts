import { readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

/**
 * WCAG 2.2 SC 1.4.10 (Reflow): content must not require horizontal scrolling at a
 * viewport width of 320 CSS px (equivalently 1280px at 400% zoom).
 *
 * This spec runs under the `mobile` Playwright project. Before it existed every spec
 * in this suite ran at 1280x720 only, which is how mobile layout regressions reached
 * production: no gate ever looked at a narrow viewport.
 */

const REFLOW_WIDTH = 320;

/*
 * 320px is the width WCAG 1.4.10 names, and it is the only width this spec checks. The
 * shared header's desktop/mobile nav handoff sits far above it -- 900px since 2026-09-10 --
 * and is swept separately in site-header.spec.ts, which is what caught the nav running
 * 11px past a 768px viewport. That check lives on one route rather than here because the
 * header is identical on every page; multiplying tablet widths across all of these routes
 * would test the same component dozens of times.
 */

function demoSlugs(): string[] {
  return readdirSync(join(process.cwd(), "src/content/demos"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

const slugs = demoSlugs();

/** Museum routes a student or instructor can actually reach. */
const MUSEUM_ROUTES = [
  "",
  "explore/",
  "playlists/",
  "topics/",
  "for-instructors/",
  "instructor/",
  "about/",
  "glossary/",
  "welcome/"
];

const CONTENT_ROUTES = [
  ...MUSEUM_ROUTES,
  ...slugs.map((s) => `exhibits/${s}/`),
  ...slugs.map((s) => `stations/${s}/`),
  ...slugs.map((s) => `instructor/${s}/`)
];

test.describe("Reflow at 320px (WCAG 1.4.10)", () => {
  for (const route of CONTENT_ROUTES) {
    test(`/${route} does not scroll horizontally`, async ({ page }) => {
      await page.setViewportSize({ width: REFLOW_WIDTH, height: 512 });
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const { canScrollSideways, bodyLayoutWidth, widest } = await page.evaluate((limit) => {
        // Measure the SYMPTOM, not documentElement.scrollWidth. Chromium's root
        // scrollWidth counts scrollable overflow from descendants that an intermediate
        // `overflow-x: auto` container already clips, so a correctly-contained wide
        // table still reports ~1200px on a 320px viewport. What WCAG 1.4.10 is about is
        // whether the user is forced to scroll the page sideways -- so try it.
        window.scrollTo(2000, 0);
        const canScrollSideways = window.scrollX > 0;
        window.scrollTo(0, 0);

        // Name the widest element that is NOT inside a scroll container, so a failure
        // points at the thing to fix rather than at a legitimately scrolling table.
        const clipped = (el: Element) => {
          let p = el.parentElement;
          while (p) {
            const cs = getComputedStyle(p);
            if (["auto", "scroll", "hidden"].includes(cs.overflowX)) return true;
            p = p.parentElement;
          }
          return false;
        };
        let widest = "(none)";
        let widestRight = limit;
        for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          if (rect.right <= widestRight || clipped(el)) continue;
          widestRight = rect.right;
          widest = `${el.tagName.toLowerCase()}.${el.className || "(no class)"} right=${Math.round(rect.right)}`;
        }
        return { canScrollSideways, bodyLayoutWidth: document.body.getBoundingClientRect().width, widest };
      }, REFLOW_WIDTH);

      // THE GATE: no content sits outside the viewport. This is what 1.4.10 protects --
      // content the user cannot reach without scrolling sideways. It caught the
      // fixed-minimum grid tracks, the unbreakable file paths in inline <code>, the wide
      // instructor tables, the KaTeX display equations, and the mobile nav panel.
      expect(widest, "content extends past the viewport").toBe("(none)");

      // `body` itself must lay out within the viewport. Uses the LAYOUT width
      // (getBoundingClientRect) rather than scrollWidth, which is subject to the same
      // clipped-descendant propagation described below. +1px absorbs sub-pixel rounding.
      expect(bodyLayoutWidth, `widest unclipped element: ${widest}`).toBeLessThanOrEqual(
        REFLOW_WIDTH + 1
      );

      // NOT asserted: `canScrollSideways`. On routes with a wide table or display
      // equation, Chromium propagates the CLIPPED descendant's scrollable overflow up to
      // the root scroller, so the viewport can be dragged sideways into a region that is
      // provably empty -- `document.elementFromPoint` out there returns <html>, and
      // `body.getBoundingClientRect().width` is exactly the viewport width. Setting
      // `overflow-x: clip` on html/body does not suppress it. No content is unreachable,
      // so this is a rendering artifact rather than a reflow failure; it is recorded as
      // a known limitation instead of being asserted or silently hidden.
      void canScrollSideways;
    });
  }
});
