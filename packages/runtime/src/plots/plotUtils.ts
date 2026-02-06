import type {
  AxisSpec,
  PlotDomain,
  PlotLineDash,
  PlotPoint,
  PlotScale,
  PlotTrace
} from "./plotTypes";
import { PLOT_TRACE_COLOR_VARS } from "./plotDefaults";

const EPS = 1e-12;

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeScale(scale: PlotScale | undefined): PlotScale {
  return scale === "log" ? "log" : "linear";
}

export function normalizeTraceMode(
  mode: "line" | "points" | "line+points" | undefined
): "line" | "points" | "line+points" {
  if (mode === "points" || mode === "line+points") return mode;
  return "line";
}

export function sanitizePoints(
  points: PlotPoint[],
  xScale: PlotScale,
  yScale: PlotScale
): PlotPoint[] {
  return points.filter((point) => {
    if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return false;
    if (xScale === "log" && !(point.x > 0)) return false;
    if (yScale === "log" && !(point.y > 0)) return false;
    return true;
  });
}

function dataExtent(
  traces: PlotTrace[],
  key: "x" | "y",
  scale: PlotScale
): PlotDomain | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const trace of traces) {
    for (const point of trace.points) {
      const value = point[key];
      if (!isFiniteNumber(value)) continue;
      if (scale === "log" && !(value > 0)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (max <= min) {
    const delta = Math.max(Math.abs(min) * 0.01, scale === "log" ? 1 : 1e-6);
    return [Math.max(scale === "log" ? EPS : -Infinity, min - delta), min + delta];
  }

  return [min, max];
}

export function resolveDomain(args: {
  axis: AxisSpec;
  traces: PlotTrace[];
  explicitDomain?: PlotDomain;
  key: "x" | "y";
}): PlotDomain {
  const scale = normalizeScale(args.axis.scale);
  const fromExplicit = args.explicitDomain;

  if (fromExplicit && isFiniteNumber(fromExplicit[0]) && isFiniteNumber(fromExplicit[1])) {
    const [a, b] = fromExplicit;
    if (b > a && (scale !== "log" || (a > 0 && b > 0))) return [a, b];
  }

  if (
    isFiniteNumber(args.axis.min) &&
    isFiniteNumber(args.axis.max) &&
    args.axis.max > args.axis.min &&
    (scale !== "log" || (args.axis.min > 0 && args.axis.max > 0))
  ) {
    return [args.axis.min, args.axis.max];
  }

  const extent = dataExtent(args.traces, args.key, scale);
  if (extent) return extent;

  return scale === "log" ? [1, 10] : [0, 1];
}

export function buildTicks(args: {
  domain: PlotDomain;
  scale: PlotScale;
  count: number;
}): number[] {
  const [min, max] = args.domain;
  if (!(max > min)) return [min];

  const count = Math.max(2, Math.min(12, Math.round(args.count)));
  if (args.scale === "linear") {
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, index) => min + index * step);
  }

  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  const decadeSpan = maxLog - minLog;
  const step = Math.max(1, Math.ceil(decadeSpan / (count - 1)));
  const ticks: number[] = [];
  for (let exponent = Math.ceil(minLog); exponent <= Math.floor(maxLog) + EPS; exponent += step) {
    ticks.push(Math.pow(10, exponent));
  }

  if (ticks.length < 2) return [min, max];
  return ticks;
}

export function projectValue(args: {
  value: number;
  domain: PlotDomain;
  scale: PlotScale;
  pxMin: number;
  pxMax: number;
}): number | null {
  if (!isFiniteNumber(args.value)) return null;
  const [min, max] = args.domain;
  if (!(max > min)) return null;

  if (args.scale === "log") {
    if (!(args.value > 0 && min > 0 && max > 0)) return null;
    const minLog = Math.log10(min);
    const maxLog = Math.log10(max);
    const valueLog = Math.log10(args.value);
    const ratio = (valueLog - minLog) / (maxLog - minLog);
    return args.pxMin + ratio * (args.pxMax - args.pxMin);
  }

  const ratio = (args.value - min) / (max - min);
  return args.pxMin + ratio * (args.pxMax - args.pxMin);
}

export function traceStrokeDashArray(lineDash: PlotLineDash | undefined): string | null {
  switch (lineDash) {
    case "dash":
      return "6 4";
    case "dot":
      return "2 4";
    default:
      return null;
  }
}

export function traceColor(index: number, override: string | undefined): string {
  if (typeof override === "string" && override.trim().length > 0) return override;
  return PLOT_TRACE_COLOR_VARS[index % PLOT_TRACE_COLOR_VARS.length];
}

export function formatTick(value: number): string {
  if (!isFiniteNumber(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e4 || abs < 1e-2) return value.toExponential(1);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function formatReadout(value: number): string {
  if (!isFiniteNumber(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e5 || (abs > 0 && abs < 1e-3)) return value.toExponential(3);
  return value.toFixed(4);
}

export function resolveAdaptiveTickCount(args: {
  widthPx: number;
  preferred?: number;
  mobilePreferred?: number;
  scale: PlotScale;
}): number {
  const width = Number.isFinite(args.widthPx) ? args.widthPx : 640;
  const base =
    width <= 460
      ? args.mobilePreferred ?? 4
      : width <= 820
        ? Math.max(5, args.preferred ?? 6)
        : Math.max(7, args.preferred ?? 8);

  const cap = args.scale === "log" ? 8 : 12;
  return Math.max(3, Math.min(cap, Math.round(base)));
}

export function hoverNumberFormat(scale: PlotScale): string {
  return scale === "log" ? ".4e" : ".4g";
}
