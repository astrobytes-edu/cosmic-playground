import { describe, expect, test } from "vitest";
import { buildMoonPhasesExport } from "./exportPayload";

describe("buildMoonPhasesExport", () => {
  test("includes rise/set rows with units", () => {
    const payload = buildMoonPhasesExport({
      phaseAngleDeg: 0,
      latitudeDeg: 0,
      dayOfYear: 80,
      advancedEnabled: false
    });

    const readoutNames = payload.readouts.map((row) => row.name);
    expect(readoutNames).toContain("Moon rise time (local solar time)");
    expect(readoutNames).toContain("Moon set time (local solar time)");
  });
});
