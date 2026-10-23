import { describe, expect, it } from "vitest";

import { initSliderTooltips } from "./polish";

describe("initSliderTooltips", () => {
  // A readout typeset by KaTeX holds MathML plus a TeX annotation; copied as text it reads
  // "1.50x1081.50 \times 10^{8}". The tooltip must show what the readout shows.
  it("mirrors a KaTeX readout as markup, and a plain readout as text", () => {
    document.body.innerHTML = `
      <div id="cp-demo">
        <div><input id="a" type="range" min="0" max="10" value="5" data-tooltip-source="#av" /></div>
        <span id="av"><span class="katex"><span class="katex-mathml">1.50 \\times 10^{8}</span><span class="katex-html">1.50x10</span></span> km</span>
        <div><input id="b" type="range" min="0" max="10" value="5" data-tooltip-source="#bv" /></div>
        <span id="bv">23.5 deg</span>
      </div>`;
    initSliderTooltips(document);

    for (const id of ["a", "b"]) document.getElementById(id)?.dispatchEvent(new Event("input"));
    const [katexTip, plainTip] = Array.from(document.querySelectorAll(".cp-range-tooltip"));

    expect(katexTip.querySelector(".katex-html")?.textContent).toBe("1.50x10");
    expect(katexTip.textContent).toContain("km");
    expect(plainTip.textContent).toBe("23.5 deg");
    expect(plainTip.children).toHaveLength(0);
  });
});
