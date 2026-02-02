import { copyTextToClipboard } from "./clipboard";
import { initDemoPolish } from "./polish";

export const PACKAGE_NAME = "@cosmic/runtime";

export type Mode = "concept" | "math";

export type ExportRow = {
  name: string;
  value: string;
  note?: string;
};

export type ExportPayloadV1 = {
  version: 1;
  timestamp: string;
  parameters: ExportRow[];
  readouts: ExportRow[];
  notes: string[];
};

export { copyTextToClipboard } from "./clipboard";
export { createDemoModes, toCsv } from "./demoModes";
export { initMath, renderMath } from "./math";
export { initDemoPolish } from "./polish";
export { setLiveRegionText } from "./liveRegion";
export type {
  DemoHelpConfig,
  DemoHelpSection,
  DemoModeKeys,
  DemoShortcut,
  DemoStationConfig,
  StationColumn,
  StationRow
} from "./demoModes";
export { ChallengeEngine } from "./challengeEngine";
export type { Challenge, ChallengeOptions, ChallengeResult, ChallengeStats } from "./challengeEngine";

function isExportPayloadV1(value: unknown): value is ExportPayloadV1 {
  if (!value || typeof value !== "object") return false;
  return (value as ExportPayloadV1).version === 1;
}

function sortEntries(obj: Record<string, string>): [string, string][] {
  return Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
}

export type ExportResults = {
  parameters: Record<string, string>;
  readouts: Record<string, string>;
  notes: string[];
  timestamp: string;
};

export function getModeFromUrl(url: URL): Mode | null {
  const raw = url.searchParams.get("mode");
  if (raw === "concept" || raw === "math") return raw;
  return null;
}

export function getModeFromStorage(storageKey: string): Mode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === "concept" || raw === "math") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setModeInStorage(storageKey: string, mode: Mode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // ignore
  }
}

export function resolveInitialMode(args: {
  url: URL;
  storageKey: string;
  hasMathMode: boolean;
}): Mode {
  const fromUrl = getModeFromUrl(args.url);
  const fromStorage = getModeFromStorage(args.storageKey);
  const candidate = fromUrl ?? fromStorage ?? "concept";
  if (!args.hasMathMode && candidate === "math") return "concept";
  return candidate;
}

export function normalizeExportPayload(
  input: ExportPayloadV1 | ExportResults
): ExportPayloadV1 {
  if (isExportPayloadV1(input)) return input;

  return {
    version: 1,
    timestamp: input.timestamp,
    parameters: sortEntries(input.parameters).map(([name, value]) => ({
      name,
      value
    })),
    readouts: sortEntries(input.readouts).map(([name, value]) => ({
      name,
      value
    })),
    notes: input.notes
  };
}

export function formatExportText(input: ExportPayloadV1 | ExportResults): string {
  const results = normalizeExportPayload(input);

  const lines: string[] = [];
  lines.push("Cosmic Playground — Results Export (v1)");
  lines.push(`Timestamp: ${results.timestamp}`);
  lines.push("");

  lines.push("Parameters:");
  if (results.parameters.length === 0) {
    lines.push("- (none)");
  } else {
    for (const row of results.parameters) {
      const suffix = row.note ? ` — ${row.note}` : "";
      lines.push(`- ${row.name}: ${row.value}${suffix}`);
    }
  }
  lines.push("");

  lines.push("Readouts:");
  if (results.readouts.length === 0) {
    lines.push("- (none)");
  } else {
    for (const row of results.readouts) {
      const suffix = row.note ? ` — ${row.note}` : "";
      lines.push(`- ${row.name}: ${row.value}${suffix}`);
    }
  }
  lines.push("");

  lines.push("Notes:");
  if (results.notes.length === 0) {
    lines.push("- (none)");
  } else {
    for (const note of results.notes) lines.push(`- ${note}`);
  }
  lines.push("");

  return lines.join("\n").trimEnd() + "\n";
}

export function formatExport(results: ExportPayloadV1 | ExportResults): string {
  return formatExportText(results);
}

export function createInstrumentRuntime(args: {
  hasMathMode: boolean;
  storageKey: string;
  url: URL;
}) {
  let mode: Mode = resolveInitialMode(args);
  try {
    initDemoPolish(document);
  } catch {
    // demo polish should never break a demo
  }

  function setMode(nextMode: Mode) {
    const resolved = args.hasMathMode ? nextMode : "concept";
    mode = resolved;
    setModeInStorage(args.storageKey, resolved);
  }

  async function copyResults(results: ExportPayloadV1 | ExportResults) {
    await copyTextToClipboard(formatExport(results));
  }

  return {
    get mode() {
      return mode;
    },
    setMode,
    copyResults
  };
}
