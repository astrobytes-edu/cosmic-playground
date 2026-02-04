const SYNODIC_MONTH_DAYS = 29.53;

const PHASE_BINS = [
  { min: 0, max: 22.5, name: "Full Moon" },
  { min: 22.5, max: 67.5, name: "Waning Gibbous" },
  { min: 67.5, max: 112.5, name: "Third Quarter" },
  { min: 112.5, max: 157.5, name: "Waning Crescent" },
  { min: 157.5, max: 202.5, name: "New Moon" },
  { min: 202.5, max: 247.5, name: "Waxing Crescent" },
  { min: 247.5, max: 292.5, name: "First Quarter" },
  { min: 292.5, max: 337.5, name: "Waxing Gibbous" },
  { min: 337.5, max: 360, name: "Full Moon" }
];

function normalizeAngle(angleDeg: number): number {
  const a = angleDeg % 360;
  return a < 0 ? a + 360 : a;
}

export const MoonPhasesModel = {
  illuminationFractionFromPhaseAngleDeg(angleDeg: number): number {
    const radians = (angleDeg * Math.PI) / 180;
    return (1 + Math.cos(radians)) / 2;
  },

  phaseNameFromPhaseAngleDeg(angleDeg: number): string {
    const normalized = normalizeAngle(angleDeg);
    const match = PHASE_BINS.find((bin) => normalized >= bin.min && normalized < bin.max);
    return match ? match.name : "Full Moon";
  },

  phaseIndexFromPhaseAngleDeg(angleDeg: number): number {
    const normalized = normalizeAngle(angleDeg);
    return Math.round(normalized / 45) % 8;
  },

  daysSinceNewFromPhaseAngleDeg(angleDeg: number): number {
    const normalized = normalizeAngle(angleDeg);
    const daysFraction = ((normalized - 180 + 360) % 360) / 360;
    return daysFraction * SYNODIC_MONTH_DAYS;
  },

  waxingWaningFromPhaseAngleDeg(angleDeg: number): "Waxing" | "Waning" {
    const days = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(angleDeg);
    return days < SYNODIC_MONTH_DAYS / 2 ? "Waxing" : "Waning";
  },

  synodicMonthDays: SYNODIC_MONTH_DAYS
};
