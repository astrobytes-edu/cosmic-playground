import { describe, expect, it } from "vitest";

import { renderMathText, setMathText } from "./mathText";

describe("renderMathText", () => {
  it("renders inline LaTeX without leaving raw delimiters behind", () => {
    const html = renderMathText(
      "Hydrostatic equilibrium uses $\\frac{dP}{dr}=-\\rho g$ locally."
    );

    expect(html).toContain("katex");
    expect(html).not.toContain("$\\frac{dP}{dr}=-\\rho g$");
  });

  it("escapes literal html while still rendering math tokens", () => {
    const html = renderMathText("Use <local> evidence and $P_c\\sim GM^2/R^4$.");

    expect(html).toContain("&lt;local&gt;");
    expect(html).toContain("katex");
  });
});

describe("setMathText", () => {
  // Readouts are refreshed from render(), which some demos call every animation frame.
  it("typesets on change and skips KaTeX when the source is unchanged", () => {
    let writes = 0;
    let html = "";
    const el = {
      get innerHTML() {
        return html;
      },
      set innerHTML(value: string) {
        writes++;
        html = value;
      }
    };

    setMathText(el, "$1.50 \\times 10^{8}$ km");
    setMathText(el, "$1.50 \\times 10^{8}$ km");
    expect(writes).toBe(1);
    expect(html).toContain("katex");
    expect(html).not.toContain("$");

    setMathText(el, "$1.51 \\times 10^{8}$ km");
    expect(writes).toBe(2);
  });
});
