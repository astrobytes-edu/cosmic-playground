import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function normalizeBasePath(value: string) {
  const trimmed = value.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

async function demoSlugsFromContent() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const siteRoot = path.resolve(here, "..");
  const demosDir = path.join(siteRoot, "src", "content", "demos");

  const entries = await fs.readdir(demosDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/, ""))
    .sort();
}

const basePath = normalizeBasePath(
  process.env.CP_BASE_PATH ?? "/cosmic-playground/"
);

test.describe("Cosmic Playground smoke", () => {
  test("Explore renders demo cards", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("explore/");
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
    expect(await page.locator(".demo-card").count()).toBeGreaterThan(0);
    expect(errors, `Console errors on ${basePath}explore/`).toEqual([]);
  });

  test("All /play/<slug>/ pages load the instrument root", async ({ page }) => {
    const slugs = await demoSlugsFromContent();
    expect(slugs.length).toBeGreaterThan(0);

    for (const slug of slugs) {
      const errors: string[] = [];
      page.removeAllListeners("pageerror");
      page.removeAllListeners("console");
      page.on("pageerror", (err) => errors.push(String(err)));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto(`play/${slug}/`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#cp-demo")).toBeVisible();
      expect(errors, `Console errors on ${basePath}play/${slug}/`).toEqual([]);
    }
  });
});
