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

  test("flags a demo whose starfield canvas is missing, exposed, undrawn or not first in #cp-demo", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    const demo = async (name, canvas, script = "main.ts", where = "first") => {
      const dir = path.join(root, "apps/demos/src/demos", name);
      const open = `<div id="cp-demo" class="cp-layer-instrument">`;
      const body = {
        first: `${open}\n  <!-- decorative -->\n  ${canvas}\n  <section class="cp-demo__stage"></section>\n</div>\n`,
        before: `${canvas}\n${open}\n</div>\n`,
        nested: `${open}\n  <section class="cp-demo__stage">\n    ${canvas}\n  </section>\n</div>\n`
      }[where];
      await writeFile(path.join(dir, "index.html"), body);
      await writeFile(path.join(dir, script), `initStarfield({ canvas });\n`);
    };
    await demo("good", `<canvas class="cp-starfield" aria-hidden="true"></canvas>`);
    await demo("no-canvas", `<canvas id="plot"></canvas>`);
    await demo("not-hidden", `<canvas class="cp-starfield"></canvas>`);
    // A call that only a test makes does not count.
    await demo("no-init", `<canvas aria-hidden="true" class="cp-starfield"></canvas>`, "main.test.ts");
    // Before the root, the opaque z-index:1 #cp-demo paints over the fixed canvas.
    await demo("outside-root", `<canvas class="cp-starfield" aria-hidden="true"></canvas>`, "main.ts", "before");
    // Inside a panel, the panel's fill-mode entry animation makes it a stacking context, so the
    // z-index:-1 canvas paints over that panel's background instead of behind it.
    await demo("in-panel", `<canvas class="cp-starfield" aria-hidden="true"></canvas>`, "main.ts", "nested");

    const violations = await validateInvariants({ repoRoot: root });
    const flagged = violations
      .filter((v) => v.code === "demos:starfield-missing")
      .map((v) => path.basename(path.dirname(v.file)))
      .sort();
    expect(flagged).toEqual(["in-panel", "no-canvas", "no-init", "not-hidden", "outside-root"]);
  });

  test("passes with no tracked source files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-inv-"));
    const violations = await validateInvariants({ repoRoot: root });
    expect(violations).toEqual([]);
  });
});
