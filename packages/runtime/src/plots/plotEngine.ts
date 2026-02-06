/// <reference path="./plotly.d.ts" />
import Plotly from "plotly.js-dist-min";
import { injectStyleOnce } from "../domStyle";
import {
  PLOT_CSS_TEXT,
  PLOT_DEFAULT_HEIGHT,
  PLOT_STYLE_ID
} from "./plotDefaults";
import {
  hoverNumberFormat,
  normalizeScale,
  normalizeTraceMode,
  resolveAdaptiveTickCount,
  sanitizePoints,
  traceColor
} from "./plotUtils";
import type {
  PlotController,
  PlotDomain,
  PlotPoint,
  PlotScale,
  PlotSpec,
  PlotTrace
} from "./plotTypes";

type PlotlyTrace = {
  x: number[];
  y: number[];
  type: "scatter" | "scattergl";
  mode: "lines" | "markers" | "lines+markers";
  name: string;
  line?: {
    color: string;
    width: number;
    dash?: "solid" | "dash" | "dot";
    shape?: "linear";
  };
  marker?: {
    color: string;
    size: number;
    symbol?: string;
    line?: {
      color: string;
      width: number;
    };
  };
  hovertemplate: string;
};

type PlotlyLayout = Record<string, unknown>;
type PlotlyConfig = Record<string, unknown>;

const INTERACTION_MODEBAR_BUTTONS = [
  "zoom2d",
  "pan2d",
  "select2d",
  "lasso2d",
  "zoomIn2d",
  "zoomOut2d",
  "autoScale2d",
  "resetScale2d",
  "toImage"
];

const WEBGL_TRACE_POINT_THRESHOLD = 1600;
const WEBGL_TOTAL_POINT_THRESHOLD = 3200;

function requestFrame(callback: FrameRequestCallback): number {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(() => callback(Date.now()), 16);
}

function cancelFrame(frameId: number): void {
  if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(frameId);
    return;
  }
  window.clearTimeout(frameId);
}

function axisLabel(label: string, unit: string | undefined): string {
  if (!unit) return label;
  return `${label} (${unit})`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const rootStyle = window.getComputedStyle(document.documentElement);
  const value = rootStyle.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

function domainToPlotlyRange(
  domain: PlotDomain | undefined,
  scale: PlotScale
): [number, number] | undefined {
  if (!domain) return undefined;
  const [min, max] = domain;
  if (!(Number.isFinite(min) && Number.isFinite(max) && max > min)) return undefined;

  if (scale === "log") {
    if (!(min > 0 && max > 0)) return undefined;
    return [Math.log10(min), Math.log10(max)];
  }
  return [min, max];
}

function toPlotlyMode(mode: PlotTrace["mode"]): PlotlyTrace["mode"] {
  const normalized = normalizeTraceMode(mode);
  if (normalized === "points") return "markers";
  if (normalized === "line+points") return "lines+markers";
  return "lines";
}

function toPlotlyTraces(args: {
  traces: PlotTrace[];
  xScale: PlotScale;
  yScale: PlotScale;
  xAxisLabel: string;
  yAxisLabel: string;
}): PlotlyTrace[] {
  const xFormat = hoverNumberFormat(args.xScale);
  const yFormat = hoverNumberFormat(args.yScale);
  const totalPoints = args.traces.reduce((sum, trace) => sum + trace.points.length, 0);
  const globalWebGl = totalPoints >= WEBGL_TOTAL_POINT_THRESHOLD;

  return args.traces.map((trace, index) => {
    const color = traceColor(index, trace.colorVar);
    const points = sanitizePoints(trace.points, args.xScale, args.yScale);
    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const mode = toPlotlyMode(trace.mode);
    const useWebGl = globalWebGl || points.length >= WEBGL_TRACE_POINT_THRESHOLD;

    const plotTrace: PlotlyTrace = {
      x: xValues,
      y: yValues,
      type: useWebGl ? "scattergl" : "scatter",
      mode,
      name: trace.label,
      hovertemplate:
        `<b>${trace.label}</b><br>` +
        `${args.xAxisLabel}=%{x:${xFormat}}<br>` +
        `${args.yAxisLabel}=%{y:${yFormat}}` +
        "<extra></extra>"
    };

    if (mode === "lines" || mode === "lines+markers") {
      plotTrace.line = {
        color,
        width: typeof trace.lineWidth === "number" ? Math.max(1, trace.lineWidth) : 2.6,
        dash: trace.lineDash ?? "solid",
        shape: "linear"
      };
    }

    if (mode === "markers" || mode === "lines+markers") {
      const isCurrentState = trace.id === "current-state";
      plotTrace.marker = {
        color,
        size:
          typeof trace.pointRadius === "number"
            ? Math.max(2, trace.pointRadius * 2)
            : isCurrentState
              ? 11
              : 6,
        symbol: isCurrentState ? "diamond" : "circle",
        line: {
          color: cssVar("--cp-bg0", "#081018"),
          width: 1
        }
      };
    }

    return plotTrace;
  });
}

function baseLayout(args: {
  spec: PlotSpec<unknown>;
  xScale: PlotScale;
  yScale: PlotScale;
  plotWidthPx: number;
  xRange?: [number, number];
  yRange?: [number, number];
  hoverEnabled: boolean;
}): PlotlyLayout {
  const text = cssVar("--cp-text", "#ecf2ff");
  const muted = cssVar("--cp-muted", "#9fb0ca");
  const border = cssVar("--cp-border", "#3e4f68");
  const bg0 = cssVar("--cp-bg0", "#0a1220");
  const bg2 = cssVar("--cp-bg2", "#1c2636");

  const crosshairEnabled = args.spec.interaction?.crosshair ?? args.hoverEnabled;
  const xTickCount = resolveAdaptiveTickCount({
    widthPx: args.plotWidthPx,
    preferred: args.spec.axes.x.tickCount,
    mobilePreferred: args.spec.axes.x.tickCountMobile,
    scale: args.xScale
  });
  const yTickCount = resolveAdaptiveTickCount({
    widthPx: args.plotWidthPx,
    preferred: args.spec.axes.y.tickCount,
    mobilePreferred: args.spec.axes.y.tickCountMobile,
    scale: args.yScale
  });

  const dragMode: false | "select" | "lasso" | "pan" | "zoom" =
    args.spec.interaction?.selectable === true
      ? "select"
      : args.spec.interaction?.brush === true
        ? "lasso"
        : args.spec.interaction?.pan === true
          ? "pan"
          : args.spec.interaction?.zoom === true
            ? "zoom"
            : false;

  const layout: PlotlyLayout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: bg0,
    margin: { l: 86, r: 28, t: 24, b: 64 },
    font: {
      family:
        "IBM Plex Sans, Source Sans 3, Avenir Next, -apple-system, BlinkMacSystemFont, sans-serif",
      size: 13,
      color: text
    },
    hoverlabel: {
      bgcolor: bg2,
      bordercolor: border,
      font: {
        family:
          "IBM Plex Sans, Source Sans 3, Avenir Next, -apple-system, BlinkMacSystemFont, sans-serif",
        size: 12,
        color: text
      }
    },
    legend: {
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: 1.15,
      yanchor: "top",
      bgcolor: "rgba(0,0,0,0)",
      borderwidth: 0,
      font: {
        size: 12,
        color: text
      }
    },
    hovermode: args.hoverEnabled ? "closest" : false,
    spikedistance: crosshairEnabled ? -1 : 0,
    dragmode: dragMode,
    xaxis: {
      title: {
        text: axisLabel(args.spec.axes.x.label, args.spec.axes.x.unit),
        font: { size: 13, color: text }
      },
      type: args.xScale,
      showline: true,
      linewidth: 1,
      linecolor: border,
      mirror: true,
      showgrid: true,
      gridcolor: `${border}66`,
      zeroline: false,
      ticks: "outside",
      ticklen: 5,
      tickcolor: border,
      nticks: xTickCount,
      tickfont: { size: 11, color: muted },
      range: args.xRange,
      showspikes: crosshairEnabled,
      spikesnap: "cursor",
      spikemode: "across",
      spikethickness: 1,
      spikecolor: cssVar("--cp-accent", "#56B4E9"),
      spikedash: "dot"
    },
    yaxis: {
      title: {
        text: axisLabel(args.spec.axes.y.label, args.spec.axes.y.unit),
        font: { size: 13, color: text }
      },
      type: args.yScale,
      showline: true,
      linewidth: 1,
      linecolor: border,
      mirror: true,
      showgrid: true,
      gridcolor: `${border}66`,
      zeroline: false,
      ticks: "outside",
      ticklen: 5,
      tickcolor: border,
      nticks: yTickCount,
      tickfont: { size: 11, color: muted },
      range: args.yRange,
      showspikes: false
    },
    uirevision: `cp-stable:${args.spec.id}`
  };

  return layout;
}

function baseConfig(spec: PlotSpec<unknown>): PlotlyConfig {
  const zoomEnabled = spec.interaction?.zoom === true;
  const panEnabled = spec.interaction?.pan === true;
  const selectableEnabled = spec.interaction?.selectable === true;
  const brushEnabled = spec.interaction?.brush === true;
  const hoverEnabled = spec.interaction?.hover !== false;

  const buttonsToRemove = INTERACTION_MODEBAR_BUTTONS.filter((button) => {
    if (button === "toImage") return false;
    if (button === "select2d") return !selectableEnabled;
    if (button === "lasso2d") return !brushEnabled;
    if (button === "zoom2d") return !zoomEnabled;
    if (button === "pan2d") return !panEnabled;
    if (button.includes("zoom")) return !zoomEnabled;
    if (button.includes("pan")) return !panEnabled;
    return !zoomEnabled && !panEnabled && !selectableEnabled && !brushEnabled;
  });

  return {
    responsive: true,
    displaylogo: false,
    displayModeBar: true,
    modeBarButtonsToRemove: buttonsToRemove,
    scrollZoom: false,
    staticPlot: false
  };
}

export function mountPlot<State>(
  container: HTMLElement,
  spec: PlotSpec<State>,
  initialState: State
): PlotController<State> {
  injectStyleOnce({ id: PLOT_STYLE_ID, cssText: PLOT_CSS_TEXT });

  const root = document.createElement("figure");
  root.className = "cp-runtime-plot";
  root.dataset.plotId = spec.id;

  const surface = document.createElement("div");
  surface.className = "cp-runtime-plot__surface";

  const plotDiv = document.createElement("div");
  plotDiv.className = "cp-runtime-plot__plot";
  plotDiv.style.width = "100%";
  plotDiv.style.height = "100%";
  plotDiv.style.minHeight = `${PLOT_DEFAULT_HEIGHT}px`;
  plotDiv.setAttribute(
    "aria-label",
    spec.ariaLabel ??
      `${axisLabel(spec.axes.y.label, spec.axes.y.unit)} versus ${axisLabel(spec.axes.x.label, spec.axes.x.unit)}`
  );

  surface.appendChild(plotDiv);
  root.appendChild(surface);
  container.replaceChildren(root);

  const xScale = normalizeScale(spec.axes.x.scale);
  const yScale = normalizeScale(spec.axes.y.scale);
  const hoverEnabled = spec.interaction?.hover !== false;

  let traces: PlotTrace[] = [];
  let explicitXDomain: PlotDomain | undefined;
  let explicitYDomain: PlotDomain | undefined;
  let destroyed = false;
  let didInitialRender = false;
  let pendingState: State | null = null;
  let updateFrameId: number | null = null;
  let animationFrameId: number | null = null;
  let previousAnimationTimestampMs: number | null = null;
  let lastState = initialState;
  let resizeObserver: ResizeObserver | null = null;

  const detachListeners: Array<() => void> = [];

  function addListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    target.addEventListener(type, listener);
    detachListeners.push(() => target.removeEventListener(type, listener));
  }

  function setTraceState(nextTraces: PlotTrace[] | undefined): void {
    if (!nextTraces) return;
    traces = nextTraces.map((trace) => ({
      ...trace,
      points: trace.points.map((point: PlotPoint) => ({ ...point }))
    }));
  }

  function setDomains(args: { xDomain?: PlotDomain; yDomain?: PlotDomain }): void {
    explicitXDomain = args.xDomain;
    explicitYDomain = args.yDomain;
  }

  async function renderPlot(): Promise<void> {
    if (destroyed) return;
    const plotWidthPx = Math.max(
      320,
      Math.round(plotDiv.getBoundingClientRect().width || plotDiv.clientWidth || 640)
    );

    const xRange = domainToPlotlyRange(
      explicitXDomain ??
        (typeof spec.axes.x.min === "number" && typeof spec.axes.x.max === "number"
          ? [spec.axes.x.min, spec.axes.x.max]
          : undefined),
      xScale
    );
    const yRange = domainToPlotlyRange(
      explicitYDomain ??
        (typeof spec.axes.y.min === "number" && typeof spec.axes.y.max === "number"
          ? [spec.axes.y.min, spec.axes.y.max]
          : undefined),
      yScale
    );

    const plotlyTraces = toPlotlyTraces({
      traces,
      xScale,
      yScale,
      xAxisLabel: axisLabel(spec.axes.x.label, spec.axes.x.unit),
      yAxisLabel: axisLabel(spec.axes.y.label, spec.axes.y.unit)
    });
    const layout = baseLayout({
      spec,
      xScale,
      yScale,
      plotWidthPx,
      xRange,
      yRange,
      hoverEnabled
    });
    const config = baseConfig(spec);

    const transitionDurationMs = prefersReducedMotion() ? 0 : 110;
    const reactOptions = {
      responsive: true,
      transition: {
        duration: transitionDurationMs,
        easing: "cubic-in-out"
      }
    };

    if (!didInitialRender) {
      await Plotly.newPlot(plotDiv, plotlyTraces, layout, config);
      didInitialRender = true;
      return;
    }
    await Plotly.react(plotDiv, plotlyTraces, layout, config, reactOptions);
  }

  function scheduleUpdate(state: State): void {
    pendingState = state;
    if (updateFrameId !== null) return;

    updateFrameId = requestFrame(() => {
      updateFrameId = null;
      if (destroyed || pendingState === null) return;
      const nextState = pendingState;
      pendingState = null;
      lastState = nextState;

      const patch = spec.update(nextState);
      setTraceState(patch.traces);
      setDomains({ xDomain: patch.xDomain, yDomain: patch.yDomain });
      void renderPlot();
    });
  }

  const initialPatch = spec.init(initialState);
  setTraceState(initialPatch.traces);
  setDomains({ xDomain: initialPatch.xDomain, yDomain: initialPatch.yDomain });
  void renderPlot();

  const resize = () => {
    if (destroyed || !didInitialRender) return;
    if (Plotly.Plots && typeof Plotly.Plots.resize === "function") {
      void Plotly.Plots.resize(plotDiv);
    }
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(surface);
  } else {
    addListener(window, "resize", resize);
  }

  if (spec.animate && !prefersReducedMotion()) {
    const animateFrame = (timestampMs: number) => {
      if (destroyed || !spec.animate) return;
      const dtMs =
        previousAnimationTimestampMs === null
          ? 0
          : Math.max(0, timestampMs - previousAnimationTimestampMs);
      previousAnimationTimestampMs = timestampMs;

      const patch = spec.animate(lastState, dtMs);
      if (patch) {
        setTraceState(patch.traces);
        setDomains({ xDomain: patch.xDomain, yDomain: patch.yDomain });
        void renderPlot();
      }

      animationFrameId = requestFrame(animateFrame);
    };
    animationFrameId = requestFrame(animateFrame);
  }

  return {
    update(state: State) {
      if (destroyed) return;
      scheduleUpdate(state);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;

      if (updateFrameId !== null) {
        cancelFrame(updateFrameId);
        updateFrameId = null;
      }
      if (animationFrameId !== null) {
        cancelFrame(animationFrameId);
        animationFrameId = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      for (const detach of detachListeners) detach();
      detachListeners.length = 0;
      if (didInitialRender) {
        void Plotly.purge(plotDiv);
      }
    }
  };
}
