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
  const sceneTs = fs.readFileSync(path.resolve(__dirname, "clusterScene.ts"), "utf-8");

  describe("Cluster renderer (WebGL)", () => {
    it("draws the stars additively", () => {
      // Additive blending is the whole reason the panel reads as light rather than as
      // dots: overlapping stars sum instead of the last one painting over the rest.
      expect(sceneTs).toContain("AdditiveBlending");
      expect(sceneTs).toContain("blending: AdditiveBlending");
    });

    it("gives every star a soft core and halo, not a flat disc", () => {
      expect(sceneTs).toContain("gl_PointCoord");
      expect(sceneTs).toMatch(/float core =/);
      expect(sceneTs).toMatch(/float halo =/);
    });

    it("normalises the depth cue to the cluster centre", () => {
      // three's stock attenuation constant assumes a scene measured in units of about
      // one. This scene is measured in tens of parsecs, where it magnifies ~19x.
      expect(sceneTs).toContain("uReferenceDepth");
      expect(sceneTs).toContain("perspective.position.distanceTo(controls.target)");
    });

    it("turns perspective off in the 2-D view rather than faking it", () => {
      // Under an orthographic camera "nearer looks bigger" is not a depth cue, it is a
      // lie about the projection.
      expect(sceneTs).toContain("OrthographicCamera");
      expect(sceneTs).toMatch(/uAttenuate\.value = mode === "3D" \? 1 : 0/);
      expect(sceneTs).toContain("controls.enableRotate = mode === \"3D\"");
    });

    it("offers orbit, zoom and pan", () => {
      expect(sceneTs).toContain("OrbitControls");
      expect(sceneTs).toContain("screenSpacePanning = true");
      expect(html).toContain('id="view2d"');
      expect(html).toContain('id="view3d"');
      expect(html).toContain('id="resetView"');
    });

    it("keeps a separate 2-D overlay for the scale bar and rings", () => {
      // WebGL has no text, and a second material to draw one ring would cost more than
      // a 2-D circle.
      expect(html).toContain('id="clusterOverlay"');
      expect(mainTs).toContain("clusterOverlayCtx");
      // Asking #clusterCanvas for a 2-D context permanently forecloses WebGL on it.
      expect(mainTs).not.toMatch(/requiredContext2d\(\s*clusterCanvas/);
    });

    it("only redraws when something moved", () => {
      // A render loop that paints unconditionally keeps the GPU busy behind a static
      // page, which on a laptop is a battery bug rather than a rendering one.
      expect(sceneTs).toContain("needsRender");
      expect(sceneTs).toMatch(/if \(needsRender \|\| moving\)/);
    });

    it("releases its GPU resources", () => {
      expect(sceneTs).toContain("cancelAnimationFrame");
      expect(sceneTs).toContain("renderer.dispose()");
      expect(sceneTs).toContain("controls.dispose()");
    });

    it("resets the zoom of both cameras, not just their positions", () => {
      // OrbitControls zooms a perspective camera by moving it and an orthographic one
      // through camera.zoom, so repositioning alone left the 2-D view zoomed.
      expect(sceneTs).toContain("perspective.zoom = 1");
      expect(sceneTs).toContain("orthographic.zoom = 1");
    });

    it("survives a browser with no WebGL", () => {
      // The scene is constructed at module scope, so throwing here would take the
      // readouts, the HR diagram and the histogram down with it.
      expect(sceneTs).toContain("): ClusterScene | null {");
      expect(sceneTs).toMatch(/} catch \{\s*return null;/);
      expect(mainTs).toContain("if (!clusterScene) {");
      expect(mainTs).toContain("census-stage--unavailable");
      expect(css).toContain(".census-stage--unavailable");
    });

    it("keeps the scene free of physics", () => {
      expect(sceneTs).not.toContain("@cosmic/physics");
      expect(sceneTs).not.toMatch(/massMsun|luminosityLsun|temperatureK/);
    });
  });

  describe("Layout", () => {
    it("keeps the readouts with the plots, not at the bottom of the sidebar", () => {
      // Measured at 1440x900 before this moved: the sidebar held 1,421px of content in an
      // 870px column, putting the heaviest star at y = 931 and the tally at y = 1,351.
      // Both below the fold, on a demo whose reseed hint says "watch the heaviest star".
      const sidebar = html.slice(
        html.indexOf('class="cp-demo__controls'),
        html.indexOf('class="cp-demo__stage')
      );
      expect(sidebar).not.toContain('id="mostMassive"');
      expect(sidebar).not.toContain("census-tally");
      expect(html).toContain("cp-readout-strip census-strip");
    });

    it("bounds the plots and their numbers with one height", () => {
      // The shell's `readouts` area is a sibling ROW of `viz`, so it cannot be
      // height-coupled to the stage; the strip therefore lives inside the stage grid.
      const explore = html.slice(
        html.indexOf('id="panel-explore"'),
        html.indexOf('id="panel-understand"')
      );
      expect(explore).toContain("census-strip");
      expect(css).toContain("max-height: calc(100svh");
    });

    it("takes its control layout from the shared component, not a local copy", () => {
      // That layout moved into packages/theme/styles/components/control.css once the
      // same `display: grid; gap: 8px` was found copy-pasted into fifteen demos. The
      // rules themselves are guarded by the theme's own tests; what matters here is that
      // this demo no longer carries a private copy to drift out of step.
      expect(css).not.toMatch(/\.control \{[^}]*grid-template-columns/);
      expect(css).not.toMatch(/\.control \{[^}]*display: grid/);
    });

    it("floors the drawing surfaces rather than the grid rows", () => {
      // A row floor also has to cover the panel title, so a 112px row left the histogram
      // 88px of canvas -- not enough for four decade labels and a mass axis.
      expect(css).toMatch(/#imfCanvas \{[^}]*min-height/);
      expect(css).toMatch(/#hrCanvas \{[^}]*min-height/);
    });

    it("drops the turnoff's unit when there is no turnoff", () => {
      expect(html).toContain('id="turnoffUnit"');
      expect(mainTs).toContain("turnoffUnit.hidden");
    });
  });

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
      // Count deliberately not pinned: the claim is that every slider is labelled, and a
      // hardcoded number only ever fails for the wrong reason when a control is added.
      expect(sliders.length).toBeGreaterThan(0);
      for (const slider of sliders) expect(slider).toMatch(/aria-label=/);
    });

    it("sets aria-valuetext on every slider whose raw value is not its meaning", () => {
      // Each of these carries a normalized or log-proxy value, so the raw number is
      // meaningless read aloud: 1000 is not an age, -200 is not a metallicity.
      for (const id of ["countSlider", "slopeSlider", "ageSlider", "fehSlider", "meclSlider"]) {
        // Allows the call to be wrapped across lines by the formatter.
        expect(mainTs, id).toMatch(
          new RegExp(`${id}\\.setAttribute\\(\\s*"aria-valuetext"`)
        );
      }
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
      expect(html).toContain("schematic");
      expect(html).toContain("extrapolated");
      expect(html).toContain("not a stellar radius");
    });

    it("says the giant branch is schematic rather than computed", () => {
      // The track has real Hurley timescales and a textbook shape. Claiming more than
      // that is the failure mode worth guarding.
      expect(html).toContain("Hurley");
      expect(html).toMatch(/giant branch is schematic|track is schematic/i);
    });

    it("explains why the draw starts at the ZAMS floor and not the burning limit", () => {
      expect(html).toContain("0.08");
      expect(html).toContain("hydrogen-burning limit");
      expect(mainTs).toContain("CENSUS_MIN_MASS_MSUN");
    });

    it("reports giants and extrapolated stars as their own counts", () => {
      expect(html).toContain('id="giantCount"');
      expect(html).toContain('id="extrapolatedCount"');
      expect(mainTs).toContain("cluster.postMainSequenceCount");
      expect(mainTs).toContain("cluster.extrapolatedCount");
    });

    it("puts the axis titles in HTML KaTeX, not in canvas text", () => {
      // Canvas cannot typeset, so an axis title drawn there can only ever be an ASCII or
      // Unicode approximation -- and is invisible to a screen reader. Only the tick
      // labels, which have to track the pixels, stay on the canvas.
      expect(html).toContain("census-plot__ytitle");
      expect(html).toContain("census-plot__xtitle");
      expect(html).toContain("$L/L_\\odot$");
      expect(mainTs).not.toContain('fillText("stars per bin"');
      expect(mainTs).not.toContain("luminosity [");
    });

    it("uses real superscripts on the canvas tick labels", () => {
      // Written as escapes so validate-math-formatting still sees pure-ASCII source.
      expect(logicTs).toContain("\\u2076");
      expect(logicTs).toContain("\\u2609");
      expect(mainTs).toContain("powerOfTenLabel");
      expect(mainTs).not.toContain("`10^${");
    });

    it("sizes canvas text from the panel rather than pinning it to 11px", () => {
      expect(logicTs).toContain("axisFontPx");
      expect(mainTs).toContain("axisFontPx(width)");
      expect(mainTs).not.toContain('const AXIS_FONT = "11px');
    });
  });

  describe("Star inspector", () => {
    it("links the two panels through one selection", () => {
      // The cluster panel and the HR diagram show the same stars in different spaces.
      // Pointing at a star in one has to light it up in the other, or they are just two
      // plots that happen to share a page.
      expect(mainTs).toContain("bindPicking(clusterCanvas, () => clusterScene?.projectAll() ?? [])");
      expect(mainTs).toContain("bindPicking(hrCanvas, () => hrPicks)");
      expect(mainTs).toContain("function highlightedId");
    });

    it("has a card with the per-star quantities, typeset as maths", () => {
      expect(html).toContain('id="starCard"');
      expect(html).toContain('data-star="mass"');
      expect(html).toContain('data-star="teff"');
      expect(html).toContain('data-star="logl"');
      expect(html).toContain('data-star="radius"');
      expect(html).toContain('data-star="phase"');
      expect(html).toContain("$T_\\mathrm{eff}$");
    });

    it("keeps the card's footprint when nothing is selected", () => {
      // Collapsing it made the whole stage jump whenever the pointer crossed a gap.
      expect(html).toContain('data-empty="true"');
      expect(css).toContain("min-height");
      expect(html).not.toContain('id="starCard" hidden');
    });

    it("announces the selected star to assistive technology", () => {
      expect(html).toMatch(/id="starCard"[^>]*aria-live="polite"/);
    });

    it("reaches the same selection from the keyboard", () => {
      // Hover-only inspection would put the per-star detail out of reach entirely for
      // anyone navigating by keyboard.
      expect(mainTs).toContain("bindKeyboardSelection");
      expect(mainTs).toContain('event.key === "ArrowRight"');
      expect(mainTs).toContain('event.key === "Escape"');
      expect(html).toMatch(/id="clusterCanvas"[\s\S]{0,200}tabindex="0"/);
      expect(html).toMatch(/id="hrCanvas"[\s\S]{0,200}tabindex="0"/);
    });

    it("drops a stale selection when the cluster is resampled", () => {
      // Ids are indices into a freshly drawn array, so a surviving pin would silently
      // point the card at a different star.
      expect(mainTs).toMatch(/resample\(\);[\s\S]{0,400}pinnedId = null/);
    });
  });

  describe("Derived slope", () => {
    it("can compute the slope from the environment instead of a bare slider", () => {
      // highMassSlopeFromEnvironment (Jerabkova+2018) was ported and then left with no
      // caller. The slope being a consequence rather than a dial is the point of it.
      expect(mainTs).toContain("highMassSlopeFromEnvironment");
      expect(html).toContain('id="deriveToggle"');
      expect(html).toContain('id="fehSlider"');
      expect(html).toContain('id="meclSlider"');
    });

    it("keeps the derived panel collapsed until asked for", () => {
      expect(html).toMatch(/id="derivePanel"[^>]*hidden/);
      expect(mainTs).toContain("derivePanel.hidden = !state.deriveSlope");
    });

    it("makes the slope slider a readout, not an input, while deriving", () => {
      // Snapping back, not merely ignoring: pointer-events: none stops a drag but not
      // the arrow keys on a focused range input.
      expect(mainTs).toMatch(
        /if \(state\.deriveSlope\) \{[\s\S]{0,600}slopeSlider\.value = String/
      );
      expect(mainTs).toContain('slopeSlider.setAttribute("aria-readonly"');
      // Read-only rather than disabled: a disabled range stops announcing its value, and
      // watching the slope move is exactly what the control is for.
      expect(mainTs).not.toContain("slopeSlider.disabled = true");
      expect(css).toContain(".control--derived");
    });

    it("names the source and says which way the environment pushes", () => {
      expect(html).toContain("Jerabkova");
      expect(html).toContain("metal-poor");
      expect(logicTs).toContain("slopeVerdict");
    });

    it("marks the toggle as a pressed-state control", () => {
      expect(html).toMatch(/id="deriveToggle"[\s\S]{0,200}aria-pressed="false"/);
      expect(mainTs).toContain('deriveToggle.setAttribute("aria-pressed"');
    });
  });
});
