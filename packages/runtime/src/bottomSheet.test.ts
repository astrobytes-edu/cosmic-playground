import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initBottomSheet } from "./bottomSheet";

function createBottomSheetHTML(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="cp-bottom-sheet" data-snap="collapsed">
      <div class="cp-bottom-sheet__handle" aria-label="Drag to expand controls" aria-expanded="false">
        <div class="cp-bottom-sheet__grip"></div>
      </div>
      <div class="cp-bottom-sheet__content">
        <div aria-live="polite"></div>
        <p>Controls go here</p>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

describe("CpBottomSheet", () => {
  let root: HTMLElement;
  let cleanup: () => void;
  let sheet: HTMLElement;
  let handle: HTMLElement;

  beforeEach(() => {
    root = createBottomSheetHTML();
    cleanup = initBottomSheet(root);
    sheet = root.querySelector<HTMLElement>(".cp-bottom-sheet")!;
    handle = root.querySelector<HTMLElement>(".cp-bottom-sheet__handle")!;
  });

  afterEach(() => {
    cleanup();
    root.remove();
  });

  it("starts in collapsed state", () => {
    expect(sheet.getAttribute("data-snap")).toBe("collapsed");
  });

  it("handle has aria-expanded=false when collapsed", () => {
    expect(handle.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles to half on tap (small drag)", () => {
    // Simulate a tap: pointerdown + pointerup at same position
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientY: 700,
        bubbles: true,
        pointerId: 1,
      })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", {
        clientY: 700,
        bubbles: true,
        pointerId: 1,
      })
    );

    expect(sheet.getAttribute("data-snap")).toBe("half");
    expect(handle.getAttribute("aria-expanded")).toBe("true");
  });

  it("toggles back to collapsed on second tap from half", () => {
    // First tap: collapsed -> half
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    expect(sheet.getAttribute("data-snap")).toBe("half");

    // Second tap: half -> collapsed
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { clientY: 400, bubbles: true, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", { clientY: 400, bubbles: true, pointerId: 1 })
    );
    expect(sheet.getAttribute("data-snap")).toBe("collapsed");
  });

  it("collapses on Escape key when expanded", () => {
    // Open to half first
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    expect(sheet.getAttribute("data-snap")).toBe("half");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(sheet.getAttribute("data-snap")).toBe("collapsed");
    expect(handle.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not change state on Escape when already collapsed", () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(sheet.getAttribute("data-snap")).toBe("collapsed");
  });

  it("collapses on outside click when expanded", () => {
    // Open to half
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    expect(sheet.getAttribute("data-snap")).toBe("half");

    // Click outside
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(sheet.getAttribute("data-snap")).toBe("collapsed");
  });

  it("does not collapse on click inside sheet", () => {
    // Open to half
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", { clientY: 700, bubbles: true, pointerId: 1 })
    );

    // Click inside sheet content
    const content = root.querySelector<HTMLElement>(".cp-bottom-sheet__content")!;
    content.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(sheet.getAttribute("data-snap")).toBe("half");
  });

  it("announces state change via live region", () => {
    const liveRegion = root.querySelector<HTMLElement>("[aria-live]")!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { clientY: 700, bubbles: true, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", { clientY: 700, bubbles: true, pointerId: 1 })
    );

    expect(liveRegion.textContent).toBe("Controls expanded");
  });

  it("returns noop cleanup when no bottom sheet found", () => {
    const emptyRoot = document.createElement("div");
    const emptyCleanup = initBottomSheet(emptyRoot);
    expect(typeof emptyCleanup).toBe("function");
    emptyCleanup(); // should not throw
  });
});
