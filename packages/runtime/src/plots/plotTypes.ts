export type PlotScale = "linear" | "log";

export type PlotRenderMode = "line" | "points" | "line+points";

export type PlotLineDash = "solid" | "dash" | "dot";

export type PlotDomain = [number, number];

export type PlotPoint = {
  x: number;
  y: number;
};

export type AxisSpec = {
  label: string;
  unit?: string;
  scale?: PlotScale;
  min?: number;
  max?: number;
  tickCount?: number;
  tickCountMobile?: number;
};

export type PlotTrace = {
  id: string;
  label: string;
  points: PlotPoint[];
  mode?: PlotRenderMode;
  lineDash?: PlotLineDash;
  lineWidth?: number;
  pointRadius?: number;
  colorVar?: string;
};

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
