import { describe, expect, test } from "vitest";
import { MoonPhasesModel } from "./moonPhasesModel";

describe("MoonPhasesModel", () => {
  test("illumination fraction matches key phases", () => {
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(0)).toBeCloseTo(1, 6);
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(180)).toBeCloseTo(0, 6);
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(90)).toBeCloseTo(0.5, 6);
    expect(MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(270)).toBeCloseTo(0.5, 6);
  });

  test("phase names follow legacy bins", () => {
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(0)).toBe("Full Moon");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(45)).toBe("Waning Gibbous");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(90)).toBe("Third Quarter");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(180)).toBe("New Moon");
    expect(MoonPhasesModel.phaseNameFromPhaseAngleDeg(270)).toBe("First Quarter");
  });

  test("days since new uses 29.53 d synodic month", () => {
    const daysAtNew = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(180);
    const daysAtFull = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(0);
    expect(daysAtNew).toBeCloseTo(0, 6);
    expect(daysAtFull).toBeCloseTo(29.53 / 2, 3);
  });

  test("waxing/waning flips after full", () => {
    expect(MoonPhasesModel.waxingWaningFromPhaseAngleDeg(180)).toBe("Waxing");
    expect(MoonPhasesModel.waxingWaningFromPhaseAngleDeg(0)).toBe("Waning");
  });

  test("phase index follows 45° bins", () => {
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(0)).toBe(0);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(45)).toBe(1);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(90)).toBe(2);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(135)).toBe(3);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(180)).toBe(4);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(225)).toBe(5);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(270)).toBe(6);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(315)).toBe(7);
    expect(MoonPhasesModel.phaseIndexFromPhaseAngleDeg(360)).toBe(0);
  });
});
