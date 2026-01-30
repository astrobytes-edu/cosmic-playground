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

  test("Pilot demo exports stable results text (binary-orbits)", async ({
    page
  }) => {
    await page.addInitScript(() => {
      (window as any).__cpLastClipboardText = null;
      const clipboard = (navigator as any).clipboard ?? {};
      (navigator as any).clipboard = clipboard;
      clipboard.writeText = async (text: string) => {
        (window as any).__cpLastClipboardText = text;
      };
    });

    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    await page.locator("#copyResults").click();
    await expect(page.locator("#status")).toContainText("Copied");

    const copied = await page.evaluate(() => (window as any).__cpLastClipboardText);
    expect(typeof copied).toBe("string");

    const text = String(copied);
    expect(text).toContain("Cosmic Playground");
    expect(text).toContain("(v1)");
    expect(text).toContain("Timestamp:");
    expect(text).toContain("\nParameters:\n");
    expect(text).toContain("\nReadouts:\n");

    const lines = text.split("\n");

    const parametersIndex = lines.findIndex((l) => l.trim() === "Parameters:");
    expect(parametersIndex).toBeGreaterThan(-1);
    const readoutsIndex = lines.findIndex((l) => l.trim() === "Readouts:");
    expect(readoutsIndex).toBeGreaterThan(-1);

    let parameterRows = 0;
    for (let i = parametersIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") break;
      if (line.startsWith("- ") && !line.includes("(none)")) parameterRows++;
    }
    expect(parameterRows).toBeGreaterThanOrEqual(1);

    let readoutRows = 0;
    for (let i = readoutsIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") break;
      if (line.startsWith("- ") && !line.includes("(none)")) readoutRows++;
    }
    expect(readoutRows).toBeGreaterThanOrEqual(2);
  });

  test("Pilot demo copy results is keyboard-activatable (binary-orbits)", async ({
    page
  }) => {
    await page.addInitScript(() => {
      (window as any).__cpLastClipboardText = null;
      const clipboard = (navigator as any).clipboard ?? {};
      (navigator as any).clipboard = clipboard;
      clipboard.writeText = async (text: string) => {
        (window as any).__cpLastClipboardText = text;
      };
    });

    await page.goto("play/binary-orbits/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#cp-demo")).toBeVisible();

    const copyButton = page.locator("#copyResults");
    await expect(copyButton).toBeVisible();

    for (let i = 0; i < 60; i++) {
      if (await copyButton.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(copyButton).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#status")).toContainText("Copied");

    const copied = await page.evaluate(() => (window as any).__cpLastClipboardText);
    expect(String(copied)).toContain("Timestamp:");
    expect(String(copied)).toContain("(v1)");
  });
});
