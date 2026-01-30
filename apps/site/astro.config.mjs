import { defineConfig } from "astro/config";

const repoName = "cosmic-playground";
const githubOwner = "astrobytes-edu";

export default defineConfig({
  output: "static",
  site: `https://${githubOwner}.github.io/${repoName}/`,
  base: `/${repoName}/`
});
