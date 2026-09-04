import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const demosRoot = fileURLToPath(new URL("../demos/", import.meta.url));

const demoDirs = readdirSync(demosRoot)
  .filter((entry) => statSync(join(demosRoot, entry)).isDirectory())
  .sort();

function readDemoHtml(slug: string) {
  return readFileSync(join(demosRoot, slug, "index.html"), "utf8");
}

describe("demo HTML contracts", () => {
  test.each(demoDirs)("%s exposes exactly one readable page h1", (slug) => {
    const html = readDemoHtml(slug);
    const h1Matches = html.match(/<h1\b/gi) ?? [];

    expect(h1Matches, `${slug} should have exactly one h1`).toHaveLength(1);

    const h1Text = html
      .match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      ?.replace(/<[^>]*>/g, "")
      .trim();

    expect(h1Text, `${slug} h1 should have readable text`).toBeTruthy();
  });

  test.each(demoDirs)("%s exposes one labelled demo root", (slug) => {
    const html = readDemoHtml(slug);
    const demoRootMatches = html.match(/<[^>]+\bid="cp-demo"[^>]*>/gi) ?? [];

    expect(demoRootMatches, `${slug} should have exactly one #cp-demo root`).toHaveLength(1);
    expect(demoRootMatches[0], `${slug} #cp-demo should use .cp-demo`).toMatch(
      /\bclass="[^"]*\bcp-demo\b[^"]*"/i,
    );
    expect(demoRootMatches[0], `${slug} #cp-demo should have an aria-label`).toMatch(
      /\baria-label="[^"]+"/i,
    );
  });
});
