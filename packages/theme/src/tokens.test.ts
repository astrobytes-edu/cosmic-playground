import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Design tokens", () => {
  const tokensPath = path.resolve(__dirname, "../styles/tokens.css");
  const css = fs.readFileSync(tokensPath, "utf-8");

  const animPath = path.resolve(__dirname, "../styles/animations.css");
  const animCss = fs.existsSync(animPath) ? fs.readFileSync(animPath, "utf-8") : "";

  describe("Typography scale", () => {
    it("defines all text size tokens", () => {
      const requiredTokens = [
        "--cp-text-sm",
        "--cp-text-md",
        "--cp-text-lg",
        "--cp-text-xl",
        "--cp-text-2xl",
        "--cp-text-3xl",
        "--cp-text-4xl",
        "--cp-text-hero",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });

    it("uses rem units for text sizes", () => {
      const textSizePattern = /--cp-text-\w+:\s*[\d.]+rem/g;
      const matches = css.match(textSizePattern);
      expect(matches?.length).toBeGreaterThanOrEqual(8);
    });

    it("defines line-height tokens", () => {
      expect(css).toContain("--cp-leading-tight");
      expect(css).toContain("--cp-leading-normal");
      expect(css).toContain("--cp-leading-relaxed");
    });

    it("defines font-weight tokens", () => {
      expect(css).toContain("--cp-font-normal");
      expect(css).toContain("--cp-font-medium");
      expect(css).toContain("--cp-font-semibold");
      expect(css).toContain("--cp-font-bold");
    });
  });

  describe("Transition tokens", () => {
    it("defines transition duration tokens", () => {
      expect(css).toContain("--cp-transition-fast");
      expect(css).toContain("--cp-transition-normal");
      expect(css).toContain("--cp-transition-slow");
    });

    it("defines easing tokens", () => {
      expect(css).toContain("--cp-ease-out");
      expect(css).toContain("--cp-ease-in-out");
    });
  });

  describe("Elevation tokens", () => {
    it("defines elevation shadow levels", () => {
      expect(css).toContain("--cp-elevation-1");
      expect(css).toContain("--cp-elevation-2");
      expect(css).toContain("--cp-elevation-3");
    });

    it("defines hover glow for cards", () => {
      expect(css).toContain("--cp-card-glow");
    });
  });

  describe("Z-index scale", () => {
    it("defines z-index tokens", () => {
      const requiredTokens = [
        "--cp-z-dropdown",
        "--cp-z-sticky",
        "--cp-z-modal",
        "--cp-z-tooltip",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });
  });

  describe("Breakpoint tokens", () => {
    it("defines breakpoint tokens", () => {
      expect(css).toContain("--cp-bp-sm");
      expect(css).toContain("--cp-bp-md");
      expect(css).toContain("--cp-bp-lg");
      expect(css).toContain("--cp-bp-xl");
    });
  });

  describe("Spacing completeness", () => {
    it("defines small spacing values", () => {
      expect(css).toContain("--cp-space-0");  // 2px
      expect(css).toMatch(/--cp-space-1:\s*4px/);
    });
  });

  describe("Form tokens", () => {
    it("defines input background token", () => {
      expect(css).toContain("--cp-input-bg");
    });

    it("defines input border token", () => {
      expect(css).toContain("--cp-input-border");
    });

    it("defines input focus token", () => {
      expect(css).toContain("--cp-input-focus");
    });
  });

  describe("Data visualization tokens", () => {
    it("defines chart color palette", () => {
      const chartColors = [
        "--cp-chart-1",
        "--cp-chart-2",
        "--cp-chart-3",
        "--cp-chart-4",
        "--cp-chart-5",
      ];
      for (const token of chartColors) {
        expect(css).toContain(token);
      }
    });

    it("defines semantic data colors", () => {
      expect(css).toContain("--cp-data-positive");
      expect(css).toContain("--cp-data-negative");
      expect(css).toContain("--cp-data-neutral");
    });
  });

  describe("Motion system", () => {
    it("defines spring easing", () => {
      expect(css).toContain("--cp-ease-spring");
    });

    it("defines stagger delay", () => {
      expect(css).toContain("--cp-stagger");
    });

    it("defines entrance/exit durations", () => {
      expect(css).toContain("--cp-duration-enter");
      expect(css).toContain("--cp-duration-exit");
    });
  });

  describe("Glow system", () => {
    it("defines celestial glow tokens at 30-50% opacity", () => {
      const requiredTokens = [
        "--cp-glow-sun",
        "--cp-glow-moon",
        "--cp-glow-planet",
        "--cp-glow-star",
        "--cp-glow-accent-teal",
        "--cp-glow-accent-rose",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });

    it("glow tokens use 30-50% opacity range", () => {
      const glowPattern = /--cp-glow-(?:sun|moon|planet|star|accent-teal|accent-rose|accent-violet):.*?rgba\([^)]*,\s*([\d.]+)\)/g;
      let match;
      const opacities: number[] = [];
      while ((match = glowPattern.exec(css)) !== null) {
        opacities.push(parseFloat(match[1]));
      }
      expect(opacities.length).toBeGreaterThanOrEqual(4);
      for (const opacity of opacities) {
        expect(opacity).toBeGreaterThanOrEqual(0.3);
        expect(opacity).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe("Celestial object palette", () => {
    it("defines tokens for astronomical objects", () => {
      const requiredTokens = [
        "--cp-celestial-sun",
        "--cp-celestial-moon",
        "--cp-celestial-earth",
        "--cp-celestial-mars",
        "--cp-celestial-star",
        "--cp-celestial-orbit",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });
  });

  describe("Instrument accent colors", () => {
    it("defines instrument-specific accent tokens", () => {
      const requiredTokens = [
        "--cp-accent-amber",
        "--cp-accent-green",
        "--cp-accent-ice",
        "--cp-accent-rose",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });
  });

  describe("Readout typography", () => {
    it("defines readout label/value/unit tokens", () => {
      const requiredTokens = [
        "--cp-readout-label-size",
        "--cp-readout-label-weight",
        "--cp-readout-label-tracking",
        "--cp-readout-label-color",
        "--cp-readout-value-size",
        "--cp-readout-value-weight",
        "--cp-readout-value-color",
        "--cp-readout-value-font",
        "--cp-readout-unit-size",
        "--cp-readout-unit-color",
      ];
      for (const token of requiredTokens) {
        expect(css).toContain(token);
      }
    });

    it("readout values use amber color", () => {
      expect(css).toMatch(/--cp-readout-value-color:.*amber/);
    });
  });

  describe("Animation keyframes", () => {
    it("defines required keyframe animations", () => {
      const requiredKeyframes = [
        "@keyframes cp-pulse",
        "@keyframes cp-glow-pulse",
        "@keyframes cp-value-flash",
        "@keyframes cp-slide-up",
        "@keyframes cp-pop-in",
        "@keyframes cp-fade-in",
      ];
      for (const kf of requiredKeyframes) {
        expect(animCss).toContain(kf);
      }
    });

    it("includes reduced-motion override", () => {
      expect(animCss).toContain("prefers-reduced-motion");
    });
  });
});

describe("Chip component", () => {
  const chipPath = path.resolve(__dirname, "../styles/components/chip.css");
  const chipCss = fs.readFileSync(chipPath, "utf-8");

  it("defines .cp-chip base class", () => {
    expect(chipCss).toContain(".cp-chip {");
  });

  it("uses pill border-radius", () => {
    expect(chipCss).toMatch(/\.cp-chip\s*\{[^}]*border-radius:\s*9999px/s);
  });

  it("defines active state for both class and ARIA", () => {
    expect(chipCss).toContain(".cp-chip.is-active");
    expect(chipCss).toContain('.cp-chip[aria-pressed="true"]');
  });

  it("defines .cp-chip-group flex container", () => {
    expect(chipCss).toContain(".cp-chip-group {");
    expect(chipCss).toContain("flex-wrap: wrap");
  });

  it("defines .cp-chip-group--grid variant", () => {
    expect(chipCss).toContain(".cp-chip-group--grid {");
    expect(chipCss).toContain("grid-template-columns");
  });

  it("defines disabled state", () => {
    expect(chipCss).toContain(".cp-chip:disabled");
  });
});

describe("Toggle component", () => {
  const togglePath = path.resolve(__dirname, "../styles/components/toggle.css");
  const toggleCss = fs.readFileSync(togglePath, "utf-8");

  it("defines .cp-toggle base class", () => {
    expect(toggleCss).toContain(".cp-toggle {");
  });

  it("hides native checkbox appearance", () => {
    expect(toggleCss).toContain("appearance: none");
  });

  it("defines checked state with accent color", () => {
    expect(toggleCss).toContain(":checked");
    expect(toggleCss).toContain("--cp-accent");
  });

  it("defines thumb pseudo-element", () => {
    expect(toggleCss).toContain("::after");
    expect(toggleCss).toContain("border-radius: 50%");
  });

  it("defines focus-visible outline", () => {
    expect(toggleCss).toContain(":focus-visible");
    expect(toggleCss).toContain("--cp-accent-amber");
  });
});
