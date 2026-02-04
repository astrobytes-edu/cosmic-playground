import { moonRiseSetLocalTimeHours } from "@cosmic/physics";

type RiseSetViewModel = {
  riseText: string;
  setText: string;
  statusText: string;
  isPolar: boolean;
};

function formatClock(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) return "N/A";
  const totalMinutes = Math.round(hours * 60);
  const hh = Math.floor((totalMinutes / 60) % 24);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function buildRiseSetViewModel(params: {
  phaseAngleDeg: number;
  latitudeDeg: number;
  dayOfYear: number;
  useAdvanced: boolean;
}): RiseSetViewModel {
  const result = moonRiseSetLocalTimeHours(params);
  if (result.status !== "ok") {
    return {
      riseText: "N/A",
      setText: "N/A",
      statusText: "No rise/set at this latitude/season (polar day/night).",
      isPolar: true
    };
  }

  return {
    riseText: formatClock(result.riseHour),
    setText: formatClock(result.setHour),
    statusText: "Local solar time",
    isPolar: false
  };
}
