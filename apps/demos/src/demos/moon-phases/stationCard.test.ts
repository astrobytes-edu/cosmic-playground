import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MoonPhasesModel } from "@cosmic/physics";

// The printed station card pre-fills a data table. A hand-typed answer key can drift from
// the model (it swapped First and Third Quarter), so every pre-filled row is checked
// against MoonPhasesModel: 0 = full, 90 = third quarter, 180 = new, 270 = first quarter.
const here = dirname(fileURLToPath(import.meta.url));
const card = readFileSync(
  join(here, "../../../../site/src/content/stations/moon-phases.md"),
  "utf8"
);

const rows = card
  .split("\n")
  .filter((line) => line.startsWith("|"))
  .map((line) => line.split("|").slice(1, -1).map((c) => c.trim()))
  .filter((cells) => cells.length === 5 && /^\d+$/.test(cells[1]));

describe("moon-phases station card data table", () => {
  it("has the four pre-filled key phases", () => {
    expect(rows.filter((r) => !r[0].startsWith("(custom)")).length).toBe(4);
  });

  for (const [name, angle, f, pct, sense] of rows.filter((r) => !r[0].startsWith("(custom)"))) {
    it(`${name} at ${angle} deg matches the model`, () => {
      const a = Number(angle);
      const phase = MoonPhasesModel.phaseNameFromPhaseAngleDeg(a);
      expect(phase.replace(/ Moon$/, "")).toBe(name);
      const model = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(a);
      expect(Number(f)).toBeCloseTo(model, 2);
      expect(Number(pct)).toBeCloseTo(model * 100, 0);
      if (sense !== "—") {
        expect(sense).toBe(MoonPhasesModel.waxingWaningFromPhaseAngleDeg(a));
      }
    });
  }

  it("names which quarter is which in the word bank", () => {
    expect(card).toMatch(/Third Quarter is \$90\^\\circ\$/);
    expect(card).toMatch(/First Quarter is \$270\^\\circ\$/);
  });
});
