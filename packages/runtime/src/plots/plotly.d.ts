declare module "plotly.js-dist-min" {
  const Plotly: {
    newPlot: (...args: unknown[]) => Promise<unknown> | unknown;
    react: (...args: unknown[]) => Promise<unknown> | unknown;
    purge: (...args: unknown[]) => Promise<unknown> | unknown;
    Plots?: {
      resize?: (...args: unknown[]) => Promise<unknown> | unknown;
    };
  };

  export default Plotly;
}
