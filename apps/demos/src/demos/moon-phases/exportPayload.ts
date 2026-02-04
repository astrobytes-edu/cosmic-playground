import { MoonPhasesModel } from "@cosmic/physics";
import type { ExportPayloadV1 } from "@cosmic/runtime";
import { buildRiseSetViewModel } from "./riseSetViewModel";

type MoonPhasesExportParams = {
  phaseAngleDeg: number;
  latitudeDeg: number;
  dayOfYear: number;
  advancedEnabled: boolean;
};

function normalizeAngle(angleDeg: number): number {
  const a = angleDeg % 360;
  return a < 0 ? a + 360 : a;
}

function formatFraction(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(3);
}

function formatDay(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

export function buildMoonPhasesExport(params: MoonPhasesExportParams): ExportPayloadV1 {
  const normalized = normalizeAngle(params.phaseAngleDeg);
  const illum = MoonPhasesModel.illuminationFractionFromPhaseAngleDeg(normalized);
  const days = MoonPhasesModel.daysSinceNewFromPhaseAngleDeg(normalized);
  const riseSet = buildRiseSetViewModel({
    phaseAngleDeg: normalized,
    latitudeDeg: params.latitudeDeg,
    dayOfYear: params.dayOfYear,
    useAdvanced: params.advancedEnabled
  });

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    parameters: [
      { name: "Phase angle alpha (deg)", value: String(Math.round(normalized)) },
      { name: "Latitude (deg)", value: String(Math.round(params.latitudeDeg)) },
      { name: "Day of year (1-365)", value: String(Math.round(params.dayOfYear)) }
    ],
    readouts: [
      { name: "Phase name", value: MoonPhasesModel.phaseNameFromPhaseAngleDeg(normalized) },
      { name: "Illumination fraction f", value: formatFraction(illum) },
      { name: "Illuminated (%)", value: String(Math.round(illum * 100)) },
      { name: "Days since new (d)", value: formatDay(days) },
      { name: "Waxing/Waning", value: MoonPhasesModel.waxingWaningFromPhaseAngleDeg(normalized) },
      { name: "Moon rise time (local solar time)", value: riseSet.riseText },
      { name: "Moon set time (local solar time)", value: riseSet.setText },
      { name: "Rise/set status", value: riseSet.statusText }
    ],
    notes: [
      "Illumination uses f = (1 + cos alpha) / 2 with alpha in degrees.",
      "This is a geometric model (not to scale, no orbital tilt).",
      params.advancedEnabled
        ? "Rise/set estimates use latitude + day of year."
        : "Rise/set estimates use an equinox reference when Advanced is off."
    ]
  };
}
