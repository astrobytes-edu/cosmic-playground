import { defineConfig } from "@playwright/test";
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
  /* Platform-independent snapshots: strip the OS suffix so macOS and Linux
     share the same baseline files. The per-test maxDiffPixelRatio absorbs
     minor font-rendering differences between platforms. */
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}`
  },
  webServer: {
    command: `corepack pnpm preview --host 127.0.0.1 --port ${port}`,
    cwd: path.dirname(fileURLToPath(import.meta.url)),
    reuseExistingServer: !process.env.CI
  }
});
