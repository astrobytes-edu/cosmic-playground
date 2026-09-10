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

  /*
   * Both polar cases exist and they are opposites, so the message has to name which one.
   * BASE is a FULL moon, which sits opposite the Sun: at 80 N in June it never clears the
   * horizon, and at the same latitude in December it never leaves it. The old assertion
   * matched "No rise/set" for either, which reads as the December case and is therefore
   * wrong half the time.
   */
  test("a full moon at high northern latitude never rises in June", () => {
    const vm = buildRiseSetViewModel({
      ...BASE,
      latitudeDeg: 80,
      dayOfYear: 172
    });
    expect(vm.riseText).toBe("N/A");
    expect(vm.setText).toBe("N/A");
    expect(vm.statusText).toMatch(/Never rises/);
    expect(vm.isPolar).toBe(true);
  });

  test("the same full moon never sets there in December", () => {
    const vm = buildRiseSetViewModel({
      ...BASE,
      latitudeDeg: 80,
      dayOfYear: 355
    });
    expect(vm.riseText).toBe("N/A");
    expect(vm.setText).toBe("N/A");
    expect(vm.statusText).toMatch(/Above the horizon all day/);
    expect(vm.isPolar).toBe(true);
  });
});
