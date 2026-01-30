import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

function getDemoSlugs(demosRoot: string): string[] {
  return readdirSync(demosRoot)
    .map((name) => ({ name, fullPath: path.join(demosRoot, name) }))
    .filter((entry) => statSync(entry.fullPath).isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function getHtmlInputs(demosRoot: string, slugs: string[]) {
  const inputs: Record<string, string> = {};
  for (const slug of slugs) {
    inputs[slug] = path.join(demosRoot, slug, "index.html");
  }
  return inputs;
}

export default defineConfig(() => {
  const projectRoot = path.dirname(fileURLToPath(import.meta.url));
  const demosRoot = path.join(projectRoot, "src", "demos");
  const slugs = getDemoSlugs(demosRoot);

  return {
    base: "./",
    root: demosRoot,
    build: {
      outDir: path.join(projectRoot, "dist"),
      emptyOutDir: true,
      rollupOptions: {
        input: getHtmlInputs(demosRoot, slugs)
      }
    }
  };
});
