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

      const { scrollWidth, widest } = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        // Name the widest offending element so a failure is actionable rather than
        // just "the page is too wide".
        let widest = "";
        let widestRight = 0;
        for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          if (rect.right > widestRight) {
            widestRight = rect.right;
            widest = `${el.tagName.toLowerCase()}.${el.className || "(no class)"} right=${Math.round(rect.right)}`;
          }
        }
        return { scrollWidth: docWidth, widest };
      });

      expect(scrollWidth, `widest element: ${widest}`).toBeLessThanOrEqual(REFLOW_WIDTH);
    });
  }
});
