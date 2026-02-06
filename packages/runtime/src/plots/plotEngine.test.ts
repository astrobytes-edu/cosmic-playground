import { beforeEach, describe, expect, it, vi } from "vitest";

const plotlyMocks = vi.hoisted(() => ({
  newPlot: vi.fn().mockResolvedValue(undefined),
  react: vi.fn().mockResolvedValue(undefined),
  purge: vi.fn().mockResolvedValue(undefined),
  resize: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("plotly.js-dist-min", () => ({
  default: {
    newPlot: plotlyMocks.newPlot,
    react: plotlyMocks.react,
    purge: plotlyMocks.purge,
    Plots: {
      resize: plotlyMocks.resize
    }
  }
}));

import { mountPlot } from "./plotEngine";
import type { PlotSpec } from "./plotTypes";

function waitForFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(), 20);
  });
}

describe("mountPlot (Plotly engine)", () => {
  beforeEach(() => {
    plotlyMocks.newPlot.mockClear();
    plotlyMocks.react.mockClear();
    plotlyMocks.purge.mockClear();
    plotlyMocks.resize.mockClear();
  });

  it("mounts plot once with axis metadata and traces", async () => {
    const host = document.createElement("div");
    host.style.width = "700px";
    host.style.height = "360px";
    document.body.appendChild(host);

    const spec: PlotSpec<number> = {
      id: "eos-test",
      axes: {
        x: { label: "Density rho", unit: "g cm^-3", scale: "log", min: 1e-4, max: 1e4 },
        y: { label: "Pressure P", unit: "dyne cm^-2", scale: "log", min: 1, max: 1e12 }
      },
      init(state) {
        return {
          traces: [
            {
              id: "p-gas",
              label: "P_gas",
              points: [
                { x: 1e-4, y: 1e2 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      },
      update(state) {
        return {
          traces: [
            {
              id: "p-gas",
              label: "P_gas",
              points: [
                { x: 1e-4, y: 1e2 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      }
    };

    const controller = mountPlot(host, spec, 1e5);
    await waitForFrame();

    expect(plotlyMocks.newPlot).toHaveBeenCalledTimes(1);
    const args = plotlyMocks.newPlot.mock.calls[0];
    const traces = args[1] as Array<Record<string, unknown>>;
    const layout = args[2] as Record<string, unknown>;
    const config = args[3] as Record<string, unknown>;

    expect(traces).toHaveLength(1);
    expect(traces[0].name).toBe("P_gas");
    expect((layout.xaxis as Record<string, unknown>).type).toBe("log");
    expect((layout.yaxis as Record<string, unknown>).type).toBe("log");
    expect(layout.uirevision).toBe("cp-stable:eos-test");
    expect((layout.xaxis as Record<string, unknown>).showspikes).toBe(true);
    expect(config.staticPlot).toBe(false);
    expect(
      ((layout.xaxis as Record<string, unknown>).title as Record<string, unknown>).text
    ).toContain("Density rho");

    controller.destroy();
    host.remove();
  });

  it("uses Plotly.react for state updates", async () => {
    const host = document.createElement("div");
    host.style.width = "640px";
    host.style.height = "340px";
    document.body.appendChild(host);

    const spec: PlotSpec<number> = {
      id: "update-test",
      axes: {
        x: { label: "x", min: 0, max: 1 },
        y: { label: "y", min: 0, max: 10 }
      },
      init(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      },
      update(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      }
    };

    const controller = mountPlot(host, spec, 2);
    await waitForFrame();
    controller.update(8);
    await waitForFrame();

    expect(plotlyMocks.react).toHaveBeenCalledTimes(1);
    const args = plotlyMocks.react.mock.calls[0];
    const traces = args[1] as Array<Record<string, unknown>>;
    expect((traces[0].y as number[])[1]).toBe(8);

    controller.destroy();
    host.remove();
  });

  it("switches to scattergl for high-point traces", async () => {
    const host = document.createElement("div");
    host.style.width = "760px";
    host.style.height = "360px";
    document.body.appendChild(host);

    const densePoints = Array.from({ length: 2400 }, (_, index) => ({
      x: index + 1,
      y: (index + 1) * 2
    }));

    const spec: PlotSpec<number> = {
      id: "dense-trace",
      axes: {
        x: { label: "x", scale: "log", min: 1, max: 3000 },
        y: { label: "y", scale: "log", min: 1, max: 10000 }
      },
      init() {
        return {
          traces: [
            {
              id: "dense",
              label: "dense",
              points: densePoints
            }
          ]
        };
      },
      update() {
        return { traces: [] };
      }
    };

    const controller = mountPlot(host, spec, 0);
    await waitForFrame();

    const args = plotlyMocks.newPlot.mock.calls[0];
    const traces = args[1] as Array<Record<string, unknown>>;
    expect(traces[0].type).toBe("scattergl");

    controller.destroy();
    host.remove();
  });

  it("enables select/brush controls when interaction hooks are requested", async () => {
    const host = document.createElement("div");
    host.style.width = "700px";
    host.style.height = "350px";
    document.body.appendChild(host);

    const spec: PlotSpec<number> = {
      id: "interaction-hooks",
      axes: {
        x: { label: "x", min: 0, max: 1 },
        y: { label: "y", min: 0, max: 10 }
      },
      interaction: {
        selectable: true,
        brush: true,
        hover: true
      },
      init(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      },
      update() {
        return {};
      }
    };

    const controller = mountPlot(host, spec, 2);
    await waitForFrame();

    const args = plotlyMocks.newPlot.mock.calls[0];
    const layout = args[2] as Record<string, unknown>;
    const config = args[3] as Record<string, unknown>;
    const removed = (config.modeBarButtonsToRemove as string[]) ?? [];

    expect(layout.dragmode).toBe("select");
    expect(removed).not.toContain("select2d");
    expect(removed).not.toContain("lasso2d");

    controller.destroy();
    host.remove();
  });

  it("applies and updates layout overrides from PlotSpec patches", async () => {
    const host = document.createElement("div");
    host.style.width = "720px";
    host.style.height = "360px";
    document.body.appendChild(host);

    const spec: PlotSpec<number> = {
      id: "layout-overrides",
      axes: {
        x: { label: "x", min: 0, max: 1 },
        y: { label: "y", min: 0, max: 10 }
      },
      init(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ],
          layoutOverrides: {
            legend: { orientation: "v", x: 1, xanchor: "right" },
            hovermode: "x unified",
            annotations: [{ text: "initial", x: 0.5, y: 0.9, xref: "paper", yref: "paper" }]
          }
        };
      },
      update(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ],
          layoutOverrides: {
            legend: { orientation: "v", x: 1, xanchor: "right" },
            hovermode: "x unified",
            annotations: [{ text: "updated", x: 0.5, y: 0.9, xref: "paper", yref: "paper" }]
          }
        };
      }
    };

    const controller = mountPlot(host, spec, 2);
    await waitForFrame();
    const initialLayout = plotlyMocks.newPlot.mock.calls[0][2] as Record<string, unknown>;
    expect(initialLayout.hovermode).toBe("x unified");
    expect((initialLayout.legend as Record<string, unknown>).orientation).toBe("v");
    expect(
      ((initialLayout.annotations as Array<Record<string, unknown>>)[0] as Record<string, unknown>).text
    ).toBe("initial");

    controller.update(4);
    await waitForFrame();
    const updatedLayout = plotlyMocks.react.mock.calls[0][2] as Record<string, unknown>;
    expect(updatedLayout.hovermode).toBe("x unified");
    expect((updatedLayout.legend as Record<string, unknown>).orientation).toBe("v");
    expect(
      ((updatedLayout.annotations as Array<Record<string, unknown>>)[0] as Record<string, unknown>).text
    ).toBe("updated");

    controller.destroy();
    host.remove();
  });

  it("purges plot on destroy", async () => {
    const host = document.createElement("div");
    host.style.width = "620px";
    host.style.height = "320px";
    document.body.appendChild(host);

    const spec: PlotSpec<number> = {
      id: "destroy-test",
      axes: {
        x: { label: "x", min: 0, max: 1 },
        y: { label: "y", min: 0, max: 10 }
      },
      init(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      },
      update(state) {
        return {
          traces: [
            {
              id: "line",
              label: "line",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: state }
              ]
            }
          ]
        };
      }
    };

    const controller = mountPlot(host, spec, 3);
    await waitForFrame();
    controller.destroy();
    await waitForFrame();

    expect(plotlyMocks.purge).toHaveBeenCalledTimes(1);
    host.remove();
  });
});
