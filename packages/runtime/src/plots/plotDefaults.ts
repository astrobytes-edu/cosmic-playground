export const PLOT_STYLE_ID = "cp-runtime-plot-styles";

export const PLOT_CSS_TEXT = `
.cp-runtime-plot {
  margin: 0;
  position: relative;
}

.cp-runtime-plot__surface {
  position: relative;
  width: 100%;
  min-height: 18rem;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-3);
  background:
    radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--cp-accent) 16%, transparent), transparent 48%),
    linear-gradient(180deg, color-mix(in srgb, var(--cp-bg2) 92%, transparent), color-mix(in srgb, var(--cp-bg0) 95%, transparent));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cp-border) 56%, transparent);
  overflow: hidden;
}

.cp-runtime-plot__plot {
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.cp-runtime-plot__plot .modebar {
  background: color-mix(in srgb, var(--cp-bg1) 92%, transparent) !important;
  border-left: 1px solid color-mix(in srgb, var(--cp-border) 60%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--cp-border) 60%, transparent);
  border-radius: 0 0 0 var(--cp-r-2);
}

.cp-runtime-plot__plot .modebar-btn {
  color: var(--cp-muted) !important;
}

.cp-runtime-plot__plot .modebar-btn:hover {
  color: var(--cp-text) !important;
  background: color-mix(in srgb, var(--cp-accent) 20%, transparent) !important;
}
`;

export const PLOT_DEFAULT_WIDTH = 640;
export const PLOT_DEFAULT_HEIGHT = 320;

export const PLOT_MIN_WIDTH = 320;
export const PLOT_MIN_HEIGHT = 220;

export const PLOT_INNER_PADDING = {
  top: 18,
  right: 18,
  bottom: 36,
  left: 60
} as const;

export const PLOT_TRACE_COLOR_VARS = [
  "#56B4E9",
  "#E69F00",
  "#009E73",
  "#D55E00",
  "#CC79A7",
  "#0072B2"
] as const;
