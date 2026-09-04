import { expect, test } from "@playwright/test";

/**
 * Link integrity across the museum site.
 *
 * Every other spec in this suite drives an *instrument*. Nothing checked the site's own
 * navigation, which is how two 404s reached production while 768 E2E tests stayed green:
 *   - the homepage "Station Cards" link pointed at /stations/, which had no index page
 *   - explore's "Surprise me" handler rebuilt the URL without the GitHub Pages base path
 *
 * This crawls outward from "/" and asserts every internal link resolves.
 */

/** Routes to start the crawl from. Everything else is discovered by following links. */
const SEEDS = ["", "explore/", "playlists/", "for-instructors/", "about/"];

/** Demo instruments live in /play/ and are static bundles, not Astro routes. */
function isCrawlable(pathname: string): boolean {
  return !pathname.includes("/play/");
}

test.describe("Site link integrity", () => {
  test("no internal link 404s anywhere reachable from the entry points", async ({
    page,
    request,
    baseURL
  }) => {
    const base = new URL(baseURL!);
    const seen = new Set<string>();
    const queue = [...SEEDS];
    const checked = new Set<string>();
    const broken: string[] = [];

    while (queue.length > 0) {
      const route = queue.shift()!;
      if (seen.has(route)) continue;
      seen.add(route);

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `page ${route} did not load`).toBeLessThan(400);

      const hrefs = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href)
      );

      for (const href of hrefs) {
        const url = new URL(href);
        if (url.origin !== base.origin) continue; // external link, not ours to guarantee
        if (!url.pathname.startsWith(base.pathname)) {
          // Inside our origin but outside the configured base path: this is the
          // base-path bug class. Record it as broken rather than crawling it.
          broken.push(`${url.pathname} (missing base path, linked from /${route})`);
          continue;
        }

        const key = url.pathname;
        if (checked.has(key)) continue;
        checked.add(key);

        const res = await request.get(url.pathname);
        if (res.status() >= 400) {
          broken.push(`${url.pathname} -> ${res.status()} (linked from /${route})`);
          continue;
        }

        const relative = url.pathname.slice(base.pathname.length);
        if (isCrawlable(url.pathname) && !seen.has(relative)) queue.push(relative);
      }
    }

    expect(broken, `broken internal links:\n${broken.join("\n")}`).toEqual([]);
    // Guard against the crawl silently doing nothing.
    expect(checked.size).toBeGreaterThan(30);
  });

  test("Surprise me navigates within the configured base path", async ({ page, baseURL }) => {
    const base = new URL(baseURL!);
    await page.goto("explore/", { waitUntil: "domcontentloaded" });

    const surprise = page.locator("[data-all-slugs]");
    await expect(surprise).toBeVisible();
    await surprise.click();
    await page.waitForLoadState("domcontentloaded");

    const landed = new URL(page.url());
    expect(
      landed.pathname.startsWith(base.pathname),
      `Surprise me left the base path: ${landed.pathname}`
    ).toBe(true);
    expect(landed.pathname).toContain("/exhibits/");
    // A 404 page still resolves, so assert we actually landed on an exhibit.
    await expect(page.locator("h1")).toBeVisible();
  });
});
