import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Demos render in the design system's fonts, not in whatever the reader has installed.
 *
 * The defect this exists to stop: the tokens name "Source Sans 3" and "Outfit", the site
 * pages load them, and the demos loaded neither, so every /play/ page fell through to the
 * reader's own fonts. Text metrics then depended on the machine. Measured 2026-10-23 on
 * conservation-laws at 1440x900, dock bottom: 880.9px with Inter (installed on one Mac),
 * 880.7px with SF, 915.5px with a wide font, and 914.7px on the Linux CI runner, which
 * failed the Pages deploy twice while every local run passed.
 *
 * A family with a declared @font-face must be loaded wherever it is the first choice.
 * `document.fonts.check()` cannot test this: it returns true when no face matches at all.
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

test.describe("Demo fonts", () => {
  for (const slug of demoSlugsFromContent()) {
    test(`${slug} renders its text in the design system's web fonts`, async ({ page }) => {
      await page.goto(`play/${slug}/`, { waitUntil: "load" });
      await expect(page.locator("#cp-demo")).toBeVisible();

      const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        const unquote = (name: string) => name.trim().replace(/^["']|["']$/g, "");
        const firstChoice = (el: Element) => unquote(getComputedStyle(el).fontFamily.split(",")[0]);
        const loaded = new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => unquote(f.family)));
        const declared = new Set([...document.fonts].map((f) => unquote(f.family)));
        const usedWebFamilies = new Set<string>();
        for (const el of document.querySelectorAll("#cp-demo, #cp-demo *")) {
          const family = firstChoice(el);
          if (declared.has(family) && !family.startsWith("KaTeX") && el.textContent?.trim()) usedWebFamilies.add(family);
        }
        return {
          body: firstChoice(document.body),
          loaded: [...loaded].sort(),
          notLoaded: [...usedWebFamilies].filter((family) => !loaded.has(family)).sort()
        };
      });

      expect(fonts.body, `${slug}: body text's first-choice family`).toBe("Source Sans 3");
      expect(fonts.loaded, `${slug}: web fonts loaded`).toContain("Source Sans 3");
      expect(fonts.notLoaded, `${slug}: first-choice web fonts that never loaded`).toEqual([]);
    });
  }
});
