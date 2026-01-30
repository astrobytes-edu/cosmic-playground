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
});
