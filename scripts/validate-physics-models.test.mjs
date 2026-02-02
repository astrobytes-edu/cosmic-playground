import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { validatePhysicsModels } from "./validate-physics-models.mjs";

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

describe("validatePhysicsModels", () => {
  test("passes when no physics package exists", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-phys-"));
    const violations = await validatePhysicsModels({ repoRoot: root });
    expect(violations).toEqual([]);
  });

  test("flags missing test file and missing export", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-phys-"));
    await writeFile(path.join(root, "packages/physics/src/index.ts"), "export {};\n");
    await writeFile(
      path.join(root, "packages/physics/src/exampleModel.ts"),
      `/** ExampleModel */\nexport const ExampleModel = {};\n`
    );

    const violations = await validatePhysicsModels({ repoRoot: root });
    expect(violations.join("\n")).toContain("missing required test file");
    expect(violations.join("\n")).toContain("missing export for ExampleModel");
  });
});
