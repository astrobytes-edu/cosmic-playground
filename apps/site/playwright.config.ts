import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

function normalizeBasePath(value: string) {
  const trimmed = value.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

const basePath = normalizeBasePath(
  process.env.CP_BASE_PATH && process.env.CP_BASE_PATH.trim().length > 0
    ? process.env.CP_BASE_PATH
    : "/cosmic-playground/"
);
const port = Number(process.env.PLAYWRIGHT_PORT ?? "4321");

export default defineConfig({
  testDir: "./tests",
  // A stray `test.only` used to be able to silently green the whole suite in CI.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}`,
    // Without this a CI failure left no artifact to diagnose from.
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
      grepInvert: /@visual/
    },
    {
      // Every spec previously ran at 1280x720 only, which is why mobile layout
      // regressions shipped. This project runs the reflow/layout gates at phone width.
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 512 } },
      testMatch: /reflow\.spec\.ts/
    },
    {
      // Visual baselines are platform-specific (Playwright appends the OS to the
      // snapshot name). Only darwin baselines exist, so running these on the Linux
      // CI runner fails deterministically — that is what broke the nightly job every
      // night from 2026-03-11. They stay runnable where baselines exist:
      //   corepack pnpm -C apps/site test:e2e:visual
      // To restore CI coverage, regenerate baselines on Linux (e.g. via the
      // mcr.microsoft.com/playwright container) and drop the grep exclusion above.
      name: "visual",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
      grep: /@visual/
    }
  ],
  webServer: {
    command: `corepack pnpm preview --host 127.0.0.1 --port ${port}`,
    cwd: path.dirname(fileURLToPath(import.meta.url)),
    reuseExistingServer: !process.env.CI
  }
});
