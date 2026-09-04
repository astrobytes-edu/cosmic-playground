// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { requiredContext2d, requiredSelector } from "./dom";

describe("requiredSelector", () => {
  it("returns the matching element", () => {
    const root = document.createElement("div");
    root.innerHTML = `<span id="target">hi</span>`;
    expect(requiredSelector<HTMLSpanElement>("#target", root).textContent).toBe("hi");
  });

  it("throws a named error when the element is missing", () => {
    const root = document.createElement("div");
    expect(() => requiredSelector("#absent", root)).toThrowError(
      /Missing required DOM element: #absent/
    );
  });
});

describe("requiredContext2d", () => {
  it("returns the context when the canvas provides one", () => {
    // jsdom ships no 2D rasteriser, so stub the context. What is under test is the
    // narrowing contract (the return type carries no `| null`), not jsdom's canvas.
    const stub = { fillRect: () => {} } as unknown as CanvasRenderingContext2D;
    const canvas = document.createElement("canvas");
    canvas.getContext = (() => stub) as unknown as HTMLCanvasElement["getContext"];

    const ctx = requiredContext2d(canvas);
    expect(ctx).toBe(stub);
    expect(typeof ctx.fillRect).toBe("function");
  });

  it("throws a diagnosable error when the context is unavailable", () => {
    // Simulates a browser that refuses the context (too many live contexts, or a
    // canvas already bound to a different context type). Previously each demo
    // handled this differently; several silently rendered nothing.
    const canvas = document.createElement("canvas");
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
    expect(() => requiredContext2d(canvas, "HR inference lab")).toThrowError(
      /Canvas 2D context unavailable \(HR inference lab\)/
    );
  });

  it("names the canvas id in the error when no label is supplied", () => {
    const canvas = document.createElement("canvas");
    canvas.id = "hrCanvas";
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
    expect(() => requiredContext2d(canvas)).toThrowError(/#hrCanvas/);
  });
});
