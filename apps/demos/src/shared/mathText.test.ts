import { describe, expect, it } from "vitest";

import { renderMathText } from "./mathText";

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
