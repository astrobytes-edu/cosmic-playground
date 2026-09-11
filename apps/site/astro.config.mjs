import { defineConfig } from "astro/config";

import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeScrollableTables from "./src/lib/rehypeScrollableTables.mjs";

const repoName = "cosmic-playground";
const githubOwner = "astrobytes-edu";

export default defineConfig({
  output: "static",
  site: `https://${githubOwner}.github.io/${repoName}/`,
  base: `/${repoName}/`,
  markdown: {
    /*
     * Math is parsed as math BEFORE Markdown sees it, then typeset at build time.
     *
     * Without remark-math, Markdown processed the text inside $...$ like any other prose
     * and a client-side KaTeX pass typeset whatever was left. Measured 2026-09-10: of the
     * 74 Markdown math spans containing a backslash before punctuation, 0 reached the built
     * page intact, across 26 files -- every thin space "\," became a bare comma, and in
     * display blocks "_B-\mathbf{r}_A" became an <em> element that split the equation so it
     * never rendered at all. A client renderer cannot restore a backslash Markdown has
     * already removed, so the fix has to sit in this pipeline.
     *
     * 96 spans had been written with doubled backslashes to survive that stripping; they
     * were normalized to plain TeX in the same change, because remark-math passes TeX
     * through verbatim and would otherwise hand KaTeX "\\rm".
     */
    remarkPlugins: [remarkMath],
    // Wide instructor/station tables must scroll inside themselves, not scroll the page.
    rehypePlugins: [rehypeKatex, rehypeScrollableTables]
  }
});
