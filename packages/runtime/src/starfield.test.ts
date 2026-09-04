import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initStarfield } from "./starfield";

/**
 * A canvas whose measured size the test controls, with a 2-D context that behaves like the
 * browser's on the one point that matters: `drawImage` from a zero-size source throws.
 */
function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  drawImageCalls: number;
} {
  const canvas = document.createElement("canvas");
  const counters = { drawImageCalls: 0 };

  canvas.getBoundingClientRect = () =>
    ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

  const context = {
    canvas,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn((source: HTMLCanvasElement) => {
      counters.drawImageCalls += 1;
      if (source && (source.width === 0 || source.height === 0)) {
        // Matches the browser: InvalidStateError, "source is a canvas element with a
        // width or height of 0".
        throw new DOMException("source canvas has zero size", "InvalidStateError");
      }
    }),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    filter: "none"
  };

  // Every canvas created during the run, including the offscreen static layer. The
  // double cast is needed because getContext is an overload set and this stub answers
  // only the "2d" arm, which is the only one the starfield asks for.
  HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement) {
    return { ...context, canvas: this } as unknown as CanvasRenderingContext2D;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;

  return { canvas, get drawImageCalls() { return counters.drawImageCalls; } };
}

beforeEach(() => {
  // jsdom implements neither, and the starfield reasonably expects both in a browser.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("initStarfield", () => {
  it("does not throw when the canvas has no measured size", () => {
    // A background tab, a hidden pane, a print layout, or an iframe the parent has not
    // laid out yet all report 0x0. This used to build a zero-size offscreen layer and then
    // throw InvalidStateError out of drawImage, as an uncaught error on every demo.
    const { canvas } = makeCanvas(0, 0);
    expect(() => initStarfield({ canvas, starCount: 10 })).not.toThrow();
  });

  it("skips painting entirely while the canvas has no size", () => {
    const probe = makeCanvas(0, 0);
    initStarfield({ canvas: probe.canvas, starCount: 10 });
    expect(probe.drawImageCalls).toBe(0);
  });

  it("paints once the canvas has a size", () => {
    const probe = makeCanvas(400, 300);
    initStarfield({ canvas: probe.canvas, starCount: 10, shootingStars: false });
    expect(probe.drawImageCalls).toBeGreaterThan(0);
  });

  it("returns a cleanup function in both cases", () => {
    expect(typeof initStarfield({ canvas: makeCanvas(0, 0).canvas, starCount: 5 })).toBe("function");
    expect(typeof initStarfield({ canvas: makeCanvas(200, 200).canvas, starCount: 5 })).toBe("function");
  });
});
