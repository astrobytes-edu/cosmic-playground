/**
 * uplotHelpers.ts — Thin adapter between uPlot and the Cosmic Playground design system.
 *
 * Resolves CSS custom-property colors at mount time so uPlot's Canvas 2D
 * drawing uses the same palette as the rest of the instrument layer.
 */
import uPlot from "uplot";
// Vite handles CSS imports for bundling
import "uplot/dist/uPlot.min.css";

/* ---------- CSS token resolution ---------- */

/** Read a CSS custom property value from the document root. */
export function resolveCssColor(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/* ---------- Dark-theme defaults ---------- */

function darkThemeDefaults(): Partial<uPlot.Options> {
  const bg = resolveCssColor("--cp-bg0") || "#0e1117";
  const grid = "rgba(255,255,255,0.12)";   // subtle but visible grid
  const text = "rgba(255,255,255,0.78)";   // legible axis labels

  const axisFont = "13px var(--cp-font-mono, monospace)";

  return {
    axes: [
      {
        stroke: text,
        grid: { stroke: grid, width: 1 },
        ticks: { stroke: grid, width: 1 },
        font: axisFont,
      },
      {
        stroke: text,
        grid: { stroke: grid, width: 1 },
        ticks: { stroke: grid, width: 1 },
        font: axisFont,
        size: 84,
      },
    ],
    cursor: {
      drag: { x: false, y: false },
    },
    legend: { show: false },
    padding: [12, 16, 0, 0],
  };
}

/* ---------- Merge helpers ---------- */

function mergeAxes(
  base: uPlot.Axis[] | undefined,
  override: uPlot.Axis[] | undefined
): uPlot.Axis[] {
  if (!base) return override ?? [];
  if (!override) return base;
  const len = Math.max(base.length, override.length);
  const result: uPlot.Axis[] = [];
  for (let i = 0; i < len; i++) {
    result.push({ ...(base[i] ?? {}), ...(override[i] ?? {}) });
  }
  return result;
}

/* ---------- Public API ---------- */

export type EosPlotOptions = Omit<uPlot.Options, "width" | "height"> & {
  width?: number;
  height?: number;
};

/**
 * Mount a uPlot instance inside `container` with Cosmic Playground dark-theme
 * defaults and a ResizeObserver for responsive behavior.
 *
 * Returns { plot, destroy } — call `destroy()` to tear down cleanly.
 */
export function createEosPlot(
  container: HTMLElement,
  userOpts: EosPlotOptions,
  initialData: uPlot.AlignedData
): { plot: uPlot; destroy: () => void } {
  const defaults = darkThemeDefaults();

  const rect = container.getBoundingClientRect();

  const opts: uPlot.Options = {
    ...defaults,
    ...userOpts,
    width: Math.round(rect.width) || 400,
    height: Math.round(rect.height) || 280,
    axes: mergeAxes(
      defaults.axes as uPlot.Axis[],
      userOpts.axes as uPlot.Axis[] | undefined
    ),
  };

  const plot = new uPlot(opts, initialData, container);

  // Responsive resize
  let rafId = 0;
  const ro = new ResizeObserver((entries) => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          plot.setSize({
            width: Math.round(cr.width),
            height: Math.round(cr.height),
          });
        }
      }
    });
  });
  ro.observe(container);

  function destroy() {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    plot.destroy();
  }

  return { plot, destroy };
}

/**
 * Safe cleanup for a plot created by `createEosPlot`.
 * Accepts null/undefined for convenience in teardown code.
 */
export function destroyPlot(
  handle: { destroy: () => void } | null | undefined
): void {
  handle?.destroy();
}

export { uPlot };
