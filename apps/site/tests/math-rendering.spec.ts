import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Rendered math must survive the cascade.
 *
 * The defect this exists to stop: a symbol that renders as a DIFFERENT physical
 * quantity than the one it was authored as. Measured 2026-09-05 across the 20 demos,
 * 94 KaTeX nodes inherited `text-transform: uppercase` from a readout label and
 * rendered wrong -- frequency `\nu` as "N", parallax `\hat p` as P, concentration `c`
 * as C, time `t` as T, mean molecular weight `\mu` as M, specific angular momentum `h`
 * as H. In an astronomy instrument each of those uppercase forms is a real, different
 * quantity, so the labels were teaching the wrong symbol.
 *
 * It went unnoticed for the life of every demo because nothing could see it. The
 * design-contract tests read HTML and CSS as strings, and `text-transform` is a
 * rendering-time effect that never touches the DOM: `textContent` stayed correct
 * throughout, so every E2E assertion about readout text passed, and screen readers
 * always got the right symbol. Only sighted readers saw the wrong one.
 *
 * The transform reaches math purely by INHERITANCE -- the ~20 uppercase rules across
 * the theme and the demo stylesheets all target class-based ancestors, never `.katex`
 * itself. So this checks the computed value on the math, which is what a reader
 * actually sees, rather than any particular rule that might produce it.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const demosDir = path.resolve(here, "..", "src", "content", "demos");
const demoSourceDir = path.resolve(here, "..", "..", "demos", "src", "demos");

/**
 * Whether the demo authors any math at all. Measured 2026-09-05, 19 of the 20 do;
 * stars-zams-hr is the exception. Demos that do must actually render some, or a
 * KaTeX failure would turn this check into a vacuous pass.
 */
function authorsMath(slug: string): boolean {
  const source = path.join(demoSourceDir, slug, "index.html");
  return existsSync(source) && readFileSync(source, "utf8").includes("$");
}

function demoSlugsFromContent(): string[] {
  return readdirSync(demosDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/, ""))
    .sort();
}

test.describe("Math rendering", () => {
  for (const slug of demoSlugsFromContent()) {
    test(`${slug} renders math in the case it was written in`, async ({ page }) => {
      // Relative: baseURL already carries CP_BASE_PATH, and a leading slash drops it.
      await page.goto(`play/${slug}/`, { waitUntil: "load" });
      await expect(page.locator("#cp-demo")).toBeVisible();

      // KaTeX renders after load, so an empty result could otherwise mean "not yet"
      // rather than "nothing wrong".
      if (authorsMath(slug)) {
        await expect(page.locator(".katex").first()).toBeAttached();
      }

      const corrupted = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".katex")]
          .filter((node) => {
            const style = getComputedStyle(node);
            return style.textTransform !== "none" || style.fontVariantCaps === "small-caps";
          })
          .map((node) => {
            const style = getComputedStyle(node);
            return {
              tex: node.querySelector("annotation")?.textContent?.trim() ?? node.textContent?.trim() ?? "",
              textTransform: style.textTransform,
              fontVariantCaps: style.fontVariantCaps
            };
          })
      );

      expect(corrupted, `math re-cased by the cascade in ${slug}`).toEqual([]);
    });
  }
});
