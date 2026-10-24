import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Every control in a demo's shelf or drawer can be clicked once it is scrolled into view.
 *
 * The defect this exists to stop: the sidebar is sticky in the left column, and a sticky
 * grid item travels within the whole grid container, not its own rows, so when a reader
 * scrolls down to the shelf the sidebar slides over the shelf's left ~340px. Accordion
 * bodies were padded clear of it on 2026-09-04; tab rows never were. Measured 2026-10-23:
 * 13 shelf tabs in 5 demos at 1280x720 sat under a sidebar control, and eclipse-geometry's
 * Simulation tab stayed clickable only because Inter put its centre 5px right of the
 * sidebar's edge. The structural fix is to stop the overlap; until then this holds the line.
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

const CONTROLS = ["[role=tab]", "summary", "button", "input", "select", "textarea", "a[href]"]
  .flatMap((control) => [`.cp-demo__shelf ${control}`, `.cp-demo__drawer ${control}`])
  .join(", ");

test.describe("Shelf reach", () => {
  for (const slug of demoSlugsFromContent()) {
    test(`${slug}: shelf and drawer controls are not covered by the sidebar`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("eos-lab-toured", "1"));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`play/${slug}/`, { waitUntil: "load" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const covered: string[] = [];
      for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(size);
        for (const control of await page.locator(CONTROLS).all()) {
          if (!(await control.isVisible())) continue;
          await control.scrollIntoViewIfNeeded();
          const blocker = await control.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            if (!top || el.contains(top) || top.contains(el)) return null;
            const name = (el.getAttribute("aria-label") || el.textContent || el.id || el.tagName).trim().slice(0, 30);
            return `${name} under ${top.id ? `#${top.id}` : top.className || top.tagName}`;
          });
          if (blocker) covered.push(`${size.width}x${size.height} ${blocker}`);
        }
      }
      expect(covered, `${slug}: controls a reader cannot click`).toEqual([]);
    });
  }
});
