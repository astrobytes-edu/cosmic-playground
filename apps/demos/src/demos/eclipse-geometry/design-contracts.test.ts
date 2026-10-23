import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Design System Contract Tests -- Eclipse Geometry
 *
 * Static checks that read the demo's source files as strings and assert the
 * design-system invariants every instrument-layer demo must satisfy (see CLAUDE.md,
 * "Design System Invariants").
 *
 * What is deliberately NOT here, because something else already owns it:
 *  - hardcoded rgba()/hex/hsl colors: `apps:no-color-literals` in scripts/validate-invariants.mjs
 *    (run by `pnpm build`) is stricter than any check written here;
 *  - Unicode math glyphs: scripts/validate-math-formatting.mjs;
 *  - behavior and element counts (tabs, popovers, readouts, arcs, shell sections):
 *    apps/site/tests/eclipse-geometry.spec.ts drives the real page.
 */

const read = (name: string) => fs.readFileSync(path.resolve(__dirname, name), "utf-8");
const html = read("index.html");
const css = read("style.css");
const mainTs = read("main.ts");

describe("Eclipse Geometry -- Design System Contracts", () => {
  describe("Instrument layer and starfield", () => {
    it("the demo root is an instrument-layer page with a starfield canvas that main.ts initialises", () => {
      expect(html).toContain("cp-layer-instrument");
      expect(html).toMatch(/<canvas[^>]*class="cp-starfield"/);
      expect(mainTs).toMatch(/initStarfield\s*\(/);
    });
  });

  describe("Celestial and token invariants", () => {
    it("earthGlow gradient uses --cp-celestial-earth, not --cp-chart-1", () => {
      const earthGlow = html.match(/<radialGradient id="earthGlow"[\s\S]*?<\/radialGradient>/);
      expect(earthGlow).not.toBeNull();
      expect(earthGlow![0]).toContain("--cp-celestial-earth");
      expect(earthGlow![0]).not.toContain("--cp-chart-1");
    });

    it("moonGlow gradient uses --cp-celestial-moon, not --cp-text", () => {
      const moonGlow = html.match(/<radialGradient id="moonGlow"[\s\S]*?<\/radialGradient>/);
      expect(moonGlow).not.toBeNull();
      expect(moonGlow![0]).toContain("--cp-celestial-moon");
      expect(moonGlow![0]).not.toContain("--cp-text");
    });

    it("no legacy token aliases appear in the HTML or the CSS", () => {
      for (const token of ["--cp-warning", "--cp-accent2", "--cp-accent3"]) {
        expect(html, `${token} in index.html`).not.toContain(token);
        expect(css, `${token} in style.css`).not.toContain(token);
      }
      const defs = (html.match(/<defs>[\s\S]*?<\/defs>/g) || []).join("\n");
      expect(defs).not.toContain("--cp-chart-1");
    });

    it("eclipse arcs and threshold bands take their colors from the accent tokens", () => {
      expect(css).toMatch(/\.stage__arc--solar[\s\S]*?--cp-accent-rose/);
      expect(css).toMatch(/\.stage__arc--lunar[\s\S]*?--cp-accent\b/);
      expect(css).toMatch(/\.stage__band--solar[\s\S]*?--cp-accent-rose/);
      expect(css).toMatch(/\.stage__band--lunar[\s\S]*?--cp-accent\b/);
    });

    it("demo shell sections have entry animations", () => {
      expect(css).toMatch(/\.cp-demo__sidebar[\s\S]*?animation.*cp-slide-up/);
      expect(css).toMatch(/\.cp-demo__stage[\s\S]*?animation.*cp-fade-in/);
    });
  });

  describe("Readout typography", () => {
    it("dimensional readouts put their units in .cp-readout__unit spans", () => {
      // phase angle, |beta| and nearest node are the three dimensional readouts
      const unitSpans = html.match(/class="cp-readout__unit"/g) || [];
      expect(unitSpans.length).toBeGreaterThanOrEqual(3);
    });

    it("readout labels do not carry parenthesised units", () => {
      const labels = html.match(/class="cp-readout__label"[^>]*>([^<]*)</g) || [];
      expect(labels.filter((l) => /\((?:deg|km|yr)\)/.test(l))).toEqual([]);
    });

    it("the solar and lunar readouts each have a dot indicator", () => {
      for (const id of ["solarReadout", "lunarReadout"]) {
        const readout = html.match(new RegExp(`id="${id}"[\\s\\S]*?</div>`));
        expect(readout, `#${id}`).not.toBeNull();
        expect(readout![0], `#${id}`).toContain("cp-readout__dot");
      }
    });

    it("keeps explanatory callouts out of the readout strip and the sidebar", () => {
      const strip = html.match(/cp-readout-strip[\s\S]*?<\/div>\s*\n\s*\n/);
      expect(strip).not.toBeNull();
      expect(strip![0]).not.toContain("cp-callout");

      const sidebar = html.match(/class="cp-demo__sidebar[\s\S]*?<\/aside>/);
      expect(sidebar).not.toBeNull();
      expect(sidebar![0]).not.toContain("cp-callout");
    });

    it("the two-conditions claim lives in the shelf's default tab, where the demo explains itself", () => {
      /*
       * This used to also require a `data-kind="model"` callout in the sidebar. That
       * callout was 206px of a 794px sidebar that was hiding 242px, and it said what the
       * shelf's default tab already said: eclipses need the Moon near a node AND New or
       * Full phase. Removing it was de-duplication, not demotion -- the node definition it
       * carried moved into that bullet, which is the one thing the shelf had not said.
       */
      const notice = html.match(/id="tab-notice"[\s\S]*?<\/div>/);
      expect(notice, "expected the What to notice tab panel").not.toBeNull();
      expect(notice![0]).toContain("node");
      expect(notice![0]).toMatch(/New or Full phase/);
    });
  });

  describe("Math in the context message", () => {
    it("typesets the message through setMathText, because contextualMessage returns $...$ source", () => {
      // textContent would show students the literal "$|\beta|$" instead of |beta|.
      expect(mainTs).toMatch(/setMathText\(\s*contextMessage\s*,/);
      expect(mainTs).not.toMatch(/contextMessage\.(?:textContent|innerHTML)\s*=/);
    });

    it("the message element is a polite live region with the context-message class", () => {
      const tag = html.match(/<p[^>]*id="contextMessage"[^>]*>/);
      expect(tag).not.toBeNull();
      expect(tag![0]).toContain('aria-live="polite"');
      expect(tag![0]).toContain("cp-context-message");
    });
  });

  describe("Architecture compliance", () => {
    it("main.ts imports physics from @cosmic/physics, not inline", () => {
      expect(mainTs).toContain('from "@cosmic/physics"');
      // Should not inline eclipse geometry calculations
      expect(mainTs).not.toMatch(/function\s+eclipticLatitude/i);
      expect(mainTs).not.toMatch(/function\s+shadowRadi/i);
    });
  });

  describe("Controls", () => {
    it("every button carries a design-system component class", () => {
      const buttons = html.match(/<button\b[^>]*>/g) || [];
      expect(buttons.length).toBeGreaterThan(0);
      const unstyled = buttons.filter(
        (tag) => !/class="[^"]*\b(?:cp-chip|cp-button|cp-utility-btn|cp-tab|cp-popover-link)\b/.test(tag)
      );
      expect(unstyled, "buttons without a cp-* component class").toEqual([]);
    });

    it("every cp-chip button has an initial aria-pressed attribute", () => {
      const chips = html.match(/<button[^>]*class="[^"]*cp-chip[^"]*"[^>]*>/g) || [];
      expect(chips.length).toBeGreaterThan(0);
      expect(chips.filter((tag) => !tag.includes("aria-pressed")), "cp-chip buttons missing aria-pressed").toEqual([]);
    });

    it("every aria-controls points at an element that exists, and every tab declares one", () => {
      const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
      const targets = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
      expect(targets.length).toBeGreaterThan(0);
      expect(targets.filter((id) => !ids.has(id)), "aria-controls with no matching id").toEqual([]);

      const tabs = html.match(/<button[^>]*role="tab"[^>]*>/g) || [];
      expect(tabs.length).toBeGreaterThan(0);
      expect(tabs.filter((tag) => !tag.includes("aria-controls")), "tabs without aria-controls").toEqual([]);
    });

    it("the utility toolbar is a labelled toolbar whose navigation popover links exhibit, station card and instructor notes", () => {
      expect(html).toMatch(/class="cp-utility-toolbar"[^>]*role="toolbar"/);
      expect(html).toMatch(/aria-label="Demo actions"/);

      const popover = html.match(/id="navPopover"[\s\S]*?<\/nav>/);
      expect(popover).not.toBeNull();
      expect(popover![0]).toContain("exhibits/eclipse-geometry/");
      expect(popover![0]).toContain("stations/eclipse-geometry/");
      expect(popover![0]).toContain("instructor/eclipse-geometry/");
    });
  });
});
