import { test, expect } from "@playwright/test";

// All 14 demos in the Cosmic Playground suite
const DEMOS = [
  "angular-size",
  "binary-orbits",
  "blackbody-radiation",
  "conservation-laws",
  "eclipse-geometry",
  "em-spectrum",
  "eos-lab",
  "keplers-laws",
  "moon-phases",
  "parallax-distance",
  "planetary-conjunctions",
  "retrograde-motion",
  "seasons",
  "telescope-resolution",
];

// ---------------------------------------------------------------------------
// Cross-demo structural accessibility audit
// ---------------------------------------------------------------------------

test.describe("Cross-demo accessibility audit", () => {
  for (const slug of DEMOS) {
    test.describe(slug, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`play/${slug}/`, { waitUntil: "domcontentloaded" });
        await expect(page.locator("#cp-demo")).toBeVisible();
      });

      test(`${slug}: root has aria-label`, async ({ page }) => {
        const label = await page.locator("#cp-demo").getAttribute("aria-label");
        expect(label).toBeTruthy();
        expect(label!.length).toBeGreaterThan(3);
      });

      test(`${slug}: status region has role=status and aria-live`, async ({ page }) => {
        const status = page.locator("#status");
        await expect(status).toBeAttached();
        await expect(status).toHaveAttribute("role", "status");
        await expect(status).toHaveAttribute("aria-live", "polite");
      });

      test(`${slug}: starfield canvas is aria-hidden`, async ({ page }) => {
        const canvas = page.locator("canvas.cp-starfield");
        await expect(canvas).toHaveAttribute("aria-hidden", "true");
      });

      test(`${slug}: utility toolbar has role=toolbar`, async ({ page }) => {
        const toolbar = page.locator(".cp-utility-toolbar");
        await expect(toolbar).toHaveAttribute("role", "toolbar");
      });

      test(`${slug}: all utility buttons have aria-labels`, async ({ page }) => {
        const buttons = page.locator(".cp-utility-toolbar .cp-utility-btn");
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          const label = await buttons.nth(i).getAttribute("aria-label");
          expect(label, `utility button ${i} in ${slug}`).toBeTruthy();
        }
      });

      test(`${slug}: readout units in separate spans`, async ({ page }) => {
        const units = page.locator(".cp-readout__unit");
        const count = await units.count();
        expect(count, `${slug} should have readout unit spans`).toBeGreaterThanOrEqual(1);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Reduced-motion respect (animated demos only)
// ---------------------------------------------------------------------------

// Demos with animation play buttons that must be disabled under reduced motion
const ANIMATED_DEMOS: { slug: string; playSelector: string }[] = [
  { slug: "conservation-laws", playSelector: "#play" },
  { slug: "keplers-laws", playSelector: "#play" },
  { slug: "moon-phases", playSelector: "#btn-play" },
  { slug: "retrograde-motion", playSelector: "#btn-play" },
  { slug: "eclipse-geometry", playSelector: "#animateMonth" },
];

test.describe("Reduced motion respect", () => {
  for (const { slug, playSelector } of ANIMATED_DEMOS) {
    test(`${slug}: play button disabled under prefers-reduced-motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`play/${slug}/`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      await expect(page.locator(playSelector)).toBeDisabled({ timeout: 5000 });
    });
  }
});
