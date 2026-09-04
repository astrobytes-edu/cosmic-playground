import { expect, test } from "@playwright/test";

/**
 * The topic tree and the "unlisted demo" state.
 *
 * Both of these are navigation-shaped, and site navigation is the part of this codebase
 * that had no test coverage at all — which is how /topics/* stayed unreachable for
 * months while the instrument suites stayed green.
 */

/** Demos per topic, after `eos-lab` was unlisted. Update deliberately, not reflexively. */
const TOPIC_EXHIBIT_COUNTS: Array<[string, string, number]> = [
  ["earthsky", "Earth & Sky", 6],
  ["orbits", "Orbits", 5],
  ["lightspectra", "Light & Spectra", 4],
  ["datainference", "Data & Inference", 3],
  ["stars", "Stars", 2],
  ["telescopes", "Telescopes", 1],
  ["galaxies", "Galaxies", 1],
  ["cosmology", "Cosmology", 1]
];

test.describe("Topic navigation", () => {
  test("Topics is in the primary nav and leads to the topic index", async ({ page }) => {
    await page.goto("");
    const link = page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Topics"
    });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByRole("heading", { level: 1, name: "Topics" })).toBeVisible();
  });

  test("the topic index lists every topic that has an exhibit", async ({ page }) => {
    await page.goto("topics/");
    const grid = page.locator(".topics-grid");
    await expect(grid.locator(".topic-card")).toHaveCount(TOPIC_EXHIBIT_COUNTS.length);

    for (const [, label] of TOPIC_EXHIBIT_COUNTS) {
      await expect(grid.getByRole("heading", { level: 2, name: label })).toBeVisible();
    }
  });

  for (const [slug, label, count] of TOPIC_EXHIBIT_COUNTS) {
    test(`the ${label} topic page lists its ${count} exhibit(s)`, async ({ page }) => {
      await page.goto(`topics/${slug}/`);
      await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
      await expect(page.locator(".topic-demos__grid .demo-card")).toHaveCount(count);
    });
  }

  test("a multi-demo topic shows a suggested sequence in the declared order", async ({
    page
  }) => {
    await page.goto("topics/orbits/");
    const items = page.locator(".topic-order__list li");
    await expect(items).toHaveCount(5);
    await expect(items.first()).toContainText("Kepler");
  });

  test("a single-demo topic shows no suggested sequence", async ({ page }) => {
    await page.goto("topics/telescopes/");
    // Ordering one item is not a sequence; the section should be absent entirely.
    await expect(page.locator(".topic-order")).toHaveCount(0);
  });

  test("topic pages and the explore listing link to each other", async ({ page }) => {
    await page.goto("topics/lightspectra/");
    await page.locator(".topic-demos__filter").click();
    await expect(page).toHaveURL(/explore\/\?topic=LightSpectra/);

    // The reverse link is the topic section heading on explore. It is NOT inside the
    // `?topic=` filtered view, because this site is `output: "static"` and the filter
    // never renders in production -- see STATUS.md, "explore filters are inert".
    const heading = page.locator("#topic-lightspectra .topic-section__title a");
    await expect(heading).toContainText("Light & Spectra");
    await heading.click();
    await expect(page).toHaveURL(/topics\/lightspectra\//);
  });

  test("topic badges are links and show the human label, not the enum key", async ({
    page
  }) => {
    await page.goto("exhibits/moon-phases/");
    const badge = page.getByRole("link", { name: "Browse the Earth & Sky topic" });
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("Earth & Sky");
    await badge.click();
    await expect(page.getByRole("heading", { level: 1, name: "Earth & Sky" })).toBeVisible();
  });

  test("the footer nav reaches the glossary", async ({ page }) => {
    await page.goto("");
    await page.getByRole("navigation", { name: "Footer" }).getByRole("link", {
      name: "Glossary"
    }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Glossary");
  });
});

test.describe("Unlisted demos", () => {
  test("eos-lab is absent from every catalogue listing", async ({ page }) => {
    for (const route of [
      "",
      "explore/",
      "topics/",
      "topics/stars/",
      "stations/",
      "for-instructors/",
      "instructor/"
    ]) {
      await page.goto(route);
      await expect(
        page.locator('a[href*="eos-lab"]'),
        `eos-lab is still linked from /${route}`
      ).toHaveCount(0);
    }
  });

  test("the eos-lab exhibit still resolves and says it is on hold", async ({ page }) => {
    const response = await page.goto("exhibits/eos-lab/");
    expect(response?.status()).toBeLessThan(400);
    const notice = page.getByRole("region", { name: "On hold" });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("not listed in the catalogue");
  });

  test("the eos-lab instrument itself still loads", async ({ page }) => {
    const response = await page.goto("play/eos-lab/");
    expect(response?.status()).toBeLessThan(400);
  });
});
