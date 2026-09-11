import { expect, test } from "@playwright/test";

/**
 * The site header across the width where it hands off between the desktop nav and the
 * mobile menu.
 *
 * reflow.spec.ts checks 320px, which is the width WCAG 1.4.10 names -- but the header's
 * breakpoint sits far above that, and nothing looked there. Measured 2026-09-10 on the
 * homepage: the desktop nav appeared at 768px but needed 836px to sit on one line. So
 * from 768 to 835 "For Instructors" wrapped onto two lines and grew the sticky header,
 * and at 768 the nav ran 11px past the viewport and scrolled the page sideways.
 *
 * The handoff is written twice -- Layout.astro hides .desktop-nav and MobileNav.astro
 * shows .mobile-nav, each behind its own media query. If the two drift apart, some band
 * of widths shows both navs or neither, so this checks that exactly one is visible at
 * every width swept.
 *
 * One route is enough: the header comes from Layout.astro and is identical on every page.
 */

const WIDTHS = [640, 700, 767, 768, 800, 820, 834, 880, 899, 900, 960, 1024, 1280];

test.describe("Site header across the desktop/mobile nav handoff", () => {
  for (const width of WIDTHS) {
    test(`${width}px: one nav, nothing past the viewport, links on one line`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("", { waitUntil: "load" });
      // Link widths come from the webfont, so measure once it has actually loaded.
      await page.evaluate(() => document.fonts.ready);

      const r = await page.evaluate(() => {
        const shown = (selector: string) => {
          const el = document.querySelector<HTMLElement>(selector);
          if (!el) return false;
          const cs = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return cs.display !== "none" && cs.visibility !== "hidden" && box.width > 0;
        };

        const vw = document.documentElement.clientWidth;
        const describe = (el: Element) =>
          `${el.tagName.toLowerCase()}.${(el.className || "(no class)").toString()} right=${Math.round(el.getBoundingClientRect().right)}`;

        const header = document.querySelector(".site-header");
        const headerPastViewport = header
          ? [...header.querySelectorAll("*")]
              .filter((el) => {
                const box = el.getBoundingClientRect();
                return (box.width > 0 || box.height > 0) && box.right > vw + 0.5;
              })
              .map(describe)
          : ["(no .site-header)"];

        // A flex row stretches every link to the tallest one, so comparing heights cannot
        // tell a wrapped link from an unwrapped one. Count the line boxes of each link's
        // own text instead.
        const wrappedLinks = [...document.querySelectorAll<HTMLElement>(".desktop-nav a")]
          .filter((a) => {
            const range = document.createRange();
            range.selectNodeContents(a);
            const lineTops = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
            return lineTops.size > 1;
          })
          .map((a) => a.textContent?.trim() ?? "");

        return {
          desktopNav: shown(".desktop-nav"),
          mobileToggle: shown(".mobile-nav__toggle"),
          pageOverflow: document.documentElement.scrollWidth - vw,
          headerPastViewport,
          wrappedLinks
        };
      });

      expect(
        r.desktopNav !== r.mobileToggle,
        `exactly one nav should show (desktop=${r.desktopNav}, mobile toggle=${r.mobileToggle})`
      ).toBe(true);
      expect(r.headerPastViewport, "header content past the viewport").toEqual([]);
      expect(r.pageOverflow, `page scrolls sideways; header: ${r.headerPastViewport.join(", ")}`).toBe(0);
      if (r.desktopNav) {
        expect(r.wrappedLinks, "desktop nav links wrapped onto a second line").toEqual([]);
      }
    });
  }
});
