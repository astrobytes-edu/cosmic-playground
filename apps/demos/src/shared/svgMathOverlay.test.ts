// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { createSvgMathOverlay } from "./svgMathOverlay";

afterEach(() => document.body.replaceChildren());

type Ctm = { a: number; b: number; c: number; d: number; e: number; f: number };

// jsdom has no layout: the SVG's screen matrix and the layer's box are supplied here, the
// two numbers a browser would give the overlay.
function setup(ctm: Ctm | null, layerOrigin = { left: 100, top: 200 }) {
  const host = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.append(svg);
  document.body.append(host);
  let matrix = ctm;
  Object.assign(svg, { getScreenCTM: () => matrix });
  const overlay = createSvgMathOverlay(svg);
  overlay.layer.getBoundingClientRect = () => ({ ...layerOrigin, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
  const setCtm = (next: Ctm | null) => {
    matrix = next;
  };
  return { host, svg, overlay, setCtm };
}

const label = (key: string) => document.querySelector<HTMLElement>(`[data-svg-math="${key}"]`);

describe("createSvgMathOverlay", () => {
  it("pins each label to its SVG point through the screen matrix, sized in px or in user units", () => {
    const { host, overlay } = setup({ a: 2, b: 0, c: 0, d: 2, e: 110, f: 220 });
    overlay.set([
      { key: "gamma", tex: "$\\gamma$", x: 5, y: 7, anchor: "end", fontPx: 12 },
      { key: "lambda", tex: "$\\lambda_{\\rm app}$", x: 0, y: 0, fontUnits: 10 }
    ]);

    expect(host.style.position).toBe("relative");
    expect(overlay.layer.getAttribute("aria-hidden")).toBe("true");
    const gamma = label("gamma");
    // (2*5 + 110 - 100, 2*7 + 220 - 200): screen point minus the layer origin.
    expect([gamma?.style.left, gamma?.style.top]).toEqual(["20px", "34px"]);
    expect(gamma?.style.transform).toBe("translate(-100%, -50%)");
    expect(gamma?.style.fontSize).toBe("12px");
    expect(gamma?.innerHTML).toContain("katex");
    const lambda = label("lambda");
    expect([lambda?.style.left, lambda?.style.top]).toEqual(["10px", "20px"]);
    expect(lambda?.style.transform).toBe("translate(-50%, -50%)");
    expect(lambda?.style.fontSize).toBe("20px");
  });

  it("keeps a label's element across redraws and drops labels no longer drawn", () => {
    const { overlay } = setup({ a: 1, b: 0, c: 0, d: 1, e: 100, f: 200 });
    overlay.set([
      { key: "arc", tex: "$\\lambda$", x: 1, y: 1, fontPx: 10 },
      { key: "inf", tex: "$\\infty$", x: 2, y: 2, fontPx: 10 }
    ]);
    const arc = label("arc");

    overlay.set([{ key: "arc", tex: "$\\lambda$", x: 30, y: 40, fontPx: 10 }]);

    expect(label("arc")).toBe(arc);
    expect(arc?.style.left).toBe("30px");
    expect(label("inf")).toBeNull();
  });

  it("hides the layer while the SVG has no layout and re-pins it once it has", () => {
    const { overlay, setCtm } = setup(null);
    overlay.set([{ key: "gamma", tex: "$\\gamma$", x: 5, y: 5, fontPx: 16 }]);
    expect(overlay.layer.style.visibility).toBe("hidden");

    setCtm({ a: 1, b: 0, c: 0, d: 1, e: 100, f: 200 });
    overlay.reposition();

    expect(overlay.layer.style.visibility).toBe("");
    expect(label("gamma")?.style.left).toBe("5px");
  });
});
