import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Explore's filters have to be exercised through the URL and the controls, because the
 * thing that was broken is invisible to any check that only reads the built page.
 *
 * The site is `output: "static"`, so `Astro.url.searchParams` in page frontmatter is read
 * once at BUILD time with every parameter empty. Explore read all eight of its filter
 * axes there. The result was that the server returned byte-identical HTML for
 * `/explore/`, `/explore/?topic=Orbits` and every other combination: the filter form
 * navigated, the page reloaded, nothing changed, and the select snapped back to "All".
 * Filtering is now done in the browser, where the query string exists.
 *
 * Nothing in the suite could see this before. `site-links.spec.ts` checks that links
 * resolve, `reflow.spec.ts` checks layout at 320px, and neither asks whether a filter
 * changes what is on screen -- so the page shipped with its whole filter bar inert.
 */

/** The catalogue count is over distinct demos; a two-topic demo has a card per section. */
async function resultCount(page: Page): Promise<number> {
  return Number(await page.locator("[data-result-count]").innerText());
}

/** The unfiltered catalogue size, read from the page rather than hard-coded. */
async function totalCount(page: Page): Promise<number> {
  const cards = await page.locator("[data-topic-section] .demo-card").all();
  const slugs = await Promise.all(cards.map((c) => c.getAttribute("data-slug")));
  return new Set(slugs).size;
}

function visibleCards(page: Page) {
  return page.locator("[data-topic-section] .demo-card:visible");
}

test.describe("Explore filters", () => {
  test("a topic in the URL narrows the catalogue", async ({ page }) => {
    await page.goto("explore/", { waitUntil: "load" });
    const all = await resultCount(page);
    expect(all).toBeGreaterThan(5);

    await page.goto("explore/?topic=Orbits", { waitUntil: "load" });
    const orbits = await resultCount(page);

    expect(orbits).toBeGreaterThan(0);
    expect(orbits).toBeLessThan(all);
    await expect(visibleCards(page)).toHaveCount(orbits);
  });

  test("a topic filter shows only that topic's section", async ({ page }) => {
    // Several demos carry two topics, so their cards also live under the other heading.
    // Asking for Orbits and being shown an "Earth & Sky" section reads as a broken
    // filter even when every card under it does match.
    await page.goto("explore/?topic=Orbits", { waitUntil: "load" });
    const sections = page.locator("[data-topic-section]:visible");
    await expect(sections).toHaveCount(1);
    await expect(sections.first()).toHaveAttribute("data-topic-section", "Orbits");
  });

  test("choosing a topic filters in place and records it in the URL", async ({ page }) => {
    await page.goto("explore/", { waitUntil: "load" });
    const all = await resultCount(page);

    await page.selectOption("select[name='topic']", "Stars");

    await expect.poll(() => resultCount(page)).toBeLessThan(all);
    expect(new URL(page.url()).searchParams.get("topic")).toBe("Stars");
    // The control must also keep the choice; the prerendered version reset it to "All".
    await expect(page.locator("select[name='topic']")).toHaveValue("Stars");
  });

  test("a deep link restores every control, including the folded-away ones", async ({ page }) => {
    await page.goto("explore/?q=orbit&level=ASTR201&status=draft&math=no&sort=duration", {
      waitUntil: "load"
    });

    await expect(page.locator("input[name='q']")).toHaveValue("orbit");
    await expect(page.locator("select[name='level']")).toHaveValue("ASTR201");
    await expect(page.locator("select[name='status']")).toHaveValue("draft");
    await expect(page.locator("select[name='math']")).toHaveValue("no");
    await expect(page.locator("select[name='sort']")).toHaveValue("duration");
    // A filter arriving by URL must not stay hidden inside the <details>.
    await expect(page.locator(".filter-bar__details")).toHaveAttribute("open", "");
  });

  test("a course level counts demos tagged for both courses", async ({ page }) => {
    // `Both` means "suitable for either course". The select used to compare the raw tag,
    // so ASTR101 matched only demos literally tagged ASTR101 and hid every `Both` one --
    // while the ASTR 101 quick chip beside it used the union. Same words, different answer.
    await page.goto("explore/?level=ASTR101", { waitUntil: "load" });
    const viaSelect = await resultCount(page);

    await page.goto("explore/?quick=astr101", { waitUntil: "load" });
    const viaChip = await resultCount(page);

    expect(viaSelect).toBe(viaChip);
    expect(viaSelect).toBeGreaterThan(1);
  });

  test("an option that would match nothing says so and cannot be chosen", async ({ page }) => {
    await page.goto("explore/", { waitUntil: "load" });
    // Measured 2026-09-09: no demo runs longer than 16 minutes, so "20+ min" can only
    // ever produce an empty state. The count in the label spends the reader no clicks.
    const over20 = page.locator("select[name='time'] option[value='gt20']");
    await expect(over20).toHaveText(/\(0\)/);
    // `toBeDisabled` does not read <option disabled>, so assert the attribute itself.
    await expect(over20).toHaveAttribute("disabled", "");

    const under10 = page.locator("select[name='time'] option[value='lt10']");
    await expect(under10).toHaveText(/\([1-9][0-9]*\)/);
    expect(await under10.getAttribute("disabled")).toBeNull();
  });

  test("a search matching nothing shows the empty state, not a silent full list", async ({ page }) => {
    await page.goto("explore/?q=zzzznotademo", { waitUntil: "load" });
    expect(await resultCount(page)).toBe(0);
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.locator("[data-empty-state] h3")).toBeVisible();
  });

  test("a retired quick filter in a bookmarked URL is ignored, not shown", async ({ page }) => {
    // `?quick=labs` was a real link until 2026-09-09. Carrying it would render a chip with
    // no matching control, no label and no effect, so an unknown value is dropped on read.
    await page.goto("explore/?quick=labs", { waitUntil: "load" });

    expect(await resultCount(page)).toBe(await totalCount(page));
    await expect(page.locator("[data-filter-chips]")).toBeHidden();
    await expect(page.locator(".quick-filters .cp-chip")).toHaveCount(2);
  });

  test("removing a chip drops just that filter", async ({ page }) => {
    await page.goto("explore/?topic=Orbits&time=lt10", { waitUntil: "load" });
    const both = await resultCount(page);

    await page.locator("[data-remove-filter='time']").click();

    await expect.poll(() => resultCount(page)).toBeGreaterThan(both);
    const params = new URL(page.url()).searchParams;
    expect(params.get("topic")).toBe("Orbits");
    expect(params.get("time")).toBeNull();
  });

  test("the back button returns to the previous filter", async ({ page }) => {
    await page.goto("explore/", { waitUntil: "load" });
    const all = await resultCount(page);

    await page.selectOption("select[name='topic']", "Stars");
    await expect.poll(() => resultCount(page)).toBeLessThan(all);

    await page.goBack();

    await expect.poll(() => resultCount(page)).toBe(all);
    await expect(page.locator("select[name='topic']")).toHaveValue("");
  });

  test("the unfiltered view still leads with the featured strip and topic index", async ({ page }) => {
    await page.goto("explore/", { waitUntil: "load" });
    await expect(page.locator(".featured")).toBeVisible();
    await expect(page.locator(".topic-index")).toBeVisible();

    // Those three demos are shown by the strip, so their topic-section copies stay
    // hidden -- but filtering hides the strip, so the copies have to come back or the
    // featured demos would disappear from the catalogue entirely.
    const featuredSlug = await page
      .locator(".featured .demo-card")
      .first()
      .getAttribute("data-slug");
    expect(featuredSlug).toBeTruthy();

    await page.goto("explore/?topic=Orbits", { waitUntil: "load" });
    await expect(page.locator(".featured")).toBeHidden();
    await expect(
      page.locator(`[data-topic-section] .demo-card[data-slug='${featuredSlug}']`).first()
    ).toBeVisible();
  });
});
