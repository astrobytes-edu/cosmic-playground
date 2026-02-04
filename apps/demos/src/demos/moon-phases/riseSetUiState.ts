export const PRESET_DAY_OF_YEAR = {
  spring: 80,
  summer: 172,
  fall: 265,
  winter: 355
} as const;

export type RiseSetPreset = keyof typeof PRESET_DAY_OF_YEAR;

export function getAdvancedVisibility(enabled: boolean): boolean {
  return !enabled;
}

export function getSkyViewVisibility(enabled: boolean): boolean {
  return !enabled;
}

export function applyPresetDayOfYear(current: number, preset: RiseSetPreset): number {
  return PRESET_DAY_OF_YEAR[preset] ?? current;
}
