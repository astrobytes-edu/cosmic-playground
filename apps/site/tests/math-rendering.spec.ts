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

/**
 * Math on the museum pages -- exhibits, stations, instructor notes and the site pages.
 *
 * The block above only visits /play/. Measured 2026-09-10 across 69 museum routes (1,674
 * rendered KaTeX nodes), four pages put broken math in front of a reader, each through a
 * different path, and none of them was visible to any test:
 *
 *   /exhibits/binary-orbits/      single-quoted YAML keeps backslashes literal, so
 *                                 \\mathrm reached KaTeX as a line break plus "mathrm",
 *                                 rendering "mathrmAU" on the page that states the units
 *   /exhibits/telescope-resolution/  the same, as a visible red ParseError
 *   /exhibits/retrograde-motion/  "&lt;" typed into YAML, escaped again by the page,
 *                                 so KaTeX saw "&" -- a visible ParseError
 *   /instructor/parallax-distance/  Markdown read fill-in blanks inside $...$ as emphasis
 *                                 and deleted the subscripts around them
 *
 * So this checks three symptoms rather than any one cause: KaTeX parse errors, TeX a reader
 * can see outside rendered math, and TeX command names spelled out inside rendered math.
 */
const museumRoutes = [
  "", "explore/", "playlists/", "topics/", "for-instructors/", "instructor/", "about/", "glossary/", "welcome/",
  ...demoSlugsFromContent().flatMap((slug) => [`exhibits/${slug}/`, `stations/${slug}/`, `instructor/${slug}/`])
];

test.describe("Math on museum pages", () => {
  for (const route of museumRoutes) {
    test(`/${route} renders its math`, async ({ page }) => {
      await page.goto(route, { waitUntil: "load" });
      // KaTeX typesets on the museum pages client-side; give it the frame after load.
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));

      const found = await page.evaluate(() => {
        const errors = [...document.querySelectorAll(".katex-error")].map((el) =>
          (el.getAttribute("title") || el.textContent || "").replace(/\s+/g, " ").slice(0, 100)
        );
        const main = document.querySelector("main") || document.body;
        const clone = main.cloneNode(true) as HTMLElement;
        clone
          .querySelectorAll(".katex, .katex-display, script, style, code, pre, [aria-hidden='true']")
          .forEach((node) => {
            node.remove();
          });
        const text = (clone.textContent || "").replace(/\s+/g, " ");
        const leaked = [
          ...new Set(
            text.match(
              /\$[^$]{1,40}\$|\\(?:mathrm|frac|odot|sigma|lambda|theta|Delta|hat|rm|text|times|pi|mu|nu)\b|mathrm[A-Za-z]+/g
            ) ?? []
          )
        ].slice(0, 4);
        const swallowed = [...document.querySelectorAll(".katex-html")]
          .map((el) => el.textContent || "")
          .filter((t) => /mathrm|odot|frac/.test(t))
          .map((t) => t.slice(0, 60))
          .slice(0, 3);
        return { errors, leaked, swallowed };
      });

      expect(found.errors, `KaTeX parse errors on /${route}`).toEqual([]);
      expect(found.leaked, `TeX a reader can see outside rendered math on /${route}`).toEqual([]);
      expect(found.swallowed, `TeX command names spelled out inside rendered math on /${route}`).toEqual([]);
    });
  }
});
