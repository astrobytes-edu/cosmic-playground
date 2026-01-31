import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Design tokens", () => {
  const tokensPath = path.resolve(__dirname, "../styles/tokens.css");
  const css = fs.readFileSync(tokensPath, "utf-8");

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
});
