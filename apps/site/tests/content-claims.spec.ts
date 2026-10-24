import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/**
 * Public claims the site makes about its own demos must be derived from, or checked
 * against, the demos. Two of them were asserted and wrong:
 *   - `content_verified: true` on demos with an open confirmed P0 (red-team audit S6)
 *   - /about/ saying every demo has Station, Challenge and Export (it is 17/19, 9/19, 19/19)
 */

const here = dirname(fileURLToPath(import.meta.url));
const demosDir = join(here, "../src/content/demos");

interface Front {
  slug: string;
  verified: boolean;
  unlisted: boolean;
  modes: string[];
}

function frontmatter(): Front[] {
  return readdirSync(demosDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const text = readFileSync(join(demosDir, f), "utf8");
      const modes = /^modes:\s*\[(.*)\]\s*$/m.exec(text)?.[1] ?? "";
      return {
        slug: f.replace(/\.md$/, ""),
        verified: /^content_verified:\s*true\s*$/m.test(text),
        unlisted: /^unlisted:\s*true\s*$/m.test(text),
        modes: modes.split(",").map((m) => m.trim()).filter(Boolean)
      };
    });
}

const demos = frontmatter();
const unverified = demos.find((d) => !d.verified && d.modes.includes("station"));
const verified = demos.find((d) => d.verified && d.modes.includes("station"));

test.describe("content_verified is shown truthfully", () => {
  test("fixture demos exist", () => {
    expect(unverified).toBeTruthy();
    expect(verified).toBeTruthy();
  });

  for (const route of ["exhibits", "stations", "instructor"] as const) {
    test(`/${route}/ of an unverified demo says it is still in development`, async ({ page }) => {
      await page.goto(`${route}/${unverified?.slug}/`);
      const callout = page.getByRole("region", { name: "Content verification status" });
      await expect(callout).toBeVisible();
      await expect(callout).toContainText("Still in development");
      await expect(callout).not.toContainText(/legacy/i);
    });

    test(`/${route}/ of a verified demo shows no verification callout`, async ({ page }) => {
      await page.goto(`${route}/${verified?.slug}/`);
      await expect(page.getByRole("region", { name: "Content verification status" })).toHaveCount(0);
    });
  }
});

test.describe("/about/ states the modes the demos actually offer", () => {
  const listed = demos.filter((d) => !d.unlisted);
  const count = (mode: string) => listed.filter((d) => d.modes.includes(mode)).length;

  test("the stat tile reports derived counts, not '3 modes per demo'", async ({ page }) => {
    await page.goto("about/");
    const stats = page.locator(".stat-bar");
    await expect(stats).not.toContainText("modes per demo");
    await expect(stats).toContainText(
      `Station Mode on ${count("station")} of ${listed.length}`
    );
    await expect(stats).toContainText(
      `Challenge Mode on ${count("challenge")} of ${listed.length}`
    );
  });

  test("the prose does not say every demo has Station or Challenge Mode", async ({ page }) => {
    await page.goto("about/");
    const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    expect(text).not.toMatch(/Each demo ships with Station Mode/);
    expect(text).not.toMatch(/Every demo includes a Station Mode/);
    // "Every demo exports its data" is allowed only while it is true.
    if (/Every demo exports/.test(text)) {
      expect(listed.every((d) => d.modes.includes("export"))).toBe(true);
    }
  });
});
