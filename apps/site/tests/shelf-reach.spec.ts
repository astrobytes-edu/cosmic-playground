import { test, expect, type Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Every control in a demo's shelf or drawer can be clicked once it is scrolled into view,
 * and the sticky sidebar never covers another region of the shell.
 *
 * The defect this exists to stop: a sticky grid item travels within the whole grid
 * container, not its own rows, so a sidebar sticky in the left column slid over the
 * full-width shelf's left ~340px when a reader scrolled down to it. Measured 2026-10-23:
 * 13 shelf tabs in 5 demos at 1280x720 sat under a sidebar control. Padding the shelf
 * clear of it was the stopgap; the fix gives the sidebar its whole column, shelf row
 * included, so it has nothing to slide over. The footprint test checks that geometry
 * directly, prose included, which hit-testing controls alone cannot.
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

/** Every shell region the sidebar could be pinned over, besides itself. */
const REGIONS = [
  ".cp-demo__stage",
  ".cp-demo__readouts",
  ".cp-playbar",
  ".cp-context-message",
  ".cp-demo__shelf",
  ".cp-demo__drawer"
].join(", ");

const SIZES = [{ width: 1280, height: 720 }, { width: 1440, height: 900 }];

async function openDemo(page: Page, slug: string) {
  await page.addInitScript(() => localStorage.setItem("eos-lab-toured", "1"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`play/${slug}/`, { waitUntil: "load" });
  await expect(page.locator("#cp-demo")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Sidebar footprint", () => {
  for (const slug of demoSlugsFromContent()) {
    test(`${slug}: the sticky sidebar never covers another region`, async ({ page }) => {
      await openDemo(page, slug);

      const overlaps: string[] = [];
      for (const size of SIZES) {
        await page.setViewportSize(size);
        const found = await page.evaluate((regions) => {
          const sidebar = document.querySelector<HTMLElement>(".cp-demo__controls, .cp-demo__sidebar");
          if (!sidebar || getComputedStyle(sidebar).position !== "sticky") return [];
          const others = [...document.querySelectorAll<HTMLElement>(regions)].filter(
            (el) => !el.contains(sidebar) && !sidebar.contains(el)
          );
          const first = new Map<string, string>();
          const maxY = document.documentElement.scrollHeight - innerHeight;
          for (let y = 0; ; y = Math.min(maxY, y + 100)) {
            scrollTo({ top: y, behavior: "instant" });
            const s = sidebar.getBoundingClientRect();
            for (const el of others) {
              const b = el.getBoundingClientRect();
              const w = Math.min(s.right, b.right) - Math.max(s.left, b.left);
              const h = Math.min(s.bottom, b.bottom) - Math.max(s.top, b.top);
              const name = el.className.split(" ")[0];
              if (w > 1 && h > 1 && !first.has(name)) {
                first.set(name, `over ${name}, ${Math.round(w)}x${Math.round(h)}px at scrollY=${y}`);
              }
            }
            if (y >= maxY) break;
          }
          scrollTo({ top: 0, behavior: "instant" });
          return [...first.values()];
        }, REGIONS);
        overlaps.push(...found.map((line) => `${size.width}x${size.height} sidebar ${line}`));
      }
      expect(overlaps, `${slug}: regions the pinned sidebar covers`).toEqual([]);
    });
  }
});

test.describe("Shelf reach", () => {
  for (const slug of demoSlugsFromContent()) {
    test(`${slug}: shelf and drawer controls are not covered by the sidebar`, async ({ page }) => {
      await openDemo(page, slug);

      const covered: string[] = [];
      for (const size of SIZES) {
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
