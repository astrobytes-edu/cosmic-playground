import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Cluster Census
 *
 * These read the source files as strings and assert the invariants every
 * instrument-layer demo must satisfy. See CLAUDE.md, "Design System Invariants".
 */

describe("Cluster Census -- Design System Contracts", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
  const css = fs.readFileSync(path.resolve(__dirname, "style.css"), "utf-8");
  const mainTs = fs.readFileSync(path.resolve(__dirname, "main.ts"), "utf-8");
  const logicTs = fs.readFileSync(path.resolve(__dirname, "logic.ts"), "utf-8");

  describe("Shell", () => {
    it("uses the instrument layer", () => {
      expect(html).toContain("cp-layer-instrument");
    });

    it("has a starfield canvas and initialises it with the canvas argument", () => {
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
      // initStarfield() with no argument is a runtime error; the canvas must be passed.
      expect(mainTs).toMatch(/initStarfield\(\{\s*canvas/);
    });

    it("has the controls panel, stage and drawer the shell requires", () => {
      expect(html).toContain("cp-demo__controls");
      expect(html).toContain("cp-demo__stage");
      expect(html).toContain("cp-demo__drawer");
    });

    it("imports the shared token and shell chain", () => {
      expect(css.trimStart()).toMatch(/^@import "\.\.\/\.\.\/shared\/stub-demo\.css";/);
    });
  });

  describe("Readout typography contract", () => {
    it("separates every dimensional readout's unit into its own span", () => {
      const readoutBlocks = html.match(/<div class="cp-readout">[\s\S]*?<\/div>\s*<\/div>/g) ?? [];
      expect(readoutBlocks.length).toBeGreaterThanOrEqual(4);
      for (const block of readoutBlocks) {
        expect(block).toContain('class="cp-readout__label"');
        expect(block).toContain('class="cp-readout__value"');
        expect(block).toContain('class="cp-readout__unit"');
      }
    });

    it("writes solar-mass units as LaTeX rather than a Unicode symbol", () => {
      expect(html).toContain("$M_\\odot$");
    });
  });

  describe("Panel translucency contract", () => {
    it("plot panels use the instrument panel background, not an opaque fill", () => {
      expect(css).toContain("background: var(--cp-instr-panel-bg)");
      expect(css).toContain("--cp-instr-panel-bg-muted");
    });

    it("blurs the backdrop, with the prefix Safari needs", () => {
      expect(css).toContain("backdrop-filter: blur(8px)");
      expect(css).toContain("-webkit-backdrop-filter: blur(8px)");
    });
  });

  describe("No colour literals in CSS", () => {
    it("declares no hex colours", () => {
      const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(withoutComments).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });

    it("declares no rgb() or rgba() literals", () => {
      const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(withoutComments).not.toMatch(/\brgba?\(/);
    });

    it("takes every colour from a token", () => {
      const colourDeclarations =
        css.match(/^\s*(color|background|border-color|fill|stroke):[^;]+;/gm) ?? [];
      expect(colourDeclarations.length).toBeGreaterThan(0);
      for (const declaration of colourDeclarations) {
        expect(declaration).toMatch(/var\(--cp-|transparent|currentColor|none|inherit/);
      }
    });
  });

  describe("Token purity", () => {
    it("uses no legacy aliases", () => {
      expect(css).not.toContain("--cp-warning");
      expect(css).not.toContain("--cp-accent2");
      expect(css).not.toContain("--cp-accent3");
    });

    it("uses only tokens that exist in the type scale", () => {
      // --cp-text-base is not in the scale (sm/md/lg/xl/2xl/3xl/4xl/hero).
      expect(css).not.toContain("--cp-text-base");
    });
  });

  describe("Motion contract", () => {
    it("uses the shared entry keyframes with a stagger", () => {
      expect(css).toContain("cp-slide-up");
      expect(css).toContain("cp-fade-in");
      expect(css).toMatch(/cp-fade-in[^;]*\d+ms/);
    });
  });

  describe("Accessibility", () => {
    it("gives every chip an aria-pressed state", () => {
      const chips = html.match(/<button[^>]*class="[^"]*cp-chip[^"]*"[^>]*>/g) ?? [];
      expect(chips.length).toBeGreaterThanOrEqual(5);
      for (const chip of chips) expect(chip).toContain("aria-pressed");
    });

    it("labels every range input", () => {
      const sliders = html.match(/<input[^>]*type="range"[^>]*>/gs) ?? [];
      expect(sliders.length).toBe(3);
      for (const slider of sliders) expect(slider).toMatch(/aria-label=/);
    });

    it("sets aria-valuetext on the normalized sliders", () => {
      // A 0..1000 log-proxy slider announces a meaningless raw number without this.
      expect(mainTs).toContain('setAttribute("aria-valuetext"');
      const valueTextWrites = mainTs.match(/setAttribute\("aria-valuetext"/g) ?? [];
      expect(valueTextWrites.length).toBe(3);
    });

    it("has a polite live region and writes the census into it", () => {
      expect(html).toMatch(/id="status"[^>]*aria-live="polite"/);
      expect(mainTs).toContain("censusAnnouncement");
    });

    it("gives each plot canvas a role and a descriptive label", () => {
      for (const id of ["clusterCanvas", "hrCanvas", "imfCanvas"]) {
        const canvas = html.match(new RegExp(`<canvas[^>]*id="${id}"[\\s\\S]*?>`))?.[0] ?? "";
        expect(canvas, `${id} markup`).toContain('role="img"');
        expect(canvas, `${id} markup`).toMatch(/aria-label="[^"]{20,}"/);
      }
    });

    it("hides the starfield from assistive technology", () => {
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"[^>]*aria-hidden="true"/);
    });
  });

  describe("Architecture", () => {
    it("takes all physics from @cosmic/physics rather than inlining it", () => {
      expect(mainTs).toContain('from "@cosmic/physics"');
      expect(mainTs).toContain("sampleStarCluster");
      // No mass function, lifetime relation or ZAMS fit written into the demo.
      expect(logicTs).not.toMatch(/maschbergerPrimitive|HURLEY_A|zamsLuminosity/);
    });

    it("keeps logic.ts free of the DOM", () => {
      expect(logicTs).not.toMatch(/\bdocument\.|\bwindow\.|querySelector/);
    });

    it("routes redraws through one coalescing scheduler", () => {
      // Drawing up to 20,000 dots across three panels on every input event stalls the
      // thread; one redraw per frame does not.
      expect(mainTs).toContain("requestAnimationFrame");
      expect(mainTs).toContain("scheduleRedraw");
    });

    it("reads theme colours once per frame rather than inside the draw loops", () => {
      // getComputedStyle forces style resolution; calling it per star is the difference
      // between a redraw and a stall.
      const computedStyleCalls = mainTs.match(/getComputedStyle\(/g) ?? [];
      expect(computedStyleCalls.length).toBe(1);
      expect(mainTs).toContain("function readPalette");
    });
  });

  describe("Scientific honesty", () => {
    it("names its sources in the export payload", () => {
      for (const source of ["Maschberger", "Kroupa", "Plummer", "Tout", "Hurley"]) {
        expect(mainTs, `export notes should cite ${source}`).toContain(source);
      }
    });

    it("states the model's limits in the drawer and the Understand tab", () => {
      expect(html).toContain("no post-main-sequence");
      expect(html).toContain("extrapolated");
      expect(html).toContain("not a stellar radius");
    });

    it("reports out-of-domain and extrapolated stars as their own counts", () => {
      expect(html).toContain('id="outsideCount"');
      expect(html).toContain('id="extrapolatedCount"');
      expect(mainTs).toContain("cluster.outsideModelCount");
      expect(mainTs).toContain("cluster.extrapolatedCount");
    });
  });
});
