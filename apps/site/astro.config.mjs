import { defineConfig } from "astro/config";

import rehypeScrollableTables from "./src/lib/rehypeScrollableTables.mjs";

const repoName = "cosmic-playground";
const githubOwner = "astrobytes-edu";

export default defineConfig({
  output: "static",
  site: `https://${githubOwner}.github.io/${repoName}/`,
  base: `/${repoName}/`,
  markdown: {
    // Wide instructor/station tables must scroll inside themselves, not scroll the page.
    rehypePlugins: [rehypeScrollableTables]
  }
});
