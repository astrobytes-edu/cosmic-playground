import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { validateDatasets } from "./validate-datasets.mjs";

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

describe("validateDatasets", () => {
  test("passes when no data packages exist", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-data-"));
    const violations = await validateDatasets({ repoRoot: root });
    expect(violations).toEqual([]);
  });

  test("flags missing manifest.json", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-data-"));
    await writeFile(path.join(root, "packages/data-x/package.json"), JSON.stringify({ name: "@cosmic/data-x" }));
    await writeFile(path.join(root, "packages/data-x/src/index.ts"), "export const x = 1;\n");

    const violations = await validateDatasets({ repoRoot: root });
    expect(violations.join("\n")).toContain("missing manifest.json");
  });

  test("flags unit suffix mismatch when unitsPolicy requires it", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-data-"));
    await writeFile(path.join(root, "packages/data-x/package.json"), JSON.stringify({ name: "@cosmic/data-x" }));
    await writeFile(path.join(root, "packages/data-x/src/index.ts"), "export const foo = [];\nexport const fooMeta = {};\n");
    await writeFile(
      path.join(root, "packages/data-x/manifest.json"),
      JSON.stringify(
        {
          package: "@cosmic/data-x",
          manifestVersion: 1,
          datasets: [
            {
              id: "foo",
              title: "Foo",
              description: "Foo",
              exports: ["foo", "fooMeta"],
              unitsPolicy: "units-in-field-names",
              fields: [{ name: "parallax", type: "number", unit: "mas" }],
              provenance: { kind: "project-authored", notes: "x" },
              license: "UNSPECIFIED",
              version: 1
            }
          ]
        },
        null,
        2
      )
    );

    const violations = await validateDatasets({ repoRoot: root });
    expect(violations.join("\n")).toContain('should include unit suffix "Mas"');
  });
});

