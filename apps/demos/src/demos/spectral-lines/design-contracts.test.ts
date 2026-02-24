import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests — Spectral Lines & the Bohr Atom
 *
 * These tests enforce hard invariants that every instrument-layer demo
 * must satisfy. They read the source files as strings and assert
 * token usage patterns.
 *
 * Invariants:
 *   1. A starfield canvas MUST exist in the HTML
 *   2. Readout values MUST separate units into .cp-readout__unit spans
 *   3. Demo-specific panels MUST use translucent backgrounds
 *   4. No legacy token leakage
 *   5. SVG celestial objects MUST use --cp-celestial-* tokens
 *   6. Layout uses composable primitives (tabs, utility toolbar, readouts)
 *   7. Entry animations present
 *   8. KaTeX math support loaded
 */

describe("Spectral Lines — Design System Contracts", () => {
  const htmlPath = path.resolve(__dirname, "index.html");
  const cssPath = path.resolve(__dirname, "style.css");
  const html = fs.readFileSync(htmlPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  describe("Starfield invariant", () => {
    it("demo HTML contains a starfield canvas element", () => {
      expect(html).toContain('class="cp-starfield"');
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
    });
  });

  describe("Instrument layer", () => {
    it("root element has cp-layer-instrument class", () => {
      expect(html).toContain("cp-layer-instrument");
    });
  });

  describe("Readout unit separation", () => {
    it("readout values with units use .cp-readout__unit spans", () => {
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      // Wavelength (nm), Energy (eV), Frequency (Hz) = at least 3 unit spans
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Panel translucency", () => {
    it("Bohr container uses translucent panel background", () => {
      expect(css).toMatch(/\.bohr-container[\s\S]*?background:\s*var\(--cp-instr-panel-bg\)/);
    });

    it("Bohr container uses backdrop-filter", () => {
      expect(css).toMatch(/\.bohr-container[\s\S]*?backdrop-filter/);
    });

    it("energy container uses translucent panel background", () => {
      expect(css).toMatch(/\.energy-container[\s\S]*?background:\s*var\(--cp-instr-panel-bg\)/);
    });

    it("energy container uses backdrop-filter", () => {
      expect(css).toMatch(/\.energy-container[\s\S]*?backdrop-filter/);
    });
  });

  describe("No legacy token leakage", () => {
    it("no --cp-warning tokens in HTML", () => {
      expect(html).not.toContain("--cp-warning");
    });

    it("no --cp-accent2 tokens in HTML", () => {
      expect(html).not.toContain("--cp-accent2");
    });

    it("no --cp-warning tokens in CSS", () => {
      expect(css).not.toContain("--cp-warning");
    });

    it("no --cp-accent2 tokens in CSS", () => {
      expect(css).not.toContain("--cp-accent2");
    });
  });

  describe("Composable layout primitives", () => {
    it("uses role=tablist for view mode switching", () => {
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('role="tabpanel"');
    });

    it("uses cp-utility-toolbar for icon actions", () => {
      expect(html).toContain("cp-utility-toolbar");
    });

    it("uses cp-popover for navigation links", () => {
      expect(html).toContain("cp-popover-trigger");
      expect(html).toContain("navPopover");
    });

    it("has station mode button", () => {
      expect(html).toContain('id="stationMode"');
    });

    it("has help button", () => {
      expect(html).toContain('id="help"');
    });

    it("has copy results button", () => {
      expect(html).toContain('id="copyResults"');
    });
  });

  describe("SVG visualization elements", () => {
    it("has Bohr atom SVG", () => {
      expect(html).toContain('id="bohrAtom"');
    });

    it("has energy-level diagram SVG", () => {
      expect(html).toContain('id="energyLevels"');
    });

    it("has spectrum canvas", () => {
      expect(html).toContain('id="spectrumCanvas"');
    });
  });

  describe("Entry animations", () => {
    it("controls sidebar has slide-up animation", () => {
      expect(css).toMatch(/\.cp-demo__controls[\s\S]*?animation:\s*cp-slide-up/);
    });

    it("stage has fade-in animation", () => {
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation:\s*cp-fade-in/);
    });

    it("drawer has fade-in animation", () => {
      expect(css).toMatch(/\.cp-demo__drawer[\s\S]*?animation:\s*cp-fade-in/);
    });
  });

  describe("KaTeX math support", () => {
    it("loads KaTeX CSS", () => {
      expect(html).toContain("katex.min.css");
    });

    it("contains LaTeX math expressions", () => {
      // Check for $ delimiters indicating math content
      expect(html).toContain("$n_{\\text{upper}}$");
      expect(html).toContain("$\\lambda$");
      expect(html).toContain("$E_n");
    });
  });

  describe("Accessibility", () => {
    it("SVGs have aria-label attributes", () => {
      expect(html).toMatch(/<svg[^>]*id="bohrAtom"[^>]*aria-label/);
      expect(html).toMatch(/<svg[^>]*id="energyLevels"[^>]*aria-label/);
    });

    it("spectrum canvas has aria-label", () => {
      expect(html).toMatch(/<canvas[^>]*id="spectrumCanvas"[^>]*aria-label/);
    });

    it("has live region for status updates", () => {
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
    });

    it("mode selectors use radiogroup pattern", () => {
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain('role="radio"');
    });
  });

  describe("CSS imports chain", () => {
    it("imports stub-demo.css (design system entry point)", () => {
      expect(css).toContain("stub-demo.css");
    });
  });

  describe("No hardcoded color literals in CSS", () => {
    it("does not contain raw hex colors", () => {
      // Allow #spectrumCanvas (id selector) but not color hex codes
      const hexColors = css.match(/#[0-9a-fA-F]{3,8}(?![a-zA-Z0-9_-])/g) || [];
      expect(hexColors.length).toBe(0);
    });
  });

  // ── Structural contracts (aligned with golden reference) ──

  describe("Readout placement", () => {
    it("readouts live in cp-demo__readouts region", () => {
      expect(html).toContain("cp-demo__readouts");
    });

    it("readouts are not inside the controls sidebar", () => {
      // readout-group was the old sidebar-embedded class
      expect(html).not.toContain("readout-group");
    });
  });

  describe("Shell grid compatibility", () => {
    it("CSS does not override grid-template-areas", () => {
      expect(css).not.toContain("grid-template-areas");
    });
  });

  describe("Cross-reference links", () => {
    it("has Explore further accordion with links to related demos", () => {
      expect(html).toContain("Explore further");
      expect(html).toContain('href="../doppler-shift/"');
      expect(html).toContain('href="../galaxy-rotation/"');
    });
  });
});
