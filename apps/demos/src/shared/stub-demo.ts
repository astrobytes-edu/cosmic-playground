import { createInstrumentRuntime, initMath } from "@cosmic/runtime";
import type { ExportPayloadV1 } from "@cosmic/runtime";

export type StubDemoOptions = {
  slug: string;
  title: string;
  oneLiner: string;
};

export function initStubDemo(options: StubDemoOptions) {
  const copyResults = document.querySelector<HTMLButtonElement>("#copyResults");
  const status = document.querySelector<HTMLParagraphElement>("#status");

  if (!copyResults || !status) {
    throw new Error("Missing required export UI.");
  }

  const runtime = createInstrumentRuntime({
    hasMathMode: false,
    storageKey: `cp:${options.slug}:mode`,
    url: new URL(window.location.href)
  });

  function exportResults(): ExportPayloadV1 {
    return {
      version: 1,
      notes: [
        "This demo is currently a stub while we migrate the legacy version into the new runtime."
      ],
      timestamp: new Date().toISOString(),
      parameters: [],
      readouts: []
    };
  }

  (window as any).__cp = {
    slug: options.slug,
    mode: runtime.mode,
    exportResults
  };

  copyResults.addEventListener("click", () => {
    status.textContent = "Copying…";
    void runtime
      .copyResults(exportResults())
      .then(() => {
        status.textContent = "Copied results to clipboard.";
      })
      .catch((err) => {
        status.textContent =
          err instanceof Error ? `Copy failed: ${err.message}` : "Copy failed.";
      });
  });

  initMath(document);
}
