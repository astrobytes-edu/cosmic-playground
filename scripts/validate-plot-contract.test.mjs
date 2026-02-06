import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { validatePlotContract } from "./validate-plot-contract.mjs";

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

describe("validatePlotContract", () => {
  test("flags direct Plotly imports outside runtime plots", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-plot-contract-"));
    await writeFile(
      path.join(root, "apps/demos/src/demos/demo/main.ts"),
      `import Plotly from "plotly.js-dist-min";\nPlotly.newPlot("x", [], {});\n`
    );

    const violations = await validatePlotContract({ repoRoot: root });
    expect(violations.join("\n")).toContain("direct Plotly imports are forbidden");
    expect(violations.join("\n")).toContain("direct Plotly calls are forbidden");
  });

  test("flags mountPlot usage without axis labels", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-plot-contract-"));
    await writeFile(
      path.join(root, "apps/demos/src/demos/demo/main.ts"),
      `
      import { mountPlot } from "@cosmic/runtime";
      const spec = {
        id: "demo-plot",
        axes: { x: {}, y: {} },
        init: () => ({ traces: [] }),
        update: () => ({})
      };
      mountPlot(document.createElement("div"), spec, {});
      `
    );

    const violations = await validatePlotContract({ repoRoot: root });
    expect(violations.join("\n")).toContain(
      "mountPlot usage requires PlotSpec axes metadata with x/y labels"
    );
  });

  test("passes for runtime-only Plotly + complete PlotSpec metadata", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "cp-plot-contract-"));
    await writeFile(
      path.join(root, "packages/runtime/src/plots/plotEngine.ts"),
      `import Plotly from "plotly.js-dist-min";\nPlotly.react("x", [], {});\n`
    );
    await writeFile(
      path.join(root, "apps/demos/src/demos/demo/main.ts"),
      `
      import { mountPlot } from "@cosmic/runtime";
      const spec = {
        id: "demo-plot",
        axes: {
          x: { label: "Density rho" },
          y: { label: "Pressure P" }
        },
        init: () => ({ traces: [] }),
        update: () => ({})
      };
      mountPlot(document.createElement("div"), spec, {});
      `
    );

    const violations = await validatePlotContract({ repoRoot: root });
    expect(violations).toEqual([]);
  });
});
