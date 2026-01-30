import { defineConfig } from "astro/config";

const repoName = "cosmic-playground";
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  output: "static",
  // Replace `example` with your GitHub username when deploying as a project site.
  site: isProd ? `https://example.github.io/${repoName}/` : "http://localhost:4321/",
  base: isProd ? `/${repoName}/` : "/"
});
