export type PlotScale = "linear" | "log";

export type PlotRenderMode = "line" | "points" | "line+points";

export type PlotLineDash = "solid" | "dash" | "dot";

export type PlotDomain = [number, number];

export type PlotPoint = {
  x: number;
  y: number;
};

export type PlotColorScaleStop = [number, string];

export type AxisSpec = {
  label: string;
  unit?: string;
  scale?: PlotScale;
  min?: number;
  max?: number;
  tickCount?: number;
  tickCountMobile?: number;
};

export type PlotSeriesTrace = {
  kind?: "series";
  id: string;
  label: string;
  points: PlotPoint[];
  mode?: PlotRenderMode;
  lineDash?: PlotLineDash;
  lineWidth?: number;
  pointRadius?: number;
  colorVar?: string;
  markerSymbol?: string;
  markerLineColor?: string;
  markerLineWidth?: number;
  hoverTemplate?: string;
  showLegend?: boolean;
};

export type PlotHeatmapTrace = {
  kind: "heatmap";
  id: string;
  label: string;
  x: number[];
  y: number[];
  z: number[][];
  zMin?: number;
  zMax?: number;
  showScale?: boolean;
  colorScale?: PlotColorScaleStop[];
  customData?: Array<Array<string | number | null>>;
  hoverTemplate?: string;
  smooth?: "best" | "fast";
  opacity?: number;
  showLegend?: boolean;
};

export type PlotTrace = PlotSeriesTrace | PlotHeatmapTrace;

export type PlotInit = {
  traces: PlotTrace[];
  xDomain?: PlotDomain;
  yDomain?: PlotDomain;
  layoutOverrides?: PlotLayoutOverrides;
};

export type PlotUpdate = {
  traces?: PlotTrace[];
  xDomain?: PlotDomain;
  yDomain?: PlotDomain;
  layoutOverrides?: PlotLayoutOverrides;
};

export type PlotLayoutOverrides = Record<string, unknown>;

export type PlotSpec<State> = {
  id: string;
  axes: {
    x: AxisSpec;
    y: AxisSpec;
  };
  init(state: State): PlotInit;
  update(state: State): PlotUpdate;
  animate?(state: State, dtMs: number): PlotUpdate | null;
  interaction?: {
    zoom?: boolean;
    pan?: boolean;
    hover?: boolean;
    crosshair?: boolean;
    selectable?: boolean;
    brush?: boolean;
  };
  ariaLabel?: string;
};

export type PlotController<State> = {
  update(state: State): void;
  destroy(): void;
};
