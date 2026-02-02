import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { validateInvariants } from "./validate-invariants.mjs";

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

describe("validateInvariants", () => {
  test("flags root-absolute links in Astro source", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    await writeFile(
      path.join(root, "apps/site/src/pages/index.astro"),
      `<a href="/explore/">Explore</a>\n`
    );

    const violations = await validateInvariants({ repoRoot: root });
    expect(violations.map((v) => v.code)).toContain("site:root-absolute-link");
  });

  test("flags root-absolute markdown links in content", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    await writeFile(
      path.join(root, "apps/site/src/content/demos/demo.md"),
      `See [Play](/play/demo/).\n`
    );

    const violations = await validateInvariants({ repoRoot: root });
    expect(violations.map((v) => v.code)).toContain("content:root-absolute-markdown-link");
  });

  test("flags import.meta.env.BASE_URL usage in demos source", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    await writeFile(
      path.join(root, "apps/demos/src/demos/demo/main.ts"),
      `const x = import.meta.env.BASE_URL;\nconsole.log(x);\n`
    );

    const violations = await validateInvariants({ repoRoot: root });
    expect(violations.map((v) => v.code)).toContain("demos:forbidden-base-url");
  });

  test("flags rgba/hsla color literals in app-layer styles", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    await writeFile(
      path.join(root, "apps/site/src/styles/global.css"),
      `.x { background: rgba(0,0,0,0.5); }\n.y { color: hsla(0, 0%, 100%, 0.7); }\n`
    );

    const violations = await validateInvariants({ repoRoot: root });
    expect(violations.map((v) => v.code)).toContain("apps:no-color-literals");
  });

  test("passes with no tracked source files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    const violations = await validateInvariants({ repoRoot: root });
    expect(violations).toEqual([]);
  });
});
