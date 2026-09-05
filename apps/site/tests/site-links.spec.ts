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

/**
 * Both tests in this file crawl the whole site, so they need a bigger budget than the 30s
 * default, which is sized for a test that touches one page.
 *
 * Measured 2026-09-04: the link-integrity crawl takes 4.0s and the reachability crawl 3.5s
 * on their own. In a full run they share a preview server with eight workers and ~130
 * concurrent tests, and the link crawl makes hundreds of sequential HTTP requests into that
 * contention -- it exceeded 30s and failed in two of three full runs while passing every
 * time in isolation. That is the flake STATUS.md recorded as unexplained.
 *
 * A generous ceiling rather than a tuned one: it still catches a genuine hang, and nothing
 * here should ever approach two minutes.
 */
const CRAWL_TIMEOUT_MS = 120_000;

test.describe("Site link integrity", () => {
  test("no internal link 404s anywhere reachable from the entry points", async ({
    page,
    request,
    baseURL
  }) => {
    test.setTimeout(CRAWL_TIMEOUT_MS);
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

/**
 * Reachability: every page the build emits must be findable by a human starting at "/".
 *
 * The /topics/* tree — index plus one page per topic — shipped for months with zero
 * inbound links. Nothing caught it, because Astro's file-based routing makes "this page
 * exists" and "you can get to this page" completely independent facts, and no test
 * asserted the second one. This closes that gap: it walks the real link graph from the
 * front door and diffs it against what `dist/` actually contains.
 *
 * Deliberate exceptions are declared in content, not here: a demo with `unlisted: true`
 * in its frontmatter is withheld from the catalogue on purpose, so its detail routes are
 * exempt. Re-listing the demo re-arms the assertion automatically.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every route the build emitted, as base-relative paths like "topics/orbits/". */
function builtRoutes(): string[] {
  const distDir = path.join(siteRoot, "dist");
  const routes: string[] = [];

  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        // _astro is build output; play/ holds the demo bundles, which are static
        // artifacts rather than Astro routes and are covered by their own specs.
        if (name === "_astro" || name === "play") continue;
        walk(full);
      } else if (name === "index.html") {
        const rel = path.relative(distDir, dir).split(path.sep).join("/");
        routes.push(rel === "" ? "" : `${rel}/`);
      }
    }
  };

  walk(distDir);
  return routes;
}

/** Slugs of demos withheld from the catalogue on purpose. */
function unlistedDemoSlugs(): string[] {
  const dir = path.join(siteRoot, "src", "content", "demos");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => /^unlisted:\s*true\s*$/m.test(readFileSync(path.join(dir, f), "utf8")))
    .map((f) => f.replace(/\.md$/, ""));
}

test.describe("Route reachability", () => {
  test("every built page is reachable by following links from the home page", async ({
    page,
    baseURL
  }) => {
    test.setTimeout(CRAWL_TIMEOUT_MS);
    const base = new URL(baseURL!);
    const reached = new Set<string>();
    const queue = [""];

    while (queue.length > 0) {
      const route = queue.shift()!;
      if (reached.has(route)) continue;
      reached.add(route);

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      if (!response || response.status() >= 400) continue;

      const hrefs = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href)
      );

      for (const href of hrefs) {
        const url = new URL(href);
        if (url.origin !== base.origin) continue;
        if (!url.pathname.startsWith(base.pathname)) continue;

        let rel = url.pathname.slice(base.pathname.length);
        if (rel.startsWith("/")) rel = rel.slice(1);
        if (!isCrawlable(url.pathname)) continue;
        // Only crawl directory-style routes; skip files like /rss.xml.
        if (rel !== "" && !rel.endsWith("/")) continue;
        if (!reached.has(rel)) queue.push(rel);
      }
    }

    const exemptPrefixes = unlistedDemoSlugs().flatMap((slug) => [
      `exhibits/${slug}/`,
      `stations/${slug}/`,
      `instructor/${slug}/`
    ]);

    const orphans = builtRoutes()
      .filter((route) => !reached.has(route))
      .filter((route) => !exemptPrefixes.includes(route))
      .sort();

    expect(
      orphans,
      `These pages are built but cannot be reached by following links from "/". ` +
        `Either link to them, or mark the owning demo \`unlisted: true\`.`
    ).toEqual([]);
  });
});
