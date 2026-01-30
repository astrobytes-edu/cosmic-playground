export const PACKAGE_NAME = "@cosmic/runtime";

export type Mode = "concept" | "math";

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

export function formatExport(results: ExportResults): string {
  const lines: string[] = [];
  lines.push("Cosmic Playground — Export Results");
  lines.push(`Timestamp: ${results.timestamp}`);
  lines.push("");

  const parameterEntries = Object.entries(results.parameters);
  if (parameterEntries.length > 0) {
    lines.push("Parameters:");
    for (const [k, v] of parameterEntries) lines.push(`- ${k}: ${v}`);
    lines.push("");
  }

  const readoutEntries = Object.entries(results.readouts);
  if (readoutEntries.length > 0) {
    lines.push("Readouts:");
    for (const [k, v] of readoutEntries) lines.push(`- ${k}: ${v}`);
    lines.push("");
  }

  if (results.notes.length > 0) {
    lines.push("Notes:");
    for (const note of results.notes) lines.push(`- ${note}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard unavailable in this environment.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("Failed to copy to clipboard.");
}

export function createInstrumentRuntime(args: {
  hasMathMode: boolean;
  storageKey: string;
  url: URL;
}) {
  let mode: Mode = resolveInitialMode(args);

  function setMode(nextMode: Mode) {
    const resolved = args.hasMathMode ? nextMode : "concept";
    mode = resolved;
    setModeInStorage(args.storageKey, resolved);
  }

  async function copyResults(results: ExportResults) {
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
