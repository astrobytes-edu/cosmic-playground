import { describe, expect, test } from "vitest";
import {
  PRESET_DAY_OF_YEAR,
  getAdvancedVisibility,
  getSkyViewVisibility,
  applyPresetDayOfYear
} from "./riseSetUiState";

describe("riseSetUiState", () => {
  test("presets map to expected day-of-year values", () => {
    expect(PRESET_DAY_OF_YEAR.spring).toBe(80);
    expect(PRESET_DAY_OF_YEAR.summer).toBe(172);
    expect(PRESET_DAY_OF_YEAR.fall).toBe(265);
    expect(PRESET_DAY_OF_YEAR.winter).toBe(355);
  });

  test("advanced toggle controls visibility flags", () => {
    expect(getAdvancedVisibility(true)).toBe(false);
    expect(getAdvancedVisibility(false)).toBe(true);
  });

  test("sky view toggle controls visibility flags", () => {
    expect(getSkyViewVisibility(true)).toBe(false);
    expect(getSkyViewVisibility(false)).toBe(true);
  });

  test("preset application updates day-of-year", () => {
    expect(applyPresetDayOfYear(10, "summer")).toBe(172);
    expect(applyPresetDayOfYear(200, "winter")).toBe(355);
  });
});
