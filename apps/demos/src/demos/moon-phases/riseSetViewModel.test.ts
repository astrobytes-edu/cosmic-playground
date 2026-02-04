import { describe, expect, test } from "vitest";
import { buildRiseSetViewModel } from "./riseSetViewModel";

const BASE = {
  phaseAngleDeg: 0,
  latitudeDeg: 0,
  dayOfYear: 80,
  useAdvanced: true
};

describe("buildRiseSetViewModel", () => {
  test("formats times and status for normal case", () => {
    const vm = buildRiseSetViewModel(BASE);
    expect(vm.riseText).toMatch(/\d{2}:\d{2}/);
    expect(vm.setText).toMatch(/\d{2}:\d{2}/);
    expect(vm.statusText).toBe("Local solar time");
    expect(vm.isPolar).toBe(false);
  });

  test("polar conditions show N/A + warning", () => {
    const vm = buildRiseSetViewModel({
      ...BASE,
      latitudeDeg: 80,
      dayOfYear: 172
    });
    expect(vm.riseText).toBe("N/A");
    expect(vm.setText).toBe("N/A");
    expect(vm.statusText).toMatch(/No rise\/set/);
    expect(vm.isPolar).toBe(true);
  });
});
